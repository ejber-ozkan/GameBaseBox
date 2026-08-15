import { describe, expect, test } from 'vitest';
import {
  LIBRARY_BACKGROUND_OPACITY,
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
    expect(getLibraryBackgroundForPlatform('atarist')).toBe('/docs/images/backgrounds/Atari_520_ST_1.jpg');
    expect(getLibraryBackgroundForPlatform('vic20')).toBe('/docs/images/backgrounds/Commodore-VIC-20_1.jpg');
    expect(getLibraryBackgroundForPlatform('amstradcpc')).toBe('/docs/images/backgrounds/Amstrad_CPC464.jpg');
    expect(getLibraryBackgroundForPlatform('apple2gs')).toBe('/docs/images/backgrounds/Apple_II-IMG_7064.jpg');
    expect(getLibraryBackgroundForPlatform('pet')).toBe('/docs/images/backgrounds/Commodore_PET_2001_Series-IMG_0448b.jpg');
    expect(getLibraryBackgroundForPlatform('atari5200')).toBe('/docs/images/backgrounds/Atari-5200-4-Port-wController-L.jpg');
    expect(getLibraryBackgroundForPlatform('atari7800')).toBe('/docs/images/backgrounds/Atari-7800-wControl-Pad-L.jpg');
    expect(getLibraryBackgroundForPlatform('c128')).toBe('/docs/images/backgrounds/Commodore-128.jpg');
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
      '/docs/images/backgrounds/Atari_520_ST_1.jpg',
      '/docs/images/backgrounds/Commodore-VIC-20_1.jpg',
      '/docs/images/backgrounds/Commodore-VIC-20-FL.jpg',
      '/docs/images/backgrounds/Amstrad_CPC464.jpg',
      '/docs/images/backgrounds/Apple_II-IMG_7064.jpg',
      '/docs/images/backgrounds/Commodore_PET_2001_Series-IMG_0448b.jpg',
      '/docs/images/backgrounds/Atari-5200-4-Port-wController-L.jpg',
      '/docs/images/backgrounds/Atari-7800-wControl-Pad-L.jpg',
      '/docs/images/backgrounds/Commodore-128.jpg',
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

  test('sets the windowed library background visibility about twenty percent higher than the original layer', () => {
    expect(LIBRARY_BACKGROUND_OPACITY).toBeCloseTo(0.13 * 1.2, 3);
  });
});
