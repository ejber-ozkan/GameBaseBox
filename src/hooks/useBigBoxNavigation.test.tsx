import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockGames } from '../data/mockGames';
import type { BigBoxRailCategory } from './useBigBoxLibraryData';

const mockExitApp = vi.fn();
const gamepadRegistrations: Array<{ onButtonDown: (button: string) => void }> = [];

vi.mock('../lib/tauri-bridge', () => ({
  exitApp: () => mockExitApp(),
}));

vi.mock('./useGamepad', () => ({
  useGamepad: (registration: { onButtonDown: (button: string) => void }) => {
    gamepadRegistrations.push(registration);
  },
}));

import { useBigBoxNavigation } from './useBigBoxNavigation';

function getLatestGamepadHandler() {
  const registration = gamepadRegistrations.at(-1);
  if (!registration) {
    throw new Error('No gamepad registration was captured for this test.');
  }

  return registration.onButtonDown;
}

function createRails(): BigBoxRailCategory[] {
  return [
    {
      id: 'recent',
      title: 'Recent Games',
      games: [mockGames[0], mockGames[1]],
      type: 'recent',
    },
    {
      id: 'alpha-#',
      title: '0-9 & Symbols',
      games: [mockGames[2]],
      type: 'alphabet',
      letter: '#',
    },
    {
      id: 'alpha-A',
      title: 'Letter A',
      games: [mockGames[3]],
      type: 'alphabet',
      letter: 'A',
    },
  ];
}

function createProps(overrides: Partial<Parameters<typeof useBigBoxNavigation>[0]> = {}) {
  return {
    activeHeaderItemIndex: 0,
    activeHeaderRow: 0,
    activeRailIndex: -1,
    filters: {},
    genres: ['Action', 'Adventure'],
    gridColumns: 4,
    hasOverflowSubGenres: false,
    isControllerKeyboardOpen: false,
    onBack: vi.fn(),
    onFiltersChange: vi.fn(),
    onFocusSearchInput: vi.fn(),
    onGamepadInput: vi.fn(),
    onGenreSelect: vi.fn(),
    onLetterJump: vi.fn(),
    onNavigationMove: vi.fn(),
    onOpenControllerKeyboard: vi.fn(),
    onOpenSubGenrePicker: vi.fn(),
    onSelectGame: vi.fn(),
    onShowSettings: vi.fn(),
    railFocusIndices: { recent: 0, 'alpha-#': 0, 'alpha-A': 0 },
    rails: createRails(),
    setActiveHeaderItemIndex: vi.fn(),
    setActiveHeaderRow: vi.fn(),
    setActiveRailIndex: vi.fn(),
    setRailFocusIndices: vi.fn(),
    toggleFavorite: vi.fn(),
    visibleSubGenres: [],
    ...overrides,
  };
}

describe('useBigBoxNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gamepadRegistrations.length = 0;
    document.body.focus();
  });

  it('enters the first rail when ArrowDown is pressed from the jump row', () => {
    const props = createProps({
      activeHeaderRow: 2,
    });

    renderHook(() => useBigBoxNavigation(props));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    });

    expect(props.onNavigationMove).toHaveBeenCalledOnce();
    expect(props.setActiveRailIndex).toHaveBeenCalledWith(0);
  });

  it('toggles the active genre and clears subGenre when Enter is pressed on the genre row', () => {
    const props = createProps({
      activeHeaderItemIndex: 0,
      activeHeaderRow: 1,
      filters: {
        genre: 'Action',
        subGenre: 'Puzzle',
      },
    });

    renderHook(() => useBigBoxNavigation(props));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(props.onGenreSelect).toHaveBeenCalledOnce();
    expect(props.onFiltersChange).toHaveBeenCalledWith({
      genre: undefined,
      subGenre: undefined,
    });
    expect(props.setActiveRailIndex).toHaveBeenCalledWith(0);
  });

  it('jumps to the matching alphabet rail when Enter is pressed on a jump-row letter', () => {
    const props = createProps({
      activeHeaderItemIndex: 1,
      activeHeaderRow: 2,
    });

    renderHook(() => useBigBoxNavigation(props));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(props.onLetterJump).toHaveBeenCalledOnce();
    expect(props.setActiveRailIndex).toHaveBeenCalledWith(2);
  });

  it('toggles favorite on the focused game when gamepad Y is pressed', () => {
    const props = createProps({
      activeRailIndex: 0,
      railFocusIndices: { recent: 1, 'alpha-#': 0, 'alpha-A': 0 },
    });

    renderHook(() => useBigBoxNavigation(props));

    act(() => {
      getLatestGamepadHandler()('Y');
    });

    expect(props.onGamepadInput).toHaveBeenCalledOnce();
    expect(props.toggleFavorite).toHaveBeenCalledWith(mockGames[1].id.toString());
  });

  it('shows settings when gamepad START is pressed', () => {
    const props = createProps();

    renderHook(() => useBigBoxNavigation(props));

    act(() => {
      getLatestGamepadHandler()('START');
    });

    expect(props.onGamepadInput).toHaveBeenCalledOnce();
    expect(props.onShowSettings).toHaveBeenCalledOnce();
  });

  it('cycles platform when Enter is pressed on the BigBox platform slot', () => {
    const onPlatformCycle = vi.fn();
    const props = createProps({
      activeHeaderItemIndex: 1,
      activeHeaderRow: 0,
      platformSwitcherEnabled: true,
      onPlatformCycle,
    });

    renderHook(() => useBigBoxNavigation(props));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(onPlatformCycle).toHaveBeenCalledOnce();
    expect(props.onShowSettings).not.toHaveBeenCalled();
  });

  it('calls back behavior when gamepad B is pressed and an input is not focused', () => {
    const props = createProps();

    renderHook(() => useBigBoxNavigation(props));

    act(() => {
      getLatestGamepadHandler()('B');
    });

    expect(props.onGamepadInput).toHaveBeenCalledOnce();
    expect(props.onBack).toHaveBeenCalledOnce();
  });

  it('opens the controller keyboard from the selected search slot when gamepad A is pressed', () => {
    const props = createProps({
      activeHeaderItemIndex: 0,
      activeHeaderRow: 0,
      activeRailIndex: -1,
    });

    renderHook(() => useBigBoxNavigation(props));

    act(() => {
      getLatestGamepadHandler()('A');
    });

    expect(props.onGamepadInput).toHaveBeenCalledOnce();
    expect(props.onOpenControllerKeyboard).toHaveBeenCalledOnce();
    expect(props.onSelectGame).not.toHaveBeenCalled();
  });
});
