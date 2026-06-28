"use client";

import { useEffect, useMemo, useState } from 'react';
import { BigBoxTileMedia } from '../BigBoxTileMedia';
import { getPrimaryStudioLabel } from '../../lib/game-display';
import { BigBoxRailCategory } from '../../hooks/useBigBoxLibraryData';
import { FullscreenLayoutMetrics } from '../../hooks/useFullscreenLayoutMetrics';

interface BigBoxAlphabetRailProps {
  focusedIdx: number;
  isActive: boolean;
  isFavorite: (gameId: string) => boolean;
  isMouseMode: boolean;
  layout: FullscreenLayoutMetrics;
  onFocus: (index: number) => void;
  onSelectGame: (gameId: number) => void;
  rail: BigBoxRailCategory;
}

export function BigBoxAlphabetRail({
  focusedIdx,
  isActive,
  isFavorite,
  isMouseMode,
  layout,
  onFocus,
  onSelectGame,
  rail,
}: BigBoxAlphabetRailProps) {
  const [settledRailId, setSettledRailId] = useState<string | null>(null);

  const mediaWindow = useMemo(() => {
    const mediaEnabled = isActive && rail.games.length > 0 && settledRailId === rail.id;
    if (!isActive || !mediaEnabled) {
      return { start: -1, end: -1 };
    }

    const padding = layout.gridColumns * 2;
    return {
      start: Math.max(0, focusedIdx - padding),
      end: focusedIdx + padding,
    };
  }, [focusedIdx, isActive, layout.gridColumns, rail.games.length, rail.id, settledRailId]);

  useEffect(() => {
    if (!isActive || rail.games.length === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSettledRailId(rail.id);
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [isActive, rail.games.length, rail.id]);

  return (
    <div
      className={`flex flex-col transition-all duration-700 scroll-mt-[340px] ${isActive ? 'opacity-100' : 'opacity-25 translate-y-4'}`}
      style={{ gap: `${layout.railSectionGap}px`, paddingTop: `${layout.railSectionGap + 10}px`, paddingBottom: `${layout.railSectionGap + 10}px` }}
    >
      <div data-rail-anchor className="flex items-center gap-4" style={{ paddingLeft: `${layout.railPaddingX}px`, paddingRight: `${layout.railPaddingX}px` }}>
        <h2
          className={`font-black uppercase tracking-tighter ${isActive ? 'text-blue-300' : 'text-gray-600'}`}
          style={{ fontSize: `${layout.railTitleSize}px` }}
        >
          {rail.title}
        </h2>
        <div className={`h-px flex-1 bg-gradient-to-r ${isActive ? 'from-sky-400/70 via-cyan-300/40 to-transparent' : 'from-gray-800 to-transparent'}`}></div>
      </div>

      <div
        className="grid"
        style={{
          gap: `${layout.gridGap}px`,
          gridTemplateColumns: `repeat(${layout.gridColumns}, minmax(0, 1fr))`,
          paddingLeft: `${layout.railPaddingX}px`,
          paddingRight: `${layout.railPaddingX}px`,
        }}
      >
        {rail.games.map((game, gameIndex) => {
          const isFocused = isActive && gameIndex === focusedIdx;
          const hasArtwork = Boolean(game.coverPath || game.screenshotFilename);
          const shouldRenderMedia = gameIndex >= mediaWindow.start && gameIndex <= mediaWindow.end;
          return (
            <div
              key={`${rail.id}-${game.id}-${gameIndex}`}
              onClick={() => onSelectGame(game.id)}
              onMouseEnter={() => {
                if (isMouseMode) {
                  onFocus(gameIndex);
                }
              }}
              className={`group relative aspect-[1.75] cursor-pointer overflow-hidden border border-white/10 bg-[#09111b] shadow-[0_18px_60px_rgba(2,6,23,0.45)] transition-all duration-500 ${
                isFocused
                  ? `z-10 border-cyan-300/80 shadow-[0_28px_80px_rgba(56,189,248,0.35)]`
                  : 'hover:-translate-y-1 hover:border-white/20'
              }`}
              style={{
                borderRadius: `${layout.tileBorderRadius}px`,
                transform: isFocused ? `scale(${hasArtwork ? layout.tileFocusScale : 1.08})` : undefined,
              }}
            >
              {isFavorite(game.id.toString()) && (
                <div className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-pink-300/60 bg-black/55 text-lg text-pink-300 shadow-[0_12px_30px_rgba(15,23,42,0.45)] backdrop-blur-md">
                  ♥
                </div>
              )}
              <BigBoxTileMedia enabled={shouldRenderMedia} game={game} className="absolute inset-0" />
              <div
                className="absolute inset-x-0 bottom-0 flex flex-col gap-1 border-t border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.08),rgba(2,6,23,0.92))] transition-all duration-500"
                style={{ padding: `${layout.tileMetaPadding}px` }}
              >
                <div className="font-black uppercase tracking-[0.24em] text-cyan-200/80" style={{ fontSize: `${Math.max(layout.chipFontSize - 1, 10)}px` }}>
                  {game.year || 'Classic'} {game.parentGenre ? `• ${game.parentGenre}` : ''}
                </div>
                <div className="min-w-0 font-black leading-tight text-white line-clamp-2" style={{ fontSize: `${Math.max(layout.headerTitleSize * 0.38, 16)}px` }}>
                  {game.name}
                </div>
                <div className="min-w-0 font-medium text-white/60 truncate" style={{ fontSize: `${Math.max(layout.chipFontSize, 11)}px` }}>
                  {getPrimaryStudioLabel(game)}
                </div>
              </div>
              {isFocused && (
                <div className="pointer-events-none absolute inset-0 ring-2 ring-cyan-300/70 ring-inset"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
