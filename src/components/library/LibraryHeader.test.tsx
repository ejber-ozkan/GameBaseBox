import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LibraryHeader } from './LibraryHeader';

describe('LibraryHeader', () => {
  it('shows the total game count beside the active platform selector', () => {
    render(
      <LibraryHeader
        activePlatformId="c64"
        filters={{}}
        genres={[]}
        onExit={vi.fn()}
        onFiltersChange={vi.fn()}
        onOpenSettings={vi.fn()}
        onPlatformSelect={vi.fn()}
        onSearchChange={vi.fn()}
        onViewModeChange={vi.fn()}
        searchInput=""
        subGenres={[]}
        totalGameCount={42891}
        viewMode="grid"
      />,
    );

    const platformSelect = screen.getByLabelText('Active platform');
    const gameCount = screen.getByText('42,891 Games');
    expect(platformSelect.parentElement?.parentElement?.contains(gameCount)).toBe(true);
  });
});
