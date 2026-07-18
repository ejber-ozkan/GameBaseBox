import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockGames } from '../../data/mockGames';
import { CyberpunkCrtGrid } from './CyberpunkCrtGrid';

vi.mock('../ImageSlider', () => ({
  ImageSlider: ({ alt }: { alt: string }) => <div data-testid="image-slider">{alt}</div>,
}));

describe('CyberpunkCrtGrid', () => {
  it('renders the CRT terminal presenter with the requested content rails', () => {
    render(
      <CyberpunkCrtGrid
        games={[mockGames[0]]}
        recentGames={[mockGames[0]]}
        favoriteGames={[mockGames[0]]}
        classicGames={[mockGames[0]]}
        isFavorite={() => false}
        onSelectGame={vi.fn()}
        toggleFavorite={vi.fn()}
      />,
    );

    expect(screen.getByTestId('cyberpunk-crt-grid').getAttribute('data-cyberpunk-presentation')).toBe('crt-terminal');
    expect(screen.getByRole('heading', { name: 'RECENT' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'FAVOURITE' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'CLASSICS' })).toBeTruthy();
    expect(screen.getAllByTestId('cyberpunk-rail-card')).toHaveLength(3);
  });

  it('keeps rail and alphabet sections addressable by the C64-compatible navigation ids', () => {
    render(
      <CyberpunkCrtGrid
        activeAlphabetRailId="alpha-A"
        alphabetSections={[{ id: 'alpha-A', label: 'A', games: [mockGames[0]] }]}
        games={[]}
        recentGames={[mockGames[0]]}
        favoriteGames={[mockGames[0]]}
        classicGames={[mockGames[0]]}
        focusedGameId={mockGames[0].id.toString()}
        focusedRailId="recent"
        isFavorite={() => false}
        onSelectGame={vi.fn()}
        toggleFavorite={vi.fn()}
      />,
    );

    const grid = screen.getByTestId('cyberpunk-crt-grid');
    expect(grid.querySelector('[data-rail-id="recent"]')).toBeTruthy();
    expect(grid.querySelector('[data-rail-id="favorites"]')).toBeTruthy();
    expect(grid.querySelector('[data-rail-id="classics"]')).toBeTruthy();
    expect(grid.querySelector('[data-rail-id="alpha-A"]')).toBeTruthy();
    expect(screen.getByTestId('cyberpunk-focused-rail-card').getAttribute('data-focused')).toBe('true');
  });

  it('uses Void-density library panels and C64-style scrolling controls on every rail', () => {
    const scrollBy = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollBy', { configurable: true, value: scrollBy });
    render(
      <CyberpunkCrtGrid
        games={[mockGames[0]]}
        recentGames={[mockGames[0]]}
        favoriteGames={[mockGames[0]]}
        classicGames={[mockGames[0]]}
        isFavorite={() => false}
        onSelectGame={vi.fn()}
        toggleFavorite={vi.fn()}
      />,
    );

    const libraryGrid = screen.getByTestId('cyberpunk-library-card').parentElement;
    expect(libraryGrid?.classList).toContain('md:grid-cols-4');
    expect(libraryGrid?.classList).toContain('lg:grid-cols-6');
    expect(screen.getByTestId('cyberpunk-library-card').querySelector('.aspect-\\[1\\.6\\]')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Previous RECENT games' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Next RECENT games' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Previous FAVOURITE games' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Next FAVOURITE games' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Previous CLASSICS games' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Next CLASSICS games' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Next RECENT games' }));
    expect(scrollBy).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth', left: 0 }));
  });
});
