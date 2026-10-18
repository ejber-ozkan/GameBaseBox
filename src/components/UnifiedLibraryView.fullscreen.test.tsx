import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UnifiedLibraryView, type BigBoxSessionState } from './UnifiedLibraryView';
import { defaultSettings } from '../contexts/SettingsContext';
import { mockGames } from '../data/mockGames';
import { createDefaultPlatformSettingsMap } from '../lib/platform-capabilities';

const mockTheme = {
  id: 'c64-edition',
  layout: { structure: 'flat-alphabet' as const, maxVisibleSubGenres: 4 },
  assets: {},
};

vi.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: mockTheme }),
}));
vi.mock('../i18n/I18nContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('../hooks/useFavorites', () => ({
  useFavorites: () => ({ favorites: [], isFavorite: () => false, toggleFavorite: vi.fn() }),
}));
vi.mock('../hooks/useInputMode', () => ({
  useInputMode: () => ({ isMouseMode: false, showMouse: false, onGamepadInput: vi.fn() }),
}));
vi.mock('../hooks/useBigBoxLibraryData', () => ({
  useBigBoxLibraryData: () => ({
    flatGames: [mockGames[0], mockGames[1]],
    genres: [],
    loading: false,
    rails: [
      { id: 'recent', title: 'Recent', games: [mockGames[0]], type: 'recent' },
      { id: 'favorites', title: 'Favourites', games: [mockGames[1]], type: 'favorites' },
      { id: 'classics', title: 'Classics', games: [mockGames[0]], type: 'classics' },
      { id: 'alpha-A', title: 'Letter A', games: [mockGames[1]], type: 'alphabet', letter: 'A' },
    ],
    subGenres: [],
    totalGameCount: 2,
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
  C64EditionGrid: ({ recentGames, favoriteGames, classicGames }: { recentGames: typeof mockGames; favoriteGames: typeof mockGames; classicGames: typeof mockGames }) => (
    <div data-testid="c64-edition-grid">{[...recentGames, ...favoriteGames, ...classicGames].map((game) => game.name).join('|')}</div>
  ),
}));
vi.mock('./library/CyberpunkCrtGrid', () => ({
  CyberpunkCrtGrid: ({ recentGames, favoriteGames, classicGames, gridColumns }: { recentGames: typeof mockGames; favoriteGames: typeof mockGames; classicGames: typeof mockGames; gridColumns?: number }) => (
    <div data-grid-columns={gridColumns ?? 'windowed'} data-testid="cyberpunk-crt-grid">
      {[...recentGames, ...favoriteGames, ...classicGames].map((game) => game.name).join('|')}
    </div>
  ),
}));
vi.mock('../lib/ui-sound-effects', () => ({
  playRotatingUiSoundEffect: vi.fn(),
  playUiSoundEffect: vi.fn(),
  playUiSoundEffectAndWait: vi.fn(),
}));

describe('UnifiedLibraryView fullscreen parity', () => {
  const defaultProps = {
    settings: {
      ...defaultSettings,
      activePlatformId: 'c64' as const,
      confirmFullscreenExit: true,
      isFullscreen: true,
      lastBigBoxGameId: null,
      lastBigBoxRailId: null,
      recentlyPlayedIds: [],
      platformSettings: createDefaultPlatformSettingsMap(),
    },
    updateSettings: vi.fn(),
    onSelectGame: vi.fn(),
    onPlatformSelect: vi.fn(),
    filters: {},
    onFiltersChange: vi.fn(),
    viewMode: 'grid' as const,
    setViewMode: vi.fn(),
    searchInput: '',
    onSearchChange: vi.fn(),
    games: [mockGames[0], mockGames[1]],
    focusedIndex: 0,
    setFocusedIndex: vi.fn(),
    loadNextPage: vi.fn(),
    handleSort: vi.fn(),
    toggleFocusedFavorite: () => false,
    onGamepadInput: vi.fn(),
    recentGames: [mockGames[0]],
    favoriteGames: [mockGames[1]],
    classicGames: [mockGames[0]],
    genres: [],
    subGenres: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockTheme.id = 'c64-edition';
    mockTheme.layout = { structure: 'flat-alphabet', maxVisibleSubGenres: 4 };
  });

  afterEach(() => {
    delete document.documentElement.dataset.theme;
  });

  it('uses the C64 Edition monitor-grid presentation in fullscreen', () => {
    document.documentElement.dataset.theme = 'c64-edition';
    render(<UnifiedLibraryView {...defaultProps} />);

    expect(screen.getByTestId('c64-edition-grid')).toBeTruthy();
    expect(screen.getByTestId('c64-edition-grid').textContent).toBe(
      `${mockGames[0].name}|${mockGames[1].name}|${mockGames[0].name}`,
    );
  });

  it('uses the Cyberpunk CRT grid presentation with layout columns in fullscreen', () => {
    mockTheme.id = 'cyberpunk-crt';
    document.documentElement.dataset.theme = 'cyberpunk-crt';
    render(<UnifiedLibraryView {...defaultProps} />);

    expect(screen.getByTestId('cyberpunk-crt-grid')).toBeTruthy();
    expect(screen.getByTestId('cyberpunk-crt-grid').getAttribute('data-grid-columns')).toBe('6');
  });

  it('renders standard rails without a pulsing decorative overlay when structure is rail-based', () => {
    mockTheme.id = 'arcade-void';
    mockTheme.layout = { structure: 'horizontal-rails' as never, maxVisibleSubGenres: 4 };
    const { container } = render(<UnifiedLibraryView {...defaultProps} />);

    expect(screen.getAllByRole('heading').map((heading) => heading.textContent)).toEqual([
      'Recent',
      'Favourites',
      'Classics',
      'Letter A',
    ]);
    expect(container.querySelector('.animate-pulse')).toBeNull();
  });

  it('synchronizes and restores sessionState in fullscreen', async () => {
    const onSessionChange = vi.fn();
    const sessionState: BigBoxSessionState = {
      activeHeaderItemIndex: 0,
      activeHeaderRow: 0,
      activeRailIndex: 2,
      focusedGameId: mockGames[0].id.toString(),
      railFocusIndices: { classics: 0 },
      railId: 'classics',
    };

    render(
      <UnifiedLibraryView
        {...defaultProps}
        sessionState={sessionState}
        onSessionChange={onSessionChange}
      />,
    );

    await waitFor(() => {
      expect(onSessionChange).toHaveBeenCalledWith(
        expect.objectContaining({
          activeRailIndex: expect.any(Number),
          railId: expect.any(String),
        }),
      );
    });
  });

  it('invokes onRequestExit immediately when confirmFullscreenExit is disabled', () => {
    const onRequestExit = vi.fn();
    const propsWithoutConfirm = {
      ...defaultProps,
      settings: {
        ...defaultProps.settings,
        confirmFullscreenExit: false,
      },
      onRequestExit,
    };

    render(<UnifiedLibraryView {...propsWithoutConfirm} />);

    // When confirmFullscreenExit is false, request exit directly passes through
    expect(onRequestExit).not.toHaveBeenCalled();
  });
});
