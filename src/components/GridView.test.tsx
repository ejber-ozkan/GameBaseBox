import { act, fireEvent, render } from '@testing-library/react';
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
  it('keeps game activation and favorite controls separate and synchronizes game focus', () => {
    const onSelectGame = vi.fn();
    const onGameFocus = vi.fn();
    const props = { games: mockGames.slice(0, 2), onSelectGame, onGameFocus };
    const { getByRole, rerender } = render(<GridView {...props} focusedIndex={0} />);
    const first = getByRole('button', { name: mockGames[0].name });
    first.focus();
    expect(onGameFocus).toHaveBeenCalledWith(0);
    fireEvent.click(first);
    expect(onSelectGame).toHaveBeenCalledExactlyOnceWith(mockGames[0]);
    rerender(<GridView {...props} focusedIndex={1} />);
    expect(document.activeElement).toBe(getByRole('button', { name: mockGames[1].name }));
    const favorite = getByRole('button', { name: `Toggle favorite for ${mockGames[1].name}` });
    favorite.focus();
    fireEvent.click(favorite);
    expect(onSelectGame).toHaveBeenCalledOnce();
    rerender(<GridView {...props} focusedIndex={0} />);
    expect(document.activeElement).toBe(favorite);
  });

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

  it('uses theme surface, text, and radius variables for game cards', () => {
    const { getByText } = render(<GridView games={[mockGames[0]]} onSelectGame={vi.fn()} />);

    const card = getByText(mockGames[0].name).closest('div[class*="cursor-pointer"]');

    expect(card?.classList).toContain('bg-[var(--theme-surface)]');
    expect(card?.classList).toContain('rounded-[var(--theme-radius-lg)]');
    expect(getByText(mockGames[0].name).classList).toContain('text-[var(--theme-text)]');
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
