import { expect, test, describe, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, renderHook, act } from '@testing-library/react';
import { applyPlatformImportStatuses, SettingsProvider, useSettings } from './SettingsContext';
import React from 'react';
import { createDefaultPlatformSettingsMap } from '../lib/platform-capabilities';

// Wrapper component to consume and test the Context hooks natively
function SettingsTestComponent() {
  const { settings, updateSettings, setActivePlatform, resolveMediaPath, markAsPlayed } = useSettings();
  
  return (
    <div>
      <div data-testid="screenshot-path">{resolveMediaPath('screenshot', 'commando_1.png')}</div>
      <div data-testid="sound-path">{resolveMediaPath('sound', 'commando.sid')}</div>
      <div data-testid="extras-path">{resolveMediaPath('extras', 'Cover/arkanoid.png')}</div>
      <div data-testid="recently-played">{settings.recentlyPlayedIds.join(',')}</div>
      <div data-testid="active-platform">{settings.activePlatformId}</div>
      <div data-testid="c64-roms-path">{settings.platformSettings.c64.folders.gamesPath}</div>
      <div data-testid="c64-selected-game">{settings.platformSettings.c64.navigation.lastSelectedGameId}</div>
      <div data-testid="atari800-import-status">{settings.platformSettings.atari800.library.importStatus}</div>
      
      <button 
        data-testid="update-btn" 
        onClick={() => updateSettings({ screenshotsPath: 'D:/C64/Screens' })}
      >
        Change Screenshots
      </button>
      <button
        data-testid="mark-eleven-btn"
        onClick={() => {
          for (let index = 1; index <= 11; index += 1) {
            markAsPlayed(index.toString());
          }
        }}
      >
        Mark Eleven
      </button>
      <button
        data-testid="select-atari800-btn"
        onClick={() => setActivePlatform('atari800')}
      >
        Select Atari 800
      </button>
    </div>
  );
}

describe('SettingsContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('provides default settings correctly upon init', () => {
    render(
      <SettingsProvider>
        <SettingsTestComponent />
      </SettingsProvider>
    );
    
    expect(screen.getByTestId('screenshot-path').textContent).toBe('/media/screenshots/commando_1.png');
    expect(screen.getByTestId('sound-path').textContent).toBe('/media/sounds/commando.sid');
  });

  test('uses scoped folders after startup instead of later flat path updates', () => {
    render(
      <SettingsProvider>
        <SettingsTestComponent />
      </SettingsProvider>
    );

    // Initial Path
    expect(screen.getByTestId('screenshot-path').textContent).toBe('/media/screenshots/commando_1.png');

    // Perform Update
    fireEvent.click(screen.getByTestId('update-btn'));

    // Legacy flat updates are intentionally ignored after the one-way startup migration.
    expect(screen.getByTestId('screenshot-path').textContent).toBe('/media/screenshots/commando_1.png');
    
    // Ensure others were preserved (not overwritten by the partial update)
    expect(screen.getByTestId('sound-path').textContent).toBe('/media/sounds/commando.sid');
  });

  test('keeps only the 10 most recently played games', () => {
    render(
      <SettingsProvider>
        <SettingsTestComponent />
      </SettingsProvider>
    );

    fireEvent.click(screen.getByTestId('mark-eleven-btn'));

    expect(screen.getByTestId('recently-played').textContent).toBe('11,10,9,8,7,6,5,4,3,2');
  });

  test('migrates flat C64 settings into platform-scoped settings', async () => {
    window.localStorage.setItem('gb64_settings', JSON.stringify({
      romsPath: 'D:/Games/C64',
      soundsPath: 'D:/Games/C64/Music',
      musicianPhotosPath: 'D:/Games/C64/Musicians',
      screenshotsPath: 'D:/Games/C64/Screenshots',
      extrasPath: 'D:/Games/C64/Extras',
      emulatorPath: 'D:/Emulators/VICE/x64sc.exe',
      retroarchPath: 'D:/RetroArch/retroarch.exe',
      retroarchCorePath: 'D:/RetroArch/cores/vice_x64sc_libretro.dll',
      preferredEmulator: 'retroarch',
      lastSelectedGameId: '1234',
      lastFocusedIndex: 42,
      lastViewMode: 'list',
      lastBigBoxRailId: 'favorites',
      lastBigBoxGameId: '1234',
    }));

    render(
      <SettingsProvider>
        <SettingsTestComponent />
      </SettingsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('c64-roms-path').textContent).toBe('D:/Games/C64');
    });
    expect(screen.getByTestId('c64-selected-game').textContent).toBe('1234');
    expect(screen.getByTestId('active-platform').textContent).toBe('c64');
    expect(screen.getByTestId('atari800-import-status').textContent).toBe('notImported');
    const persistedSettings = JSON.parse(window.localStorage.getItem('gb64_settings') ?? '{}');
    expect(persistedSettings.romsPath).toBeUndefined();
    expect(persistedSettings.platformSettings.c64.folders.gamesPath).toBe('D:/Games/C64');
  });

  test('sets the active platform while preserving platform import state', async () => {
    render(
      <SettingsProvider>
        <SettingsTestComponent />
      </SettingsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('atari800-import-status').textContent).toBe('notImported');
    });

    fireEvent.click(screen.getByTestId('select-atari800-btn'));

    expect(screen.getByTestId('active-platform').textContent).toBe('atari800');
    expect(screen.getByTestId('atari800-import-status').textContent).toBe('notImported');
  });

  test('switches flat media paths to the active platform folder settings', async () => {
    const platformSettings = createDefaultPlatformSettingsMap();
    platformSettings.atari800.folders = {
      ...platformSettings.atari800.folders,
      gamesPath: 'E:/Atari/Games',
      musicPath: 'E:/Atari/Music',
      photosPath: 'E:/Atari/Photos',
      screenshotsPath: 'E:/Atari/Screenshots',
      extrasPath: 'E:/Atari/Extras',
    };
    window.localStorage.setItem('gb64_settings', JSON.stringify({ platformSettings }));

    render(
      <SettingsProvider>
        <SettingsTestComponent />
      </SettingsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('atari800-import-status').textContent).toBe('notImported');
    });

    fireEvent.click(screen.getByTestId('select-atari800-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('active-platform').textContent).toBe('atari800');
    });
    expect(screen.getByTestId('screenshot-path').textContent).toBe('E:/Atari/Screenshots/commando_1.png');
    expect(screen.getByTestId('sound-path').textContent).toBe('E:/Atari/Music/commando.sid');
    expect(screen.getByTestId('extras-path').textContent).toBe('E:/Atari/Extras/Cover/arkanoid.png');
  });

  test('does not overwrite C64 platform folders from flat Atari paths on restart', async () => {
    const platformSettings = createDefaultPlatformSettingsMap();
    platformSettings.c64.folders = {
      ...platformSettings.c64.folders,
      gamesPath: 'D:/GB64/Games',
      musicPath: 'D:/GB64/C64Music',
      photosPath: 'D:/GB64/Photos',
      screenshotsPath: 'D:/GB64/Screenshots',
      extrasPath: 'D:/GB64/Extras',
    };
    platformSettings.atari800.folders = {
      ...platformSettings.atari800.folders,
      gamesPath: 'E:/Atari/Games',
      musicPath: 'E:/Atari/Music',
      photosPath: 'E:/Atari/Photos',
      screenshotsPath: 'E:/Atari/Screenshots',
      extrasPath: 'E:/Atari/Extras',
    };

    window.localStorage.setItem('gb64_settings', JSON.stringify({
      activePlatformId: 'atari800',
      lastUsedPlatformId: 'atari800',
      romsPath: 'E:/Atari/Games',
      soundsPath: 'E:/Atari/Music',
      musicianPhotosPath: 'E:/Atari/Photos',
      screenshotsPath: 'E:/Atari/Screenshots',
      extrasPath: 'E:/Atari/Extras',
      platformSettings,
    }));

    render(
      <SettingsProvider>
        <SettingsTestComponent />
      </SettingsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('c64-roms-path').textContent).toBe('D:/GB64/Games');
    });
  });

  test('falls back to an imported platform on startup when the saved platform is unimported', async () => {
    window.localStorage.setItem('gb64_settings', JSON.stringify({
      activePlatformId: 'atari2600',
      lastUsedPlatformId: 'atari2600',
      platformSettings: {
        atari2600: {
          library: {
            importStatus: 'notImported',
            active: true,
          },
        },
      },
    }));

    render(
      <SettingsProvider>
        <SettingsTestComponent />
      </SettingsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('active-platform').textContent).toBe('c64');
    });
  });

  test('applies backend platform import statuses to platform settings', () => {
    const platformSettings = createDefaultPlatformSettingsMap();

    const synced = applyPlatformImportStatuses(platformSettings, [
      {
        platformId: 'atari800',
        importStatus: 'imported',
        sourceMdbPath: 'E:/Atari/Atari 800 v12.mdb',
        gameCount: 7288,
        lastImportError: null,
      },
    ]);

    expect(synced.atari800.library.importStatus).toBe('imported');
    expect(synced.atari800.library.sourceMdbPath).toBe('E:/Atari/Atari 800 v12.mdb');
    expect(synced.atari800.library.gameCount).toBe(7288);
  });

  test('ignores unsupported backend platform import status values', () => {
    const platformSettings = createDefaultPlatformSettingsMap();

    const synced = applyPlatformImportStatuses(platformSettings, [
      {
        platformId: 'atari800',
        importStatus: 'unexpected',
        gameCount: 7288,
      },
    ]);

    expect(synced.atari800.library.importStatus).toBe('notImported');
    expect(synced.atari800.library.gameCount).toBe(0);
  });

  test('scopes and restores navigation settings per active platform', async () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: ({ children }) => <SettingsProvider>{children}</SettingsProvider>
    });

    await waitFor(() => {
      expect(result.current.settings.activePlatformId).toBe('c64');
    });

    // Update C64 navigation settings
    act(() => {
      result.current.updateSettings({
        lastFocusedIndex: 12,
        lastSelectedGameId: '100',
      });
    });

    expect(result.current.settings.lastFocusedIndex).toBe(12);
    expect(result.current.settings.lastSelectedGameId).toBe('100');
    expect(result.current.settings.platformSettings.c64.navigation.lastFocusedIndex).toBe(12);
    expect(result.current.settings.platformSettings.c64.navigation.lastSelectedGameId).toBe('100');

    // Switch to Atari 800
    act(() => {
      result.current.setActivePlatform('atari800');
    });

    // Confirms it restored Atari 800 navigation defaults
    expect(result.current.settings.activePlatformId).toBe('atari800');
    expect(result.current.settings.lastFocusedIndex).toBe(0);
    expect(result.current.settings.lastSelectedGameId).toBeNull();

    // Switch back to C64
    act(() => {
      result.current.setActivePlatform('c64');
    });

    // Confirms C64 navigation settings were restored
    expect(result.current.settings.activePlatformId).toBe('c64');
    expect(result.current.settings.lastFocusedIndex).toBe(12);
    expect(result.current.settings.lastSelectedGameId).toBe('100');
  });
});
