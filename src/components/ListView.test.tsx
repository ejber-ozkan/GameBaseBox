import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockGames } from '../data/mockGames';
import { ListView } from './ListView';

describe('ListView', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders duplicate game records without duplicate React key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ListView
        games={[mockGames[0], mockGames[0]]}
        onSelectGame={vi.fn()}
        onSort={vi.fn()}
      />,
    );

    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringContaining('Encountered two children with the same key'),
      expect.anything(),
    );
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

    render(<ListView games={[mockGames[0]]} onSelectGame={vi.fn()} onSort={vi.fn()} onEndReached={onEndReached} />);

    act(() => {
      callback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    });

    expect(onEndReached).toHaveBeenCalledOnce();
  });

  it('uses theme variables for the table surface, text, and focused rows', () => {
    const { container, getByText } = render(
      <ListView games={[mockGames[0]]} onSelectGame={vi.fn()} onSort={vi.fn()} focusedIndex={0} />,
    );

    expect(container.firstElementChild?.classList).toContain('bg-[var(--theme-background)]');
    expect(getByText(mockGames[0].name).closest('tr')?.classList).toContain('bg-[var(--theme-primary-container)]');
    expect(getByText(mockGames[0].name).closest('td')?.classList).toContain('text-[var(--theme-text)]');
  });
});
