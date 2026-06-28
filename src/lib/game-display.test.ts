import { describe, expect, test } from 'vitest';
import { cleanMetadataValue, getGameStudios, getPrimaryStudioLabel } from './game-display';

describe('game-display helpers', () => {
  test('removes placeholder metadata values', () => {
    expect(cleanMetadataValue('(Unknown)')).toBeNull();
    expect(cleanMetadataValue('(Not Published)')).toBeNull();
    expect(cleanMetadataValue('  ')).toBeNull();
    expect(cleanMetadataValue('Thalamus')).toBe('Thalamus');
  });

  test('prefers publisher before developer when building studios', () => {
    const game = {
      publisher: { id: 1, name: 'Thalamus' },
      developer: { id: 2, name: 'Cyberdyne Systems' },
    };

    expect(getGameStudios(game as never)).toEqual(['Thalamus', 'Cyberdyne Systems']);
    expect(getPrimaryStudioLabel(game as never)).toBe('Thalamus');
  });

  test('falls back to developer and then Unknown', () => {
    expect(
      getPrimaryStudioLabel({
        publisher: { id: 1, name: '(Not Published)' },
        developer: { id: 2, name: 'Mirrorsoft' },
      } as never)
    ).toBe('Mirrorsoft');

    expect(
      getPrimaryStudioLabel({
        publisher: null,
        developer: { id: 2, name: '(Unknown)' },
      } as never)
    ).toBe('Unknown');
  });
});

