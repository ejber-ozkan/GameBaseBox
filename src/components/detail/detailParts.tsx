"use client";
import { type ReactNode } from 'react';
import { cleanMetadataValue } from '../../lib/game-display';
import type { Extra, Game } from '../../types/game';
import type { PlatformId } from '../../types/platform';
import { useAmigaExtraDownload } from '../../lib/amiga-scraper';
import type { DetailFullscreenRequest } from '../DetailView';


export function AmigaDownloadBadge({
  version,
  isAvailable,
  onDownload,
}: {
  version: LaunchVersionOption;
  isAvailable: boolean;
  onDownload: () => void;
}) {
  const { isDownloading, percentage } = useAmigaExtraDownload(version.relativePath);

  if (isAvailable) return null;

  if (isDownloading) {
    return (
      <span className="text-[8px] bg-blue-600/90 text-white px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-1 shadow-sm animate-pulse">
        ⏳ {percentage !== null && percentage > 0 ? `${percentage}%` : '...'}
      </span>
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onDownload();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.stopPropagation();
          onDownload();
        }
      }}
      className="text-[8px] bg-blue-600/80 hover:bg-blue-500 text-white px-1.5 py-0.5 rounded font-black uppercase tracking-wider flex items-center gap-1 shadow-sm cursor-pointer hover:scale-105 transition-transform"
    >
      ⬇ GET
    </span>
  );
}

export function CyberpunkAmigaDownloadBadge({
  version,
  isAvailable,
  onDownload,
}: {
  version: LaunchVersionOption;
  isAvailable: boolean;
  onDownload: () => void;
}) {
  const { isDownloading, percentage } = useAmigaExtraDownload(version.relativePath);

  if (isAvailable) return null;

  if (isDownloading) {
    return (
      <span className="text-[8px] bg-[#00f0ff]/30 border border-[#00f0ff] text-[#00f0ff] px-1.5 py-0.5 font-mono font-bold flex items-center gap-1 shadow-sm animate-pulse">
        DL {percentage !== null && percentage > 0 ? `${percentage}%` : '...'}
      </span>
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onDownload();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.stopPropagation();
          onDownload();
        }
      }}
      className="text-[8px] bg-[#00f0ff]/20 border border-[#00f0ff] hover:bg-[#00f0ff] hover:text-black text-[#00f0ff] px-1.5 py-0.5 font-mono uppercase tracking-wider flex items-center gap-1 shadow-sm cursor-pointer hover:scale-105 transition-transform"
    >
      ⬇ GET
    </span>
  );
}

export type UnifiedDetailTab = 'game' | 'extras';

export interface LaunchVersionOption {
  id: string;
  label: string;
  relativePath: string | null;
  source: 'extras' | 'roms';
  subtitle: string;
  tag: string;
}

export type VersionVisualKind = 'default' | 'tape' | 'disk' | 'cart' | 'whd' | 'sps' | 'stx' | 'hd';

export const VERSION_STORAGE_KEY = 'gb64_selected_launch_versions';

export function getPlayerLabel(game: Game) {
  const from = cleanMetadataValue(game.playersFrom);
  const to = cleanMetadataValue(game.playersTo);
  const simultaneous = cleanMetadataValue(game.playersSim);
  if (from && to) {
    return from === to ? from : `${from}-${to}`;
  }
  return simultaneous ?? from ?? to ?? '1';
}

export function getPlayersDetailLabel(game: Game) {
  const label = getPlayerLabel(game);
  return label === '1' ? '1 Player' : `${label} Players`;
}

export function getArchiveNotes(game: Game) {
  return cleanMetadataValue(game.memo)
    ?? cleanMetadataValue(game.comment)
    ?? 'Curated metadata, artwork, soundtrack, and alternate versions live together here for quick browsing.';
}

export function openScreenshotFullscreen(
  screenshotFilename: string | null,
  onFullscreen: (media: DetailFullscreenRequest) => void,
) {
  if (screenshotFilename) {
    onFullscreen({ kind: 'screenshot', filename: screenshotFilename });
  }
}

export function openBoxArtFullscreen(
  gameName: string,
  boxArtUrl: string,
  boxFrontFilename: string | null,
  onFullscreen: (media: DetailFullscreenRequest) => void,
) {
  if (boxArtUrl) {
    onFullscreen({ kind: 'image-url', url: boxArtUrl, alt: `${gameName} box art` });
    return;
  }
  if (boxFrontFilename) {
    onFullscreen({ kind: 'screenshot', filename: boxFrontFilename });
  }
}

export function getMusicGlyph(platformId: PlatformId) {
  if (platformId === 'c64') return 'SID';
  if (platformId === 'atari800') return 'SAP';
  return 'MUS';
}

export function buildPersonnel(game: Game, platformId: PlatformId) {
  const items = [
    { label: 'Developer', value: cleanMetadataValue(game.developer?.name), glyph: 'DEV' },
    { label: 'Publisher', value: cleanMetadataValue(game.publisher?.name), glyph: 'PUB' },
    { label: 'Coder', value: cleanMetadataValue(game.coderName), glyph: 'COD' },
    { label: 'Graphics', value: cleanMetadataValue(game.graphicsName), glyph: 'ART' },
    { label: 'Music', value: cleanMetadataValue(game.musician?.name), glyph: getMusicGlyph(platformId) },
  ];
  return items.filter((item): item is typeof items[number] & { value: string } => Boolean(item.value));
}

export function formatVersionLabel(game: Game) {
  const palNtsc = cleanMetadataValue(game.vPalNtsc);
  if (palNtsc) return palNtsc;
  if (game.isPal && game.isNtsc) return 'PAL / NTSC';
  if (game.isPal) return 'PAL';
  if (game.isNtsc) return 'NTSC';
  return 'Primary';
}

export function readStoredVersionId(gameId: number) {
  if (typeof window === 'undefined') {
    return 'primary';
  }
  try {
    const raw = window.localStorage.getItem(VERSION_STORAGE_KEY);
    if (!raw) {
      return 'primary';
    }
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed[String(gameId)] ?? 'primary';
  } catch {
    return 'primary';
  }
}

export function persistSelectedVersion(gameId: number, versionId: string) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const raw = window.localStorage.getItem(VERSION_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) as Record<string, string> : {};
    parsed[String(gameId)] = versionId;
    window.localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore persistence failures
  }
}

export function buildVersions(game: Game, launchableExtras: Extra[]): LaunchVersionOption[] {
  return [
    {
      id: 'primary',
      tag: formatVersionLabel(game),
      label: cleanMetadataValue(game.versionBy) ?? 'Primary Archive Build',
      relativePath: game.filename || game.gameFilename || null,
      source: 'roms',
      subtitle: cleanMetadataValue(game.vLength) ? `${game.vLength} Blocks` : 'Main release package',
    },
    ...launchableExtras.map((extra) => {
      const folder = extra.path.split(/[\\/]/)[0] || 'Extras';
      const isWhd = extra.name?.toLowerCase().includes('whd') || folder.toLowerCase().includes('whd');
      const isSps = extra.name?.toLowerCase().includes('sps') || folder.toLowerCase().includes('sps');
      const isStx = extra.name?.toLowerCase().includes('stx') || folder.toLowerCase().includes('stx') || extra.path.toLowerCase().endsWith('.stx');
      const isHd = extra.name?.toLowerCase().includes('harddisk') || folder.toLowerCase().includes('harddisk') || folder.toLowerCase().includes('hdold') || extra.path.toLowerCase().includes('harddisk');
      const tag = isWhd ? 'WHD' : isSps ? 'SPS' : isStx ? 'STX' : isHd ? 'HD' : folder;
      return {
        id: extra.id,
        tag,
        label: extra.name || folder,
        relativePath: extra.path,
        source: 'extras' as const,
        subtitle: extra.path.split(/[\\/]/).pop() || extra.path,
      };
    }),
  ];
}

export function getVersionVisualKind(version: LaunchVersionOption): VersionVisualKind {
  if (version.source === 'roms') {
    return 'default';
  }
  const combined = `${version.tag} ${version.label} ${version.subtitle}`.toLowerCase();
  if (combined.includes('whd')) return 'whd';
  if (combined.includes('sps')) return 'sps';
  if (combined.includes('stx')) return 'stx';
  if (combined.includes('harddisk') || combined.includes('hd')) return 'hd';
  if (combined.includes('tape')) return 'tape';
  if (combined.includes('disk')) return 'disk';
  if (combined.includes('cart')) return 'cart';
  return 'default';
}

export function getVersionVisualLabel(kind: VersionVisualKind) {
  switch (kind) {
    case 'default':
      return { badge: 'DEF', label: 'Default' };
    case 'whd':
      return { badge: 'WHD', label: 'WHDLoad' };
    case 'sps':
      return { badge: 'SPS', label: 'SPS' };
    case 'stx':
      return { badge: 'STX', label: 'STX Preservation' };
    case 'hd':
      return { badge: 'HD', label: 'Hard Disk' };
    case 'tape':
      return { badge: 'TAP', label: 'Tape' };
    case 'disk':
      return { badge: 'DSK', label: 'Disk' };
    case 'cart':
      return { badge: 'CRT', label: 'Cart' };
  }
}

export function VersionGlyph({
  kind,
  accent,
  className = 'h-8 w-8',
}: {
  kind: VersionVisualKind;
  accent: string;
  className?: string;
}) {
  const common = {
    fill: 'none',
    stroke: accent,
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className={className}>
      {kind === 'default' ? (
        <>
          <path d="M8 5.5h14l3 3v18H7V6.5a1 1 0 0 1 1-1Z" {...common} />
          <rect x="10" y="8.5" width="10" height="5" rx="1.2" {...common} />
          <circle cx="16" cy="20.5" r="3.4" {...common} />
          <circle cx="16" cy="20.5" r="1" {...common} />
        </>
      ) : null}
      {kind === 'whd' ? (
        <>
          <rect x="6" y="8" width="20" height="16" rx="2" {...common} />
          <line x1="6" y1="18" x2="26" y2="18" {...common} />
          <circle cx="21" cy="13" r="1.5" {...common} />
          <circle cx="16" cy="13" r="1.5" {...common} />
        </>
      ) : null}
      {kind === 'sps' ? (
        <>
          <path d="M8 5.5h14l3 3v18H7V6.5a1 1 0 0 1 1-1Z" {...common} />
          <rect x="10" y="8.5" width="10" height="5" rx="1.2" {...common} />
          <circle cx="16" cy="20.5" r="3.4" {...common} />
        </>
      ) : null}
      {kind === 'stx' ? (
        <>
          <path d="M8 5.5h14l3 3v18H7V6.5a1 1 0 0 1 1-1Z" {...common} />
          <rect x="10" y="8.5" width="10" height="5" rx="1.2" {...common} />
          <circle cx="16" cy="20.5" r="3.4" {...common} />
        </>
      ) : null}
      {kind === 'hd' ? (
        <>
          <rect x="6" y="8" width="20" height="16" rx="2" {...common} />
          <line x1="6" y1="18" x2="26" y2="18" {...common} />
          <circle cx="21" cy="13" r="1.5" {...common} />
          <circle cx="16" cy="13" r="1.5" {...common} />
        </>
      ) : null}
      {kind === 'tape' ? (
        <>
          <rect x="4.5" y="8.5" width="23" height="15" rx="3.2" {...common} />
          <rect x="8.5" y="10.8" width="15" height="4" rx="1.3" {...common} />
          <circle cx="11.5" cy="17.2" r="2.5" {...common} />
          <circle cx="20.5" cy="17.2" r="2.5" {...common} />
          <circle cx="11.5" cy="17.2" r="0.8" {...common} />
          <circle cx="20.5" cy="17.2" r="0.8" {...common} />
          <line x1="14.2" y1="16" x2="17.8" y2="16" {...common} />
          <path d="M7.5 23.5v2h17v-2" {...common} />
        </>
      ) : null}
      {kind === 'disk' ? (
        <>
          <path d="M8 5.5h14l3 3v18H7V6.5a1 1 0 0 1 1-1Z" {...common} />
          <rect x="10" y="8.5" width="10" height="5" rx="1.2" {...common} />
          <circle cx="16" cy="20.5" r="3.4" {...common} />
        </>
      ) : null}
      {kind === 'cart' ? (
        <>
          <path d="M8.5 9h15v12.5h-15z" {...common} />
          <path d="M11 9V6.5h10V9" {...common} />
          <rect x="11" y="12" width="10" height="5.2" rx="1.2" {...common} />
          <path d="M10 21.5h12" {...common} />
          <path d="M12 23.5h8" {...common} />
        </>
      ) : null}
    </svg>
  );
}

export interface InfoDensity {
  gap: number;
  labelFontSize: number;
  paddingY: number;
  valueFontSize: number;
}

export function InfoRow({
  label,
  value,
  layout,
}: {
  label: string;
  value: string;
  layout: InfoDensity;
}) {
  return (
    <div
      className="grid items-start border-b border-theme-outline/40"
      style={{
        columnGap: layout.gap,
        gridTemplateColumns: 'minmax(76px,0.72fr) minmax(0,1.28fr)',
        paddingBlock: layout.paddingY,
      }}
    >
      <span
        className="font-bold uppercase tracking-[0.18em] text-theme-text-muted"
        style={{ fontSize: `${layout.labelFontSize}px` }}
      >
        {label}
      </span>
      <span
        className="min-w-0 text-right font-medium text-theme-text"
        style={{ fontSize: `${layout.valueFontSize}px` }}
      >
        {value}
      </span>
    </div>
  );
}

export function SectionHeading({
  title,
  suffix,
}: {
  title: string;
  suffix?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-[11px] font-black uppercase tracking-[0.3em] text-theme-text-muted">
        {title}
      </div>
      {suffix ? <div className="text-theme-primary">{suffix}</div> : null}
    </div>
  );
}

export function clampTextLines(lineClamp: number) {
  return {
    WebkitBoxOrient: 'vertical' as const,
    WebkitLineClamp: lineClamp,
    display: '-webkit-box',
    overflow: 'hidden',
  };
}
