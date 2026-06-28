"use client";

import { useEffect, useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { getMediaUrl, resolveMediaPath as resolveNativeMediaPath } from '../lib/tauri-bridge';
import { Game } from '../types/game';

interface BigBoxTileMediaProps {
  enabled?: boolean;
  game: Game;
  className?: string;
}

const SCREENSHOT_CACHE = new Map<string, Promise<string[]>>();
const COVER_CACHE = new Map<string, Promise<string | null>>();

function normalizePath(path: string) {
  return path.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\/+/, '');
}

function getScreenshotUrls(
  screenshotsPath: string,
  filename: string,
  findAllVariants: (type: 'screenshot' | 'sound' | 'musician' | 'extras', filename: string) => Promise<string[]>
) {
  const key = `${screenshotsPath}|${filename}`;
  const cached = SCREENSHOT_CACHE.get(key);
  if (cached) return cached;

  const promise = findAllVariants('screenshot', filename).catch(() => []);
  SCREENSHOT_CACHE.set(key, promise);
  return promise;
}

function getCoverUrl(extrasPath: string, coverPath: string) {
  const key = `${extrasPath}|${coverPath}`;
  const cached = COVER_CACHE.get(key);
  if (cached) return cached;

  const promise = (async () => {
    const cleanExtrasPath = extrasPath.replace(/\\/g, '/').replace(/\/+$/, '');
    const cleanCoverPath = normalizePath(coverPath);

    try {
      const resolved = await resolveNativeMediaPath(cleanExtrasPath, cleanCoverPath);
      if (!resolved.exists) return null;
      return await getMediaUrl(resolved.absolute_path);
    } catch {
      return `${cleanExtrasPath}/${cleanCoverPath}`;
    }
  })();

  COVER_CACHE.set(key, promise);
  return promise;
}

export function BigBoxTileMedia({ enabled = true, game, className = '' }: BigBoxTileMediaProps) {
  const { settings, findAllVariants } = useSettings();
  const [slides, setSlides] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    async function loadMedia() {
      setIsLoading(true);

      const [coverUrl, screenshotUrls] = await Promise.all([
        settings.extrasPath.trim() && game.coverPath
          ? getCoverUrl(settings.extrasPath, game.coverPath)
          : Promise.resolve<string | null>(null),
        game.screenshotFilename
          ? getScreenshotUrls(settings.screenshotsPath, game.screenshotFilename, findAllVariants)
          : Promise.resolve<string[]>([]),
      ]);

      if (cancelled) return;

      const merged = coverUrl
        ? [coverUrl, ...screenshotUrls.filter((url) => url !== coverUrl)]
        : screenshotUrls;

      setSlides(merged);
      setCurrentIndex(0);
      setIsLoading(false);
    }

    loadMedia();
    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    findAllVariants,
    game.coverPath,
    game.screenshotFilename,
    settings.extrasPath,
    settings.screenshotsPath,
  ]);

  useEffect(() => {
    if (!enabled) return;
    if (slides.length <= 1) return;

    const timer = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [enabled, slides]);

  const activeSlide = enabled ? (slides[currentIndex] ?? null) : null;
  const showLoading = enabled && isLoading;

  return (
    <div className={`relative h-full w-full overflow-hidden bg-[#0f141d] ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.22),transparent_55%),linear-gradient(180deg,rgba(15,23,42,0.35),rgba(2,6,23,0.88))]" />

      {activeSlide ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={activeSlide}
          src={activeSlide}
          alt={game.name}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 opacity-100"
          loading="lazy"
        />
      ) : null}

      {enabled && slides.length === 0 && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(145deg,rgba(30,41,59,0.95),rgba(15,23,42,0.98))]">
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.3em] text-white/40">
            No Artwork
          </div>
        </div>
      )}

      {showLoading && (
        <div className="absolute inset-0 animate-pulse bg-[linear-gradient(110deg,rgba(255,255,255,0.03),rgba(96,165,250,0.14),rgba(255,255,255,0.03))]" />
      )}
    </div>
  );
}
