import { expect, Page } from '@playwright/test';

export async function waitForAppReady(page: Page) {
  await expect(page.locator('.app-launch-splash')).toBeHidden({ timeout: 15000 });
}

export async function seedImportedAtari800Settings(page: Page) {
  await page.addInitScript(() => {
    const platformSettings = {
      c64: {
        library: {
          platformId: 'c64',
          importStatus: 'imported',
          sourceMdbPath: 'D:/GB64/GBC_v19.mdb',
          sqliteScope: 'c64',
          lastImportedAt: '2026-06-28T00:00:00.000Z',
          lastImportError: null,
          gameCount: 30000,
          active: true,
        },
        folders: {
          platformId: 'c64',
          gamesPath: 'D:/GB64/Games',
          musicPath: 'D:/GB64/C64Music',
          photosPath: 'D:/GB64/Photos',
          screenshotsPath: 'D:/GB64/Screenshots',
          extrasPath: 'D:/GB64/Extras',
          boxArtPath: '',
          videosPath: '',
        },
        emulator: {
          platformId: 'c64',
          preferredEmulatorProfileId: 'vice-c64',
          executablePaths: { 'vice-c64': 'C:/VICE/x64sc.exe' },
          corePaths: {},
        },
        navigation: {
          lastSelectedGameId: null,
          lastFocusedIndex: 0,
          lastViewMode: 'grid',
          recentlyPlayedIds: [],
          lastBigBoxRailId: null,
          lastBigBoxGameId: null,
        },
      },
      atari800: {
        library: {
          platformId: 'atari800',
          importStatus: 'imported',
          sourceMdbPath: 'E:/Atari/Atari 800 v12.mdb',
          sqliteScope: 'atari800',
          lastImportedAt: '2026-06-28T00:00:00.000Z',
          lastImportError: null,
          gameCount: 7288,
          active: false,
        },
        folders: {
          platformId: 'atari800',
          gamesPath: 'E:/Atari/Games',
          musicPath: 'E:/Atari/Music',
          photosPath: 'E:/Atari/Photos',
          screenshotsPath: 'E:/Atari/Screenshots',
          extrasPath: 'E:/Atari/Extras',
          boxArtPath: '',
          videosPath: '',
        },
        emulator: {
          platformId: 'atari800',
          preferredEmulatorProfileId: 'retroarch-atari800',
          executablePaths: {
            'retroarch-atari800': 'C:/RetroArch/retroarch.exe',
            'altirra-atari800': 'C:/Altirra/Altirra64.exe',
          },
          corePaths: {
            'retroarch-atari800': 'C:/RetroArch/cores/atari800_libretro.dll',
          },
        },
        navigation: {
          lastSelectedGameId: null,
          lastFocusedIndex: 0,
          lastViewMode: 'grid',
          recentlyPlayedIds: [],
          lastBigBoxRailId: null,
          lastBigBoxGameId: null,
        },
      },
      atari2600: {
        library: {
          platformId: 'atari2600',
          importStatus: 'notImported',
          sourceMdbPath: null,
          sqliteScope: 'atari2600',
          lastImportedAt: null,
          lastImportError: null,
          gameCount: 0,
          active: false,
        },
        folders: {
          platformId: 'atari2600',
          gamesPath: '',
          musicPath: '',
          photosPath: '',
          screenshotsPath: '',
          extrasPath: '',
          boxArtPath: '',
          videosPath: '',
        },
        emulator: {
          platformId: 'atari2600',
          preferredEmulatorProfileId: 'retroarch-atari2600',
          executablePaths: {},
          corePaths: {},
        },
        navigation: {
          lastSelectedGameId: null,
          lastFocusedIndex: 0,
          lastViewMode: 'grid',
          recentlyPlayedIds: [],
          lastBigBoxRailId: null,
          lastBigBoxGameId: null,
        },
      },
    };

    window.localStorage.setItem('gb64_settings', JSON.stringify({
      activePlatformId: 'c64',
      lastUsedPlatformId: 'c64',
      platformSettings,
      romsPath: 'D:/GB64/Games',
      soundsPath: 'D:/GB64/C64Music',
      musicianPhotosPath: 'D:/GB64/Photos',
      screenshotsPath: 'D:/GB64/Screenshots',
      extrasPath: 'D:/GB64/Extras',
    }));
  });
}
