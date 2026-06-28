import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createDefaultPlatformSettingsMap } from '../lib/platform-capabilities';
import type { Settings } from '../contexts/SettingsContext';
import { SettingsView } from './SettingsModal';

const updateSettings = vi.fn();

vi.mock('../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: currentSettings,
    updateSettings,
  }),
}));

vi.mock('../hooks/useGamepad', () => ({
  useGamepad: vi.fn(),
}));

vi.mock('../hooks/useInputMode', () => ({
  useInputMode: () => ({
    isMouseMode: true,
    onGamepadInput: vi.fn(),
  }),
}));

vi.mock('../lib/ui-sound-effects', () => ({
  playUiSoundEffect: vi.fn(),
}));

function makeSettings(
  activePlatformId: Settings['activePlatformId'],
  importedPlatformIds: Settings['activePlatformId'][] = ['c64'],
): Settings {
  const platformSettings = createDefaultPlatformSettingsMap();
  platformSettings.c64.folders.gamesPath = 'D:/GB64/Games';
  platformSettings.c64.folders.screenshotsPath = 'D:/GB64/Screenshots';
  platformSettings.c64.folders.musicPath = 'D:/GB64/C64Music';
  platformSettings.c64.folders.photosPath = 'D:/GB64/Photos';
  platformSettings.c64.folders.extrasPath = 'D:/GB64/Extras';
  platformSettings.c64.emulator.executablePaths['vice-c64'] = 'C:/VICE/x64sc.exe';
  platformSettings.c64.emulator.executablePaths['retroarch-c64'] = 'C:/RetroArch/retroarch.exe';
  platformSettings.c64.emulator.corePaths['retroarch-c64'] = 'C:/RetroArch/cores/vice_x64sc_libretro.dll';
  platformSettings.atari800.folders.gamesPath = 'E:/Atari/Games';
  platformSettings.atari800.folders.screenshotsPath = 'E:/Atari/Screenshots';
  platformSettings.atari800.folders.musicPath = 'E:/Atari/Music';
  platformSettings.atari800.folders.photosPath = 'E:/Atari/Photos';
  platformSettings.atari800.folders.extrasPath = 'E:/Atari/Extras';
  platformSettings.atari800.emulator.executablePaths['retroarch-atari800'] = 'C:/RetroArch/retroarch.exe';
  platformSettings.atari800.emulator.corePaths['retroarch-atari800'] = 'C:/RetroArch/cores/atari800_libretro.dll';
  platformSettings.atari800.emulator.executablePaths['altirra-atari800'] = 'C:/Altirra/Altirra64.exe';
  platformSettings.atari2600.folders.gamesPath = 'F:/Atari2600/Games';
  platformSettings.atari2600.folders.screenshotsPath = 'F:/Atari2600/Screenshots';
  platformSettings.atari2600.folders.extrasPath = 'F:/Atari2600/Extras';
  platformSettings.atari2600.emulator.executablePaths['retroarch-atari2600'] = 'C:/RetroArch/retroarch.exe';
  platformSettings.atari2600.emulator.corePaths['retroarch-atari2600'] = 'C:/RetroArch/cores/stella_libretro.dll';
  importedPlatformIds.forEach((platformId) => {
    platformSettings[platformId].library.importStatus = 'imported';
  });

  return {
    screenshotsPath: '',
    soundsPath: '',
    musicianPhotosPath: '',
    romsPath: '',
    emulatorPath: '',
    emuMoviesUsername: '',
    emuMoviesPassword: '',
    scrapedMediaPath: '',
    extrasPath: '',
    activeScraper: 'emumovies',
    screenScraperUsername: '',
    screenScraperPassword: '',
    screenScraperDevId: '',
    screenScraperDevPassword: '',
    theGamesDbApiKey: '',
    hideAdultContent: false,
    recentlyPlayedIds: [],
    retroarchPath: '',
    retroarchCorePath: '',
    preferredEmulator: 'vice',
    imageAnimation: 'none',
    imageCycling: true,
    lastSelectedGameId: null,
    lastFocusedIndex: 0,
    lastViewMode: 'grid',
    isFullscreen: false,
    fullscreenDensity: 'auto',
    displayResolution: 'default',
    windowWidth: 1200,
    windowHeight: 800,
    mouseHoverSelection: true,
    scrollNavigation: true,
    menuSoundEffects: false,
    bigBoxAnimateVertical: true,
    confirmFullscreenExit: true,
    lastBigBoxRailId: null,
    lastBigBoxGameId: null,
    activePlatformId,
    lastUsedPlatformId: activePlatformId,
    platformSettings,
  };
}

let currentSettings = makeSettings('c64');

function renderSettings() {
  render(<SettingsView onBack={vi.fn()} />);
}

function openSettingsTab(label: string) {
  renderSettings();
  fireEvent.click(screen.getByText(label));
}

describe('SettingsView platform emulator settings', () => {
  beforeEach(() => {
    updateSettings.mockClear();
  });

  test('shows one platform paths tab for each imported platform', () => {
    currentSettings = makeSettings('c64', ['c64', 'atari800']);

    renderSettings();

    expect(screen.queryByText('📁 Local Paths')).toBeNull();
    expect(screen.getByText('C64 Platform Paths')).toBeTruthy();
    expect(screen.getByText('Atari 800 Platform Paths')).toBeTruthy();
  });

  test('hides platform paths tabs for unimported platforms', () => {
    currentSettings = makeSettings('c64', ['c64']);

    renderSettings();

    expect(screen.getByText('C64 Platform Paths')).toBeTruthy();
    expect(screen.queryByText('Atari 800 Platform Paths')).toBeNull();
  });

  test('keeps C64 paths editable while Atari 800 is active', () => {
    currentSettings = makeSettings('atari800', ['c64', 'atari800']);

    openSettingsTab('C64 Platform Paths');

    expect(screen.getByDisplayValue('D:/GB64/Games')).toBeTruthy();
    expect(screen.queryByText('Altirra Executable (Altirra64.exe)')).toBeNull();
  });

  test('shows Atari 800 path controls only from the imported Atari 800 tab', () => {
    currentSettings = makeSettings('c64', ['c64', 'atari800']);

    openSettingsTab('Atari 800 Platform Paths');

    expect(screen.getByDisplayValue('E:/Atari/Games')).toBeTruthy();
    expect(screen.getByText('Default Desktop Emulator')).toBeTruthy();
    expect(screen.getByText('RetroArch')).toBeTruthy();
    expect(screen.getByText('Altirra')).toBeTruthy();
    expect(screen.getByText('RetroArch Atari800 Core')).toBeTruthy();
    expect(screen.getByText('Altirra Executable (Altirra64.exe)')).toBeTruthy();
  });

  test('shows Atari 2600 path controls and RetroArch settings from the imported Atari 2600 tab', () => {
    currentSettings = makeSettings('c64', ['c64', 'atari2600']);

    openSettingsTab('Atari 2600 Platform Paths');

    expect(screen.getByDisplayValue('F:/Atari2600/Games')).toBeTruthy();
    expect(screen.getByDisplayValue('F:/Atari2600/Screenshots')).toBeTruthy();
    expect(screen.getByDisplayValue('F:/Atari2600/Extras')).toBeTruthy();
    expect(screen.getByText('RetroArch Executable (retroarch.exe)')).toBeTruthy();
    expect(screen.getByText('RetroArch Atari 2600 Core')).toBeTruthy();
    expect(screen.queryByText('Altirra Executable (Altirra64.exe)')).toBeNull();
  });

  test('does not show scraped media in platform paths', () => {
    currentSettings = makeSettings('c64', ['c64', 'atari800']);

    openSettingsTab('C64 Platform Paths');

    expect(screen.queryByText('Scraped Media Folder')).toBeNull();
    expect(screen.queryByDisplayValue('/media/scraped')).toBeNull();
  });

  test('saves edited platform paths without overwriting another platform', () => {
    currentSettings = makeSettings('c64', ['c64', 'atari800']);

    renderSettings();

    fireEvent.click(screen.getByText('C64 Platform Paths'));
    fireEvent.change(screen.getByDisplayValue('D:/GB64/Games'), {
      target: { value: 'D:/NewGB64/Games' },
    });

    fireEvent.click(screen.getByText('Atari 800 Platform Paths'));
    fireEvent.change(screen.getByDisplayValue('E:/Atari/Games'), {
      target: { value: 'E:/NewAtari/Games' },
    });

    fireEvent.click(screen.getByText('Save Configuration'));

    expect(updateSettings).toHaveBeenCalledWith(expect.objectContaining({
      platformSettings: expect.objectContaining({
        c64: expect.objectContaining({
          folders: expect.objectContaining({
            gamesPath: 'D:/NewGB64/Games',
            extrasPath: 'D:/GB64/Extras',
          }),
        }),
        atari800: expect.objectContaining({
          folders: expect.objectContaining({
            gamesPath: 'E:/NewAtari/Games',
            extrasPath: 'E:/Atari/Extras',
          }),
        }),
      }),
    }));
  });
});
