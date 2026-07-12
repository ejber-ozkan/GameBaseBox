import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Home from './page';
import { createDefaultPlatformSettingsMap } from '@/lib/platform-capabilities';
import type { Settings } from '@/contexts/SettingsContext';

const mockUpdateSettings = vi.fn();
const mockSetActivePlatform = vi.fn();
let isInsideSetupStateUpdater = false;

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useState: <T,>(initialState: T | (() => T)) => {
      const [value, setValue] = actual.useState(initialState);
      const guardedSetValue: typeof setValue = (nextValue) => {
        if (typeof nextValue !== 'function') {
          setValue(nextValue);
          return;
        }

        setValue((currentValue) => {
          isInsideSetupStateUpdater = true;
          try {
            return (nextValue as (current: T) => T)(currentValue);
          } finally {
            isInsideSetupStateUpdater = false;
          }
        });
      };

      return [value, guardedSetValue] as const;
    },
  };
});

vi.mock('@/contexts/SettingsContext', async () => {
  const actual = await vi.importActual<typeof import('@/contexts/SettingsContext')>('@/contexts/SettingsContext');
  return {
    ...actual,
    useSettings: () => ({
      settings: mockSettings,
      updateSettings: mockUpdateSettings,
      setActivePlatform: mockSetActivePlatform,
      resolveMediaPath: vi.fn(),
      findAllVariants: vi.fn(),
      markAsPlayed: vi.fn(),
    }),
  };
});

const mockGetDatabaseBootstrapStatus = vi.fn();
const mockImportPlatformDatabaseFromMdb = vi.fn();
const mockOpenMdbFileDialog = vi.fn();

vi.mock('@/lib/tauri-bridge', () => ({
  exitApp: vi.fn(),
  getDatabaseBootstrapStatus: () => mockGetDatabaseBootstrapStatus(),
  getGenres: vi.fn().mockResolvedValue([]),
  getSubGenres: vi.fn().mockResolvedValue([]),
  importDatabaseFromMdb: vi.fn(),
  importPlatformDatabaseFromMdb: (request: unknown) => mockImportPlatformDatabaseFromMdb(request),
  openDirectoryDialog: vi.fn(),
  openMdbFileDialog: () => mockOpenMdbFileDialog(),
  isDebugMode: vi.fn().mockResolvedValue(false),
}));

let mockSettings: Settings;

describe('Home first-run setup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isInsideSetupStateUpdater = false;
    mockUpdateSettings.mockImplementation(() => {
      if (isInsideSetupStateUpdater) {
        throw new Error('updateSettings called from inside setup state updater');
      }
    });
    mockSettings = {
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
      menuSoundEffects: true,
      bigBoxAnimateVertical: true,
      confirmFullscreenExit: true,
      lastBigBoxRailId: null,
      lastBigBoxGameId: null,
      activePlatformId: 'atari800',
      lastUsedPlatformId: 'atari800',
      platformSettings: {
        ...createDefaultPlatformSettingsMap(),
        atari800: {
          ...createDefaultPlatformSettingsMap().atari800,
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
        },
      },
    };
    mockGetDatabaseBootstrapStatus.mockResolvedValue({
      dbPath: 'mock-db',
      ready: false,
      reason: 'No database yet',
    });
    mockOpenMdbFileDialog.mockResolvedValue('E:/Atari/Atari 800 v12.mdb');
    mockImportPlatformDatabaseFromMdb.mockResolvedValue({
      platformId: 'atari800',
      dbPath: 'mock-db',
      exportedTables: 10,
      importedTables: 10,
      gameCount: 123,
    });
  });

  it('imports the selected current platform from first-run setup', async () => {
    render(<Home />);

    expect(await screen.findByRole('heading', { name: 'Build Your Atari 800 Database' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Choose MDB' }));
    await waitFor(() => expect(mockUpdateSettings).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: 'Build Database' }));

    await waitFor(() => {
      expect(mockImportPlatformDatabaseFromMdb).toHaveBeenCalledWith(expect.objectContaining({
        jobId: expect.stringMatching(/^platform-import:atari800:/),
        platformId: 'atari800',
        mdbPath: 'E:/Atari/Atari 800 v12.mdb',
        folderSettings: {
          gamesPath: 'E:/Atari/Games',
          musicPath: 'E:/Atari/Music',
          photosPath: 'E:/Atari/Photos',
          screenshotsPath: 'E:/Atari/Screenshots',
          extrasPath: 'E:/Atari/Extras',
        },
      }));
    });
  });

  it('does not persist setup changes from inside the setup state updater', async () => {
    render(<Home />);

    expect(await screen.findByRole('heading', { name: 'Build Your Atari 800 Database' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Choose MDB' }));

    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          platformSettings: expect.objectContaining({
            atari800: expect.objectContaining({
              library: expect.objectContaining({
                sourceMdbPath: 'E:/Atari/Atari 800 v12.mdb',
              }),
            }),
          }),
        }),
      );
    });
  });

  it('activates the imported platform after a fresh setup with no saved local paths', async () => {
    render(<Home />);

    expect(await screen.findByRole('heading', { name: 'Build Your Atari 800 Database' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Choose MDB' }));
    await waitFor(() => expect(mockUpdateSettings).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: 'Build Database' }));

    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          activePlatformId: 'atari800',
          lastUsedPlatformId: 'atari800',
          platformSettings: expect.objectContaining({
            c64: expect.objectContaining({
              library: expect.objectContaining({ active: false }),
            }),
            atari800: expect.objectContaining({
              library: expect.objectContaining({
                active: true,
                importStatus: 'imported',
              }),
            }),
          }),
        }),
      );
    });
  });
});
