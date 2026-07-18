"use client";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getGameExtras } from '../../lib/tauri-bridge';
import { useSettings } from '../../contexts/SettingsContext';
import { cleanMetadataValue, getGameStudios } from '../../lib/game-display';
import type { Extra, Game } from '../../types/game';
import type { PlatformId } from '../../types/platform';
import { groupExtras } from '../../lib/extras';
import { isLaunchableExtra } from '../../lib/extras';
import { PLATFORM_PROFILES } from '../../lib/platform-capabilities';
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
  const { settings, resolveMediaPath } = useSettings();
  const { theme } = useTheme();
  const [extras, setExtras] = useState<Extra[]>([]);
  const [activeTab, setActiveTab] = useState<UnifiedDetailTab>('game');
  const [selectedVersionId, setSelectedVersionId] = useState(() => readStoredVersionId(game.id));
  const extrasNavigationRef = useRef<ExtrasBigscreenNavigation | null>(null);
  
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
    nav.registerAction('versions', () => undefined);
    nav.registerTabActions({
      previous: () => cycleTab('previous'),
      next: () => cycleTab('next'),
    });

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

    nav.registerDirectionalOverride('media-extras', (direction) => {
      return extrasNavigationRef.current?.move(direction) ?? false;
    });
  }, [
    cycleTab,
    handleFullscreenMedia,
    nav,
    onToggleFavorite,
    selectVersion,
    selectedVersionId,
    versionColumns,
    versionIds,
    versionIdsKey,
  ]);

  const bgStyle = useMemo(() => {
    if (isArcade) {
      return 'radial-gradient(circle at top, rgba(0, 227, 253, 0.12), transparent 28%), radial-gradient(circle at bottom right, rgba(129, 236, 255, 0.1), transparent 24%), linear-gradient(180deg, #050a11 0%, #09111a 44%, #050a10 100%)';
    }
    return undefined;
  }, [isArcade]);

  return (
    <div
      className="relative h-full min-h-screen overflow-hidden text-theme-text font-sans selection:bg-theme-primary/30 selection:text-theme-text"
      style={{
        background: bgStyle,
        backgroundColor: 'var(--theme-background)',
      }}
    >
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
              <div
                className="grid h-full min-h-0"
                style={{
                  gap: panelGap,
                  gridTemplateRows: `${heroMinHeight}px minmax(0, ${mainColumnHeight}px)`,
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
                      <div className="grid h-full min-h-0" style={{ gap: panelGap, gridTemplateRows: `${mediaRowHeight}px ${lowerRowHeight}px` }}>
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
                </div>
              </div>
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
