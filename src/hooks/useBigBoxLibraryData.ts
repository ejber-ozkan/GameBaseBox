"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { Settings } from '../contexts/SettingsContext';
import { Game } from '../types/game';
import { GameFilters, getDbGameCount, getDbGames, getGenres, getSubGenres } from '../lib/tauri-bridge';

export const BIGBOX_LETTERS = ['#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'] as const;

export type BigBoxRailCategory = {
  id: string;
  title: string;
  games: Game[];
  type: 'recent' | 'favorites' | 'classics' | 'alphabet';
  scale?: 'large' | 'normal';
  letter?: string;
};

interface UseBigBoxLibraryDataProps {
  enabled?: boolean;
  activeRailIndex: number;
  activePlatformId: string;
  favorites: string[];
  filters: GameFilters;
  recentlyPlayedIds: Settings['recentlyPlayedIds'];
  searchInput: string;
  loadFlatLibrary?: boolean;
  libraryRefreshToken?: string;
  railFocusIndices?: Record<string, number>;
}

const LETTER_RAIL_LOAD_DELAY_MS = 450;
const LETTER_RAIL_PAGE_SIZE = 1000;
const SEARCH_PAGE_SIZE = 500;
const CONTINUATION_PREFETCH_THRESHOLD = 16;
const EMPTY_RAIL_FOCUS: Record<string, number> = {};
const LETTER_RAIL_CACHE = new Map<string, Game[]>();

/** @internal Exported for unit testing */
export function getAlphabetRailCacheKey(
  letter: string,
  filters: GameFilters,
  searchInput: string,
  platformId: string = 'c64',
  libraryRefreshToken: string = '',
) {
  return JSON.stringify({
    genre: filters.genre ?? null,
    subGenre: filters.subGenre ?? null,
    hideAdult: filters.hideAdult ?? null,
    sortBy: filters.sortBy ?? 'name',
    sortDirection: filters.sortDirection ?? 'asc',
    letter,
    platformId,
    libraryRefreshToken,
    searchInput: searchInput || null,
  });
}

/**
 * Sort a flat list of games returned by the DB into the order specified by
 * `recentlyPlayedIds`, dropping any games whose id is not in the list.
 * @internal Exported for unit testing
 */
export function sortRecentGames(games: Game[], recentlyPlayedIds: readonly string[]): Game[] {
  return recentlyPlayedIds
    .map((id) => games.find((game) => game.id.toString() === id))
    .filter((game): game is Game => Boolean(game));
}

/** @internal Exported for unit testing */
export function getFlatLibraryLoadLimit(totalGameCount: number, loadFlatLibrary: boolean) {
  return loadFlatLibrary ? totalGameCount : 0;
}

export function useBigBoxLibraryData({
  enabled = true,
  activeRailIndex,
  activePlatformId,
  favorites,
  filters,
  recentlyPlayedIds,
  searchInput,
  loadFlatLibrary = false,
  libraryRefreshToken = '',
  railFocusIndices = EMPTY_RAIL_FOCUS,
}: UseBigBoxLibraryDataProps) {
  const [genres, setGenres] = useState<string[]>([]);
  const [subGenres, setSubGenres] = useState<string[]>([]);
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [favoriteGames, setFavoriteGames] = useState<Game[]>([]);
  const [classicGames, setClassicGames] = useState<Game[]>([]);
  const [flatGames, setFlatGames] = useState<Game[]>([]);
  const [alphabetRails, setAlphabetRails] = useState<BigBoxRailCategory[]>([]);
  const [totalGameCount, setTotalGameCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const activeLetterRequestRef = useRef(0);
  const initializationGenerationRef = useRef(0);
  const completedInitializationRef = useRef(0);
  const exhaustedContinuationsRef = useRef(new Set<string>());

  useEffect(() => {
    if (!enabled) return;
    for (const key of LETTER_RAIL_CACHE.keys()) {
      const entry = JSON.parse(key) as { platformId: string; libraryRefreshToken: string };
      if (entry.platformId === activePlatformId && entry.libraryRefreshToken !== libraryRefreshToken) {
        LETTER_RAIL_CACHE.delete(key);
      }
    }
  }, [activePlatformId, enabled, libraryRefreshToken]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void getGenres(activePlatformId).then((items) => {
      if (!cancelled) setGenres(items);
    });
    return () => { cancelled = true; };
  }, [activePlatformId, enabled, libraryRefreshToken]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function loadSubGenres() {
      const items = await getSubGenres(filters.genre, activePlatformId);
      if (!cancelled) {
        setSubGenres(items);
      }
    }

    void loadSubGenres();

    return () => {
      cancelled = true;
    };
  }, [activePlatformId, enabled, filters.genre, libraryRefreshToken]);

  useEffect(() => {
    let cancelled = false;
    const generation = ++initializationGenerationRef.current;
    exhaustedContinuationsRef.current.clear();
    if (!enabled) return;

    async function initData() {
      setLoading(true);
      try {
        const query = searchInput.trim().length >= 2 ? searchInput : undefined;
        const libraryFilters = { ...filters, searchQuery: query };
        const [recent, favoriteResults, classics, gameCount] = await Promise.all([
          recentlyPlayedIds.length > 0
            ? getDbGames(100, 0, { ...libraryFilters, favoriteIds: recentlyPlayedIds }, activePlatformId)
            : Promise.resolve<Game[]>([]),
          favorites.length > 0
            ? getDbGames(100, 0, { ...libraryFilters, favoriteIds: favorites }, activePlatformId)
            : Promise.resolve<Game[]>([]),
          getDbGames(100, 0, { ...libraryFilters, isClassic: true }, activePlatformId),
          getDbGameCount(libraryFilters, activePlatformId),
        ]);
        if (cancelled) return;
        setRecentGames(sortRecentGames(recent, recentlyPlayedIds));
        setFavoriteGames(favoriteResults);
        setClassicGames(classics);

        if (!query) {
          setAlphabetRails(
            BIGBOX_LETTERS.map((letter) => ({
              id: `alpha-${letter}`,
              title: letter === '#' ? '0-9 & Symbols' : `Letter ${letter}`,
              games: LETTER_RAIL_CACHE.get(getAlphabetRailCacheKey(letter, filters, searchInput, activePlatformId, libraryRefreshToken)) ?? [],
              type: 'alphabet',
              letter,
            }))
          );
        } else {
          const results = await getDbGames(SEARCH_PAGE_SIZE, 0, libraryFilters, activePlatformId);
          if (cancelled) return;
          setAlphabetRails([
            {
              id: 'search-results',
              title: `Results for "${query}"`,
              games: results,
              type: 'alphabet',
            },
          ]);
        }

        setTotalGameCount(gameCount);
        const flatResults = loadFlatLibrary
          ? await getDbGames(getFlatLibraryLoadLimit(gameCount, true), 0, libraryFilters, activePlatformId)
          : [];
        if (cancelled) return;
        setFlatGames(flatResults);
        completedInitializationRef.current = generation;
      } catch (error) {
        if (!cancelled) console.error('BigBox init error:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void initData();
    return () => { cancelled = true; };
  }, [activePlatformId, enabled, favorites, filters, libraryRefreshToken, loadFlatLibrary, recentlyPlayedIds, searchInput]);

  const rails = useMemo<BigBoxRailCategory[]>(() => {
    const activeSearch = searchInput.trim().length >= 2 ? searchInput : undefined;
    if (activeSearch) {
      return [...alphabetRails];
    }

    const nextRails: BigBoxRailCategory[] = [];
    if (recentGames.length > 0) nextRails.push({ id: 'recent', title: 'Recent Games', games: recentGames, type: 'recent', scale: 'large' });
    if (favoriteGames.length > 0) nextRails.push({ id: 'favorites', title: 'Your Favorites', games: favoriteGames, type: 'favorites', scale: 'large' });
    if (classicGames.length > 0) nextRails.push({ id: 'classics', title: '🏆 Legendary Classics 🏆', games: classicGames, type: 'classics', scale: 'large' });
    nextRails.push(...alphabetRails);
    return nextRails;
  }, [alphabetRails, classicGames, favoriteGames, recentGames, searchInput]);

  useEffect(() => {
    if (!enabled || activeRailIndex === -1 || alphabetRails.length === 0) {
      return;
    }

    const currentRail = rails[activeRailIndex];
    if (!currentRail || currentRail.type !== 'alphabet' || currentRail.games.length > 0 || !currentRail.letter) {
      return;
    }

    const cacheKey = getAlphabetRailCacheKey(currentRail.letter, filters, searchInput, activePlatformId, libraryRefreshToken);
    const cachedGames = LETTER_RAIL_CACHE.get(cacheKey);
    if (cachedGames) {
      setAlphabetRails((previous) => {
        let changed = false;
        const next = previous.map((rail) => {
          if (rail.id !== currentRail.id || rail.games === cachedGames) {
            return rail;
          }

          changed = true;
          return { ...rail, games: cachedGames };
        });

        return changed ? next : previous;
      });
      return;
    }

    const requestId = activeLetterRequestRef.current + 1;
    activeLetterRequestRef.current = requestId;
    let cancelled = false;

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          const games = await getDbGames(LETTER_RAIL_PAGE_SIZE, 0, {
            ...filters,
            letter: currentRail.letter,
            searchQuery: searchInput.trim().length >= 2 ? searchInput : undefined,
          }, activePlatformId);

          if (cancelled || activeLetterRequestRef.current !== requestId) {
            return;
          }

          LETTER_RAIL_CACHE.set(cacheKey, games);
          setAlphabetRails((previous) => {
            let changed = false;
            const next = previous.map((rail) => {
              if (rail.id !== currentRail.id || rail.games === games) {
                return rail;
              }

              changed = true;
              return { ...rail, games };
            });

            return changed ? next : previous;
          });
        } catch (error) {
          if (!cancelled) {
            console.error(`Failed to lazy load ${currentRail.letter}:`, error);
          }
        }
      })();
    }, LETTER_RAIL_LOAD_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [activePlatformId, activeRailIndex, alphabetRails.length, enabled, filters, libraryRefreshToken, rails, searchInput]);

  const continuationRail = rails[activeRailIndex];
  const continuationPageSize = continuationRail?.letter ? LETTER_RAIL_PAGE_SIZE : SEARCH_PAGE_SIZE;
  const continuationOffset = continuationRail?.games.length ?? 0;
  const shouldContinue = enabled && !loading && continuationRail?.type === 'alphabet'
    && continuationOffset > 0 && continuationOffset % continuationPageSize === 0
    && (railFocusIndices[continuationRail.id] ?? 0) >= continuationOffset - CONTINUATION_PREFETCH_THRESHOLD;

  useEffect(() => {
    if (!shouldContinue || !continuationRail
      || completedInitializationRef.current !== initializationGenerationRef.current) return;
    const generation = initializationGenerationRef.current;
    const cacheKey = getAlphabetRailCacheKey(continuationRail.letter ?? '', filters, searchInput, activePlatformId, libraryRefreshToken);
    const requestKey = `${cacheKey}:${continuationOffset}`;
    if (exhaustedContinuationsRef.current.has(requestKey)) return;
    let cancelled = false;

    void (async () => {
      try {
        const page = await getDbGames(continuationPageSize, continuationOffset, {
          ...filters,
          ...(continuationRail.letter ? { letter: continuationRail.letter } : {}),
          searchQuery: searchInput.trim().length >= 2 ? searchInput : undefined,
        }, activePlatformId);
        if (cancelled || generation !== initializationGenerationRef.current) return;
        if (page.length < continuationPageSize) exhaustedContinuationsRef.current.add(requestKey);
        if (page.length === 0) return;
        const games = [...continuationRail.games, ...page];
        if (continuationRail.letter) LETTER_RAIL_CACHE.set(cacheKey, games);
        setAlphabetRails((previous) => previous.map((rail) => rail.id === continuationRail.id
          && rail.games.length === continuationOffset ? { ...rail, games } : rail));
      } catch (error) {
        if (!cancelled) console.error('Failed to continue library results:', error);
      }
    })();
    return () => { cancelled = true; };
  }, [activePlatformId, continuationOffset, continuationPageSize, continuationRail, filters, libraryRefreshToken, searchInput, shouldContinue]);

  return {
    genres,
    flatGames,
    loading: enabled && loading,
    rails,
    subGenres,
    totalGameCount,
  };
}
