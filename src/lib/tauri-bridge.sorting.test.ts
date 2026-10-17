import { describe, expect, it, vi } from 'vitest';
import { getDbGames } from './tauri-bridge';
import { mockGames } from '../data/mockGames';

vi.mock('../data/mockGames', () => ({
  mockGames: Array.from({ length: 361 }, (_, index) => ({
    id: 361 - index,
    name: `Entry ${(361 - index) % 7}`,
    platformId: 'c64',
    year: index % 11 === 0 ? null : 1980 + index % 13,
    publisher: index % 9 === 0 ? null : { name: `Publisher ${index % 5}` },
    parentGenre: `Genre ${index % 3}`,
  })),
}));

describe('browser paginated sorting', () => {
  it.each(['name', 'year', 'publisher', 'parentGenre'] as const)('sorts %s across all pages with stable ties and nulls last', async (column) => {
    for (const direction of ['asc', 'desc'] as const) {
      const expected = [...mockGames].sort((a, b) => {
        const left = column === 'publisher' ? a.publisher?.name ?? null : a[column];
        const right = column === 'publisher' ? b.publisher?.name ?? null : b[column];
        if (left === null && right !== null) return 1;
        if (left !== null && right === null) return -1;
        const primary = left === right ? 0 : left! < right! ? -1 : 1;
        const name = a.name === b.name ? 0 : a.name < b.name ? -1 : 1;
        return (direction === 'asc' ? primary : -primary) || name || (String(a.id) < String(b.id) ? -1 : 1);
      }).map((game) => game.id);
      const actual: number[] = [];
      for (const offset of [0, 120, 240, 360]) {
        const page = await getDbGames(120, offset, { hideAdult: false, sortBy: column, sortDirection: direction });
        actual.push(...page.map((game) => game.id));
      }
      expect(actual).toEqual(expected);
    }
  });

  it('defaults to title ascending for existing callers', async () => {
    const games = await getDbGames(361);
    expect(games.map((game) => game.name)).toEqual(mockGames.map((game) => game.name).sort());
  });
});
