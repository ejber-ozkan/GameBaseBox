import { describe, expect, test, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { createDefaultPlatformSettingsMap } from '../lib/platform-capabilities';
import { buildImportedPlatformSettings, createPlatformImportJobId, getMissingRequiredFolderKey, usePlatformImport } from './usePlatformImport';
import { importPlatformDatabaseFromMdb } from '../lib/tauri-bridge';

vi.mock('../lib/tauri-bridge', () => ({
  importPlatformDatabaseFromMdb: vi.fn(),
  cancelPlatformImport: vi.fn(),
}));

describe('import validation', () => {
  test('requires confirmation before allowing missing folders', async () => {
    vi.mocked(importPlatformDatabaseFromMdb).mockClear();
    const platformSettings = createDefaultPlatformSettingsMap();
    platformSettings.c64.library.sourceMdbPath = '/fixtures/library.mdb';
    const { result } = renderHook(() => usePlatformImport({
      platformName: 'C64', platformId: 'c64', platformSettings,
      requiredFolderKeys: ['gamesPath'], updateSettings: vi.fn(),
    }));
    await act(async () => { await result.current.importPlatform(); });
    expect(result.current.job).toMatchObject({ status: 'failed', error: 'Select the games folder first.' });
    expect(importPlatformDatabaseFromMdb).not.toHaveBeenCalled();
  });

  test('still requires an MDB after missing-folder confirmation', async () => {
    vi.mocked(importPlatformDatabaseFromMdb).mockClear();
    const platformSettings = createDefaultPlatformSettingsMap();
    const { result } = renderHook(() => usePlatformImport({
      platformName: 'C64', platformId: 'c64', platformSettings,
      requiredFolderKeys: ['gamesPath'], updateSettings: vi.fn(),
    }));
    await act(async () => { await result.current.importPlatform({ allowMissingFolders: true }); });
    expect(result.current.job).toMatchObject({ status: 'failed', error: 'Select the C64 MDB file first.' });
    expect(importPlatformDatabaseFromMdb).not.toHaveBeenCalled();
  });
});

describe('buildImportedPlatformSettings', () => {
  test('marks only the imported platform active and retains platform-scoped folders', () => {
    const platformSettings = createDefaultPlatformSettingsMap();
    platformSettings.atari800.folders.gamesPath = 'E:/Atari/Games';

    const next = buildImportedPlatformSettings(platformSettings, 'atari800', {
      platformId: 'atari800',
      dbPath: 'E:/GBBox/gb64.sqlite',
      exportedTables: 12,
      importedTables: 12,
      gameCount: 7288,
    }, '2026-07-11T12:00:00.000Z');

    expect(next.atari800.library).toMatchObject({
      active: true,
      importStatus: 'imported',
      sqliteScope: 'atari800',
      gameCount: 7288,
    });
    expect(next.atari800.folders.gamesPath).toBe('E:/Atari/Games');
    expect(next.c64.library.active).toBe(false);
  });
});

describe('getMissingRequiredFolderKey', () => {
  test('returns the first required empty folder without checking optional folders', () => {
    const platformSettings = createDefaultPlatformSettingsMap();
    platformSettings.atari800.folders.gamesPath = 'E:/Atari/Games';
    platformSettings.atari800.folders.musicPath = '   ';

    expect(getMissingRequiredFolderKey(
      platformSettings.atari800,
      ['gamesPath', 'musicPath'],
    )).toBe('musicPath');
    expect(getMissingRequiredFolderKey(
      platformSettings.atari800,
      ['gamesPath'],
    )).toBeUndefined();
  });
});

describe('createPlatformImportJobId', () => {
  test('creates a distinct, platform-scoped durable job identifier', () => {
    const first = createPlatformImportJobId('atari800');
    const second = createPlatformImportJobId('atari800');

    expect(first).toMatch(/^platform-import:atari800:/);
    expect(second).not.toBe(first);
  });
});
