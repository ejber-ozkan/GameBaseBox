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
          className={`font-black uppercase tracking-tighter ${isActive ? 'text-[var(--theme-primary)]' : 'text-[var(--theme-text-muted)]'}`}
          style={{ fontSize: `${layout.railTitleSize}px` }}
        >
          {rail.title}
        </h2>
        <div className={`h-px flex-1 ${isActive ? 'bg-[var(--theme-primary)]' : 'bg-[var(--theme-outline-variant)]'} opacity-60`}></div>
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
              className={`group relative aspect-[1.75] cursor-pointer overflow-hidden rounded-[var(--theme-radius-xl)] border border-[var(--theme-outline-variant)] bg-[var(--theme-surface)] shadow-lg transition-all duration-500 ${
                isFocused
                  ? `z-10 border-[var(--theme-primary)] shadow-[0_0_32px_var(--theme-primary)]`
                  : 'hover:-translate-y-1 hover:border-[var(--theme-outline)]'
              }`}
              style={{
                transform: isFocused ? `scale(${hasArtwork ? layout.tileFocusScale : 1.08})` : undefined,
              }}
            >
              {isFavorite(game.id.toString()) && (
                <div className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--theme-tertiary)] bg-[var(--theme-background)] text-lg text-[var(--theme-tertiary)] shadow-lg backdrop-blur-md">
                  ♥
                </div>
              )}
              <BigBoxTileMedia enabled={shouldRenderMedia} game={game} className="absolute inset-0" />
              <div
                className="absolute inset-x-0 bottom-0 flex flex-col gap-1 border-t border-[var(--theme-outline-variant)] bg-[var(--theme-surface)] transition-all duration-500"
                style={{ padding: `${layout.tileMetaPadding}px` }}
              >
                <div className="font-black uppercase tracking-[0.24em] text-[var(--theme-primary)]" style={{ fontSize: `${Math.max(layout.chipFontSize - 1, 10)}px` }}>
                  {game.year || 'Classic'} {game.parentGenre ? `• ${game.parentGenre}` : ''}
                </div>
                <div className="min-w-0 font-black leading-tight text-[var(--theme-text)] line-clamp-2" style={{ fontSize: `${Math.max(layout.headerTitleSize * 0.38, 16)}px` }}>
                  {game.name}
                </div>
                <div className="min-w-0 truncate font-medium text-[var(--theme-text-muted)]" style={{ fontSize: `${Math.max(layout.chipFontSize, 11)}px` }}>
                  {getPrimaryStudioLabel(game)}
                </div>
              </div>
              {isFocused && (
                <div className="pointer-events-none absolute inset-0 ring-2 ring-[var(--theme-primary)] ring-inset"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
