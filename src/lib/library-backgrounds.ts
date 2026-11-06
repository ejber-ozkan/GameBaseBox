import type { PlatformId } from '../types/platform';

export type LibraryViewMode = 'grid' | 'list';

const BACKGROUND_BASE_PATH = '/docs/images/backgrounds';

// Original layer 0.13, raised over time for visibility (0.156, then +10 points).
export const LIBRARY_BACKGROUND_OPACITY = 0.26;

/**
 * Windowed views shade the background towards the theme colour so text stays readable.
 * Percentages of theme background at the top and bottom of the window; the bottom used
 * to reach 100%, which hid the image across the lower half of every grid.
 */
export const LIBRARY_BACKGROUND_SHADE = { top: 35, bottom: 70 } as const;

const PLATFORM_BACKGROUND_POOLS: Partial<Record<PlatformId, readonly string[]>> = {
  c64: [
    `${BACKGROUND_BASE_PATH}/Commodore-64_1.webp`,
    `${BACKGROUND_BASE_PATH}/Commodore-64_2.webp`,
    `${BACKGROUND_BASE_PATH}/commodore-c64_3.webp`,
  ],
  atari800: [
    `${BACKGROUND_BASE_PATH}/Atari_800XL_1.webp`,
    `${BACKGROUND_BASE_PATH}/Atari_800XL_2.webp`,
  ],
  atari2600: [
    `${BACKGROUND_BASE_PATH}/atari_2600.webp`,
  ],
  zxspectrum: [
    `${BACKGROUND_BASE_PATH}/Sinclair_ZX_Spectrum_1.webp`,
    `${BACKGROUND_BASE_PATH}/sinclair-zx-spectrum_2.webp`,
  ],
  bbcmicro: [
    `${BACKGROUND_BASE_PATH}/Acorn_BBC_Micro_1.webp`,
    `${BACKGROUND_BASE_PATH}/Acorn_BBC_Micro_2.webp`,
  ],
  amiga: [
    `${BACKGROUND_BASE_PATH}/Commodore_Amiga_1.webp`,
    `${BACKGROUND_BASE_PATH}/Commodore_amiga_2.webp`,
    `${BACKGROUND_BASE_PATH}/Commodore_Amiga_3.webp`,
  ],
  atarist: [
    `${BACKGROUND_BASE_PATH}/Atari_520_ST_1.webp`,
  ],
  vic20: [
    `${BACKGROUND_BASE_PATH}/Commodore-VIC-20_1.webp`,
    `${BACKGROUND_BASE_PATH}/Commodore-VIC-20-FL.webp`,
  ],
  amstradcpc: [
    `${BACKGROUND_BASE_PATH}/Amstrad_CPC464.webp`,
  ],
  apple2gs: [
    `${BACKGROUND_BASE_PATH}/Apple_II-IMG_7064.webp`,
  ],
  pet: [
    `${BACKGROUND_BASE_PATH}/Commodore_PET_2001_Series-IMG_0448b.webp`,
  ],
  atari5200: [
    `${BACKGROUND_BASE_PATH}/Atari-5200-4-Port-wController-L.webp`,
  ],
  atari7800: [
    `${BACKGROUND_BASE_PATH}/Atari-7800-wControl-Pad-L.webp`,
  ],
  c128: [
    `${BACKGROUND_BASE_PATH}/Commodore-128.webp`,
  ],
};



const BACKGROUND_POOL = Object.values(PLATFORM_BACKGROUND_POOLS).flat();

export function getLibraryBackgroundForPlatform(platformId: PlatformId): string | null {
  return PLATFORM_BACKGROUND_POOLS[platformId]?.[0] ?? null;
}

export function getLibraryBackgroundPoolForPlatform(platformId: PlatformId): string[] {
  return [...(PLATFORM_BACKGROUND_POOLS[platformId] ?? BACKGROUND_POOL)];
}

export function getLibraryBackgroundPool(): string[] {
  return [...BACKGROUND_POOL];
}

export function resolveLibraryBackground(
  platformId: PlatformId,
  viewMode: LibraryViewMode,
  seed = 0,
): string {
  const pool = getLibraryBackgroundPoolForPlatform(platformId);
  const viewOffset = viewMode === 'list' ? 1 : 0;
  return pool[(seed + viewOffset) % pool.length];
}
