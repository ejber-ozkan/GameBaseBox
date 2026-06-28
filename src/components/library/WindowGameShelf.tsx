"use client";

import { useEffect, useRef, useState, type RefObject } from 'react';
import { ImageSlider } from '../ImageSlider';
import type { Game } from '../../types/game';

interface WindowGameShelfProps {
  games: Game[];
  isFavorite: (gameId: string) => boolean;
  isMouseMode: boolean;
  onFocusChange?: (index: number) => void;
  onSelectGame: (game: Game) => void;
  title: string;
  subtitle?: string;
  shelfRef?: RefObject<HTMLDivElement | null>;
}

export function WindowGameShelf({
  games,
  isFavorite,
  isMouseMode,
  onFocusChange,
  onSelectGame,
  title,
  subtitle,
  shelfRef,
}: WindowGameShelfProps) {
  const internalShelfRef = useRef<HTMLDivElement | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isCoolingDown, setIsCoolingDown] = useState(false);

  useEffect(() => {
    const element = internalShelfRef.current;
    if (!element) {
      return;
    }

    const updateScrollState = () => {
      const maxScrollLeft = element.scrollWidth - element.clientWidth;
      setCanScrollLeft(element.scrollLeft > 8);
      setCanScrollRight(element.scrollLeft < maxScrollLeft - 8);
    };

    updateScrollState();
    element.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);

    return () => {
      element.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [games.length]);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) {
        clearTimeout(cooldownRef.current);
      }
    };
  }, []);

  const setShelfNode = (node: HTMLDivElement | null) => {
    internalShelfRef.current = node;

    if (shelfRef) {
      shelfRef.current = node;
    }
  };

  const scrollShelf = (direction: 'left' | 'right') => {
    const element = internalShelfRef.current;
    if (!element || isCoolingDown) {
      return;
    }

    const items = Array.from(element.children) as HTMLElement[];
    if (items.length === 0) {
      return;
    }

    const threshold = direction === 'right'
      ? element.scrollLeft + 12
      : element.scrollLeft - 12;

    const target = direction === 'right'
      ? items.find((item) => item.offsetLeft > threshold)
      : [...items].reverse().find((item) => item.offsetLeft < threshold);

    const fallbackOffset = direction === 'right'
      ? element.scrollLeft + 340
      : Math.max(0, element.scrollLeft - 340);

    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    } else {
      element.scrollTo({ left: fallbackOffset, behavior: 'smooth' });
    }

    setIsCoolingDown(true);
    cooldownRef.current = setTimeout(() => {
      setIsCoolingDown(false);
    }, 1000);
  };

  if (games.length === 0) {
    return null;
  }

  return (
    <section className="mb-12 px-4">
      <div className="mb-4 flex items-end gap-4">
        <h2 className="text-[2rem] font-black uppercase tracking-tighter text-blue-300">
          {title}
        </h2>
        <div className="mb-2 h-px flex-1 bg-gradient-to-r from-sky-400/60 via-cyan-300/20 to-transparent" />
      </div>
      {subtitle ? (
        <p className="mb-5 max-w-3xl text-sm font-medium text-white/45">{subtitle}</p>
      ) : null}

      <div className="relative">
        {canScrollLeft ? (
          <button
            type="button"
            onClick={() => scrollShelf('left')}
            disabled={isCoolingDown}
            className="absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-slate-900/55 text-2xl text-white/80 shadow-[0_12px_36px_rgba(2,6,23,0.4)] backdrop-blur-md transition-all hover:bg-slate-800/75 hover:text-white disabled:cursor-default disabled:opacity-40"
            aria-label={`Scroll ${title} left`}
          >
            ‹
          </button>
        ) : null}

        {canScrollRight ? (
          <button
            type="button"
            onClick={() => scrollShelf('right')}
            disabled={isCoolingDown}
            className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-slate-900/55 text-2xl text-white/80 shadow-[0_12px_36px_rgba(2,6,23,0.4)] backdrop-blur-md transition-all hover:bg-slate-800/75 hover:text-white disabled:cursor-default disabled:opacity-40"
            aria-label={`Scroll ${title} right`}
          >
            ›
          </button>
        ) : null}

        <div
          ref={setShelfNode}
          className="no-scrollbar flex snap-x gap-5 overflow-x-auto pb-4 scroll-smooth"
        >
          {games.map((game, index) => (
            <article
              key={`${title}-${game.id}-${index}`}
              onClick={() => onSelectGame(game)}
              onMouseEnter={() => {
                if (isMouseMode) {
                  onFocusChange?.(index);
                }
              }}
              className="group relative aspect-[1.9] w-[320px] shrink-0 snap-start cursor-pointer overflow-hidden rounded-[24px] border border-white/10 bg-[#09111b] shadow-[0_18px_60px_rgba(2,6,23,0.45)] transition-all duration-300 hover:-translate-y-1 hover:border-white/20"
            >
              {isFavorite(game.id.toString()) && (
                <div className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-pink-300/60 bg-black/60 text-lg text-pink-300 shadow-lg backdrop-blur-md">
                  ♥
                </div>
              )}

              <ImageSlider
                type="screenshot"
                filename={game.screenshotFilename}
                alt={game.name}
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 border-t border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.08),rgba(2,6,23,0.92))] p-5">
                <div className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-200/80">
                  {game.year || 'Classic'} {game.parentGenre ? `• ${game.parentGenre}` : ''}
                </div>
                <div className="text-2xl font-black leading-tight text-white line-clamp-2">
                  {game.name}
                </div>
                <div className="truncate text-xs font-medium text-white/60">
                  {game.publisher?.name && game.publisher.name !== '(Not Published)'
                    ? game.publisher.name
                    : game.developer?.name && game.developer.name !== '(Unknown)'
                      ? game.developer.name
                      : 'Unknown'}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
