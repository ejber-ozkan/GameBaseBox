import { Game } from '../types/game';
import { ImageSlider } from './ImageSlider';
import { useFavorites } from '../hooks/useFavorites';
import { useEffect, useRef } from 'react';

interface GridViewProps {
  games: Game[];
  onSelectGame: (game: Game) => void;
  focusedIndex?: number;
  onFocusChange?: (index: number) => void;
}

export function GridView({ games, onSelectGame, focusedIndex = -1, onFocusChange }: GridViewProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusedIndex >= 0 && containerRef.current) {
      const child = containerRef.current.children[focusedIndex] as HTMLElement;
      if (child) {
        child.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [focusedIndex]);

  return (
    <div ref={containerRef} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
      {games.map((game, index) => {
        const isFocused = focusedIndex === index;
        return (
        <div
          key={`${game.id}-${index}`}
          className={`p-2 rounded-lg cursor-pointer transition-all border shadow-lg flex flex-col ${
            isFocused 
              ? 'bg-blue-900/60 scale-105 border-blue-400 ring-2 ring-blue-500 shadow-blue-900/50' 
              : 'bg-gray-800 hover:bg-gray-700 hover:scale-105 border-gray-600'
          }`}
          onClick={() => onSelectGame(game)}
          onMouseEnter={() => onFocusChange?.(index)}
          style={{ contentVisibility: 'auto', containIntrinsicSize: '0 230px' }}
        >
          <div className="aspect-[1.6] bg-gray-950 mb-2 flex overflow-hidden rounded border border-white/5">
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
               <div className="text-sm font-semibold truncate text-gray-100 flex-1 pr-2" title={game.name}>
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
              <div className="text-xs text-gray-400">
                  {game.year || 'Unknown Year'}
              </div>
           </div>
         </div>
         );
      })}
    </div>
  );
}
