import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LibraryHeader } from './LibraryHeader';

describe('LibraryHeader', () => {
  afterEach(() => {
    delete document.documentElement.dataset.theme;
  });

  it('shows the total game count beside the active platform selector', () => {
    render(
      <LibraryHeader
        activePlatformId="c64"
        filters={{}}
        genres={[]}
        onExit={vi.fn()}
        onFiltersChange={vi.fn()}
        onOpenSettings={vi.fn()}
        onPlatformSelect={vi.fn()}
        onSearchChange={vi.fn()}
        onViewModeChange={vi.fn()}
        searchInput=""
        subGenres={[]}
        totalGameCount={42891}
        viewMode="grid"
      />,
    );

    const platformSelect = screen.getByLabelText('Active platform');
    const gameCount = screen.getByText('42,891 Games');
    expect(platformSelect.parentElement?.parentElement?.contains(gameCount)).toBe(true);
  });

  it('shows the C64 blinking cursor in the search field only for the C64 Edition theme', () => {
    document.documentElement.dataset.theme = 'c64-edition';

    render(
      <LibraryHeader activePlatformId="c64" filters={{}} genres={[]} onExit={vi.fn()} onFiltersChange={vi.fn()} onOpenSettings={vi.fn()} onPlatformSelect={vi.fn()} onSearchChange={vi.fn()} onViewModeChange={vi.fn()} searchInput="" subGenres={[]} viewMode="grid" />,
    );

    expect(screen.getByTestId('c64-search-cursor').classList).toContain('animate-[cursor-blink_1s_steps(1,end)_infinite]');
  });

  it('renders random game button next to total games count and calls onSelectRandomGame on click', () => {
    const onSelectRandomGame = vi.fn();
    render(
      <LibraryHeader
        activePlatformId="c64"
        filters={{}}
        genres={[]}
        onExit={vi.fn()}
        onFiltersChange={vi.fn()}
        onOpenSettings={vi.fn()}
        onPlatformSelect={vi.fn()}
        onSearchChange={vi.fn()}
        onViewModeChange={vi.fn()}
        searchInput=""
        subGenres={[]}
        totalGameCount={100}
        viewMode="grid"
        onSelectRandomGame={onSelectRandomGame}
      />,
    );

    const randomBtn = screen.getByTestId('random-game-button');
    expect(randomBtn).toBeTruthy();
    randomBtn.click();
    expect(onSelectRandomGame).toHaveBeenCalledOnce();
  });
});
