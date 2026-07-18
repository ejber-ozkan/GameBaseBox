"use client";

import { useEffect, useRef, useState } from 'react';
import { ImageSlider } from '../ImageSlider';
import type { Game } from '../../types/game';

interface CyberpunkCrtGridProps {
  activeAlphabetRailId?: string | null;
  alphabetSections?: Array<{ id: string; label: string; games: Game[] }>;
  games: Game[];
  recentGames: Game[];
  favoriteGames: Game[];
  classicGames: Game[];
  onSelectGame: (game: Game) => void;
  isFavorite: (gameId: string) => boolean;
  toggleFavorite: (gameId: string) => void;
  alphabetLabel?: string;
  focusedGameId?: string | null;
  focusedRailId?: string | null;
  focusedIndex?: number;
  gridColumns?: number;
  onFocusChange?: (index: number) => void;
  onFocusSectionItem?: (railId: string, index: number) => void;
  onEndReached?: () => void | Promise<void>;
  onFocusRailItem?: (railId: string, gameIndex: number) => void;
}

function getMetadata(game: Game) {
  return game.publisher?.name && game.publisher.name !== '(Not Published)'
    ? game.publisher.name
    : game.year?.toString() || 'GBBOX://READY';
}

function CtrFocusedTitle({ game }: { game: Game }) {
  return (
    <div className="mt-1 flex min-h-12 items-center gap-3 border-t border-[var(--theme-primary)] bg-[var(--theme-primary)] px-3 py-2 text-black" data-testid="cyberpunk-focused-title-strip">
      <span className="font-mono text-[10px] font-black uppercase tracking-[0.12em]">CURRENTLY_FOCUSED</span>
      <span className="min-w-0 truncate font-mono text-sm font-black uppercase tracking-wide">{game.name}</span>
      <span aria-hidden="true" className="ml-auto h-5 w-2 shrink-0 bg-black animate-[cursor-blink_1s_steps(1,end)_infinite]" />
    </div>
  );
}

function CyberpunkRail({ games, focusedGameId, onFocusGame, onSelectGame, railId, title }: Pick<CyberpunkCrtGridProps, 'onSelectGame'> & { focusedGameId?: string | null; games: Game[]; onFocusGame: (gameId: string | null, gameIndex?: number) => void; railId: string; title: string }) {
  const railScrollRef = useRef<HTMLDivElement>(null);

  const scrollRail = (direction: 'previous' | 'next') => {
    const rail = railScrollRef.current;
    if (!rail) return;
    rail.scrollBy({ behavior: 'smooth', left: (direction === 'next' ? 1 : -1) * rail.clientWidth * 0.8 });
  };

  useEffect(() => {
    if (!focusedGameId) return;
    const rail = railScrollRef.current;
    const focusedCard = rail?.querySelector(`[data-game-id="${focusedGameId}"]`);
    if (rail && focusedCard instanceof HTMLElement) {
      rail.scrollTo({
        behavior: 'smooth',
        left: focusedCard.offsetLeft - (rail.clientWidth - focusedCard.clientWidth) / 2,
      });
    }
  }, [focusedGameId]);

  return (
    <section className="cyberpunk-game-rail" data-rail-id={railId}>
      <div data-rail-anchor className="mb-3 flex items-center gap-3 border-b border-[color-mix(in_srgb,var(--theme-primary)_50%,transparent)] pb-2">
        <span aria-hidden="true" className="h-6 w-1.5 shrink-0 bg-[var(--theme-primary)] shadow-[2px_0_0_var(--theme-secondary)]" />
        <h2 className="font-mono text-base font-black uppercase tracking-tight text-[var(--theme-text)] sm:text-xl">{title}</h2>
        <div className="h-px flex-1 bg-[color-mix(in_srgb,var(--theme-primary)_50%,transparent)]" />
        <div role="group" aria-label={`${title} rail controls`} className="flex shrink-0 gap-2">
          <button aria-label={`Previous ${title} games`} className="flex h-8 w-8 items-center justify-center border-2 border-[var(--theme-primary)] bg-black font-mono text-lg font-black text-[var(--theme-primary)] transition-colors hover:bg-[var(--theme-primary)] hover:text-black" onClick={() => scrollRail('previous')}>&lt;</button>
          <button aria-label={`Next ${title} games`} className="flex h-8 w-8 items-center justify-center border-2 border-[var(--theme-primary)] bg-black font-mono text-lg font-black text-[var(--theme-primary)] transition-colors hover:bg-[var(--theme-primary)] hover:text-black" onClick={() => scrollRail('next')}>&gt;</button>
        </div>
      </div>
      {games.length > 0 ? (
        <div ref={railScrollRef} className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3" data-testid="cyberpunk-rail-scroll">
          {games.map((game, gameIndex) => {
            const focused = focusedGameId === game.id.toString();
            return (
              <article
                key={`${railId}-${game.id}`}
                className={`group relative snap-start cursor-pointer border bg-[var(--theme-surface)] p-1 transition-[border-color,box-shadow,transform] duration-100 ${focused ? 'border-2 border-[var(--theme-primary)] shadow-[2px_2px_0_var(--theme-primary),-1px_-1px_0_var(--theme-tertiary)]' : 'border-[var(--theme-outline-variant)] hover:border-[var(--theme-primary)]'}`}
                data-focused={focused ? 'true' : 'false'}
                data-game-id={game.id.toString()}
                data-testid={focused ? 'cyberpunk-focused-rail-card' : 'cyberpunk-rail-card'}
                onClick={() => onSelectGame(game)}
                onMouseEnter={() => onFocusGame(game.id.toString(), gameIndex)}
                onMouseLeave={() => onFocusGame(null)}
                style={{ width: 'clamp(280px, 16vw, 360px)', flexShrink: 0 }}
              >
                <div className="aspect-video overflow-hidden border border-[color-mix(in_srgb,var(--theme-primary)_45%,transparent)] bg-black">
                  <ImageSlider type="screenshot" filename={game.screenshotFilename} alt={game.name} className="h-full w-full object-cover grayscale transition-[filter] duration-200 group-hover:grayscale-0" />
                </div>
                {focused ? <CtrFocusedTitle game={game} /> : (
                  <div className="mt-1 flex items-center gap-2 px-1 py-1.5 font-mono text-[10px] uppercase tracking-wide">
                    <span className="min-w-0 flex-1 truncate text-[var(--theme-text)]">{game.name}</span>
                    <span className="shrink-0 text-[var(--theme-secondary)]">RUN</span>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="border border-dashed border-[var(--theme-outline-variant)] p-4 font-mono text-xs text-[var(--theme-text-muted)]">NO {title.toUpperCase()} LOADED.</div>
      )}
    </section>
  );
}

export function CyberpunkCrtGrid({
  activeAlphabetRailId,
  alphabetLabel,
  alphabetSections,
  classicGames,
  favoriteGames,
  focusedGameId,
  focusedRailId,
  games,
  gridColumns,
  recentGames,
  onSelectGame,
  isFavorite,
  toggleFavorite,
  focusedIndex = -1,
  onFocusChange,
  onFocusSectionItem,
  onEndReached,
  onFocusRailItem,
}: CyberpunkCrtGridProps) {
  const endSentinelRef = useRef<HTMLDivElement>(null);
  const [hoveredRailGameId, setHoveredRailGameId] = useState<string | null>(null);

  useEffect(() => {
    if (!onEndReached || !endSentinelRef.current || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void onEndReached();
    }, { rootMargin: '400px 0px' });
    observer.observe(endSentinelRef.current);
    return () => observer.disconnect();
  }, [onEndReached]);

  const librarySections = alphabetSections ?? [{ id: 'cyberpunk-library', label: alphabetLabel ?? 'LIBRARY_DATABASE', games }];

  const railProps = (railId: string) => ({
    focusedGameId: focusedRailId === railId ? focusedGameId : hoveredRailGameId,
    onFocusGame: (gameId: string | null, gameIndex?: number) => {
      setHoveredRailGameId(gameId);
      if (gameId && gameIndex !== undefined) onFocusRailItem?.(railId, gameIndex);
    },
  });

  return (
    <div className="cyberpunk-crt-grid grid gap-8 px-4 pb-24 pt-5 sm:px-6 lg:px-8" data-cyberpunk-presentation="crt-terminal" data-testid="cyberpunk-crt-grid">
      <CyberpunkRail {...railProps('recent')} games={recentGames} onSelectGame={onSelectGame} railId="recent" title="RECENT" />
      <CyberpunkRail {...railProps('favorites')} games={favoriteGames} onSelectGame={onSelectGame} railId="favorites" title="FAVOURITE" />
      <CyberpunkRail {...railProps('classics')} games={classicGames} onSelectGame={onSelectGame} railId="classics" title="CLASSICS" />

      {librarySections.map((section, sectionIndex) => (
        <section key={section.id} data-rail-id={section.id}>
          <div className="mb-3 flex items-end gap-3 border-b-2 border-[var(--theme-secondary)] pb-2">
            <span aria-hidden="true" className="h-6 w-1.5 bg-[var(--theme-secondary)] shadow-[2px_0_0_var(--theme-primary)]" />
            <h2 className="font-mono text-base font-black uppercase tracking-tight text-[var(--theme-text)] sm:text-xl">{section.label}</h2>
            <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--theme-text-muted)]">DATABASE</span>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8" style={gridColumns ? { gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` } : undefined}>
            {(activeAlphabetRailId === undefined || activeAlphabetRailId === section.id ? section.games : []).map((game, index) => {
              const focused = focusedRailId
                ? focusedRailId === section.id && (focusedIndex === index || focusedGameId === game.id.toString())
                : focusedIndex === index;
              const favorite = isFavorite(game.id.toString());
              return (
                <article key={`${section.id}-${game.id}-${index}`} className={`group relative min-w-0 max-w-full cursor-pointer border bg-[var(--theme-surface)] p-1 transition-[border-color,box-shadow] ${focused ? 'border-2 border-[var(--theme-primary)] shadow-[2px_2px_0_var(--theme-primary),-1px_-1px_0_var(--theme-tertiary)]' : 'border-[var(--theme-outline-variant)] hover:border-[var(--theme-primary)]'}`} data-focused={focused ? 'true' : 'false'} data-testid="cyberpunk-library-card" onClick={() => onSelectGame(game)} onMouseEnter={() => { onFocusChange?.(index); onFocusSectionItem?.(section.id, index); }} style={{ contentVisibility: 'auto', containIntrinsicSize: '0 230px', minWidth: 0, maxWidth: '100%' }}>
                  <div className="aspect-[1.75] min-h-0 min-w-0 overflow-hidden bg-black"><ImageSlider defer type="screenshot" filename={game.screenshotFilename} alt={`${game.name} cover graphic`} className="h-full min-h-0 w-full min-w-0 object-cover grayscale opacity-85 transition-[filter,opacity] group-hover:grayscale-0 group-hover:opacity-100" /></div>
                  <div className="mt-1 flex min-w-0 items-start gap-1 font-mono text-[9px] uppercase tracking-wide"><div className="min-w-0 flex-1"><div className="truncate font-black text-[var(--theme-text)]">{game.name}</div><div className="truncate text-[var(--theme-text-muted)]">{getMetadata(game)}</div></div><button aria-label={`Toggle favorite for ${game.name}`} className="shrink-0 text-sm text-[var(--theme-tertiary)]" onClick={(event) => { event.stopPropagation(); toggleFavorite(game.id.toString()); }}>{favorite ? '★' : '☆'}</button></div>
                </article>
              );
            })}
          </div>
          {onEndReached && sectionIndex === librarySections.length - 1 ? <div ref={endSentinelRef} aria-hidden="true" className="h-px" /> : null}
        </section>
      ))}
    </div>
  );
}
