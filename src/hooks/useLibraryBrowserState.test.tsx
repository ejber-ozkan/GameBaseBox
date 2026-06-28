import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockGames } from '../data/mockGames';

const mockUpdateSettings = vi.fn();
const mockToggleFavorite = vi.fn();
const mockGetDbGames = vi.fn();

const baseSettings = {
  activeScraper: 'emumovies',
  bigBoxAnimateVertical: true,
  confirmFullscreenExit: true,
  displayResolution: 'default',
  emulatorPath: '',
  emuMoviesPassword: '',
  emuMoviesUsername: '',
  extrasPath: '/media/extras',
  fullscreenDensity: 'auto',
  hideAdultContent: false,
  imageAnimation: 'none',
  imageCycling: true,
  isFullscreen: false,
  lastBigBoxGameId: null,
  lastBigBoxRailId: null,
  lastFocusedIndex: 0,
  lastSelectedGameId: null as string | null,
  lastViewMode: 'grid' as const,
  menuSoundEffects: true,
  mouseHoverSelection: true,
  musicianPhotosPath: '/media/musicians',
  preferredEmulator: 'vice' as const,
  recentlyPlayedIds: [] as string[],
  retroarchCorePath: '',
  retroarchPath: '',
  romsPath: '',
  scrapedMediaPath: '/media/scraped',
  screenScraperDevId: '',
  screenScraperDevPassword: '',
  screenScraperPassword: '',
  screenScraperUsername: '',
  screenshotsPath: '/media/screenshots',
  scrollNavigation: true,
  soundsPath: '/media/sounds',
  theGamesDbApiKey: '',
  windowHeight: 800,
  windowWidth: 1200,
};

let currentSettings = { ...baseSettings };

vi.mock('../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: currentSettings,
    updateSettings: mockUpdateSettings,
  }),
}));

vi.mock('./useFavorites', () => ({
  useFavorites: () => ({
    toggleFavorite: mockToggleFavorite,
  }),
}));

vi.mock('../lib/tauri-bridge', () => ({
  getDbGames: (...args: unknown[]) => mockGetDbGames(...args),
}));

import { useLibraryBrowserState } from './useLibraryBrowserState';

describe('useLibraryBrowserState', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    currentSettings = { ...baseSettings };
    mockGetDbGames.mockImplementation(async (_limit: number, _offset: number, filters?: { favoriteIds?: string[] }) => {
      if (filters?.favoriteIds?.length) {
        return mockGames.filter((game) => filters.favoriteIds?.includes(game.id.toString()));
      }
      return mockGames;
    });
  });

  it('restores the selected game and focused index from lastSelectedGameId when present', async () => {
    currentSettings = {
      ...baseSettings,
      lastSelectedGameId: '2',
      lastFocusedIndex: 3,
    };

    const { result } = renderHook(() => useLibraryBrowserState());

    await waitFor(() => {
      expect(result.current.selectedGame?.id).toBe(2);
    });

    expect(result.current.focusedIndex).toBe(1);
  });

  it('falls back to lastFocusedIndex when there is no selected game to restore', async () => {
    currentSettings = {
      ...baseSettings,
      lastFocusedIndex: 3,
      lastSelectedGameId: null,
    };

    const { result } = renderHook(() => useLibraryBrowserState());

    await waitFor(() => {
      expect(result.current.games).toHaveLength(mockGames.length);
    });

    expect(result.current.focusedIndex).toBe(3);
    expect(result.current.selectedGame).toBeNull();
  });

  it('debounces search and clears letter, genre, and subGenre when text search becomes active', async () => {
    const { result } = renderHook(() => useLibraryBrowserState());

    await waitFor(() => {
      expect(result.current.games).toHaveLength(mockGames.length);
    });

    vi.useFakeTimers();

    act(() => {
      result.current.setFilters({
        letter: 'A',
        genre: 'Action',
        subGenre: 'Puzzle',
      });
      result.current.setSearchInput('Commando');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    vi.useRealTimers();

    expect(result.current.filters.searchQuery).toBe('Commando');
    expect(result.current.filters.letter).toBeUndefined();
    expect(result.current.filters.genre).toBeUndefined();
    expect(result.current.filters.subGenre).toBeUndefined();
  });

  it('restores focus to the selected game index when closing the detail view', async () => {
    const { result } = renderHook(() => useLibraryBrowserState());

    await waitFor(() => {
      expect(result.current.games).toHaveLength(mockGames.length);
    });

    act(() => {
      result.current.handleGameSelect(mockGames[2]);
    });

    act(() => {
      result.current.setFocusedIndex(0);
    });

    act(() => {
      result.current.closeDetail();
    });

    expect(result.current.selectedGame).toBeNull();
    expect(result.current.focusedIndex).toBe(2);
  });

  it('persists window size and resets displayResolution when the preset no longer matches', async () => {
    currentSettings = {
      ...baseSettings,
      displayResolution: '1280x720',
      isFullscreen: false,
    };

    const { result } = renderHook(() => useLibraryBrowserState());

    await waitFor(() => {
      expect(result.current.games).toHaveLength(mockGames.length);
    });

    act(() => {
      result.current.persistWindowSize({ width: 1440, height: 900 });
    });

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      displayResolution: 'default',
      windowHeight: 900,
      windowWidth: 1440,
    });
  });

  it('does not persist window size updates while fullscreen is enabled', async () => {
    currentSettings = {
      ...baseSettings,
      isFullscreen: true,
    };

    const { result } = renderHook(() => useLibraryBrowserState());

    await waitFor(() => {
      expect(result.current.games).toHaveLength(mockGames.length);
    });

    mockUpdateSettings.mockClear();

    act(() => {
      result.current.persistWindowSize({ width: 1440, height: 900 });
    });

    expect(mockUpdateSettings).not.toHaveBeenCalled();
  });

  it('resets restoration and browser state when active platform changes', async () => {
    currentSettings = {
      ...baseSettings,
      activePlatformId: 'c64',
      lastSelectedGameId: '2',
      lastFocusedIndex: 3,
    };

    const { result, rerender } = renderHook(() => useLibraryBrowserState());

    await waitFor(() => {
      expect(result.current.selectedGame?.id).toBe(2);
    });

    // Mock active platform change to atari800 with its own settings
    currentSettings = {
      ...baseSettings,
      activePlatformId: 'atari800',
      lastSelectedGameId: '5',
      lastFocusedIndex: 0,
    };

    rerender();

    // Verify it loads Atari 800 games and restores Atari 800 game ID 5
    await waitFor(() => {
      expect(result.current.selectedGame?.id).toBe(5);
    });
  });
});
