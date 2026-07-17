"use client";

import React, { useRef, useEffect } from 'react';
import { Game } from '../types/game';
import { BigBoxTileMedia } from './BigBoxTileMedia';
import { getPrimaryStudioLabel } from '../lib/game-display';
import { FullscreenLayoutMetrics } from '../hooks/useFullscreenLayoutMetrics';

interface HorizontalRailProps {
  title: string;
  games: Game[];
  onSelectGame: (game: Game) => void;
  focusedIndex: number; // Index within the ORIGINAL games array
  isActive: boolean;    // Whether this rail is currently focused
  onFocusChange: (index: number) => void;
  tileScale?: 'large' | 'normal';
  loop?: boolean;
  isMouseFocusEnabled?: boolean;
  isFavorite?: (gameId: string) => boolean;
  layout?: FullscreenLayoutMetrics;
}

function getTargetVisibleCards(layout: FullscreenLayoutMetrics, isLarge: boolean) {
  const viewportWidth = layout.viewportWidth;

  let visibleCards = isLarge ? 2 : 3;

  if (viewportWidth >= 3300) {
    visibleCards = isLarge ? 7 : 10;
  } else if (viewportWidth >= 2900) {
    visibleCards = isLarge ? 6 : 8;
  } else if (viewportWidth >= 1900) {
    visibleCards = isLarge ? 5 : 7;
  } else if (viewportWidth >= 1500) {
    visibleCards = isLarge ? 4 : 6;
  } else if (viewportWidth >= 1100) {
    visibleCards = isLarge ? 3 : 5;
  }

  if (layout.densityMode === 'compact' && viewportWidth >= 1800) {
    visibleCards += 1;
  }

  return Math.min(visibleCards, isLarge ? 7 : 10);
}

export function HorizontalRail({ 
  title, 
  games, 
  onSelectGame, 
  focusedIndex, 
  isActive, 
  onFocusChange,
  tileScale = 'normal',
  loop = true,
  isMouseFocusEnabled = true,
  isFavorite,
  layout,
}: HorizontalRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasInitializedLoopPositionRef = useRef(false);
  const currentCloneBaseRef = useRef(1);
  const previousFocusedIndexRef = useRef(focusedIndex);
  
  // For infinite looping, we triple the items
  const displayGames = loop ? [...games, ...games, ...games] : games;
  const originalCount = games.length;
  const internalSelectedIndex = loop ? originalCount + focusedIndex : focusedIndex;

  useEffect(() => {
    hasInitializedLoopPositionRef.current = false;
    currentCloneBaseRef.current = 1;
  }, [title, originalCount, loop]);

  // Scroll into view logic
  useEffect(() => {
    if (isActive && scrollRef.current) {
      const parent = scrollRef.current;
      let targetIndex = internalSelectedIndex;
      let shouldAnimate = true;

      if (loop) {
        if (!hasInitializedLoopPositionRef.current) {
          shouldAnimate = false;
          hasInitializedLoopPositionRef.current = true;
          targetIndex = internalSelectedIndex;
        } else {
          const previousFocusedIndex = previousFocusedIndexRef.current;
          const cloneSpan =
            originalCount > 0
              ? ((parent.children[originalCount] as HTMLElement | undefined)?.offsetLeft ?? 0) -
                ((parent.children[0] as HTMLElement | undefined)?.offsetLeft ?? 0)
              : 0;
          const isWrapForward = previousFocusedIndex === originalCount - 1 && focusedIndex === 0;
          const isWrapBackward = previousFocusedIndex === 0 && focusedIndex === originalCount - 1;

          if (cloneSpan > 0 && currentCloneBaseRef.current >= 2 && isWrapForward) {
            parent.scrollLeft -= cloneSpan;
            currentCloneBaseRef.current -= 1;
          } else if (cloneSpan > 0 && currentCloneBaseRef.current <= 0 && isWrapBackward) {
            parent.scrollLeft += cloneSpan;
            currentCloneBaseRef.current += 1;
          }

          if (isWrapForward) {
            currentCloneBaseRef.current += 1;
          } else if (isWrapBackward) {
            currentCloneBaseRef.current -= 1;
          }

          targetIndex = currentCloneBaseRef.current * originalCount + focusedIndex;
        }
      }

      const child = parent.children[targetIndex] as HTMLElement;
      if (child) {
        const parentRect = parent.getBoundingClientRect();
        const childRect = child.getBoundingClientRect();
        
        // Calculate scroll position to center the child
        const scrollLeft = child.offsetLeft - (parentRect.width / 2) + (childRect.width / 2);
        
        parent.scrollTo({
          left: scrollLeft,
          behavior: shouldAnimate ? 'smooth' : 'auto'
        });
      }

      previousFocusedIndexRef.current = focusedIndex;
    }
  }, [focusedIndex, internalSelectedIndex, isActive, loop, originalCount]);

  if (games.length === 0) return null;

  const isLarge = tileScale === 'large';
  const railPaddingX = layout?.horizontalRailPaddingX ?? 64;
  const railGap = layout?.horizontalRailGap ?? 32;
  const availableRailWidth = layout
    ? Math.max(layout.viewportWidth - railPaddingX * 2, 480)
    : null;
  const targetVisibleCards = layout
    ? getTargetVisibleCards(layout, isLarge)
    : null;
  const computedTileWidth = availableRailWidth && targetVisibleCards
    ? Math.floor((availableRailWidth - railGap * Math.max(targetVisibleCards - 1, 0)) / targetVisibleCards)
    : null;
  const arcadeVoidCinematicWidth = layout && isLarge
    ? Math.min(440, Math.max(340, Math.round(layout.viewportWidth * 0.28)))
    : null;
  const tileWidth = arcadeVoidCinematicWidth ?? (computedTileWidth
    ? Math.max(computedTileWidth, isLarge ? 280 : 210)
    : isLarge
      ? (layout?.horizontalLargeTileWidth ?? 560)
      : (layout?.horizontalTileWidth ?? 380));
  const focusScale = layout?.tileFocusScale ?? 1.18;
  const railTitleSize = layout?.railTitleSize ?? 32;
  const metaPadding = layout?.tileMetaPadding ?? 24;

  return (
    <div
      className={`flex flex-col gap-4 transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-45'}`}
      style={{
        gap: `${Math.max((layout?.railSectionGap ?? 18) - 4, 8)}px`,
        paddingTop: `${Math.max((layout?.railSectionGap ?? 18) - 6, 6)}px`,
        paddingBottom: `${Math.max((layout?.railSectionGap ?? 18) - 4, 8)}px`,
      }}
    >
      <div data-rail-anchor className="flex items-center gap-4" style={{ paddingLeft: `${railPaddingX}px`, paddingRight: `${railPaddingX}px` }}>
        <h2
          className={`font-black uppercase tracking-tighter ${isActive ? 'text-[var(--theme-primary)]' : 'text-[var(--theme-text-muted)]'}`}
          style={{ fontSize: `${railTitleSize}px` }}
        >
          {title}
        </h2>
        <div className={`h-px flex-1 ${isActive ? 'bg-[var(--theme-primary)]' : 'bg-[var(--theme-outline-variant)]'} opacity-60`}></div>
      </div>

      <div 
        ref={scrollRef}
        className="no-scrollbar flex overflow-x-auto overflow-y-hidden scroll-smooth"
        style={{
          gap: `${railGap}px`,
          paddingLeft: `${railPaddingX}px`,
          paddingRight: `${railPaddingX}px`,
          paddingTop: `${Math.max((layout?.railSectionGap ?? 18) - 6, 6)}px`,
          paddingBottom: `${Math.max((layout?.railSectionGap ?? 18) - 2, 8)}px`,
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {displayGames.map((game, idx) => {
          const isFocused = isActive && (loop ? idx % originalCount === focusedIndex : idx === focusedIndex);
          const hasArtwork = Boolean(game.coverPath || game.screenshotFilename);
          const favorited = isFavorite?.(game.id.toString()) ?? false;
          
          return (
            <div
              key={`${game.id}-${idx}`}
              onClick={() => onSelectGame(game)}
              onMouseEnter={() => {
                if (isMouseFocusEnabled) {
                  if (loop) {
                    // Normalize back to original index
                    onFocusChange(idx % originalCount);
                  } else {
                    onFocusChange(idx);
                  }
                }
              }}
              className={`group relative shrink-0 cursor-pointer overflow-hidden rounded-[var(--theme-radius-xl)] border border-[var(--theme-outline-variant)] bg-[var(--theme-surface)] shadow-lg transition-all duration-500 ${
                isFocused 
                  ? `z-10 border-[var(--theme-primary)] shadow-[0_0_32px_var(--theme-primary)]`
                  : 'hover:-translate-y-1 hover:border-[var(--theme-outline)]'
              }`}
              style={{
                aspectRatio: isLarge ? '16 / 9' : '1.78',
                transform: isFocused ? `scale(${hasArtwork ? focusScale : 1.08})` : undefined,
                width: `${tileWidth}px`,
              }}
            >
              <BigBoxTileMedia game={game} className="absolute inset-0" />

              {favorited && (
                <div className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--theme-tertiary)] bg-[var(--theme-background)] text-lg text-[var(--theme-tertiary)] shadow-lg backdrop-blur-md">
                  ♥
                </div>
              )}
              
              <div
                className="absolute inset-x-0 bottom-0 flex flex-col gap-1 border-t border-[var(--theme-outline-variant)] bg-[var(--theme-surface)]/95"
                style={{ padding: `${metaPadding}px` }}
              >
                <div className="font-black uppercase tracking-[0.24em] text-[var(--theme-primary)]" style={{ fontSize: `${Math.max((layout?.chipFontSize ?? 11) - 0.5, 10)}px` }}>
                  {game.year || 'Classic'} {game.parentGenre ? `• ${game.parentGenre}` : ''}
                </div>
                <div
                  className="font-black leading-tight text-[var(--theme-text)] line-clamp-2"
                  style={{ fontSize: `${isLarge ? tileWidth / 17.5 : tileWidth / 18.2}px` }}
                >
                  {game.name}
                </div>
                <div className="mt-1 truncate font-medium text-[var(--theme-text-muted)]" style={{ fontSize: `${Math.max((layout?.chipFontSize ?? 11) - 0.5, 10)}px` }}>
                  {getPrimaryStudioLabel(game)}
                </div>
              </div>

              {/* Focus Glow Overlay */}
              {isFocused && (
                <div className="pointer-events-none absolute inset-0 ring-4 ring-[var(--theme-primary)] ring-inset animate-pulse"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
