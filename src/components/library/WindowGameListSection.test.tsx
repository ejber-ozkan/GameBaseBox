import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockGames } from '../../data/mockGames';
import { WindowGameListSection } from './WindowGameListSection';

describe('WindowGameListSection', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders duplicate game records without duplicate React key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <WindowGameListSection
        games={[mockGames[0], mockGames[0]]}
        isFavorite={() => false}
        onSelectGame={vi.fn()}
        section="recent"
        title="Recent Games"
      />,
    );

    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringContaining('Encountered two children with the same key'),
      expect.anything(),
    );
  });

  it.each([
    ['recent', 'compact'],
    ['favorites', 'supporting'],
    ['legendary', 'featured'],
  ] as const)('uses a compact %s list header for %s', (section, hierarchy) => {
    render(
      <WindowGameListSection
        games={[mockGames[0]]}
        isFavorite={() => false}
        onSelectGame={vi.fn()}
        section={section}
        title="Section title"
      />,
    );

    const header = screen.getByTestId('window-list-header');
    expect(header.getAttribute('data-section')).toBe(section);
    expect(header.getAttribute('data-hierarchy')).toBe(hierarchy);
    expect(header.getAttribute('data-density')).toBe('compact');
    expect(screen.queryByTestId('window-list-divider')).toBeNull();
  });
});
