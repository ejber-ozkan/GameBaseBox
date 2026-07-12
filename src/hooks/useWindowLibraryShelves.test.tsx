import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

const mockGetDbGames = vi.hoisted(() => vi.fn());

vi.mock('../lib/tauri-bridge', () => ({
  getDbGames: (...args: unknown[]) => mockGetDbGames(...args),
}));

import { useWindowLibraryShelves } from './useWindowLibraryShelves';

describe('useWindowLibraryShelves', () => {
  afterEach(() => vi.clearAllMocks());

  test('starts independent shelf queries together', async () => {
    let releaseQueries!: () => void;
    const queriesReleased = new Promise<void>((resolve) => { releaseQueries = resolve; });
    mockGetDbGames.mockImplementation(async () => {
      await queriesReleased;
      return [];
    });

    renderHook(() => useWindowLibraryShelves({
      activePlatformId: 'c64',
      favoriteIds: ['2'],
      filters: {},
      recentlyPlayedIds: ['1'],
      searchInput: '',
    }));

    await waitFor(() => expect(mockGetDbGames).toHaveBeenCalledTimes(3));
    releaseQueries();
  });
});
