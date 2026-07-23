"use client";

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { exitApp, type GameFilters } from '../lib/tauri-bridge';
import { useGamepad } from './useGamepad';
import type { Game } from '../types/game';
import type { Settings } from '../contexts/SettingsContext';
import type { LibraryViewMode } from './useLibraryBrowserState';
import type { BigBoxRailCategory } from './useBigBoxLibraryData';
import { BIGBOX_LETTERS } from './useBigBoxLibraryData';
import {
  calculateDownNavigation,
  calculateLeftNavigation,
  calculateRightNavigation,
  calculateUpNavigation,
  NavigationParams,
  NavigationState,
} from './navigation-math';
import {
  getLibraryColumnCount,
  getNextLetterJump,
  moveLibraryFocusHorizontally,
  moveLibraryFocusVertically,
  resolveFocusedGame,
} from '../lib/library-navigation';

const LETTERS = ['#', ...Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index))];

type KeyEventLike = { key: string; shiftKey?: boolean; altKey?: boolean; };
type SectionJumpDirection = 'up' | 'down' | null;

export interface UseUnifiedLibraryNavigationProps {
  // Common Props
  isFullscreen: boolean;
  viewMode: LibraryViewMode;
  setViewMode: Dispatch<SetStateAction<LibraryViewMode>>;
  games: Game[];
  selectedGame: Game | null;
  handleGameSelect: (game: Game | null) => void;
  filters: GameFilters;
  setFilters: Dispatch<SetStateAction<GameFilters>>;
  setSearchInput: (value: string) => void;
  focusedIndex: number;
  setFocusedIndex: Dispatch<SetStateAction<number>>;
  toggleFocusedFavorite: () => boolean;
  updateSettings: (settings: Partial<Settings>) => void;
  onGamepadInput: () => void;

  // Fullscreen / BigBox Mode Specific Props
  activeHeaderItemIndex: number;
  setActiveHeaderItemIndex: Dispatch<SetStateAction<number>>;
  activeHeaderRow: number;
  setActiveHeaderRow: Dispatch<SetStateAction<number>>;
  activeRailIndex: number;
  setActiveRailIndex: Dispatch<SetStateAction<number>>;
  railFocusIndices: Record<string, number>;
  setRailFocusIndices: Dispatch<SetStateAction<Record<string, number>>>;
  rails: BigBoxRailCategory[];
  genres: string[];
  visibleSubGenres: string[];
  hasOverflowSubGenres: boolean;
  gridColumns: number;
  onOpenSubGenrePicker?: () => void;
  onOpenControllerKeyboard?: () => void;
  onShowSettings?: () => void;
  onBack?: () => void;
  onPlatformCycle?: () => void;
  platformSwitcherEnabled?: boolean;
  onGenreSelect?: () => void;
  onLetterJump?: () => void;
  onNavigationMove?: () => void;
  persistWindowSize?: (size: { width: number; height: number }) => void;
  scrollNavigation?: boolean;
  recentlyPlayedIds?: string[];
  onFocusSearchInput?: () => void;
  onSelectRandomGame?: () => void;
}

export function useUnifiedLibraryNavigation({
  isFullscreen,
  viewMode,
  setViewMode,
  games,
  selectedGame,
  handleGameSelect,
  filters,
  setFilters,
  setSearchInput,
  focusedIndex,
  setFocusedIndex,
  toggleFocusedFavorite,
  updateSettings,
  onGamepadInput,
  activeHeaderItemIndex,
  setActiveHeaderItemIndex,
  activeHeaderRow,
  setActiveHeaderRow,
  activeRailIndex,
  setActiveRailIndex,
  railFocusIndices,
  setRailFocusIndices,
  rails,
  genres,
  visibleSubGenres,
  hasOverflowSubGenres,
  gridColumns,
  onOpenSubGenrePicker,
  onOpenControllerKeyboard,
  onShowSettings,
  onBack,
  onPlatformCycle,
  platformSwitcherEnabled = false,
  onGenreSelect,
  onLetterJump,
  onNavigationMove,
  persistWindowSize,
  scrollNavigation = true,
  recentlyPlayedIds = [],
  onFocusSearchInput,
  onSelectRandomGame,
}: UseUnifiedLibraryNavigationProps) {
  const [sectionJumpDirection, setSectionJumpDirection] = useState<SectionJumpDirection>(null);

  const currentRail = activeRailIndex >= 0 ? rails[activeRailIndex] : null;
  const currentFocusedIndex = currentRail ? (railFocusIndices[currentRail.id] ?? 0) : 0;
  const currentRailId = currentRail?.id ?? null;
  const currentRailType = currentRail?.type ?? null;

  // 1. Helper Focus Functions (used in Fullscreen)
  const focusHeader = useCallback((row: number, index: number) => {
    setSectionJumpDirection(null);
    setActiveRailIndex(-1);
    setActiveHeaderRow(row);
    setActiveHeaderItemIndex(index);
  }, [setActiveHeaderItemIndex, setActiveHeaderRow, setActiveRailIndex]);

  const focusSearch = useCallback(() => {
    focusHeader(0, 0);
  }, [focusHeader]);

  const jumpToRail = useCallback((railId: string) => {
    const targetRailIndex = rails.findIndex((rail) => rail.id === railId);
    if (targetRailIndex !== -1) {
      setSectionJumpDirection(null);
      setActiveRailIndex(targetRailIndex);
      return;
    }

    const c64LibraryIndex = rails.findIndex((rail) => rail.id === 'c64-library');
    if (c64LibraryIndex === -1 || !railId.startsWith('alpha-')) {
      return;
    }

    const c64Library = rails[c64LibraryIndex];
    const letter = railId.slice('alpha-'.length);
    const gameIndex = c64Library.games.findIndex((game) => {
      const firstCharacter = game.name.trim().charAt(0).toUpperCase();
      return letter === '#' ? !/[A-Z]/.test(firstCharacter) : firstCharacter === letter;
    });

    setSectionJumpDirection(null);
    setActiveRailIndex(c64LibraryIndex);
    if (gameIndex >= 0) {
      setRailFocusIndices((previous) => ({ ...previous, [c64Library.id]: gameIndex }));
    }
  }, [rails, setActiveRailIndex, setRailFocusIndices]);

  const focusRailItem = useCallback((railIndex: number, railId: string, gameIndex: number) => {
    setSectionJumpDirection(null);
    setActiveRailIndex(railIndex);
    setRailFocusIndices((previous) => ({ ...previous, [railId]: gameIndex }));
  }, [setActiveRailIndex, setRailFocusIndices]);

  const moveToNextPopulatedRail = useCallback((startIndex: number, direction: 'up' | 'down') => {
    const step = direction === 'down' ? 1 : -1;
    for (let index = startIndex + step; index >= 0 && index < rails.length; index += step) {
      const rail = rails[index];
      if (rail.games.length > 0) {
        setActiveRailIndex(index);
        setRailFocusIndices((previous) => ({ ...previous, [rail.id]: 0 }));
        setSectionJumpDirection(direction);
        return true;
      }
    }
    return false;
  }, [rails, setActiveRailIndex, setRailFocusIndices]);

  const hasSubGenres = Boolean(filters.genre && (visibleSubGenres.length > 0 || hasOverflowSubGenres));
  const jumpRowIndex = hasSubGenres ? 3 : 2;
  const getHeaderRowType = useCallback((row: number) => {
    if (row === 0) return 'top';
    if (row === 1) return 'genre';
    if (hasSubGenres && row === 2) return 'subGenre';
    return 'jump';
  }, [hasSubGenres]);

  const focusTopMenu = useCallback(() => {
    setSectionJumpDirection(null);
    setActiveRailIndex(-1);
    setActiveHeaderItemIndex(0);

    if (activeRailIndex !== -1) {
      setActiveHeaderRow(0);
      return;
    }

    if (activeHeaderRow === 0) {
      setActiveHeaderRow(1);
      return;
    }

    if (activeHeaderRow === 1) {
      setActiveHeaderRow(hasSubGenres ? 2 : jumpRowIndex);
      return;
    }

    if (hasSubGenres && activeHeaderRow === 2) {
      setActiveHeaderRow(jumpRowIndex);
      return;
    }

    setActiveHeaderRow(0);
  }, [
    activeHeaderRow,
    activeRailIndex,
    hasSubGenres,
    jumpRowIndex,
    setActiveHeaderItemIndex,
    setActiveHeaderRow,
    setActiveRailIndex,
  ]);

  // 2. Main Key Down handler (combined)
  const handleKeyDown = useCallback((event: KeyEventLike) => {
    if (document.activeElement?.tagName === 'INPUT') return;

    if (!isFullscreen) {
      // ---------------- WINDOWED KEYBOARD NAVIGATION ----------------
      if ((event.key === 'f' || event.key === 'F') && !event.shiftKey) {
        if (!selectedGame && viewMode !== 'settings' && toggleFocusedFavorite()) {
          if ('preventDefault' in event) (event as KeyboardEvent).preventDefault();
          return;
        }
      }
      if (event.key === 's' || event.key === 'S') {
        setViewMode('settings');
      }
      if (event.key === 'v' || event.key === 'V') {
        setViewMode((previous) => (previous === 'grid' ? 'list' : 'grid'));
      }
      if (event.key === 'Enter' && 'altKey' in event && (event as KeyboardEvent).altKey) {
        if ('preventDefault' in event) (event as KeyboardEvent).preventDefault();
        updateSettings({ isFullscreen: true });
      }

      if (event.key === 'PageDown' || event.key === 'PageUp') {
        if ('preventDefault' in event) (event as KeyboardEvent).preventDefault();
        setFilters((previous) => ({
          ...previous,
          letter: getNextLetterJump(
            previous.letter,
            event.key === 'PageDown' ? 'forward' : 'backward',
            LETTERS,
          ),
          searchQuery: undefined,
        }));
        setSearchInput('');
      }

      if (!selectedGame && viewMode !== 'settings') {
        const columns = getLibraryColumnCount(viewMode);
        const recentCount = recentlyPlayedIds.length;
        const minIndex = recentCount > 0 ? -recentCount : 0;
        const maxIndex = games.length - 1;

        if (event.key === 'ArrowRight') {
          if ('preventDefault' in event) (event as KeyboardEvent).preventDefault();
          setFocusedIndex((previous) =>
            moveLibraryFocusHorizontally(previous, 'RIGHT', minIndex, maxIndex),
          );
        }
        if (event.key === 'ArrowLeft') {
          if ('preventDefault' in event) (event as KeyboardEvent).preventDefault();
          setFocusedIndex((previous) =>
            moveLibraryFocusHorizontally(previous, 'LEFT', minIndex, maxIndex),
          );
        }
        if (event.key === 'ArrowDown') {
          if ('preventDefault' in event) (event as KeyboardEvent).preventDefault();
          setFocusedIndex((previous) =>
            moveLibraryFocusVertically(previous, 'DOWN', columns, recentCount, maxIndex),
          );
        }
        if (event.key === 'ArrowUp') {
          if ('preventDefault' in event) (event as KeyboardEvent).preventDefault();
          setFocusedIndex((previous) =>
            moveLibraryFocusVertically(previous, 'UP', columns, recentCount, maxIndex),
          );
        }
        if (event.key === 'Enter') {
          if ('preventDefault' in event) (event as KeyboardEvent).preventDefault();
          const focusedGame = resolveFocusedGame(focusedIndex, games, recentlyPlayedIds);
          if (focusedGame) {
            handleGameSelect(focusedGame);
          }
        }
      }
    } else {
      // ---------------- FULLSCREEN KEYBOARD NAVIGATION ----------------
      const activeElementTag = document.activeElement?.tagName;
      const isInputFocused = activeElementTag === 'INPUT';
      const isSelectFocused = activeElementTag === 'SELECT';
      const topRowCount = platformSwitcherEnabled ? 4 : 3;
      const rowCounts = hasSubGenres
        ? [topRowCount, genres.length, visibleSubGenres.length + (hasOverflowSubGenres ? 1 : 0), BIGBOX_LETTERS.length]
        : [topRowCount, genres.length, BIGBOX_LETTERS.length];

      if (isSelectFocused) {
        if (event.key === 'Escape') {
          (document.activeElement as HTMLElement).blur();
        }
        return;
      }

      if (isInputFocused) {
        if (event.key === 'Escape') {
          (document.activeElement as HTMLElement).blur();
          return;
        }
        if (event.key === 'ArrowDown') {
          (document.activeElement as HTMLElement).blur();
          setActiveHeaderRow(1);
          setActiveHeaderItemIndex(0);
        }
        return;
      }

      const isHeaderActive = activeRailIndex === -1;
      const rail = rails[activeRailIndex];
      const focusedIndex = rail ? (railFocusIndices[rail.id] ?? 0) : 0;
      if (!isHeaderActive && !rail) {
        setSectionJumpDirection(null);
        setActiveRailIndex(-1);
        setActiveHeaderRow(jumpRowIndex);
        setActiveHeaderItemIndex(0);
        return;
      }

      if (event.key === 'LT') {
        onNavigationMove?.();
        focusTopMenu();
        return;
      }

      const navigationState: NavigationState = {
        activeHeaderItemIndex,
        activeHeaderRow,
        activeRailIndex,
        railFocusIndices,
        sectionJumpDirection,
      };

      const navigationParams: NavigationParams = {
        rowCounts,
        rails: rails.map((r) => ({ id: r.id, length: r.games.length, isGrid: r.type === 'alphabet' })),
        gridColumns,
        jumpRowIndex,
      };

      const applyNavigationResult = (result: { state: NavigationState; moved: boolean }) => {
        if (result.moved) {
          onNavigationMove?.();
          setActiveHeaderItemIndex(result.state.activeHeaderItemIndex);
          setActiveHeaderRow(result.state.activeHeaderRow);
          setActiveRailIndex(result.state.activeRailIndex);
          setRailFocusIndices(result.state.railFocusIndices);
          setSectionJumpDirection(result.state.sectionJumpDirection);
        }
      };

      if (event.key === 'ArrowDown') {
        applyNavigationResult(calculateDownNavigation(navigationState, navigationParams));
        return;
      }

      if (event.key === 'ArrowUp') {
        if (isHeaderActive && activeHeaderRow === 0) {
          return;
        }
        const result = calculateUpNavigation(navigationState, navigationParams);
        if (result.moved && result.state.activeRailIndex === -1 && activeRailIndex !== -1) {
          onNavigationMove?.();
          focusHeader(jumpRowIndex, 0);
        } else {
          applyNavigationResult(result);
        }
        return;
      }

      if (event.key === 'ArrowRight') {
        applyNavigationResult(calculateRightNavigation(navigationState, navigationParams));
        return;
      }

      if (event.key === 'ArrowLeft') {
        applyNavigationResult(calculateLeftNavigation(navigationState, navigationParams));
        return;
      }

      if (event.key === 'LB_RB_RIGHT') {
        if (isHeaderActive) {
          if (activeHeaderRow < jumpRowIndex) {
            onNavigationMove?.();
            setActiveHeaderRow((previous) => previous + 1);
            setActiveHeaderItemIndex(0);
          } else if (moveToNextPopulatedRail(-1, 'down')) {
            onNavigationMove?.();
          }
        } else if (moveToNextPopulatedRail(activeRailIndex, 'down')) {
          onNavigationMove?.();
        }
        return;
      }

      if (event.key === 'LB_RB_LEFT') {
        if (isHeaderActive) {
          if (activeHeaderRow > 0) {
            onNavigationMove?.();
            setActiveHeaderRow((previous) => previous - 1);
            setActiveHeaderItemIndex(0);
          }
        } else if (activeRailIndex === 0) {
          onNavigationMove?.();
          focusHeader(jumpRowIndex, 0);
        } else if (moveToNextPopulatedRail(activeRailIndex, 'up')) {
          onNavigationMove?.();
        }
        return;
      }

      if (event.key === 'Enter' || event.key === 'a' || event.key === 'A') {
        if (isHeaderActive) {
          const rowType = getHeaderRowType(activeHeaderRow);
          if (rowType === 'top') {
            if (activeHeaderItemIndex === 0) {
              if (onFocusSearchInput) onFocusSearchInput();
            } else if (platformSwitcherEnabled && activeHeaderItemIndex === 1) {
              if (onPlatformCycle) onPlatformCycle();
            } else if (activeHeaderItemIndex === (platformSwitcherEnabled ? 2 : 1)) {
              if (onShowSettings) onShowSettings();
            } else if (activeHeaderItemIndex === (platformSwitcherEnabled ? 3 : 2)) {
              void exitApp();
            }
          } else if (rowType === 'genre') {
            if (onGenreSelect) onGenreSelect();
            const genre = genres[activeHeaderItemIndex];
            setFilters((previous) => ({
              ...previous,
              genre: previous.genre === genre ? undefined : genre,
              subGenre: undefined,
            }));
            setSectionJumpDirection(null);
            setActiveRailIndex(0);
          } else if (rowType === 'subGenre') {
            if (hasOverflowSubGenres && activeHeaderItemIndex === visibleSubGenres.length) {
              if (onOpenSubGenrePicker) onOpenSubGenrePicker();
              return;
            }

            const subGenre = visibleSubGenres[activeHeaderItemIndex];
            if (!subGenre) {
              return;
            }
            setFilters((previous) => ({
              ...previous,
              subGenre: previous.subGenre === subGenre ? undefined : subGenre,
            }));
            setSectionJumpDirection(null);
            setActiveRailIndex(0);
          } else {
            if (onLetterJump) onLetterJump();
            jumpToRail(`alpha-${BIGBOX_LETTERS[activeHeaderItemIndex]}`);
          }
          return;
        }

        const game = rail?.games[focusedIndex];
        if (game) {
          handleGameSelect(game);
        }
        return;
      }

      if (event.key === 'f' || event.key === 'F') {
        const game = rail?.games[focusedIndex];
        if (game) {
          toggleFocusedFavorite();
        }
      }
    }
  }, [
    isFullscreen,
    viewMode,
    setViewMode,
    games,
    selectedGame,
    handleGameSelect,
    setFilters,
    focusedIndex,
    setFocusedIndex,
    toggleFocusedFavorite,
    updateSettings,
    activeHeaderItemIndex,
    setActiveHeaderItemIndex,
    activeHeaderRow,
    setActiveHeaderRow,
    activeRailIndex,
    setActiveRailIndex,
    railFocusIndices,
    rails,
    genres,
    visibleSubGenres,
    hasOverflowSubGenres,
    gridColumns,
    onOpenSubGenrePicker,
    onShowSettings,
    onPlatformCycle,
    platformSwitcherEnabled,
    onGenreSelect,
    onLetterJump,
    onNavigationMove,
    recentlyPlayedIds,
    setSearchInput,
    jumpToRail,
    focusHeader,
    focusTopMenu,
    getHeaderRowType,
    hasSubGenres,
    jumpRowIndex,
    moveToNextPopulatedRail,
    onFocusSearchInput,
    sectionJumpDirection,
    setRailFocusIndices,
  ]);

  // Handle keyboard listener binding
  useEffect(() => {
    const handleWindowKeyDown = (event: KeyboardEvent) => {
      handleKeyDown(event);
    };

    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [handleKeyDown]);

  // 3. Gamepad Button listener mapping
  useGamepad({
    onButtonDown: (button) => {
      onGamepadInput();

      if (!isFullscreen) {
        // ---------------- WINDOWED GAMEPAD TRAVERSAL ----------------
        if (button === 'Y') {
          if (!selectedGame && viewMode !== 'settings') {
            toggleFocusedFavorite();
          }
        }
        if (button === 'X') setViewMode((previous) => (previous === 'grid' ? 'list' : 'grid'));
        if (button === 'START') setViewMode('settings');
        if (button === 'SELECT' || button === 'RT') {
          if (onSelectRandomGame) onSelectRandomGame();
        }
        if (button === 'B') {
          if (selectedGame) handleGameSelect(null); // back out of detail
        }

        if (button === 'RB' || button === 'LB') {
          const nextLetter = getNextLetterJump(filters.letter, button === 'RB' ? 'forward' : 'backward', LETTERS);
          setFilters((previous) => ({ ...previous, letter: nextLetter, searchQuery: undefined }));
          setSearchInput('');
        }

        if (!selectedGame && viewMode !== 'settings') {
          const columns = getLibraryColumnCount(viewMode);
          const recentCount = recentlyPlayedIds.length;
          const minIndex = recentCount > 0 ? -recentCount : 0;
          const maxIndex = games.length - 1;

          if (button === 'RIGHT') {
            setFocusedIndex((previous) =>
              moveLibraryFocusHorizontally(previous, 'RIGHT', minIndex, maxIndex),
            );
          }
          if (button === 'LEFT') {
            setFocusedIndex((previous) =>
              moveLibraryFocusHorizontally(previous, 'LEFT', minIndex, maxIndex),
            );
          }
          if (button === 'DOWN') {
            setFocusedIndex((previous) =>
              moveLibraryFocusVertically(previous, 'DOWN', columns, recentCount, maxIndex),
            );
          }
          if (button === 'UP') {
            setFocusedIndex((previous) =>
              moveLibraryFocusVertically(previous, 'UP', columns, recentCount, maxIndex),
            );
          }
          if (button === 'A') {
            const focusedGame = resolveFocusedGame(focusedIndex, games, recentlyPlayedIds);
            if (focusedGame) {
              handleGameSelect(focusedGame);
            }
          }
        }
      } else {
        // ---------------- FULLSCREEN GAMEPAD TRAVERSAL ----------------
        const isSearchSelected =
          activeRailIndex === -1 &&
          activeHeaderRow === 0 &&
          activeHeaderItemIndex === 0 &&
          document.activeElement?.tagName !== 'INPUT';

        if (button === 'DPAD_UP' || button === 'UP') handleKeyDown({ key: 'ArrowUp' });
        if (button === 'DPAD_DOWN' || button === 'DOWN') handleKeyDown({ key: 'ArrowDown' });
        if (button === 'DPAD_LEFT' || button === 'LEFT') handleKeyDown({ key: 'ArrowLeft' });
        if (button === 'DPAD_RIGHT' || button === 'RIGHT') handleKeyDown({ key: 'ArrowRight' });
        if (button === 'LB') handleKeyDown({ key: 'LB_RB_LEFT' });
        if (button === 'RB') handleKeyDown({ key: 'LB_RB_RIGHT' });
        if (button === 'LT') handleKeyDown({ key: 'LT' });
        if (button === 'A') {
          if (isSearchSelected && onOpenControllerKeyboard) {
            onOpenControllerKeyboard();
          } else {
            handleKeyDown({ key: 'Enter' });
          }
        }
        if (button === 'Y') handleKeyDown({ key: 'F' });
        if (button === 'SELECT' || button === 'RT') {
          if (onSelectRandomGame) onSelectRandomGame();
        }
        if (button === 'START' && onShowSettings) onShowSettings();
        if (button === 'B') {
          if (document.activeElement?.tagName === 'INPUT') {
            (document.activeElement as HTMLElement).blur();
          } else if (onBack) {
            onBack();
          }
        }
      }
    },
  });

  // 4. Windowed Wheel and Resize listeners (de-registered in Fullscreen)
  useEffect(() => {
    if (isFullscreen) return;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        if (persistWindowSize) {
          const { getWindowSize } = await import('../lib/tauri-bridge');
          const size = await getWindowSize();
          if (size) {
            persistWindowSize(size);
          }
        }
      }, 500);
    };

    const handleWheel = (event: WheelEvent) => {
      if (!scrollNavigation || selectedGame || viewMode === 'settings') return;
      if (event.target instanceof Element && event.target.closest('[data-library-scroll-container]')) return;

      const columns = getLibraryColumnCount(viewMode);
      const recentCount = recentlyPlayedIds.length;
      const maxIndex = games.length - 1;

      if (event.deltaY > 0) {
        setFocusedIndex((previous) =>
          moveLibraryFocusVertically(previous, 'DOWN', columns, recentCount, maxIndex),
        );
      } else if (event.deltaY < 0) {
        setFocusedIndex((previous) =>
          moveLibraryFocusVertically(previous, 'UP', columns, recentCount, maxIndex),
        );
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('wheel', handleWheel);
      clearTimeout(timeoutId);
    };
  }, [
    isFullscreen,
    games,
    persistWindowSize,
    selectedGame,
    setFocusedIndex,
    recentlyPlayedIds.length,
    scrollNavigation,
    viewMode,
  ]);

  return {
    currentFocusedIndex,
    currentRailId,
    currentRailType,
    focusHeader,
    focusRailItem,
    focusSearch,
    handleKeyDown,
    jumpToRail,
    sectionJumpDirection,
    setSectionJumpDirection,
  };
}
