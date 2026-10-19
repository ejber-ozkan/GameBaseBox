import { describe, expect, it } from 'vitest';
import { buildPlatformAssetPath } from './platform-launch';
import { defaultSettings, type Settings } from '../contexts/SettingsContext';
import { createDefaultPlatformSettingsMap } from './platform-capabilities';

describe('buildPlatformAssetPath', () => {
  const baseSettings: Settings = {
    ...defaultSettings,
    activePlatformId: 'atarist',
    platformSettings: {
      ...createDefaultPlatformSettingsMap(),
      atarist: {
        ...createDefaultPlatformSettingsMap().atarist,
        folders: {
          ...createDefaultPlatformSettingsMap().atarist.folders,
          gamesPath: 'E:\\Backups\\RETRO-BACKUPS\\AtariST\\Games',
          extrasPath: 'E:\\Backups\\RETRO-BACKUPS\\AtariST\\Extras',
          screenshotsPath: '',
          musicPath: '',
        },
      },
    },
  };

  it.each([
    ['/home/user/Games', '/home/user/Games/nested/game.zip'],
    ['/', '/nested/game.zip'],
    ['\\\\server\\share\\Games\\', '//server/share/Games/nested/game.zip'],
    ['  "/home/user/My Games/"  ', '/home/user/My Games/nested/game.zip'],
    ['C:\\Games/', 'C:/Games/nested/game.zip'],
    ['C:\\', 'C:/nested/game.zip'],
  ])('preserves the configured base root %s', (gamesPath, expected) => {
    const settings = structuredClone(baseSettings);
    settings.platformSettings.atarist.folders.gamesPath = gamesPath;

    expect(buildPlatformAssetPath(settings, 'roms', '/nested\\game.zip/')).toBe(expected);
  });

  it.each([
    ['/home/user/Games/', '/home/user/Extras/nested/game.zip'],
    ['/', '/Extras/nested/game.zip'],
    ['\\\\server\\share\\Games', '//server/share/Extras/nested/game.zip'],
    ['C:\\Library', 'C:/Library/Extras/nested/game.zip'],
  ])('preserves the root of the blank-Extras fallback for %s', (gamesPath, expected) => {
    const settings = structuredClone(baseSettings);
    settings.platformSettings.atarist.folders.gamesPath = gamesPath;
    settings.platformSettings.atarist.folders.extrasPath = '';

    expect(buildPlatformAssetPath(settings, 'extras', 'nested\\game.zip')).toBe(expected);
  });

  it('builds full extras path with normalized forward slashes', () => {
    const fullPath = buildPlatformAssetPath(
      baseSettings,
      'extras',
      'HardDisk\\AFTERBUR.ZIP',
    );
    expect(fullPath).toBe('E:/Backups/RETRO-BACKUPS/AtariST/Extras/HardDisk/AFTERBUR.ZIP');
  });

  it('strips surrounding quotes and whitespace from paths copied from Windows Explorer', () => {
    const quotedSettings: Settings = {
      ...baseSettings,
      activePlatformId: 'atarist',
      platformSettings: {
        ...baseSettings.platformSettings,
        atarist: {
          ...baseSettings.platformSettings.atarist,
          folders: {
            ...baseSettings.platformSettings.atarist.folders,
            extrasPath: '  "E:\\Backups\\RETRO-BACKUPS\\AtariST\\Extras"  ',
          },
        },
      },
    };

    const fullPath = buildPlatformAssetPath(
      quotedSettings,
      'extras',
      'HardDisk\\AFTERBUR.ZIP',
    );
    expect(fullPath).toBe('E:/Backups/RETRO-BACKUPS/AtariST/Extras/HardDisk/AFTERBUR.ZIP');
  });

  it('falls back to Games/Extras when extrasPath is blank', () => {
    const blankExtrasSettings: Settings = {
      ...baseSettings,
      activePlatformId: 'atarist',
      platformSettings: {
        ...baseSettings.platformSettings,
        atarist: {
          ...baseSettings.platformSettings.atarist,
          folders: {
            ...baseSettings.platformSettings.atarist.folders,
            extrasPath: '',
          },
        },
      },
    };

    const fullPath = buildPlatformAssetPath(
      blankExtrasSettings,
      'extras',
      'STX\\Afterburner.zip',
    );
    expect(fullPath).toBe('E:/Backups/RETRO-BACKUPS/AtariST/Extras/STX/Afterburner.zip');
  });
});
