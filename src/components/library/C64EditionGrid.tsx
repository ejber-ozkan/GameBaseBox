"use client";

import { useEffect, useRef } from 'react';
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
  focusedIndex?: number;
  onFocusChange?: (index: number) => void;
  onEndReached?: () => void | Promise<void>;
}

function getStudio(game: Game) {
  if (game.publisher?.name && game.publisher.name !== '(Not Published)') return game.publisher.name;
  if (game.developer?.name && game.developer.name !== '(Unknown)') return game.developer.name;
  return 'READY.';
}

function C64Rail({ games, onSelectGame, title }: Pick<C64EditionGridProps, 'onSelectGame'> & { games: Game[]; title: string }) {
  return (
    <section className="c64-game-rail">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-5 w-5 bg-[var(--theme-primary)]" />
        <h2 className="font-mono text-xl font-black tracking-tight text-[var(--theme-primary)] sm:text-2xl">{title}</h2>
        <div className="h-px flex-1 bg-[var(--theme-outline-variant)]" />
      </div>
      {games.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {games.map((game) => (
            <article
              key={`${title}-${game.id}`}
              className="group cursor-pointer border-4 border-[var(--theme-outline-variant)] bg-[var(--theme-surface)] p-1 transition-colors hover:border-[var(--theme-primary)]"
              data-testid="c64-rail-card"
              onClick={() => onSelectGame(game)}
            >
              <div className="aspect-video overflow-hidden border-4 border-[var(--theme-outline-variant)] bg-black" data-testid="c64-recent-media">
                <ImageSlider type="screenshot" filename={game.screenshotFilename} alt={game.name} className="h-full w-full object-cover" />
              </div>
              <div className="mt-1 flex items-center justify-between gap-3 bg-[var(--theme-primary-container)] px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate font-mono text-xs font-black uppercase tracking-wider text-[var(--theme-primary)]">{game.name}</div>
                  <div className="truncate font-mono text-[10px] uppercase tracking-wider text-[var(--theme-text-muted)]">{getStudio(game)}</div>
                </div>
                <span className="font-mono text-xs text-[var(--theme-secondary)]">RUN</span>
              </div>
            </article>
          ))}
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
      <C64Rail games={recentGames} onSelectGame={onSelectGame} title="Recent" />
      <C64Rail games={favoriteGames} onSelectGame={onSelectGame} title="Favourites" />
      <C64Rail games={classicGames} onSelectGame={onSelectGame} title="Classics" />

      <section className="c64-library-romset">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-5 w-5 bg-[var(--theme-secondary)]" />
          <h2 className="font-mono text-xl font-black tracking-tight text-[var(--theme-secondary)] sm:text-2xl">{alphabetLabel ?? 'LIBRARY_ROMSET'}</h2>
          <div className="h-px flex-1 bg-[var(--theme-outline-variant)]" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {games.map((game, index) => {
            const focused = focusedIndex === index || focusedGameId === game.id.toString();
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
                  <div className="mt-1 flex min-h-12 items-center justify-between gap-3 bg-[#ffff66] px-3 py-2 text-black" data-testid="c64-focused-title-strip">
                    <div className="min-w-0 truncate font-mono text-base font-black uppercase tracking-wide sm:text-lg" data-testid="c64-focused-title">{game.name}</div>
                    <span aria-hidden="true" className="h-7 w-3 shrink-0 bg-black animate-[blink_1s_steps(1,end)_infinite]" data-testid="c64-blinking-cursor" />
                  </div>
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
