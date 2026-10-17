import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockGames } from '../data/mockGames';
import { createDefaultPlatformSettingsMap } from '../lib/platform-capabilities';
import type { Game } from '../types/game';

function deferredGames() {
  let resolve!: (games: Game[]) => void;
  const promise = new Promise<Game[]>((done) => { resolve = done; });
  return { promise, resolve };
}

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
  platformSettings: createDefaultPlatformSettingsMap(),
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
  isDebugMode: vi.fn().mockResolvedValue(false),
}));

import { getLibraryRefreshToken, useLibraryBrowserState } from './useLibraryBrowserState';

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

  it('does not set searchQuery or clear filters when search input has fewer than 2 characters', async () => {
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
      result.current.setSearchInput('C');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    vi.useRealTimers();

    expect(result.current.filters.searchQuery).toBeUndefined();
    expect(result.current.filters.letter).toBe('A');
    expect(result.current.filters.genre).toBe('Action');
    expect(result.current.filters.subGenre).toBe('Puzzle');
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

  it('does not re-query the database when only grid focus changes', async () => {
    const { result } = renderHook(() => useLibraryBrowserState());

    await waitFor(() => expect(result.current.games).toHaveLength(mockGames.length));
    mockGetDbGames.mockClear();

    act(() => {
      result.current.setFocusedIndex(1);
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockGetDbGames).not.toHaveBeenCalled();
  });

  it('does not reload the first page after persisting a focused game', async () => {
    mockUpdateSettings.mockImplementation((updates: Partial<typeof baseSettings>) => {
      currentSettings = { ...currentSettings, ...updates };
    });
    const { result, rerender } = renderHook(() => useLibraryBrowserState());

    await waitFor(() => expect(result.current.games).toHaveLength(mockGames.length));
    mockGetDbGames.mockClear();
    mockUpdateSettings.mockClear();

    act(() => {
      result.current.setFocusedIndex(1);
    });

    await waitFor(() => expect(mockUpdateSettings).toHaveBeenCalledWith({ lastFocusedIndex: 1 }));
    rerender();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockGetDbGames).not.toHaveBeenCalled();
    expect(result.current.games).toEqual(mockGames);
  });

  it('loads a bounded first page instead of a fixed 500-row result', async () => {
    renderHook(() => useLibraryBrowserState());

    await waitFor(() => expect(mockGetDbGames).toHaveBeenCalled());
    expect(mockGetDbGames.mock.calls[0]).toEqual([
      120,
      0,
      expect.objectContaining({ hideAdult: false }),
      undefined,
    ]);
  });

  it('appends the next page when focus approaches the loaded boundary', async () => {
    const firstPage = Array.from({ length: 120 }, (_, index) => ({ ...mockGames[0], id: index + 1 }));
    mockGetDbGames.mockImplementation(async (_limit: number, offset: number) => offset === 0 ? firstPage : []);
    const { result } = renderHook(() => useLibraryBrowserState());

    await waitFor(() => expect(result.current.games).toHaveLength(120));
    act(() => result.current.setFocusedIndex(110));

    await waitFor(() => expect(mockGetDbGames).toHaveBeenCalledWith(
      120,
      120,
      expect.objectContaining({ hideAdult: false }),
      undefined,
    ));
  });

  it('loads the next page when the windowed view reaches the loaded boundary', async () => {
    const firstPage = Array.from({ length: 120 }, (_, index) => ({ ...mockGames[0], id: index + 1 }));
    const secondPage = [{ ...mockGames[0], id: 121 }];
    mockGetDbGames.mockImplementation(async (_limit: number, offset: number) => offset === 0 ? firstPage : secondPage);
    const { result } = renderHook(() => useLibraryBrowserState());

    await waitFor(() => expect(result.current.games).toHaveLength(120));

    await act(async () => {
      await result.current.loadNextPage();
    });

    expect(mockGetDbGames).toHaveBeenCalledWith(
      120,
      120,
      expect.objectContaining({ hideAdult: false }),
      undefined,
    );
    expect(result.current.games).toHaveLength(121);
  });

  it('reloads games when the active platform import status changes to imported', async () => {
    const platformSettings = createDefaultPlatformSettingsMap();
    platformSettings.atari800.library.importStatus = 'notImported';
    currentSettings = {
      ...baseSettings,
      activePlatformId: 'atari800',
      lastFocusedIndex: 0,
      platformSettings,
    };
    mockGetDbGames.mockResolvedValue([]);

    const { result, rerender } = renderHook(() => useLibraryBrowserState());

    await waitFor(() => {
      expect(mockGetDbGames).toHaveBeenCalledWith(
        120,
        0,
        expect.objectContaining({ hideAdult: false }),
        'atari800',
      );
    });
    expect(result.current.games).toEqual([]);
    mockGetDbGames.mockClear();

    const importedPlatformSettings = createDefaultPlatformSettingsMap();
    importedPlatformSettings.atari800.library = {
      ...importedPlatformSettings.atari800.library,
      importStatus: 'imported',
      gameCount: 123,
    };
    currentSettings = {
      ...baseSettings,
      activePlatformId: 'atari800',
      lastFocusedIndex: 0,
      platformSettings: importedPlatformSettings,
    };
    // The initial restore can schedule a follow-up query. Keep the imported
    // response stable so the assertion tests the platform-refresh behavior,
    // rather than depending on which queued query consumes a one-shot mock.
    mockGetDbGames.mockResolvedValue(mockGames);

    rerender();

    await waitFor(() => {
      expect(result.current.games).toHaveLength(mockGames.length);
    });
    expect(mockGetDbGames).toHaveBeenCalledWith(
      120,
      0,
      expect.objectContaining({ hideAdult: false }),
      'atari800',
    );
  });

  it('changes the library refresh token when active platform import metadata changes', () => {
    const platformSettings = createDefaultPlatformSettingsMap();
    const beforeImport = getLibraryRefreshToken({
      ...baseSettings,
      activePlatformId: 'atari800',
      platformSettings,
    });

    platformSettings.atari800.library = {
      ...platformSettings.atari800.library,
      importStatus: 'imported',
      gameCount: 123,
      lastImportedAt: '2026-07-01T22:30:00.000Z',
    };
    const afterImport = getLibraryRefreshToken({
      ...baseSettings,
      activePlatformId: 'atari800',
      platformSettings,
    });

    expect(afterImport).not.toBe(beforeImport);
    expect(afterImport).toContain('atari800');
    expect(afterImport).toContain('imported');
    expect(afterImport).toContain('123');
  });

  it.each(['platform', 'filter'] as const)('rejects an obsolete first page after a %s change', async (change) => {
    const oldPage = deferredGames();
    const newPage = [{ ...mockGames[0], id: 900 }];
    currentSettings = { ...baseSettings, activePlatformId: 'c64', lastFocusedIndex: 3 };
    mockGetDbGames.mockReturnValue(oldPage.promise);
    const { result, rerender } = renderHook(() => useLibraryBrowserState());

    mockGetDbGames.mockResolvedValue(newPage);
    if (change === 'platform') {
      currentSettings = { ...currentSettings, activePlatformId: 'atari800', lastFocusedIndex: 0 };
      rerender();
    } else {
      act(() => result.current.setFilters({ letter: 'B' }));
    }
    await waitFor(() => expect(result.current.games).toEqual(newPage));
    act(() => result.current.setFocusedIndex(0));
    await act(async () => oldPage.resolve(mockGames));

    expect(result.current.games).toEqual(newPage);
    expect(result.current.focusedIndex).toBe(0);
    expect(result.current.selectedGame).toBeNull();
  });

  it('rejects an obsolete selected-game restore lookup after switching platform', async () => {
    const restore = deferredGames();
    currentSettings = { ...baseSettings, activePlatformId: 'c64', lastSelectedGameId: '999' };
    mockGetDbGames.mockImplementation((_limit, _offset, filters) => (
      filters.favoriteIds ? restore.promise : Promise.resolve(mockGames)
    ));
    const { result, rerender } = renderHook(() => useLibraryBrowserState());
    await waitFor(() => expect(mockGetDbGames).toHaveBeenCalledWith(1, 0, { favoriteIds: ['999'] }, 'c64'));

    currentSettings = { ...baseSettings, activePlatformId: 'atari800', lastFocusedIndex: 2 };
    rerender();
    await waitFor(() => expect(result.current.focusedIndex).toBe(2));
    await act(async () => restore.resolve([{ ...mockGames[0], id: 999 }]));

    expect(result.current.selectedGame).toBeNull();
    expect(result.current.focusedIndex).toBe(2);
  });

  it.each(['platform', 'filter'] as const)('isolates next-page results and loading ownership across a %s change', async (change) => {
    const firstPage = Array.from({ length: 120 }, (_, i) => ({ ...mockGames[0], id: i + 1 }));
    const newFirstPage = firstPage.map((game) => ({ ...game, id: game.id + 1000 }));
    const oldNext = deferredGames();
    const newNext = deferredGames();
    let switched = false;
    currentSettings = { ...baseSettings, activePlatformId: 'c64' };
    mockGetDbGames.mockImplementation((_limit, offset) => offset === 0
      ? Promise.resolve(switched ? newFirstPage : firstPage)
      : (switched ? newNext.promise : oldNext.promise));
    const { result, rerender } = renderHook(() => useLibraryBrowserState());
    await waitFor(() => expect(result.current.games).toEqual(firstPage));
    let oldRequest!: Promise<void>;
    act(() => { oldRequest = result.current.loadNextPage(); });

    switched = true;
    if (change === 'platform') {
      currentSettings = { ...currentSettings, activePlatformId: 'atari800' };
      rerender();
    } else {
      act(() => result.current.setFilters({ letter: 'B' }));
    }
    await waitFor(() => expect(result.current.games).toEqual(newFirstPage));
    let newRequest!: Promise<void>;
    act(() => { newRequest = result.current.loadNextPage(); });
    const nextCalls = () => mockGetDbGames.mock.calls.filter(([, offset]) => offset === 120).length;
    expect(nextCalls()).toBe(2);

    await act(async () => { oldNext.resolve(firstPage); await oldRequest; });
    expect(result.current.games).toEqual(newFirstPage);
    await act(async () => { await result.current.loadNextPage(); });
    expect(nextCalls()).toBe(2);

    const tail = [{ ...mockGames[0], id: 2000 }];
    await act(async () => { newNext.resolve(tail); await newRequest; });
    expect(result.current.games).toEqual([...newFirstPage, ...tail]);
  });

  it('does not let an obsolete empty page disable current pagination', async () => {
    const firstPage = Array.from({ length: 120 }, (_, i) => ({ ...mockGames[0], id: i + 1 }));
    const oldNext = deferredGames();
    mockGetDbGames.mockImplementation((_limit, offset) => offset === 0
      ? Promise.resolve(firstPage) : oldNext.promise);
    const { result } = renderHook(() => useLibraryBrowserState());
    await waitFor(() => expect(result.current.games).toEqual(firstPage));
    let oldRequest!: Promise<void>;
    act(() => { oldRequest = result.current.loadNextPage(); });
    const newFirstPage = firstPage.map((game) => ({ ...game, id: game.id + 1000 }));
    mockGetDbGames.mockResolvedValue(newFirstPage);
    act(() => result.current.setFilters({ letter: 'B' }));
    await waitFor(() => expect(result.current.games).toEqual(newFirstPage));
    await act(async () => { oldNext.resolve([]); await oldRequest; });
    const tail = [{ ...mockGames[0], id: 2000 }];
    mockGetDbGames.mockResolvedValue(tail);
    await act(async () => { await result.current.loadNextPage(); });
    expect(result.current.games).toEqual([...newFirstPage, ...tail]);
  });

  it('waits for the first page before permitting pagination', async () => {
    const page = deferredGames();
    mockGetDbGames.mockReturnValue(page.promise);
    const { result } = renderHook(() => useLibraryBrowserState());
    expect(mockGetDbGames).toHaveBeenCalledTimes(1);
    act(() => { void result.current.loadNextPage(); });
    expect(mockGetDbGames).toHaveBeenCalledTimes(1);
    await act(async () => page.resolve(mockGames));
  });

  it('preserves three loaded pages and the late selection when opening and closing detail', async () => {
    const catalog = Array.from({ length: 241 }, (_, index) => ({ ...mockGames[0], id: index + 1 }));
    mockGetDbGames.mockImplementation(async (limit, offset) => catalog.slice(offset, offset + limit));
    const { result } = renderHook(() => useLibraryBrowserState());
    await waitFor(() => expect(result.current.games).toHaveLength(120));
    await act(async () => { await result.current.loadNextPage(); });
    await act(async () => { await result.current.loadNextPage(); });
    expect(result.current.games).toEqual(catalog);
    mockGetDbGames.mockClear();
    await act(async () => result.current.handleGameSelect(catalog[240]));
    expect(result.current.selectedGame).toBe(catalog[240]);
    expect(result.current.games).toEqual(catalog);
    await act(async () => result.current.closeDetail());
    expect(result.current.selectedGame).toBeNull();
    expect(result.current.focusedIndex).toBe(240);
    expect(result.current.games).toEqual(catalog);
    expect(mockGetDbGames).not.toHaveBeenCalled();
  });

  it('refreshes loaded pages when the same platform is reimported with an unchanged count', async () => {
    const platformSettings = createDefaultPlatformSettingsMap();
    platformSettings.c64.library = {
      ...platformSettings.c64.library,
      importStatus: 'imported',
      gameCount: 241,
      lastImportedAt: '2026-01-01T00:00:00Z',
    };
    currentSettings = { ...baseSettings, activePlatformId: 'c64', platformSettings };
    const catalog = Array.from({ length: 241 }, (_, index) => ({ ...mockGames[0], id: index + 1 }));
    mockGetDbGames.mockImplementation(async (limit, offset) => catalog.slice(offset, offset + limit));
    const { result, rerender } = renderHook(() => useLibraryBrowserState());
    await waitFor(() => expect(result.current.games).toHaveLength(120));
    await act(async () => { await result.current.loadNextPage(); });
    await act(async () => { await result.current.loadNextPage(); });
    const newPage = catalog.slice(0, 120).map((game) => ({ ...game, name: 'Reimported' }));
    mockGetDbGames.mockResolvedValue(newPage);
    currentSettings = {
      ...currentSettings,
      platformSettings: {
        ...platformSettings,
        c64: {
          ...platformSettings.c64,
          library: { ...platformSettings.c64.library, lastImportedAt: '2026-01-02T00:00:00Z' },
        },
      },
    };
    rerender();
    await waitFor(() => expect(result.current.games).toEqual(newPage));
  });

  it('requests sorted first and later pages instead of sorting only loaded rows', async () => {
    const firstPage = Array.from({ length: 120 }, (_, index) => ({ ...mockGames[0], id: index + 1 }));
    mockGetDbGames.mockResolvedValue(firstPage);
    const { result } = renderHook(() => useLibraryBrowserState());
    await waitFor(() => expect(result.current.games).toHaveLength(120));
    mockGetDbGames.mockClear();
    await act(async () => result.current.handleSort('year'));
    expect(result.current.effectiveFilters).toMatchObject({ sortBy: 'year', sortDirection: 'asc' });
    expect(mockGetDbGames).toHaveBeenCalledWith(120, 0, expect.objectContaining({ sortBy: 'year', sortDirection: 'asc' }), undefined);
    await act(async () => { await result.current.loadNextPage(); });
    expect(mockGetDbGames).toHaveBeenCalledWith(120, 120, expect.objectContaining({ sortBy: 'year', sortDirection: 'asc' }), undefined);
    mockGetDbGames.mockClear();
    await act(async () => result.current.handleSort('year'));
    expect(mockGetDbGames).toHaveBeenCalledWith(120, 0, expect.objectContaining({ sortBy: 'year', sortDirection: 'desc' }), undefined);
    expect(result.current.games).toHaveLength(120);
  });
});
