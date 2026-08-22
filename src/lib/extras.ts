import { Extra } from '../types/game';
import type { PlatformId } from '../types/platform';

export interface ExtraGroup {
  category: 'visual' | 'docs' | 'media' | 'games';
  label: string;
  items: Extra[];
}

export const VISUAL_FOLDERS = ["Adverts", "Advert", "Books", "Cover", "Magcover", "Maps", "Missing", "Photos", "Cover Scans"];
export const DOC_FOLDERS = ["Docs", "Listings", "SceneMags", "Tips", "Hints, Tips, Cheats & Walkthroughs", "Instructions"];
export const MEDIA_FOLDERS = ["Trailer", "mkv", "mp3s"];
export const GAME_FOLDERS = ["Carts", "Coverdisks", "Covertapes", "Disks", "PD-Disks", "Tapes", "Type-Ins"];
export const AMIGA_GAME_FOLDERS = ["WHDLoad", "WHD", "SPS", "Disks", "PD-Disks", "Games", "Roms"];

const IMG_EXT = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
const GAME_EXT = ['d64', 'g64', 't64', 'tap', 'prg', 'crt', 'nib', 'zip', 'adf', 'adz', 'dms', 'ipf', 'lha', 'hdf', 'hdz', 'slave'];
const MEDIA_EXT = ['mkv', 'mp4', 'mp3', 'avi', 'mov'];
const DOC_EXT = ['pdf', 'txt', 'doc', 'docx', 'htm', 'html'];

export function groupExtras(extras: Extra[], platformId?: PlatformId | string | null): ExtraGroup[] {
  const groups: Record<string, Extra[]> = {
    visual: [],
    docs: [],
    media: [],
    games: []
  };

  extras.forEach(extra => {
    const path = extra.path.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/');
    const folder = path.split('/')[0].toLowerCase();
    const ext = path.split('.').pop()?.toLowerCase() || '';

    // Amiga-scoped check for WHDLoad, SPS, or type 1 executable extras
    if (platformId === 'amiga' && isLaunchableExtra(extra, 'amiga')) {
      groups.games.push(extra);
      return;
    }

    // Smart categorization: Extension takes precedence for ambiguous folders like "Cover"
    if (GAME_EXT.includes(ext)) {
      groups.games.push(extra);
    } else if (IMG_EXT.includes(ext)) {
      groups.visual.push(extra);
    } else if (MEDIA_EXT.includes(ext)) {
      groups.media.push(extra);
    } else if (DOC_EXT.includes(ext)) {
      groups.docs.push(extra);
    } else {
      // Fallback to folder-based matching if extension is unknown
      if (VISUAL_FOLDERS.some(f => f.toLowerCase() === folder)) {
        groups.visual.push(extra);
      } else if (DOC_FOLDERS.some(f => f.toLowerCase() === folder)) {
        groups.docs.push(extra);
      } else if (MEDIA_FOLDERS.some(f => f.toLowerCase() === folder)) {
        groups.media.push(extra);
      } else if (GAME_FOLDERS.some(f => f.toLowerCase() === folder)) {
        groups.games.push(extra);
      } else {
        groups.docs.push(extra);
      }
    }
  });

  const result: ExtraGroup[] = [];
  if (groups.visual.length > 0) result.push({ category: 'visual', label: 'Gallery & Media', items: groups.visual });
  if (groups.docs.length > 0) result.push({ category: 'docs', label: 'Documents & Manuals', items: groups.docs });
  if (groups.media.length > 0) result.push({ category: 'media', label: 'Media Assets', items: groups.media });
  if (groups.games.length > 0) result.push({ category: 'games', label: 'Alternate Versions', items: groups.games });

  return result;
}

/**
 * Safely joins the base extras directory path with the specific extra's relative path,
 * normalizing slashes and avoiding double-slashes.
 */
export function buildExtraAssetPath(extrasPath: string | null | undefined, extraPath: string): string {
  const cleanExtrasPath = (extrasPath || '').replace(/\\/g, '/').replace(/\/+$/, '');
  const cleanExtraPath = extraPath.replace(/\\/g, '/').replace(/^\/+/, '');
  return [cleanExtrasPath, cleanExtraPath].filter(Boolean).join('/');
}

export function getExtraExtension(extra: Extra) {
  return extra.path.split('.').pop()?.toLowerCase() || '';
}

export function isImageExtra(extra: Extra) {
  return IMG_EXT.includes(getExtraExtension(extra));
}

export function isVideoExtra(extra: Extra) {
  return MEDIA_EXT.includes(getExtraExtension(extra));
}

export function getExtraSourceLabel(extra: Extra) {
  return extra.path.split(/[\\/]/)[0] || 'Extras';
}

export function getExtraLaunchLabel(extra: Extra, platformId?: PlatformId | string | null) {
  const root = getExtraSourceLabel(extra).toLowerCase();
  const name = (extra.name || '').toLowerCase();

  if (platformId === 'amiga' || root.includes('whd') || name.includes('whd')) {
    if (root.includes('whd') || name.includes('whd')) return 'Launch WHDLoad';
    if (root.includes('sps') || name.includes('sps')) return 'Launch SPS';
  }

  if (root.includes('tape')) return 'Launch Tape';
  if (root.includes('disk')) return 'Launch Disk';
  if (root.includes('cart')) return 'Launch Cart';
  return 'Launch Variant';
}

export function isLaunchableExtra(extra: Extra, platformId?: PlatformId | string | null) {
  const root = getExtraSourceLabel(extra).toLowerCase();
  const name = (extra.name || '').toLowerCase();

  if (platformId === 'amiga') {
    if (
      root.includes('whd') ||
      name.includes('whd') ||
      root.includes('sps') ||
      name.includes('sps') ||
      extra.type === '1' ||
      extra.type === 'game'
    ) {
      return true;
    }
    return AMIGA_GAME_FOLDERS.some((candidate) => root.includes(candidate.toLowerCase()));
  }

  return GAME_FOLDERS.some((candidate) => root.includes(candidate.toLowerCase()));
}

export function isAtariAdvertExtra(extra: Extra) {
  return getExtraSourceLabel(extra).toLowerCase() === 'adverts';
}

export function isAtariCoverArtExtra(extra: Extra, platformId: PlatformId) {
  if (platformId !== 'atari800') {
    return false;
  }

  const root = getExtraSourceLabel(extra).toLowerCase();
  return (root === 'cover' || root === 'covers') && isImageExtra(extra);
}

export function supportsAtariExtraCoverArt(platformId: PlatformId) {
  return platformId === 'atari800';
}

export function getVisibleDetailExtraCategories(platformId: PlatformId): ExtraGroup['category'][] {
  return platformId === 'atari800' ? ['visual', 'docs', 'media'] : ['visual', 'media'];
}


