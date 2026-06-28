import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFavorites } from './useFavorites';

let mockActivePlatformId = 'c64';

vi.mock('../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      activePlatformId: mockActivePlatformId,
    },
  }),
}));

describe('useFavorites hook', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockActivePlatformId = 'c64';
  });

  it('loads empty favorites list by default', () => {
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toEqual([]);
  });

  it('saves favorites scoped to active platform c64', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.toggleFavorite('1');
    });

    expect(result.current.favorites).toEqual(['1']);
    expect(result.current.isFavorite('1')).toBe(true);

    const savedC64 = window.localStorage.getItem('gb64_favorites_c64');
    expect(savedC64).toBe(JSON.stringify(['1']));
    
    const savedAtari = window.localStorage.getItem('gb64_favorites_atari800');
    expect(savedAtari).toBeNull();
  });

  it('saves favorites scoped to active platform atari800', () => {
    mockActivePlatformId = 'atari800';
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.toggleFavorite('5');
    });

    expect(result.current.favorites).toEqual(['5']);
    const savedAtari = window.localStorage.getItem('gb64_favorites_atari800');
    expect(savedAtari).toBe(JSON.stringify(['5']));

    const savedC64 = window.localStorage.getItem('gb64_favorites_c64');
    expect(savedC64).toBeNull();
  });

  it('migrates legacy flat favorites to c64 platform key', () => {
    window.localStorage.setItem('gb64_favorites', JSON.stringify(['2', '3']));
    
    const { result } = renderHook(() => useFavorites());

    expect(result.current.favorites).toEqual(['2', '3']);
    
    // Confirms it wrote back to c64-specific key
    const savedC64 = window.localStorage.getItem('gb64_favorites_c64');
    expect(savedC64).toBe(JSON.stringify(['2', '3']));
  });

  it('does not migrate legacy flat favorites to atari800 platform key', () => {
    window.localStorage.setItem('gb64_favorites', JSON.stringify(['2', '3']));
    mockActivePlatformId = 'atari800';
    
    const { result } = renderHook(() => useFavorites());

    expect(result.current.favorites).toEqual([]);
    
    const savedAtari = window.localStorage.getItem('gb64_favorites_atari800');
    expect(savedAtari).toBeNull();
  });
});
