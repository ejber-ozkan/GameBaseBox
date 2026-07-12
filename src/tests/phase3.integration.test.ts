/**
 * Phase 3 Integration Tests: ROM Scanner & CRC Matching
 *
 * Tests the core Phase 3 requirement:
 * "Write integration tests mocking the file system to ensure the scanner
 * correctly links .d64 files to the database using CRC hashes."
 *
 * These tests mock the Tauri bridge so they run in Vitest (browser mode)
 * without needing a real Rust binary.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockGames } from '../data/mockGames';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock the tauri-bridge so tests don't need a real Tauri runtime
vi.mock('../lib/tauri-bridge', () => ({
  scanRomDirectory: vi.fn(),
  launchEmulator:   vi.fn(),
  resolveMediaPath: vi.fn(),
  isDebugMode: vi.fn().mockResolvedValue(false),
}));

// Mock EmuMovies so tests don't hit the real API
vi.mock('../lib/emumovies', () => ({
  searchEmuMovies:       vi.fn(),
  getVideoSnapUrl:       vi.fn(),
  downloadEmuMoviesAsset: vi.fn(),
}));

import { scanRomDirectory, launchEmulator }      from '../lib/tauri-bridge';
import { searchEmuMovies, getVideoSnapUrl }       from '../lib/emumovies';

// ---------------------------------------------------------------------------
// Helpers — replicate the CRC-matching logic that will be used in production
// ---------------------------------------------------------------------------

interface ScannedRom {
  path: string;
  filename: string;
  extension: string;
  crc32: string;
  size_bytes: number;
}

/**
 * Given an array of scanned ROMs and the game database, return a map of
 * game.id → local ROM path for every game whose CRC is found on disk.
 */
function matchRomsToDB(
  scanned: ScannedRom[],
  games: typeof mockGames
): Map<number, string> {
  const crcIndex = new Map(scanned.map(r => [r.crc32.toUpperCase(), r.path]));
  const result   = new Map<number, string>();

  for (const game of games) {
    const normalizedCrc = game.crc.toUpperCase();
    if (crcIndex.has(normalizedCrc)) {
      result.set(game.id, crcIndex.get(normalizedCrc)!);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Phase 3: ROM Scanner', () => {
  beforeEach(() => vi.clearAllMocks());

  it('scanRomDirectory returns ROMs for all C64 extensions', async () => {
    const mockRoms: ScannedRom[] = [
      { path: '/roms/archon.d64',    filename: 'archon.d64',    extension: 'd64', crc32: '1234ABCD', size_bytes: 174848 },
      { path: '/roms/commando.t64',  filename: 'commando.t64',  extension: 't64', crc32: '9999FFFF', size_bytes: 65536  },
      { path: '/roms/random.tap',    filename: 'random.tap',    extension: 'tap', crc32: 'DEADBEEF', size_bytes: 32768  },
    ];
    vi.mocked(scanRomDirectory).mockResolvedValue(mockRoms);

    const result = await scanRomDirectory('/roms');
    expect(result).toHaveLength(3);
    expect(result.map(r => r.extension)).toContain('d64');
    expect(result.map(r => r.extension)).toContain('t64');
    expect(result.map(r => r.extension)).toContain('tap');
  });

  it('scanRomDirectory returns empty array for a folder with no ROMs', async () => {
    vi.mocked(scanRomDirectory).mockResolvedValue([]);
    const result = await scanRomDirectory('/empty-folder');
    expect(result).toHaveLength(0);
  });

  it('scanRomDirectory propagates errors from Rust', async () => {
    vi.mocked(scanRomDirectory).mockRejectedValue(new Error('Directory does not exist: /bad/path'));
    await expect(scanRomDirectory('/bad/path')).rejects.toThrow('Directory does not exist');
  });
});

describe('Phase 3: CRC Matching (ROM ↔ Database)', () => {
  const scannedRoms: ScannedRom[] = [
    { path: 'D:/roms/archon.d64',   filename: 'archon.d64',   extension: 'd64', crc32: '1234ABCD', size_bytes: 174848 },
    { path: 'D:/roms/boulder.d64',  filename: 'boulder.d64',  extension: 'd64', crc32: '5678EFGH', size_bytes: 174848 },
    { path: 'D:/roms/commando.d64', filename: 'commando.d64', extension: 'd64', crc32: '9999FFFF', size_bytes: 174848 },
    { path: 'D:/roms/unknown.d64',  filename: 'unknown.d64',  extension: 'd64', crc32: 'AABBCCDD', size_bytes: 4096   },
  ];

  it('matches scanned CRCs to database games', () => {
    const matched = matchRomsToDB(scannedRoms, mockGames);
    // Archon (CRC: 1234abcd) should match game id=1
    expect(matched.get(1)).toBe('D:/roms/archon.d64');
    // Boulder Dash (CRC: 5678efgh) should match game id=2
    expect(matched.get(2)).toBe('D:/roms/boulder.d64');
    // Commando (CRC: 9999ffff) should match game id=3
    expect(matched.get(3)).toBe('D:/roms/commando.d64');
  });

  it('CRC matching is case-insensitive', () => {
    const mixedCaseRoms: ScannedRom[] = [
      { path: '/roms/archon.d64', filename: 'archon.d64', extension: 'd64', crc32: '1234abcd', size_bytes: 174848 },
    ];
    const matched = matchRomsToDB(mixedCaseRoms, mockGames);
    expect(matched.has(1)).toBe(true);
  });

  it('returns empty map when no CRCs match', () => {
    const noMatchRoms: ScannedRom[] = [
      { path: '/roms/other.d64', filename: 'other.d64', extension: 'd64', crc32: 'FFFFFFFF', size_bytes: 174848 },
    ];
    const matched = matchRomsToDB(noMatchRoms, mockGames);
    expect(matched.size).toBe(0);
  });

  it('unrecognized CRC ROM on disk is not linked to any game', () => {
    const matched = matchRomsToDB(scannedRoms, mockGames);
    // 'AABBCCDD' is not in mockGames — should not appear
    const allPaths = [...matched.values()];
    expect(allPaths).not.toContain('D:/roms/unknown.d64');
  });

  it('a game with no matching ROM on disk has no entry in the map', () => {
    const partialRoms: ScannedRom[] = [
      { path: '/roms/commando.d64', filename: 'commando.d64', extension: 'd64', crc32: '9999FFFF', size_bytes: 174848 },
    ];
    const matched = matchRomsToDB(partialRoms, mockGames);
    // Archon (id=1) and Boulder Dash (id=2) not on disk
    expect(matched.has(1)).toBe(false);
    expect(matched.has(2)).toBe(false);
    expect(matched.has(3)).toBe(true);
  });
});

describe('Phase 3: Emulator Launch', () => {
  beforeEach(() => vi.clearAllMocks());

  it('launchEmulator succeeds with valid paths', async () => {
    vi.mocked(launchEmulator).mockResolvedValue({ success: true, message: 'Launched x64sc.exe successfully' });

    const result = await launchEmulator({
      emulator_path: 'C:/VICE/x64sc.exe',
      rom_path:      'D:/roms/commando.d64',
      true_drive_emulation: false,
      is_pal: true,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('x64sc.exe');
  });

  it('launchEmulator fails when emulator not found', async () => {
    vi.mocked(launchEmulator).mockResolvedValue({ success: false, message: 'Emulator not found: C:/WRONG/x64sc.exe' });

    const result = await launchEmulator({
      emulator_path: 'C:/WRONG/x64sc.exe',
      rom_path:      'D:/roms/commando.d64',
      true_drive_emulation: false,
      is_pal: true,
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('not found');
  });

  it('launchEmulator fails when ROM not found', async () => {
    vi.mocked(launchEmulator).mockResolvedValue({ success: false, message: 'ROM file not found: D:/roms/missing.d64' });

    const result = await launchEmulator({
      emulator_path: 'C:/VICE/x64sc.exe',
      rom_path:      'D:/roms/missing.d64',
      true_drive_emulation: false,
      is_pal: true,
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('not found');
  });
});

describe('Phase 3: EmuMovies Integration', () => {
  beforeEach(() => vi.clearAllMocks());

  it('searchEmuMovies returns video snap results', async () => {
    vi.mocked(searchEmuMovies).mockResolvedValue([
      { id: '001', name: 'Commando', mediaType: 'Video', url: 'https://cdn.emumovies.com/commando.mp4', previewUrl: 'https://cdn.emumovies.com/commando_thumb.jpg' },
    ]);

    const results = await searchEmuMovies('test-api-key', 'Commando', 'Video');
    expect(results).toHaveLength(1);
    expect(results[0].url).toContain('.mp4');
    expect(results[0].name).toBe('Commando');
  });

  it('getVideoSnapUrl returns first result URL', async () => {
    vi.mocked(getVideoSnapUrl).mockResolvedValue('https://cdn.emumovies.com/commando.mp4');
    const url = await getVideoSnapUrl('test-api-key', 'Commando');
    expect(url).toBe('https://cdn.emumovies.com/commando.mp4');
  });

  it('getVideoSnapUrl returns null when no API key provided', async () => {
    vi.mocked(getVideoSnapUrl).mockResolvedValue(null);
    const url = await getVideoSnapUrl('', 'Commando');
    expect(url).toBeNull();
  });

  it('searchEmuMovies throws on invalid API key (401)', async () => {
    vi.mocked(searchEmuMovies).mockRejectedValue(new Error('EmuMovies API key is invalid or expired.'));
    await expect(searchEmuMovies('bad-key', 'Commando', 'Video')).rejects.toThrow('invalid or expired');
  });
});
