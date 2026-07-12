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

      const recentQuery = recentlyPlayedIds.length > 0
        ? getDbGames(24, 0, {
          ...filters,
          favoriteIds: recentlyPlayedIds,
          searchQuery,
        }, activePlatformId)
        : Promise.resolve<Game[]>([]);
      const favoritesQuery = favoriteIds.length > 0
        ? getDbGames(24, 0, {
          ...filters,
          favoriteIds,
          searchQuery,
        }, activePlatformId)
        : Promise.resolve<Game[]>([]);
      const classicsQuery = getDbGames(24, 0, {
        ...filters,
        isClassic: true,
        searchQuery,
      }, activePlatformId);

      const [recentResults, favorites, classics] = await Promise.all([
        recentQuery,
        favoritesQuery,
        classicsQuery,
      ]);
      if (!isCancelled) {
        const byId = new Map(recentResults.map((game) => [game.id.toString(), game]));
        setRecentGames(
          recentlyPlayedIds
            .map((id) => byId.get(id))
            .filter((game): game is Game => Boolean(game)),
        );
        setFavoriteGames(favorites);
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
