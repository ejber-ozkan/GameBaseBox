import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockGames } from '../../data/mockGames';
import { BigBoxAlphabetRail } from './BigBoxAlphabetRail';
import { FullscreenLayoutMetrics } from '../../hooks/useFullscreenLayoutMetrics';

vi.mock('../BigBoxTileMedia', () => ({
  BigBoxTileMedia: ({ enabled }: { enabled: boolean }) => (
    <div data-testid="tile-media" data-enabled={enabled ? 'true' : 'false'} />
  ),
}));

const mockLayout: FullscreenLayoutMetrics = {
  gridColumns: 4,
  gridGap: 16,
  railPaddingX: 24,
  railSectionGap: 24,
  railTitleSize: 24,
  tileMetaPadding: 8,
  chipFontSize: 12,
  headerTitleSize: 32,
  tileFocusScale: 1.1,
  maxVisibleSubGenres: 5,
  headerPaddingY: 16,
  headerTitleGap: 12,
  badgeFontSize: 10,
};

describe('BigBoxAlphabetRail', () => {
  it('renders search-results rail with full opacity and media enabled even when not active', () => {
    const searchRail = {
      id: 'search-results',
      title: 'Results for "pole"',
      games: [mockGames[0]],
      type: 'alphabet' as const,
    };

    render(
      <BigBoxAlphabetRail
        focusedIdx={0}
        isActive={false}
        isFavorite={() => false}
        layout={mockLayout}
        onFocus={vi.fn()}
        onSelectGame={vi.fn()}
        rail={searchRail}
      />,
    );

    const railContainer = screen.getByTestId('tile-media').closest('[data-rail-id="search-results"]');
    expect(railContainer?.classList).toContain('opacity-100');
    expect(screen.getByTestId('tile-media').getAttribute('data-enabled')).toBe('true');
  });
});
