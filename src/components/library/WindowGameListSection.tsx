"use client";

import type { Game } from '../../types/game';

type WindowLibrarySection = 'recent' | 'favorites' | 'legendary';

interface WindowGameListSectionProps {
  games: Game[];
  isFavorite: (gameId: string) => boolean;
  onSelectGame: (game: Game) => void;
  section: WindowLibrarySection;
  title: string;
}

export function WindowGameListSection({
  games,
  isFavorite,
  onSelectGame,
  section,
  title,
}: WindowGameListSectionProps) {
  if (games.length === 0) {
    return null;
  }

  const headerStyles = {
    recent: {
      hierarchy: 'compact',
      title: 'text-xs tracking-[0.12em]',
    },
    favorites: {
      hierarchy: 'supporting',
      title: 'text-xs tracking-[0.12em]',
    },
    legendary: {
      hierarchy: 'featured',
      title: 'text-xs tracking-[0.08em]',
    },
  } as const;
  const header = headerStyles[section];

  return (
    <section className="mb-5 px-4">
      <div
        className="mb-1 flex items-center"
        data-density="compact"
        data-hierarchy={header.hierarchy}
        data-section={section}
        data-testid="window-list-header"
      >
        <h2 className={`font-black uppercase text-[var(--theme-primary)] ${header.title}`}>{title}</h2>
      </div>

      <div className="overflow-hidden rounded-[var(--theme-radius-lg)] border border-[var(--theme-outline-variant)] bg-[var(--theme-surface)]">
        {games.map((game, index) => {
          const studio =
            game.publisher?.name && game.publisher.name !== '(Not Published)'
              ? game.publisher.name
              : game.developer?.name && game.developer.name !== '(Unknown)'
                ? game.developer.name
                : 'Unknown';

          return (
            <button
              key={`${title}-${game.id}-${index}`}
              type="button"
              onClick={() => onSelectGame(game)}
              className={`grid w-full grid-cols-[minmax(0,1.6fr)_120px_160px_140px] items-center gap-4 px-5 py-3 text-left transition-colors ${
                index < games.length - 1 ? 'border-b border-[var(--theme-outline-variant)]' : ''
              } hover:bg-[var(--theme-primary-container)]`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${isFavorite(game.id.toString()) ? 'text-[var(--theme-tertiary)]' : 'text-[var(--theme-text-muted)]'}`}>
                    {isFavorite(game.id.toString()) ? '♥' : '•'}
                  </span>
                  <span className="truncate text-sm font-semibold text-[var(--theme-text)]">{game.name}</span>
                </div>
              </div>
              <div className="text-sm text-[var(--theme-text-muted)]">{game.year || '-'}</div>
              <div className="truncate text-sm text-[var(--theme-text-muted)]">{studio}</div>
              <div className="truncate text-sm text-[var(--theme-text-muted)]">{game.parentGenre}</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
