import { Extra } from '../types/game';
import {
  downloadMediaAsset,
  resolveMediaPath,
  listenMediaDownloadProgress,
  type ResolvedPath,
  type MediaDownloadProgress,
} from './tauri-bridge';
import { useSyncExternalStore } from 'react';

const ARCHIVE_WHDLOAD_BASE = 'https://archive.org/download/Amiga_WHD_Games';
const ARCHIVE_SPS_BASE = 'https://archive.org/download/commodore-amiga-games-sps';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// In-memory cache for fast lookups
const archiveFilesMemoryCache = new Map<string, string[]>();

/**
 * Extracts the base filename from an Extra path (e.g., 'WHDLoad/T/Turrican2_v1.7_0029.zip' -> 'Turrican2_v1.7_0029.zip').
 */
export function getExtraFilename(extra: Extra): string {
  const normalized = (extra.path || '').replace(/\\/g, '/');
  const lastSlash = normalized.lastIndexOf('/');
  return lastSlash >= 0 ? normalized.slice(lastSlash + 1) : normalized;
}

/**
 * Loads the file list for an Archive.org item with local persistent caching.
 */
export async function getArchiveFilesIndex(
  identifier: 'commodore-amiga-games-sps' | 'Amiga_WHD_Games',
): Promise<string[]> {
  if (archiveFilesMemoryCache.has(identifier)) {
    return archiveFilesMemoryCache.get(identifier)!;
  }

  const cacheKey = `gbbox_archive_index_${identifier}`;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.timestamp && Date.now() - parsed.timestamp < CACHE_TTL_MS && Array.isArray(parsed.files)) {
          archiveFilesMemoryCache.set(identifier, parsed.files);
          return parsed.files;
        }
      }
    } catch {
      // Ignore cache read errors
    }
  }

  try {
    const res = await fetch(`https://archive.org/metadata/${identifier}/files`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const files: string[] = (data?.result || [])
      .map((f: { name?: string }) => f?.name || '')
      .filter((name: string) => name.toLowerCase().endsWith('.zip'));

    if (files.length > 0) {
      archiveFilesMemoryCache.set(identifier, files);
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), files }));
        } catch {
          // Ignore cache write errors
        }
      }
      return files;
    }
  } catch (err) {
    console.warn(`[amiga-scraper] Failed to fetch Archive.org index for ${identifier}:`, err);
  }

  return [];
}

/**
 * Resolves the exact Archive.org direct download URL for an Amiga WHDLoad or SPS extra.
 */
export async function resolveAmigaArchiveDownloadUrl(extra: Extra): Promise<string | null> {
  const normalized = (extra.path || '').replace(/\\/g, '/').trim();
  const name = (extra.name || '').trim().toLowerCase();
  const filename = getExtraFilename(extra);

  if (!filename) return null;

  const isWHD =
    normalized.toLowerCase().startsWith('whdload/') ||
    normalized.toLowerCase().startsWith('whd/') ||
    name === 'whdload' ||
    name === 'whd';

  const isSPS = normalized.toLowerCase().startsWith('sps/') || name === 'sps';

  if (isSPS) {
    const spsFiles = await getArchiveFilesIndex('commodore-amiga-games-sps');
    const m = filename.match(/^(\d{1,4})_/);
    if (m && spsFiles.length > 0) {
      const spsId = m[1].padStart(4, '0');
      const match = spsFiles.find((f) => f.includes(`[${spsId}]`));
      if (match) {
        return `${ARCHIVE_SPS_BASE}/${encodeURIComponent(match)}`;
      }
    }
    return `${ARCHIVE_SPS_BASE}/${encodeURIComponent(filename)}`;
  }

  if (isWHD) {
    const whdFiles = await getArchiveFilesIndex('Amiga_WHD_Games');
    if (whdFiles.length > 0) {
      // 1. Exact match
      const exact = whdFiles.find((f) => f.toLowerCase() === filename.toLowerCase());
      if (exact) {
        return `${ARCHIVE_WHDLOAD_BASE}/${encodeURIComponent(exact)}`;
      }
      // 2. SPS ID match (e.g. _0002.zip)
      const spsMatch = filename.match(/_(\d{4})\.zip$/i);
      if (spsMatch) {
        const idMatch = whdFiles.find((f) => f.toLowerCase().endsWith(`_${spsMatch[1].toLowerCase()}.zip`));
        if (idMatch) {
          return `${ARCHIVE_WHDLOAD_BASE}/${encodeURIComponent(idMatch)}`;
        }
      }
      // 3. Prefix match
      const baseName = filename.split(/_v/i)[0].toLowerCase();
      const prefixMatch = whdFiles.find((f) => f.toLowerCase().startsWith(baseName));
      if (prefixMatch) {
        return `${ARCHIVE_WHDLOAD_BASE}/${encodeURIComponent(prefixMatch)}`;
      }
    }
    return `${ARCHIVE_WHDLOAD_BASE}/${encodeURIComponent(filename)}`;
  }

  return null;
}

/**
 * Synchronous helper for preliminary downloadability checks.
 */
export function getAmigaArchiveDownloadUrl(extra: Extra): string | null {
  const normalized = (extra.path || '').replace(/\\/g, '/').trim();
  const name = (extra.name || '').trim().toLowerCase();
  const filename = getExtraFilename(extra);

  if (!filename) return null;

  if (
    normalized.toLowerCase().startsWith('whdload/') ||
    normalized.toLowerCase().startsWith('whd/') ||
    name === 'whdload' ||
    name === 'whd'
  ) {
    return `${ARCHIVE_WHDLOAD_BASE}/${encodeURIComponent(filename)}`;
  }

  if (normalized.toLowerCase().startsWith('sps/') || name === 'sps') {
    return `${ARCHIVE_SPS_BASE}/${encodeURIComponent(filename)}`;
  }

  return null;
}

/**
 * Determines whether an extra can be downloaded on-demand from Archive.org.
 */
export function isAmigaDownloadableExtra(extra: Extra, platformId?: string): boolean {
  if (platformId !== 'amiga') return false;
  return getAmigaArchiveDownloadUrl(extra) !== null;
}

/**
 * Checks whether an Amiga extra file exists locally on disk across configured paths.
 */
export async function checkAmigaExtraExists(
  extrasPath: string,
  extraPath: string,
  gamesPath?: string,
): Promise<boolean> {
  if ((!extrasPath && !gamesPath) || !extraPath) return false;

  const cleanPath = extraPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const filename = cleanPath.split('/').pop() || cleanPath;
  const parts = cleanPath.split('/');

  const subpaths: string[] = [cleanPath];

  if (!cleanPath.toLowerCase().startsWith('extras/')) {
    subpaths.push(`Extras/${cleanPath}`);
    subpaths.push(`extras/${cleanPath}`);
  } else {
    subpaths.push(cleanPath.replace(/^extras\//i, ''));
  }

  if (parts.length === 3) {
    // e.g. WHDLoad/M/MagicPockets.zip -> WHDLoad/MagicPockets.zip
    subpaths.push(`${parts[0]}/${parts[2]}`);
    subpaths.push(`Extras/${parts[0]}/${parts[2]}`);
  } else if (parts.length === 2 && filename.length > 0) {
    // e.g. WHDLoad/MagicPockets.zip -> WHDLoad/M/MagicPockets.zip
    const firstChar = filename[0].toUpperCase();
    subpaths.push(`${parts[0]}/${firstChar}/${filename}`);
    subpaths.push(`Extras/${parts[0]}/${firstChar}/${filename}`);
  }

  subpaths.push(`.gbbox-temp/${cleanPath}`);
  subpaths.push(`.gbbox-temp/${filename}`);
  subpaths.push(filename);

  const uniqueSubpaths = Array.from(new Set(subpaths));
  const baseDirs: string[] = [extrasPath, gamesPath].filter((p): p is string => Boolean(p));

  for (const base of baseDirs) {
    for (const sp of uniqueSubpaths) {
      try {
        const res = await resolveMediaPath(base, sp);
        if (res?.exists) {
          return true;
        }
      } catch {
        // Continue checking other candidates
      }
    }
  }

  return false;
}

// Global active downloads tracking
export interface AmigaDownloadState {
  percentage: number;
  done: boolean;
  error?: string | null;
}

const activeAmigaDownloads = new Map<string, AmigaDownloadState>();
let progressListenerInitialized = false;

function initProgressListener() {
  if (progressListenerInitialized || typeof window === 'undefined') return;
  progressListenerInitialized = true;

  listenMediaDownloadProgress((progress: MediaDownloadProgress) => {
    const filename = progress.filename.replace(/\\/g, '/');
    for (const [key, state] of activeAmigaDownloads.entries()) {
      const normalizedKey = key.replace(/\\/g, '/');
      if (normalizedKey.endsWith(filename) || filename.endsWith(normalizedKey)) {
        state.percentage = progress.percentage ?? (progress.done ? 100 : 0);
        state.done = progress.done;
        state.error = progress.error;

        window.dispatchEvent(
          new CustomEvent('amiga-extra-download-progress', {
            detail: { extraPath: key, percentage: state.percentage, done: state.done, error: state.error },
          }),
        );

        if (progress.done) {
          activeAmigaDownloads.delete(key);
          window.dispatchEvent(
            new CustomEvent('amiga-extra-downloaded', {
              detail: { extraPath: key, success: !progress.error },
            }),
          );
        }
        break;
      }
    }
  }).catch(() => undefined);
}

function subscribeAmigaProgress(callback: () => void) {
  if (typeof window === 'undefined') return () => undefined;
  initProgressListener();
  window.addEventListener('amiga-extra-download-progress', callback);
  return () => {
    window.removeEventListener('amiga-extra-download-progress', callback);
  };
}

/**
 * React hook to observe download percentage for a specific extra path.
 */
export function useAmigaExtraDownload(extraPath?: string | null): {
  isDownloading: boolean;
  percentage: number | null;
} {
  const state = useSyncExternalStore(
    subscribeAmigaProgress,
    () => (extraPath ? activeAmigaDownloads.get(extraPath) ?? null : null),
    () => null,
  );

  return {
    isDownloading: Boolean(state && !state.done),
    percentage: state?.percentage ?? null,
  };
}

/**
 * Downloads a missing Amiga WHDLoad or SPS extra directly to the user's extras directory or temp folder.
 */
export async function downloadAmigaExtra(
  extra: Extra,
  extrasPath: string,
  downloadTarget: 'extras' | 'temp' = 'extras',
): Promise<ResolvedPath> {
  initProgressListener();
  const url = await resolveAmigaArchiveDownloadUrl(extra);
  if (!url) {
    throw new Error(`No Archive.org repository mapped for extra: ${extra.name || extra.path}`);
  }

  if (!extrasPath) {
    throw new Error('Extras folder path is not configured in Settings.');
  }

  const cleanPath = (extra.path || '').replace(/\\/g, '/').replace(/^\/+/, '');
  let targetRelativePath = cleanPath;

  if (downloadTarget === 'temp') {
    targetRelativePath = `.gbbox-temp/${cleanPath}`;
  } else {
    // If extrasPath contains an 'Extras' subdirectory and cleanPath doesn't start with 'extras/', save to Extras/
    try {
      const extrasFolderCheck = await resolveMediaPath(extrasPath, 'Extras');
      if (extrasFolderCheck?.exists && !cleanPath.toLowerCase().startsWith('extras/')) {
        targetRelativePath = `Extras/${cleanPath}`;
      }
    } catch {
      // Use cleanPath as default
    }
  }

  activeAmigaDownloads.set(extra.path, { percentage: 0, done: false });
  window.dispatchEvent(
    new CustomEvent('amiga-extra-download-progress', {
      detail: { extraPath: extra.path, percentage: 0, done: false },
    }),
  );

  try {
    const res = await downloadMediaAsset(url, extrasPath, targetRelativePath);
    activeAmigaDownloads.delete(extra.path);
    window.dispatchEvent(
      new CustomEvent('amiga-extra-downloaded', {
        detail: { extraPath: extra.path, success: true },
      }),
    );
    return res;
  } catch (err) {
    activeAmigaDownloads.delete(extra.path);
    window.dispatchEvent(
      new CustomEvent('amiga-extra-download-progress', {
        detail: { extraPath: extra.path, percentage: 0, done: true, error: String(err) },
      }),
    );
    throw err;
  }
}

