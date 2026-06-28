import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockGames } from '../data/mockGames';
import { ListView } from './ListView';

describe('ListView', () => {
  afterEach(() => {
    vi.restoreAllMocks();
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
});
