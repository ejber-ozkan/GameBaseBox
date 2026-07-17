import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockGames } from '../../data/mockGames';
import { C64EditionGrid } from './C64EditionGrid';

vi.mock('../ImageSlider', () => ({
  ImageSlider: ({ alt }: { alt: string }) => <div data-testid="image-slider">{alt}</div>,
}));

describe('C64EditionGrid', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const renderGrid = () => render(
    <C64EditionGrid
      games={[mockGames[0], mockGames[1]]}
      isFavorite={() => false}
      onSelectGame={vi.fn()}
      recentGames={[mockGames[0]]}
      toggleFavorite={vi.fn()}
    />,
  );

  it('uses the C64 monitor body with separate recent chips and ROM-set sections', () => {
    renderGrid();

    expect(screen.getByTestId('c64-edition-grid').getAttribute('data-c64-presentation')).toBe('monitor');
    expect(screen.getByRole('heading', { name: 'RECENT_CHIPS' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'LIBRARY_ROMSET' })).toBeTruthy();
  });

  it('uses 16:9 screenshot cards for recent games and compact 3:4 ROM cards for the library', () => {
    renderGrid();

    expect(screen.getByTestId('c64-recent-media').classList).toContain('aspect-video');
    expect(screen.getAllByTestId('c64-rom-media')[0].classList).toContain('aspect-[3/4]');
  });

  it('keeps a focused ROM card visibly marked without changing its compact card contract', () => {
    render(
      <C64EditionGrid
        focusedIndex={1}
        games={[mockGames[0], mockGames[1]]}
        isFavorite={() => false}
        onSelectGame={vi.fn()}
        recentGames={[mockGames[0]]}
        toggleFavorite={vi.fn()}
      />,
    );

    expect(screen.getAllByTestId('c64-rom-card')[1].getAttribute('data-focused')).toBe('true');
    expect(screen.getAllByTestId('c64-rom-media')[1].classList).toContain('aspect-[3/4]');
  });

  it('requests the next page when its ROM sentinel becomes visible', () => {
    const onEndReached = vi.fn();
    let callback: IntersectionObserverCallback | undefined;
    vi.stubGlobal('IntersectionObserver', class {
      constructor(nextCallback: IntersectionObserverCallback) {
        callback = nextCallback;
      }

      disconnect = vi.fn();
      observe = vi.fn();
    });

    render(
      <C64EditionGrid
        games={[mockGames[0]]}
        isFavorite={() => false}
        onEndReached={onEndReached}
        onSelectGame={vi.fn()}
        recentGames={[mockGames[0]]}
        toggleFavorite={vi.fn()}
      />,
    );

    act(() => callback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));

    expect(onEndReached).toHaveBeenCalledOnce();
  });
});
