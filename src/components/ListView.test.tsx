import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockGames } from '../data/mockGames';
import { ListView } from './ListView';

describe('ListView', () => {
  it('activates native game buttons once and synchronizes game focus without taking sort focus', () => {
    const onSelectGame = vi.fn();
    const onGameFocus = vi.fn();
    const props = { games: mockGames.slice(0, 2), onSelectGame, onSort: vi.fn(), onGameFocus };
    const { getByRole, rerender } = render(<ListView {...props} focusedIndex={0} />);
    const first = getByRole('button', { name: mockGames[0].name, exact: true });
    const second = getByRole('button', { name: mockGames[1].name, exact: true });
    first.focus();
    expect(onGameFocus).toHaveBeenCalledWith(0);
    fireEvent.click(first);
    expect(onSelectGame).toHaveBeenCalledExactlyOnceWith(mockGames[0]);
    rerender(<ListView {...props} focusedIndex={1} />);
    expect(document.activeElement).toBe(second);
    expect(second.getAttribute('aria-current')).toBe('true');
    const year = getByRole('button', { name: 'Year', exact: true });
    year.focus();
    rerender(<ListView {...props} focusedIndex={0} />);
    expect(document.activeElement).toBe(year);
  });

  it('provides native sorting buttons and exposes the current sort direction', () => {
    const { getByRole, rerender } = render(
      <ListView games={[mockGames[0]]} onSelectGame={vi.fn()} onSort={vi.fn()} sortBy="year" sortDirection="desc" />,
    );
    for (const name of ['Title', 'Year', 'Publisher', 'Genre']) {
      expect(getByRole('button', { name }).tagName).toBe('BUTTON');
    }
    expect(getByRole('columnheader', { name: 'Year' }).getAttribute('aria-sort')).toBe('descending');
    expect(getByRole('columnheader', { name: 'Title' }).hasAttribute('aria-sort')).toBe(false);
    rerender(<ListView games={[mockGames[0]]} onSelectGame={vi.fn()} onSort={vi.fn()} sortBy="name" sortDirection="asc" />);
    expect(getByRole('columnheader', { name: 'Title' }).getAttribute('aria-sort')).toBe('ascending');
    expect(getByRole('columnheader', { name: 'Year' }).hasAttribute('aria-sort')).toBe(false);
  });

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
    ['c64-edition', 'LIST INDEX_ALL'],
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

  it('updates its presenter when the persisted theme selection changes and reflects alphabetLabel/searchInput', () => {
    document.documentElement.setAttribute('data-theme', 'arcade-void');
    const { getByText, getByTestId, rerender } = render(
      <ListView games={[mockGames[0]]} onSelectGame={vi.fn()} onSort={vi.fn()} themeId="arcade-void" alphabetLabel="M" searchInput="mario" />,
    );

    expect(getByTestId('arcade-void-currently-viewing-container').classList).toContain('sticky');
    expect(getByTestId('arcade-void-currently-viewing-path').textContent).toBe('LIST INDEX_M SEARCH: MARIO');

    rerender(<ListView games={[mockGames[0]]} onSelectGame={vi.fn()} onSort={vi.fn()} themeId="c64-edition" alphabetLabel="M" searchInput="mario" />);

    expect(getByText('LIST INDEX_M SEARCH: MARIO')).toBeTruthy();

    rerender(<ListView games={[mockGames[0]]} onSelectGame={vi.fn()} onSort={vi.fn()} themeId="cyberpunk-crt" alphabetLabel="M" searchInput="mario" totalGameCount={42891} />);

    expect(getByTestId('cyberpunk-currently-viewing-container').classList).toContain('sticky');
    expect(getByTestId('cyberpunk-currently-viewing-container').classList).toContain('bg-[var(--theme-outline-variant)]');
    expect(getByTestId('cyberpunk-currently-viewing-path').textContent).toBe('LIST_ INDEX_M SEARCH: MARIO');
    expect(getByTestId('cyberpunk-eddies-count').textContent).toBe('EDDIES_ 42,891');
  });
});

