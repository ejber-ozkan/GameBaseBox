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
export const ZXSPECTRUM_REFERENCE_MDB_PATH =
  'E:\\Backups\\RETRO-BACKUPS\\ZXSpectrum\\Sinclair ZX Spectrum v6\\Sinclair ZX Spectrum v6.mdb';

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
  'retroarch-zxspectrum': {
    id: 'retroarch-zxspectrum',
    platformId: 'zxspectrum',
    displayName: 'RetroArch ZX Spectrum',
    emulatorType: 'retroarch',
    required: false,
    default: true,
  },
  'spectaculator-zxspectrum': {
    id: 'spectaculator-zxspectrum',
    platformId: 'zxspectrum',
    displayName: 'Spectaculator',
    emulatorType: 'spectaculator',
    required: false,
  },
  'retroarch-bbcmicro': {
    id: 'retroarch-bbcmicro',
    platformId: 'bbcmicro',
    displayName: 'RetroArch BBC Micro',
    emulatorType: 'retroarch',
    required: false,
    default: true,
  },
  'beebem-bbcmicro': {
    id: 'beebem-bbcmicro',
    platformId: 'bbcmicro',
    displayName: 'BeebEm',
    emulatorType: 'beebem',
    required: false,
  },
  'retroarch-amiga': {
    id: 'retroarch-amiga',
    platformId: 'amiga',
    displayName: 'RetroArch Amiga',
    emulatorType: 'retroarch',
    required: false,
    default: true,
  },
  'winuae-amiga': {
    id: 'winuae-amiga',
    platformId: 'amiga',
    displayName: 'WinUAE / UAE',
    emulatorType: 'uae',
    required: false,
  },
  'retroarch-atarist': {
    id: 'retroarch-atarist',
    platformId: 'atarist',
    displayName: 'RetroArch Atari ST',
    emulatorType: 'retroarch',
    required: false,
    default: true,
  },
  'steem-atarist': {
    id: 'steem-atarist',
    platformId: 'atarist',
    displayName: 'STeem',
    emulatorType: 'steem',
    required: false,
  },
  'hatari-atarist': {
    id: 'hatari-atarist',
    platformId: 'atarist',
    displayName: 'Hatari',
    emulatorType: 'hatari',
    required: false,
  },
  'retroarch-vic20': {
    id: 'retroarch-vic20',
    platformId: 'vic20',
    displayName: 'RetroArch VIC-20',
    emulatorType: 'retroarch',
    required: false,
    default: true,
  },
  'vice-vic20': {
    id: 'vice-vic20',
    platformId: 'vic20',
    displayName: 'VICE VIC-20',
    emulatorType: 'vice',
    required: false,
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
  zxspectrum: {
    id: 'zxspectrum',
    displayName: 'ZX Spectrum',
    status: 'available',
    importStatus: 'notImported',
    defaultEmulatorProfileId: 'retroarch-zxspectrum',
    supportedEmulatorProfileIds: ['retroarch-zxspectrum', 'spectaculator-zxspectrum'],
    folderTypes: ['extras', 'games', 'screenshots', 'photos', 'music'],
    mediaCapabilities: {
      screenshots: true,
      photos: true,
      music: 'ay',
      extras: true,
      videos: false,
    },
    inAppEmulation: false,
    launchExtensions: ['.tzx', '.tap', '.z80', '.sna', '.szx', '.trd', '.dsk', '.zip', '.7z'],
  },
  bbcmicro: {
    id: 'bbcmicro',
    displayName: 'Acorn BBC Micro',
    status: 'available',
    importStatus: 'notImported',
    defaultEmulatorProfileId: 'retroarch-bbcmicro',
    supportedEmulatorProfileIds: ['retroarch-bbcmicro', 'beebem-bbcmicro'],
    folderTypes: ['extras', 'games', 'screenshots', 'music'],
    mediaCapabilities: {
      screenshots: true,
      photos: false,
      music: 'generic',
      extras: true,
      videos: false,
    },
    inAppEmulation: false,
    launchExtensions: ['.ssd', '.dsd', '.adl', '.adf', '.uef', '.rom', '.bin', '.m3u', '.zip', '.7z'],
  },
  amiga: {
    id: 'amiga',
    displayName: 'Commodore Amiga',
    status: 'available',
    importStatus: 'notImported',
    defaultEmulatorProfileId: 'retroarch-amiga',
    supportedEmulatorProfileIds: ['retroarch-amiga', 'winuae-amiga'],
    folderTypes: ['extras', 'games', 'screenshots', 'music'],
    mediaCapabilities: {
      screenshots: true,
      photos: false,
      music: 'generic',
      extras: true,
      videos: false,
    },
    inAppEmulation: false,
    launchExtensions: ['.adf', '.adz', '.dms', '.ipf', '.lha', '.hdf', '.hdz', '.m3u', '.zip', '.7z'],
  },
  atarist: {
    id: 'atarist',
    displayName: 'Atari ST',
    status: 'available',
    importStatus: 'notImported',
    defaultEmulatorProfileId: 'retroarch-atarist',
    supportedEmulatorProfileIds: ['retroarch-atarist', 'steem-atarist', 'hatari-atarist'],
    folderTypes: ['extras', 'games', 'screenshots', 'music'],
    mediaCapabilities: {
      screenshots: true,
      photos: false,
      music: 'generic',
      extras: true,
      videos: false,
    },
    inAppEmulation: false,
    launchExtensions: ['.st', '.msa', '.stx', '.dim', '.ipf', '.m3u', '.zip', '.7z'],
  },
  vic20: {
    id: 'vic20',
    displayName: 'Commodore VIC-20',
    status: 'available',
    importStatus: 'notImported',
    defaultEmulatorProfileId: 'retroarch-vic20',
    supportedEmulatorProfileIds: ['retroarch-vic20', 'vice-vic20'],
    folderTypes: ['extras', 'games', 'screenshots', 'music'],
    mediaCapabilities: {
      screenshots: true,
      photos: false,
      music: 'generic',
      extras: true,
      videos: false,
    },
    inAppEmulation: false,
    launchExtensions: ['.d64', '.t64', '.tap', '.prg', '.crt', '.a0', '.20', '.40', '.60', '.zip', '.7z'],
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
  return (
    value === 'c64'
    || value === 'atari800'
    || value === 'atari2600'
    || value === 'zxspectrum'
    || value === 'bbcmicro'
    || value === 'amiga'
    || value === 'atarist'
    || value === 'vic20'
  );
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
    zxspectrum: createDefaultPlatformSettings('zxspectrum'),
    bbcmicro: createDefaultPlatformSettings('bbcmicro'),
    amiga: createDefaultPlatformSettings('amiga'),
    atarist: createDefaultPlatformSettings('atarist'),
    vic20: createDefaultPlatformSettings('vic20'),
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
