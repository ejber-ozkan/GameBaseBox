export function getC64ViewingPath(letter?: string, searchInput?: string): string {
  const cleanLetter = letter?.trim().toUpperCase();
  const cleanSearch = searchInput?.trim().toUpperCase();

  const hasLetter = Boolean(cleanLetter);
  const hasSearch = Boolean(cleanSearch);

  if (hasLetter && hasSearch) {
    return `LIST INDEX_${cleanLetter} SEARCH: ${cleanSearch}`;
  }

  if (hasLetter) {
    return `LIST INDEX_${cleanLetter}`;
  }

  if (hasSearch) {
    return `LIST SEARCH: ${cleanSearch}`;
  }

  return 'LIST INDEX_ALL';
}

export function getCyberpunkViewingPath(letter?: string, searchInput?: string): string {
  return getC64ViewingPath(letter, searchInput).replace(/^LIST /, 'LIST_ ');
}


