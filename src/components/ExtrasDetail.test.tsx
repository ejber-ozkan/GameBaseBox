import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExtrasDetail, type ExtrasBigscreenNavigation } from './ExtrasDetail';
import { mockGames } from '../data/mockGames';
import type { Extra } from '../types/game';
import { createDefaultPlatformSettingsMap } from '../lib/platform-capabilities';
import type { Settings } from '../contexts/SettingsContext';

const mockGetAssetUrl = vi.fn();
const mockLaunchEmulator = vi.fn();
const mockOpenFile = vi.fn();
const mockMarkAsPlayed = vi.fn();

function makeSettings(activePlatformId: Settings['activePlatformId'] = 'c64'): Settings {
  const platformSettings = createDefaultPlatformSettingsMap();
  platformSettings.c64.library.importStatus = 'imported';
  platformSettings.c64.folders.gamesPath = 'D:/GB64/Games';
  platformSettings.c64.folders.extrasPath = 'E:\\Extras\\';
  platformSettings.c64.emulator.executablePaths['vice-c64'] = '/usr/bin/x64sc';
  platformSettings.atari800.library.importStatus = 'imported';
  platformSettings.atari800.folders.gamesPath = 'F:/Atari/Games';
  platformSettings.atari800.folders.extrasPath = 'F:\\Atari\\Extras\\';
  platformSettings.atari800.emulator.executablePaths['retroarch-atari800'] = 'C:/RetroArch/retroarch.exe';
  platformSettings.atari800.emulator.corePaths['retroarch-atari800'] = 'C:/RetroArch/cores/atari800_libretro.dll';

  return {
    emulatorPath: '/usr/bin/x64sc',
    extrasPath: activePlatformId === 'atari800' ? 'F:\\Atari\\Extras\\' : 'E:\\Extras\\',
    preferredEmulator: 'vice',
    retroarchCorePath: '',
    retroarchPath: '',
    activePlatformId,
    platformSettings,
  } as Settings;
}

let currentSettings = makeSettings();

vi.mock('../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: currentSettings,
    markAsPlayed: mockMarkAsPlayed,
  }),
}));

vi.mock('../hooks/useGamepad', () => ({
  useGamepad: () => {},
}));

vi.mock('../hooks/usePopupOpenSound', () => ({
  usePopupOpenSound: () => {},
}));

vi.mock('../lib/tauri-bridge', () => ({
  getAssetUrl: (...args: unknown[]) => mockGetAssetUrl(...args),
  launchEmulator: (...args: unknown[]) => mockLaunchEmulator(...args),
  openFile: (...args: unknown[]) => mockOpenFile(...args),
}));

const visualExtras: Extra[] = [
  { id: 'visual-1', name: 'Cover One', path: 'Cover\\cover-one.png', type: 'image' },
  { id: 'visual-2', name: 'Cover Two', path: 'Cover\\cover-two.png', type: 'image' },
];

const docsAndMediaExtras: Extra[] = [
  { id: 'doc-1', name: 'Manual', path: 'Docs\\manual.pdf', type: 'doc' },
  { id: 'media-1', name: 'Soundtrack', path: 'mp3s\\theme.mp3', type: 'audio' },
];

const launchableExtra: Extra = {
  id: 'game-1',
  name: 'Original Tape',
  path: '\\Tapes\\original.tap',
  type: 'game',
};

describe('ExtrasDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSettings = makeSettings();
    mockGetAssetUrl.mockImplementation(async (path: string) => `asset://${path.replace(/\\/g, '/')}`);
    mockLaunchEmulator.mockResolvedValue({ success: true, message: '' });
    mockOpenFile.mockResolvedValue(undefined);
  });

  it('normalizes the extras launch path before invoking the emulator', async () => {
    render(<ExtrasDetail game={mockGames[0]} extras={[launchableExtra]} />);

    fireEvent.click(screen.getByRole('button', { name: /original tape/i }));

    await waitFor(() => {
      expect(mockLaunchEmulator).toHaveBeenCalledWith({
        platform_id: 'c64',
        emulator_profile_id: 'vice-c64',
        emulator_path: '/usr/bin/x64sc',
        rom_path: 'E:/Extras/Tapes/original.tap',
        true_drive_emulation: false,
        is_pal: true,
        game_id: mockGames[0].id.toString(),
        core_path: undefined,
      });
    });

    expect(mockMarkAsPlayed).toHaveBeenCalledWith(mockGames[0].id.toString());
  });

  it('launches Atari 800 extras with Atari paths and profile metadata', async () => {
    currentSettings = makeSettings('atari800');

    render(<ExtrasDetail game={mockGames[0]} extras={[{ ...launchableExtra, path: '\\Disks\\original.atr' }]} />);

    fireEvent.click(screen.getByRole('button', { name: /original tape/i }));

    await waitFor(() => {
      expect(mockLaunchEmulator).toHaveBeenCalledWith({
        platform_id: 'atari800',
        emulator_profile_id: 'retroarch-atari800',
        emulator_path: 'C:/RetroArch/retroarch.exe',
        rom_path: 'F:/Atari/Extras/Disks/original.atr',
        true_drive_emulation: false,
        is_pal: true,
        game_id: mockGames[0].id.toString(),
        core_path: 'C:/RetroArch/cores/atari800_libretro.dll',
      });
    });
  });

  it('opens docs and media extras with normalized file paths', async () => {
    render(<ExtrasDetail game={mockGames[0]} extras={docsAndMediaExtras} />);

    fireEvent.click(screen.getByRole('button', { name: /manual/i }));
    fireEvent.click(screen.getByRole('button', { name: /soundtrack/i }));

    await waitFor(() => {
      expect(mockOpenFile).toHaveBeenNthCalledWith(1, 'E:/Extras/Docs/manual.pdf');
      expect(mockOpenFile).toHaveBeenNthCalledWith(2, 'E:/Extras/mp3s/theme.mp3');
    });
  });

  it('registers and unregisters bigscreen navigation when enabled', async () => {
    const onRegisterBigscreenNavigation = vi.fn<(navigation: ExtrasBigscreenNavigation | null) => void>();

    const { unmount } = render(
      <ExtrasDetail
        game={mockGames[0]}
        extras={visualExtras}
        enableBigscreenGalleryUX
        onRegisterBigscreenNavigation={onRegisterBigscreenNavigation}
      />
    );

    await waitFor(() => {
      expect(onRegisterBigscreenNavigation).toHaveBeenCalledWith(
        expect.objectContaining({
          activate: expect.any(Function),
          move: expect.any(Function),
        })
      );
    });

    unmount();

    expect(onRegisterBigscreenNavigation).toHaveBeenLastCalledWith(null);
  });

  it('opens, cycles, and closes fullscreen visual extras in bigscreen gallery mode', async () => {
    render(
      <ExtrasDetail
        game={mockGames[0]}
        extras={visualExtras}
        enableBigscreenGalleryUX
      />
    );

    await screen.findAllByAltText('Cover One');

    const previewButton = screen.getAllByRole('button', { name: /cover one/i })[0];
    fireEvent.click(previewButton);

    await screen.findByText('Cover\\cover-one.png');

    fireEvent.keyDown(window, { key: 'ArrowRight' });

    await waitFor(() => {
      expect(screen.getAllByAltText('Cover Two').length).toBeGreaterThan(1);
    });
    await screen.findByText('Cover\\cover-two.png');

    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByText('Cover\\cover-two.png')).toBeNull();
    });
  });

  it('updates the selected preview when a thumbnail is clicked in bigscreen gallery mode', async () => {
    render(
      <ExtrasDetail
        game={mockGames[0]}
        extras={visualExtras}
        enableBigscreenGalleryUX
      />
    );

    await screen.findAllByAltText('Cover One');

    const coverTwoButtons = screen.getAllByRole('button', { name: /cover two/i });
    fireEvent.click(coverTwoButtons[coverTwoButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /cover two/i }).length).toBeGreaterThan(1);
    });
  });
});
