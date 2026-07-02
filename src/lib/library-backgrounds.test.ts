import { describe, expect, test } from 'vitest';
import {
  getLibraryBackgroundForPlatform,
  getLibraryBackgroundPool,
  getLibraryBackgroundPoolForPlatform,
  resolveLibraryBackground,
} from './library-backgrounds';

describe('library-backgrounds', () => {
  test('maps platforms to matching primary background images when available', () => {
    expect(getLibraryBackgroundForPlatform('c64')).toBe('/docs/images/backgrounds/Commodore-64_1.jpg');
    expect(getLibraryBackgroundForPlatform('atari800')).toBe('/docs/images/backgrounds/Atari_800XL_1.jpg');
    expect(getLibraryBackgroundForPlatform('atari2600')).toBe('/docs/images/backgrounds/atari_2600.jpg');
    expect(getLibraryBackgroundForPlatform('zxspectrum')).toBe('/docs/images/backgrounds/Sinclair_ZX_Spectrum_1.jpg');
    expect(getLibraryBackgroundForPlatform('bbcmicro')).toBe('/docs/images/backgrounds/Acorn_BBC_Micro_1.jpg');
    expect(getLibraryBackgroundForPlatform('amiga')).toBe('/docs/images/backgrounds/Commodore_Amiga_1.jpg');
  });

  test('exposes the shared rotation pool from all available platform backgrounds', () => {
    expect(getLibraryBackgroundPool()).toEqual([
      '/docs/images/backgrounds/Commodore-64_1.jpg',
      '/docs/images/backgrounds/Commodore-64_2.jpg',
      '/docs/images/backgrounds/commodore-c64_3.jpg',
      '/docs/images/backgrounds/Atari_800XL_1.jpg',
      '/docs/images/backgrounds/Atari_800XL_2.jpg',
      '/docs/images/backgrounds/atari_2600.jpg',
      '/docs/images/backgrounds/Sinclair_ZX_Spectrum_1.jpg',
      '/docs/images/backgrounds/sinclair-zx-spectrum_2.jpg',
      '/docs/images/backgrounds/Acorn_BBC_Micro_1.jpg',
      '/docs/images/backgrounds/Acorn_BBC_Micro_2.jpeg',
      '/docs/images/backgrounds/Commodore_Amiga_1.jpg',
      '/docs/images/backgrounds/Commodore_amiga_2.jpg',
      '/docs/images/backgrounds/Commodore_Amiga_3.jpg',
    ]);
  });

  test('rotates backgrounds deterministically within the selected platform pool', () => {
    expect(getLibraryBackgroundPoolForPlatform('bbcmicro')).toEqual([
      '/docs/images/backgrounds/Acorn_BBC_Micro_1.jpg',
      '/docs/images/backgrounds/Acorn_BBC_Micro_2.jpeg',
    ]);

    expect(resolveLibraryBackground('bbcmicro', 'grid', 0)).toBe('/docs/images/backgrounds/Acorn_BBC_Micro_1.jpg');
    expect(resolveLibraryBackground('bbcmicro', 'list', 0)).toBe('/docs/images/backgrounds/Acorn_BBC_Micro_2.jpeg');
    expect(resolveLibraryBackground('bbcmicro', 'grid', 1)).toBe('/docs/images/backgrounds/Acorn_BBC_Micro_2.jpeg');
    expect(resolveLibraryBackground('bbcmicro', 'list', 1)).toBe('/docs/images/backgrounds/Acorn_BBC_Micro_1.jpg');
  });
});
