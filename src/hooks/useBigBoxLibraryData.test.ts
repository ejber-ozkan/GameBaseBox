/**
 * Pure-function tests for useBigBoxLibraryData.
 *
 * These functions are extracted for testability. The React hook itself requires
 * a full happy-dom + React render cycle which exceeds available sandbox memory
 * when isolated in its own worker — so we test the deterministic logic here
 * as plain TypeScript instead.
 */
import { createElement, useState } from 'react';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getAlphabetRailCacheKey,
  getFlatLibraryLoadLimit,
  sortRecentGames,
  BIGBOX_LETTERS,
  useBigBoxLibraryData,
} from './useBigBoxLibraryData';
import { mockGames } from '../data/mockGames';
import { getDbGameCount, getDbGames, getGenres, getSubGenres } from '../lib/tauri-bridge';
import type { Game } from '../types/game';
import { useUnifiedLibraryNavigation } from './useUnifiedLibraryNavigation';
import { useGamepad } from './useGamepad';

vi.mock('./useGamepad', () => ({ useGamepad: vi.fn() }));

const EMPTY_FILTERS = {};
const FAVORITE_IDS = [mockGames[0].id.toString()];
const RECENTLY_PLAYED_IDS = [mockGames[1].id.toString()];

vi.mock('../lib/tauri-bridge', async () => {
  const { mockGames } = await import('../data/mockGames');
  return {
    getDbGameCount: vi.fn().mockResolvedValue(3),
    getDbGames: vi.fn().mockResolvedValue(mockGames.slice(0, 3)),
    getGenres: vi.fn().mockResolvedValue([]),
    getSubGenres: vi.fn().mockResolvedValue([]),
  };
});

describe('getAlphabetRailCacheKey', () => {
  it('produces a stable JSON string from letter + filters + searchInput', () => {
    const key = getAlphabetRailCacheKey('A', { genre: 'Action', hideAdult: true }, '');
    const parsed = JSON.parse(key);
    expect(parsed.letter).toBe('A');
    expect(parsed.genre).toBe('Action');
    expect(parsed.hideAdult).toBe(true);
    expect(parsed.platformId).toBe('c64');
    expect(parsed.searchInput).toBeNull();
  });

  it('stores null for undefined filter fields to keep keys stable', () => {
    const key = getAlphabetRailCacheKey('B', {}, '');
    const parsed = JSON.parse(key);
    expect(parsed.genre).toBeNull();
    expect(parsed.subGenre).toBeNull();
    expect(parsed.hideAdult).toBeNull();
  });

  it('stores null for empty searchInput to avoid spurious cache misses', () => {
    const keyEmpty = getAlphabetRailCacheKey('C', {}, '');
    const keyUndefined = getAlphabetRailCacheKey('C', {}, '');
    expect(keyEmpty).toBe(keyUndefined);
    expect(JSON.parse(keyEmpty).searchInput).toBeNull();
  });

  it('produces different keys for different letters', () => {
    const keyA = getAlphabetRailCacheKey('A', {}, '');
    const keyB = getAlphabetRailCacheKey('B', {}, '');
    expect(keyA).not.toBe(keyB);
  });

  it('produces different keys when genre changes', () => {
    const key1 = getAlphabetRailCacheKey('A', { genre: 'Action' }, '');
    const key2 = getAlphabetRailCacheKey('A', { genre: 'Adventure' }, '');
    expect(key1).not.toBe(key2);
  });

  it('produces different keys when platform changes', () => {
    const key1 = getAlphabetRailCacheKey('A', { genre: 'Action' }, '', 'c64');
    const key2 = getAlphabetRailCacheKey('A', { genre: 'Action' }, '', 'atari800');
    expect(key1).not.toBe(key2);
  });

  it('separates cached letter results by sort column and direction', () => {
    const ascending = getAlphabetRailCacheKey('A', { sortBy: 'year', sortDirection: 'asc' }, '');
    expect(ascending).not.toBe(getAlphabetRailCacheKey('A', { sortBy: 'year', sortDirection: 'desc' }, ''));
    expect(ascending).not.toBe(getAlphabetRailCacheKey('A', { sortBy: 'publisher', sortDirection: 'asc' }, ''));
  });
});

describe('sortRecentGames', () => {
  it('returns games in the order specified by recentlyPlayedIds', () => {
    const games = [mockGames[0], mockGames[1], mockGames[2]];
    const ids = [
      mockGames[2].id.toString(),
      mockGames[0].id.toString(),
      mockGames[1].id.toString(),
    ];

    const sorted = sortRecentGames(games, ids);
    expect(sorted[0].id).toBe(mockGames[2].id);
    expect(sorted[1].id).toBe(mockGames[0].id);
    expect(sorted[2].id).toBe(mockGames[1].id);
  });

  it('drops games whose id is not in recentlyPlayedIds', () => {
    const games = [mockGames[0], mockGames[1]];
    const ids = [mockGames[0].id.toString()]; // only first

    const sorted = sortRecentGames(games, ids);
    expect(sorted).toHaveLength(1);
    expect(sorted[0].id).toBe(mockGames[0].id);
  });

  it('returns an empty array when recentlyPlayedIds is empty', () => {
    expect(sortRecentGames(mockGames, [])).toEqual([]);
  });

  it('returns an empty array when games is empty', () => {
    expect(sortRecentGames([], [mockGames[0].id.toString()])).toEqual([]);
  });

  it('tolerates ids that reference games not in the list without erroring', () => {
    const nonExistentId = '999999';
    const sorted = sortRecentGames([mockGames[0]], [nonExistentId]);
    expect(sorted).toEqual([]);
  });
});

describe('BIGBOX_LETTERS', () => {
  it('starts with # and ends with Z', () => {
    expect(BIGBOX_LETTERS[0]).toBe('#');
    expect(BIGBOX_LETTERS[BIGBOX_LETTERS.length - 1]).toBe('Z');
  });

  it('contains all uppercase A–Z letters plus #', () => {
    expect(BIGBOX_LETTERS).toHaveLength(27); // # + A-Z
  });
});

describe('getFlatLibraryLoadLimit', () => {
  it('loads every matching game for the fullscreen C64 alphabet sections', () => {
    expect(getFlatLibraryLoadLimit(1_847, true)).toBe(1_847);
    expect(getFlatLibraryLoadLimit(1_847, false)).toBe(0);
  });
});

describe('useBigBoxLibraryData primary rails', () => {
  it('uses large screenshot cards for recent, favourite, and legendary rails only', async () => {
    function Probe() {
      const rails = useBigBoxLibraryData({
        activeRailIndex: -1,
        activePlatformId: 'c64',
        favorites: FAVORITE_IDS,
        filters: EMPTY_FILTERS,
        recentlyPlayedIds: RECENTLY_PLAYED_IDS,
        searchInput: '',
      }).rails;
      return createElement('output', {
        'data-testid': 'rail-scales',
      }, JSON.stringify(rails.map((rail) => ({ type: rail.type, scale: rail.scale }))));
    }

    render(createElement(Probe));

    await waitFor(() => {
      const rails = JSON.parse(screen.getByTestId('rail-scales').textContent ?? '[]') as { type: string; scale?: string }[];
      const primaryRails = rails.filter((rail) => rail.type !== 'alphabet');
      expect(primaryRails.map((rail) => rail.scale)).toEqual(['large', 'large', 'large']);
    });

    const rails = JSON.parse(screen.getByTestId('rail-scales').textContent ?? '[]') as { type: string; scale?: string }[];
    expect(rails.filter((rail) => rail.type === 'alphabet').every(
      (rail) => rail.scale === undefined,
    )).toBe(true);
  });
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

describe('useBigBoxLibraryData request lifetime', () => {
  const props: Parameters<typeof useBigBoxLibraryData>[0] = {
    activeRailIndex: -1,
    activePlatformId: 'c64',
    favorites: FAVORITE_IDS,
    filters: EMPTY_FILTERS,
    recentlyPlayedIds: RECENTLY_PLAYED_IDS,
    searchInput: 'old search',
    loadFlatLibrary: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getGenres).mockResolvedValue([]);
    vi.mocked(getSubGenres).mockResolvedValue([]);
    vi.mocked(getDbGameCount).mockResolvedValue(3);
  });

  for (const change of ['platform', 'filter', 'search'] as const) {
    it.each(['recent', 'favorites', 'classics', 'search', 'count', 'flat'] as const)(
      `ignores obsolete %s initialization after a ${change} change`, async (stage) => {
        const oldGames = deferred<Game[]>();
        const oldCount = deferred<number>();
        const oldRows = mockGames.slice(0, 3).map((game) => ({ ...game, name: `Old ${game.name}` }));
        const currentRows = mockGames.slice(0, 3).map((game) => ({ ...game, name: `Current ${game.name}` }));
        let reachedStage = false;
        const isOld = (filters: Parameters<typeof getDbGames>[2], platform?: string) => (
          change === 'platform' ? platform === 'c64'
            : change === 'filter' ? !filters?.genre : filters?.searchQuery === 'old search'
        );
        vi.mocked(getDbGameCount).mockImplementation((filters, platform) => {
          if (stage === 'count' && isOld(filters, platform)) {
            reachedStage = true;
            return oldCount.promise;
          }
          return Promise.resolve(3);
        });
        vi.mocked(getDbGames).mockImplementation((limit, _offset, filters, platform) => {
          if (!isOld(filters, platform)) return Promise.resolve(currentRows);
          const queryStage = filters?.favoriteIds === RECENTLY_PLAYED_IDS ? 'recent'
            : filters?.favoriteIds === FAVORITE_IDS ? 'favorites'
              : filters?.isClassic ? 'classics' : limit === 500 ? 'search' : 'flat';
          if (queryStage === stage) {
            reachedStage = true;
            return oldGames.promise;
          }
          return Promise.resolve(oldRows);
        });
        const initialProps = {
          ...props,
          searchInput: change === 'search' || stage === 'search' ? 'old search' : '',
        };
        const { result, rerender } = renderHook(useBigBoxLibraryData, { initialProps });
        await waitFor(() => expect(reachedStage).toBe(true));
        rerender({
          ...initialProps,
          ...(change === 'platform' ? { activePlatformId: 'atari800' }
            : change === 'filter' ? { filters: { genre: 'Action' } }
              : { searchInput: '' }),
        });
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.flatGames).toEqual(currentRows);
        const current = result.current;
        await act(async () => {
          oldGames.resolve(oldRows);
          oldCount.resolve(99);
        });
        expect(result.current).toEqual(current);
      },
    );
  }

  it('keeps the current initialization loading when obsolete initialization finishes', async () => {
    const oldGames = deferred<Game[]>();
    const currentGames = deferred<Game[]>();
    vi.mocked(getDbGames).mockImplementation((_limit, _offset, _filters, platform) => (
      platform === 'c64' ? oldGames.promise : currentGames.promise
    ));
    const { result, rerender } = renderHook(useBigBoxLibraryData, { initialProps: props });
    rerender({ ...props, activePlatformId: 'atari800' });
    await act(async () => oldGames.resolve(mockGames));
    expect(result.current.loading).toBe(true);
    await act(async () => currentGames.resolve(mockGames));
    expect(result.current.loading).toBe(false);
  });

  it('ignores obsolete platform genre responses', async () => {
    const oldGenres = deferred<string[]>();
    vi.mocked(getGenres).mockImplementation((platform) => platform === 'c64'
      ? oldGenres.promise : Promise.resolve(['Current genre']));
    vi.mocked(getDbGames).mockResolvedValue(mockGames);
    const { result, rerender } = renderHook(useBigBoxLibraryData, { initialProps: props });
    rerender({ ...props, activePlatformId: 'atari800' });
    await waitFor(() => expect(result.current.genres).toEqual(['Current genre']));
    await act(async () => oldGenres.resolve(['Old genre']));
    expect(result.current.genres).toEqual(['Current genre']);
  });
});

describe('BigBox import revision', () => {
  const emptyIds: string[] = [];
  const props = {
    activeRailIndex: 0,
    activePlatformId: 'c64',
    favorites: emptyIds,
    filters: { genre: 'Revision fixture' },
    recentlyPlayedIds: emptyIds,
    searchInput: '',
    libraryRefreshToken: 'c64:imported:361:first',
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.mocked(getGenres).mockResolvedValue([]);
    vi.mocked(getSubGenres).mockResolvedValue([]);
    vi.mocked(getDbGameCount).mockResolvedValue(361);
  });
  afterEach(() => vi.useRealTimers());

  async function loadLetter() {
    await act(async () => {});
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
  }

  it('reloads a visited letter after a same-platform same-count reimport', async () => {
    const oldRows = [{ ...mockGames[0], name: 'Old metadata' }];
    const newRows = [{ ...mockGames[0], name: 'New metadata' }];
    vi.mocked(getDbGames).mockImplementation(async (_limit, _offset, filters) => filters?.letter ? oldRows : []);
    const { result, rerender } = renderHook(useBigBoxLibraryData, { initialProps: props });
    await loadLetter();
    expect(result.current.rails[0].games).toEqual(oldRows);
    vi.mocked(getDbGames).mockImplementation(async (_limit, _offset, filters) => filters?.letter ? newRows : []);
    rerender({ ...props, libraryRefreshToken: 'c64:imported:361:second' });
    await loadLetter();
    expect(result.current.rails[0].games).toEqual(newRows);
  });

  it('rejects a pending old letter and old initialization after reimport', async () => {
    const oldLetter = deferred<Game[]>();
    const oldInit = deferred<Game[]>();
    const initialProps = { ...props, filters: { genre: 'Pending revision fixture' } };
    vi.mocked(getDbGames).mockImplementation((_limit, _offset, filters) => filters?.letter
      ? oldLetter.promise : Promise.resolve([]));
    const { result, rerender, unmount } = renderHook(useBigBoxLibraryData, { initialProps });
    await loadLetter();
    expect(getDbGames).toHaveBeenCalledWith(1000, 0, expect.objectContaining({ letter: '#' }), 'c64');
    vi.mocked(getDbGames).mockReturnValue(oldInit.promise);
    rerender({ ...initialProps, libraryRefreshToken: 'c64:imported:361:pending' });
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    const newRows = [{ ...mockGames[0], name: 'Current revision' }];
    vi.mocked(getDbGames).mockImplementation(async (_limit, _offset, filters) => filters?.letter ? newRows : []);
    rerender({ ...initialProps, libraryRefreshToken: 'c64:imported:361:current' });
    await loadLetter();
    expect(result.current.rails[0].games).toEqual(newRows);
    await act(async () => {
      oldLetter.resolve([{ ...mockGames[0], name: 'Obsolete letter' }]);
      oldInit.resolve([{ ...mockGames[0], name: 'Obsolete initialization' }]);
    });
    expect(result.current.rails[0].games).toEqual(newRows);
    // Remount to prove an obsolete request did not poison the shared cache.
    unmount();
    const revisited = renderHook(useBigBoxLibraryData, { initialProps: { ...initialProps, libraryRefreshToken: 'c64:imported:361:current' } });
    await loadLetter();
    expect(revisited.result.current.rails[0].games).toEqual(newRows);
  });
});

describe('BigBox activation', () => {
  it('issues no queries until enabled and cancels work when disabled', async () => {
    const pending = deferred<Game[]>();
    vi.clearAllMocks();
    vi.mocked(getDbGames).mockReturnValue(pending.promise);
    vi.mocked(getDbGameCount).mockResolvedValue(30000);
    vi.mocked(getGenres).mockResolvedValue([]);
    vi.mocked(getSubGenres).mockResolvedValue([]);
    const props = {
      enabled: false, activeRailIndex: 0, activePlatformId: 'c64', favorites: FAVORITE_IDS,
      recentlyPlayedIds: RECENTLY_PLAYED_IDS, filters: EMPTY_FILTERS, searchInput: '', loadFlatLibrary: true,
    };
    const { result, rerender } = renderHook(useBigBoxLibraryData, { initialProps: props });
    await act(async () => {});
    expect(getDbGames).not.toHaveBeenCalled();
    expect(getDbGameCount).not.toHaveBeenCalled();
    expect(getGenres).not.toHaveBeenCalled();
    expect(getSubGenres).not.toHaveBeenCalled();
    rerender({ ...props, enabled: true });
    expect(getDbGames).toHaveBeenCalledTimes(3);
    rerender(props);
    await act(async () => pending.resolve(mockGames));
    expect(result.current.rails).toEqual([]);
    expect(result.current.flatGames).toEqual([]);
    expect(result.current.loading).toBe(false);
  });
});

describe('BigBox complete-result continuation', () => {
  const emptyIds: string[] = [];
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.mocked(getGenres).mockResolvedValue([]);
    vi.mocked(getSubGenres).mockResolvedValue([]);
    vi.mocked(getDbGameCount).mockResolvedValue(1500);
  });
  afterEach(() => vi.useRealTimers());
  async function flushLoads() {
    await act(async () => {});
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
  }

  it.each(['search', 'letter'] as const)('continues %s beyond its first page as focus approaches the end', async (kind) => {
    const pageSize = kind === 'search' ? 500 : 1000;
    const rows = Array.from({ length: pageSize + 1 }, (_, index) => ({ ...mockGames[0], id: index + 1 }));
    vi.mocked(getDbGames).mockImplementation(async (limit, offset, filters) => filters?.isClassic ? [] : rows.slice(offset, offset + limit));
    const railId = kind === 'search' ? 'search-results' : 'alpha-#';
    const props = {
      activeRailIndex: 0, activePlatformId: 'c64', favorites: emptyIds, recentlyPlayedIds: emptyIds,
      filters: { genre: `Continue ${kind}` }, searchInput: kind === 'search' ? 'match' : '',
      railFocusIndices: { [railId]: 0 },
    };
    const { result, rerender } = renderHook(useBigBoxLibraryData, { initialProps: props });
    await flushLoads();
    expect(result.current.rails[0].games).toEqual(rows.slice(0, pageSize));
    expect(vi.mocked(getDbGames).mock.calls.every(([, offset]) => offset === 0)).toBe(true);
    const nearEnd = { ...props, railFocusIndices: { [railId]: pageSize - 16 } };
    rerender(nearEnd);
    await flushLoads();
    expect(result.current.rails[0].games).toEqual(rows);
    expect(getDbGames).toHaveBeenCalledWith(pageSize, pageSize, expect.any(Object), 'c64');
    const calls = vi.mocked(getDbGames).mock.calls.length;
    rerender({ ...props, railFocusIndices: { [railId]: pageSize } });
    await flushLoads();
    expect(vi.mocked(getDbGames).mock.calls).toHaveLength(calls);
    expect(nearEnd.railFocusIndices[railId]).toBe(pageSize - 16);
  });

  it('discards pending continuation when the query changes', async () => {
    const firstPage = Array.from({ length: 500 }, (_, index) => ({ ...mockGames[0], id: index + 1 }));
    const tail = deferred<Game[]>();
    vi.mocked(getDbGames).mockImplementation((_, offset, filters) => filters?.isClassic
      ? Promise.resolve([]) : offset === 0 ? Promise.resolve(firstPage) : tail.promise);
    const props = {
      activeRailIndex: 0, activePlatformId: 'c64', favorites: emptyIds, recentlyPlayedIds: emptyIds,
      filters: EMPTY_FILTERS, searchInput: 'old match', railFocusIndices: { 'search-results': 490 },
    };
    const { result, rerender } = renderHook(useBigBoxLibraryData, { initialProps: props });
    await flushLoads();
    expect(getDbGames).toHaveBeenCalledWith(500, 500, expect.any(Object), 'c64');
    const currentRows = [{ ...mockGames[0], id: 2000 }];
    vi.mocked(getDbGames).mockImplementation(async (_limit, _offset, filters) => filters?.isClassic ? [] : currentRows);
    rerender({ ...props, searchInput: 'new match' });
    await flushLoads();
    await act(async () => tail.resolve([{ ...mockGames[0], id: 501 }]));
    expect(result.current.rails[0].games).toEqual(currentRows);
  });

  it('deduplicates pending pages and remembers an empty final page', async () => {
    const rows = Array.from({ length: 500 }, (_, index) => ({ ...mockGames[0], id: index + 1 }));
    const end = deferred<Game[]>();
    vi.mocked(getDbGames).mockImplementation((_limit, offset, filters) => filters?.isClassic
      ? Promise.resolve([]) : offset === 0 ? Promise.resolve(rows) : end.promise);
    const props = {
      activeRailIndex: 0, activePlatformId: 'c64', favorites: emptyIds, recentlyPlayedIds: emptyIds,
      filters: EMPTY_FILTERS, searchInput: 'Exact page', railFocusIndices: { 'search-results': 490 },
    };
    const { result, rerender } = renderHook(useBigBoxLibraryData, { initialProps: props });
    await flushLoads();
    rerender({ ...props, railFocusIndices: { 'search-results': 491 } });
    await flushLoads();
    const pageCalls = () => vi.mocked(getDbGames).mock.calls.filter(([, offset]) => offset === 500).length;
    expect(pageCalls()).toBe(1);
    await act(async () => end.resolve([]));
    rerender({ ...props, railFocusIndices: { 'search-results': 0 } });
    rerender(props);
    await flushLoads();
    expect(pageCalls()).toBe(1);
    expect(result.current.rails[0].games).toEqual(rows);
  });

  it('does not continue curated shelves when focus reaches their end', async () => {
    const shelf = Array.from({ length: 100 }, (_, index) => ({ ...mockGames[0], id: index + 1 }));
    vi.mocked(getDbGames).mockResolvedValue(shelf);
    const props = {
      activeRailIndex: 0, activePlatformId: 'c64', favorites: emptyIds, recentlyPlayedIds: emptyIds,
      filters: { genre: 'Curated fixture' }, searchInput: '', railFocusIndices: { classics: 99 },
    };
    const { result } = renderHook(useBigBoxLibraryData, { initialProps: props });
    await flushLoads();
    expect(result.current.rails[0].type).toBe('classics');
    expect(result.current.rails[0].games).toEqual(shelf);
    expect(vi.mocked(getDbGames).mock.calls.every(([limit, offset]) => limit === 100 && offset === 0)).toBe(true);
  });

  it('does not continue old rows when replacement initialization fails', async () => {
    const rows = Array.from({ length: 500 }, (_, index) => ({ ...mockGames[0], id: index + 1 }));
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      vi.mocked(getDbGames).mockImplementation(async (_limit, _offset, filters) => filters?.isClassic ? [] : rows);
      const props = {
        activeRailIndex: 0, activePlatformId: 'c64', favorites: emptyIds, recentlyPlayedIds: emptyIds,
        filters: EMPTY_FILTERS, searchInput: 'Successful query', railFocusIndices: { 'search-results': 0 },
      };
      const { rerender } = renderHook(useBigBoxLibraryData, { initialProps: props });
      await flushLoads();
      vi.mocked(getDbGames).mockClear().mockRejectedValue(new Error('Query failed'));
      rerender({ ...props, searchInput: 'Failing query', railFocusIndices: { 'search-results': 490 } });
      await flushLoads();
      expect(vi.mocked(getDbGames).mock.calls.every(([, offset]) => offset === 0)).toBe(true);
    } finally {
      errorLog.mockRestore();
    }
  });

  it('preserves controller focus while appending and can open a game beyond the first search page', async () => {
    const rows = Array.from({ length: 501 }, (_, index) => ({ ...mockGames[0], id: index + 1 }));
    vi.mocked(getDbGames).mockImplementation(async (limit, offset, filters) => filters?.isClassic ? [] : rows.slice(offset, offset + limit));
    const noop = vi.fn();
    const { result } = renderHook(() => {
      const [focus, setFocus] = useState({ 'search-results': 490 });
      const [selected, setSelected] = useState<Game | null>(null);
      const data = useBigBoxLibraryData({
        activeRailIndex: 0, activePlatformId: 'c64', favorites: emptyIds, recentlyPlayedIds: emptyIds,
        filters: EMPTY_FILTERS, searchInput: 'controller continuation', railFocusIndices: focus,
      });
      useUnifiedLibraryNavigation({
        isFullscreen: true, viewMode: 'grid', setViewMode: noop, games: [], selectedGame: selected,
        handleGameSelect: setSelected, filters: EMPTY_FILTERS, setFilters: noop, setSearchInput: noop,
        focusedIndex: -1, setFocusedIndex: noop, toggleFocusedFavorite: () => false, updateSettings: noop,
        onGamepadInput: noop, activeHeaderItemIndex: 0, setActiveHeaderItemIndex: noop,
        activeHeaderRow: 0, setActiveHeaderRow: noop, activeRailIndex: 0, setActiveRailIndex: noop,
        railFocusIndices: focus, setRailFocusIndices: setFocus, rails: data.rails, genres: [],
        visibleSubGenres: [], hasOverflowSubGenres: false, gridColumns: 6,
      });
      return { ...data, focus, selected };
    });
    await flushLoads();
    expect(result.current.rails[0].games).toHaveLength(501);
    expect(result.current.focus['search-results']).toBe(490);
    for (let index = 0; index < 10; index++) {
      act(() => vi.mocked(useGamepad).mock.lastCall?.[0].onButtonDown?.('DPAD_RIGHT'));
    }
    expect(result.current.focus['search-results']).toBe(500);
    act(() => vi.mocked(useGamepad).mock.lastCall?.[0].onButtonDown?.('A'));
    expect(result.current.selected?.id).toBe(501);
  });
});
