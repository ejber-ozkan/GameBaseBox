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

    expect(container.querySelector('[data-testid="theme-list-view"]')).toBeTruthy();
    expect(getByText(mockGames[0].name).closest('tr')?.classList).toContain('bg-[var(--theme-primary-container)]');
    expect(getByText(mockGames[0].name).closest('td')?.classList).toContain('text-[var(--theme-text)]');
  });

  it.each([
    ['arcade-void', 'ACTIVE PLATFORM'],
    ['c64-edition', 'DATABASE_ROOT/GAMES/INDEX_A'],
    ['cyberpunk-crt', 'SYSTEM_DIAGNOSTICS'],
  ])('uses the %s list presenter while retaining the shared game data contract', (themeId, presenterLabel) => {
    document.documentElement.setAttribute('data-theme', themeId);

    const { getAllByText, getByText, getByRole } = render(
      <ListView
        games={[mockGames[0]]}
        onSelectGame={vi.fn()}
        onSort={vi.fn()}
        focusedIndex={0}
        activePlatformName="Commodore 64"
        totalGameCount={42891}
        favoriteCount={128}
      />,
    );

    expect(getByText(presenterLabel)).toBeTruthy();
    expect(getByRole('columnheader', { name: '#' })).toBeTruthy();
    expect(getByRole('columnheader', { name: 'System' })).toBeTruthy();
    expect(getByText('0001')).toBeTruthy();
    expect(getAllByText('Commodore 64').length).toBeGreaterThan(0);
    expect(getByText('42,891')).toBeTruthy();
    if (themeId !== 'c64-edition') expect(getByText('128')).toBeTruthy();
    expect(getByText(mockGames[0].name).closest('tr')?.getAttribute('data-focused')).toBe('true');
  });

  it('labels unavailable diagnostics rather than inventing values', () => {
    document.documentElement.setAttribute('data-theme', 'cyberpunk-crt');

    const { getAllByText } = render(
      <ListView games={[mockGames[0]]} onSelectGame={vi.fn()} onSort={vi.fn()} activePlatformName="Commodore 64" />,
    );

    expect(getAllByText('NOT_AVAILABLE')).toHaveLength(3);
  });

  it('updates its presenter when the persisted theme selection changes', () => {
    document.documentElement.setAttribute('data-theme', 'arcade-void');
    const { getByText, rerender } = render(
      <ListView games={[mockGames[0]]} onSelectGame={vi.fn()} onSort={vi.fn()} themeId="arcade-void" />,
    );

    rerender(<ListView games={[mockGames[0]]} onSelectGame={vi.fn()} onSort={vi.fn()} themeId="c64-edition" />);

    expect(getByText('DATABASE_ROOT/GAMES/INDEX_A')).toBeTruthy();
  });
});
