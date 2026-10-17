import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnifiedLibraryView } from './UnifiedLibraryView';
import { defaultSettings } from '../contexts/SettingsContext';
import { getDbGames, getDbGameCount, getGenres, getSubGenres } from '../lib/tauri-bridge';
import { mockGames } from '../data/mockGames';

const emptyIds: string[] = [];
const noop = vi.fn();
vi.mock('../contexts/ThemeContext', () => ({ useTheme: () => ({ theme: {
  id: 'c64-edition', layout: { structure: 'flat-alphabet' }, assets: {},
} }) }));
vi.mock('../i18n/I18nContext', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('../hooks/useFavorites', () => ({ useFavorites: () => ({ favorites: emptyIds, toggleFavorite: noop, isFavorite: () => false }) }));
vi.mock('../hooks/useInputMode', () => ({ useInputMode: () => ({ showMouse: true, isMouseMode: true }) }));
vi.mock('../hooks/useUnifiedLibraryNavigation', () => ({ useUnifiedLibraryNavigation: () => ({
  currentRailId: null, currentRailType: null, jumpToRail: noop, focusRailItem: noop,
  focusHeader: noop, focusSearch: noop, setSectionJumpDirection: noop,
}) }));
vi.mock('../hooks/useBigBoxScrollSync', () => ({ useBigBoxScrollSync: () => ({ scrollContainerRef: { current: null }, headerRef: { current: null } }) }));
vi.mock('../hooks/useFullscreenLayoutMetrics', () => ({ useFullscreenLayoutMetrics: () => ({ gridColumns: 6, maxVisibleSubGenres: 4 }) }));
vi.mock('../lib/tauri-bridge', () => ({ exitApp: vi.fn(), getDbGames: vi.fn(), getDbGameCount: vi.fn(), getGenres: vi.fn(), getSubGenres: vi.fn(), isDebugMode: vi.fn().mockResolvedValue(false) }));
vi.mock('./library/LibraryHeader', () => ({ LibraryHeader: () => null }));
vi.mock('./AlphabetJumpBar', () => ({ AlphabetJumpBar: () => null }));
vi.mock('./library/C64EditionGrid', () => ({ C64EditionGrid: () => null }));
vi.mock('./ControllerSearchKeyboard', () => ({ ControllerSearchKeyboard: () => null }));
vi.mock('./SubGenrePickerModal', () => ({ SubGenrePickerModal: () => null }));
vi.mock('./bigbox/BigBoxHeader', () => ({ BigBoxHeader: () => null }));
vi.mock('./bigbox/BigBoxFooter', () => ({ BigBoxFooter: () => null }));
vi.mock('./bigbox/BigBoxExitPrompt', () => ({ BigBoxExitPrompt: () => null }));
vi.mock('./ListView', () => ({ ListView: ({ games }: { games: typeof mockGames }) => <output data-testid="list-ids">{games.map((game) => game.id).join(',')}</output> }));

describe('active presentation data', () => {
  const filters = {};
  const props = {
    settings: { ...defaultSettings, activePlatformId: 'c64' as const, isFullscreen: false },
    updateSettings: noop, onSelectGame: noop, onPlatformSelect: noop, filters, onFiltersChange: noop,
    viewMode: 'grid' as const, setViewMode: noop, searchInput: '', onSearchChange: noop,
    games: mockGames.slice(0, 2), focusedIndex: 0, setFocusedIndex: noop, loadNextPage: noop,
    handleSort: noop, toggleFocusedFavorite: () => false, onGamepadInput: noop,
    recentGames: [], favoriteGames: [], classicGames: [], genres: [], subGenres: [],
  };
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getDbGames).mockResolvedValue([]);
    vi.mocked(getDbGameCount).mockResolvedValue(30000);
    vi.mocked(getGenres).mockResolvedValue([]);
    vi.mocked(getSubGenres).mockResolvedValue([]);
  });

  it('avoids hidden fullscreen queries and loads the fullscreen grid when activated', async () => {
    const { rerender } = render(<UnifiedLibraryView {...props} />);
    await act(async () => {});
    expect(getDbGames).not.toHaveBeenCalled();
    expect(getDbGameCount).not.toHaveBeenCalled();
    rerender(<UnifiedLibraryView {...props} settings={{ ...props.settings, isFullscreen: true }} />);
    await waitFor(() => expect(getDbGames).toHaveBeenCalledWith(30000, 0, expect.any(Object), 'c64'));
  });

  it('uses the shared effective query while raw search input is changing', async () => {
    const fullscreen = { ...props, settings: { ...props.settings, isFullscreen: true } };
    const { rerender } = render(<UnifiedLibraryView {...fullscreen} />);
    await waitFor(() => expect(getDbGames).toHaveBeenCalledWith(30000, 0, expect.any(Object), 'c64'));
    vi.mocked(getDbGames).mockClear();
    rerender(<UnifiedLibraryView {...fullscreen} searchInput="com" />);
    await act(async () => {});
    expect(getDbGames).not.toHaveBeenCalled();
    rerender(<UnifiedLibraryView {...fullscreen} searchInput="comm" filters={{ searchQuery: 'comm' }} />);
    await waitFor(() => expect(getDbGames).toHaveBeenCalledWith(500, 0, expect.objectContaining({ searchQuery: 'comm' }), 'c64'));
  });

  it('uses the paged library in fullscreen list mode without loading the grid catalogue', async () => {
    render(<UnifiedLibraryView {...props} viewMode="list" settings={{ ...props.settings, isFullscreen: true }} />);
    await act(async () => {});
    expect(getDbGames).not.toHaveBeenCalled();
    expect(screen.getByTestId('list-ids').textContent).toBe('1,2');
  });
});
