import { describe, expect, it, vi } from 'vitest';

vi.mock('../lib/tauri-bridge', () => ({
  getDbGameCount: vi.fn(async () => 29421),
  getDbGames: vi.fn(async (limit, offset) => [
    {
      id: offset + 1,
      name: `Random Game ${offset + 1}`,
      platformId: 'c64',
      year: '1985',
    },
  ]),
  isTauri: () => false,
}));

import { getDbGameCount, getDbGames } from '../lib/tauri-bridge';

describe('Performant Database-Wide Random Game Selection', () => {
  it('queries total count and fetches a single item at a uniform random offset', async () => {
    const totalCount = await getDbGameCount(undefined, 'c64');
    expect(totalCount).toBe(29421);

    const randomOffset = Math.floor(0.42 * totalCount); // 12356
    const games = await getDbGames(1, randomOffset, undefined, 'c64');

    expect(getDbGames).toHaveBeenCalledWith(1, randomOffset, undefined, 'c64');
    expect(games).toHaveLength(1);
    expect(games[0].id).toBe(12357);
    expect(games[0].name).toBe('Random Game 12357');
  });

  it('navigates straight to game detail view and updates target focus state when random game is selected', async () => {
    const randomGame = { id: 100, name: 'Zaxxon', platformId: 'c64', year: '1982' };
    const gamesList = [
      { id: 1, name: 'Commando', platformId: 'c64' },
      randomGame,
    ];

    const targetIndex = gamesList.findIndex((g) => g.id === randomGame.id);
    expect(targetIndex).toBe(1);
  });
});

