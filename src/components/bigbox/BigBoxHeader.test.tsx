import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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
});
