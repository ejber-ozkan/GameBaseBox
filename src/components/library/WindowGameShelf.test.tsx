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
  ] as const)('uses the %s hierarchy for a %s shelf header', (section, hierarchy) => {
    render(
      <WindowGameShelf
        games={[mockGames[0]]}
        isFavorite={() => false}
        isMouseMode={false}
        onSelectGame={vi.fn()}
        section={section}
        title="Section title"
      />,
    );

    const header = screen.getByTestId('window-shelf-header');
    expect(header.getAttribute('data-section')).toBe(section);
    expect(header.getAttribute('data-hierarchy')).toBe(hierarchy);
  });
});
