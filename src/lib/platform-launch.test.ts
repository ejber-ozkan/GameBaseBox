import { describe, expect, it } from 'vitest';
import { buildPlatformAssetPath } from './platform-launch';
import { Settings } from '../types';

describe('buildPlatformAssetPath', () => {
  const baseSettings: Settings = {
    activePlatformId: 'atarist',
    platformSettings: {
      atarist: {
        emulator: {
          path: 'C:/emulators/Hatari/hatari.exe',
          profileId: 'hatari-atarist',
          corePath: '',
          autoStartAudio: true,
          showStatusLine: true,
          driveSound: true,
        },
        folders: {
          gamesPath: 'E:\\Backups\\RETRO-BACKUPS\\AtariST\\Games',
          extrasPath: 'E:\\Backups\\RETRO-BACKUPS\\AtariST\\Extras',
          screenshotsPath: '',
          musicPath: '',
        },
      },
    },
  } as unknown as Settings;

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
      activePlatformId: 'atarist',
      platformSettings: {
        atarist: {
          ...baseSettings.platformSettings.atarist,
          folders: {
            ...baseSettings.platformSettings.atarist.folders,
            extrasPath: '  "E:\\Backups\\RETRO-BACKUPS\\AtariST\\Extras"  ',
          },
        },
      },
    } as unknown as Settings;

    const fullPath = buildPlatformAssetPath(
      quotedSettings,
      'extras',
      'HardDisk\\AFTERBUR.ZIP',
    );
    expect(fullPath).toBe('E:/Backups/RETRO-BACKUPS/AtariST/Extras/HardDisk/AFTERBUR.ZIP');
  });

  it('falls back to Games/Extras when extrasPath is blank', () => {
    const blankExtrasSettings: Settings = {
      activePlatformId: 'atarist',
      platformSettings: {
        atarist: {
          ...baseSettings.platformSettings.atarist,
          folders: {
            ...baseSettings.platformSettings.atarist.folders,
            extrasPath: '',
          },
        },
      },
    } as unknown as Settings;

    const fullPath = buildPlatformAssetPath(
      blankExtrasSettings,
      'extras',
      'STX\\Afterburner.zip',
    );
    expect(fullPath).toBe('E:/Backups/RETRO-BACKUPS/AtariST/Extras/STX/Afterburner.zip');
  });
});
