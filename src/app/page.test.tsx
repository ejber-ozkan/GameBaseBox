import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Home from './page';
import { createDefaultPlatformSettingsMap } from '@/lib/platform-capabilities';
import type { Settings } from '@/contexts/SettingsContext';

const mockUpdateSettings = vi.fn();
const mockSetActivePlatform = vi.fn();

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
}));

let mockSettings: Settings;

describe('Home first-run setup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      expect(mockImportPlatformDatabaseFromMdb).toHaveBeenCalledWith({
        platformId: 'atari800',
        mdbPath: 'E:/Atari/Atari 800 v12.mdb',
        folderSettings: {
          gamesPath: 'E:/Atari/Games',
          musicPath: 'E:/Atari/Music',
          photosPath: 'E:/Atari/Photos',
          screenshotsPath: 'E:/Atari/Screenshots',
          extrasPath: 'E:/Atari/Extras',
        },
      });
    });
  });
});
