import { render } from '@testing-library/react';
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
        title="Recent Games"
      />,
    );

    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringContaining('Encountered two children with the same key'),
      expect.anything(),
    );
  });
});
