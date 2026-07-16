import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createDefaultPlatformSettingsMap } from '../lib/platform-capabilities';
import type { Settings } from '../contexts/SettingsContext';
import { SettingsView } from './SettingsModal';

const updateSettings = vi.fn();
const setTheme = vi.fn();

const mockTheme = {
  id: 'arcade-void',
  displayName: 'Arcade Void & Neon Acrylic',
  colors: {
    primary: '#8aebff',
    primaryContainer: '#0e3038',
    secondary: '#a855f7',
    tertiary: '#eab308',
    surface: '#141A21',
    background: '#0a0c10',
    outline: '#1f2937',
    outlineVariant: '#374151',
    text: '#ffffff',
    textMuted: '#9ca3af',
  },
  typography: {
    sans: '"Manrope", "Inter", sans-serif',
    mono: '"Space Grotesk", monospace',
  },
  borderRadius: {
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
  },
  effects: {
    scanlines: false,
    outerBorder: false,
    ambientGlow: true,
    steppedBorders: false,
    blinkingCursor: false,
    glassmorphism: true,
  },
};

const c64Theme = {
  id: 'c64-edition',
  displayName: 'C64 Edition',
  colors: {
    primary: '#c0c1ff',
    primaryContainer: '#352879',
    secondary: '#7074c1',
    tertiary: '#e0a060',
    surface: '#131313',
    background: '#131313',
    outline: '#7074c1',
    outlineVariant: '#352879',
    text: '#c0c1ff',
    textMuted: '#7074c1',
  },
  typography: {
    sans: '"Space Mono", monospace',
    mono: '"Space Mono", monospace',
  },
  borderRadius: {
    sm: '0px',
    md: '0px',
    lg: '0px',
    xl: '0px',
  },
  effects: {
    scanlines: false,
    outerBorder: true,
    ambientGlow: false,
    steppedBorders: true,
    blinkingCursor: true,
  },
};

const cyberpunkTheme = {
  ...mockTheme,
  id: 'cyberpunk-crt',
  displayName: 'Cyberpunk CRT',
};

let currentTheme = mockTheme;

vi.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: currentTheme,
    setTheme,
    availableThemes: [mockTheme, cyberpunkTheme, c64Theme],
  }),
}));

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
  platformSettings.bbcmicro.folders.gamesPath = 'G:/BBC/Games';
  platformSettings.bbcmicro.folders.screenshotsPath = 'G:/BBC/Screenshots';
  platformSettings.bbcmicro.folders.musicPath = 'G:/BBC/Music';
  platformSettings.bbcmicro.folders.extrasPath = 'G:/BBC/Extras';
  platformSettings.bbcmicro.emulator.executablePaths['retroarch-bbcmicro'] = 'C:/RetroArch/retroarch.exe';
  platformSettings.bbcmicro.emulator.corePaths['retroarch-bbcmicro'] = 'C:/RetroArch/cores/beetle_bbc_libretro.dll';
  platformSettings.bbcmicro.emulator.executablePaths['beebem-bbcmicro'] = 'C:/BeebEm/BeebEm.exe';
  platformSettings.amiga.folders.gamesPath = 'H:/Amiga/Games';
  platformSettings.amiga.folders.screenshotsPath = 'H:/Amiga/Screenshots';
  platformSettings.amiga.folders.musicPath = 'H:/Amiga/Music';
  platformSettings.amiga.folders.extrasPath = 'H:/Amiga/Extras';
  platformSettings.amiga.emulator.executablePaths['retroarch-amiga'] = 'C:/RetroArch/retroarch.exe';
  platformSettings.amiga.emulator.corePaths['retroarch-amiga'] = 'C:/RetroArch/cores/puae_libretro.dll';
  platformSettings.amiga.emulator.executablePaths['winuae-amiga'] = 'C:/WinUAE/WinUAE.exe';
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
    setTheme.mockClear();
    currentTheme = mockTheme;
  });

  test('selects and persists a built-in theme from Appearance settings', () => {
    renderSettings();

    const cyberpunkThemeButton = screen.getByRole('button', { name: 'Cyberpunk CRT' });
    fireEvent.click(cyberpunkThemeButton);

    expect(setTheme).toHaveBeenCalledWith('cyberpunk-crt');
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

  test('shows BBC Micro folders with RetroArch and BeebEm settings from the imported BBC tab', () => {
    currentSettings = makeSettings('c64', ['c64', 'bbcmicro']);

    openSettingsTab('Acorn BBC Micro Platform Paths');

    expect(screen.getByDisplayValue('G:/BBC/Games')).toBeTruthy();
    expect(screen.getByDisplayValue('G:/BBC/Screenshots')).toBeTruthy();
    expect(screen.getByDisplayValue('G:/BBC/Music')).toBeTruthy();
    expect(screen.getByDisplayValue('G:/BBC/Extras')).toBeTruthy();
    expect(screen.queryByText('Photos folder')).toBeNull();
    expect(screen.getByText('Default Desktop Emulator')).toBeTruthy();
    expect(screen.getByText('RetroArch')).toBeTruthy();
    expect(screen.getByText('BeebEm')).toBeTruthy();
    expect(screen.getByText('RetroArch BBC Micro Core')).toBeTruthy();
    expect(screen.getByText('BeebEm Executable')).toBeTruthy();
  });

  test('shows Amiga folders with RetroArch and UAE settings from the imported Amiga tab', () => {
    currentSettings = makeSettings('c64', ['c64', 'amiga']);

    openSettingsTab('Commodore Amiga Platform Paths');

    expect(screen.getByDisplayValue('H:/Amiga/Games')).toBeTruthy();
    expect(screen.getByDisplayValue('H:/Amiga/Screenshots')).toBeTruthy();
    expect(screen.getByDisplayValue('H:/Amiga/Music')).toBeTruthy();
    expect(screen.getByDisplayValue('H:/Amiga/Extras')).toBeTruthy();
    expect(screen.queryByText('Photos folder')).toBeNull();
    expect(screen.getByText('Default Desktop Emulator')).toBeTruthy();
    expect(screen.getByText('RetroArch')).toBeTruthy();
    expect(screen.getByText('WinUAE / UAE')).toBeTruthy();
    expect(screen.getByText('RetroArch Amiga Core')).toBeTruthy();
    expect(screen.getByText('WinUAE / UAE Executable')).toBeTruthy();
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

  test('renders themed classes and key hints in C64 theme', () => {
    currentSettings = makeSettings('c64', ['c64']);
    currentTheme = c64Theme;

    renderSettings();

    // Check F-key hints are present on the category labels
    expect(screen.getByText(/Appearance \[F1\]/)).toBeTruthy();
    expect(screen.getByText(/Content \[F3\]/)).toBeTruthy();
    expect(screen.getByText(/C64 Platform Paths \[F5\]/)).toBeTruthy();
    expect(screen.getByText(/Scrapers \(Coming Soon\) \[F7\]/)).toBeTruthy();
  });

  test('does not show C64 key hints in other themes', () => {
    currentSettings = makeSettings('c64', ['c64']);
    currentTheme = mockTheme;

    renderSettings();

    // Check F-key hints are not present
    expect(screen.queryByText(/Appearance \[F1\]/)).toBeNull();
    expect(screen.getByText(/Appearance/)).toBeTruthy();
  });

  test('C64 F-Keys switch tabs when c64 theme is active', () => {
    currentSettings = makeSettings('c64', ['c64']);
    currentTheme = c64Theme;

    renderSettings();

    // Initially active tab is appearance, press F3 to switch to content tab
    fireEvent.keyDown(window, { key: 'F3' });

    // Verify content tab is now selected or inputs from Content tab are shown
    expect(screen.getByText(/Hide Adult Content/)).toBeTruthy();

    // Press F1 to switch back to appearance
    fireEvent.keyDown(window, { key: 'F1' });
    expect(screen.getByText(/Cycle Multiple Images/)).toBeTruthy();

    // Press F5 to switch to platform paths tab
    fireEvent.keyDown(window, { key: 'F5' });
    expect(screen.getByText('Games folder')).toBeTruthy();
  });

  test('F-Keys do not switch tabs when theme is not C64', () => {
    currentSettings = makeSettings('c64', ['c64']);
    currentTheme = mockTheme;

    renderSettings();

    // Press F3
    fireEvent.keyDown(window, { key: 'F3' });

    // Verify it remains on appearance tab and doesn't show Content tab content
    expect(screen.queryByText(/Hide Adult Content/)).toBeNull();
    expect(screen.getByText(/Cycle Multiple Images/)).toBeTruthy();
  });
});

