import {
  getManifestPlatformProfile,
  MANIFEST_PLATFORM_PROFILES,
} from './platform-manifest';
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
  getManifestPlatformProfile('atari800').referenceMdbPath ?? '';
export const ZXSPECTRUM_REFERENCE_MDB_PATH =
  getManifestPlatformProfile('zxspectrum').referenceMdbPath ?? '';

export const PLATFORM_EMULATOR_PROFILES: Record<string, PlatformEmulatorProfile> = Object.fromEntries(
  MANIFEST_PLATFORM_PROFILES.flatMap((platform) => platform.emulatorProfiles.map((profile) => [
    profile.id,
    { ...profile, platformId: platform.id },
  ])),
);

export const PLATFORM_PROFILES: Record<PlatformId, PlatformProfile> = Object.fromEntries(
  MANIFEST_PLATFORM_PROFILES.map((platform) => [
    platform.id,
    {
      id: platform.id,
      displayName: platform.displayName,
      status: platform.status,
      importStatus: platform.defaultImported ? 'imported' : 'notImported',
      defaultEmulatorProfileId: platform.emulatorProfiles.find((profile) => profile.default)?.id
        ?? platform.emulatorProfiles[0].id,
      supportedEmulatorProfileIds: platform.emulatorProfiles.map((profile) => profile.id),
      folderTypes: platform.folderTypes,
      mediaCapabilities: platform.mediaCapabilities,
      inAppEmulation: platform.inAppEmulation,
      launchExtensions: platform.launchExtensions,
    },
  ]),
) as Record<PlatformId, PlatformProfile>;

export const SUPPORTED_PLATFORMS = Object.values(PLATFORM_PROFILES);
export const EMBEDDED_EMULATION_PLATFORM_IDS: readonly PlatformId[] = SUPPORTED_PLATFORMS
  .filter((platform) => platform.inAppEmulation)
  .map((platform) => platform.id);

export function getPlatformProfile(platformId: PlatformId): PlatformProfile {
  return PLATFORM_PROFILES[platformId];
}

export function supportsEmbeddedEmulation(platformId: PlatformId): boolean {
  return EMBEDDED_EMULATION_PLATFORM_IDS.includes(platformId);
}

export function isPlatformId(value: string): value is PlatformId {
  return value in PLATFORM_PROFILES;
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
  return Object.fromEntries(
    SUPPORTED_PLATFORMS.map((platform) => [platform.id, createDefaultPlatformSettings(platform.id)]),
  ) as Record<PlatformId, PlatformSettings>;
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
