"use client";

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { exitApp, type GameFilters } from '../lib/tauri-bridge';
import { useGamepad } from './useGamepad';
import type { Game } from '../types/game';
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

type KeyEventLike = Pick<KeyboardEvent, 'key'>;
type SectionJumpDirection = 'up' | 'down' | null;

interface UseBigBoxNavigationProps {
  activeHeaderItemIndex: number;
  activeHeaderRow: number;
  activeRailIndex: number;
  filters: GameFilters;
  genres: string[];
  gridColumns: number;
  hasOverflowSubGenres: boolean;
  isControllerKeyboardOpen: boolean;
  onBack?: () => void;
  onFiltersChange: (filters: GameFilters) => void;
  onFocusSearchInput: () => void;
  onGamepadInput: () => void;
  onGenreSelect?: () => void;
  onLetterJump?: () => void;
  onNavigationMove?: () => void;
  onOpenControllerKeyboard: () => void;
  onOpenSubGenrePicker: () => void;
  onPlatformCycle?: () => void;
  onSelectGame: (game: Game) => void;
  onShowSettings: () => void;
  platformSwitcherEnabled?: boolean;
  railFocusIndices: Record<string, number>;
  rails: BigBoxRailCategory[];
  setActiveHeaderItemIndex: Dispatch<SetStateAction<number>>;
  setActiveHeaderRow: Dispatch<SetStateAction<number>>;
  setActiveRailIndex: Dispatch<SetStateAction<number>>;
  setRailFocusIndices: Dispatch<SetStateAction<Record<string, number>>>;
  visibleSubGenres: string[];
  toggleFavorite: (gameId: string) => void;
}

export function useBigBoxNavigation({
  activeHeaderItemIndex,
  activeHeaderRow,
  activeRailIndex,
  filters,
  genres,
  gridColumns,
  hasOverflowSubGenres,
  isControllerKeyboardOpen,
  onBack,
  onFiltersChange,
  onFocusSearchInput,
  onGamepadInput,
  onGenreSelect,
  onLetterJump,
  onNavigationMove,
  onOpenControllerKeyboard,
  onOpenSubGenrePicker,
  onPlatformCycle,
  onSelectGame,
  onShowSettings,
  platformSwitcherEnabled = false,
  railFocusIndices,
  rails,
  setActiveHeaderItemIndex,
  setActiveHeaderRow,
  setActiveRailIndex,
  setRailFocusIndices,
  toggleFavorite,
  visibleSubGenres,
}: UseBigBoxNavigationProps) {
  const [sectionJumpDirection, setSectionJumpDirection] = useState<SectionJumpDirection>(null);

  const currentRail = activeRailIndex >= 0 ? rails[activeRailIndex] : null;
  const currentFocusedIndex = currentRail ? (railFocusIndices[currentRail.id] ?? 0) : 0;
  const currentRailId = currentRail?.id ?? null;
  const currentRailType = currentRail?.type ?? null;

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
    }
  }, [rails, setActiveRailIndex]);

  const focusRailItem = useCallback((railIndex: number, railId: string, gameIndex: number) => {
    setSectionJumpDirection(null);
    setActiveRailIndex(railIndex);
    setRailFocusIndices((previous) => ({ ...previous, [railId]: gameIndex }));
  }, [setActiveRailIndex, setRailFocusIndices]);

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

  const handleKeyDown = useCallback((event: KeyEventLike) => {
    if (isControllerKeyboardOpen) {
      return;
    }

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
        return; // Already at the top
      }
      const result = calculateUpNavigation(navigationState, navigationParams);
      if (result.moved && result.state.activeRailIndex === -1 && activeRailIndex !== -1) {
        // We moved UP from rail 0 into the header. The header needs focus cleanup.
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
        } else if (rails.length > 0) {
          onNavigationMove?.();
          setSectionJumpDirection(null);
          setActiveRailIndex(0);
        }
      } else if (activeRailIndex < rails.length - 1) {
        onNavigationMove?.();
        setSectionJumpDirection(null);
        setActiveRailIndex((previous) => previous + 1);
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
      } else {
        onNavigationMove?.();
        setSectionJumpDirection(null);
        setActiveRailIndex((previous) => previous - 1);
      }
      return;
    }

    if (event.key === 'Enter' || event.key === 'a' || event.key === 'A') {
      if (isHeaderActive) {
        const rowType = getHeaderRowType(activeHeaderRow);
        if (rowType === 'top') {
          if (activeHeaderItemIndex === 0) {
            onFocusSearchInput();
          } else if (platformSwitcherEnabled && activeHeaderItemIndex === 1) {
            onPlatformCycle?.();
          } else if (activeHeaderItemIndex === (platformSwitcherEnabled ? 2 : 1)) {
            onShowSettings();
          } else if (activeHeaderItemIndex === (platformSwitcherEnabled ? 3 : 2)) {
            exitApp();
          }
        } else if (rowType === 'genre') {
          onGenreSelect?.();
          const genre = genres[activeHeaderItemIndex];
          onFiltersChange({
            ...filters,
            genre: filters.genre === genre ? undefined : genre,
            subGenre: undefined,
          });
          setSectionJumpDirection(null);
          setActiveRailIndex(0);
        } else if (rowType === 'subGenre') {
          if (hasOverflowSubGenres && activeHeaderItemIndex === visibleSubGenres.length) {
            onOpenSubGenrePicker();
            return;
          }

          const subGenre = visibleSubGenres[activeHeaderItemIndex];
          if (!subGenre) {
            return;
          }
          onFiltersChange({
            ...filters,
            subGenre: filters.subGenre === subGenre ? undefined : subGenre,
          });
          setSectionJumpDirection(null);
          setActiveRailIndex(0);
        } else {
          onLetterJump?.();
          jumpToRail(`alpha-${BIGBOX_LETTERS[activeHeaderItemIndex]}`);
        }
        return;
      }

      const game = rail?.games[focusedIndex];
      if (game) {
        onSelectGame(game);
      }
      return;
    }

    if (event.key === 'f' || event.key === 'F') {
      const game = rail?.games[focusedIndex];
      if (game) {
        toggleFavorite(game.id.toString());
      }
    }
  }, [
    activeHeaderItemIndex,
    activeHeaderRow,
    activeRailIndex,
    filters,
    focusHeader,
    focusTopMenu,
    genres,
    getHeaderRowType,
    gridColumns,
    hasSubGenres,
    hasOverflowSubGenres,
    jumpRowIndex,
    jumpToRail,
    onFiltersChange,
    onFocusSearchInput,
    isControllerKeyboardOpen,
    onGenreSelect,
    onSelectGame,
    onShowSettings,
    onLetterJump,
    onNavigationMove,
    rails,
    railFocusIndices,
    setActiveHeaderItemIndex,
    setActiveHeaderRow,
    setActiveRailIndex,
    setRailFocusIndices,
    sectionJumpDirection,
    toggleFavorite,
    visibleSubGenres,
    onOpenSubGenrePicker,
    onPlatformCycle,
    platformSwitcherEnabled,
  ]);

  useEffect(() => {
    const handleWindowKeyDown = (event: KeyboardEvent) => {
      handleKeyDown(event);
    };

    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [handleKeyDown]);

  useGamepad({
    onButtonDown: (button) => {
      if (isControllerKeyboardOpen) {
        return;
      }

      onGamepadInput();

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
        if (isSearchSelected) {
          onOpenControllerKeyboard();
        } else {
          handleKeyDown({ key: 'Enter' });
        }
      }
      if (button === 'Y') handleKeyDown({ key: 'F' });
      if (button === 'START') onShowSettings();
      if (button === 'B') {
        if (document.activeElement?.tagName === 'INPUT') {
          (document.activeElement as HTMLElement).blur();
        } else {
          onBack?.();
        }
      }
    },
  });

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
