import { fireEvent, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockGames } from '../data/mockGames';
import { useLibraryShellInput } from './useLibraryShellInput';

vi.mock('./useGamepad', () => ({
  useGamepad: vi.fn(),
}));

describe('useLibraryShellInput', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('does not turn native scrolling in the windowed library into focus navigation', () => {
    const setFocusedIndex = vi.fn();
    const scrollContainer = document.createElement('div');
    scrollContainer.dataset.libraryScrollContainer = 'true';
    document.body.append(scrollContainer);

    renderHook(() => useLibraryShellInput({
      closeDetail: vi.fn(),
      filters: {},
      focusedIndex: 0,
      games: mockGames,
      handleGameSelect: vi.fn(),
      onGamepadInput: vi.fn(),
      persistWindowSize: vi.fn(),
      selectedGame: null,
      setFilters: vi.fn(),
      setFocusedIndex,
      setSearchInput: vi.fn(),
      setViewMode: vi.fn(),
      settings: {
        isFullscreen: false,
        recentlyPlayedIds: [],
        scrollNavigation: true,
      },
      toggleFocusedFavorite: vi.fn(() => false),
      updateSettings: vi.fn(),
      viewMode: 'grid',
    }));

    fireEvent.wheel(scrollContainer, { deltaY: 120 });

    expect(setFocusedIndex).not.toHaveBeenCalled();
  });
});
