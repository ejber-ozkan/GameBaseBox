"use client";

/**
 * tauri-bridge.ts
 *
 * Provides a safe, isomorphic wrapper around Tauri IPC commands.
 *
 * All functions in this file:
 *  - Return sensible mock/fallback values when running in a browser (dev mode).
 *  - Delegate to the real Rust command when running inside the Tauri desktop runtime.
 *
 * To add a new Rust command:
 *  1. Write the #[tauri::command] fn in src-tauri/src/lib.rs
 *  2. Register it in the invoke_handler![] list in lib.rs::run()
 *  3. Add a matching TypeScript wrapper here
 */

// ---------------------------------------------------------------------------
// Runtime detection
// ---------------------------------------------------------------------------
type TauriAwareWindow = Window & {
  __TAURI_INTERNALS__?: unknown;
  __TAURI_IPC__?: unknown;
  __TAURI__?: unknown;
};

export const isTauri = (): boolean =>
  typeof window !== 'undefined' && (
    (window as TauriAwareWindow).__TAURI_INTERNALS__ !== undefined || 
    (window as TauriAwareWindow).__TAURI_IPC__ !== undefined || 
    (window as TauriAwareWindow).__TAURI__ !== undefined
  );

let cachedDebugMode: boolean | null = null;

export async function isDebugMode(): Promise<boolean> {
  if (!isTauri()) {
    return false;
  }
  if (cachedDebugMode !== null) {
    return cachedDebugMode;
  }
  try {
    cachedDebugMode = await invoke<boolean>('is_debug_mode_command');
    return cachedDebugMode;
  } catch {
    return false;
  }
}

export async function logDebugMessage(message: string): Promise<void> {
  if (!isTauri()) {
    console.log(message);
    return;
  }
  try {
    await invoke('log_debug_message_command', { message });
  } catch {
    console.log(message);
  }
}


async function invoke<T>(command: string, payload?: Record<string, unknown>): Promise<T> {
  if (!isTauri()) {
    throw new Error(`[tauri-bridge] Not running in Tauri. Command "${command}" is unavailable.`);
  }
  const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
  return tauriInvoke<T>(command, payload);
}

// ---------------------------------------------------------------------------
// Types that mirror the Rust structs in lib.rs
// ---------------------------------------------------------------------------
export interface ScannedRom {
  path: string;
  filename: string;
  extension: string;
  crc32: string;
  size_bytes: number;
}

export interface LaunchRequest {
  platform_id?: string;
  emulator_profile_id?: string;
  emulator_path: string;
  rom_path: string;
  true_drive_emulation: boolean;
  is_pal: boolean;
  game_id?: string;
  core_path?: string;
}

export interface LaunchResult {
  success: boolean;
  message: string;
}

export interface EmulatorProfileTestRequest {
  platformId: string;
  emulatorProfileId: string;
  executablePath: string;
  corePath?: string;
}

export interface ResolvedPath {
  exists: boolean;
  absolute_path: string;
}

export interface DatabaseBootstrapStatus {
  ready: boolean;
  dbPath: string;
  reason?: string | null;
}

export interface DatabaseImportResult {
  dbPath: string;
  exportedTables: number;
  importedTables: number;
}

export interface PlatformFolderImportSettings {
  gamesPath: string;
  musicPath: string;
  photosPath: string;
  screenshotsPath: string;
  extrasPath: string;
}

export interface PlatformImportRequest {
  platformId: string;
  jobId?: string;
  mdbPath: string;
  folderSettings: PlatformFolderImportSettings;
}

export interface PlatformImportStatusResponse {
  platformId: string;
  importStatus: string;
  sourceMdbPath?: string | null;
  gameCount: number;
  lastImportError?: string | null;
}

export interface PlatformDatabaseImportResult {
  platformId: string;
  dbPath: string;
  exportedTables: number;
  importedTables: number;
  gameCount: number;
}

export interface SupportedPlatformProfile {
  id: string;
  displayName: string;
  status: string;
  importStatus: string;
  defaultEmulatorProfileId: string;
  supportedEmulatorProfileIds: string[];
  capabilities: {
    screenshots: boolean;
    photos: boolean;
    music: string;
    extras: boolean;
    videos: boolean;
    inAppEmulation: boolean;
    launchExtensions: string[];
  };
  folderTypes: string[];
}

export interface ActivePlatformStateResponse {
  activePlatformId: string;
  lastUsedPlatformId: string | null;
  platformSelectionRequired: boolean;
}

export interface SetActivePlatformResponse {
  activePlatformId: string;
  requiresImport: boolean;
  message: string;
}

interface RawExtraRow {
  id: string;
  name: string;
  path: string;
  extraType: string;
}

interface RawGameRow {
  id: string;
  name: string;
  filename: string;
  gameFilename?: string | null;
  screenshotFilename?: string | null;
  boxFrontFilename?: string | null;
  coverPath?: string | null;
  titlescreenFilename?: string | null;
  videoSnapFilename?: string | null;
  sidFilename?: string | null;
  crc?: string | null;
  year?: string | null;
  isPal: boolean;
  isNtsc: boolean;
  trueDriveEmu: boolean;
  isClassic: boolean;
  parentGenre: string;
  subGenre: string;
  developerName?: string | null;
  publisherName?: string | null;
}

type RawGameDetailRow = RawGameRow & {
  musicianName?: string | null;
  musicianPhoto?: string | null;
  musicianNick?: string | null;
  musicianGroup?: string | null;
  coderName?: string | null;
  graphicsName?: string | null;
  versionBy?: string | null;
  control?: string | null;
  playersFrom?: string | null;
  playersTo?: string | null;
  playersSim?: string | null;
  comment?: string | null;
  reviewRating?: string | null;
  languages?: string | null;
  vTrainers?: string | null;
  vLength?: string | null;
  vLoadingScreen?: boolean | null;
  vHighScoreSaver?: boolean | null;
  vIncludedDocs?: boolean | null;
  vTrueDriveEmu?: boolean | null;
  vPalNtsc?: string | null;
  memo?: string | null;
} & {
  game?: RawGameRow | null;
};

// ---------------------------------------------------------------------------
// Command wrappers
// ---------------------------------------------------------------------------

/**
 * Scan a local directory for C64 ROM files (.d64, .t64, .tap, etc.).
 * Returns CRC32 hashes computed in streaming Rust without loading full ROMs into memory.
 * Falls back to empty array in browser dev mode.
 */
export async function scanRomDirectory(directory: string): Promise<ScannedRom[]> {
  if (!isTauri()) {
    console.warn('[tauri-bridge] scanRomDirectory: not in Tauri, returning empty list');
    return [];
  }
  return invoke<ScannedRom[]>('scan_rom_directory', { directory });
}

/**
 * Launch an emulator (e.g. VICE x64sc) with the given ROM and game flags.
 * The Rust layer validates all paths before spawning the process.
 */
export async function launchEmulator(request: LaunchRequest): Promise<LaunchResult> {
  if (!isTauri()) {
    console.warn('[tauri-bridge] launchEmulator: not in Tauri - would launch:', request);
    return { success: false, message: 'Not running in desktop mode' };
  }
  return invoke<LaunchResult>('launch_emulator', { request });
}

export async function launchGame(request: LaunchRequest): Promise<LaunchResult> {
  return launchEmulator(request);
}

export async function testEmulatorProfile(request: EmulatorProfileTestRequest): Promise<LaunchResult> {
  if (!isTauri()) {
    console.warn('[tauri-bridge] testEmulatorProfile: not in Tauri - would test:', request);
    return { success: false, message: 'Not running in desktop mode' };
  }
  return invoke<LaunchResult>('test_emulator_profile', { request });
}

/**
 * Check whether a media asset exists on the local filesystem.
 * Returns the absolute path and an existence flag.
 */
const resolveMediaPathCache = new Map<string, Promise<ResolvedPath>>();
const findAllMediaVariantsCache = new Map<string, Promise<string[]>>();
const mediaUrlCache = new Map<string, Promise<string>>();

export function clearMediaCache(): void {
  // Revoke all ObjectURLs in the cache to avoid memory leaks
  for (const promise of mediaUrlCache.values()) {
    promise.then(url => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    }).catch(() => {});
  }
  resolveMediaPathCache.clear();
  findAllMediaVariantsCache.clear();
  mediaUrlCache.clear();
}

export async function resolveMediaPath(
  baseDir: string,
  filename: string
): Promise<ResolvedPath> {
  const cacheKey = `${baseDir}::${filename}`;
  let cached = resolveMediaPathCache.get(cacheKey);
  if (!cached) {
    if (await isDebugMode()) {
      logDebugMessage(`[DEBUG] [CACHE MISS] resolveMediaPath: "${filename}" under "${baseDir}" - requesting from backend`);
    }
    const p = (async () => {
      if (!isTauri()) {
        return { exists: false, absolute_path: `${baseDir}/${filename}` };
      }
      return invoke<ResolvedPath>('resolve_media_path', { baseDir, filename });
    })();
    resolveMediaPathCache.set(cacheKey, p);
    p.catch(() => resolveMediaPathCache.delete(cacheKey));
    cached = p;
  } else {
    if (await isDebugMode()) {
      logDebugMessage(`[DEBUG] [CACHE HIT] resolveMediaPath: "${filename}" under "${baseDir}"`);
    }
  }
  return cached;
}

/**
 * Check for multiple screenshot variants (_1, _2, _a, _b etc) on the local filesystem
 */
export async function findAllMediaVariants(
  baseDir: string,
  filename: string
): Promise<string[]> {
  const cacheKey = `${baseDir}::${filename}`;
  let cached = findAllMediaVariantsCache.get(cacheKey);
  if (!cached) {
    if (await isDebugMode()) {
      logDebugMessage(`[DEBUG] [CACHE MISS] findAllMediaVariants: "${filename}" under "${baseDir}" - requesting from backend`);
    }
    const p = (async () => {
      if (!isTauri()) {
        return [`${baseDir}/${filename}`];
      }
      return invoke<string[]>('find_all_media_variants', { baseDir, filename });
    })();
    findAllMediaVariantsCache.set(cacheKey, p);
    p.catch(() => findAllMediaVariantsCache.delete(cacheKey));
    cached = p;
  } else {
    if (await isDebugMode()) {
      logDebugMessage(`[DEBUG] [CACHE HIT] findAllMediaVariants: "${filename}" under "${baseDir}"`);
    }
  }
  return cached;
}

/**
 * Download a file from a URL to the local filesystem.
 */
export async function downloadMediaAsset(url: string, destDir: string, filename: string): Promise<ResolvedPath> {
  if (!isTauri()) {
    console.warn('[tauri-bridge] downloadMediaAsset: not in Tauri - saving to memory: ', { url, destDir, filename });
    return { exists: true, absolute_path: url };
  }
  return invoke<ResolvedPath>('download_media_asset', { url, destDir, filename });
}

/**
 * Transforms an absolute filesystem path into a Tauri asset:// URL.
 * Falls back to returning the path directly in web contexts.
 */
export async function getAssetUrl(absolutePath: string): Promise<string> {
  if (!isTauri()) {
    return absolutePath;
  }
  await invoke<void>('allow_asset_path', { path: absolutePath });
  const { convertFileSrc } = await import('@tauri-apps/api/core');
  // Normalize windows paths to use forward slashes for the internal URL conversion
  const normalized = absolutePath.replace(/\\/g, '/');
  return convertFileSrc(normalized);
}

/**
 * Reads the direct raw bytes of a file from the user's filesystem.
 * Required for passing data to the iframe WASM emulator.
 */
export async function readFileBytes(absolutePath: string): Promise<Uint8Array> {
  if (!isTauri()) {
    console.warn('[tauri-bridge] readFileBytes: not in Tauri - fetching via standard fetch() for dev mode:', absolutePath);
    const res = await fetch(`/${absolutePath.split('/').pop()}`);
    if (!res.ok) throw new Error('File not found in dev mode');
    const arrayBuffer = await res.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }
  const bytes = await invoke<number[]>('read_file_bytes', { path: absolutePath });
  return new Uint8Array(bytes);
}

/**
 * Generates an ObjectURL using the binary contents of the local file.
 * Required for jsSID playing because XMLHttpRequest fails on asset:// protocols.
 */
export async function getMediaUrl(absolutePath: string): Promise<string> {
  let cached = mediaUrlCache.get(absolutePath);
  if (!cached) {
    if (await isDebugMode()) {
      logDebugMessage(`[DEBUG] [CACHE MISS] getMediaUrl: "${absolutePath}" - loading bytes from disk`);
    }
    const p = (async () => {
      const bytes = await readFileBytes(absolutePath);
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/octet-stream' });
      return URL.createObjectURL(blob);
    })();
    mediaUrlCache.set(absolutePath, p);
    p.catch(() => mediaUrlCache.delete(absolutePath));
    cached = p;
  } else {
    if (await isDebugMode()) {
      logDebugMessage(`[DEBUG] [CACHE HIT] getMediaUrl: "${absolutePath}"`);
    }
  }
  return cached;
}

/**
 * Opens the native OS folder picker and returns the selected path.
 * Falls back to null in browser mode (SettingsModal uses this for the "Browse" button).
 */
export async function openDirectoryDialog(): Promise<string | null> {
  if (!isTauri()) {
    console.warn('[tauri-bridge] openDirectoryDialog: not in Tauri');
    return null;
  }
  return invoke<string | null>('open_directory_dialog');
}

/**
 * Opens the native OS file picker and returns the selected path.
 * Falls back to null in browser mode.
 */
export async function openFileDialog(): Promise<string | null> {
  if (!isTauri()) {
    console.warn('[tauri-bridge] openFileDialog: not in Tauri');
    return null;
  }
  return invoke<string | null>('open_file_dialog');
}

export async function openMdbFileDialog(): Promise<string | null> {
  if (!isTauri()) {
    console.warn('[tauri-bridge] openMdbFileDialog: not in Tauri');
    return null;
  }
  return invoke<string | null>('open_mdb_file_dialog');
}

export async function getDatabaseBootstrapStatus(): Promise<DatabaseBootstrapStatus> {
  if (!isTauri()) {
    return {
      ready: true,
      dbPath: 'mock-db',
      reason: null,
    };
  }
  return invoke<DatabaseBootstrapStatus>('get_database_bootstrap_status');
}

export async function importDatabaseFromMdb(mdbPath: string): Promise<DatabaseImportResult> {
  if (!isTauri()) {
    throw new Error('Database import is only available in the desktop app');
  }
  return invoke<DatabaseImportResult>('import_database_from_mdb', { mdbPath });
}

export async function getPlatformImportStatus(platformId: string): Promise<PlatformImportStatusResponse> {
  if (!isTauri()) {
    const { PLATFORM_PROFILES } = await import('./platform-capabilities');
    const platform = PLATFORM_PROFILES[platformId as keyof typeof PLATFORM_PROFILES];
    if (!platform) {
      throw new Error(`Unsupported platform: ${platformId}`);
    }
    const storedSettings = (() => {
      if (typeof window === 'undefined') return null;
      try {
        const raw = window.localStorage.getItem('gb64_settings');
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    })();
    const storedLibrary = storedSettings?.platformSettings?.[platformId]?.library;
    return {
      platformId,
      importStatus: storedLibrary?.importStatus ?? platform.importStatus,
      sourceMdbPath: storedLibrary?.sourceMdbPath ?? null,
      gameCount: storedLibrary?.gameCount ?? 0,
      lastImportError: storedLibrary?.lastImportError ?? null,
    };
  }
  return invoke<PlatformImportStatusResponse>('get_platform_import_status', { platformId });
}

export async function importPlatformDatabaseFromMdb(
  request: PlatformImportRequest,
): Promise<PlatformDatabaseImportResult> {
  if (!isTauri()) {
    throw new Error('Platform database import is only available in the desktop app');
  }
  return invoke<PlatformDatabaseImportResult>('import_platform_database_from_mdb', { request });
}

export async function cancelPlatformImport(jobId: string): Promise<void> {
  if (!isTauri()) {
    return;
  }
  await invoke('cancel_platform_import', { jobId });
}

export async function getSupportedPlatforms(): Promise<SupportedPlatformProfile[]> {
  if (!isTauri()) {
    const { SUPPORTED_PLATFORMS } = await import('./platform-capabilities');
    return SUPPORTED_PLATFORMS.map((platform) => ({
      id: platform.id,
      displayName: platform.displayName,
      status: platform.status,
      importStatus: platform.importStatus,
      defaultEmulatorProfileId: platform.defaultEmulatorProfileId,
      supportedEmulatorProfileIds: platform.supportedEmulatorProfileIds,
      capabilities: {
        ...platform.mediaCapabilities,
        inAppEmulation: platform.inAppEmulation,
        launchExtensions: platform.launchExtensions,
      },
      folderTypes: platform.folderTypes,
    }));
  }
  return invoke<SupportedPlatformProfile[]>('get_supported_platforms');
}

export async function getActivePlatform(): Promise<ActivePlatformStateResponse> {
  if (!isTauri()) {
    return {
      activePlatformId: 'c64',
      lastUsedPlatformId: 'c64',
      platformSelectionRequired: false,
    };
  }
  return invoke<ActivePlatformStateResponse>('get_active_platform');
}

export async function setActivePlatform(platformId: string): Promise<SetActivePlatformResponse> {
  if (!isTauri()) {
    const { PLATFORM_PROFILES } = await import('./platform-capabilities');
    const platform = PLATFORM_PROFILES[platformId as keyof typeof PLATFORM_PROFILES];
    if (!platform) {
      throw new Error(`Unsupported platform: ${platformId}`);
    }
    const requiresImport = platform.importStatus !== 'imported';
    return {
      activePlatformId: platform.id,
      requiresImport,
      message: requiresImport
        ? `${platform.displayName} needs to be imported before browsing.`
        : `${platform.displayName} is ready.`,
    };
  }
  return invoke<SetActivePlatformResponse>('set_active_platform', { platformId });
}

/**
 * Exit the application immediately.
 */
export async function exitApp(): Promise<void> {
  if (!isTauri()) {
    console.warn('[tauri-bridge] exitApp: not in Tauri');
    return;
  }
  return invoke<void>('exit_app');
}

/**
 * Update window display mode (fullscreen/windowed) and resolution.
 */
export async function setWindowMode(fullscreen: boolean, width?: number, height?: number): Promise<void> {
  if (!isTauri()) {
    console.warn('[tauri-bridge] setWindowMode: not in Tauri - Mode:', { fullscreen, width, height });
    return;
  }
  return invoke<void>('set_window_mode', { fullscreen, width, height });
}

/**
 * Get current window dimensions.
 */
export async function getWindowSize(): Promise<{ width: number, height: number } | null> {
  if (!isTauri()) return null;
  return invoke<{ width: number, height: number }>('get_window_size');
}

/**
 * Open a file or folder using the default OS handler.
 */
export async function openFile(path: string): Promise<void> {
  if (!isTauri()) {
    console.warn('[tauri-bridge] openFile: not in Tauri - path:', path);
    window.open(path, '_blank');
    return;
  }
  return invoke<void>('open_path_with_system_default', { path });
}

export interface GameFilters {
  searchQuery?: string;
  letter?: string;
  genre?: string;
  subGenre?: string;
  favoriteIds?: string[];
  hideAdult?: boolean;
  isClassic?: boolean;
}

export async function getGenres(platformId: string = 'c64'): Promise<string[]> {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<string[]>('get_genres', { platformId });
  } catch {
    // Fallback to the known GB64 genres for browser dev mode
    return ["Adventure","Arcade","Board Game","Brain","Cards","Educational","Gambling","Miscellaneous","Racing","Shoot'em Up","Simulation","Sports","Strategy"];
  }
}

export async function getSubGenres(genre?: string, platformId: string = 'c64'): Promise<string[]> {
  if (!genre?.trim()) {
    return [];
  }

  if (!isTauri()) {
    const games = await getDbGames(5000, 0, { genre }, platformId);
    return Array.from(
      new Set(
        games
          .map((game) => game.subGenre?.trim())
          .filter((subGenre): subGenre is string => Boolean(subGenre)),
      ),
    ).sort((left, right) => left.localeCompare(right));
  }

  try {
    return await invoke<string[]>('get_sub_genres', { genre, platformId });
  } catch (err) {
    console.error('Failed to get sub-genres from database:', err);
    return [];
  }
}

export async function getDbGameCount(filters?: GameFilters, platformId: string = 'c64'): Promise<number> {
  if (!isTauri()) {
    const games = await getDbGames(5000, 0, filters, platformId);
    return games.length;
  }

  try {
    return await invoke<number>('get_db_game_count', { filters, platformId });
  } catch (err) {
    console.error('Failed to get game count from database:', err);
    return 0;
  }
}

/**
 * Fetch extras for a specific game from the database.
 */
export async function getGameExtras(
  gameId: number,
  platformId: string = 'c64',
): Promise<import('../types/game').Extra[]> {
  if (!isTauri()) {
    const { mockGames } = await import('../data/mockGames');
    return (mockGames as unknown as import('../types/game').GameDetail[]).find((game) => game.id === gameId && (game.platformId || 'c64') === platformId)?.extras ?? [];
  }
  try {
    const rawExtras = await invoke<RawExtraRow[]>('get_game_extras', { gameId: gameId.toString(), platformId });
    return rawExtras.map(ex => ({
      id: ex.id,
      name: ex.name,
      path: ex.path,
      type: ex.extraType,
    }));
  } catch (err) {
    console.error('Failed to fetch extras:', err);
    return [];
  }
}

/**
 * Fetch games from the local SQLite database.
 * In browser mode (dev), this falls back to the mock games array.
 */
export async function getDbGames(
  limit: number = 50,
  offset: number = 0,
  filters?: GameFilters,
  platformId: string = 'c64',
): Promise<import('../types/game').Game[]> {
  if (!isTauri()) {
    console.warn('[tauri-bridge] getDbGames: not in Tauri, falling back to mockData');
    const { mockGames } = await import('../data/mockGames');
    const results = mockGames as unknown as import('../types/game').GameDetail[];
    const searchQuery = filters?.searchQuery?.trim().toLowerCase();
    const favoriteIds = filters?.favoriteIds ?? null;
    const filteredGames = results.filter((game) => {
      const gamePlatform = game.platformId || 'c64';
      if (gamePlatform !== platformId) {
        return false;
      }

      if (favoriteIds && favoriteIds.length > 0 && !favoriteIds.includes(game.id.toString())) {
        return false;
      }

      if (filters?.favoriteIds && filters.favoriteIds.length === 0) {
        return false;
      }

      if (filters?.isClassic !== undefined && game.isClassic !== filters.isClassic) {
        return false;
      }

      if (filters?.genre && game.parentGenre !== filters.genre) {
        return false;
      }

      if (filters?.subGenre && game.subGenre !== filters.subGenre) {
        return false;
      }

      if (filters?.letter) {
        const firstCharacter = game.name.charAt(0);
        if (filters.letter === '#') {
          if (/^[A-Za-z]/.test(firstCharacter)) {
            return false;
          }
        } else if (!game.name.toLowerCase().startsWith(filters.letter.toLowerCase())) {
          return false;
        }
      }

      if (searchQuery) {
        const searchableFields = [
          game.name,
          game.developer?.name ?? '',
          game.publisher?.name ?? '',
          game.musician?.name ?? '',
          game.coderName ?? '',
          game.graphicsName ?? '',
        ];
        if (!searchableFields.some((value) => value.toLowerCase().includes(searchQuery))) {
          return false;
        }
      }

      return true;
    });

    return filteredGames.slice(offset, offset + limit).map((g) => ({
      id: g.id,
      name: g.name,
      filename: g.filename,
      gameFilename: g.gameFilename ?? null,
      screenshotFilename: g.screenshotFilename ?? null,
      boxFrontFilename: g.boxFrontFilename ?? null,
      coverPath: g.coverPath ?? null,
      titlescreenFilename: g.titlescreenFilename ?? null,
      videoSnapFilename: g.videoSnapFilename ?? null,
      sidFilename: g.sidFilename ?? null,
      crc: g.crc ?? '',
      year: g.year ?? null,
      isPal: g.isPal,
      isNtsc: g.isNtsc,
      trueDriveEmu: g.trueDriveEmu,
      isClassic: g.isClassic,
      parentGenre: g.parentGenre,
      subGenre: g.subGenre,
      developer: g.developer ?? null,
      publisher: g.publisher ?? null,
    }));
  }
  try {
    const rawGames = await invoke<RawGameRow[]>('get_db_games', { limit, offset, filters, platformId });
    
    return rawGames.map((row) => ({
      id: parseInt(row.id, 10),
      name: row.name,
      filename: row.filename,
      gameFilename: row.gameFilename ?? null,
      screenshotFilename: row.screenshotFilename ?? null,
      boxFrontFilename: row.boxFrontFilename ?? null,
      coverPath: row.coverPath ?? null,
      titlescreenFilename: row.titlescreenFilename ?? null,
      videoSnapFilename: row.videoSnapFilename ?? null,
      sidFilename: row.sidFilename ?? null,
      crc: row.crc ?? '',
      year: row.year ? parseInt(row.year, 10) : null,
      isPal: row.isPal,
      isNtsc: row.isNtsc,
      trueDriveEmu: row.trueDriveEmu,
      isClassic: row.isClassic,
      parentGenre: row.parentGenre,
      subGenre: row.subGenre,
      developer: row.developerName ? { id: -1, name: row.developerName } : null,
      publisher: row.publisherName ? { id: -1, name: row.publisherName } : null,
    }));
  } catch (err) {
    console.error('Failed to get games from database:', err);
    return [];
  }
}

export async function getDbGameDetail(
  gameId: string,
  platformId: string = 'c64',
): Promise<import('../types/game').GameDetail | null> {
  if (!isTauri()) {
    const { mockGames } = await import('../data/mockGames');
    const game = mockGames.find((g) => g.id.toString() === gameId && (g.platformId || 'c64') === platformId);
    return (game as unknown as import('../types/game').GameDetail) || null;
  }

  try {
    const raw = await invoke<RawGameDetailRow | null>('get_game_detail', { gameId, platformId });
    if (!raw) return null;
    const rawGame = raw.game ?? raw;

    const controlMap: Record<string, string> = {
      '0': 'Joystick Port 2',
      '1': 'Joystick Port 1',
      '2': 'Keyboard',
      '3': 'Paddles Port 2',
      '4': 'Paddles Port 1',
      '5': 'Lightpen',
      '6': 'Mouse Port 1',
      '7': 'Mouse Port 2',
      '8': 'Koala Pad',
      '9': 'Lightgun',
    };

    return {
      id: parseInt(rawGame.id, 10),
      name: rawGame.name,
      filename: rawGame.filename,
      gameFilename: rawGame.gameFilename ?? null,
      screenshotFilename: rawGame.screenshotFilename ?? null,
      boxFrontFilename: rawGame.boxFrontFilename ?? null,
      coverPath: rawGame.coverPath ?? null,
      titlescreenFilename: rawGame.titlescreenFilename ?? null,
      videoSnapFilename: rawGame.videoSnapFilename ?? null,
      sidFilename: rawGame.sidFilename ?? null,
      crc: rawGame.crc ?? '',
      year: rawGame.year ? parseInt(rawGame.year, 10) : null,
      isPal: rawGame.isPal,
      isNtsc: rawGame.isNtsc,
      trueDriveEmu: rawGame.trueDriveEmu,
      isClassic: rawGame.isClassic,
      parentGenre: rawGame.parentGenre,
      subGenre: rawGame.subGenre,
      developer: rawGame.developerName ? { id: -1, name: rawGame.developerName } : null,
      publisher: rawGame.publisherName ? { id: -1, name: rawGame.publisherName } : null,
      musician: raw.musicianName ? { 
        id: -1, 
        name: raw.musicianName, 
        photoPath: raw.musicianPhoto ?? null,
        group: raw.musicianGroup ?? null,
        nick: raw.musicianNick ?? null
      } : null,
      control: raw.control ? (controlMap[raw.control] || raw.control) : 'Joystick',
      playersFrom: raw.playersFrom ?? null,
      playersTo: raw.playersTo ?? null,
      playersSim: raw.playersSim ?? null,
      comment: raw.comment ?? null,
      reviewRating: raw.reviewRating ?? null,
      languages: raw.languages ? [raw.languages] : [],
      coderName: raw.coderName ?? null,
      graphicsName: raw.graphicsName ?? null,
      versionBy: raw.versionBy ?? null,
      vTrainers: raw.vTrainers ?? null,
      vLength: raw.vLength ?? null,
      vLoadingScreen: raw.vLoadingScreen ?? null,
      vHighScoreSaver: raw.vHighScoreSaver ?? null,
      vIncludedDocs: raw.vIncludedDocs ?? null,
      vTrueDriveEmu: raw.vTrueDriveEmu ?? null,
      vPalNtsc: (() => {
        if (!raw.vPalNtsc) return null;
        const val = raw.vPalNtsc.toString().trim();
        const map: Record<string, string> = {
          '1': 'PAL',
          '2': 'NTSC',
          '3': 'PAL / NTSC',
          '4': 'NTSC / PAL',
          'P': 'PAL',
          'N': 'NTSC',
          'B': 'Both (PAL & NTSC)'
        };
        return map[val] || val;
      })(),
      memo: raw.memo ?? null,
    };
  } catch (err) {
    console.error('Failed to get game detail from database:', err);
    return null;
  }
}

/**
 * Save a sensitive setting encrypted in the local SQLite database.
 */
export async function saveSecureSetting(key: string, value: string): Promise<void> {
  if (!isTauri()) {
    localStorage.setItem(`secure_${key}`, value);
    return;
  }
  return invoke<void>('save_secure_setting', { key, value });
}

/**
 * Retrieve and decrypt a sensitive setting from the local SQLite database.
 */
export async function getSecureSetting(key: string): Promise<string | null> {
  if (!isTauri()) {
    return localStorage.getItem(`secure_${key}`);
  }
  return invoke<string | null>('get_secure_setting', { key });
}
