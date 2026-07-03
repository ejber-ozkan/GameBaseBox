export type PlatformId = 'c64' | 'atari800' | 'atari2600' | 'zxspectrum' | 'bbcmicro' | 'amiga' | 'atarist' | 'vic20';

export type PlatformStatus = 'available' | 'planned' | 'disabled';
export type PlatformImportStatus = 'notImported' | 'importing' | 'imported' | 'failed';
export type PlatformMusicCapability = 'sid' | 'sap' | 'ay' | 'generic' | 'none';
export type PlatformEmulatorType =
  | 'vice'
  | 'retroarch'
  | 'altirra'
  | 'spectaculator'
  | 'beebem'
  | 'uae'
  | 'steem'
  | 'hatari'
  | 'custom';
export type PlatformFolderType =
  | 'games'
  | 'music'
  | 'photos'
  | 'screenshots'
  | 'extras'
  | 'boxArt'
  | 'videos';

export interface PlatformMediaCapabilities {
  screenshots: boolean;
  photos: boolean;
  music: PlatformMusicCapability;
  extras: boolean;
  videos: boolean;
}

export interface PlatformEmulatorProfile {
  id: string;
  platformId: PlatformId;
  displayName: string;
  emulatorType: PlatformEmulatorType;
  required: boolean;
  default?: boolean;
}

export interface PlatformProfile {
  id: PlatformId;
  displayName: string;
  status: PlatformStatus;
  importStatus: PlatformImportStatus;
  defaultEmulatorProfileId: string;
  supportedEmulatorProfileIds: string[];
  folderTypes: PlatformFolderType[];
  mediaCapabilities: PlatformMediaCapabilities;
  inAppEmulation: boolean;
  launchExtensions: string[];
}

export interface PlatformLibraryStatus {
  platformId: PlatformId;
  importStatus: PlatformImportStatus;
  sourceMdbPath: string | null;
  sqliteScope: string;
  lastImportedAt: string | null;
  lastImportError: string | null;
  gameCount: number;
  active: boolean;
}

export interface PlatformFolderSettings {
  platformId: PlatformId;
  gamesPath: string;
  musicPath: string;
  photosPath: string;
  screenshotsPath: string;
  extrasPath: string;
  boxArtPath: string;
  videosPath: string;
}

export interface PlatformEmulatorSettings {
  platformId: PlatformId;
  preferredEmulatorProfileId: string;
  executablePaths: Record<string, string>;
  corePaths: Record<string, string>;
}

export interface PlatformNavigationState {
  lastSelectedGameId: string | null;
  lastFocusedIndex: number;
  lastViewMode: 'grid' | 'list';
  recentlyPlayedIds: string[];
  lastBigBoxRailId: string | null;
  lastBigBoxGameId: string | null;
}

export interface PlatformSettings {
  library: PlatformLibraryStatus;
  folders: PlatformFolderSettings;
  emulator: PlatformEmulatorSettings;
  navigation: PlatformNavigationState;
}

export interface ActivePlatformState {
  activePlatformId: PlatformId;
  lastUsedPlatformId: PlatformId | null;
  platformSelectionRequired: boolean;
  lastSelectedGameIdByPlatform: Partial<Record<PlatformId, string | null>>;
  lastFocusedIndexByPlatform: Partial<Record<PlatformId, number>>;
  lastViewModeByPlatform: Partial<Record<PlatformId, 'grid' | 'list'>>;
  lastBigBoxRailIdByPlatform: Partial<Record<PlatformId, string | null>>;
  lastBigBoxGameIdByPlatform: Partial<Record<PlatformId, string | null>>;
}
