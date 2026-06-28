"use client";

import { useEffect, useMemo, useState } from 'react';
import { getDbGames, type GameFilters } from '../lib/tauri-bridge';
import type { Game } from '../types/game';

interface UseWindowLibraryShelvesProps {
  activePlatformId: string;
  favoriteIds: string[];
  filters: GameFilters;
  recentlyPlayedIds: string[];
  searchInput: string;
}

export function useWindowLibraryShelves({
  activePlatformId,
  favoriteIds,
  filters,
  recentlyPlayedIds,
  searchInput,
}: UseWindowLibraryShelvesProps) {
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [favoriteGames, setFavoriteGames] = useState<Game[]>([]);
  const [classicGames, setClassicGames] = useState<Game[]>([]);

  useEffect(() => {
    let isCancelled = false;

    async function loadShelves() {
      const searchQuery = searchInput.trim() || undefined;

      if (recentlyPlayedIds.length > 0) {
        const recentResults = await getDbGames(24, 0, {
          ...filters,
          favoriteIds: recentlyPlayedIds,
          searchQuery,
        }, activePlatformId);

        if (!isCancelled) {
          const byId = new Map(recentResults.map((game) => [game.id.toString(), game]));
          setRecentGames(
            recentlyPlayedIds
              .map((id) => byId.get(id))
              .filter((game): game is Game => Boolean(game)),
          );
        }
      } else if (!isCancelled) {
        setRecentGames([]);
      }

      if (favoriteIds.length > 0) {
        const favorites = await getDbGames(24, 0, {
          ...filters,
          favoriteIds,
          searchQuery,
        }, activePlatformId);
        if (!isCancelled) {
          setFavoriteGames(favorites);
        }
      } else if (!isCancelled) {
        setFavoriteGames([]);
      }

      const classics = await getDbGames(24, 0, {
        ...filters,
        isClassic: true,
        searchQuery,
      }, activePlatformId);
      if (!isCancelled) {
        setClassicGames(classics);
      }
    }

    void loadShelves();

    return () => {
      isCancelled = true;
    };
  }, [activePlatformId, favoriteIds, filters, recentlyPlayedIds, searchInput]);

  return useMemo(
    () => ({
      classicGames,
      favoriteGames,
      recentGames,
    }),
    [classicGames, favoriteGames, recentGames],
  );
}
