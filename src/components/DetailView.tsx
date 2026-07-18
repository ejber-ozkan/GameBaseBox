"use client";

import { useEffect, useState, useMemo } from 'react';
import { Game, GameDetail } from '../types/game';
import { getDbGameDetail } from '../lib/tauri-bridge';
import { UnifiedDetailLayout } from './detail/UnifiedDetailLayout';
import { PLATFORM_PROFILES } from '../lib/platform-capabilities';
import { ImageSlider } from './ImageSlider';
import { ImageWithFallback } from './ImageWithFallback';
import { useDetailNavigation, DetailNavigationHook, NavigationConfig } from '../hooks/useDetailNavigation';
import { useInputMode } from '../hooks/useInputMode';
import { useGamepad } from '../hooks/useGamepad';
import { useFavorites } from '../hooks/useFavorites';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme } from '../contexts/ThemeContext';
import { usePopupOpenSound } from '../hooks/usePopupOpenSound';
import { supportsEmbeddedEmulation } from '../lib/platform-capabilities';
import { FullscreenLayoutMetrics, useFullscreenLayoutMetrics } from '../hooks/useFullscreenLayoutMetrics';

interface DetailViewProps {
  game: Game;
  onBack: () => void;
}

export interface DetailLayoutProps {
  game: Game;
  onBack: () => void;
  nav: DetailNavigationHook;
  onFullscreen: (media: DetailFullscreenRequest) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  fullscreenLayout?: FullscreenLayoutMetrics;
}

export type DetailFullscreenMedia =
  | { kind: 'screenshot'; filename: string }
  | { kind: 'image-url'; url: string; alt?: string };

export type DetailFullscreenRequest = string | DetailFullscreenMedia | null;

const DETAIL_CONFIG: NavigationConfig = {
  'favorite':          { down: 'play' },
  'play':              { up: 'favorite', right: 'media-boxfront', down: 'play-web' },
  'play-web':          { up: 'play', left: 'media-boxfront', down: 'versions' },
  'media-gameplay':    { up: 'favorite', right: 'media-boxfront', down: 'versions' },
  'media-titlescreen': { up: 'favorite', right: 'media-boxfront', down: 'versions' },
  'media-videosna':    { up: 'favorite', right: 'media-boxfront', down: 'versions' },
  'media-boxfront':    { up: 'favorite', left: 'media-gameplay', right: 'versions', down: 'versions' },
  'media-extras':      { up: 'media-boxfront', left: 'play-web', right: 'sid' },
  'versions':          { up: 'play-web', left: 'media-boxfront', down: 'sid' },
  'sid':               { up: 'versions', left: 'media-boxfront' },
  'screenshot':        { left: 'media-boxfront', down: 'sid' },
};

const detailCache = new Map<string, Promise<GameDetail | null>>();

export function clearDetailCache() {
  detailCache.clear();
}

function getCachedGameDetail(gameId: string, platformId: string) {
  const cacheKey = `${platformId}:${gameId}`;
  const cached = detailCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const request = getDbGameDetail(gameId, platformId).catch((error) => {
    detailCache.delete(cacheKey);
    throw error;
  });
  detailCache.set(cacheKey, request);
  return request;
}

export function DetailView({ game, onBack }: DetailViewProps) {
  const { settings } = useSettings();
  const { theme } = useTheme();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [fullscreenMedia, setFullscreenMedia] = useState<DetailFullscreenMedia | null>(null);
  const [detailedGame, setDetailedGame] = useState<GameDetail | null>(null);
  const { showMouse } = useInputMode();
  const favorited = isFavorite(game.id.toString());
  usePopupOpenSound(Boolean(fullscreenMedia), 'detail-fullscreen-image');

  const fullscreenLayout = useFullscreenLayoutMetrics();
  const showSoundtrack = PLATFORM_PROFILES[settings.activePlatformId]?.mediaCapabilities.music !== 'none';

  const detailConfig = useMemo(() => {
    const isArcade = theme.id === 'arcade-void';
    const canPlayEmbedded = supportsEmbeddedEmulation(settings.activePlatformId);
    
    const config = {
      'favorite':          { down: 'play' },
      'play':              { up: 'favorite', right: 'media-boxfront', down: canPlayEmbedded ? 'play-web' : (isArcade ? (showSoundtrack ? 'sid' : 'sidebar-tabs') : 'versions') },
      'play-web':          { up: 'play', left: 'media-boxfront', down: isArcade ? (showSoundtrack ? 'sid' : 'sidebar-tabs') : 'versions' },
      'media-gameplay':    { up: 'favorite', right: 'media-boxfront', down: 'media-extras' },
      'media-titlescreen': { up: 'favorite', right: 'media-boxfront', down: 'media-extras' },
      'media-videosna':    { up: 'favorite', right: 'media-boxfront', down: 'media-extras' },
      'media-boxfront':    { up: 'favorite', left: 'media-gameplay', right: isArcade ? (showSoundtrack ? 'sid' : 'sidebar-tabs') : 'versions', down: 'media-extras' },
      
      'media-extras':      { up: 'media-gameplay', left: canPlayEmbedded ? 'play-web' : 'play', right: isArcade ? (showSoundtrack ? 'sid' : 'sidebar-tabs') : 'versions', down: 'extras-docs' },
      'extras-docs':       { up: 'media-extras', left: canPlayEmbedded ? 'play-web' : 'play', right: isArcade ? (showSoundtrack ? 'sid' : 'sidebar-tabs') : 'versions', down: 'extras-media' },
      'extras-media':      { up: 'extras-docs', left: canPlayEmbedded ? 'play-web' : 'play', right: isArcade ? (showSoundtrack ? 'sid' : 'sidebar-tabs') : 'versions' },
      
      'screenshot':        { left: 'media-gameplay', down: showSoundtrack ? 'sid' : undefined },
    } as NavigationConfig;

    if (isArcade) {
      if (showSoundtrack) {
        config['sid'] = { up: canPlayEmbedded ? 'play-web' : 'play', left: 'media-gameplay', down: 'sidebar-tabs' };
      }
      config['sidebar-tabs'] = { up: showSoundtrack ? 'sid' : (canPlayEmbedded ? 'play-web' : 'play'), left: 'media-gameplay', down: 'sidebar-content' };
      config['sidebar-content'] = { up: 'sidebar-tabs', left: 'media-gameplay' };
    } else {
      config['versions'] = { up: canPlayEmbedded ? 'play-web' : 'play', left: 'media-boxfront', down: showSoundtrack ? 'sid' : undefined };
      if (showSoundtrack) {
        config['sid'] = { up: 'versions', left: 'media-boxfront' };
      }
    }

    return config;
  }, [showSoundtrack, theme.id, settings.activePlatformId]);

  const nav = useDetailNavigation({ onBack, config: detailConfig as NavigationConfig, enabled: !fullscreenMedia });
  const hasBlockingModal = () => typeof document !== 'undefined' && Boolean(document.querySelector('[data-detail-modal="open"]'));

  const handleFullscreen = (media: DetailFullscreenRequest) => {
    if (!media) {
      setFullscreenMedia(null);
      return;
    }

    if (typeof media === 'string') {
      setFullscreenMedia({ kind: 'screenshot', filename: media });
      return;
    }

    setFullscreenMedia(media);
  };

  useEffect(() => {
    let cancelled = false;
    getCachedGameDetail(game.id.toString(), settings.activePlatformId).then(detail => {
      if (!cancelled && detail) setDetailedGame(detail);
    });
    return () => { cancelled = true; };
  }, [game.id, settings.activePlatformId]);

  useGamepad({
    onButtonDown: (button) => {
      if (fullscreenMedia && button === 'B') {
        setFullscreenMedia(null);
      }
      if (!fullscreenMedia && !hasBlockingModal() && button === 'Y') {
        toggleFavorite(game.id.toString());
      }
    },
  });

  useEffect(() => {
    if (!fullscreenMedia) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Backspace') {
        event.preventDefault();
        setFullscreenMedia(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenMedia]);

  useEffect(() => {
    nav.registerAction('favorite', () => toggleFavorite(game.id.toString()));
  }, [game.id, nav, toggleFavorite]);

  useEffect(() => {
    if (fullscreenMedia) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      if (hasBlockingModal()) return;

      if (event.key === 'f' || event.key === 'F') {
        event.preventDefault();
        toggleFavorite(game.id.toString());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenMedia, game.id, toggleFavorite]);

  const renderTheme = () => {
    const mergedGame = detailedGame ? { ...game, ...detailedGame } : game;
    return (
      <UnifiedDetailLayout
        key={game.id}
        game={mergedGame}
        onBack={onBack}
        nav={nav}
        onFullscreen={handleFullscreen}
        isFavorite={favorited}
        onToggleFavorite={() => toggleFavorite(game.id.toString())}
        fullscreenLayout={fullscreenLayout}
      />
    );
  };

  return (
    <div className="relative h-full w-full" data-testid="detail-view">
      {renderTheme()}
      
      {fullscreenMedia && (
        <div 
          data-detail-modal="open"
          className={`fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-8 backdrop-blur-md animate-in fade-in zoom-in duration-300 transition-all ${
             showMouse ? 'cursor-pointer' : 'cursor-none'
          }`}
          onClick={() => setFullscreenMedia(null)}
        >
          <div
            className="relative h-[min(92vh,1400px)] w-[min(96vw,2200px)] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {fullscreenMedia.kind === 'screenshot' ? (
              <ImageSlider
                type="screenshot"
                filename={fullscreenMedia.filename}
                alt="Fullscreen View"
                className="h-full w-full object-contain shadow-2xl rounded-lg border border-white/10"
              />
            ) : (
              <ImageWithFallback
                src={fullscreenMedia.url}
                alt={fullscreenMedia.alt ?? 'Fullscreen View'}
                fit="contain"
                className="h-full w-full shadow-2xl rounded-lg border border-white/10"
              />
            )}
            {showMouse && (
              <>
                <button
                  className="absolute top-0 right-0 p-4 text-white text-4xl font-light hover:text-yellow-400 transition-colors"
                  onClick={() => setFullscreenMedia(null)}
                >
                  ×
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 rounded-full text-xs text-white/70 border border-white/10 backdrop-blur-sm">
                    Click anywhere to close
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
