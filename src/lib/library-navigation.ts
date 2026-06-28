export type LibraryViewMode = 'grid' | 'list';
export type VerticalDirection = 'UP' | 'DOWN';
export type HorizontalDirection = 'LEFT' | 'RIGHT';
type SelectableGame = { id: string | number };

export function getLibraryColumnCount(viewMode: LibraryViewMode, viewportWidth?: number) {
  if (viewMode === 'list') {
    return 1;
  }

  const width = viewportWidth ?? (typeof window !== 'undefined' ? window.innerWidth : 1280);
  if (width >= 1024) return 6;
  if (width >= 768) return 4;
  return 2;
}

export function getNextLetterJump(
  currentLetter: string | undefined,
  direction: 'forward' | 'backward',
  letters: string[],
) {
  const currentIndex = currentLetter ? letters.indexOf(currentLetter) : -1;
  if (direction === 'forward') {
    return letters[currentIndex + 1 >= letters.length ? 0 : currentIndex + 1];
  }
  return letters[currentIndex - 1 < 0 ? letters.length - 1 : currentIndex - 1];
}

export function moveLibraryFocusHorizontally(
  currentIndex: number,
  direction: HorizontalDirection,
  minIndex: number,
  maxIndex: number,
) {
  if (direction === 'RIGHT') {
    return Math.min(currentIndex + 1, maxIndex);
  }
  return Math.max(currentIndex - 1, minIndex);
}

export function moveLibraryFocusVertically(
  currentIndex: number,
  direction: VerticalDirection,
  columns: number,
  recentCount: number,
  maxIndex: number,
) {
  const minIndex = recentCount > 0 ? -recentCount : 0;

  if (direction === 'DOWN') {
    if (currentIndex < 0) {
      return 0;
    }
    return Math.min(currentIndex + columns, maxIndex);
  }

  if (currentIndex >= 0 && currentIndex < columns && recentCount > 0) {
    const ratio = currentIndex / Math.max(columns - 1, 1);
    const shelfIndex = Math.floor(ratio * (recentCount - 1));
    return shelfIndex - recentCount;
  }

  if (currentIndex < 0) {
    return currentIndex;
  }

  return Math.max(currentIndex - columns, minIndex);
}

export function resolveFocusedGame<T extends SelectableGame>(
  focusedIndex: number,
  games: T[],
  recentIds: string[],
) {
  if (focusedIndex < 0) {
    const recentId = recentIds[recentIds.length + focusedIndex];
    return games.find((game) => game.id.toString() === recentId) ?? null;
  }

  return games[focusedIndex] ?? null;
}
