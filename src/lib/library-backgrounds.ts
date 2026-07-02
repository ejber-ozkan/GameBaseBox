import type { PlatformId } from '../types/platform';

export type LibraryViewMode = 'grid' | 'list';

const BACKGROUND_BASE_PATH = '/docs/images/backgrounds';

export const LIBRARY_BACKGROUND_OPACITY = 0.156;

const PLATFORM_BACKGROUND_POOLS: Partial<Record<PlatformId, readonly string[]>> = {
  c64: [
    `${BACKGROUND_BASE_PATH}/Commodore-64_1.jpg`,
    `${BACKGROUND_BASE_PATH}/Commodore-64_2.jpg`,
    `${BACKGROUND_BASE_PATH}/commodore-c64_3.jpg`,
  ],
  atari800: [
    `${BACKGROUND_BASE_PATH}/Atari_800XL_1.jpg`,
    `${BACKGROUND_BASE_PATH}/Atari_800XL_2.jpg`,
  ],
  atari2600: [
    `${BACKGROUND_BASE_PATH}/atari_2600.jpg`,
  ],
  zxspectrum: [
    `${BACKGROUND_BASE_PATH}/Sinclair_ZX_Spectrum_1.jpg`,
    `${BACKGROUND_BASE_PATH}/sinclair-zx-spectrum_2.jpg`,
  ],
  bbcmicro: [
    `${BACKGROUND_BASE_PATH}/Acorn_BBC_Micro_1.jpg`,
    `${BACKGROUND_BASE_PATH}/Acorn_BBC_Micro_2.jpeg`,
  ],
  amiga: [
    `${BACKGROUND_BASE_PATH}/Commodore_Amiga_1.jpg`,
    `${BACKGROUND_BASE_PATH}/Commodore_amiga_2.jpg`,
    `${BACKGROUND_BASE_PATH}/Commodore_Amiga_3.jpg`,
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
