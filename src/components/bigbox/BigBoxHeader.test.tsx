import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildFullscreenLayoutMetrics } from '../../hooks/useFullscreenLayoutMetrics';
import { BigBoxHeader } from './BigBoxHeader';

const layout = buildFullscreenLayoutMetrics('comfortable', {
  dpr: 1,
  height: 1080,
  physicalHeight: 1080,
  physicalWidth: 1920,
  width: 1920,
});

describe('BigBoxHeader', () => {
  afterEach(() => {
    delete document.documentElement.dataset.theme;
  });

  it('places the game count directly beside the active platform selector', () => {
    render(
      <BigBoxHeader
        activeHeaderItemIndex={0}
        activeHeaderRow={0}
        activePlatformId="c64"
        activeRailIndex={-1}
        filters={{}}
        genres={[]}
        hasOverflowSubGenres={false}
        isFiltered={false}
        layout={layout}
        onExit={vi.fn()}
        onFiltersChange={vi.fn()}
        onJumpToRail={vi.fn()}
        onOpenSubGenrePicker={vi.fn()}
        onPlatformSelect={vi.fn()}
        onSearchChange={vi.fn()}
        onSearchFocus={vi.fn()}
        onSetHeaderFocus={vi.fn()}
        onShowSettings={vi.fn()}
        searchInput=""
        totalGameCount={3}
        visibleSubGenres={[]}
      />,
    );

    const platformSelect = screen.getByLabelText('Active platform');
    const gameCount = screen.getByText('3 GAMES AVAILABLE');
    expect(platformSelect.parentElement?.parentElement?.contains(gameCount)).toBe(true);
  });

  it('shows the C64 blinking cursor in the BigBox search field', () => {
    document.documentElement.dataset.theme = 'c64-edition';

    render(
      <BigBoxHeader activeHeaderItemIndex={0} activeHeaderRow={0} activePlatformId="c64" activeRailIndex={-1} filters={{}} genres={[]} hasOverflowSubGenres={false} isFiltered={false} layout={layout} onExit={vi.fn()} onFiltersChange={vi.fn()} onJumpToRail={vi.fn()} onOpenSubGenrePicker={vi.fn()} onPlatformSelect={vi.fn()} onSearchChange={vi.fn()} onSearchFocus={vi.fn()} onSetHeaderFocus={vi.fn()} onShowSettings={vi.fn()} searchInput="" totalGameCount={3} visibleSubGenres={[]} />,
    );

    expect(screen.getByTestId('c64-search-cursor').classList).toContain('animate-[cursor-blink_1s_steps(1,end)_infinite]');
  });
});
