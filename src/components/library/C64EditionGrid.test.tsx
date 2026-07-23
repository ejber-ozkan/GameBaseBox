import { act, fireEvent, render, screen } from '@testing-library/react';
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

  it('uses all-caps C64 monitor labels and a Library ROM section', () => {
    renderGrid();

    expect(screen.getByTestId('c64-edition-grid').getAttribute('data-c64-presentation')).toBe('monitor');
    expect(screen.getByRole('heading', { name: 'RECENT' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'FAVOURITES' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'CLASSICS' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'LIBRARY' })).toBeTruthy();
    expect(screen.getAllByTestId('c64-rail-card')).toHaveLength(3);
  });

  it('uses horizontally scrollable 16:9 rails and compact 3:4 ROM cards for the library', () => {
    renderGrid();

    expect(screen.getAllByTestId('c64-recent-media')[0].classList).toContain('aspect-video');
    expect(screen.getAllByTestId('c64-rail-scroll')[0].classList).toContain('overflow-x-auto');
    expect(screen.getAllByTestId('c64-rail-card')[0].classList).toContain('flex-none');
    expect(screen.getAllByTestId('c64-rom-media')[0].classList).toContain('aspect-[3/4]');
  });

  it('exposes each C64 rail by its navigation id so BigBox can scroll from Classics into Library', () => {
    renderGrid();

    expect(screen.getByTestId('c64-edition-grid').querySelector('[data-rail-id="recent"]')).toBeTruthy();
    expect(screen.getByTestId('c64-edition-grid').querySelector('[data-rail-id="favorites"]')).toBeTruthy();
    expect(screen.getByTestId('c64-edition-grid').querySelector('[data-rail-id="classics"]')).toBeTruthy();
    expect(screen.getByTestId('c64-edition-grid').querySelector('[data-rail-id="c64-library"]')).toBeTruthy();
  });

  it('reports the mouse-highlighted C64 rail card as the next controller focus target', () => {
    const onFocusRailItem = vi.fn();
    render(
      <C64EditionGrid
        games={[]}
        favoriteGames={[]}
        isFavorite={() => false}
        onFocusRailItem={onFocusRailItem}
        onSelectGame={vi.fn()}
        recentGames={[mockGames[0]]}
        classicGames={[]}
        toggleFavorite={vi.fn()}
      />,
    );

    fireEvent.mouseEnter(screen.getByTestId('c64-rail-card'));

    expect(onFocusRailItem).toHaveBeenCalledWith('recent', 0);
  });

  it('provides previous and next carousel controls for each C64 rail', () => {
    renderGrid();

    expect(screen.getByRole('button', { name: 'Previous RECENT games' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Next RECENT games' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Previous FAVOURITES games' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Next CLASSICS games' })).toBeTruthy();
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
    expect(screen.getByTestId('c64-blinking-cursor').classList).toContain('animate-[cursor-blink_1s_steps(1,end)_infinite]');
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

  it('renders C64 alphabet navigation as visible numbered and lettered library sections', () => {
    render(
      <C64EditionGrid
        activeAlphabetRailId="alpha-A"
        alphabetSections={[
          { id: 'alpha-#', label: '#', games: [{ ...mockGames[0], name: '1942' }] },
          { id: 'alpha-A', label: 'A', games: [{ ...mockGames[1], name: 'Archon' }] },
        ]}
        games={[]}
        favoriteGames={[]}
        isFavorite={() => false}
        onSelectGame={vi.fn()}
        recentGames={[]}
        classicGames={[]}
        toggleFavorite={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: '#' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'A' })).toBeTruthy();
    expect(screen.getByTestId('c64-edition-grid').querySelector('[data-rail-id="alpha-#"]')).toBeTruthy();
    expect(screen.getByTestId('c64-edition-grid').querySelector('[data-rail-id="alpha-A"]')).toBeTruthy();
  });

  it('uses the controller navigation column count for C64 alphabet grids', () => {
    render(
      <C64EditionGrid
        alphabetSections={[{ id: 'alpha-A', label: 'A', games: [mockGames[0]] }]}
        games={[]}
        favoriteGames={[]}
        gridColumns={5}
        isFavorite={() => false}
        onSelectGame={vi.fn()}
        recentGames={[]}
        classicGames={[]}
        toggleFavorite={vi.fn()}
      />,
    );

    expect((screen.getByTestId('c64-edition-grid').querySelector('[data-rail-id="alpha-A"] .grid') as HTMLElement).style.gridTemplateColumns).toBe('repeat(5, minmax(0, 1fr))');
  });

  it('renders ROM cards only for the focused alphabet section in BigBox', () => {
    render(
      <C64EditionGrid
        activeAlphabetRailId="alpha-A"
        alphabetSections={[
          { id: 'alpha-A', label: 'A', games: [{ ...mockGames[0], name: 'Archon' }] },
          { id: 'alpha-B', label: 'B', games: [{ ...mockGames[1], name: 'Boulder Dash' }] },
        ]}
        focusedIndex={0}
        focusedRailId="alpha-A"
        games={[]}
        favoriteGames={[]}
        isFavorite={() => false}
        onSelectGame={vi.fn()}
        recentGames={[]}
        classicGames={[]}
        toggleFavorite={vi.fn()}
      />,
    );

    expect(screen.getAllByTestId('c64-rom-card')).toHaveLength(1);
    expect(screen.getByTestId('c64-focused-title').textContent).toBe('Archon');
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

  it('does not render the sticky viewing panel in grid view (scoped to list view)', () => {
    render(
      <C64EditionGrid
        alphabetLabel="M"
        searchInput="mario"
        totalGameCount={1234}
        games={[mockGames[0]]}
        favoriteGames={[]}
        isFavorite={() => false}
        onSelectGame={vi.fn()}
        recentGames={[]}
        classicGames={[]}
        toggleFavorite={vi.fn()}
      />,
    );

    expect(screen.queryByTestId('c64-currently-viewing-container')).toBeNull();
  });
});
