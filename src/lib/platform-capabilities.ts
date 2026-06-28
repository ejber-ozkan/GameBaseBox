import type {
  PlatformEmulatorProfile,
  PlatformFolderSettings,
  PlatformId,
  PlatformLibraryStatus,
  PlatformNavigationState,
  PlatformProfile,
  PlatformSettings,
} from '../types/platform';

export const ATARI800_REFERENCE_MDB_PATH =
  'E:\\Backups\\RETRO-BACKUPS\\Atari8bit\\Atari 800\\Atari 800 v12.mdb';

export const PLATFORM_EMULATOR_PROFILES: Record<string, PlatformEmulatorProfile> = {
  'vice-c64': {
    id: 'vice-c64',
    platformId: 'c64',
    displayName: 'VICE',
    emulatorType: 'vice',
    required: false,
    default: true,
  },
  'retroarch-c64': {
    id: 'retroarch-c64',
    platformId: 'c64',
    displayName: 'RetroArch C64',
    emulatorType: 'retroarch',
    required: false,
  },
  'retroarch-atari800': {
    id: 'retroarch-atari800',
    platformId: 'atari800',
    displayName: 'RetroArch Atari800',
    emulatorType: 'retroarch',
    required: true,
    default: true,
  },
  'altirra-atari800': {
    id: 'altirra-atari800',
    platformId: 'atari800',
    displayName: 'Altirra',
    emulatorType: 'altirra',
    required: true,
  },
  'retroarch-atari2600': {
    id: 'retroarch-atari2600',
    platformId: 'atari2600',
    displayName: 'RetroArch Atari 2600',
    emulatorType: 'retroarch',
    required: false,
    default: true,
  },
};

export const PLATFORM_PROFILES: Record<PlatformId, PlatformProfile> = {
  c64: {
    id: 'c64',
    displayName: 'Commodore 64',
    status: 'available',
    importStatus: 'imported',
    defaultEmulatorProfileId: 'vice-c64',
    supportedEmulatorProfileIds: ['vice-c64', 'retroarch-c64'],
    folderTypes: ['games', 'music', 'photos', 'screenshots', 'extras', 'boxArt', 'videos'],
    mediaCapabilities: {
      screenshots: true,
      photos: true,
      music: 'sid',
      extras: true,
      videos: true,
    },
    inAppEmulation: true,
    launchExtensions: ['.d64', '.t64', '.tap', '.prg', '.crt', '.g64', '.zip', '.7z', '.m3u', '.vfl'],
  },
  atari800: {
    id: 'atari800',
    displayName: 'Atari 800',
    status: 'available',
    importStatus: 'notImported',
    defaultEmulatorProfileId: 'retroarch-atari800',
    supportedEmulatorProfileIds: ['retroarch-atari800', 'altirra-atari800'],
    folderTypes: ['games', 'music', 'photos', 'screenshots', 'extras'],
    mediaCapabilities: {
      screenshots: true,
      photos: true,
      music: 'sap',
      extras: true,
      videos: false,
    },
    inAppEmulation: false,
    launchExtensions: ['.atr', '.xfd', '.atx', '.cas', '.car', '.rom', '.bin', '.xex', '.com', '.m3u', '.zip', '.7z'],
  },
  atari2600: {
    id: 'atari2600',
    displayName: 'Atari 2600',
    status: 'available',
    importStatus: 'notImported',
    defaultEmulatorProfileId: 'retroarch-atari2600',
    supportedEmulatorProfileIds: ['retroarch-atari2600'],
    folderTypes: ['games', 'screenshots', 'extras'],
    mediaCapabilities: {
      screenshots: true,
      photos: false,
      music: 'none',
      extras: true,
      videos: false,
    },
    inAppEmulation: false,
    launchExtensions: ['.a26', '.bin', '.rom', '.zip', '.7z'],
  },
};

export const SUPPORTED_PLATFORMS = Object.values(PLATFORM_PROFILES);
export const EMBEDDED_EMULATION_PLATFORM_IDS: readonly PlatformId[] = ['c64'];

export function getPlatformProfile(platformId: PlatformId): PlatformProfile {
  return PLATFORM_PROFILES[platformId];
}

export function supportsEmbeddedEmulation(platformId: PlatformId): boolean {
  return EMBEDDED_EMULATION_PLATFORM_IDS.includes(platformId);
}

export function isPlatformId(value: string): value is PlatformId {
  return value === 'c64' || value === 'atari800' || value === 'atari2600';
}

export function createDefaultPlatformLibraryStatus(platformId: PlatformId): PlatformLibraryStatus {
  const profile = getPlatformProfile(platformId);
  return {
    platformId,
    importStatus: profile.importStatus,
    sourceMdbPath: null,
    sqliteScope: platformId,
    lastImportedAt: null,
    lastImportError: null,
    gameCount: 0,
    active: platformId === 'c64',
  };
}

export function createDefaultPlatformFolders(platformId: PlatformId): PlatformFolderSettings {
  return {
    platformId,
    gamesPath: '',
    musicPath: '',
    photosPath: '',
    screenshotsPath: '',
    extrasPath: '',
    boxArtPath: '',
    videosPath: '',
  };
}

export function createDefaultPlatformNavigation(): PlatformNavigationState {
  return {
    lastSelectedGameId: null,
    lastFocusedIndex: 0,
    lastViewMode: 'grid',
    recentlyPlayedIds: [],
    lastBigBoxRailId: null,
    lastBigBoxGameId: null,
  };
}

export function createDefaultPlatformSettings(platformId: PlatformId): PlatformSettings {
  const profile = getPlatformProfile(platformId);
  return {
    library: createDefaultPlatformLibraryStatus(platformId),
    folders: createDefaultPlatformFolders(platformId),
    emulator: {
      platformId,
      preferredEmulatorProfileId: profile.defaultEmulatorProfileId,
      executablePaths: {},
      corePaths: {},
    },
    navigation: createDefaultPlatformNavigation(),
  };
}

export function createDefaultPlatformSettingsMap(): Record<PlatformId, PlatformSettings> {
  return {
    c64: createDefaultPlatformSettings('c64'),
    atari800: createDefaultPlatformSettings('atari800'),
    atari2600: createDefaultPlatformSettings('atari2600'),
  };
}

export function hasMusicCapability(platformId: PlatformId): boolean {
  return PLATFORM_PROFILES[platformId]?.mediaCapabilities.music !== 'none';
}

export function hasPhotosCapability(platformId: PlatformId): boolean {
  return PLATFORM_PROFILES[platformId]?.mediaCapabilities.photos === true;
}

export function hasScreenshotsCapability(platformId: PlatformId): boolean {
  return PLATFORM_PROFILES[platformId]?.mediaCapabilities.screenshots === true;
}

export function hasExtrasCapability(platformId: PlatformId): boolean {
  return PLATFORM_PROFILES[platformId]?.mediaCapabilities.extras === true;
}

export function hasVideosCapability(platformId: PlatformId): boolean {
  return PLATFORM_PROFILES[platformId]?.mediaCapabilities.videos === true;
}
