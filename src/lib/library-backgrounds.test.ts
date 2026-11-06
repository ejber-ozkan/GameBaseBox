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
    expect(getLibraryBackgroundForPlatform('c64')).toBe('/docs/images/backgrounds/Commodore-64_1.webp');
    expect(getLibraryBackgroundForPlatform('atari800')).toBe('/docs/images/backgrounds/Atari_800XL_1.webp');
    expect(getLibraryBackgroundForPlatform('atari2600')).toBe('/docs/images/backgrounds/atari_2600.webp');
    expect(getLibraryBackgroundForPlatform('zxspectrum')).toBe('/docs/images/backgrounds/Sinclair_ZX_Spectrum_1.webp');
    expect(getLibraryBackgroundForPlatform('bbcmicro')).toBe('/docs/images/backgrounds/Acorn_BBC_Micro_1.webp');
    expect(getLibraryBackgroundForPlatform('amiga')).toBe('/docs/images/backgrounds/Commodore_Amiga_1.webp');
    expect(getLibraryBackgroundForPlatform('atarist')).toBe('/docs/images/backgrounds/Atari_520_ST_1.webp');
    expect(getLibraryBackgroundForPlatform('vic20')).toBe('/docs/images/backgrounds/Commodore-VIC-20_1.webp');
    expect(getLibraryBackgroundForPlatform('amstradcpc')).toBe('/docs/images/backgrounds/Amstrad_CPC464.webp');
    expect(getLibraryBackgroundForPlatform('apple2gs')).toBe('/docs/images/backgrounds/Apple_II-IMG_7064.webp');
    expect(getLibraryBackgroundForPlatform('pet')).toBe('/docs/images/backgrounds/Commodore_PET_2001_Series-IMG_0448b.webp');
    expect(getLibraryBackgroundForPlatform('atari5200')).toBe('/docs/images/backgrounds/Atari-5200-4-Port-wController-L.webp');
    expect(getLibraryBackgroundForPlatform('atari7800')).toBe('/docs/images/backgrounds/Atari-7800-wControl-Pad-L.webp');
    expect(getLibraryBackgroundForPlatform('c128')).toBe('/docs/images/backgrounds/Commodore-128.webp');
  });

  test('exposes the shared rotation pool from all available platform backgrounds', () => {
    expect(getLibraryBackgroundPool()).toEqual([
      '/docs/images/backgrounds/Commodore-64_1.webp',
      '/docs/images/backgrounds/Commodore-64_2.webp',
      '/docs/images/backgrounds/commodore-c64_3.webp',
      '/docs/images/backgrounds/Atari_800XL_1.webp',
      '/docs/images/backgrounds/Atari_800XL_2.webp',
      '/docs/images/backgrounds/atari_2600.webp',
      '/docs/images/backgrounds/Sinclair_ZX_Spectrum_1.webp',
      '/docs/images/backgrounds/sinclair-zx-spectrum_2.webp',
      '/docs/images/backgrounds/Acorn_BBC_Micro_1.webp',
      '/docs/images/backgrounds/Acorn_BBC_Micro_2.webp',
      '/docs/images/backgrounds/Commodore_Amiga_1.webp',
      '/docs/images/backgrounds/Commodore_amiga_2.webp',
      '/docs/images/backgrounds/Commodore_Amiga_3.webp',
      '/docs/images/backgrounds/Atari_520_ST_1.webp',
      '/docs/images/backgrounds/Commodore-VIC-20_1.webp',
      '/docs/images/backgrounds/Commodore-VIC-20-FL.webp',
      '/docs/images/backgrounds/Amstrad_CPC464.webp',
      '/docs/images/backgrounds/Apple_II-IMG_7064.webp',
      '/docs/images/backgrounds/Commodore_PET_2001_Series-IMG_0448b.webp',
      '/docs/images/backgrounds/Atari-5200-4-Port-wController-L.webp',
      '/docs/images/backgrounds/Atari-7800-wControl-Pad-L.webp',
      '/docs/images/backgrounds/Commodore-128.webp',
    ]);
  });


  test('rotates backgrounds deterministically within the selected platform pool', () => {
    expect(getLibraryBackgroundPoolForPlatform('bbcmicro')).toEqual([
      '/docs/images/backgrounds/Acorn_BBC_Micro_1.webp',
      '/docs/images/backgrounds/Acorn_BBC_Micro_2.webp',
    ]);

    expect(resolveLibraryBackground('bbcmicro', 'grid', 0)).toBe('/docs/images/backgrounds/Acorn_BBC_Micro_1.webp');
    expect(resolveLibraryBackground('bbcmicro', 'list', 0)).toBe('/docs/images/backgrounds/Acorn_BBC_Micro_2.webp');
    expect(resolveLibraryBackground('bbcmicro', 'grid', 1)).toBe('/docs/images/backgrounds/Acorn_BBC_Micro_2.webp');
    expect(resolveLibraryBackground('bbcmicro', 'list', 1)).toBe('/docs/images/backgrounds/Acorn_BBC_Micro_1.webp');
  });

  test('sets the windowed library background visibility about twenty percent higher than the original layer', () => {
    expect(LIBRARY_BACKGROUND_OPACITY).toBeCloseTo(0.13 * 1.2, 3);
  });
});
