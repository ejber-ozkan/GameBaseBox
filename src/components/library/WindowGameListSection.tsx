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
    <section className="px-4" style={{ marginBottom: '2rem' }}>
      <div
        className="mb-3 flex items-center gap-4"
        data-density="prominent"
        data-hierarchy={header.hierarchy}
        data-section={section}
        data-testid="window-list-header"
      >
        <h2
          className="font-black uppercase text-[var(--theme-primary)]"
          style={{ fontSize: '20px', letterSpacing: '0.1em', lineHeight: 1, margin: 0 }}
        >
          {title}
        </h2>
        <div
          className="h-px flex-1 bg-[var(--theme-primary)] opacity-60"
          data-testid="window-list-divider"
        />
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
