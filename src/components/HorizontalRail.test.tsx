import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockGames } from '../data/mockGames';
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
});
