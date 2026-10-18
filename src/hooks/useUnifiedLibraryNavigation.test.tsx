import { useState } from 'react';
import { act, fireEvent, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockGames } from '../data/mockGames';
import { getWindowSize, type GameFilters } from '../lib/tauri-bridge';
import { useUnifiedLibraryNavigation, type UseUnifiedLibraryNavigationProps } from './useUnifiedLibraryNavigation';
import type { LibraryViewMode } from './useLibraryBrowserState';
import type { BigBoxRailCategory } from './useBigBoxLibraryData';

const gamepad = vi.hoisted(() => ({ onButtonDown: undefined as ((button: string) => void) | undefined }));
vi.mock('./useGamepad', () => ({ useGamepad: (handlers: { onButtonDown: (button: string) => void }) => {
  gamepad.onButtonDown = handlers.onButtonDown;
} }));
vi.mock('../lib/tauri-bridge', () => ({ exitApp: vi.fn(), getWindowSize: vi.fn() }));

function createProps(overrides: Partial<UseUnifiedLibraryNavigationProps> = {}): UseUnifiedLibraryNavigationProps {
  return {
    isFullscreen: false, viewMode: 'list', setViewMode: vi.fn(), games: mockGames,
    selectedGame: null, handleGameSelect: vi.fn(), filters: {}, setFilters: vi.fn(),
    setSearchInput: vi.fn(), focusedIndex: 0, setFocusedIndex: vi.fn(),
    toggleFocusedFavorite: vi.fn(() => true), updateSettings: vi.fn(), onGamepadInput: vi.fn(),
    activeHeaderItemIndex: 0, setActiveHeaderItemIndex: vi.fn(), activeHeaderRow: 0,
    setActiveHeaderRow: vi.fn(), activeRailIndex: 0, setActiveRailIndex: vi.fn(),
    railFocusIndices: {}, setRailFocusIndices: vi.fn(), rails: [], genres: [],
    visibleSubGenres: [], hasOverflowSubGenres: false, gridColumns: 6,
    persistWindowSize: vi.fn(), scrollNavigation: true, recentlyPlayedIds: [], ...overrides,
  };
}

function renderNavigation(overrides: Partial<UseUnifiedLibraryNavigationProps> = {}) {
  const props = createProps(overrides);
  const hook = renderHook(() => {
    const [index, setIndex] = useState(props.focusedIndex);
    const [filters, setFilters] = useState<GameFilters>(props.filters);
    const [mode, setMode] = useState<LibraryViewMode>(props.viewMode);
    useUnifiedLibraryNavigation({ ...props, focusedIndex: index, setFocusedIndex: setIndex,
      filters, setFilters, viewMode: mode, setViewMode: setMode });
    return { index, filters, mode };
  });
  return { ...hook, props };
}

describe('active unified library input', () => {
  beforeEach(() => { vi.clearAllMocks(); gamepad.onButtonDown = undefined; });
  afterEach(() => { document.body.innerHTML = ''; vi.useRealTimers(); vi.restoreAllMocks(); });

  it('keeps native nested scrolling separate from wheel focus navigation', () => {
    const scrollContainer = document.createElement('div');
    scrollContainer.dataset.libraryScrollContainer = 'true';
    const child = document.createElement('span');
    scrollContainer.append(child);
    document.body.append(scrollContainer);
    const { result } = renderNavigation();
    fireEvent.wheel(child, { deltaY: 120 });
    expect(result.current.index).toBe(0);
    fireEvent.wheel(window, { deltaY: 120 });
    expect(result.current.index).toBe(1);
    fireEvent.wheel(window, { deltaY: -120 });
    expect(result.current.index).toBe(0);
  });

  it.each([
    { scrollNavigation: false }, { selectedGame: mockGames[0] },
    { viewMode: 'settings' as const }, { isFullscreen: true },
  ])('does not wheel-navigate when disabled or in another context: %o', (overrides) => {
    const { result } = renderNavigation(overrides);
    fireEvent.wheel(window, { deltaY: 120 });
    expect(result.current.index).toBe(0);
  });

  it('debounces window resizing, persists native dimensions and cancels pending work on unmount', async () => {
    vi.useFakeTimers();
    vi.mocked(getWindowSize).mockResolvedValue({ width: 1024, height: 768 });
    const { props, unmount } = renderNavigation();
    fireEvent.resize(window);
    await act(() => vi.advanceTimersByTimeAsync(300));
    fireEvent.resize(window);
    await act(() => vi.advanceTimersByTimeAsync(499));
    expect(getWindowSize).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(props.persistWindowSize).toHaveBeenCalledExactlyOnceWith({ width: 1024, height: 768 });
    fireEvent.resize(window);
    unmount();
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(getWindowSize).toHaveBeenCalledOnce();
  });

  it('does not persist resize dimensions in fullscreen', async () => {
    vi.useFakeTimers();
    const { props } = renderNavigation({ isFullscreen: true });
    fireEvent.resize(window);
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(getWindowSize).not.toHaveBeenCalled();
    expect(props.persistWindowSize).not.toHaveBeenCalled();
  });

  it('retains arrow selection, favorite/settings/view shortcuts and letter jumps', () => {
    const { result, props } = renderNavigation({ filters: { letter: 'A', searchQuery: 'old' } });
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    expect(result.current.index).toBe(1);
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(props.handleGameSelect).toHaveBeenCalledExactlyOnceWith(mockGames[1]);
    fireEvent.keyDown(window, { key: 'f' });
    expect(props.toggleFocusedFavorite).toHaveBeenCalledOnce();
    fireEvent.keyDown(window, { key: 'PageDown' });
    expect(result.current.filters).toEqual({ letter: 'B', searchQuery: undefined });
    expect(props.setSearchInput).toHaveBeenCalledWith('');
    fireEvent.keyDown(window, { key: 'v' });
    expect(result.current.mode).toBe('grid');
    fireEvent.keyDown(window, { key: 's' });
    expect(result.current.mode).toBe('settings');
  });

  it('leaves native button activation and text input to the focused controls', () => {
    const button = document.createElement('button');
    document.body.append(button);
    const { props, result } = renderNavigation();
    button.focus();
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(props.handleGameSelect).not.toHaveBeenCalled();
    const input = document.createElement('input');
    document.body.append(input);
    input.focus();
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 's' });
    expect(result.current.index).toBe(0);
    expect(result.current.mode).toBe('list');
  });

  it('uses the latest callback without rebinding the keyboard subscription', () => {
    const props = createProps();
    const { rerender } = renderHook((current) => useUnifiedLibraryNavigation(current), { initialProps: props });
    const nextSelect = vi.fn();
    rerender({ ...props, handleGameSelect: nextSelect, focusedIndex: 1 });
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(props.handleGameSelect).not.toHaveBeenCalled();
    expect(nextSelect).toHaveBeenCalledExactlyOnceWith(mockGames[1]);
  });

  it('retains controller navigation and activation while a native button has DOM focus', () => {
    const button = document.createElement('button');
    document.body.append(button);
    button.focus();
    const { result, props } = renderNavigation();
    act(() => gamepad.onButtonDown?.('RIGHT'));
    expect(result.current.index).toBe(1);
    act(() => gamepad.onButtonDown?.('A'));
    expect(props.handleGameSelect).toHaveBeenCalledExactlyOnceWith(mockGames[1]);
    expect(props.onGamepadInput).toHaveBeenCalledTimes(2);
  });

  it('allows bumpers to advance across rails including unpopulated lazy-loaded alphabet rails in fullscreen', () => {
    let activeRailIndex = 0;
    const setActiveRailIndex = vi.fn((update) => {
      activeRailIndex = typeof update === 'function' ? update(activeRailIndex) : update;
    });
    const setRailFocusIndices = vi.fn();
    const rails: BigBoxRailCategory[] = [
      { id: 'recent', title: 'Recent', games: [mockGames[0]], type: 'recent' },
      { id: 'alpha-#', title: '0-9 & Symbols', games: [], type: 'alphabet', letter: '#' },
      { id: 'alpha-A', title: 'Letter A', games: [], type: 'alphabet', letter: 'A' },
    ];
    const { rerender } = renderHook((props: UseUnifiedLibraryNavigationProps) => useUnifiedLibraryNavigation(props), {
      initialProps: createProps({
        isFullscreen: true,
        activeRailIndex,
        setActiveRailIndex,
        setRailFocusIndices,
        rails,
      }),
    });
    act(() => gamepad.onButtonDown?.('RB'));
    expect(setActiveRailIndex).toHaveBeenCalledWith(1);
    rerender(createProps({
      isFullscreen: true,
      activeRailIndex: 1,
      setActiveRailIndex,
      setRailFocusIndices,
      rails,
    }));
    act(() => gamepad.onButtonDown?.('RB'));
    expect(setActiveRailIndex).toHaveBeenCalledWith(2);
    rerender(createProps({
      isFullscreen: true,
      activeRailIndex: 2,
      setActiveRailIndex,
      setRailFocusIndices,
      rails,
    }));
    act(() => gamepad.onButtonDown?.('LB'));
    expect(setActiveRailIndex).toHaveBeenCalledWith(1);
  });

  it('supports fullscreen gamepad shortcuts: Y for favorites, START for settings, and B for back', () => {
    const onShowSettings = vi.fn();
    const onBack = vi.fn();
    const toggleFocusedFavorite = vi.fn(() => true);
    renderHook(() => useUnifiedLibraryNavigation(createProps({
      isFullscreen: true,
      activeRailIndex: 0,
      rails: [{ id: 'recent', title: 'Recent', games: [mockGames[0]], type: 'recent' }],
      onShowSettings,
      onBack,
      toggleFocusedFavorite,
    })));
    act(() => gamepad.onButtonDown?.('Y'));
    expect(toggleFocusedFavorite).toHaveBeenCalledOnce();
    act(() => gamepad.onButtonDown?.('START'));
    expect(onShowSettings).toHaveBeenCalledOnce();
    act(() => gamepad.onButtonDown?.('B'));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
