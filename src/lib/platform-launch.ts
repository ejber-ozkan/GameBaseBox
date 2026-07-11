import type { Settings } from '../contexts/SettingsContext';
import type { LaunchRequest } from './tauri-bridge';
import { PLATFORM_EMULATOR_PROFILES } from './platform-capabilities';

export type LaunchSource = 'extras' | 'roms';

export interface PlatformLaunchSettings {
  platformId: Settings['activePlatformId'];
  emulatorProfileId: string;
  emulatorPath: string;
  corePath?: string;
  isRetroarch: boolean;
  providerLabel: string;
}

function normalizePathSegment(segment: string | null | undefined): string {
  if (!segment) return '';
  return segment.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
}

export function buildPlatformAssetPath(
  settings: Settings,
  source: LaunchSource,
  relativePath: string,
): string {
  const platformSettings = settings.platformSettings[settings.activePlatformId];
  const platformBasePath =
    source === 'extras'
      ? platformSettings?.folders.extrasPath
      : platformSettings?.folders.gamesPath;

  return [platformBasePath, relativePath]
    .map(normalizePathSegment)
    .filter(Boolean)
    .join('/');
}

export function getPlatformLaunchSettings(settings: Settings): PlatformLaunchSettings {
  const platformId = settings.activePlatformId;
  const platformSettings = settings.platformSettings[platformId];
  const emulatorProfileId =
    platformId === 'c64'
      ? settings.preferredEmulator === 'retroarch'
        ? 'retroarch-c64'
        : 'vice-c64'
      : platformSettings.emulator.preferredEmulatorProfileId;
  const emulatorProfile = PLATFORM_EMULATOR_PROFILES[emulatorProfileId];
  const isRetroarch = emulatorProfile?.emulatorType === 'retroarch';
  const emulatorPath =
    platformSettings.emulator.executablePaths[emulatorProfileId]
    || (emulatorProfileId === 'vice-c64' ? settings.emulatorPath : '')
    || (emulatorProfileId === 'retroarch-c64' ? settings.retroarchPath : '');
  const corePath = isRetroarch
    ? platformSettings.emulator.corePaths[emulatorProfileId]
      || (emulatorProfileId === 'retroarch-c64' ? settings.retroarchCorePath : '')
    : undefined;

  return {
    platformId,
    emulatorProfileId,
    emulatorPath,
    corePath,
    isRetroarch,
    providerLabel: emulatorProfile?.displayName ?? emulatorProfileId,
  };
}

export function buildLaunchRequest(
  settings: Settings,
  source: LaunchSource,
  relativePath: string,
  game: {
    id: number | string;
    trueDriveEmu?: boolean | null;
    isPal?: boolean | null;
  },
): LaunchRequest {
  const launchSettings = getPlatformLaunchSettings(settings);

  return {
    platform_id: launchSettings.platformId,
    emulator_profile_id: launchSettings.emulatorProfileId,
    emulator_path: launchSettings.emulatorPath,
    rom_path: buildPlatformAssetPath(settings, source, relativePath),
    true_drive_emulation: game.trueDriveEmu ?? false,
    is_pal: game.isPal ?? true,
    game_id: game.id.toString(),
    core_path: launchSettings.isRetroarch ? launchSettings.corePath : undefined,
  };
}
