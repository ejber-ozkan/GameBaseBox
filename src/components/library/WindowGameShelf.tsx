"use client";

import { useEffect, useRef, useState, type RefObject } from 'react';
import { ImageSlider } from '../ImageSlider';
import type { Game } from '../../types/game';

type WindowLibrarySection = 'recent' | 'favorites' | 'legendary';

interface WindowGameShelfProps {
  games: Game[];
  isFavorite: (gameId: string) => boolean;
  isMouseMode: boolean;
  onFocusChange?: (index: number) => void;
  onSelectGame: (game: Game) => void;
  section: WindowLibrarySection;
  isArcadeVoid?: boolean;
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
  section,
  isArcadeVoid = false,
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

  const headerStyles = {
    recent: {
      hierarchy: 'compact',
    },
    favorites: {
      hierarchy: 'supporting',
    },
    legendary: {
      hierarchy: 'featured',
    },
  } as const;
  const header = headerStyles[section];

  return (
    <section className="px-4" style={{ marginBottom: '2.5rem' }}>
      <div
        className="mb-3 flex items-end gap-4"
        data-density="prominent"
        data-hierarchy={header.hierarchy}
        data-section={section}
        data-testid="window-shelf-header"
      >
        <h2
          className="font-black uppercase text-[var(--theme-primary)]"
          style={{ fontSize: '24px', letterSpacing: '0.02em', lineHeight: 1, margin: 0 }}
        >
          {title}
        </h2>
        <div
          className="mb-1 h-px flex-1 bg-[var(--theme-primary)] opacity-60"
          data-section-divider
        />
      </div>
      {subtitle ? (
        <p className="mb-3 max-w-3xl text-sm font-medium text-[var(--theme-text-muted)]">{subtitle}</p>
      ) : null}

      <div className="relative">
        {canScrollLeft ? (
          <button
            type="button"
            onClick={() => scrollShelf('left')}
            disabled={isCoolingDown}
            className="absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-[var(--theme-radius-xl)] border border-[var(--theme-outline-variant)] bg-[var(--theme-surface)] text-2xl text-[var(--theme-text)] shadow-lg backdrop-blur-md transition-all hover:bg-[var(--theme-primary-container)] disabled:cursor-default disabled:opacity-40"
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
            className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-[var(--theme-radius-xl)] border border-[var(--theme-outline-variant)] bg-[var(--theme-surface)] text-2xl text-[var(--theme-text)] shadow-lg backdrop-blur-md transition-all hover:bg-[var(--theme-primary-container)] disabled:cursor-default disabled:opacity-40"
            aria-label={`Scroll ${title} right`}
          >
            ›
          </button>
        ) : null}

        <div
          ref={setShelfNode}
          className={`no-scrollbar flex snap-x overflow-x-auto pb-4 scroll-smooth ${isArcadeVoid ? 'gap-6' : 'gap-5'}`}
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
              className={`group relative shrink-0 snap-start cursor-pointer overflow-hidden rounded-[var(--theme-radius-xl)] border border-[var(--theme-outline-variant)] bg-[var(--theme-surface)] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-[var(--theme-outline)] ${
                isArcadeVoid ? 'aspect-video' : 'aspect-[1.9] w-[320px]'
              }`}
              style={isArcadeVoid ? { width: 'clamp(340px, 28vw, 440px)' } : undefined}
            >
              {isFavorite(game.id.toString()) && (
                <div className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--theme-tertiary)] bg-[var(--theme-background)] text-lg text-[var(--theme-tertiary)] shadow-lg backdrop-blur-md">
                  ♥
                </div>
              )}

              <ImageSlider
                type="screenshot"
                filename={game.screenshotFilename}
                alt={game.name}
                className="h-full w-full object-cover"
              />

              <div
                className={`absolute inset-x-0 bottom-0 flex flex-col gap-0.5 border-t border-[var(--theme-outline-variant)] ${isArcadeVoid ? 'p-5' : 'p-3'}`}
                data-testid="window-shelf-title-overlay"
                data-visual-treatment="blurred-compact"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--theme-surface) 78%, transparent)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <div className="font-black uppercase text-[var(--theme-primary)]" style={{ fontSize: '10px', letterSpacing: '0.18em' }}>
                  {game.year || 'Classic'} {game.parentGenre ? `• ${game.parentGenre}` : ''}
                </div>
                <div
                  className="truncate font-black text-[var(--theme-text)]"
                  data-testid="window-shelf-game-title"
                  style={{ fontSize: isArcadeVoid ? '20px' : '16px', lineHeight: 1.2 }}
                >
                  {game.name}
                </div>
                <div className="truncate font-medium text-[var(--theme-text-muted)]" style={{ fontSize: '10px' }}>
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
