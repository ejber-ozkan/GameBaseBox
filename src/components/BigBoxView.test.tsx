import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BigBoxView } from './BigBoxView';
import { mockGames } from '../data/mockGames';

vi.mock('../hooks/useFavorites', () => ({
  useFavorites: () => ({ favorites: [], isFavorite: () => false, toggleFavorite: vi.fn() }),
}));
vi.mock('../hooks/useInputMode', () => ({
  useInputMode: () => ({ isMouseMode: false, onGamepadInput: vi.fn() }),
}));
vi.mock('../hooks/useBigBoxLibraryData', () => ({
  useBigBoxLibraryData: () => ({
    flatGames: [mockGames[0]],
    genres: [],
    loading: false,
    rails: [
      { id: 'classics', title: 'Legendary Classics', games: [mockGames[0]], type: 'classics' },
      { id: 'alpha-A', title: 'Letter A', games: [mockGames[1]], type: 'alphabet', letter: 'A' },
    ],
    subGenres: [],
    totalGameCount: 2,
  }),
}));
vi.mock('../hooks/useBigBoxNavigation', () => ({
  useBigBoxNavigation: () => ({
    currentRailId: 'classics',
    currentRailType: 'classics',
    focusHeader: vi.fn(),
    focusRailItem: vi.fn(),
    focusSearch: vi.fn(),
    handleKeyDown: vi.fn(),
    jumpToRail: vi.fn(),
    sectionJumpDirection: null,
    setSectionJumpDirection: vi.fn(),
  }),
}));
vi.mock('../hooks/useBigBoxScrollSync', () => ({
  useBigBoxScrollSync: () => ({ scrollContainerRef: { current: null }, headerRef: { current: null } }),
}));
vi.mock('../hooks/useFullscreenLayoutMetrics', () => ({
  useFullscreenLayoutMetrics: () => ({ gridColumns: 6, maxVisibleSubGenres: 4 }),
}));
vi.mock('./bigbox/BigBoxHeader', () => ({ BigBoxHeader: () => <div /> }));
vi.mock('./bigbox/BigBoxAlphabetRail', () => ({
  BigBoxAlphabetRail: ({ rail }: { rail: { title: string } }) => <h2>{rail.title}</h2>,
}));
vi.mock('./bigbox/BigBoxFooter', () => ({ BigBoxFooter: () => <div /> }));
vi.mock('./bigbox/BigBoxExitPrompt', () => ({ BigBoxExitPrompt: () => null }));
vi.mock('./HorizontalRail', () => ({
  HorizontalRail: ({ title }: { title: string }) => <h2>{title}</h2>,
}));
vi.mock('./ControllerSearchKeyboard', () => ({ ControllerSearchKeyboard: () => null }));
vi.mock('./SubGenrePickerModal', () => ({ SubGenrePickerModal: () => null }));
vi.mock('./library/C64EditionGrid', () => ({
  C64EditionGrid: ({ games }: { games: typeof mockGames }) => <div data-testid="c64-edition-grid">{games[0]?.name}</div>,
}));
vi.mock('../lib/ui-sound-effects', () => ({
  playRotatingUiSoundEffect: vi.fn(),
  playUiSoundEffect: vi.fn(),
  playUiSoundEffectAndWait: vi.fn(),
}));

describe('BigBoxView', () => {
  afterEach(() => {
    delete document.documentElement.dataset.theme;
  });

  it('uses the same C64 Edition monitor-grid presentation as the windowed library', () => {
    document.documentElement.dataset.theme = 'c64-edition';

    render(
      <BigBoxView
        filters={{}}
        onFiltersChange={vi.fn()}
        onPlatformSelect={vi.fn()}
        onRequestExit={vi.fn()}
        onSearchChange={vi.fn()}
        onSelectGame={vi.fn()}
        onSessionChange={vi.fn()}
        onShowSettings={vi.fn()}
        searchInput=""
        settings={{
          activePlatformId: 'c64', confirmFullscreenExit: true, lastBigBoxGameId: null, lastBigBoxRailId: null, recentlyPlayedIds: [],
        } as never}
      />,
    );

    expect(screen.queryByTestId('c64-edition-grid')).toBeTruthy();
    expect(screen.getByTestId('c64-edition-grid').textContent).toBe(mockGames[0].name);
  });

  it('keeps letter rails after classics without a pulsing decorative overlay', () => {
    const { container } = render(
      <BigBoxView
        filters={{}}
        onFiltersChange={vi.fn()}
        onPlatformSelect={vi.fn()}
        onRequestExit={vi.fn()}
        onSearchChange={vi.fn()}
        onSelectGame={vi.fn()}
        onSessionChange={vi.fn()}
        onShowSettings={vi.fn()}
        searchInput=""
        settings={{
          activePlatformId: 'c64',
          confirmFullscreenExit: true,
          lastBigBoxGameId: null,
          lastBigBoxRailId: null,
          recentlyPlayedIds: [],
        } as never}
      />,
    );

    expect(screen.getAllByRole('heading').map((heading) => heading.textContent)).toEqual([
      'Legendary Classics',
      'Letter A',
    ]);
    expect(container.querySelector('.animate-pulse')).toBeNull();
  });
});
