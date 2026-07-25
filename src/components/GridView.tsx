import { Game } from '../types/game';
import { ImageSlider } from './ImageSlider';
import { useFavorites } from '../hooks/useFavorites';
import { useEffect, useRef } from 'react';

interface GridViewProps {
  games: Game[];
  onSelectGame: (game: Game) => void;
  focusedIndex?: number;
  onFocusChange?: (index: number) => void;
  onEndReached?: () => void | Promise<void>;
}

export function GridView({ games, onSelectGame, focusedIndex = -1, onFocusChange, onEndReached }: GridViewProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const containerRef = useRef<HTMLDivElement>(null);
  const endSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusedIndex >= 0 && containerRef.current) {
      const child = containerRef.current.children[focusedIndex] as HTMLElement;
      if (child) {
        child.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [focusedIndex]);

  useEffect(() => {
    if (!onEndReached || !endSentinelRef.current || !('IntersectionObserver' in window)) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        void onEndReached();
      }
    }, { rootMargin: '400px 0px' });
    observer.observe(endSentinelRef.current);

    return () => observer.disconnect();
  }, [onEndReached]);

  return (
    <div ref={containerRef} className="grid grid-cols-2 gap-4 rounded-[var(--theme-radius-xl)] bg-[var(--theme-background)] p-4 md:grid-cols-4 lg:grid-cols-6">
      {games.map((game, index) => {
        const isFocused = focusedIndex === index;
        return (
        <div
          key={`${game.id}-${index}`}
          className={`flex cursor-pointer flex-col rounded-[var(--theme-radius-lg)] border border-[var(--theme-outline-variant)] bg-[var(--theme-surface)] p-2 shadow-lg transition-all ${
            isFocused 
              ? 'scale-105 border-[var(--theme-primary)] bg-[var(--theme-primary-container)] ring-2 ring-[var(--theme-primary)]'
              : 'hover:scale-105 hover:border-[var(--theme-outline)] hover:bg-[var(--theme-primary-container)]'
          }`}
          onClick={() => onSelectGame(game)}
          onMouseEnter={() => onFocusChange?.(index)}
          style={{ contentVisibility: 'auto', containIntrinsicSize: '0 230px' }}
        >
          <div className="mb-2 flex aspect-[1.6] overflow-hidden rounded-[var(--theme-radius-sm)] border border-[var(--theme-outline-variant)] bg-[var(--theme-background)]">
            <ImageSlider 
              defer
              type="screenshot"
              filename={game.screenshotFilename} 
              alt={`${game.name} cover graphic`}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="mt-auto">
             <div className="flex justify-between items-start">
               <div className="flex-1 truncate pr-2 text-sm font-semibold text-[var(--theme-text)]" title={game.name}>
                   {game.name}
               </div>
               <button 
                 onClick={(e) => { e.stopPropagation(); toggleFavorite(game.id.toString()); }}
                 className="text-lg hover:scale-125 transition-transform"
                 title="Toggle Favorite"
               >
                 {isFavorite(game.id.toString()) ? '❤️' : '🤍'}
               </button>
             </div>
              <div className="text-xs text-[var(--theme-text-muted)]">
                  {game.year || 'Unknown Year'}
              </div>
           </div>
         </div>
         );
      })}
      {onEndReached ? <div ref={endSentinelRef} aria-hidden="true" className="col-span-full h-px" /> : null}
    </div>
  );
}
