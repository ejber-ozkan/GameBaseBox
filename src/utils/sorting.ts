import { Game } from '../types/game';

type SortDirection = 'asc' | 'desc';

export function sortGames(games: Game[], column: keyof Game, direction: SortDirection = 'asc'): Game[] {
  return [...games].sort((a, b) => {
    let valA = a[column];
    let valB = b[column];

    // Handle nested fields like developer and publisher
    if (column === 'developer' || column === 'publisher' || column === 'musician') {
      valA = a[column] ? a[column].name : null;
      valB = b[column] ? b[column].name : null;
    }

    // Handle null values (nulls always last)
    if (valA === null && valB !== null) return direction === 'asc' ? 1 : 1;
    if (valA !== null && valB === null) return direction === 'asc' ? -1 : -1;
    if (valA === null && valB === null) return 0;

    // Handle string comparisons
    if (typeof valA === 'string' && typeof valB === 'string') {
      return direction === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }

    // Handle number comparisons
    if (typeof valA === 'number' && typeof valB === 'number') {
      return direction === 'asc' ? valA - valB : valB - valA;
    }

    // Handle booleans
    if (typeof valA === 'boolean' && typeof valB === 'boolean') {
      return direction === 'asc'
        ? (valA === valB ? 0 : valA ? -1 : 1)
        : (valA === valB ? 0 : valA ? 1 : -1);
    }

    return 0;
  });
}
