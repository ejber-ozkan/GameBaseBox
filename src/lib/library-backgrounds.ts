import type { PlatformId } from '../types/platform';

export type LibraryViewMode = 'grid' | 'list';

const BACKGROUND_BASE_PATH = '/docs/images/backgrounds';

const PLATFORM_BACKGROUNDS: Partial<Record<PlatformId, string>> = {
  c64: `${BACKGROUND_BASE_PATH}/c64.jpg`,
  atari800: `${BACKGROUND_BASE_PATH}/atari800.jpg`,
  atari2600: `${BACKGROUND_BASE_PATH}/atari2600.jpg`,
  amiga: `${BACKGROUND_BASE_PATH}/amiga-600.jpg`,
};

const BACKGROUND_POOL = [
  `${BACKGROUND_BASE_PATH}/c64.jpg`,
  `${BACKGROUND_BASE_PATH}/atari800.jpg`,
  `${BACKGROUND_BASE_PATH}/atari2600.jpg`,
  `${BACKGROUND_BASE_PATH}/amiga-600.jpg`,
] as const;

export function getLibraryBackgroundForPlatform(platformId: PlatformId): string | null {
  return PLATFORM_BACKGROUNDS[platformId] ?? null;
}

export function getLibraryBackgroundPool(): string[] {
  return [...BACKGROUND_POOL];
}

export function resolveLibraryBackground(
  platformId: PlatformId,
  viewMode: LibraryViewMode,
  seed = 0,
): string {
  const platformBackground = getLibraryBackgroundForPlatform(platformId);
  if (platformBackground) {
    return platformBackground;
  }

  const viewOffset = viewMode === 'list' ? 1 : 0;
  return BACKGROUND_POOL[(seed + viewOffset) % BACKGROUND_POOL.length];
}
