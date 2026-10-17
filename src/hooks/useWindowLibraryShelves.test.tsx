import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

const mockGetDbGames = vi.hoisted(() => vi.fn());

vi.mock('../lib/tauri-bridge', () => ({
  getDbGames: (...args: unknown[]) => mockGetDbGames(...args),
  isDebugMode: vi.fn().mockResolvedValue(false),
}));

import { useWindowLibraryShelves } from './useWindowLibraryShelves';
import { act } from '@testing-library/react';

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

  test('waits for activation and rejects results after deactivation', async () => {
    let resolve!: (games: []) => void;
    mockGetDbGames.mockReturnValue(new Promise<[]>((done) => { resolve = done; }));
    const props = {
      enabled: false, activePlatformId: 'c64', favoriteIds: ['2'], filters: {},
      recentlyPlayedIds: ['1'], searchInput: '',
    };
    const { result, rerender } = renderHook(useWindowLibraryShelves, { initialProps: props });
    expect(mockGetDbGames).not.toHaveBeenCalled();
    rerender({ ...props, enabled: true });
    expect(mockGetDbGames).toHaveBeenCalledTimes(3);
    rerender(props);
    await act(async () => resolve([]));
    expect(result.current).toEqual({ recentGames: [], favoriteGames: [], classicGames: [] });
  });
});
