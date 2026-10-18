import type { Game } from '../types/game';
import type { BigBoxRailCategory } from '../hooks/useBigBoxLibraryData';

export function getC64NavigationRails(rails: BigBoxRailCategory[], flatGames: Game[]): BigBoxRailCategory[] {
  const gamesByLetter = new Map<string, Game[]>();
  for (let i = 0; i < flatGames.length; i++) {
    const game = flatGames[i];
    const firstChar = game.name.trim().charAt(0).toUpperCase();
    const letter = /[A-Z]/.test(firstChar) ? firstChar : '#';
    let list = gamesByLetter.get(letter);
    if (!list) {
      list = [];
      gamesByLetter.set(letter, list);
    }
    list.push(game);
  }

  return rails.map((rail) => {
    if (rail.type !== 'alphabet' || !rail.letter) {
      return rail;
    }

    return { ...rail, games: gamesByLetter.get(rail.letter) ?? [] };
  });
}
