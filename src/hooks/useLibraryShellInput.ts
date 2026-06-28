"use client";

import { useEffect } from 'react';
import { useGamepad } from './useGamepad';
import { getLibraryColumnCount, getNextLetterJump, moveLibraryFocusHorizontally, moveLibraryFocusVertically, resolveFocusedGame } from '../lib/library-navigation';
import type { Game } from '../types/game';
import type { GameFilters } from '../lib/tauri-bridge';
import type { LibraryViewMode } from './useLibraryBrowserState';
import type { Settings } from '../contexts/SettingsContext';
import type { Dispatch, SetStateAction } from 'react';

const LETTERS = ['#', ...Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index))];

interface UseLibraryShellInputProps {
  closeDetail: () => void;
  filters: GameFilters;
  focusedIndex: number;
  games: Game[];
  handleGameSelect: (game: Game) => void;
  onGamepadInput: () => void;
  persistWindowSize: (size: { width: number; height: number }) => void;
  selectedGame: Game | null;
  setFilters: Dispatch<SetStateAction<GameFilters>>;
  setFocusedIndex: Dispatch<SetStateAction<number>>;
  setSearchInput: Dispatch<SetStateAction<string>>;
  setViewMode: Dispatch<SetStateAction<LibraryViewMode>>;
  settings: Pick<Settings, 'isFullscreen' | 'recentlyPlayedIds' | 'scrollNavigation'>;
  toggleFocusedFavorite: () => boolean;
  updateSettings: (settings: Partial<Settings>) => void;
  viewMode: LibraryViewMode;
}

export function useLibraryShellInput({
  closeDetail,
  filters,
  focusedIndex,
  games,
  handleGameSelect,
  onGamepadInput,
  persistWindowSize,
  selectedGame,
  setFilters,
  setFocusedIndex,
  setSearchInput,
  setViewMode,
  settings,
  toggleFocusedFavorite,
  updateSettings,
  viewMode,
}: UseLibraryShellInputProps) {
  useGamepad({
    onButtonDown: (button) => {
      onGamepadInput();
      if (settings.isFullscreen) return;

      if (button === 'Y') {
        if (!selectedGame && viewMode !== 'settings') {
          toggleFocusedFavorite();
        }
      }
      if (button === 'X') setViewMode((previous) => (previous === 'grid' ? 'list' : 'grid'));
      if (button === 'START') setViewMode('settings');

      if (button === 'B') {
        if (selectedGame) closeDetail();
      }

      if (button === 'RB' || button === 'LB') {
        const nextLetter = getNextLetterJump(filters.letter, button === 'RB' ? 'forward' : 'backward', LETTERS);
        setFilters((previous) => ({ ...previous, letter: nextLetter, searchQuery: undefined }));
        setSearchInput('');
      }

      if (!selectedGame && viewMode !== 'settings') {
        const columns = getLibraryColumnCount(viewMode);
        const recentCount = settings.recentlyPlayedIds.length;
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
          const focusedGame = resolveFocusedGame(focusedIndex, games, settings.recentlyPlayedIds);
          if (focusedGame) {
            handleGameSelect(focusedGame);
          }
        }
      }
    },
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;

      if ((event.key === 'f' || event.key === 'F') && !event.shiftKey) {
        if (!selectedGame && viewMode !== 'settings' && toggleFocusedFavorite()) {
          event.preventDefault();
          return;
        }
      }
      if (event.key === 's' || event.key === 'S') {
        setViewMode('settings');
      }
      if (event.key === 'v' || event.key === 'V') {
        setViewMode((previous) => (previous === 'grid' ? 'list' : 'grid'));
      }

      if (event.key === 'Enter' && event.altKey) {
        event.preventDefault();
        updateSettings({ isFullscreen: !settings.isFullscreen });
      }

      if (event.key === 'PageDown' || event.key === 'PageUp') {
        event.preventDefault();
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
        const recentCount = settings.recentlyPlayedIds.length;
        const minIndex = recentCount > 0 ? -recentCount : 0;
        const maxIndex = games.length - 1;

        if (event.key === 'ArrowRight') {
          event.preventDefault();
          setFocusedIndex((previous) =>
            moveLibraryFocusHorizontally(previous, 'RIGHT', minIndex, maxIndex),
          );
        }
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          setFocusedIndex((previous) =>
            moveLibraryFocusHorizontally(previous, 'LEFT', minIndex, maxIndex),
          );
        }
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setFocusedIndex((previous) =>
            moveLibraryFocusVertically(previous, 'DOWN', columns, recentCount, maxIndex),
          );
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setFocusedIndex((previous) =>
            moveLibraryFocusVertically(previous, 'UP', columns, recentCount, maxIndex),
          );
        }

        if (event.key === 'Enter') {
          event.preventDefault();
          const focusedGame = resolveFocusedGame(focusedIndex, games, settings.recentlyPlayedIds);
          if (focusedGame) {
            handleGameSelect(focusedGame);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    focusedIndex,
    games,
    handleGameSelect,
    selectedGame,
    setFilters,
    setFocusedIndex,
    setSearchInput,
    setViewMode,
    settings.isFullscreen,
    settings.recentlyPlayedIds,
    toggleFocusedFavorite,
    updateSettings,
    viewMode,
  ]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        const { getWindowSize } = await import('../lib/tauri-bridge');
        const size = await getWindowSize();
        if (size) {
          persistWindowSize(size);
        }
      }, 500);
    };

    const handleWheel = (event: WheelEvent) => {
      if (!settings.scrollNavigation || selectedGame || viewMode === 'settings') return;

      const columns = getLibraryColumnCount(viewMode);
      const recentCount = settings.recentlyPlayedIds.length;
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
    games,
    persistWindowSize,
    selectedGame,
    setFocusedIndex,
    settings.recentlyPlayedIds.length,
    settings.scrollNavigation,
    viewMode,
  ]);
}
