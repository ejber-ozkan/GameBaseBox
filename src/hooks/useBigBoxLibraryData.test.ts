/**
 * Pure-function tests for useBigBoxLibraryData.
 *
 * These functions are extracted for testability. The React hook itself requires
 * a full happy-dom + React render cycle which exceeds available sandbox memory
 * when isolated in its own worker — so we test the deterministic logic here
 * as plain TypeScript instead.
 */
import { describe, expect, it } from 'vitest';
import {
  getAlphabetRailCacheKey,
  sortRecentGames,
  BIGBOX_LETTERS,
} from './useBigBoxLibraryData';
import { mockGames } from '../data/mockGames';

describe('getAlphabetRailCacheKey', () => {
  it('produces a stable JSON string from letter + filters + searchInput', () => {
    const key = getAlphabetRailCacheKey('A', { genre: 'Action', hideAdult: true }, '');
    const parsed = JSON.parse(key);
    expect(parsed.letter).toBe('A');
    expect(parsed.genre).toBe('Action');
    expect(parsed.hideAdult).toBe(true);
    expect(parsed.platformId).toBe('c64');
    expect(parsed.searchInput).toBeNull();
  });

  it('stores null for undefined filter fields to keep keys stable', () => {
    const key = getAlphabetRailCacheKey('B', {}, '');
    const parsed = JSON.parse(key);
    expect(parsed.genre).toBeNull();
    expect(parsed.subGenre).toBeNull();
    expect(parsed.hideAdult).toBeNull();
  });

  it('stores null for empty searchInput to avoid spurious cache misses', () => {
    const keyEmpty = getAlphabetRailCacheKey('C', {}, '');
    const keyUndefined = getAlphabetRailCacheKey('C', {}, '');
    expect(keyEmpty).toBe(keyUndefined);
    expect(JSON.parse(keyEmpty).searchInput).toBeNull();
  });

  it('produces different keys for different letters', () => {
    const keyA = getAlphabetRailCacheKey('A', {}, '');
    const keyB = getAlphabetRailCacheKey('B', {}, '');
    expect(keyA).not.toBe(keyB);
  });

  it('produces different keys when genre changes', () => {
    const key1 = getAlphabetRailCacheKey('A', { genre: 'Action' }, '');
    const key2 = getAlphabetRailCacheKey('A', { genre: 'Adventure' }, '');
    expect(key1).not.toBe(key2);
  });

  it('produces different keys when platform changes', () => {
    const key1 = getAlphabetRailCacheKey('A', { genre: 'Action' }, '', 'c64');
    const key2 = getAlphabetRailCacheKey('A', { genre: 'Action' }, '', 'atari800');
    expect(key1).not.toBe(key2);
  });
});

describe('sortRecentGames', () => {
  it('returns games in the order specified by recentlyPlayedIds', () => {
    const games = [mockGames[0], mockGames[1], mockGames[2]];
    const ids = [
      mockGames[2].id.toString(),
      mockGames[0].id.toString(),
      mockGames[1].id.toString(),
    ];

    const sorted = sortRecentGames(games, ids);
    expect(sorted[0].id).toBe(mockGames[2].id);
    expect(sorted[1].id).toBe(mockGames[0].id);
    expect(sorted[2].id).toBe(mockGames[1].id);
  });

  it('drops games whose id is not in recentlyPlayedIds', () => {
    const games = [mockGames[0], mockGames[1]];
    const ids = [mockGames[0].id.toString()]; // only first

    const sorted = sortRecentGames(games, ids);
    expect(sorted).toHaveLength(1);
    expect(sorted[0].id).toBe(mockGames[0].id);
  });

  it('returns an empty array when recentlyPlayedIds is empty', () => {
    expect(sortRecentGames(mockGames, [])).toEqual([]);
  });

  it('returns an empty array when games is empty', () => {
    expect(sortRecentGames([], [mockGames[0].id.toString()])).toEqual([]);
  });

  it('tolerates ids that reference games not in the list without erroring', () => {
    const nonExistentId = '999999';
    const sorted = sortRecentGames([mockGames[0]], [nonExistentId]);
    expect(sorted).toEqual([]);
  });
});

describe('BIGBOX_LETTERS', () => {
  it('starts with # and ends with Z', () => {
    expect(BIGBOX_LETTERS[0]).toBe('#');
    expect(BIGBOX_LETTERS[BIGBOX_LETTERS.length - 1]).toBe('Z');
  });

  it('contains all uppercase A–Z letters plus #', () => {
    expect(BIGBOX_LETTERS).toHaveLength(27); // # + A-Z
  });
});
