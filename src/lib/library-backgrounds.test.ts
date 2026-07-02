import { describe, expect, test } from 'vitest';
import {
  getLibraryBackgroundForPlatform,
  getLibraryBackgroundPool,
  resolveLibraryBackground,
} from './library-backgrounds';

describe('library-backgrounds', () => {
  test('maps platforms to matching background images when available', () => {
    expect(getLibraryBackgroundForPlatform('c64')).toBe('/docs/images/backgrounds/c64.jpg');
    expect(getLibraryBackgroundForPlatform('atari800')).toBe('/docs/images/backgrounds/atari800.jpg');
    expect(getLibraryBackgroundForPlatform('atari2600')).toBe('/docs/images/backgrounds/atari2600.jpg');
    expect(getLibraryBackgroundForPlatform('amiga')).toBe('/docs/images/backgrounds/amiga-600.jpg');
  });

  test('falls back to the shared rotation pool when a platform has no dedicated image', () => {
    expect(getLibraryBackgroundForPlatform('bbcmicro')).toBeNull();
    expect(getLibraryBackgroundPool()).toEqual([
      '/docs/images/backgrounds/c64.jpg',
      '/docs/images/backgrounds/atari800.jpg',
      '/docs/images/backgrounds/atari2600.jpg',
      '/docs/images/backgrounds/amiga-600.jpg',
    ]);
  });

  test('rotates backgrounds deterministically by platform, view mode, and seed', () => {
    const gridBackground = resolveLibraryBackground('bbcmicro', 'grid', 0);
    const listBackground = resolveLibraryBackground('bbcmicro', 'list', 0);
    const nextGridBackground = resolveLibraryBackground('bbcmicro', 'grid', 1);

    expect(gridBackground).toBe('/docs/images/backgrounds/c64.jpg');
    expect(listBackground).toBe('/docs/images/backgrounds/atari800.jpg');
    expect(nextGridBackground).toBe('/docs/images/backgrounds/atari800.jpg');
  });
});
