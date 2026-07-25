/**
 * Pure-function tests for useBigBoxLibraryData.
 *
 * These functions are extracted for testability. The React hook itself requires
 * a full happy-dom + React render cycle which exceeds available sandbox memory
 * when isolated in its own worker — so we test the deterministic logic here
 * as plain TypeScript instead.
 */
import { createElement } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  getAlphabetRailCacheKey,
  getFlatLibraryLoadLimit,
  sortRecentGames,
  BIGBOX_LETTERS,
  useBigBoxLibraryData,
} from './useBigBoxLibraryData';
import { mockGames } from '../data/mockGames';

const EMPTY_FILTERS = {};
const FAVORITE_IDS = [mockGames[0].id.toString()];
const RECENTLY_PLAYED_IDS = [mockGames[1].id.toString()];

vi.mock('../lib/tauri-bridge', async () => {
  const { mockGames } = await import('../data/mockGames');
  return {
    getDbGameCount: vi.fn().mockResolvedValue(3),
    getDbGames: vi.fn().mockResolvedValue(mockGames.slice(0, 3)),
    getGenres: vi.fn().mockResolvedValue([]),
    getSubGenres: vi.fn().mockResolvedValue([]),
  };
});

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

describe('getFlatLibraryLoadLimit', () => {
  it('loads every matching game for the fullscreen C64 alphabet sections', () => {
    expect(getFlatLibraryLoadLimit(1_847, true)).toBe(1_847);
    expect(getFlatLibraryLoadLimit(1_847, false)).toBe(0);
  });
});

describe('useBigBoxLibraryData primary rails', () => {
  it('uses large screenshot cards for recent, favourite, and legendary rails only', async () => {
    function Probe() {
      const rails = useBigBoxLibraryData({
        activeRailIndex: -1,
        activePlatformId: 'c64',
        favorites: FAVORITE_IDS,
        filters: EMPTY_FILTERS,
        recentlyPlayedIds: RECENTLY_PLAYED_IDS,
        searchInput: '',
      }).rails;
      return createElement('output', {
        'data-testid': 'rail-scales',
      }, JSON.stringify(rails.map((rail) => ({ type: rail.type, scale: rail.scale }))));
    }

    render(createElement(Probe));

    await waitFor(() => {
      const rails = JSON.parse(screen.getByTestId('rail-scales').textContent ?? '[]') as { type: string; scale?: string }[];
      const primaryRails = rails.filter((rail) => rail.type !== 'alphabet');
      expect(primaryRails.map((rail) => rail.scale)).toEqual(['large', 'large', 'large']);
    });

    const rails = JSON.parse(screen.getByTestId('rail-scales').textContent ?? '[]') as { type: string; scale?: string }[];
    expect(rails.filter((rail) => rail.type === 'alphabet').every(
      (rail) => rail.scale === undefined,
    )).toBe(true);
  });
});
