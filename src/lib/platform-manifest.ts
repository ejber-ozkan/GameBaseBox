import manifest from '../../platform-manifest.json';
import type {
  PlatformEmulatorType,
  PlatformFolderType,
  PlatformId,
  PlatformMediaCapabilities,
  PlatformStatus,
} from '../types/platform';

export type RequiredPlatformFolderKey = 'gamesPath' | 'musicPath' | 'photosPath' | 'screenshotsPath' | 'extrasPath';
export type LaunchRuntime = 'desktop';
export type LaunchProvider = 'external' | 'embedded';

export interface ManifestEmulatorProfile {
  id: string;
  displayName: string;
  emulatorType: PlatformEmulatorType;
  required: boolean;
  default?: boolean;
}

export interface ManifestPlatformProfile {
  id: PlatformId;
  aliases: string[];
  displayName: string;
  status: PlatformStatus;
  defaultImported: boolean;
  sourceMdbName: string;
  referenceMdbPath?: string;
  requiredFolderTypes: PlatformFolderType[];
  folderTypes: PlatformFolderType[];
  mediaCapabilities: PlatformMediaCapabilities;
  inAppEmulation: boolean;
  launchExtensions: string[];
  emulatorProfiles: ManifestEmulatorProfile[];
}

interface PlatformManifest {
  version: number;
  platforms: ManifestPlatformProfile[];
}

const PLATFORM_MANIFEST = manifest as PlatformManifest;
const folderKeyByType: Record<RequiredPlatformFolderKey extends `${infer T}Path` ? T : never, RequiredPlatformFolderKey> = {
  games: 'gamesPath',
  music: 'musicPath',
  photos: 'photosPath',
  screenshots: 'screenshotsPath',
  extras: 'extrasPath',
};

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

const platformIdByAlias = new Map(
  PLATFORM_MANIFEST.platforms.flatMap((platform) => [
    [normalizeKey(platform.id), platform.id],
    [normalizeKey(platform.displayName), platform.id],
    ...platform.aliases.map((alias) => [normalizeKey(alias), platform.id] as const),
  ]),
);

export const MANIFEST_PLATFORM_PROFILES = PLATFORM_MANIFEST.platforms;

export function normalizePlatformManifestId(value: string): PlatformId | undefined {
  return platformIdByAlias.get(normalizeKey(value));
}

export function getManifestPlatformProfile(platformId: PlatformId): ManifestPlatformProfile {
  const profile = PLATFORM_MANIFEST.platforms.find((candidate) => candidate.id === platformId);
  if (!profile) {
    throw new Error(`Unsupported platform: ${platformId}`);
  }
  return profile;
}

export function getPlatformAliases(platformId: PlatformId): string[] {
  return getManifestPlatformProfile(platformId).aliases;
}

export function getRequiredPlatformFolderKeys(platformId: PlatformId): RequiredPlatformFolderKey[] {
  return getManifestPlatformProfile(platformId).requiredFolderTypes.map((folderType) => {
    const folderKey = folderKeyByType[folderType as keyof typeof folderKeyByType];
    if (!folderKey) {
      throw new Error(`Unsupported required folder type: ${folderType}`);
    }
    return folderKey;
  });
}

export function getPlatformLaunchCapabilities(platformId: PlatformId, runtime: LaunchRuntime): LaunchProvider[] {
  const platform = getManifestPlatformProfile(platformId);
  if (runtime !== 'desktop') {
    return [];
  }
  return platform.inAppEmulation ? ['external', 'embedded'] : ['external'];
}
