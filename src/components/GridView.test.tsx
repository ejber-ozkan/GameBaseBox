import { act, render } from '@testing-library/react';
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
    vi.unstubAllGlobals();
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

  it('uses content visibility to avoid painting off-screen cards', () => {
    const { getByText } = render(<GridView games={[mockGames[0]]} onSelectGame={vi.fn()} />);

    expect(getByText(mockGames[0].name).closest('[style]')?.getAttribute('style')).toContain('content-visibility: auto');
  });

  it('requests another page when its end sentinel reaches the scroll viewport', () => {
    const onEndReached = vi.fn();
    let callback: IntersectionObserverCallback | undefined;
    vi.stubGlobal('IntersectionObserver', class {
      constructor(nextCallback: IntersectionObserverCallback) {
        callback = nextCallback;
      }

      disconnect = vi.fn();
      observe = vi.fn();
    });

    render(<GridView games={[mockGames[0]]} onSelectGame={vi.fn()} onEndReached={onEndReached} />);

    act(() => {
      callback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    });

    expect(onEndReached).toHaveBeenCalledOnce();
  });
});
