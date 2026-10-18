import { describe, expect, it } from 'vitest';
import { getC64NavigationRails } from './c64-navigation-rails';
import { mockGames } from '../data/mockGames';
import type { BigBoxRailCategory } from '../hooks/useBigBoxLibraryData';

describe('C64 navigation rails', () => {
  it('retains curated rails and rail order while filling alphabet rails from visible games', () => {
    const rails: BigBoxRailCategory[] = [
      { id: 'recent', title: 'Recent', games: [mockGames[0]], type: 'recent' },
      { id: 'favorites', title: 'Favorites', games: [mockGames[1]], type: 'favorites' },
      { id: 'classics', title: 'Classics', games: [mockGames[0]], type: 'classics' },
      { id: 'alpha-#', title: 'Symbols', games: [], type: 'alphabet', letter: '#' },
      { id: 'alpha-A', title: 'A', games: [], type: 'alphabet', letter: 'A' },
      { id: 'alpha-B', title: 'B', games: [], type: 'alphabet', letter: 'B' },
    ];
    const games = [
      { ...mockGames[0], name: '1942' }, { ...mockGames[1], name: '  archon' },
      { ...mockGames[2], name: 'Boulder Dash' }, { ...mockGames[3], name: 'Another A' },
    ];
    const result = getC64NavigationRails(rails, games);
    expect(result.map((rail) => rail.id)).toEqual(rails.map((rail) => rail.id));
    for (let index = 0; index < 3; index++) expect(result[index]).toBe(rails[index]);
    expect(result[3].games).toEqual([games[0]]);
    expect(result[4].games).toEqual([games[1], games[3]]);
    expect(result[5].games).toEqual([games[2]]);
    expect(rails[4].games).toEqual([]);
  });

  it('keeps digits, punctuation, empty titles and non-ASCII initials under the symbol rail', () => {
    const games = ['1942', '!Bang', '', ' Éclair', ' Ωmega'].map((name) => ({ ...mockGames[0], name }));
    const rails: BigBoxRailCategory[] = [
      { id: 'alpha-#', title: 'Symbols', games: [], type: 'alphabet', letter: '#' },
      { id: 'alpha-Z', title: 'Z', games: [mockGames[0]], type: 'alphabet', letter: 'Z' },
    ];
    const result = getC64NavigationRails(rails, games);
    expect(result[0].games).toEqual(games);
    expect(result[1].games).toEqual([]);
  });

  it('preserves an alphabet rail without a letter and supports empty collections', () => {
    const rail: BigBoxRailCategory = { id: 'c64-library', title: 'Library', games: [mockGames[0]], type: 'alphabet' };
    expect(getC64NavigationRails([rail], [mockGames[1]])[0]).toBe(rail);
    expect(getC64NavigationRails([], [])).toEqual([]);
  });
});
