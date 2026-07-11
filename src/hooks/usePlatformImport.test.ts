import { describe, expect, test } from 'vitest';
import { createDefaultPlatformSettingsMap } from '../lib/platform-capabilities';
import { buildImportedPlatformSettings, getMissingRequiredFolderKey } from './usePlatformImport';

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
