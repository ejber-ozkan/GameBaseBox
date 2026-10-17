"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSettings, Settings } from '../contexts/SettingsContext';
import { useFavorites } from './useFavorites';
import { Game } from '../types/game';
import { GameFilters, GameSortColumn, getDbGames } from '../lib/tauri-bridge';

export type LibraryViewMode = 'grid' | 'list' | 'settings';
const LIBRARY_PAGE_SIZE = 120;
const PAGE_PREFETCH_THRESHOLD = 16;

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
  const [sortCol, setSortCol] = useState<GameSortColumn>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [searchInput, setSearchInput] = useState('');
  const [isRestored, setIsRestored] = useState(false);
  const [loadedGeneration, setLoadedGeneration] = useState(0);
  const [prevPlatformId, setPrevPlatformId] = useState(settings.activePlatformId);
  const hasMorePagesRef = useRef(false);
  const isLoadingNextPageRef = useRef(false);
  const queryGenerationRef = useRef(0);
  const shelfRef = useRef<HTMLDivElement>(null);
  const libraryRefreshToken = getLibraryRefreshToken(settings);
  const libraryEnabled = !settings.isFullscreen || viewMode === 'list';

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
  const queryFilters = useMemo(() => ({
    ...effectiveFilters,
    sortBy: sortCol,
    sortDirection: sortDir,
  }), [effectiveFilters, sortCol, sortDir]);

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
    const generation = ++queryGenerationRef.current;
    const isCurrent = () => queryGenerationRef.current === generation;
    hasMorePagesRef.current = false;
    isLoadingNextPageRef.current = false;
    if (!libraryEnabled) return;

    async function fetchGames() {
      const dbGames = await getDbGames(LIBRARY_PAGE_SIZE, 0, queryFilters, settings.activePlatformId);
      if (!isCurrent()) return;
      setGames(dbGames);
      hasMorePagesRef.current = dbGames.length === LIBRARY_PAGE_SIZE;
      setLoadedGeneration(generation);
    }

    void fetchGames();
    return () => {
      queryGenerationRef.current += 1;
    };
  }, [libraryEnabled, queryFilters, settings.activePlatformId, libraryRefreshToken]);

  useEffect(() => {
    if (!libraryEnabled || loadedGeneration !== queryGenerationRef.current) return;
    let cancelled = false;

    async function restoreSelection() {

      if (!isRestored) {
        if (settings.lastSelectedGameId) {
          const found = games.find((game) => game.id.toString() === settings.lastSelectedGameId);
          if (found) {
            setFocusedIndex(games.indexOf(found));
            setSelectedGame(found);
          } else {
            const single = await getDbGames(
              1,
              0,
              { favoriteIds: [settings.lastSelectedGameId] },
              settings.activePlatformId,
            );
            if (cancelled || loadedGeneration !== queryGenerationRef.current) return;
            if (single.length > 0) {
              setSelectedGame(single[0]);
            }
          }
        } else if (settings.lastFocusedIndex !== undefined) {
          setFocusedIndex(settings.lastFocusedIndex);
        }
        setIsRestored(true);
      } else if (!selectedGame && focusedIndex >= 0) {
        if (games.length === 0) {
          setFocusedIndex(-1);
        } else if (focusedIndex >= games.length) {
          setFocusedIndex(games.length - 1);
        }
      }
    }

    void restoreSelection();
    return () => { cancelled = true; };
  }, [
    queryFilters,
    focusedIndex,
    games,
    isRestored,
    libraryEnabled,
    loadedGeneration,
    selectedGame,
    settings.activePlatformId,
    settings.lastFocusedIndex,
    settings.lastSelectedGameId,
    libraryRefreshToken,
  ]);

  const loadNextPage = useCallback(async () => {
    if (!libraryEnabled || !hasMorePagesRef.current || isLoadingNextPageRef.current) {
      return;
    }

    isLoadingNextPageRef.current = true;
    const generation = queryGenerationRef.current;
    try {
      const nextPage = await getDbGames(
        LIBRARY_PAGE_SIZE,
        games.length,
        queryFilters,
        settings.activePlatformId,
      );
      if (generation !== queryGenerationRef.current) return;
      hasMorePagesRef.current = nextPage.length === LIBRARY_PAGE_SIZE;
      if (nextPage.length > 0) {
        setGames((current) => generation === queryGenerationRef.current ? [...current, ...nextPage] : current);
      }
    } finally {
      if (generation === queryGenerationRef.current) {
        isLoadingNextPageRef.current = false;
      }
    }
  }, [libraryEnabled, queryFilters, games.length, settings.activePlatformId]);

  useEffect(() => {
    if (focusedIndex >= games.length - PAGE_PREFETCH_THRESHOLD) {
      void loadNextPage();
    }
  }, [focusedIndex, games.length, loadNextPage]);

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
        const trimmed = searchInput.trim();
        const searchQuery = trimmed.length >= 2 ? searchInput : undefined;
        const nextFilters = { ...previous, searchQuery };
        if (searchQuery) {
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
    if (column !== 'name' && column !== 'year' && column !== 'publisher' && column !== 'parentGenre') return;
    const newDirection = sortCol === column && sortDir === 'asc' ? 'desc' : 'asc';
    setSortCol(column);
    setSortDir(newDirection);
    setFocusedIndex(0);
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
    effectiveFilters: queryFilters,
    focusedIndex,
    games,
    handleGameSelect,
    handleSort,
    loadNextPage,
    mounted,
    openTigerHeliFromSettings,
    persistWindowSize,
    searchInput,
    selectedGame,
    setFilters,
    setFocusedIndex,
    setGames,
    setSearchInput,
    setSelectedGame,
    setViewMode,
    shelfRef,
    toggleFocusedFavorite,
    viewMode,
  };
}
