"use client";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getGameExtras, launchEmulator } from '../../lib/tauri-bridge';
import { useSettings } from '../../contexts/SettingsContext';
import { cleanMetadataValue, getGameStudios } from '../../lib/game-display';
import type { Extra, Game } from '../../types/game';
import { buildLaunchRequest } from '../../lib/platform-launch';
import type { PlatformId } from '../../types/platform';
import { groupExtras } from '../../lib/extras';
import { isLaunchableExtra } from '../../lib/extras';
import { PLATFORM_PROFILES, supportsEmbeddedEmulation } from '../../lib/platform-capabilities';
import { ImageSlider } from '../ImageSlider';
import { ExtrasDetail, type ExtrasBigscreenNavigation } from '../ExtrasDetail';
import { MusicianPhoto } from '../MusicianPhoto';
import { MusicPlayer } from '../MusicPlayer';
import { StatusRow } from '../StatusRow';
import { PlayButton } from '../themes/PlayButton';
import { DetailGameTitle } from './DetailGameTitle';
import { DetailTitleBanner } from './DetailTitleBanner';
import type { DetailFullscreenRequest, DetailLayoutProps } from '../DetailView';
import { useResolvedBoxArtUrl } from '../../hooks/useResolvedBoxArtUrl';
import { C64ShaderBackground } from './C64ShaderBackground';
import { useTheme } from '../../contexts/ThemeContext';
import type { DetailZone } from '../../hooks/useDetailNavigation';

type UnifiedDetailTab = 'game' | 'extras';

interface LaunchVersionOption {
  id: string;
  label: string;
  relativePath: string | null;
  source: 'extras' | 'roms';
  subtitle: string;
  tag: string;
}

type VersionVisualKind = 'default' | 'tape' | 'disk' | 'cart';

const VERSION_STORAGE_KEY = 'gb64_selected_launch_versions';

function getPlayerLabel(game: Game) {
  const from = cleanMetadataValue(game.playersFrom);
  const to = cleanMetadataValue(game.playersTo);
  const simultaneous = cleanMetadataValue(game.playersSim);
  if (from && to) {
    return from === to ? from : `${from}-${to}`;
  }
  return simultaneous ?? from ?? to ?? '1';
}

function getPlayersDetailLabel(game: Game) {
  const label = getPlayerLabel(game);
  return label === '1' ? '1 Player' : `${label} Players`;
}

function getArchiveNotes(game: Game) {
  return cleanMetadataValue(game.memo)
    ?? cleanMetadataValue(game.comment)
    ?? 'Curated metadata, artwork, soundtrack, and alternate versions live together here for quick browsing.';
}

function openScreenshotFullscreen(
  screenshotFilename: string | null,
  onFullscreen: (media: DetailFullscreenRequest) => void,
) {
  if (screenshotFilename) {
    onFullscreen({ kind: 'screenshot', filename: screenshotFilename });
  }
}

function openBoxArtFullscreen(
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

function getMusicGlyph(platformId: PlatformId) {
  if (platformId === 'c64') return 'SID';
  if (platformId === 'atari800') return 'SAP';
  return 'MUS';
}

function buildPersonnel(game: Game, platformId: PlatformId) {
  const items = [
    { label: 'Developer', value: cleanMetadataValue(game.developer?.name), glyph: 'DEV' },
    { label: 'Publisher', value: cleanMetadataValue(game.publisher?.name), glyph: 'PUB' },
    { label: 'Coder', value: cleanMetadataValue(game.coderName), glyph: 'COD' },
    { label: 'Graphics', value: cleanMetadataValue(game.graphicsName), glyph: 'ART' },
    { label: 'Music', value: cleanMetadataValue(game.musician?.name), glyph: getMusicGlyph(platformId) },
  ];
  return items.filter((item): item is typeof items[number] & { value: string } => Boolean(item.value));
}

function formatVersionLabel(game: Game) {
  const palNtsc = cleanMetadataValue(game.vPalNtsc);
  if (palNtsc) return palNtsc;
  if (game.isPal && game.isNtsc) return 'PAL / NTSC';
  if (game.isPal) return 'PAL';
  if (game.isNtsc) return 'NTSC';
  return 'Primary';
}

function readStoredVersionId(gameId: number) {
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

function persistSelectedVersion(gameId: number, versionId: string) {
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

function buildVersions(game: Game, launchableExtras: Extra[]): LaunchVersionOption[] {
  return [
    {
      id: 'primary',
      tag: formatVersionLabel(game),
      label: cleanMetadataValue(game.versionBy) ?? 'Primary Archive Build',
      relativePath: game.filename || game.gameFilename || null,
      source: 'roms',
      subtitle: cleanMetadataValue(game.vLength) ? `${game.vLength} Blocks` : 'Main release package',
    },
    ...launchableExtras.slice(0, 3).map((extra) => ({
      id: extra.id,
      tag: extra.path.split(/[\\/]/)[0] || 'Extras',
      label: extra.name,
      relativePath: extra.path,
      source: 'extras' as const,
      subtitle: extra.path,
    })),
  ];
}

function getVersionVisualKind(version: LaunchVersionOption): VersionVisualKind {
  if (version.source === 'roms') {
    return 'default';
  }
  const combined = `${version.tag} ${version.subtitle}`.toLowerCase();
  if (combined.includes('tape')) return 'tape';
  if (combined.includes('disk')) return 'disk';
  if (combined.includes('cart')) return 'cart';
  return 'default';
}

function getVersionVisualLabel(kind: VersionVisualKind) {
  switch (kind) {
    case 'default':
      return { badge: 'DEF', label: 'Default' };
    case 'tape':
      return { badge: 'TAP', label: 'Tape' };
    case 'disk':
      return { badge: 'DSK', label: 'Disk' };
    case 'cart':
      return { badge: 'CRT', label: 'Cart' };
  }
}

function VersionGlyph({
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
          <circle cx="16" cy="20.5" r="1" {...common} />
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

interface InfoDensity {
  gap: number;
  labelFontSize: number;
  paddingY: number;
  valueFontSize: number;
}

function InfoRow({
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

function SectionHeading({
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

function clampTextLines(lineClamp: number) {
  return {
    WebkitBoxOrient: 'vertical' as const,
    WebkitLineClamp: lineClamp,
    display: '-webkit-box',
    overflow: 'hidden',
  };
}

export function UnifiedDetailLayout({
  game,
  onBack,
  nav,
  onFullscreen,
  isFavorite,
  onToggleFavorite,
  fullscreenLayout,
}: DetailLayoutProps) {
  const { settings, resolveMediaPath, markAsPlayed } = useSettings();
  const canPlayEmbedded = supportsEmbeddedEmulation(settings.activePlatformId);
  const { theme } = useTheme();
  const [extras, setExtras] = useState<Extra[]>([]);
  const [activeTab, setActiveTab] = useState<UnifiedDetailTab>('game');
  const [selectedVersionId, setSelectedVersionId] = useState(() => readStoredVersionId(game.id));
  const extrasNavigationRef = useRef<ExtrasBigscreenNavigation | null>(null);

  // A configuration flag to enable flush-height scaling (sits perfectly flush at the bottom of 720p/1080p/4K viewports)
  // Set to true to make the page sit flush, or false to revert to fixed heights.
  const FLUSH_HEIGHT_SCALING = true;

  // Arcade Void Tabbed Sidebar State & Refs
  const [activeSidebarTab, setActiveSidebarTab] = useState<'notes' | 'credits' | 'files'>('files');
  const [focusedFileIndex, setFocusedFileIndex] = useState(0);
  const sidebarNotesScrollRef = useRef<HTMLDivElement | null>(null);
  const sidebarCreditsScrollRef = useRef<HTMLDivElement | null>(null);
  
  const boxArtUrl = useResolvedBoxArtUrl(game);
  const showBoxArtPanel = Boolean(boxArtUrl);

  const isC64 = theme.id === 'c64-edition';
  const isCyberpunk = theme.id === 'cyberpunk-crt';
  const isArcade = theme.id === 'arcade-void';

  // Apply bevel styles for C64, stepped-borders, or standard borders
  const panelCls = useMemo(() => {
    let base = "theme-panel relative rounded-theme-lg backdrop-blur-xl flex flex-col min-h-0 ";
    if (isC64) {
      base += "border-8 border-t-theme-secondary border-l-theme-secondary border-b-theme-outline-variant border-r-theme-outline-variant";
    } else if (theme.effects.steppedBorders) {
      base += "stepped-border";
    } else {
      base += "border border-theme-outline";
    }
    return base;
  }, [isC64, theme.effects.steppedBorders]);

  const insetPanelCls = useMemo(() => {
    let base = "relative rounded-theme-md flex flex-col min-h-0 ";
    if (isC64) {
      base += "border-8 border-t-theme-outline-variant border-l-theme-outline-variant border-b-theme-secondary border-r-theme-secondary bg-black/40";
    } else if (theme.effects.steppedBorders) {
      base += "stepped-border bg-black/35";
    } else {
      base += "border border-theme-outline-variant bg-black/35";
    }
    return base;
  }, [isC64, theme.effects.steppedBorders]);

  // Gallery view available media selection
  const availableMedia = useMemo(() => {
    const items: Array<{ id: string; label: string; filename: string | null }> = [
      { id: 'gameplay', label: 'Gameplay', filename: game.screenshotFilename },
    ];
    if (game.titlescreenFilename) {
      items.push({ id: 'titlescreen', label: 'Title', filename: game.titlescreenFilename });
    }
    if (game.videoSnapFilename) {
      items.push({ id: 'videosna', label: 'Video', filename: game.videoSnapFilename });
    }
    if (showBoxArtPanel) {
      items.push({ id: 'boxfront', label: 'Box Art', filename: game.boxFrontFilename ?? game.coverPath ?? null });
    }
    return items;
  }, [game, showBoxArtPanel]);

  const [selectedMedia, setSelectedMedia] = useState<string>('gameplay');
  const focusedMedia = nav.focusedZone.replace('media-', '');
  const activeMedia = availableMedia.some(m => m.id === focusedMedia) ? focusedMedia : selectedMedia;

  useEffect(() => {
    let cancelled = false;
    getGameExtras(game.id, settings.activePlatformId).then((items) => {
      if (!cancelled) {
        setExtras(items);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [game.id, settings.activePlatformId]);

  const groupedExtras = useMemo(() => groupExtras(extras), [extras]);
  const launchableExtras = useMemo(
    () => (groupedExtras.find((group) => group.category === 'games')?.items ?? []).filter(isLaunchableExtra),
    [groupedExtras],
  );
  const archiveExtras = useMemo(
    () => groupedExtras.filter((group) => group.category !== 'games').flatMap((group) => group.items),
    [groupedExtras],
  );

  const availableTabs = useMemo(() => {
    const tabs: UnifiedDetailTab[] = ['game'];
    if (archiveExtras.length > 0) tabs.push('extras');
    return tabs;
  }, [archiveExtras.length]);

  const visibleTab = availableTabs.includes(activeTab) ? activeTab : 'game';
  const galleryFocusZone = 'media-gameplay';

  const selectTab = useCallback((tab: UnifiedDetailTab) => {
    setActiveTab(tab);
    nav.setFocusedZone(tab === 'game' ? galleryFocusZone : 'media-extras');
  }, [galleryFocusZone, nav]);

  const cycleTab = useCallback((direction: 'previous' | 'next') => {
    if (availableTabs.length <= 1) return;
    const currentIndex = availableTabs.indexOf(visibleTab);
    const delta = direction === 'next' ? 1 : -1;
    const nextIndex = (currentIndex + delta + availableTabs.length) % availableTabs.length;
    selectTab(availableTabs[nextIndex]);
  }, [availableTabs, selectTab, visibleTab]);

  const archiveNotes = getArchiveNotes(game);
  const versions = buildVersions(game, launchableExtras);
  const selectedVersion = versions.find((version) => version.id === selectedVersionId) ?? versions[0] ?? null;
  const versionIds = versions.map((version) => version.id);
  const versionIdsKey = versionIds.join('|');
  const detailLayout = fullscreenLayout?.detailLayoutSpec;
  const versionColumns = Math.min(versions.length, detailLayout?.alternativeColumns ?? 4);
  const personnel = buildPersonnel(game, settings.activePlatformId);
  const useStackedColumns = detailLayout?.useStackedColumns ?? false;
  const shellMaxWidth = detailLayout?.shellMaxWidth ?? 1480;
  const panelGap = detailLayout?.panelGap ?? 16;
  const panelPadding = detailLayout?.panelPadding ?? 14;
  const panelInnerGap = detailLayout?.panelInnerGap ?? panelGap;
  const heroPaddingX = detailLayout?.panelPadding ?? 18;
  const heroPaddingY = detailLayout?.panelPadding ?? 18;
  const heroMinHeight = detailLayout?.heroHeight ?? 280;
  const detailTitleMax = detailLayout?.titleSize ?? 50;
  const compactButtons = (detailLayout?.sidCompact ?? Boolean(fullscreenLayout)) || settings.isFullscreen;
  const sidebarWidth = detailLayout?.sidebarWidth ?? 320;
  const topBarPaddingX = detailLayout?.topBarPaddingX ?? 18;
  const topBarPaddingY = detailLayout?.topBarPaddingY ?? 10;
  const topBarHeight = detailLayout?.topBarHeight ?? 78;
  const mediaRowHeight = detailLayout?.mediaRowHeight ?? 320;
  const lowerRowHeight = detailLayout?.lowerRowHeight ?? 240;
  const mainColumnHeight = mediaRowHeight + lowerRowHeight + panelGap;
  const designWidth = detailLayout?.designWidth ?? shellMaxWidth;
  const designHeight = detailLayout?.designHeight ?? 900;
  const renderScale = detailLayout?.renderScale ?? 1;
  const surfaceWidth = detailLayout?.surfaceWidth ?? designWidth * renderScale;
  const surfaceHeight = detailLayout?.surfaceHeight ?? designHeight * renderScale;
  const showSoundtrack = PLATFORM_PROFILES[settings.activePlatformId]?.mediaCapabilities.music !== 'none';
  const sidebarTrackHeights = (() => {
    const raw = detailLayout?.sidebarRowHeights ?? [170, 150, 240, 220];
    if (!showSoundtrack) {
      const copy = [...raw];
      copy.splice(1, 1);
      return copy;
    }
    return raw;
  })();
  const sidebarTemplateRows = sidebarTrackHeights.map((value) => `${value}px`).join(' ');
  const infoDensity: InfoDensity = {
    gap: detailLayout?.infoRowGap ?? 12,
    labelFontSize: detailLayout?.infoLabelFontSize ?? 10,
    paddingY: detailLayout?.infoRowPaddingY ?? 5,
    valueFontSize: detailLayout?.infoValueFontSize ?? 13,
  };
  const compactLowerPanelGap = Math.max(8, panelInnerGap - 6);
  const compactLowerPanelPadding = Math.max(10, panelPadding - 4);
  const compactInnerCardPadding = Math.max(8, panelPadding - 6);
  const alternativeButtonSize = detailLayout?.alternativeIconButtonSize ?? 46;
  const alternativeGlyphSize = detailLayout?.alternativeIconGlyphSize ?? 28;
  const largePanelFocusCls = nav.isFocused('media-extras')
    ? 'relative z-30 ring-2 ring-inset ring-theme-primary brightness-110 shadow-[0_0_18px_var(--theme-primary)]'
    : '';
  const sidebarStatusColumns = detailLayout?.statusColumns ?? 2;
  const screenshotFilename = game.screenshotFilename ?? null;
  const boxFrontFilename = game.boxFrontFilename ?? null;
  const heroMeta = Array.from(new Set([
    game.year ? String(game.year) : null,
    cleanMetadataValue(game.parentGenre),
    ...getGameStudios(game),
  ].filter((value): value is string => Boolean(value)).map((value) => value.trim()).filter(Boolean)));
  const heroSupplementalMeta = Array.from(new Set([
    cleanMetadataValue(game.subGenre),
    cleanMetadataValue(game.control),
    getPlayersDetailLabel(game),
  ].filter((value): value is string => Boolean(value)).map((value) => value.trim()).filter(Boolean))).filter(
    (value) => !heroMeta.some((chip) => chip.toLowerCase() === value.toLowerCase()),
  );

  const selectVersion = useCallback((versionId: string) => {
    setSelectedVersionId(versionId);
    persistSelectedVersion(game.id, versionId);
  }, [game.id]);

  const handleLaunchVersion = useCallback(async (version: LaunchVersionOption) => {
    if (!version.relativePath) return;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('game-launch'));
    }

    try {
      await launchEmulator(buildLaunchRequest(settings, version.source, version.relativePath, game));
      markAsPlayed(game.id.toString());
    } catch (err) {
      console.error('Failed to launch emulator from files list:', err);
    }
  }, [settings, game, markAsPlayed]);

  const handleFullscreenMedia = useCallback(() => {
    const activeObj = availableMedia.find(m => m.id === activeMedia);
    if (!activeObj) return;

    if (activeMedia === 'boxfront') {
      openBoxArtFullscreen(game.name, boxArtUrl || '', boxFrontFilename, onFullscreen);
    } else if (activeMedia === 'videosna') {
      if (screenshotFilename) {
        onFullscreen({ kind: 'screenshot', filename: screenshotFilename });
      }
    } else {
      openScreenshotFullscreen(activeObj.filename, onFullscreen);
    }
  }, [activeMedia, availableMedia, boxArtUrl, boxFrontFilename, game.name, onFullscreen, screenshotFilename]);

  const cycleSidebarTab = useCallback((dir: 'left' | 'right') => {
    const tabs: Array<'notes' | 'credits' | 'files'> = ['files', 'notes', 'credits'];
    const currentIndex = tabs.indexOf(activeSidebarTab);
    const delta = dir === 'right' ? 1 : -1;
    const nextIndex = (currentIndex + delta + tabs.length) % tabs.length;
    setActiveSidebarTab(tabs[nextIndex]);
  }, [activeSidebarTab]);

  useEffect(() => {
    if (!isC64) return;

    const handleFKeys = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      if (e.key === 'F1') {
        e.preventDefault();
        setActiveSidebarTab('files');
        nav.setFocusedZone('sidebar-tabs');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setActiveSidebarTab('notes');
        nav.setFocusedZone('sidebar-tabs');
      } else if (e.key === 'F5') {
        e.preventDefault();
        setActiveSidebarTab('credits');
        nav.setFocusedZone('sidebar-tabs');
      }
    };

    window.addEventListener('keydown', handleFKeys);
    return () => window.removeEventListener('keydown', handleFKeys);
  }, [isC64, nav]);

  const renderArcadeSidebar = () => {
    return (
      <aside className="flex flex-col min-h-0 h-full shrink-0" style={{ gap: panelGap, width: `${sidebarWidth}px` }}>
        {showSoundtrack && (
          <section className={panelCls + " shrink-0"}>
            <div className="flex h-full min-h-0 flex-col" style={{ gap: Math.max(6, panelInnerGap - 8), padding: Math.max(8, panelPadding - 4) }}>
              <SectionHeading title="Soundtrack Module" />
              {game.musician ? (
                <div className="flex items-center gap-2">
                  {PLATFORM_PROFILES[settings.activePlatformId]?.mediaCapabilities.photos ? (
                    <MusicianPhoto
                      className="shrink-0"
                      musicianName={game.musician.name}
                      photoFilename={game.musician.photoPath}
                      style={{ height: `${Math.max(28, (detailLayout?.musicianAvatarSize ?? 40) - 8)}px`, width: `${Math.max(28, (detailLayout?.musicianAvatarSize ?? 40) - 8)}px` }}
                    />
                  ) : null}
                  <div className="min-w-0">
                    <div className="truncate font-black text-theme-text" style={{ fontSize: `${Math.max(11, (detailLayout?.infoValueFontSize ?? 13) - 1)}px` }}>{game.musician.name}</div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-theme-text-muted">
                      {settings.activePlatformId === 'c64' ? 'SID Composer' : 'Music Composer'}
                    </div>
                  </div>
                </div>
              ) : null}
              <div onMouseEnter={() => nav.hoverZone('sid')} className={nav.focusCls('sid')}>
                <MusicPlayer platformId={settings.activePlatformId} filename={game.sidFilename} compact={true} />
              </div>
            </div>
          </section>
        )}

        <section className={panelCls + " shrink-0"}>
          <div className="flex h-full min-h-0 flex-col" style={{ gap: Math.max(10, panelPadding - 2), padding: panelPadding }}>
            <SectionHeading title="Version Details" />
            <div className="grid gap-1.5 mt-2">
              <InfoRow label="Version By" value={cleanMetadataValue(game.versionBy) ?? 'Unknown'} layout={infoDensity} />
              <InfoRow label="PAL/NTSC" value={cleanMetadataValue(game.vPalNtsc) ?? formatVersionLabel(game)} layout={infoDensity} />
              <InfoRow label="Size" value={cleanMetadataValue(game.vLength) ? `${game.vLength} Blocks` : 'Unknown'} layout={infoDensity} />
              <InfoRow label="Trainers" value={cleanMetadataValue(game.vTrainers) ?? '0'} layout={infoDensity} />
            </div>
            <div
              className="grid rounded-theme-md border border-theme-primary/20 bg-black/20 mt-3"
              style={{
                columnGap: 10,
                gridTemplateColumns: `repeat(${sidebarStatusColumns}, minmax(0,1fr))`,
                padding: Math.max(8, panelPadding - 2),
                rowGap: 6,
              }}
            >
              <StatusRow label="Loading Screen" value={game.vLoadingScreen} />
              <StatusRow label="High Score Saver" value={game.vHighScoreSaver} />
              <StatusRow label="Included Docs" value={game.vIncludedDocs} />
              <StatusRow label="True Drive Emul" value={game.vTrueDriveEmu} />
            </div>
          </div>
        </section>

        {/* Tabbed Panel */}
        <section className={panelCls + " flex-1 min-h-0 flex flex-col"}>
          <div className="flex border-b border-theme-outline/20 shrink-0 select-none">
            <button
              type="button"
              onClick={() => {
                setActiveSidebarTab('files');
                nav.setFocusedZone('sidebar-tabs');
              }}
              onMouseEnter={() => nav.hoverZone('sidebar-tabs')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] border-r border-theme-outline/20 text-center transition-colors ${
                activeSidebarTab === 'files'
                  ? 'bg-theme-primary/10 border-t-2 border-t-theme-primary text-theme-primary'
                  : 'bg-black/10 text-theme-text-muted hover:bg-black/20 hover:text-theme-text'
              } ${nav.focusedZone === 'sidebar-tabs' && activeSidebarTab === 'files' ? 'outline-none ring-2 ring-inset ring-theme-tertiary' : ''}`}
            >
              FILES
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSidebarTab('notes');
                nav.setFocusedZone('sidebar-tabs');
              }}
              onMouseEnter={() => nav.hoverZone('sidebar-tabs')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] border-r border-theme-outline/20 text-center transition-colors ${
                activeSidebarTab === 'notes'
                  ? 'bg-theme-primary/10 border-t-2 border-t-theme-primary text-theme-primary'
                  : 'bg-black/10 text-theme-text-muted hover:bg-black/20 hover:text-theme-text'
              } ${nav.focusedZone === 'sidebar-tabs' && activeSidebarTab === 'notes' ? 'outline-none ring-2 ring-inset ring-theme-tertiary' : ''}`}
            >
              NOTES
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSidebarTab('credits');
                nav.setFocusedZone('sidebar-tabs');
              }}
              onMouseEnter={() => nav.hoverZone('sidebar-tabs')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-center transition-colors ${
                activeSidebarTab === 'credits'
                  ? 'bg-theme-primary/10 border-t-2 border-t-theme-primary text-theme-primary'
                  : 'bg-black/10 text-theme-text-muted hover:bg-black/20 hover:text-theme-text'
              } ${nav.focusedZone === 'sidebar-tabs' && activeSidebarTab === 'credits' ? 'outline-none ring-2 ring-inset ring-theme-tertiary' : ''}`}
            >
              CREDITS
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3">
            {activeSidebarTab === 'files' && (
              <div className="space-y-2" id="sidebar-files-container">
                {versions.map((version, index) => {
                  const isSelected = selectedVersionId === version.id;
                  const isFocused = nav.isFocused('sidebar-content') && focusedFileIndex === index;
                  return (
                    <button
                      key={version.id}
                      type="button"
                      onClick={() => {
                        selectVersion(version.id);
                        setFocusedFileIndex(index);
                        nav.setFocusedZone('sidebar-content');
                      }}
                      onMouseEnter={() => {
                        setFocusedFileIndex(index);
                        nav.hoverZone('sidebar-content');
                      }}
                      className={`w-full p-2.5 rounded-lg border text-left flex justify-between items-center transition-all ${
                        isSelected
                          ? 'bg-theme-primary/10 border-theme-primary/40 text-theme-primary'
                          : 'bg-black/20 border-theme-outline/30 text-theme-text-muted hover:border-theme-outline/65 hover:text-theme-text'
                      } ${
                        isFocused
                          ? 'ring-2 ring-[var(--theme-tertiary)] shadow-[0_0_12px_var(--theme-tertiary)] scale-[1.01] brightness-110 z-10'
                          : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate text-theme-text">{version.label}</div>
                        <div className="text-[9px] uppercase tracking-wider text-theme-text-muted truncate mt-0.5">
                          {version.subtitle}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className="text-[9px] font-mono border border-theme-outline/50 px-1 rounded text-theme-text-muted">
                          {version.tag}
                        </span>
                        {isSelected && (
                          <span className="text-[8px] bg-theme-primary text-[#00363e] px-1 py-0.5 rounded font-black uppercase tracking-wider">
                            ACT
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {activeSidebarTab === 'notes' && (
              <div
                ref={sidebarNotesScrollRef}
                className="text-theme-text/85 overflow-y-auto custom-scrollbar leading-relaxed h-full"
                style={{
                  fontSize: `${detailLayout?.notesFontSize ?? 13}px`,
                }}
              >
                {archiveNotes}
              </div>
            )}

            {activeSidebarTab === 'credits' && (
              <div
                ref={sidebarCreditsScrollRef}
                className="space-y-1.5 overflow-y-auto custom-scrollbar h-full"
              >
                {personnel.length > 0 ? (
                  personnel.map((entry) => (
                    <div key={`${entry.label}-${entry.value}`} className="flex justify-between border-b border-theme-outline/20 pb-1 text-xs">
                      <span className="font-mono uppercase tracking-wider text-theme-text-muted text-[10px]">{entry.label}</span>
                      <span className="font-bold text-theme-primary text-[12px]">{entry.value}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-theme-text-muted">No credits metadata available.</div>
                )}
              </div>
            )}
          </div>
        </section>
      </aside>
    );
  };

  const renderC64Layout = () => {
    const loadCommand = `LOAD "${game.name.substring(0, 16).replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}",8,1`;
    const publisher = cleanMetadataValue(game.publisher?.name) || 'UNKNOWN';
    const developer = cleanMetadataValue(game.developer?.name) || 'UNKNOWN';
    const year = game.year || '----';
    const genre = [game.parentGenre, game.subGenre].filter(Boolean).join(' / ') || 'GENRE';
    const metadataStr = `PUBLISHER: ${publisher} _ DEVELOPER: ${developer} // ${year} // ${genre}`;
    
    return (
      <div className="grid h-full min-h-0" style={{ gap: panelGap, gridTemplateRows: `auto minmax(0, 1fr)` }}>
        
        {/* Game Title Header (Internal retro monitor bezel header) */}
        <div className="p-4 border-8 border-t-theme-secondary border-l-theme-secondary border-b-theme-outline-variant border-r-theme-outline-variant bg-[#1f1f1f] flex items-center justify-between shrink-0 select-none">
          <div className="flex flex-col min-w-0 flex-1 pr-4">
            <h1 className="font-mono text-2xl font-black text-theme-primary tracking-tighter uppercase leading-none truncate flex items-center gap-2">
              <span>{game.name}</span>
              {game.isClassic && <span title="Legendary Classic" className="text-xl">🏆</span>}
            </h1>
            <p className="font-mono text-[10px] text-theme-text-muted mt-1.5 uppercase font-bold tracking-wider">{loadCommand}</p>
            <p className="font-mono text-[10px] text-theme-text mt-2 uppercase font-bold tracking-wide border-t border-theme-outline-variant/30 pt-1.5 truncate">
              {metadataStr}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 font-mono shrink-0">
            <div className="flex items-center gap-1 bg-theme-primary px-2 py-0.5 text-black font-black text-[10px] uppercase font-bold">
              READY. <span className="theme-cursor-blink"></span>
            </div>
            <div className="text-[8px] text-theme-text-muted opacity-70">SYS 64738</div>
          </div>
        </div>

        {/* Two-Column Grid */}
        <div className="grid min-h-0 items-stretch pb-16" style={{ gap: panelGap, gridTemplateColumns: `minmax(0, 1.4fr) 1fr` }}>
          
          {/* Left Column (Play buttons + Hero/Extras Viewport) */}
          <div className="flex flex-col min-h-0" style={{ gap: panelGap }}>
            {/* Retro Bevel Play Buttons */}
            <div className="flex gap-4 shrink-0 font-mono">
              <button
                type="button"
                id="play-game-btn"
                onClick={() => handleLaunchVersion(selectedVersion)}
                onMouseEnter={() => nav.hoverZone('play')}
                className={`flex-1 py-3 px-4 flex items-center justify-between transition-all cursor-pointer border-6 text-xs font-bold uppercase ${
                  nav.isFocused('play')
                    ? 'bg-theme-tertiary border-t-white border-l-white border-b-black border-r-black text-black font-black'
                    : 'bg-theme-primary border-t-white border-l-white border-b-[#07006c] border-r-[#07006c] text-[#1100a9]'
                }`}
              >
                <span className="flex items-center gap-1.5">🚀 LAUNCH EMULATOR</span>
                <span className="text-[9px] opacity-75">{settings.activePlatformId.toUpperCase()}</span>
              </button>

              {canPlayEmbedded && (
                <button
                  type="button"
                  id="play-browser-btn"
                  onClick={() => document.getElementById('play-browser-btn-hidden')?.click()}
                  onMouseEnter={() => nav.hoverZone('play-web')}
                  className={`flex-1 py-3 px-4 flex items-center justify-between transition-all cursor-pointer border-6 text-xs font-bold uppercase ${
                    nav.isFocused('play-web')
                      ? 'bg-theme-tertiary border-t-white border-l-white border-b-black border-r-black text-black font-black'
                      : 'bg-[#1f1f1f] border-t-theme-primary border-l-theme-primary border-b-black border-r-black text-theme-primary'
                  }`}
                >
                  <span className="flex items-center gap-1.5">🎮 PLAY BROWSER</span>
                  <span className="text-[9px] opacity-75">EMBEDDED</span>
                </button>
              )}
              {/* Hidden plays in default render DOM to link correctly */}
              <div style={{ display: 'none' }}>
                <button id="play-browser-btn-hidden" onClick={() => handleLaunchVersion(selectedVersion)} />
              </div>
            </div>

            {visibleTab === 'game' ? (
              /* Hero container */
              <div className="flex-1 min-h-0 overflow-hidden bg-black relative border-8 border-t-theme-secondary border-l-theme-secondary border-b-theme-outline-variant border-r-theme-outline-variant">
                {activeMedia === 'videosna' && game.videoSnapFilename ? (
                  <video
                    autoPlay
                    className="h-full w-full object-contain"
                    loop
                    muted
                    playsInline
                    src={resolveMediaPath('screenshot', game.videoSnapFilename)}
                  />
                ) : activeMedia === 'boxfront' ? (
                  boxArtUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={boxArtUrl}
                      alt={`${game.name} box art`}
                      className="h-full w-full object-contain mx-auto"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center font-mono text-xs text-theme-text-muted">NO COVER IMAGE</div>
                  )
                ) : (
                  <ImageSlider
                    type="screenshot"
                    filename={activeMedia === 'titlescreen' ? game.titlescreenFilename : game.screenshotFilename}
                    alt={game.name}
                    className="h-full w-full object-contain"
                  />
                )}
                
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent">
                  <span className="font-mono text-[10px] text-theme-tertiary uppercase font-bold tracking-wider">
                    DEVELOPER: {cleanMetadataValue(game.developer?.name) || 'UNKNOWN'}
                  </span>
                </div>
              </div>
            ) : (
              /* Extras Viewport */
              <div
                onMouseEnter={() => nav.hoverZone('media-extras')}
                className={`flex-1 min-h-0 overflow-hidden bg-black flex flex-col p-4 border-8 border-t-theme-secondary border-l-theme-secondary border-b-theme-outline-variant border-r-theme-outline-variant ${
                  nav.isFocused('media-extras') ? 'ring-2 ring-theme-primary' : ''
                }`}
              >
                <div className="flex items-center justify-between border-b-4 border-theme-outline-variant pb-1.5 mb-2 select-none font-mono">
                  <span className="text-[10px] font-bold text-theme-primary">SYSTEM // EXTRAS & DOCUMENTATION</span>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar font-mono">
                  <ExtrasDetail
                    game={game}
                    extras={archiveExtras}
                    visibleCategories={['visual', 'docs', 'media']}
                    hideEmptyState
                    enableBigscreenGalleryUX={true}
                    layoutSpec={detailLayout}
                    onRegisterBigscreenNavigation={(navigation) => {
                      extrasNavigationRef.current = navigation;
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column (Gallery + Soundtrack + Sidebar tabbed content) */}
          <div className="flex flex-col min-h-0" style={{ gap: panelGap }}>
            
            {/* Gallery Row */}
            <div className="h-[76px] grid grid-cols-4 gap-2 shrink-0 select-none">
              {availableMedia.map((mediaItem) => {
                const zone = ('media-' + mediaItem.id) as DetailZone;
                const isActive = activeMedia === mediaItem.id;
                
                return (
                  <button
                    key={mediaItem.id}
                    type="button"
                    onClick={() => setSelectedMedia(mediaItem.id)}
                    onMouseEnter={() => nav.hoverZone(zone)}
                    className={`h-full overflow-hidden bg-black flex items-center justify-center transition-all cursor-pointer ${
                      isActive
                        ? 'border-4 border-theme-tertiary scale-102 ring-2 ring-theme-primary'
                        : 'border-4 border-theme-outline-variant hover:border-theme-primary/60'
                    } ${nav.isFocused(zone) ? 'border-4 border-theme-tertiary brightness-110' : ''}`}
                  >
                    {mediaItem.id === 'videosna' && game.videoSnapFilename ? (
                      <div className="text-[9px] font-mono font-bold text-theme-primary leading-none">VIDEO</div>
                    ) : mediaItem.id === 'boxfront' ? (
                      boxArtUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={boxArtUrl} alt="Cover preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-[9px] font-mono font-bold text-theme-text-muted leading-none">COVER</div>
                      )
                    ) : (
                      <ImageSlider
                        type="screenshot"
                        filename={mediaItem.id === 'titlescreen' ? game.titlescreenFilename : game.screenshotFilename}
                        alt="Gallery preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Soundtrack Module */}
            {showSoundtrack && (
              <div onMouseEnter={() => nav.hoverZone('sid')} className={`shrink-0 ${nav.focusCls('sid')}`}>
                <MusicPlayer platformId={settings.activePlatformId} filename={game.sidFilename} compact={true} />
              </div>
            )}

            {/* Consolidated Tabbed Panel */}
            <div className="flex-1 min-h-0 flex flex-col bg-[#1f1f1f] border-8 border-t-theme-secondary border-l-theme-secondary border-b-theme-outline-variant border-r-theme-outline-variant">
              {/* Tabs Bar */}
              <div className="flex border-b-4 border-theme-outline-variant bg-[#131313] shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSidebarTab('files');
                    nav.setFocusedZone('sidebar-tabs');
                  }}
                  onMouseEnter={() => nav.hoverZone('sidebar-tabs')}
                  className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-center border-r-4 border-theme-outline-variant transition-colors cursor-pointer ${
                    activeSidebarTab === 'files'
                      ? 'bg-theme-secondary text-[#131313]'
                      : 'bg-[#131313] text-theme-primary hover:bg-[#1f1f1f]'
                  } ${nav.focusedZone === 'sidebar-tabs' && activeSidebarTab === 'files' ? 'outline-none ring-2 ring-inset ring-theme-tertiary' : ''}`}
                >
                  [F1] FILES
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSidebarTab('notes');
                    nav.setFocusedZone('sidebar-tabs');
                  }}
                  onMouseEnter={() => nav.hoverZone('sidebar-tabs')}
                  className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-center border-r-4 border-theme-outline-variant transition-colors cursor-pointer ${
                    activeSidebarTab === 'notes'
                      ? 'bg-theme-secondary text-[#131313]'
                      : 'bg-[#131313] text-theme-primary hover:bg-[#1f1f1f]'
                  } ${nav.focusedZone === 'sidebar-tabs' && activeSidebarTab === 'notes' ? 'outline-none ring-2 ring-inset ring-theme-tertiary' : ''}`}
                >
                  [F3] INFO
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSidebarTab('credits');
                    nav.setFocusedZone('sidebar-tabs');
                  }}
                  onMouseEnter={() => nav.hoverZone('sidebar-tabs')}
                  className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-center transition-colors cursor-pointer ${
                    activeSidebarTab === 'credits'
                      ? 'bg-theme-secondary text-[#131313]'
                      : 'bg-[#131313] text-theme-primary hover:bg-[#1f1f1f]'
                  } ${nav.focusedZone === 'sidebar-tabs' && activeSidebarTab === 'credits' ? 'outline-none ring-2 ring-inset ring-theme-tertiary' : ''}`}
                >
                  [F5] CREDITS
                </button>
              </div>

              {/* Content viewport */}
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 font-mono">
                
                {/* FILES TAB */}
                {activeSidebarTab === 'files' && (
                  <div className="space-y-1.5" id="sidebar-files-container">
                    {versions.map((version, index) => {
                      const isSelected = selectedVersionId === version.id;
                      const isFocused = nav.isFocused('sidebar-content') && focusedFileIndex === index;
                      
                      return (
                        <button
                          key={version.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              void handleLaunchVersion(version);
                            } else {
                              selectVersion(version.id);
                              setFocusedFileIndex(index);
                              nav.setFocusedZone('sidebar-content');
                            }
                          }}
                          onDoubleClick={() => {
                            void handleLaunchVersion(version);
                          }}
                          onMouseEnter={() => {
                            setFocusedFileIndex(index);
                            nav.hoverZone('sidebar-content');
                          }}
                          className={`w-full p-2 text-left flex justify-between items-center transition-all cursor-pointer border-4 text-xs ${
                            isSelected
                              ? 'bg-theme-secondary-container border-theme-primary text-theme-primary font-bold'
                              : 'bg-black/25 border-theme-outline-variant text-theme-text-muted hover:border-theme-primary/50 hover:text-theme-text'
                          } ${
                            isFocused
                              ? 'border-theme-tertiary bg-theme-primary/5 scale-[1.01] z-10'
                              : ''
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] font-bold truncate">{version.label}</div>
                            <div className="text-[9px] uppercase tracking-wider text-theme-text-muted truncate mt-0.5">
                              {version.subtitle}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <span className="text-[8px] border border-theme-outline/50 px-1 text-theme-text-muted">
                              {version.tag}
                            </span>
                            {isSelected && (
                              <span className="text-[8px] bg-theme-tertiary text-black px-1 font-bold">
                                ACT
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* INFO TAB */}
                {activeSidebarTab === 'notes' && (
                  <div className="flex flex-col h-full min-h-0" style={{ gap: panelGap }}>
                    {/* Technical stats grid */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-4 border-theme-outline-variant bg-[#131313] p-2 text-[10px]">
                      <div className="flex justify-between border-b border-theme-outline-variant pb-0.5">
                        <span className="text-theme-text-muted">PAL/NTSC:</span>
                        <span className="text-theme-primary font-bold">{(cleanMetadataValue(game.vPalNtsc) || formatVersionLabel(game)).toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between border-b border-theme-outline-variant pb-0.5">
                        <span className="text-theme-text-muted">SIZE:</span>
                        <span className="text-theme-primary font-bold">{cleanMetadataValue(game.vLength) ? `${game.vLength} BLKS` : 'UNKNOWN'}</span>
                      </div>
                      <div className="flex justify-between border-b border-theme-outline-variant pb-0.5">
                        <span className="text-theme-text-muted">TRAINERS:</span>
                        <span className="text-theme-primary font-bold">{cleanMetadataValue(game.vTrainers) || '0'}</span>
                      </div>
                      <div className="flex justify-between border-b border-theme-outline-variant pb-0.5">
                        <span className="text-theme-text-muted">LOAD SCR:</span>
                        <span className="text-theme-primary font-bold">{game.vLoadingScreen ? 'YES' : 'NO'}</span>
                      </div>
                      <div className="flex justify-between pb-0.5">
                        <span className="text-theme-text-muted">HI-SCORE:</span>
                        <span className="text-theme-primary font-bold">{game.vHighScoreSaver ? 'YES' : 'NO'}</span>
                      </div>
                      <div className="flex justify-between pb-0.5">
                        <span className="text-theme-text-muted">TRUE DRV:</span>
                        <span className="text-theme-primary font-bold">{game.vTrueDriveEmu ? 'YES' : 'NO'}</span>
                      </div>
                    </div>
                    {/* Notes text */}
                    <div
                      ref={sidebarNotesScrollRef}
                      className="text-theme-text/85 overflow-y-auto custom-scrollbar leading-relaxed text-[11px] select-text flex-1 font-mono uppercase"
                    >
                      <p className="text-theme-primary mb-2 font-bold">&gt;&gt; SYSTEM ARCHIVE MEMO:</p>
                      <p className="uppercase">{archiveNotes}</p>
                      <div className="mt-4 flex items-center gap-1">
                        <span className="w-1.5 h-3 bg-theme-primary theme-cursor-blink"></span>
                        <span className="text-[10px] text-theme-primary">SYSTEM_READY_FOR_BOOT</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* CREDITS TAB */}
                {activeSidebarTab === 'credits' && (
                  <div
                    ref={sidebarCreditsScrollRef}
                    className="space-y-1 overflow-y-auto custom-scrollbar h-full pr-1"
                  >
                    {personnel.length > 0 ? (
                      personnel.map((entry) => (
                        <div key={`${entry.label}-${entry.value}`} className="flex justify-between border-b border-theme-outline-variant pb-1.5 text-xs">
                          <span className="uppercase text-theme-text-muted text-[9px]">{entry.label}</span>
                          <span className="font-bold text-theme-primary text-[11px] uppercase">{entry.value}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-theme-text-muted">No credits metadata available.</div>
                    )}
                  </div>
                )}

              </div>
            </div>

          </div>

        </div>

      </div>
    );
  };

  useEffect(() => {
    nav.registerAction('play', () => document.getElementById('play-game-btn')?.click());
    nav.registerAction('play-web', () => document.getElementById('play-browser-btn')?.click());
    nav.registerAction('favorite', onToggleFavorite);
    nav.registerAction('sid', () => (document.getElementById('sid-play-btn') ?? document.getElementById('sap-play-btn'))?.click());
    
    // Register actions for all gallery items
    nav.registerAction('media-gameplay', handleFullscreenMedia);
    nav.registerAction('media-titlescreen', handleFullscreenMedia);
    nav.registerAction('media-videosna', handleFullscreenMedia);
    nav.registerAction('media-boxfront', handleFullscreenMedia);

    nav.registerAction('media-extras', () => {
      extrasNavigationRef.current?.activate();
    });
    nav.registerTabActions({
      previous: () => cycleTab('previous'),
      next: () => cycleTab('next'),
    });

    if (isArcade || isCyberpunk || isC64) {
      nav.registerAction('sidebar-tabs', () => undefined);
      nav.registerDirectionalOverride('sidebar-tabs', (direction) => {
        if (isCyberpunk) {
          if (direction === 'left') {
            if (activeSidebarTab === 'files') {
              setSelectedMedia('boxfront');
              nav.setFocusedZone('media-boxfront');
              return true;
            }
            cycleSidebarTab('left');
            return true;
          }
          if (direction === 'right') {
            if (activeSidebarTab === 'credits') {
              setSelectedMedia('gameplay');
              nav.setFocusedZone('media-gameplay');
              return true;
            }
            cycleSidebarTab('right');
            return true;
          }
        } else {
          if (direction === 'left') {
            cycleSidebarTab('left');
            return true;
          }
          if (direction === 'right') {
            cycleSidebarTab('right');
            return true;
          }
        }
        return false;
      });

      nav.registerDirectionalOverride('sidebar-content', (direction) => {
        if (isC64 && visibleTab === 'extras') {
          if (direction === 'left') {
            nav.setFocusedZone('media-extras');
            return true;
          }
        }

        if (isCyberpunk) {
          if (direction === 'left') {
            if (activeSidebarTab === 'files') {
              setSelectedMedia('boxfront');
              nav.setFocusedZone('media-boxfront');
              return true;
            }
          }
          if (direction === 'right') {
            if (activeSidebarTab === 'credits') {
              setSelectedMedia('gameplay');
              nav.setFocusedZone('media-gameplay');
              return true;
            }
          }
        }

        if (activeSidebarTab === 'files') {
          if (direction === 'up') {
            if (focusedFileIndex === 0) {
              nav.setFocusedZone('sidebar-tabs');
              return true;
            }
            setFocusedFileIndex((prev) => Math.max(0, prev - 1));
            return true;
          }
          if (direction === 'down') {
            if (focusedFileIndex === versions.length - 1) {
              if (showSoundtrack) {
                nav.setFocusedZone('sid');
                return true;
              }
            }
            setFocusedFileIndex((prev) => Math.min(versions.length - 1, prev + 1));
            return true;
          }
        } else {
          const container = activeSidebarTab === 'notes' ? sidebarNotesScrollRef.current : sidebarCreditsScrollRef.current;
          if (container) {
            if (direction === 'up') {
              if (container.scrollTop === 0) {
                nav.setFocusedZone('sidebar-tabs');
                return true;
              }
              container.scrollTop -= 24;
              return true;
            }
            if (direction === 'down') {
              const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 5;
              if (isAtBottom) {
                if (showSoundtrack) {
                  nav.setFocusedZone('sid');
                  return true;
                }
              } else {
                container.scrollTop += 24;
                return true;
              }
            }
          }
        }
        return false;
      });

      nav.registerAction('sidebar-content', () => {
        if (activeSidebarTab === 'files' && versions[focusedFileIndex]) {
          const version = versions[focusedFileIndex];
          if ((isCyberpunk || isC64) && selectedVersionId === version.id) {
            void handleLaunchVersion(version);
          } else {
            selectVersion(version.id);
          }
        }
      });

      if (isC64) {
        availableMedia.forEach((mediaItem, idx) => {
          const zoneName = `media-${mediaItem.id}` as DetailZone;
          nav.registerDirectionalOverride(zoneName, (direction) => {
            if (direction === 'left') {
              if (idx > 0) {
                const prevItem = availableMedia[idx - 1];
                setSelectedMedia(prevItem.id);
                nav.setFocusedZone(`media-${prevItem.id}` as DetailZone);
                return true;
              } else {
                nav.setFocusedZone('play');
                return true;
              }
            }
            if (direction === 'right') {
              if (idx < availableMedia.length - 1) {
                const nextItem = availableMedia[idx + 1];
                setSelectedMedia(nextItem.id);
                nav.setFocusedZone(`media-${nextItem.id}` as DetailZone);
                return true;
              } else {
                if (showSoundtrack) {
                  nav.setFocusedZone('sid');
                } else {
                  nav.setFocusedZone('sidebar-tabs');
                }
                return true;
              }
            }
            if (direction === 'down') {
              if (showSoundtrack) {
                nav.setFocusedZone('sid');
              } else {
                nav.setFocusedZone('sidebar-tabs');
              }
              return true;
            }
            return false;
          });
        });

        nav.registerDirectionalOverride('play', (direction) => {
          if (direction === 'right') {
            if (visibleTab === 'extras') {
              nav.setFocusedZone('media-extras');
              return true;
            }
            if (availableMedia.length > 0) {
              const activeObj = availableMedia.find(m => m.id === activeMedia) || availableMedia[0];
              nav.setFocusedZone(`media-${activeObj.id}` as DetailZone);
              return true;
            }
          }
          if (direction === 'down') {
            if (visibleTab === 'extras') {
              nav.setFocusedZone('media-extras');
              return true;
            }
            if (canPlayEmbedded) {
              nav.setFocusedZone('play-web');
              return true;
            } else {
              if (showSoundtrack) {
                nav.setFocusedZone('sid');
              } else {
                nav.setFocusedZone('sidebar-tabs');
              }
              return true;
            }
          }
          return false;
        });

        nav.registerDirectionalOverride('play-web', (direction) => {
          if (direction === 'right') {
            if (visibleTab === 'extras') {
              nav.setFocusedZone('media-extras');
              return true;
            }
            if (availableMedia.length > 0) {
              const activeObj = availableMedia.find(m => m.id === activeMedia) || availableMedia[0];
              nav.setFocusedZone(`media-${activeObj.id}` as DetailZone);
              return true;
            }
          }
          if (direction === 'down') {
            if (visibleTab === 'extras') {
              nav.setFocusedZone('media-extras');
              return true;
            }
            if (showSoundtrack) {
              nav.setFocusedZone('sid');
            } else {
              nav.setFocusedZone('sidebar-tabs');
            }
            return true;
          }
          return false;
        });

        nav.registerDirectionalOverride('sid', (direction) => {
          if (direction === 'left') {
            if (visibleTab === 'extras') {
              nav.setFocusedZone('media-extras');
              return true;
            } else {
              nav.setFocusedZone('play');
              return true;
            }
          }
          return false;
        });
      }
    } else {
      nav.registerAction('versions', () => undefined);
      nav.registerDirectionalOverride('versions', (direction) => {
        const currentIndex = Math.max(versionIds.indexOf(selectedVersionId), 0);
        if (direction === 'up') {
          const nextIndex = currentIndex - versionColumns;
          if (nextIndex >= 0) {
            selectVersion(versionIds[nextIndex]);
            return true;
          }
        }
        if (direction === 'down') {
          const nextIndex = currentIndex + versionColumns;
          if (nextIndex < versionIds.length) {
            selectVersion(versionIds[nextIndex]);
            return true;
          }
        }
        if (direction === 'left') {
          const nextIndex = currentIndex - 1;
          const sameRow = Math.floor(nextIndex / versionColumns) === Math.floor(currentIndex / versionColumns);
          if (nextIndex >= 0 && sameRow) {
            selectVersion(versionIds[nextIndex]);
            return true;
          }
        }
        if (direction === 'right') {
          const nextIndex = currentIndex + 1;
          const sameRow = Math.floor(nextIndex / versionColumns) === Math.floor(currentIndex / versionColumns);
          if (nextIndex < versionIds.length && sameRow) {
            selectVersion(versionIds[nextIndex]);
            return true;
          }
        }
        return false;
      });
    }

    if (isCyberpunk) {
      nav.registerDirectionalOverride('media-gameplay', (direction) => {
        if (direction === 'right') {
          setSelectedMedia('boxfront');
          nav.setFocusedZone('media-boxfront');
          return true;
        }
        return false;
      });
      nav.registerDirectionalOverride('media-titlescreen', (direction) => {
        if (direction === 'left') {
          setSelectedMedia('gameplay');
          nav.setFocusedZone('media-gameplay');
          return true;
        }
        if (direction === 'right') {
          setSelectedMedia('boxfront');
          nav.setFocusedZone('media-boxfront');
          return true;
        }
        return false;
      });
      nav.registerDirectionalOverride('media-videosna', (direction) => {
        if (direction === 'left') {
          setSelectedMedia('gameplay');
          nav.setFocusedZone('media-gameplay');
          return true;
        }
        if (direction === 'right') {
          setSelectedMedia('boxfront');
          nav.setFocusedZone('media-boxfront');
          return true;
        }
        return false;
      });
      nav.registerDirectionalOverride('media-boxfront', (direction) => {
        if (direction === 'left') {
          setSelectedMedia('gameplay');
          nav.setFocusedZone('media-gameplay');
          return true;
        }
        return false;
      });
    }

    nav.registerDirectionalOverride('media-extras', (direction) => {
      if (isC64) {
        if (direction === 'up') {
          nav.setFocusedZone(canPlayEmbedded ? 'play-web' : 'play');
          return true;
        }
        if (direction === 'right') {
          if (showSoundtrack) {
            nav.setFocusedZone('sid');
          } else {
            nav.setFocusedZone('sidebar-tabs');
          }
          return true;
        }
      }
      return extrasNavigationRef.current?.move(direction) ?? false;
    });
  }, [
    activeSidebarTab,
    cycleSidebarTab,
    cycleTab,
    focusedFileIndex,
    handleFullscreenMedia,
    isArcade,
    isCyberpunk,
    handleLaunchVersion,
    nav,
    onToggleFavorite,
    selectVersion,
    selectedVersionId,
    setSelectedMedia,
    showSoundtrack,
    versionColumns,
    versionIds,
    versionIdsKey,
    versions,
    isC64,
    visibleTab,
    activeMedia,
    availableMedia,
    canPlayEmbedded,
  ]);

  const bgStyle = useMemo(() => {
    if (isArcade) {
      return 'radial-gradient(circle at top, rgba(0, 227, 253, 0.12), transparent 28%), radial-gradient(circle at bottom right, rgba(129, 236, 255, 0.1), transparent 24%), linear-gradient(180deg, #050a11 0%, #09111a 44%, #050a10 100%)';
    }
    return undefined;
  }, [isArcade]);

  return (
    <div
      className="relative isolate h-full min-h-screen overflow-hidden text-theme-text font-sans selection:bg-theme-primary/30 selection:text-theme-text"
      style={{
        background: bgStyle,
        backgroundColor: isC64 ? 'transparent' : 'var(--theme-background)',
      }}
    >
      {isC64 && <C64ShaderBackground />}
      {/* Mesh lines for Arcade void, scanlines for Cyberpunk/others */}
      {isArcade && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.018) 0, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 100%), linear-gradient(180deg, rgba(255,255,255,0.018) 0, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 100%)',
            backgroundSize: '88px 88px',
            maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.5), rgba(0,0,0,0.12))',
          }}
        />
      )}

      {isCyberpunk && <div className="scanlines-overlay opacity-60"></div>}

      <div className="relative z-10 flex h-screen items-start justify-center overflow-hidden">
        <div
          className="relative"
          style={{
            height: `${surfaceHeight}px`,
            width: `${surfaceWidth}px`,
          }}
        >
          <div
            className="absolute left-0 top-0"
            style={{
              height: `${designHeight}px`,
              transform: `scale(${renderScale})`,
              transformOrigin: 'top left',
              width: `${designWidth}px`,
            }}
          >
            <header
              className={`relative z-10 border-b border-theme-outline/20 backdrop-blur-xl ${
                isC64 ? 'bg-theme-secondary/20' : 'bg-theme-background/88'
              }`}
              style={{ minHeight: topBarHeight }}
            >
              <div
                className="mx-auto flex h-full items-center gap-4"
                style={{ maxWidth: shellMaxWidth, paddingInline: topBarPaddingX, paddingBlock: topBarPaddingY }}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <button
                    onClick={onBack}
                    className={`rounded-theme-xl border border-theme-outline/30 bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-theme-text/70 transition-colors hover:border-theme-primary/60 hover:text-theme-text`}
                  >
                    Library
                  </button>
                  <div className="hidden h-8 w-px bg-theme-outline/20 md:block" />
                  <div className="flex min-w-0 flex-col">
                    <h1
                      className="font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-theme-primary to-theme-secondary leading-none"
                      style={{ fontSize: 'clamp(1.9rem,2.35vw,2.9rem)' }}
                    >
                      GBBox
                    </h1>
                    <div
                      className="ml-1 text-[10px] font-bold uppercase tracking-[0.3em] text-theme-text-muted"
                    >
                      GameBase Box
                    </div>
                  </div>
                </div>

                <nav className="ml-auto flex min-w-0 items-center justify-end gap-2 sm:gap-3">
                  {availableTabs.map((tab) => {
                    const active = visibleTab === tab;
                    const label = tab === 'game' ? 'Game' : 'Extras';
                    return (
                      <button
                        key={tab}
                        onClick={() => selectTab(tab)}
                        className={`rounded-theme-xl border px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] transition-all sm:text-[11px]`}
                        style={{
                          borderColor: active ? 'var(--theme-primary)' : 'var(--theme-outline)',
                          background: active ? 'var(--theme-primary-container)' : 'rgba(255,255,255,0.03)',
                          color: active ? 'var(--theme-primary)' : 'var(--theme-text-muted)',
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </nav>

                <button
                  onClick={onToggleFavorite}
                  onMouseEnter={() => nav.hoverZone('favorite')}
                  className={`ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-theme-xl border text-xl transition-all ${nav.focusCls('favorite')}`}
                  style={{
                    borderColor: isFavorite ? 'rgba(244, 114, 182, 0.54)' : 'var(--theme-outline)',
                    background: isFavorite ? 'rgba(236, 72, 153, 0.18)' : 'rgba(255,255,255,0.04)',
                    color: isFavorite ? '#f9a8d4' : 'var(--theme-primary)',
                  }}
                  title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {isFavorite ? '♥' : '♡'}
                </button>
              </div>
            </header>

            <div
              className="relative z-10 mx-auto overflow-hidden"
              style={{
                height: `calc(100% - ${topBarHeight}px)`,
                maxWidth: shellMaxWidth,
                paddingInline: detailLayout?.shellPaddingX ?? fullscreenLayout?.contentPaddingX ?? 18,
                paddingBlock: detailLayout?.shellPaddingY ?? fullscreenLayout?.contentGap ?? 18,
              }}
            >
              {isCyberpunk ? (
                <div
                  className="grid h-full min-h-0"
                  style={{
                    gap: panelGap,
                    gridTemplateRows: `1.1fr 2fr`,
                  }}
                >
                  {/* Bento Top Row (Game Splash + Technical Sidebar) */}
                  <div className="flex min-h-0 w-full" style={{ gap: panelGap }}>
                    {/* Game Splash */}
                    <div className="relative w-2/3 border border-[#353437] shadow-[2px_2px_0_0_#ff003c] bg-[#141417] overflow-hidden flex flex-col justify-end p-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-transparent to-transparent z-10"></div>
                      <div className="absolute top-4 left-6 z-20 flex flex-col items-start">
                        <div className="bg-[#ff003c] text-black font-mono text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 inline-block mb-2">
                          NOW LOADING: 0x{game.id.toString(16).toUpperCase()}
                        </div>
                        <h1 className="font-mono text-3xl md:text-4xl uppercase italic text-white font-black tracking-tighter flex items-center gap-2">
                          {game.name} {game.isClassic && <span title="Classic Title">🏆</span>}
                        </h1>
                        <p className="font-mono text-[10px] uppercase text-[#ffb3b2] tracking-[0.2em] mt-1">
                          {game.parentGenre}{' // '}{game.subGenre || 'ACTION'}
                        </p>
                        <p className="font-mono text-[10px] uppercase text-white/60 tracking-wider mt-1">
                          {cleanMetadataValue(game.publisher?.name) || 'Unknown'}{' _ '}{cleanMetadataValue(game.developer?.name) || 'Unknown'}{' // '}{game.year || '----'}
                        </p>
                      </div>
                      <div className="absolute bottom-4 left-6 z-20 flex gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            document.getElementById('play-game-btn')?.click();
                          }}
                          onMouseEnter={() => nav.hoverZone('play')}
                          className={`bg-[#ff003c] hover:bg-white text-black px-6 py-2.5 font-mono font-black text-xs transition-all flex items-center gap-2 border-0 uppercase rounded-none cursor-pointer ${
                            nav.isFocused('play') ? 'ring-2 ring-[#00f0ff] shadow-[0_0_12px_#00f0ff]' : ''
                          }`}
                        >
                          ▶ BOOT_GAME
                        </button>
                        {canPlayEmbedded && (
                          <button
                            type="button"
                            onClick={() => {
                              document.getElementById('play-browser-btn')?.click();
                            }}
                            onMouseEnter={() => nav.hoverZone('play-web')}
                            className={`border border-[#00f0ff]/40 hover:border-[#00f0ff] text-[#00f0ff] px-6 py-2.5 font-mono font-black text-xs transition-all bg-transparent rounded-none cursor-pointer ${
                              nav.isFocused('play-web') ? 'ring-2 ring-[#00f0ff] shadow-[0_0_12px_#00f0ff]' : ''
                            }`}
                          >
                            ▶ IMPLANTED_LAUNCH
                          </button>
                        )}
                      </div>
                      <div className="absolute inset-0 grayscale opacity-45 hover:grayscale-0 transition-all duration-700">
                        {boxArtUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={boxArtUrl}
                            alt={game.name}
                            className="w-full h-full object-cover"
                          />
                        ) : screenshotFilename ? (
                          <ImageSlider
                            type="screenshot"
                            filename={screenshotFilename}
                            alt={game.name}
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                      </div>
                    </div>

                    {/* Technical Sidebar */}
                    <div className="w-1/3 border border-[#353437] shadow-[2px_2px_0_0_#ff003c] bg-[#141417] p-4 flex flex-col justify-between relative rounded-none overflow-hidden">
                      <div className="flex justify-between items-start font-mono shrink-0">
                        <div>
                          <div className="text-[10px] text-theme-text-muted/60">SYSTEM_ID</div>
                          <div className="font-bold text-[#ffb3b2]">{settings.activePlatformId.toUpperCase()}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-theme-text-muted/60">REGION</div>
                          <div className="font-bold text-[#ffb787]">{(cleanMetadataValue(game.vPalNtsc) || (game.isPal ? 'PAL' : 'NTSC')).toUpperCase()}</div>
                        </div>
                      </div>

                      {/* Main Scrollable details info */}
                      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar my-2 font-mono text-xs space-y-1.5 pr-1">
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-theme-text-muted/60">VERSION BY</span>
                          <span className="font-bold text-right truncate max-w-[130px]">{cleanMetadataValue(game.versionBy) || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-theme-text-muted/60">PAL/NTSC</span>
                          <span className="font-bold">{cleanMetadataValue(game.vPalNtsc) || (game.isPal ? 'PAL' : 'NTSC')}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-theme-text-muted/60">SIZE</span>
                          <span className="font-bold">{cleanMetadataValue(game.vLength) ? `${game.vLength} Blocks` : '---'}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-theme-text-muted/60">TRAINERS</span>
                          <span className="font-bold">{cleanMetadataValue(game.vTrainers) || '0'}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-theme-text-muted/60">RELEASE_YEAR</span>
                          <span className="font-bold">{game.year || '---'}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-theme-text-muted/60">DEVELOPER</span>
                          <span className="font-bold text-[#ffb3b2] truncate max-w-[130px]" title={cleanMetadataValue(game.developer?.name) || '---'}>
                            {cleanMetadataValue(game.developer?.name) || '---'}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-theme-text-muted/60">SOUNDTRACK</span>
                          <span className="font-bold truncate max-w-[130px]" title={cleanMetadataValue(game.musician?.name) || '---'}>
                            {cleanMetadataValue(game.musician?.name) || '---'}
                          </span>
                        </div>
                      </div>

                      {/* Status indicators from screenshot */}
                      <div className="border border-white/10 bg-black/30 p-2 text-[9px] font-mono grid grid-cols-2 gap-x-2 gap-y-1 shrink-0 mb-2">
                        <div className="flex justify-between items-center">
                          <span className="text-theme-text-muted/60">Loading Screen</span>
                          <span className={game.vLoadingScreen === true ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {game.vLoadingScreen === true ? '✓ YES' : '✗ NO'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-theme-text-muted/60">High Score Saver</span>
                          <span className={game.vHighScoreSaver === true ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {game.vHighScoreSaver === true ? '✓ YES' : '✗ NO'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-theme-text-muted/60">Included Docs</span>
                          <span className={game.vIncludedDocs === true ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {game.vIncludedDocs === true ? '✓ YES' : '✗ NO'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-theme-text-muted/60">True Drive Emul</span>
                          <span className={game.vTrueDriveEmu === true ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {game.vTrueDriveEmu === true ? '✓ YES' : '✗ NO'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 font-mono shrink-0">
                        <div className="bg-black/40 p-1.5 border-l-2 border-[#ff003c]">
                          <div className="text-[8px] uppercase text-theme-text-muted/60">Integrity</div>
                          <div className="text-[10px] font-bold text-[#ff003c]">VERIFIED</div>
                        </div>
                        <div className="bg-black/40 p-1.5 border-l-2 border-[#ff8000]">
                          <div className="text-[8px] uppercase text-theme-text-muted/60">Rarity</div>
                          <div className="text-[10px] font-bold text-[#ff8000]">CLASS-A</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bento Bottom Row (Media Gallery or Extras + Tabs & Music Player) */}
                  <div className="flex min-h-0 w-full pb-16" style={{ gap: panelGap }}>
                    {/* Media Gallery / Extras Left Panel */}
                    {visibleTab === 'game' ? (
                      /* Media Gallery */
                      <div className="w-1/2 border border-[#353437] shadow-[2px_2px_0_0_#ff003c] bg-[#141417] p-4 flex flex-col gap-2 rounded-none">
                        <div className="border-b border-white/10 pb-2 flex items-center justify-between">
                          <SectionHeading title="Media Gallery" />
                          <div className="flex gap-1.5 flex-wrap">
                            {availableMedia.map((mediaItem) => {
                              const zone = ('media-' + mediaItem.id) as DetailZone;
                              const isActive = activeMedia === mediaItem.id;
                              return (
                                <button
                                  key={mediaItem.id}
                                  type="button"
                                  onClick={() => setSelectedMedia(mediaItem.id)}
                                  onMouseEnter={() => nav.hoverZone(zone)}
                                  className={`rounded-none border px-2 py-0.5 text-[9px] font-mono font-black uppercase tracking-wider transition-all ${
                                    isActive
                                      ? 'bg-[#ff003c] text-black border-[#ff003c]'
                                      : 'border-white/10 bg-black/30 text-theme-text-muted hover:border-[#ff003c] hover:text-white'
                                  } ${nav.focusCls(zone)}`}
                                >
                                  {mediaItem.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Main Preview */}
                        <div className="min-h-0 flex-1 relative">
                          <button
                            type="button"
                            onClick={handleFullscreenMedia}
                            onMouseEnter={() => nav.hoverZone(('media-' + activeMedia) as DetailZone)}
                            className={`w-full h-full overflow-hidden flex items-center justify-center rounded-none border border-white/5 transition-all ${
                              nav.isFocused(('media-' + activeMedia) as DetailZone) ? 'ring-2 ring-[#00f0ff] shadow-[0_0_12px_#00f0ff]' : ''
                            }`}
                          >
                            <div className="w-full h-full bg-black/45 flex items-center justify-center relative">
                              <div className="absolute top-2 left-2 z-10 bg-black/60 px-2 py-1 text-[10px] font-mono border border-[#ff003c]/30">
                                IMG_BUFFER: {activeMedia.toUpperCase()}
                              </div>
                              {activeMedia === 'videosna' && game.videoSnapFilename ? (
                                <video
                                  autoPlay
                                  className="h-full w-full object-contain"
                                  loop
                                  muted
                                  playsInline
                                  src={resolveMediaPath('screenshot', game.videoSnapFilename)}
                                />
                              ) : activeMedia === 'boxfront' ? (
                                boxArtUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={boxArtUrl}
                                    alt={`${game.name} box art`}
                                    className="h-full w-full object-contain"
                                  />
                                ) : (
                                  <span className="text-xs font-mono text-theme-text-muted">No Image</span>
                                )
                              ) : (
                                <ImageSlider
                                  type="screenshot"
                                  filename={activeMedia === 'titlescreen' ? game.titlescreenFilename : game.screenshotFilename}
                                  alt={game.name}
                                  className="h-full w-full object-contain"
                                />
                              )}
                            </div>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Extras Detail */
                      <div
                        onMouseEnter={() => nav.hoverZone('media-extras')}
                        className={`w-1/2 border border-[#353437] shadow-[2px_2px_0_0_#ff003c] bg-[#141417] p-4 flex flex-col min-h-0 rounded-none overflow-hidden transition-all ${
                          nav.isFocused('media-extras') ? 'ring-2 ring-[#00f0ff] shadow-[0_0_12px_#00f0ff]' : ''
                        }`}
                      >
                        <SectionHeading title="Extras & Documentation" />
                        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar mt-2 pr-1">
                          <ExtrasDetail
                            game={game}
                            extras={archiveExtras}
                            visibleCategories={['visual', 'docs', 'media']}
                            hideEmptyState
                            enableBigscreenGalleryUX={Boolean(fullscreenLayout)}
                            layoutSpec={detailLayout}
                            onRegisterBigscreenNavigation={(navigation) => {
                              extrasNavigationRef.current = navigation;
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Tabs & Music Player */}
                    <div className="w-1/2 flex flex-col" style={{ gap: panelGap }}>
                      {/* Tabbed Utility */}
                      <div className="flex-1 border border-[#353437] shadow-[2px_2px_0_0_#ff003c] bg-[#141417] flex flex-col rounded-none overflow-hidden">
                        <div className="flex border-b border-white/10 shrink-0">
                          {(['files', 'notes', 'credits'] as const).map((tab) => (
                            <button
                              key={tab}
                              type="button"
                              onClick={() => {
                                setActiveSidebarTab(tab);
                                nav.setFocusedZone('sidebar-tabs');
                              }}
                              onMouseEnter={() => nav.hoverZone('sidebar-tabs')}
                              className={`flex-1 py-3 text-[10px] font-mono font-black uppercase tracking-[0.2em] text-center border-r border-white/10 last:border-r-0 transition-colors ${
                                activeSidebarTab === tab
                                  ? 'bg-[#ff003c]/10 text-[#ff003c] border-t-2 border-t-[#ff003c]'
                                  : 'bg-black/10 text-theme-text-muted hover:bg-black/20 hover:text-white'
                              } ${nav.focusedZone === 'sidebar-tabs' && activeSidebarTab === tab ? 'outline-none ring-2 ring-inset ring-[#00f0ff]' : ''}`}
                            >
                              {tab}
                            </button>
                          ))}
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 font-mono text-sm leading-relaxed text-theme-text-muted">
                          {activeSidebarTab === 'files' && (
                            <div className="space-y-2" id="sidebar-files-container">
                              {versions.map((version, index) => {
                                const isSelected = selectedVersionId === version.id;
                                const isFocused = nav.isFocused('sidebar-content') && focusedFileIndex === index;
                                return (
                                  <button
                                    key={version.id}
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        void handleLaunchVersion(version);
                                      } else {
                                        selectVersion(version.id);
                                        setFocusedFileIndex(index);
                                        nav.setFocusedZone('sidebar-content');
                                      }
                                    }}
                                    onMouseEnter={() => {
                                      setFocusedFileIndex(index);
                                      nav.hoverZone('sidebar-content');
                                    }}
                                    className={`w-full p-2.5 rounded-none border text-left flex justify-between items-center transition-all ${
                                      isSelected
                                        ? 'bg-[#ff003c]/10 border-[#ff003c] text-[#ff003c]'
                                        : 'bg-black/20 border-[#353437] text-theme-text-muted hover:border-white/40 hover:text-white'
                                    } ${
                                      isFocused
                                        ? 'ring-2 ring-[#00f0ff] shadow-[0_0_12px_#00f0ff] scale-[1.01] brightness-110 z-10'
                                        : ''
                                    }`}
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="text-xs font-bold truncate text-white">{version.label}</div>
                                      <div className="text-[9px] uppercase tracking-wider text-theme-text-muted truncate mt-0.5">
                                        {version.subtitle}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                      <span className="text-[9px] font-mono border border-white/20 px-1 text-theme-text-muted">
                                        {version.tag}
                                      </span>
                                      {isSelected && (
                                        <span className="text-[8px] bg-[#ff003c] text-black px-1 py-0.5 font-black uppercase tracking-wider">
                                          ACT
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {activeSidebarTab === 'notes' && (
                            <div
                              ref={sidebarNotesScrollRef}
                              className={`text-theme-text/85 overflow-y-auto custom-scrollbar leading-relaxed h-full pr-1 p-2 rounded-none transition-all ${
                                nav.isFocused('sidebar-content') ? 'ring-1 ring-[#00f0ff] bg-black/30' : ''
                              }`}
                            >
                              <p className="mb-4">&gt;&gt; CRITICAL_ENTRY: {game.name.toUpperCase()}</p>
                              {archiveNotes}
                            </div>
                          )}

                          {activeSidebarTab === 'credits' && (
                            <div
                              ref={sidebarCreditsScrollRef}
                              className={`space-y-1.5 overflow-y-auto custom-scrollbar h-full pr-1 p-2 rounded-none transition-all ${
                                nav.isFocused('sidebar-content') ? 'ring-1 ring-[#00f0ff] bg-black/30' : ''
                              }`}
                            >
                              {personnel.length > 0 ? (
                                personnel.map((entry) => (
                                  <div key={`${entry.label}-${entry.value}`} className="flex justify-between border-b border-white/5 pb-1 text-xs">
                                    <span className="uppercase tracking-wider text-theme-text-muted/60 text-[10px]">{entry.label}</span>
                                    <span className="font-bold text-[#ffb3b2] text-[12px]">{entry.value}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-xs text-theme-text-muted">No credits metadata available.</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Soundtrack Module */}
                      {showSoundtrack && (
                        <div className="h-40 shrink-0 border border-[#353437] shadow-[2px_2px_0_0_#ff003c] bg-[#141417] p-4 flex items-center gap-6 overflow-hidden rounded-none relative">
                          <div className="w-24 h-24 bg-black/30 flex items-center justify-center relative border border-white/5 shrink-0">
                            {/* CD Disc Pulsing SVG Icon */}
                            <svg className="w-14 h-14 text-[#ff003c] animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <circle cx="12" cy="12" r="10" />
                              <circle cx="12" cy="12" r="7" strokeDasharray="4 2" />
                              <circle cx="12" cy="12" r="4" />
                              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                            </svg>
                            <div className="absolute bottom-1 right-1 text-[8px] text-theme-text-muted/60 font-mono">VOL: 88%</div>
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-1">
                            <div>
                              <div className="text-[10px] text-[#ffb787] uppercase tracking-widest mb-1 font-mono">NOW_PLAYING // SID_CHIP</div>
                              <h3 className="font-bold text-base truncate font-mono text-white" title={game.musician?.name || 'Unknown'}>
                                {game.name}
                              </h3>
                            </div>
                            
                            <div onMouseEnter={() => nav.hoverZone('sid')} className={`w-full ${nav.focusCls('sid')}`}>
                              <MusicPlayer platformId={settings.activePlatformId} filename={game.sidFilename} compact={true} />
                            </div>

                            {/* Bouncing Visualizer Bars */}
                            <div className="flex gap-1 h-3 items-end">
                              <div className="w-1 bg-[#ff003c] h-full animate-[bounce_1s_infinite]"></div>
                              <div className="w-1 bg-[#ff003c] h-2/3 animate-[bounce_1.2s_infinite]"></div>
                              <div className="w-1 bg-[#ff003c] h-1/2 animate-[bounce_0.8s_infinite]"></div>
                              <div className="w-1 bg-[#ff003c] h-3/4 animate-[bounce_1.5s_infinite]"></div>
                              <div className="w-1 bg-[#ff003c] h-1/3 animate-[bounce_1.1s_infinite]"></div>
                              <div className="w-1 bg-[#ff003c] h-full animate-[bounce_0.9s_infinite]"></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hidden standard play button for action bridging */}
                  <div style={{ display: 'none' }}>
                    <PlayButton
                      game={game}
                      launchTarget={
                        selectedVersion?.relativePath
                          ? {
                              label: selectedVersion.label,
                              relativePath: selectedVersion.relativePath,
                              source: selectedVersion.source,
                            }
                          : null
                      }
                      nav={nav}
                      compact={compactButtons}
                    />
                  </div>

                  {/* Bottom Navigation Bar */}
                  <footer className="fixed bottom-0 left-0 w-full z-50 flex justify-start items-center px-8 py-3 gap-6 bg-[#0a0a0c] border-t border-white/10 font-mono text-xs">
                    <div className="flex items-center gap-2 text-[#ffb787]">
                      <span className="border border-[#ffb787]/40 px-1.5 py-0.5 rounded bg-[#ffb787]/10 font-bold text-[9px]">A</span>
                      <span>SELECT</span>
                    </div>
                    <div onClick={onBack} className="flex items-center gap-2 text-theme-text-muted hover:text-white transition-all cursor-pointer">
                      <span className="border border-white/20 px-1.5 py-0.5 rounded bg-white/5 font-bold text-[9px]">B</span>
                      <span>BACK</span>
                    </div>
                    <div onClick={onToggleFavorite} className="flex items-center gap-2 text-theme-text-muted hover:text-white transition-all cursor-pointer">
                      <span className="border border-white/20 px-1.5 py-0.5 rounded bg-white/5 font-bold text-[9px]">Y</span>
                      <span>FAVORITE</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-theme-text-muted/75">
                      <span className="border border-white/20 px-1.5 py-0.5 rounded bg-white/5 font-bold text-[9px]">LB</span>
                      <span>/</span>
                      <span className="border border-white/20 px-1.5 py-0.5 rounded bg-white/5 font-bold text-[9px]">RB</span>
                      <span className="text-[10px]">SWITCH GAME/EXTRAS</span>
                    </div>
                  </footer>
                </div>
              ) : isC64 ? (
                renderC64Layout()
              ) : (
                <div
                  className="grid h-full min-h-0"
                  style={{
                    gap: panelGap,
                    gridTemplateRows: `${heroMinHeight}px minmax(0, ${FLUSH_HEIGHT_SCALING ? '1fr' : `${mainColumnHeight}px`})`,
                  }}
                >
                  <DetailTitleBanner
                    artUrl={boxArtUrl}
                    className={`shrink-0 rounded-theme-xl ${
                      isC64 
                        ? 'border-8 border-t-theme-secondary border-l-theme-secondary border-b-theme-outline-variant border-r-theme-outline-variant' 
                        : (theme.effects.steppedBorders ? 'stepped-border' : 'border border-theme-outline')
                    } shadow-[0_28px_80px_rgba(0,0,0,0.34)]`}
                    contentClassName="relative h-full"
                  >
                    <div
                      className="grid h-full min-h-0"
                      style={{
                        gap: panelGap,
                        gridTemplateColumns: useStackedColumns ? '1fr' : `minmax(0,1fr) minmax(280px,${detailLayout?.heroActionWidth ?? 340}px)`,
                        paddingInline: heroPaddingX,
                        paddingBlock: heroPaddingY,
                        background: 'linear-gradient(180deg, rgba(5,10,17,0.28), rgba(5,10,17,0.52))',
                      }}
                    >
                      <div className="flex min-w-0 flex-col justify-end">
                        <div className="mb-4 flex flex-wrap gap-2">
                          {heroMeta.slice(0, 4).map((item) => (
                            <span
                              key={item}
                              className="rounded-theme-md border font-black uppercase tracking-[0.18em]"
                              style={{
                                borderColor: 'var(--theme-outline)',
                                background: 'var(--theme-surface)',
                                color: 'var(--theme-primary)',
                                fontSize: `${detailLayout?.chipFontSize ?? 10}px`,
                                paddingInline: `${detailLayout?.chipPaddingX ?? 10}px`,
                                paddingBlock: `${detailLayout?.chipPaddingY ?? 4}px`,
                              }}
                            >
                              {item}
                            </span>
                          ))}
                        </div>

                        {isC64 && (
                          <p className="font-mono text-xs text-theme-primary mb-2">
                            LOAD &quot;{game.name.substring(0, 16).replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}&quot;,8,1
                          </p>
                        )}

                        {isCyberpunk && (
                          <div className="bg-theme-primary text-theme-surface font-mono text-[10px] px-2 py-0.5 inline-block w-fit mb-2">
                            NOW LOADING: 0x{game.id.toString(16).toUpperCase()}
                          </div>
                        )}

                        {heroSupplementalMeta.length > 0 ? (
                          <div
                            className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-theme-text-muted"
                          >
                            {heroSupplementalMeta.map((item, index) => (
                              <span key={item} className="flex items-center gap-3">
                                {index > 0 ? <span className="opacity-20">•</span> : null}
                                <span>{item}</span>
                              </span>
                            ))}
                          </div>
                        ) : null}

                        <div className="flex items-end gap-3 flex-wrap">
                          <DetailGameTitle
                            className="max-w-4xl text-balance font-black leading-[0.92] tracking-[-0.08em] text-theme-text"
                            isClassic={game.isClassic}
                            title={game.name}
                            style={{ fontSize: `clamp(2rem, 4vw, ${detailTitleMax}px)` }}
                          />
                          {isC64 && (
                            <div className="flex items-center gap-1 bg-theme-primary px-2 py-0.5 text-theme-surface font-mono font-bold text-[10px] uppercase rounded-theme-sm">
                              READY. <span className="theme-cursor-blink"></span>
                            </div>
                          )}
                        </div>

                        <div
                          className="mt-4 font-semibold uppercase tracking-[0.18em] text-theme-primary"
                          style={{ fontSize: `${detailLayout?.subtitleSize ?? 16}px` }}
                        >
                          {[
                            cleanMetadataValue(game.publisher?.name),
                            cleanMetadataValue(game.developer?.name),
                          ]
                            .filter(Boolean)
                            .join(' | ') || 'Unknown'}
                        </div>
                      </div>

                      <div className="flex w-full items-end">
                        <div
                          onMouseEnter={() => nav.hoverZone('play')}
                          className="w-full"
                          style={{ maxWidth: `${detailLayout?.heroActionWidth ?? 340}px` }}
                        >
                          <PlayButton
                            game={game}
                            launchTarget={
                              selectedVersion?.relativePath
                                ? {
                                    label: selectedVersion.label,
                                    relativePath: selectedVersion.relativePath,
                                    source: selectedVersion.source,
                                  }
                                : null
                            }
                            nav={nav}
                            compact={compactButtons}
                          />
                        </div>
                      </div>
                    </div>
                  </DetailTitleBanner>

                  <div
                    className="grid min-h-0 items-stretch"
                    style={{
                      gap: panelGap,
                      gridTemplateColumns: useStackedColumns ? '1fr' : `minmax(0,1fr) ${sidebarWidth}px`,
                    }}
                  >
                    <div className="min-h-0">
                      {visibleTab === 'game' ? (
                        <div
                          className="grid h-full min-h-0"
                          style={{
                            gap: panelGap,
                            gridTemplateRows: isArcade
                              ? '1fr'
                              : (FLUSH_HEIGHT_SCALING
                                  ? `${mediaRowHeight}fr ${lowerRowHeight}fr`
                                  : `${mediaRowHeight}px ${lowerRowHeight}px`),
                          }}
                        >
                          <section className={`${panelCls} overflow-hidden`}>
                            <div
                              className="grid h-full min-h-0"
                              style={{
                                gap: panelGap,
                                gridTemplateColumns: showBoxArtPanel
                                  ? `minmax(0,1fr) ${detailLayout?.boxArtWidth ?? 200}px`
                                  : 'minmax(0,1fr)',
                                padding: panelPadding,
                              }}
                            >
                              <div className="flex h-full min-h-0 w-full flex-col">
                                {/* Media Selector Tabs */}
                                <div className="border-b border-theme-outline/20 pb-2 mb-2 flex items-center justify-between">
                                  <SectionHeading title="Media Gallery" />
                                  <div className="flex gap-1.5 flex-wrap">
                                    {availableMedia.map((mediaItem) => {
                                      const zone = ('media-' + mediaItem.id) as DetailZone;
                                      const isActive = activeMedia === mediaItem.id;
                                      return (
                                        <button
                                          key={mediaItem.id}
                                          type="button"
                                          onClick={() => setSelectedMedia(mediaItem.id)}
                                          onMouseEnter={() => nav.hoverZone(zone)}
                                          className={`rounded-theme-sm border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider transition-all ${
                                            isActive
                                              ? 'bg-theme-primary text-theme-surface border-theme-primary shadow-sm shadow-theme-primary/30'
                                              : 'border-theme-outline/20 bg-theme-surface/30 text-theme-text-muted hover:border-theme-primary/60 hover:text-theme-text'
                                          } ${nav.focusCls(zone)}`}
                                        >
                                          {mediaItem.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Media Display Viewport */}
                                <div className="min-h-0 flex-1" style={{ padding: detailLayout?.screenshotViewportPadding ?? 4 }}>
                                  <button
                                    type="button"
                                    onClick={handleFullscreenMedia}
                                    onMouseEnter={() => nav.hoverZone(('media-' + activeMedia) as DetailZone)}
                                    className={`group w-full h-full overflow-hidden flex items-center justify-center rounded-theme-md transition-colors ${nav.focusCls(('media-' + activeMedia) as DetailZone)}`}
                                  >
                                    <div className="w-full h-full rounded-theme-md overflow-hidden bg-black/45 flex items-center justify-center">
                                      {activeMedia === 'videosna' && game.videoSnapFilename ? (
                                        <video
                                          autoPlay
                                          className="h-full w-full object-contain"
                                          loop
                                          muted
                                          playsInline
                                          src={resolveMediaPath('screenshot', game.videoSnapFilename)}
                                        />
                                      ) : activeMedia === 'boxfront' ? (
                                        <div className="h-full w-full flex items-center justify-center">
                                          {boxArtUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                              src={boxArtUrl}
                                              alt={`${game.name} box art`}
                                              className="h-full w-full object-contain"
                                            />
                                          ) : (
                                            <span className="text-xs text-theme-text-muted">No Image</span>
                                          )}
                                        </div>
                                      ) : (
                                        <ImageSlider
                                          type="screenshot"
                                          filename={activeMedia === 'titlescreen' ? game.titlescreenFilename : game.screenshotFilename}
                                          alt={game.name}
                                          className="h-full w-full object-contain"
                                        />
                                      )}
                                    </div>
                                  </button>
                                </div>
                              </div>

                              {/* Direct Box Art Panel (Only shown in Standard / non-compact layout) */}
                              {showBoxArtPanel && activeMedia !== 'boxfront' ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedMedia('boxfront')}
                                  onMouseEnter={() => nav.hoverZone('media-boxfront')}
                                  className={`${insetPanelCls} overflow-hidden hover:border-theme-primary/50 text-left transition-all ${nav.focusCls('media-boxfront')}`}
                                >
                                  <div className="flex h-full min-h-0 w-full flex-col" style={{ padding: Math.max(10, panelPadding - 4) }}>
                                    <div className="text-[9px] font-black uppercase tracking-[0.24em] text-theme-primary mb-2">
                                      Box Art
                                    </div>
                                    <div className="mt-1 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-theme-md bg-black/35">
                                      {boxArtUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={boxArtUrl} alt={`${game.name} box art`} className="h-full w-full object-contain object-center" />
                                      ) : null}
                                    </div>
                                  </div>
                                </button>
                              ) : null}
                            </div>
                          </section>

                          {!isArcade && (
                            <section className={panelCls}>
                              <div className="flex h-full min-h-0 flex-col" style={{ gap: compactLowerPanelGap, padding: compactLowerPanelPadding }}>
                                <SectionHeading title="Archive Notes" />
                                <div className={insetPanelCls} style={{ padding: compactInnerCardPadding }}>
                                  <div
                                    className="text-theme-text/85 overflow-y-auto"
                                    style={{
                                      ...clampTextLines(detailLayout?.notesLineClamp ?? 4),
                                      fontSize: `${detailLayout?.notesFontSize ?? 13}px`,
                                      lineHeight: 1.5,
                                    }}
                                  >
                                    {archiveNotes}
                                  </div>
                                  {isC64 && (
                                    <div className="mt-2 flex items-center gap-2">
                                      <span className="w-1.5 h-3 bg-theme-primary theme-cursor-blink"></span>
                                      <span className="text-theme-primary font-mono text-[10px]">SYSTEM_READY_FOR_BOOT</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </section>
                          )}
                        </div>
                      ) : (
                        <section
                          className={`${panelCls} flex h-full min-h-0 min-w-0 flex-col ${largePanelFocusCls} overflow-hidden`}
                        >
                          <div onMouseEnter={() => nav.hoverZone('media-extras')} className="h-full min-h-0 min-w-0" style={{ padding: panelPadding }}>
                            <ExtrasDetail
                              game={game}
                              extras={archiveExtras}
                              visibleCategories={['visual', 'docs', 'media']}
                              hideEmptyState
                              enableBigscreenGalleryUX={Boolean(fullscreenLayout)}
                              layoutSpec={detailLayout}
                              onRegisterBigscreenNavigation={(navigation) => {
                                extrasNavigationRef.current = navigation;
                              }}
                            />
                          </div>
                        </section>
                      )}
                    </div>

                    {isArcade ? (
                      renderArcadeSidebar()
                    ) : (
                      <aside className="grid min-h-0" style={{ gap: panelGap, gridTemplateRows: sidebarTemplateRows }}>
                        <section className={panelCls}>
                          <div className="flex h-full min-h-0 flex-col" style={{ gap: compactLowerPanelGap, padding: compactLowerPanelPadding }}>
                            <SectionHeading title="Alternative Versions" />
                            <div
                              className="grid items-center justify-items-start"
                              style={{
                                columnGap: Math.max(10, panelPadding - 2),
                                gridTemplateColumns: `repeat(${Math.max(versionColumns, 1)}, minmax(0, ${alternativeButtonSize}px))`,
                                rowGap: 10,
                              }}
                            >
                              {versions.map((version) => {
                                const selected = selectedVersion?.id === version.id;
                                const visualKind = getVersionVisualKind(version);
                                const visualLabel = getVersionVisualLabel(visualKind);

                                return (
                                  <button
                                    key={version.id}
                                    type="button"
                                    aria-label={`${visualLabel.label}: ${version.label}`}
                                    title={`${visualLabel.label}: ${version.label}`}
                                    onClick={() => {
                                      selectVersion(version.id);
                                      nav.setFocusedZone('versions');
                                    }}
                                    onMouseEnter={() => {
                                      selectVersion(version.id);
                                      nav.hoverZone('versions');
                                    }}
                                    className={`flex items-center justify-center rounded-theme-md border transition-all ${
                                      selected && nav.isFocused('versions') 
                                        ? 'bg-theme-primary/10 border-theme-primary shadow-sm shadow-theme-primary/35' 
                                        : 'border-theme-outline/20 bg-theme-surface/10 hover:border-theme-primary/60'
                                    }`}
                                    style={{
                                      width: `${alternativeButtonSize}px`,
                                      height: `${alternativeButtonSize}px`,
                                    }}
                                  >
                                    <span
                                      className="flex items-center justify-center"
                                      style={{ height: `${alternativeGlyphSize}px`, width: `${alternativeGlyphSize}px` }}
                                    >
                                      <VersionGlyph
                                        kind={visualKind}
                                        accent={selected ? 'var(--theme-primary)' : 'var(--theme-text-muted)'}
                                        className="h-full w-full"
                                      />
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            {selectedVersion ? (
                              <div
                                className={insetPanelCls}
                                style={{ paddingInline: compactInnerCardPadding, paddingBlock: Math.max(8, compactInnerCardPadding - 1) }}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div
                                      className="font-black uppercase tracking-[0.24em] text-theme-primary"
                                      style={{ fontSize: `${detailLayout?.alternativeHintFontSize ?? 11}px` }}
                                    >
                                      {getVersionVisualLabel(getVersionVisualKind(selectedVersion)).label}
                                    </div>
                                    <div
                                      className="font-semibold text-theme-text"
                                      style={{ ...clampTextLines(2), lineHeight: 1.3 }}
                                    >
                                      {selectedVersion.label}
                                    </div>
                                  </div>
                                  <div
                                    className="rounded-full border border-theme-primary bg-theme-primary/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.22em] text-theme-primary"
                                  >
                                    Active
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </section>

                        {showSoundtrack && (
                          <section className={panelCls}>
                            <div className="flex h-full min-h-0 flex-col" style={{ gap: Math.max(6, panelInnerGap - 8), padding: Math.max(8, panelPadding - 4) }}>
                              <SectionHeading title="Soundtrack Module" />
                              {game.musician ? (
                                <div className="flex items-center gap-2">
                                  {PLATFORM_PROFILES[settings.activePlatformId]?.mediaCapabilities.photos ? (
                                    <MusicianPhoto
                                      className="shrink-0"
                                      musicianName={game.musician.name}
                                      photoFilename={game.musician.photoPath}
                                      style={{ height: `${Math.max(28, (detailLayout?.musicianAvatarSize ?? 40) - 8)}px`, width: `${Math.max(28, (detailLayout?.musicianAvatarSize ?? 40) - 8)}px` }}
                                    />
                                  ) : null}
                                  <div className="min-w-0">
                                    <div className="truncate font-black text-theme-text" style={{ fontSize: `${Math.max(11, (detailLayout?.infoValueFontSize ?? 13) - 1)}px` }}>{game.musician.name}</div>
                                    <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-theme-text-muted">
                                      {settings.activePlatformId === 'c64' ? 'SID Composer' : 'Music Composer'}
                                    </div>
                                  </div>
                                </div>
                              ) : null}
                              <div onMouseEnter={() => nav.hoverZone('sid')} className={nav.focusCls('sid')}>
                                <MusicPlayer platformId={settings.activePlatformId} filename={game.sidFilename} compact={true} />
                              </div>
                            </div>
                          </section>
                        )}

                        <section className={panelCls}>
                          <div className="flex h-full min-h-0 flex-col" style={{ gap: Math.max(10, panelPadding - 2), padding: panelPadding }}>
                            <SectionHeading title="Version Details" />
                            <div className="grid gap-1.5">
                              <InfoRow label="Version By" value={cleanMetadataValue(game.versionBy) ?? 'Unknown'} layout={infoDensity} />
                              <InfoRow label="PAL/NTSC" value={cleanMetadataValue(game.vPalNtsc) ?? formatVersionLabel(game)} layout={infoDensity} />
                              <InfoRow label="Size" value={cleanMetadataValue(game.vLength) ? `${game.vLength} Blocks` : 'Unknown'} layout={infoDensity} />
                              <InfoRow label="Trainers" value={cleanMetadataValue(game.vTrainers) ?? '0'} layout={infoDensity} />
                            </div>
                            <div
                              className={`grid rounded-theme-md ${
                                isC64 
                                  ? 'border-8 border-t-theme-outline-variant border-l-theme-outline-variant border-b-theme-secondary border-r-theme-secondary bg-black/45' 
                                  : 'border border-theme-outline/20 bg-black/20'
                              }`}
                              style={{
                                columnGap: 10,
                                gridTemplateColumns: `repeat(${sidebarStatusColumns}, minmax(0,1fr))`,
                                padding: Math.max(8, panelPadding - 2),
                                rowGap: 6,
                              }}
                            >
                              <StatusRow label="Loading Screen" value={game.vLoadingScreen} />
                              <StatusRow label="High Score Saver" value={game.vHighScoreSaver} />
                              <StatusRow label="Included Docs" value={game.vIncludedDocs} />
                              <StatusRow label="True Drive Emul" value={game.vTrueDriveEmu} />
                            </div>
                          </div>
                        </section>

                        <section className={panelCls}>
                          <div className="flex h-full min-h-0 flex-col" style={{ gap: Math.max(10, panelPadding - 2), padding: panelPadding }}>
                            <SectionHeading title="Credits" />
                            <div className="grid gap-1.5">
                              {personnel.length > 0 ? (
                                personnel.map((entry) => (
                                  <InfoRow
                                    key={`${entry.label}-${entry.value}`}
                                    label={entry.label}
                                    value={entry.value}
                                    layout={infoDensity}
                                  />
                                ))
                              ) : (
                                <div className="rounded-theme-md border border-theme-outline/20 bg-black/20 px-4 py-3 text-sm text-theme-text-muted">
                                  No credits metadata available for this title.
                                </div>
                              )}
                            </div>
                          </div>
                        </section>
                      </aside>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {detailLayout ? (
        <div className="pointer-events-none absolute bottom-3 right-4 z-20 rounded-full border border-theme-outline/20 bg-black/45 px-3 py-1 text-[10px] font-bold tracking-[0.18em] text-theme-text-muted backdrop-blur-md">
          {detailLayout.debugLabel}
        </div>
      ) : null}
    </div>
  );
}
