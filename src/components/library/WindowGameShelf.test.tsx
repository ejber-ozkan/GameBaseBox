import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockGames } from '../../data/mockGames';
import { WindowGameShelf } from './WindowGameShelf';

vi.mock('../ImageSlider', () => ({
  ImageSlider: ({ alt }: { alt: string }) => <div data-testid="image-slider">{alt}</div>,
}));

describe('WindowGameShelf', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders duplicate game records without duplicate React key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <WindowGameShelf
        games={[mockGames[0], mockGames[0]]}
        isFavorite={() => false}
        isMouseMode={false}
        onSelectGame={vi.fn()}
        section="favorites"
        title="Your Favorites"
      />,
    );

    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringContaining('Encountered two children with the same key'),
      expect.anything(),
    );
  });

  it.each([
    ['recent', 'compact'],
    ['favorites', 'supporting'],
    ['legendary', 'featured'],
  ] as const)('uses a prominent %s shelf header for %s', (section, hierarchy) => {
    const { container } = render(
      <WindowGameShelf
        games={[mockGames[0]]}
        isFavorite={() => false}
        isMouseMode={false}
        onSelectGame={vi.fn()}
        section={section}
        subtitle="Supporting copy"
        title="Section title"
      />,
    );

    const header = screen.getByTestId('window-shelf-header');
    expect(header.getAttribute('data-section')).toBe(section);
    expect(header.getAttribute('data-hierarchy')).toBe(hierarchy);
    expect(header.getAttribute('data-density')).toBe('prominent');
    expect(screen.getByText('Supporting copy')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Section title' }).getAttribute('style')).toContain('font-size: 24px');
    expect(container.querySelector('[data-section-divider]')).toBeTruthy();
  });

  it('keeps each game name in a shallow blurred card overlay', () => {
    render(
      <WindowGameShelf
        games={[mockGames[0]]}
        isFavorite={() => false}
        isMouseMode={false}
        onSelectGame={vi.fn()}
        section="recent"
        title="Recent Games"
      />,
    );

    const overlay = screen.getByTestId('window-shelf-title-overlay');
    expect(overlay.getAttribute('data-visual-treatment')).toBe('blurred-compact');
    expect(overlay.getAttribute('style')).toContain('backdrop-filter: blur(8px)');
    expect(screen.getByTestId('window-shelf-game-title').getAttribute('style')).toContain('font-size: 16px');
  });

  it.each(['recent', 'favorites', 'legendary'] as const)(
    'uses the larger Arcade Void screenshot-card width for the %s shelf',
    (section) => {
      render(
        <WindowGameShelf
          games={[mockGames[0]]}
          isFavorite={() => false}
          isArcadeVoid
          isMouseMode={false}
          onSelectGame={vi.fn()}
          section={section}
          title="Section title"
        />,
      );

      expect(screen.getByRole('article').classList).toContain('aspect-video');
    },
  );
});
