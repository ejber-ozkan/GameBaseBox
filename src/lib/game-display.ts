import { Game } from '../types/game';

const UNKNOWN_VALUES = new Set([
  '',
  '(Unknown)',
  '(Not Published)',
  '(None)',
  'Unknown',
]);

export function cleanMetadataValue(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return UNKNOWN_VALUES.has(trimmed) ? null : trimmed;
}

export function getGameStudios(game: Pick<Game, 'publisher' | 'developer'>): string[] {
  return [
    cleanMetadataValue(game.publisher?.name),
    cleanMetadataValue(game.developer?.name),
  ].filter((value): value is string => Boolean(value));
}

export function getPrimaryStudioLabel(game: Pick<Game, 'publisher' | 'developer'>): string {
  return getGameStudios(game)[0] ?? 'Unknown';
}

