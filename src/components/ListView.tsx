import { Game } from '../types/game';
import { useEffect, useRef } from 'react';

interface ListViewProps {
  games: Game[];
  onSelectGame: (game: Game) => void;
  onSort: (column: keyof Game) => void;
  focusedIndex?: number;
  onFocusChange?: (index: number) => void;
  isFavorite?: (gameId: string) => boolean;
}

export function ListView({ games, onSelectGame, onSort, focusedIndex = -1, onFocusChange, isFavorite }: ListViewProps) {
  const tbodyRef = useRef<HTMLTableSectionElement>(null);

  useEffect(() => {
    if (focusedIndex >= 0 && tbodyRef.current) {
      const child = tbodyRef.current.children[focusedIndex] as HTMLElement;
      if (child) {
        child.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [focusedIndex]);
  return (
    <div className="overflow-x-auto p-4">
      <table className="min-w-full text-left text-sm text-gray-300">
        <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
          <tr>
            <th className="px-4 py-2 cursor-pointer hover:text-white" onClick={() => onSort('name')}>Title</th>
            <th className="px-4 py-2 cursor-pointer hover:text-white" onClick={() => onSort('year')}>Year</th>
            <th className="px-4 py-2 cursor-pointer hover:text-white" onClick={() => onSort('publisher')}>Publisher</th>
            <th className="px-4 py-2 cursor-pointer hover:text-white" onClick={() => onSort('parentGenre')}>Genre</th>
          </tr>
        </thead>
        <tbody ref={tbodyRef}>
          {games.map((game, index) => {
            const isFocused = focusedIndex === index;
            const favorited = isFavorite?.(game.id.toString()) ?? false;
            return (
            <tr
              key={`${game.id}-${index}`}
              onClick={() => onSelectGame(game)}
              onMouseEnter={() => onFocusChange?.(index)}
              className={`border-b border-gray-700 cursor-pointer transition-colors ${
                isFocused ? 'bg-blue-900/50 outline outline-2 outline-blue-500' : 'hover:bg-gray-600'
              }`}
            >
              <td className="px-4 py-2 font-medium text-white">
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${favorited ? 'text-pink-400' : 'text-gray-600'}`}>{favorited ? '♥' : '♡'}</span>
                  <span>{game.name}</span>
                </div>
              </td>
              <td className="px-4 py-2">{game.year || '-'}</td>
              <td className="px-4 py-2">{game.publisher?.name || '-'}</td>
              <td className="px-4 py-2">{game.parentGenre}</td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
