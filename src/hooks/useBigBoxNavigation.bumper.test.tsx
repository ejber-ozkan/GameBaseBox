import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockGames } from '../data/mockGames';
import type { BigBoxRailCategory } from './useBigBoxLibraryData';
import { useBigBoxNavigation } from './useBigBoxNavigation';

vi.mock('../lib/tauri-bridge', () => ({
  exitApp: vi.fn(),
  isDebugMode: vi.fn().mockResolvedValue(false),
}));

vi.mock('./useGamepad', () => ({
  useGamepad: vi.fn(),
}));

describe('useBigBoxNavigation Right Bumper Lazy Alphabet Navigation', () => {
  it('allows Right Bumper (LB_RB_RIGHT) to advance to unpopulated lazy-loaded alphabet rails', () => {
    let activeRailIndex = 0; // Starts on recent rail (index 0)
    const setActiveRailIndex = vi.fn((update) => {
      activeRailIndex = typeof update === 'function' ? update(activeRailIndex) : update;
    });
    const setRailFocusIndices = vi.fn();
    const setActiveHeaderRow = vi.fn();
    const setActiveHeaderItemIndex = vi.fn();

    // Rails array mimicking Arcade Void theme: recent (populated), then unpopulated alphabet rails
    const rails: BigBoxRailCategory[] = [
      {
        id: 'recent',
        title: 'Recent Games',
        games: [mockGames[0]],
        type: 'recent',
      },
      {
        id: 'alpha-#',
        title: '0-9 & Symbols',
        games: [], // Empty/unloaded initially
        type: 'alphabet',
        letter: '#',
      },
      {
        id: 'alpha-A',
        title: 'Letter A',
        games: [], // Empty/unloaded initially
        type: 'alphabet',
        letter: 'A',
      },
    ];

    const { result } = renderHook(() =>
      useBigBoxNavigation({
        activeHeaderItemIndex: 0,
        activeHeaderRow: 0,
        activeRailIndex,
        filters: {},
        genres: ['Action', 'RPG'],
        gridColumns: 4,
        hasOverflowSubGenres: false,
        isControllerKeyboardOpen: false,
        onFiltersChange: vi.fn(),
        onFocusSearchInput: vi.fn(),
        onGamepadInput: vi.fn(),
        onOpenControllerKeyboard: vi.fn(),
        onOpenSubGenrePicker: vi.fn(),
        onSelectGame: vi.fn(),
        onShowSettings: vi.fn(),
        railFocusIndices: {},
        rails,
        setActiveHeaderItemIndex,
        setActiveHeaderRow,
        setActiveRailIndex,
        setRailFocusIndices,
        toggleFavorite: vi.fn(),
        visibleSubGenres: [],
      })
    );

    // Press Right Bumper (LB_RB_RIGHT) from recent rail (index 0)
    act(() => {
      result.current.handleKeyDown({ key: 'LB_RB_RIGHT' });
    });

    // Should navigate to index 1 (alpha-#) despite games being empty!
    expect(setActiveRailIndex).toHaveBeenCalledWith(1);

    // Now set activeRailIndex = 1 and press Right Bumper again to test moving to alpha-A (index 2)
    activeRailIndex = 1;

    act(() => {
      result.current.handleKeyDown({ key: 'LB_RB_RIGHT' });
    });

    expect(setActiveRailIndex).toHaveBeenCalledWith(2);
  });
});
