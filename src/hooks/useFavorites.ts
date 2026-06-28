"use client";

import { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';

function loadFavorites(platformId: string): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const key = `gb64_favorites_${platformId}`;
  try {
    let saved = localStorage.getItem(key);
    if (!saved && platformId === 'c64') {
      // Migration path from legacy flat favorites to scoped C64 favorites
      const legacy = localStorage.getItem('gb64_favorites');
      if (legacy) {
        localStorage.setItem(key, legacy);
        saved = legacy;
      }
    }

    if (saved) {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
    }
    return [];
  } catch (e) {
    console.error('Failed to load favorites', e);
    return [];
  }
}

export function useFavorites() {
  const { settings } = useSettings();
  const platformId = settings?.activePlatformId || 'c64';

  const [prevPlatformId, setPrevPlatformId] = useState(platformId);
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites(platformId));

  if (platformId !== prevPlatformId) {
    setPrevPlatformId(platformId);
    setFavorites(loadFavorites(platformId));
  }

  const toggleFavorite = (gameId: string) => {
    setFavorites(prev => {
      const key = `gb64_favorites_${platformId}`;
      const isFav = prev.includes(gameId);
      const next = isFav ? prev.filter(id => id !== gameId) : [...prev, gameId];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch (e) {
          console.error('Failed to save favorites to localStorage', e);
        }
      }
      return next;
    });
  };

  const isFavorite = (gameId: string) => favorites.includes(gameId);

  return { favorites, toggleFavorite, isFavorite };
}
