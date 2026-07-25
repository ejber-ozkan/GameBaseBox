import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockGames } from '../data/mockGames';
import { buildFullscreenLayoutMetrics } from '../hooks/useFullscreenLayoutMetrics';
import { HorizontalRail } from './HorizontalRail';

vi.mock('./BigBoxTileMedia', () => ({
  BigBoxTileMedia: () => <div data-testid="tile-media" />,
}));

describe('HorizontalRail', () => {
  it('uses themed card surfaces and custom theme radii', () => {
    const { container, getByRole } = render(
      <HorizontalRail
        games={[mockGames[0]]}
        focusedIndex={0}
        isActive
        onFocusChange={vi.fn()}
        onSelectGame={vi.fn()}
        title="Recent games"
      />,
    );

    expect(getByRole('heading').classList).toContain('text-[var(--theme-primary)]');
    expect(container.querySelector('.group')?.classList).toContain('bg-[var(--theme-surface)]');
    expect(container.querySelector('.group')?.classList).toContain('rounded-[var(--theme-radius-xl)]');
  });

  it('uses the Arcade Void cinematic card size for large rails at 1080p', () => {
    const layout = buildFullscreenLayoutMetrics('comfortable', {
      dpr: 1,
      height: 1080,
      physicalHeight: 1080,
      physicalWidth: 1920,
      width: 1920,
    });
    const { container } = render(
      <HorizontalRail
        games={[mockGames[0]]}
        focusedIndex={0}
        isActive
        layout={layout}
        onFocusChange={vi.fn()}
        onSelectGame={vi.fn()}
        tileScale="large"
        title="Recent games"
      />,
    );

    const card = container.querySelector('.group');
    expect(card?.getAttribute('style')).toContain('aspect-ratio: 16 / 9');
    expect(card?.getAttribute('style')).toContain('width: 440px');
  });
});
