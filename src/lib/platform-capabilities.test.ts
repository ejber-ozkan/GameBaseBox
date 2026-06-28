import { describe, expect, test } from 'vitest';
import {
  ATARI800_REFERENCE_MDB_PATH,
  EMBEDDED_EMULATION_PLATFORM_IDS,
  PLATFORM_EMULATOR_PROFILES,
  PLATFORM_PROFILES,
  SUPPORTED_PLATFORMS,
  createDefaultPlatformSettings,
  isPlatformId,
  supportsEmbeddedEmulation,
  hasMusicCapability,
  hasPhotosCapability,
  hasScreenshotsCapability,
  hasExtrasCapability,
  hasVideosCapability,
} from './platform-capabilities';

describe('platform-capabilities', () => {
  test('registers C64, Atari 800, and Atari 2600 profiles', () => {
    expect(SUPPORTED_PLATFORMS.map((platform) => platform.id)).toEqual([
      'c64',
      'atari800',
      'atari2600',
    ]);
  });

  test('defines Atari 800 import, media, launch, and emulator capabilities', () => {
    const atari800 = PLATFORM_PROFILES.atari800;

    expect(atari800.status).toBe('available');
    expect(atari800.importStatus).toBe('notImported');
    expect(atari800.folderTypes).toEqual(['games', 'music', 'photos', 'screenshots', 'extras']);
    expect(atari800.mediaCapabilities.music).toBe('sap');
    expect(atari800.defaultEmulatorProfileId).toBe('retroarch-atari800');
    expect(atari800.supportedEmulatorProfileIds).toContain('altirra-atari800');
    expect(atari800.launchExtensions).toEqual(
      expect.arrayContaining(['.atr', '.cas', '.xex', '.bin', '.m3u', '.zip']),
    );
    expect(PLATFORM_PROFILES.c64.launchExtensions).not.toEqual(expect.arrayContaining(['.cas', '.xex']));
    expect(ATARI800_REFERENCE_MDB_PATH).toContain('Atari 800 v12.mdb');
  });

  test('defines Atari 2600 as an importable RetroArch platform', () => {
    const atari2600 = PLATFORM_PROFILES.atari2600;

    expect(atari2600.status).toBe('available');
    expect(atari2600.importStatus).toBe('notImported');
    expect(atari2600.folderTypes).toEqual(['games', 'screenshots', 'extras']);
    expect(atari2600.mediaCapabilities.music).toBe('none');
    expect(atari2600.defaultEmulatorProfileId).toBe('retroarch-atari2600');
    expect(atari2600.supportedEmulatorProfileIds).toEqual(['retroarch-atari2600']);
    expect(atari2600.launchExtensions).toEqual(expect.arrayContaining(['.a26', '.bin', '.rom', '.zip']));
  });

  test('keeps SID and in-app emulation scoped to C64', () => {
    expect(PLATFORM_PROFILES.c64.mediaCapabilities.music).toBe('sid');
    expect(PLATFORM_PROFILES.c64.inAppEmulation).toBe(true);
    expect(PLATFORM_PROFILES.atari800.inAppEmulation).toBe(false);
    expect(PLATFORM_EMULATOR_PROFILES['altirra-atari800'].platformId).toBe('atari800');
  });

  test('lists platforms with embedded emulator support explicitly', () => {
    expect(EMBEDDED_EMULATION_PLATFORM_IDS).toEqual(['c64']);
    expect(supportsEmbeddedEmulation('c64')).toBe(true);
    expect(supportsEmbeddedEmulation('atari800')).toBe(false);
    expect(supportsEmbeddedEmulation('atari2600')).toBe(false);
  });

  test('creates platform settings from profile defaults', () => {
    const settings = createDefaultPlatformSettings('atari800');

    expect(settings.library.platformId).toBe('atari800');
    expect(settings.library.importStatus).toBe('notImported');
    expect(settings.emulator.preferredEmulatorProfileId).toBe('retroarch-atari800');
    expect(settings.navigation.lastFocusedIndex).toBe(0);
  });

  test('validates known platform identifiers', () => {
    expect(isPlatformId('c64')).toBe(true);
    expect(isPlatformId('atari800')).toBe(true);
    expect(isPlatformId('amiga')).toBe(false);
  });

  test('validates platform capability query helpers', () => {

    expect(hasMusicCapability('c64')).toBe(true);
    expect(hasMusicCapability('atari800')).toBe(true);
    expect(hasMusicCapability('atari2600')).toBe(false);

    expect(hasPhotosCapability('c64')).toBe(true);
    expect(hasPhotosCapability('atari800')).toBe(true);
    expect(hasPhotosCapability('atari2600')).toBe(false);

    expect(hasScreenshotsCapability('c64')).toBe(true);
    expect(hasScreenshotsCapability('atari800')).toBe(true);
    expect(hasScreenshotsCapability('atari2600')).toBe(true);

    expect(hasExtrasCapability('c64')).toBe(true);
    expect(hasExtrasCapability('atari800')).toBe(true);
    expect(hasExtrasCapability('atari2600')).toBe(true);

    expect(hasVideosCapability('c64')).toBe(true);
    expect(hasVideosCapability('atari800')).toBe(false);
    expect(hasVideosCapability('atari2600')).toBe(false);
  });
});
