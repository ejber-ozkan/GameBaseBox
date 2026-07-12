"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSettings, Settings } from '../contexts/SettingsContext';
import { useFavorites } from './useFavorites';
import { Game } from '../types/game';
import { GameFilters, getDbGames } from '../lib/tauri-bridge';
import { sortGames } from '../utils/sorting';

export type LibraryViewMode = 'grid' | 'list' | 'settings';

export function getLibraryRefreshToken(settings: Settings): string {
  const library = settings.platformSettings[settings.activePlatformId]?.library;
  return [
    settings.activePlatformId,
    library?.importStatus ?? 'unknown',
    library?.gameCount ?? 0,
    library?.lastImportedAt ?? '',
  ].join(':');
}

export function useLibraryBrowserState() {
  const { settings, updateSettings } = useSettings();
  const { toggleFavorite } = useFavorites();
  const [viewMode, setViewMode] = useState<LibraryViewMode>(settings.lastViewMode || 'grid');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [filters, setFilters] = useState<GameFilters>({});
  const [games, setGames] = useState<Game[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [sortCol, setSortCol] = useState<keyof Game>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [searchInput, setSearchInput] = useState('');
  const [isRestored, setIsRestored] = useState(false);
  const [prevPlatformId, setPrevPlatformId] = useState(settings.activePlatformId);
  const shelfRef = useRef<HTMLDivElement>(null);
  const libraryRefreshToken = getLibraryRefreshToken(settings);

  if (settings.activePlatformId !== prevPlatformId) {
    setPrevPlatformId(settings.activePlatformId);
    setIsRestored(false);
    setSelectedGame(null);
    setFocusedIndex(-1);
    setViewMode(settings.lastViewMode || 'grid');
  }

  const mounted = true;
  const effectiveFilters = useMemo(() => ({
    ...filters,
    hideAdult: settings.hideAdultContent,
  }), [filters, settings.hideAdultContent]);

  useEffect(() => {
    if (focusedIndex < 0 && shelfRef.current) {
      const recentCount = settings.recentlyPlayedIds.length;
      if (recentCount === 0) {
        return;
      }

      const shelfIdx = focusedIndex + recentCount;
      const child = shelfRef.current.children[shelfIdx] as HTMLElement | undefined;
      child?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [focusedIndex, settings.recentlyPlayedIds.length]);

  useEffect(() => {
    async function fetchGames() {
      const dbGames = await getDbGames(500, 0, effectiveFilters, settings.activePlatformId);
      setGames(dbGames);

      if (!isRestored) {
        if (settings.lastSelectedGameId) {
          const found = dbGames.find((game) => game.id.toString() === settings.lastSelectedGameId);
          if (found) {
            setFocusedIndex(dbGames.indexOf(found));
            setSelectedGame(found);
          } else {
            const single = await getDbGames(
              1,
              0,
              { favoriteIds: [settings.lastSelectedGameId] },
              settings.activePlatformId,
            );
            if (single.length > 0) {
              setSelectedGame(single[0]);
            }
          }
        } else if (settings.lastFocusedIndex !== undefined) {
          setFocusedIndex(settings.lastFocusedIndex);
        }
        setIsRestored(true);
      } else if (!selectedGame && focusedIndex >= 0) {
        if (dbGames.length === 0) {
          setFocusedIndex(-1);
        } else if (focusedIndex >= dbGames.length) {
          setFocusedIndex(dbGames.length - 1);
        }
      }
    }

    void fetchGames();
  }, [
    effectiveFilters,
    isRestored,
    selectedGame,
    settings.activePlatformId,
    libraryRefreshToken,
    settings.lastFocusedIndex,
    settings.lastSelectedGameId,
  ]);

  useEffect(() => {
    if (isRestored) {
      updateSettings({ lastFocusedIndex: focusedIndex >= 0 ? focusedIndex : 0 });
    }
  }, [focusedIndex, isRestored, updateSettings]);

  useEffect(() => {
    if (isRestored) {
      updateSettings({
        lastSelectedGameId: selectedGame?.id.toString() || null,
        lastViewMode: viewMode === 'settings' ? settings.lastViewMode : viewMode,
      });
    }
  }, [isRestored, selectedGame, settings.lastViewMode, updateSettings, viewMode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((previous) => {
        const nextFilters = { ...previous, searchQuery: searchInput || undefined };
        if (searchInput.trim()) {
          nextFilters.letter = undefined;
          nextFilters.genre = undefined;
          nextFilters.subGenre = undefined;
        }
        return nextFilters;
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const closeDetail = useCallback(() => {
    if (selectedGame) {
      const selectedIndex = games.findIndex((game) => game.id === selectedGame.id);
      if (selectedIndex >= 0) {
        setFocusedIndex(selectedIndex);
      }
    }
    setSelectedGame(null);
  }, [games, selectedGame]);

  const handleGameSelect = useCallback((game: Game) => {
    const selectedIndex = games.findIndex((candidate) => candidate.id === game.id);
    if (selectedIndex >= 0) {
      setFocusedIndex(selectedIndex);
    }
    setSelectedGame(game);
  }, [games]);

  const getFocusedLibraryGame = useCallback((): Game | null => {
    const recentCount = settings.recentlyPlayedIds.length;

    if (focusedIndex < 0) {
      const recentId = settings.recentlyPlayedIds[recentCount + focusedIndex];
      return games.find((game) => game.id.toString() === recentId) ?? null;
    }

    if (focusedIndex >= 0 && focusedIndex < games.length) {
      return games[focusedIndex];
    }

    return null;
  }, [focusedIndex, games, settings.recentlyPlayedIds]);

  const toggleFocusedFavorite = useCallback(() => {
    const focusedGame = getFocusedLibraryGame();
    if (!focusedGame) {
      return false;
    }

    toggleFavorite(focusedGame.id.toString());
    return true;
  }, [getFocusedLibraryGame, toggleFavorite]);

  const openTigerHeliFromSettings = useCallback(async () => {
    const tigerHeli = await getDbGames(1, 0, { favoriteIds: ['7933'] }, settings.activePlatformId);
    const game = tigerHeli[0];
    if (!game) {
      console.warn('Tiger Heli (7933) was not found in the local database.');
      return;
    }

    setViewMode('grid');
    handleGameSelect(game);
  }, [handleGameSelect, settings.activePlatformId]);

  const handleSort = useCallback((column: keyof Game) => {
    const newDirection = sortCol === column && sortDir === 'asc' ? 'desc' : 'asc';
    setSortCol(column);
    setSortDir(newDirection);
    setGames((previous) => sortGames(previous, column, newDirection));
  }, [sortCol, sortDir]);

  const persistWindowSize = useCallback((size: { width: number; height: number }) => {
    if (settings.isFullscreen) {
      return;
    }

    const config: Partial<Settings> = {
      windowWidth: size.width,
      windowHeight: size.height,
    };

    if (settings.displayResolution !== 'default') {
      const [presetWidth, presetHeight] = settings.displayResolution.split('x').map(Number);
      if (presetWidth !== size.width || presetHeight !== size.height) {
        config.displayResolution = 'default';
      }
    }

    updateSettings(config);
  }, [settings.displayResolution, settings.isFullscreen, updateSettings]);

  return {
    closeDetail,
    filters,
    effectiveFilters,
    focusedIndex,
    games,
    handleGameSelect,
    handleSort,
    mounted,
    openTigerHeliFromSettings,
    persistWindowSize,
    searchInput,
    selectedGame,
    setFilters,
    setFocusedIndex,
    setSearchInput,
    setSelectedGame,
    setViewMode,
    shelfRef,
    toggleFocusedFavorite,
    viewMode,
  };
}
