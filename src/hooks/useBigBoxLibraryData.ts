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
  activeRailIndex: number;
  activePlatformId: string;
  favorites: string[];
  filters: GameFilters;
  recentlyPlayedIds: Settings['recentlyPlayedIds'];
  searchInput: string;
}

const LETTER_RAIL_LOAD_DELAY_MS = 450;
const LETTER_RAIL_PAGE_SIZE = 1000;
const LETTER_RAIL_CACHE = new Map<string, Game[]>();

/** @internal Exported for unit testing */
export function getAlphabetRailCacheKey(
  letter: string,
  filters: GameFilters,
  searchInput: string,
  platformId: string = 'c64',
) {
  return JSON.stringify({
    genre: filters.genre ?? null,
    subGenre: filters.subGenre ?? null,
    hideAdult: filters.hideAdult ?? null,
    letter,
    platformId,
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

export function useBigBoxLibraryData({
  activeRailIndex,
  activePlatformId,
  favorites,
  filters,
  recentlyPlayedIds,
  searchInput,
}: UseBigBoxLibraryDataProps) {
  const [genres, setGenres] = useState<string[]>([]);
  const [subGenres, setSubGenres] = useState<string[]>([]);
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [favoriteGames, setFavoriteGames] = useState<Game[]>([]);
  const [classicGames, setClassicGames] = useState<Game[]>([]);
  const [alphabetRails, setAlphabetRails] = useState<BigBoxRailCategory[]>([]);
  const [totalGameCount, setTotalGameCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const activeLetterRequestRef = useRef(0);

  useEffect(() => {
    getGenres(activePlatformId).then(setGenres);
  }, [activePlatformId]);

  useEffect(() => {
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
  }, [activePlatformId, filters.genre]);

  useEffect(() => {
    async function initData() {
      setLoading(true);
      try {
        const query = searchInput || undefined;
        const libraryFilters = { ...filters, searchQuery: query };
        const gameCountPromise = getDbGameCount(libraryFilters, activePlatformId);

        if (recentlyPlayedIds.length > 0) {
          const recent = await getDbGames(100, 0, { ...libraryFilters, favoriteIds: recentlyPlayedIds }, activePlatformId);
          setRecentGames(sortRecentGames(recent, recentlyPlayedIds));
        } else {
          setRecentGames([]);
        }


        if (favorites.length > 0) {
          const favoriteResults = await getDbGames(100, 0, { ...libraryFilters, favoriteIds: favorites }, activePlatformId);
          setFavoriteGames(favoriteResults);
        } else {
          setFavoriteGames([]);
        }

        const classics = await getDbGames(100, 0, { ...libraryFilters, isClassic: true }, activePlatformId);
        setClassicGames(classics);

        if (!query) {
          setAlphabetRails(
            BIGBOX_LETTERS.map((letter) => ({
              id: `alpha-${letter}`,
              title: letter === '#' ? '0-9 & Symbols' : `Letter ${letter}`,
              games: LETTER_RAIL_CACHE.get(getAlphabetRailCacheKey(letter, filters, searchInput, activePlatformId)) ?? [],
              type: 'alphabet',
              letter,
            }))
          );
        } else {
          const results = await getDbGames(500, 0, libraryFilters, activePlatformId);
          setAlphabetRails([
            {
              id: 'search-results',
              title: `Results for "${query}"`,
              games: results,
              type: 'alphabet',
            },
          ]);
        }

        setTotalGameCount(await gameCountPromise);
      } catch (error) {
        console.error('BigBox init error:', error);
      } finally {
        setLoading(false);
      }
    }

    void initData();
  }, [activePlatformId, favorites, filters, recentlyPlayedIds, searchInput]);

  const rails = useMemo<BigBoxRailCategory[]>(() => {
    if (searchInput) {
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
    if (activeRailIndex === -1 || alphabetRails.length === 0) {
      return;
    }

    const currentRail = rails[activeRailIndex];
    if (!currentRail || currentRail.type !== 'alphabet' || currentRail.games.length > 0 || !currentRail.letter) {
      return;
    }

    const cacheKey = getAlphabetRailCacheKey(currentRail.letter, filters, searchInput, activePlatformId);
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
            searchQuery: searchInput || undefined,
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
  }, [activePlatformId, activeRailIndex, alphabetRails.length, filters, rails, searchInput]);

  return {
    genres,
    loading,
    rails,
    subGenres,
    totalGameCount,
  };
}
