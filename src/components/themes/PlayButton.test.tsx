import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultPlatformSettingsMap } from '../../lib/platform-capabilities';
import type { Settings } from '../../contexts/SettingsContext';
import { mockGames } from '../../data/mockGames';
import { PlayButton } from './PlayButton';

const mockLaunchEmulator = vi.fn();
const mockMarkAsPlayed = vi.fn();

function makeSettings(activePlatformId: Settings['activePlatformId'] = 'c64'): Settings {
  const platformSettings = createDefaultPlatformSettingsMap();
  platformSettings.c64.library.importStatus = 'imported';
  platformSettings.c64.folders.gamesPath = 'D:/GB64/Games';
  platformSettings.c64.folders.extrasPath = 'D:/GB64/Extras';
  platformSettings.c64.emulator.executablePaths['vice-c64'] = 'C:/VICE/x64sc.exe';
  platformSettings.atari800.library.importStatus = 'imported';
  platformSettings.atari800.folders.gamesPath = 'E:/Atari/Games';
  platformSettings.atari800.folders.extrasPath = 'E:/Atari/Extras';
  platformSettings.atari800.emulator.executablePaths['retroarch-atari800'] = 'C:/RetroArch/retroarch.exe';
  platformSettings.atari800.emulator.corePaths['retroarch-atari800'] = 'C:/RetroArch/cores/atari800_libretro.dll';

  return {
    activePlatformId,
    platformSettings,
    preferredEmulator: 'vice',
    emulatorPath: 'C:/VICE/x64sc.exe',
    retroarchPath: '',
    retroarchCorePath: '',
    romsPath: activePlatformId === 'atari800' ? 'E:/Atari/Games' : 'D:/GB64/Games',
    extrasPath: activePlatformId === 'atari800' ? 'E:/Atari/Extras' : 'D:/GB64/Extras',
  } as Settings;
}

let currentSettings = makeSettings();

vi.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: currentSettings,
    markAsPlayed: mockMarkAsPlayed,
  }),
}));

vi.mock('../../lib/tauri-bridge', () => ({
  launchEmulator: (...args: unknown[]) => mockLaunchEmulator(...args),
}));

vi.mock('../WasmPlayer', () => ({
  WasmPlayer: () => null,
}));

describe('PlayButton platform launch requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSettings = makeSettings();
    mockLaunchEmulator.mockResolvedValue({ success: true, message: 'launched' });
  });

  it('passes Atari 800 platform metadata and paths to the native launcher', async () => {
    currentSettings = makeSettings('atari800');
    const game = {
      ...mockGames[0],
      filename: 'Disks\\BoulderDash.atr',
      gameFilename: null,
    };

    render(<PlayButton game={game} />);

    fireEvent.click(screen.getByRole('button', { name: /launch emulator/i }));

    await waitFor(() => {
      expect(mockLaunchEmulator).toHaveBeenCalledWith({
        platform_id: 'atari800',
        emulator_profile_id: 'retroarch-atari800',
        emulator_path: 'C:/RetroArch/retroarch.exe',
        rom_path: 'E:/Atari/Games/Disks/BoulderDash.atr',
        true_drive_emulation: false,
        is_pal: true,
        game_id: mockGames[0].id.toString(),
        core_path: 'C:/RetroArch/cores/atari800_libretro.dll',
      });
    });
  });

  it('shows the embedded play button for C64', () => {
    currentSettings = makeSettings('c64');

    render(<PlayButton game={mockGames[0]} />);

    expect(screen.getByRole('button', { name: /play embedded/i })).toBeTruthy();
  });

  it('hides the embedded play button for Atari 800', () => {
    currentSettings = makeSettings('atari800');

    render(<PlayButton game={mockGames[0]} />);

    expect(screen.queryByRole('button', { name: /play embedded/i })).toBeNull();
  });
});
