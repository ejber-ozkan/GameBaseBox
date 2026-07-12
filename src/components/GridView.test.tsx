import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockGames } from '../data/mockGames';
import { GridView } from './GridView';

vi.mock('./ImageSlider', () => ({
  ImageSlider: ({ alt, defer }: { alt: string; defer?: boolean }) => <div data-defer={String(defer)} data-testid="image-slider">{alt}</div>,
}));

vi.mock('../hooks/useFavorites', () => ({
  useFavorites: () => ({
    isFavorite: () => false,
    toggleFavorite: vi.fn(),
  }),
}));

describe('GridView', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders duplicate game records without duplicate React key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <GridView
        games={[mockGames[0], mockGames[0]]}
        onSelectGame={vi.fn()}
      />,
    );

    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringContaining('Encountered two children with the same key'),
      expect.anything(),
    );
  });

  it('defers card media loading until the card approaches the viewport', () => {
    const { getByTestId } = render(<GridView games={[mockGames[0]]} onSelectGame={vi.fn()} />);

    expect(getByTestId('image-slider').getAttribute('data-defer')).toBe('true');
  });
});
