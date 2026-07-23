import { describe, expect, it } from 'vitest';
import { getC64ViewingPath, getCyberpunkViewingPath } from './c64-viewing-path';

describe('getC64ViewingPath', () => {
  it('returns LIST INDEX_ALL when no letter or search query is provided', () => {
    expect(getC64ViewingPath()).toBe('LIST INDEX_ALL');
    expect(getC64ViewingPath('', '')).toBe('LIST INDEX_ALL');
  });

  it('formats selected letter correctly', () => {
    expect(getC64ViewingPath('A')).toBe('LIST INDEX_A');
    expect(getC64ViewingPath('#')).toBe('LIST INDEX_#');
    expect(getC64ViewingPath('z')).toBe('LIST INDEX_Z');
  });

  it('formats search input correctly', () => {
    expect(getC64ViewingPath(undefined, 'mario')).toBe('LIST SEARCH: MARIO');
    expect(getC64ViewingPath('', 'Zelda')).toBe('LIST SEARCH: ZELDA');
  });

  it('combines letter and search input correctly', () => {
    expect(getC64ViewingPath('M', 'mario')).toBe('LIST INDEX_M SEARCH: MARIO');
    expect(getC64ViewingPath('a', 'attack')).toBe('LIST INDEX_A SEARCH: ATTACK');
  });
});

describe('getCyberpunkViewingPath', () => {
  it('returns LIST_ INDEX_ALL when no letter or search query is provided', () => {
    expect(getCyberpunkViewingPath()).toBe('LIST_ INDEX_ALL');
    expect(getCyberpunkViewingPath('', '')).toBe('LIST_ INDEX_ALL');
  });

  it('formats selected letter and search query with LIST_ prefix', () => {
    expect(getCyberpunkViewingPath('A')).toBe('LIST_ INDEX_A');
    expect(getCyberpunkViewingPath(undefined, 'mario')).toBe('LIST_ SEARCH: MARIO');
    expect(getCyberpunkViewingPath('M', 'mario')).toBe('LIST_ INDEX_M SEARCH: MARIO');
  });
});

