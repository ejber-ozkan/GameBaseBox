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
      favoriteGames={[mockGames[1]]}
      isFavorite={() => false}
      onSelectGame={vi.fn()}
      recentGames={[mockGames[0]]}
      classicGames={[mockGames[0]]}
      toggleFavorite={vi.fn()}
    />,
  );

  it('uses the C64 monitor body with matching Recent, Favourites, and Classics rails', () => {
    renderGrid();

    expect(screen.getByTestId('c64-edition-grid').getAttribute('data-c64-presentation')).toBe('monitor');
    expect(screen.getByRole('heading', { name: 'Recent' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Favourites' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Classics' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'LIBRARY_ROMSET' })).toBeTruthy();
    expect(screen.getAllByTestId('c64-rail-card')).toHaveLength(3);
  });

  it('uses horizontally scrollable 16:9 rails and compact 3:4 ROM cards for the library', () => {
    renderGrid();

    expect(screen.getAllByTestId('c64-recent-media')[0].classList).toContain('aspect-video');
    expect(screen.getAllByTestId('c64-rail-scroll')[0].classList).toContain('overflow-x-auto');
    expect(screen.getAllByTestId('c64-rail-card')[0].classList).toContain('flex-none');
    expect(screen.getAllByTestId('c64-rom-media')[0].classList).toContain('aspect-[3/4]');
  });

  it('provides previous and next carousel controls for each C64 rail', () => {
    renderGrid();

    expect(screen.getByRole('button', { name: 'Previous Recent games' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Next Recent games' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Previous Favourites games' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Next Classics games' })).toBeTruthy();
  });

  it('uses the reference yellow title block and far-right cursor for a focused rail card', () => {
    render(
      <C64EditionGrid
        focusedGameId={mockGames[0].id.toString()}
        focusedRailId="recent"
        games={[]}
        favoriteGames={[]}
        isFavorite={() => false}
        onSelectGame={vi.fn()}
        recentGames={[mockGames[0]]}
        classicGames={[]}
        toggleFavorite={vi.fn()}
      />,
    );

    expect(screen.getByTestId('c64-focused-rail-card').classList).toContain('border-[#ffff66]');
    expect(screen.getByTestId('c64-focused-title-strip').classList).toContain('bg-[#ffff66]');
    expect(screen.getByTestId('c64-blinking-cursor').classList).toContain('ml-auto');
  });

  it('keeps a focused ROM card visibly marked without changing its compact card contract', () => {
    render(
      <C64EditionGrid
        focusedIndex={1}
        games={[mockGames[0], mockGames[1]]}
        favoriteGames={[]}
        isFavorite={() => false}
        onSelectGame={vi.fn()}
        recentGames={[mockGames[0]]}
        classicGames={[]}
        toggleFavorite={vi.fn()}
      />,
    );

    expect(screen.getAllByTestId('c64-rom-card')[1].getAttribute('data-focused')).toBe('true');
    expect(screen.getAllByTestId('c64-rom-media')[1].classList).toContain('aspect-[3/4]');
    expect(screen.getByTestId('c64-focused-title-strip').classList).toContain('bg-[#ffff66]');
    expect(screen.getByTestId('c64-focused-title').classList).toContain('text-base');
    expect(screen.getByTestId('c64-blinking-cursor').classList).toContain('animate-[blink_1s_steps(1,end)_infinite]');
  });

  it('uses the active alphabet shortcut as the compact-library title', () => {
    render(
      <C64EditionGrid
        alphabetLabel="A"
        games={[mockGames[0]]}
        favoriteGames={[]}
        isFavorite={() => false}
        onSelectGame={vi.fn()}
        recentGames={[]}
        classicGames={[]}
        toggleFavorite={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'A' })).toBeTruthy();
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
        favoriteGames={[]}
        isFavorite={() => false}
        onEndReached={onEndReached}
        onSelectGame={vi.fn()}
        recentGames={[mockGames[0]]}
        classicGames={[]}
        toggleFavorite={vi.fn()}
      />,
    );

    act(() => callback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));

    expect(onEndReached).toHaveBeenCalledOnce();
  });
});
