"use client";

import { useEffect, useRef, useState } from 'react';
import { ImageSlider } from '../ImageSlider';
import type { Game } from '../../types/game';

interface C64EditionGridProps {
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
  onFocusChange?: (index: number) => void;
  onEndReached?: () => void | Promise<void>;
}

function getStudio(game: Game) {
  if (game.publisher?.name && game.publisher.name !== '(Not Published)') return game.publisher.name;
  if (game.developer?.name && game.developer.name !== '(Unknown)') return game.developer.name;
  return 'READY.';
}

function C64FocusTitle({ game }: { game: Game }) {
  return (
    <div className="mt-1 flex min-h-16 w-full items-center gap-3 bg-[#ffff66] px-4 py-3 text-black" data-testid="c64-focused-title-strip">
      <div className="min-w-0 truncate font-mono text-base font-black uppercase tracking-wide sm:text-xl" data-testid="c64-focused-title">{game.name}</div>
      <span aria-hidden="true" className="ml-auto min-h-8 w-4 shrink-0 self-stretch bg-black animate-[blink_1s_steps(1,end)_infinite]" data-testid="c64-blinking-cursor" />
    </div>
  );
}

function C64Rail({ games, focusedGameId, onFocusGame, onSelectGame, railId, title }: Pick<C64EditionGridProps, 'onSelectGame'> & { focusedGameId?: string | null; games: Game[]; onFocusGame: (gameId: string | null) => void; railId: string; title: string }) {
  const railScrollRef = useRef<HTMLDivElement>(null);

  const scrollRail = (direction: 'previous' | 'next') => {
    const rail = railScrollRef.current;
    if (!rail) return;
    rail.scrollBy({ behavior: 'smooth', left: (direction === 'next' ? 1 : -1) * rail.clientWidth * 0.8 });
  };

  useEffect(() => {
    if (!focusedGameId) return;
    const focusedCard = railScrollRef.current?.querySelector(`[data-game-id="${focusedGameId}"]`);
    if (focusedCard instanceof HTMLElement) {
      focusedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [focusedGameId]);

  return (
    <section className="c64-game-rail" data-rail-id={railId}>
      <div className="mb-4 flex items-center gap-3">
        <div className="h-5 w-5 bg-[var(--theme-primary)]" />
        <h2 className="font-mono text-xl font-black tracking-tight text-[var(--theme-primary)] sm:text-2xl">{title}</h2>
        <div className="h-px flex-1 bg-[var(--theme-outline-variant)]" />
        <div className="flex shrink-0 gap-2">
          <button aria-label={`Previous ${title} games`} className="flex h-9 w-9 items-center justify-center border-2 border-[var(--theme-primary)] bg-black font-mono text-xl font-black text-[var(--theme-primary)] transition-colors hover:bg-[#ffff66] hover:text-black" onClick={() => scrollRail('previous')}>‹</button>
          <button aria-label={`Next ${title} games`} className="flex h-9 w-9 items-center justify-center border-2 border-[var(--theme-primary)] bg-black font-mono text-xl font-black text-[var(--theme-primary)] transition-colors hover:bg-[#ffff66] hover:text-black" onClick={() => scrollRail('next')}>›</button>
        </div>
      </div>
      {games.length > 0 ? (
        <div ref={railScrollRef} className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3" data-testid="c64-rail-scroll">
          {games.map((game) => {
            const focused = focusedGameId === game.id.toString();
            return (
                <article
                  key={`${title}-${game.id}`}
                  className={`group flex-none snap-start cursor-pointer border-[6px] bg-black p-1 transition-colors ${focused ? 'border-[#ffff66] shadow-[0_0_0_3px_#ffff66]' : 'border-[var(--theme-outline-variant)] hover:border-[#ffff66]'}`}
                  data-game-id={game.id.toString()}
                  data-testid={focused ? 'c64-focused-rail-card' : 'c64-rail-card'}
                  onClick={() => onSelectGame(game)}
                  onMouseEnter={() => onFocusGame(game.id.toString())}
                  onMouseLeave={() => onFocusGame(null)}
                  style={{ width: 'clamp(300px, 32vw, 440px)' }}
                >
                  <div className="aspect-video overflow-hidden border-4 border-[var(--theme-outline-variant)] bg-black" data-testid="c64-recent-media">
                <ImageSlider type="screenshot" filename={game.screenshotFilename} alt={game.name} className="h-full w-full object-cover" />
                  </div>
                  {focused ? <C64FocusTitle game={game} /> : (
                    <div className="mt-1 flex items-center justify-between gap-3 bg-[var(--theme-primary-container)] px-3 py-2">
                      <div className="min-w-0">
                        <div className="truncate font-mono text-xs font-black uppercase tracking-wider text-[var(--theme-primary)]">{game.name}</div>
                        <div className="truncate font-mono text-[10px] uppercase tracking-wider text-[var(--theme-text-muted)]">{getStudio(game)}</div>
                      </div>
                      <span className="font-mono text-xs text-[var(--theme-secondary)]">RUN</span>
                    </div>
                  )}
                </article>
            );
          })}
        </div>
      ) : (
        <div className="border-4 border-dashed border-[var(--theme-outline-variant)] p-5 font-mono text-sm text-[var(--theme-text-muted)]">NO {title.toUpperCase()} LOADED.</div>
      )}
    </section>
  );
}

export function C64EditionGrid({
  alphabetLabel,
  classicGames,
  favoriteGames,
  focusedGameId,
  focusedRailId,
  games,
  recentGames,
  onSelectGame,
  isFavorite,
  toggleFavorite,
  focusedIndex = -1,
  onFocusChange,
  onEndReached,
}: C64EditionGridProps) {
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

  return (
    <div className="c64-edition-grid grid gap-8 px-4 pb-24 pt-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)] lg:px-8" data-c64-presentation="monitor" data-testid="c64-edition-grid">
      <C64Rail games={recentGames} focusedGameId={focusedRailId === 'recent' ? focusedGameId : hoveredRailGameId} onFocusGame={setHoveredRailGameId} onSelectGame={onSelectGame} railId="recent" title="RECENT" />
      <C64Rail games={favoriteGames} focusedGameId={focusedRailId === 'favorites' ? focusedGameId : hoveredRailGameId} onFocusGame={setHoveredRailGameId} onSelectGame={onSelectGame} railId="favorites" title="FAVOURITES" />
      <C64Rail games={classicGames} focusedGameId={focusedRailId === 'classics' ? focusedGameId : hoveredRailGameId} onFocusGame={setHoveredRailGameId} onSelectGame={onSelectGame} railId="classics" title="CLASSICS" />

      <section className="c64-library-romset" data-rail-id="c64-library">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-5 w-5 bg-[var(--theme-secondary)]" />
          <h2 className="font-mono text-xl font-black tracking-tight text-[var(--theme-secondary)] sm:text-2xl">{alphabetLabel ?? 'LIBRARY'}</h2>
          <div className="h-px flex-1 bg-[var(--theme-outline-variant)]" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {games.map((game, index) => {
            const focused = focusedIndex === index || ((focusedRailId?.startsWith('alpha-') || focusedRailId === 'c64-library') && focusedGameId === game.id.toString());
            const favorite = isFavorite(game.id.toString());
            return (
              <article
                key={`${game.id}-${index}`}
                className={`group relative cursor-pointer border-4 bg-black p-1 transition-colors ${focused ? 'border-[#ffff66] bg-[var(--theme-primary-container)] shadow-[0_0_0_2px_#ffff66]' : 'border-[var(--theme-outline-variant)] hover:border-[var(--theme-primary)]'}`}
                data-focused={focused ? 'true' : 'false'}
                data-testid="c64-rom-card"
                onClick={() => onSelectGame(game)}
                onMouseEnter={() => onFocusChange?.(index)}
                style={{ contentVisibility: 'auto', containIntrinsicSize: '0 300px' }}
              >
                <div className="aspect-[3/4] overflow-hidden bg-black" data-testid="c64-rom-media">
                  <ImageSlider defer type="screenshot" filename={game.screenshotFilename} alt={`${game.name} cover graphic`} className="h-full w-full object-contain opacity-85 transition-opacity group-hover:opacity-100" />
                </div>
                {focused ? (
                  <C64FocusTitle game={game} />
                ) : (
                  <div className="mt-1 flex items-start justify-between gap-1 px-1">
                    <div className="min-w-0">
                      <div className="truncate font-mono text-[10px] font-black uppercase tracking-wider text-[var(--theme-primary)]">{game.name}</div>
                      <div className="font-mono text-[9px] uppercase text-[var(--theme-text-muted)]">{game.year || 'READY.'}</div>
                    </div>
                    <button aria-label={`Toggle favorite for ${game.name}`} className="shrink-0 font-mono text-sm text-[var(--theme-tertiary)]" onClick={(event) => { event.stopPropagation(); toggleFavorite(game.id.toString()); }}>
                      {favorite ? '★' : '☆'}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
        {onEndReached ? <div ref={endSentinelRef} aria-hidden="true" className="h-px" /> : null}
      </section>
    </div>
  );
}
