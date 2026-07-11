"use client";

import { useEffect, useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { getAssetUrl, isTauri, resolveMediaPath as resolveNativeMediaPath } from '../lib/tauri-bridge';
import type { Game } from '../types/game';

const COVER_ART_URL_CACHE = new Map<string, Promise<string | null>>();

function normalizePath(path: string) {
  return path.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\/+/, '');
}

function getResolvedCoverArtUrl(basePath: string, relativePath: string) {
  const cacheKey = `${basePath}|${relativePath}`;
  const cached = COVER_ART_URL_CACHE.get(cacheKey);
  if (cached) {
    return cached;
  }

  const promise = (async () => {
    if (!isTauri()) {
      // In browser dev mode, return the path directly without checking disk existence
      return `${basePath}/${normalizePath(relativePath)}`;
    }

    const resolved = await resolveNativeMediaPath(basePath, normalizePath(relativePath));
    if (!resolved.exists) {
      return null;
    }

    return getAssetUrl(resolved.absolute_path);
  })().catch(() => null);

  COVER_ART_URL_CACHE.set(cacheKey, promise);
  return promise;
}

type ResolvedBoxArtGame = Pick<Game, 'boxFrontFilename' | 'coverPath'>;

export function useResolvedBoxArtUrl(game: ResolvedBoxArtGame, fallbackUrl = '') {
  const { settings } = useSettings();
  const activePlatformFolders = settings.platformSettings[settings.activePlatformId]?.folders;
  const activePlatformExtrasPath = activePlatformFolders?.extrasPath ?? '';
  const activePlatformScreenshotsPath = activePlatformFolders?.screenshotsPath ?? '';

  const [artUrl, setArtUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadArt() {
      // 1. Try to load cover path (Atari-style) if available
      if (game.coverPath && activePlatformExtrasPath.trim()) {
        const resolvedCoverUrl = await getResolvedCoverArtUrl(activePlatformExtrasPath.trim(), game.coverPath);
        if (!cancelled && resolvedCoverUrl) {
          setArtUrl(resolvedCoverUrl);
          return;
        }
      }

      // 2. Try to load boxFrontFilename (C64-style) if available
      if (game.boxFrontFilename && activePlatformScreenshotsPath.trim()) {
        const resolvedBoxUrl = await getResolvedCoverArtUrl(activePlatformScreenshotsPath.trim(), game.boxFrontFilename);
        if (!cancelled && resolvedBoxUrl) {
          setArtUrl(resolvedBoxUrl);
          return;
        }
      }

      if (!cancelled) {
        setArtUrl(fallbackUrl || null);
      }
    }

    void loadArt();

    return () => {
      cancelled = true;
    };
  }, [activePlatformExtrasPath, activePlatformScreenshotsPath, fallbackUrl, game.boxFrontFilename, game.coverPath]);

  return artUrl;
}
