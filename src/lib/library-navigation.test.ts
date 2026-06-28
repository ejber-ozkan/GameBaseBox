import { describe, expect, it } from 'vitest';
import {
  getLibraryColumnCount,
  getNextLetterJump,
  moveLibraryFocusHorizontally,
  moveLibraryFocusVertically,
  resolveFocusedGame,
} from './library-navigation';

const letters = ['#', 'A', 'B', 'C'];

describe('library-navigation', () => {
  it('calculates column counts by mode and width', () => {
    expect(getLibraryColumnCount('list', 1400)).toBe(1);
    expect(getLibraryColumnCount('grid', 1400)).toBe(6);
    expect(getLibraryColumnCount('grid', 900)).toBe(4);
    expect(getLibraryColumnCount('grid', 500)).toBe(2);
  });

  it('cycles letter jumps in both directions', () => {
    expect(getNextLetterJump(undefined, 'forward', letters)).toBe('#');
    expect(getNextLetterJump('A', 'forward', letters)).toBe('B');
    expect(getNextLetterJump('#', 'backward', letters)).toBe('C');
  });

  it('moves focus horizontally within bounds', () => {
    expect(moveLibraryFocusHorizontally(3, 'RIGHT', -2, 10)).toBe(4);
    expect(moveLibraryFocusHorizontally(10, 'RIGHT', -2, 10)).toBe(10);
    expect(moveLibraryFocusHorizontally(-2, 'LEFT', -2, 10)).toBe(-2);
  });

  it('moves focus vertically between shelf and grid', () => {
    expect(moveLibraryFocusVertically(-3, 'DOWN', 6, 3, 20)).toBe(0);
    expect(moveLibraryFocusVertically(1, 'UP', 6, 3, 20)).toBe(-3);
    expect(moveLibraryFocusVertically(12, 'UP', 6, 3, 20)).toBe(6);
    expect(moveLibraryFocusVertically(18, 'DOWN', 6, 3, 20)).toBe(20);
  });

  it('resolves focused game from recent shelf and main grid', () => {
    const games = [
      { id: '1', name: 'First' },
      { id: '2', name: 'Second' },
      { id: '3', name: 'Third' },
    ] as const;

    expect(resolveFocusedGame(-1, [...games], ['2'])).toEqual(games[1]);
    expect(resolveFocusedGame(0, [...games], ['2'])).toEqual(games[0]);
    expect(resolveFocusedGame(99, [...games], ['2'])).toBeNull();
  });
});
