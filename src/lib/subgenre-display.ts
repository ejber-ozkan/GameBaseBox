export interface VisibleSubGenresResult {
  hasOverflow: boolean;
  visibleSubGenres: string[];
}

export function getVisibleSubGenres(
  subGenres: string[],
  selectedSubGenre: string | undefined,
  maxVisible: number,
): VisibleSubGenresResult {
  if (subGenres.length <= maxVisible) {
    return {
      hasOverflow: false,
      visibleSubGenres: subGenres,
    };
  }

  const visible = subGenres.slice(0, Math.max(maxVisible - 1, 0));

  if (selectedSubGenre && subGenres.includes(selectedSubGenre) && !visible.includes(selectedSubGenre)) {
    visible.push(selectedSubGenre);
  } else if (subGenres[maxVisible - 1]) {
    visible.push(subGenres[maxVisible - 1]);
  }

  return {
    hasOverflow: visible.length < subGenres.length,
    visibleSubGenres: Array.from(new Set(visible)),
  };
}
