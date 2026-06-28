"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getGameExtras } from '../../../lib/tauri-bridge';
import { useSettings } from '../../../contexts/SettingsContext';
import { cleanMetadataValue, getGameStudios } from '../../../lib/game-display';
import type { Extra, Game } from '../../../types/game';
import type { PlatformId } from '../../../types/platform';
import { groupExtras } from '../../../lib/extras';
import { isLaunchableExtra } from '../../../lib/extras';
import { PLATFORM_PROFILES } from '../../../lib/platform-capabilities';
import { ImageSlider } from '../../ImageSlider';
import { ExtrasDetail, type ExtrasBigscreenNavigation } from '../../ExtrasDetail';
import { MusicianPhoto } from '../../MusicianPhoto';
import { MusicPlayer } from '../../MusicPlayer';
import { StatusRow } from '../../StatusRow';
import { PlayButton } from '../PlayButton';
import { DetailGameTitle } from '../../detail/DetailGameTitle';
import { DetailTitleBanner } from '../../detail/DetailTitleBanner';
import type { DetailFullscreenRequest, DetailLayoutProps } from '../../DetailView';
import { useResolvedBoxArtUrl } from '../../../hooks/useResolvedBoxArtUrl';
import { getNeonArchiveDetailStyle } from './detailThemeStyles';

type NeonArchiveTab = 'game' | 'extras';

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
    // Ignore persistence failures and keep the in-memory selection.
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
  mutedText,
  layout,
}: {
  label: string;
  value: string;
  mutedText: string;
  layout: InfoDensity;
}) {
  return (
    <div
      className="grid items-start border-b border-white/8"
      style={{
        columnGap: layout.gap,
        gridTemplateColumns: 'minmax(76px,0.72fr) minmax(0,1.28fr)',
        paddingBlock: layout.paddingY,
      }}
    >
      <span
        className="font-bold uppercase tracking-[0.18em]"
        style={{ color: mutedText, fontSize: `${layout.labelFontSize}px` }}
      >
        {label}
      </span>
      <span
        className="min-w-0 text-right font-medium text-white"
        style={{ fontSize: `${layout.valueFontSize}px` }}
      >
        {value}
      </span>
    </div>
  );
}

function SectionPanel({
  children,
  className = '',
  panelColor,
  borderColor,
  overflowClassName = '',
}: {
  children: ReactNode;
  className?: string;
  panelColor: string;
  borderColor: string;
  overflowClassName?: string;
}) {
  return (
    <section
      className={`rounded-[24px] border backdrop-blur-xl ${overflowClassName} ${className}`}
      style={{ background: panelColor, borderColor }}
    >
      {children}
    </section>
  );
}

function SectionHeading({
  title,
  accent,
  mutedText,
  suffix,
}: {
  title: string;
  accent: string;
  mutedText: string;
  suffix?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-[11px] font-black uppercase tracking-[0.3em]" style={{ color: mutedText }}>
        {title}
      </div>
      {suffix ? <div style={{ color: accent }}>{suffix}</div> : null}
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

export function NeonArchiveDetailLayout({
  game,
  onBack,
  nav,
  onFullscreen,
  isFavorite,
  onToggleFavorite,
  fullscreenLayout,
}: DetailLayoutProps) {
  const { settings } = useSettings();
  const [extras, setExtras] = useState<Extra[]>([]);
  const [activeTab, setActiveTab] = useState<NeonArchiveTab>('game');
  const [selectedVersionId, setSelectedVersionId] = useState(() => readStoredVersionId(game.id));
  const extrasNavigationRef = useRef<ExtrasBigscreenNavigation | null>(null);
  const style = getNeonArchiveDetailStyle();
  const boxArtUrl = useResolvedBoxArtUrl(game);
  const showBoxArtPanel = Boolean(boxArtUrl);

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
    const tabs: NeonArchiveTab[] = ['game'];
    if (archiveExtras.length > 0) tabs.push('extras');
    return tabs;
  }, [archiveExtras.length]);

  const visibleTab = availableTabs.includes(activeTab) ? activeTab : 'game';

  const galleryFocusZone = 'media-gameplay';

  const selectTab = useCallback((tab: NeonArchiveTab) => {
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
    ? 'relative z-30 ring-2 ring-inset ring-yellow-400 brightness-110 shadow-[0_0_18px_rgba(250,204,21,0.42)]'
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

  const handleOpenScreenshot = useCallback(() => {
    openScreenshotFullscreen(screenshotFilename, onFullscreen);
  }, [onFullscreen, screenshotFilename]);

  const handleOpenBoxArt = useCallback(() => {
    openBoxArtFullscreen(game.name, boxArtUrl || '', boxFrontFilename, onFullscreen);
  }, [boxArtUrl, boxFrontFilename, game.name, onFullscreen]);

  useEffect(() => {
    nav.registerAction('play', () => document.getElementById('play-game-btn')?.click());
    nav.registerAction('play-web', () => document.getElementById('play-browser-btn')?.click());
    nav.registerAction('favorite', onToggleFavorite);
    nav.registerAction('sid', () => (document.getElementById('sid-play-btn') ?? document.getElementById('sap-play-btn'))?.click());
    nav.registerAction('media-gameplay', handleOpenScreenshot);
    nav.registerAction('media-titlescreen', () => undefined);
    nav.registerAction('media-videosna', () => undefined);
    nav.registerAction('media-boxfront', handleOpenBoxArt);
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
    handleOpenBoxArt,
    handleOpenScreenshot,
    nav,
    onToggleFavorite,
    selectVersion,
    selectedVersionId,
    versionColumns,
    versionIds,
    versionIdsKey,
  ]);

  const renderStagePreview = () => {
    if (!screenshotFilename) {
      return <div className="flex h-full min-h-[220px] items-center justify-center text-sm" style={{ color: style.mutedText }}>No archive media available</div>;
    }

    return (
      <div className="h-full w-full">
        <ImageSlider
          type="screenshot"
          filename={screenshotFilename}
          alt={game.name}
          containerClassName="h-full w-full"
          imageClassName="h-full w-full object-contain object-center"
        />
      </div>
    );
  };

  return (
    <div
      className="relative h-full min-h-screen overflow-hidden text-slate-100"
      style={{
        background:
          'radial-gradient(circle at top, rgba(0, 227, 253, 0.12), transparent 28%), radial-gradient(circle at bottom right, rgba(129, 236, 255, 0.1), transparent 24%), linear-gradient(180deg, #050a11 0%, #09111a 44%, #050a10 100%)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(255,255,255,0.018) 0, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 100%), linear-gradient(180deg, rgba(255,255,255,0.018) 0, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 100%)',
          backgroundSize: '88px 88px',
          maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.5), rgba(0,0,0,0.12))',
        }}
      />

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
              className="relative z-10 border-b border-white/8 bg-[#060b12]/88 backdrop-blur-xl"
              style={{ minHeight: topBarHeight }}
            >
              <div
                className="mx-auto flex h-full items-center gap-4"
                style={{ maxWidth: shellMaxWidth, paddingInline: topBarPaddingX, paddingBlock: topBarPaddingY }}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <button
                    onClick={onBack}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-white/70 transition-colors hover:border-white/20 hover:text-white"
                  >
                    Library
                  </button>
                  <div className="hidden h-8 w-px bg-white/10 md:block" />
                  <div className="flex min-w-0 flex-col">
                    <h1
                      className="font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600 leading-none"
                      style={{ fontSize: 'clamp(1.9rem,2.35vw,2.9rem)' }}
                    >
                      GBBox
                    </h1>
                    <div
                      className="ml-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40"
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
                        className="rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] transition-all sm:text-[11px]"
                        style={{
                          borderColor: active ? style.accentStrong : 'rgba(255,255,255,0.08)',
                          background: active ? style.accentSoft : 'rgba(255,255,255,0.03)',
                          color: active ? style.accent : style.mutedText,
                          boxShadow: active ? '0 0 0 1px rgba(0, 227, 253, 0.16) inset' : 'none',
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
                  className={`ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-xl transition-all ${nav.focusCls('favorite')}`}
                  style={{
                    borderColor: isFavorite ? 'rgba(244, 114, 182, 0.54)' : style.border,
                    background: isFavorite ? 'rgba(236, 72, 153, 0.18)' : 'rgba(255,255,255,0.04)',
                    color: isFavorite ? '#f9a8d4' : style.accent,
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
          className="shrink-0 rounded-[28px] border shadow-[0_28px_80px_rgba(0,0,0,0.34)]"
          contentClassName="relative h-full"
        >
          <div
            className="grid h-full min-h-0 rounded-[28px]"
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
                    className="rounded-full border font-black uppercase tracking-[0.18em]"
                    style={{
                      borderColor: style.border,
                      background: 'rgba(7, 13, 20, 0.58)',
                      color: style.accent,
                      fontSize: `${detailLayout?.chipFontSize ?? 10}px`,
                      paddingInline: `${detailLayout?.chipPaddingX ?? 10}px`,
                      paddingBlock: `${detailLayout?.chipPaddingY ?? 4}px`,
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>

              {heroSupplementalMeta.length > 0 ? (
                <div
                  className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: style.mutedText }}
                >
                  {heroSupplementalMeta.map((item, index) => (
                    <span key={item} className="flex items-center gap-3">
                      {index > 0 ? <span className="text-white/20">•</span> : null}
                      <span>{item}</span>
                    </span>
                  ))}
                </div>
              ) : null}

              <DetailGameTitle
                className="max-w-4xl text-balance font-black leading-[0.92] tracking-[-0.08em]"
                isClassic={game.isClassic}
                title={game.name}
                style={{ color: style.titleText, fontSize: `clamp(2rem, 4vw, ${detailTitleMax}px)` }}
              />

              <div
                className="mt-4 font-semibold uppercase tracking-[0.18em]"
                style={{ color: style.accent, fontSize: `${detailLayout?.subtitleSize ?? 16}px` }}
              >
                {cleanMetadataValue(game.subGenre) ?? cleanMetadataValue(game.parentGenre) ?? 'GB64 Collection'}
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
                <SectionPanel panelColor={style.panelRaised} borderColor={style.border} className="min-h-0" overflowClassName="overflow-hidden">
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
                    <button
                      type="button"
                      onClick={handleOpenScreenshot}
                      onMouseEnter={() => nav.hoverZone('media-gameplay')}
                      className={`group min-h-0 overflow-hidden rounded-[22px] border border-white/10 bg-black/35 text-left transition-colors hover:border-white/20 ${nav.focusCls('media-gameplay')}`}
                    >
                      <div className="flex h-full min-h-0 w-full flex-col" style={{ background: 'linear-gradient(180deg, rgba(3,7,12,0.65) 0%, rgba(2,5,9,0.82) 100%)' }}>
                        <div className="border-b border-white/8" style={{ paddingInline: panelPadding, paddingBlock: Math.max(9, panelPadding - 2) }}>
                          <SectionHeading title="Screenshots" accent={style.accent} mutedText={style.mutedText} />
                        </div>
                        <div className="min-h-0 flex-1" style={{ padding: detailLayout?.screenshotViewportPadding ?? panelPadding }}>
                          <div className="flex h-full min-h-0 items-center justify-center overflow-hidden rounded-[18px] border border-white/8 bg-black/45">
                            {renderStagePreview()}
                          </div>
                        </div>
                      </div>
                    </button>

                    {showBoxArtPanel ? (
                      <button
                        type="button"
                        onClick={handleOpenBoxArt}
                        onMouseEnter={() => nav.hoverZone('media-boxfront')}
                        className={`min-h-0 overflow-hidden rounded-[22px] border text-left transition-all ${nav.focusCls('media-boxfront')}`}
                        style={{ background: style.panelMuted, borderColor: style.border }}
                      >
                        <div className="flex h-full min-h-0 w-full flex-col" style={{ padding: Math.max(10, panelPadding - 1) }}>
                          <div className="text-[11px] font-black uppercase tracking-[0.24em]" style={{ color: style.accent }}>
                            Box Art
                          </div>
                          <div
                            className="mt-3 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[16px] border border-white/8 bg-black/35"
                            style={{ padding: detailLayout?.boxArtViewportPadding ?? panelPadding }}
                          >
                            <div className="h-full w-full">
                              {boxArtUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={boxArtUrl} alt={`${game.name} box art`} className="h-full w-full object-contain object-center" />
                              ) : (
                                <div className="flex h-full items-center justify-center text-sm" style={{ color: style.mutedText }}>
                                  No box art
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 text-[11px]" style={{ color: style.mutedText }}>
                            Press Enter for fullscreen
                          </div>
                        </div>
                      </button>
                    ) : null}
                  </div>
                </SectionPanel>

                <SectionPanel panelColor={style.panel} borderColor={style.border} className="min-h-0">
                  <div className="flex h-full min-h-0 flex-col" style={{ gap: compactLowerPanelGap, padding: compactLowerPanelPadding }}>
                    <SectionHeading title="Archive Notes" accent={style.accent} mutedText={style.mutedText} />
                    <div className="rounded-[16px] border border-white/8 bg-black/20" style={{ padding: compactInnerCardPadding }}>
                      <div
                        className="text-slate-100/85"
                        style={{
                          ...clampTextLines(detailLayout?.notesLineClamp ?? 4),
                          fontSize: `${detailLayout?.notesFontSize ?? 13}px`,
                          lineHeight: 1.5,
                        }}
                      >
                        {archiveNotes}
                      </div>
                    </div>
                  </div>
                </SectionPanel>
              </div>
            ) : (
              <SectionPanel
                panelColor={style.panelRaised}
                borderColor={style.border}
                className={`flex h-full min-h-0 min-w-0 flex-col ${largePanelFocusCls}`}
                overflowClassName="overflow-hidden"
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
              </SectionPanel>
            )}
          </div>

          <aside className="grid min-h-0" style={{ gap: panelGap, gridTemplateRows: sidebarTemplateRows }}>
            <SectionPanel panelColor={style.panel} borderColor={style.border} className="min-h-0">
              <div className="flex h-full min-h-0 flex-col" style={{ gap: compactLowerPanelGap, padding: compactLowerPanelPadding }}>
                <SectionHeading title="Alternative Versions" accent={style.accent} mutedText={style.mutedText} />
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
                        className={`flex items-center justify-center rounded-[16px] border transition-all ${selected && nav.isFocused('versions') ? nav.focusCls('versions') : ''}`}
                        style={{
                          width: `${alternativeButtonSize}px`,
                          height: `${alternativeButtonSize}px`,
                          borderColor: selected ? style.accentStrong : 'rgba(255,255,255,0.12)',
                          background: selected ? 'rgba(0, 227, 253, 0.08)' : 'rgba(255,255,255,0.02)',
                          boxShadow: selected ? '0 0 0 1px rgba(0, 227, 253, 0.18) inset' : 'none',
                        }}
                      >
                        <span
                          className="flex items-center justify-center"
                          style={{ height: `${alternativeGlyphSize}px`, width: `${alternativeGlyphSize}px` }}
                        >
                          <VersionGlyph
                            kind={visualKind}
                            accent={selected ? style.accent : style.mutedText}
                            className="h-full w-full"
                          />
                        </span>
                      </button>
                    );
                  })}
                </div>

                {selectedVersion ? (
                  <div
                    className="rounded-[16px] border border-white/8 bg-black/20"
                    style={{ paddingInline: compactInnerCardPadding, paddingBlock: Math.max(8, compactInnerCardPadding - 1) }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div
                          className="font-black uppercase tracking-[0.24em]"
                          style={{ color: style.accent, fontSize: `${detailLayout?.alternativeHintFontSize ?? 11}px` }}
                        >
                          {getVersionVisualLabel(getVersionVisualKind(selectedVersion)).label}
                        </div>
                        <div
                          className="font-semibold text-white"
                          style={{ ...clampTextLines(2), lineHeight: 1.3 }}
                        >
                          {selectedVersion.label}
                        </div>
                      </div>
                      <div
                        className="rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.22em]"
                        style={{
                          borderColor: style.accentStrong,
                          background: 'rgba(0, 227, 253, 0.12)',
                          color: style.accent,
                        }}
                      >
                        Active
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </SectionPanel>

            {showSoundtrack && (
              <SectionPanel panelColor={style.panel} borderColor={style.border} className="min-h-0">
                <div className="flex h-full min-h-0 flex-col" style={{ gap: Math.max(6, panelInnerGap - 8), padding: Math.max(8, panelPadding - 4) }}>
                  <SectionHeading title="Soundtrack Module" accent={style.accent} mutedText={style.mutedText} />
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
                        <div className="truncate font-black text-white" style={{ fontSize: `${Math.max(11, (detailLayout?.infoValueFontSize ?? 13) - 1)}px` }}>{game.musician.name}</div>
                        <div className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: style.mutedText }}>
                          {settings.activePlatformId === 'c64' ? 'SID Composer' : 'Music Composer'}
                        </div>
                      </div>
                    </div>
                  ) : null}
                  <div onMouseEnter={() => nav.hoverZone('sid')} className={nav.focusCls('sid')}>
                    <MusicPlayer platformId={settings.activePlatformId} filename={game.sidFilename} compact={true} />
                  </div>
                </div>
              </SectionPanel>
            )}

            <SectionPanel panelColor={style.panel} borderColor={style.border} className="min-h-0">
              <div className="flex h-full min-h-0 flex-col" style={{ gap: Math.max(10, panelPadding - 2), padding: panelPadding }}>
                <SectionHeading title="Version Details" accent={style.accent} mutedText={style.mutedText} />
                <div className="grid gap-1.5">
                  <InfoRow label="Version By" value={cleanMetadataValue(game.versionBy) ?? 'Unknown'} mutedText={style.mutedText} layout={infoDensity} />
                  <InfoRow label="PAL/NTSC" value={cleanMetadataValue(game.vPalNtsc) ?? formatVersionLabel(game)} mutedText={style.mutedText} layout={infoDensity} />
                  <InfoRow label="Size" value={cleanMetadataValue(game.vLength) ? `${game.vLength} Blocks` : 'Unknown'} mutedText={style.mutedText} layout={infoDensity} />
                  <InfoRow label="Trainers" value={cleanMetadataValue(game.vTrainers) ?? '0'} mutedText={style.mutedText} layout={infoDensity} />
                </div>
                <div
                  className="grid rounded-[18px] border border-white/8 bg-black/20"
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
            </SectionPanel>

            <SectionPanel panelColor={style.panel} borderColor={style.border} className="min-h-0">
              <div className="flex h-full min-h-0 flex-col" style={{ gap: Math.max(10, panelPadding - 2), padding: panelPadding }}>
                <SectionHeading title="Credits" accent={style.accent} mutedText={style.mutedText} />
                <div className="grid gap-1.5">
                  {personnel.length > 0 ? (
                    personnel.map((entry) => (
                      <InfoRow
                        key={`${entry.label}-${entry.value}`}
                        label={entry.label}
                        value={entry.value}
                        mutedText={style.mutedText}
                        layout={infoDensity}
                      />
                    ))
                  ) : (
                    <div className="rounded-[16px] border border-white/8 bg-black/20 px-4 py-3 text-sm" style={{ color: style.mutedText }}>
                      No credits metadata available for this title.
                    </div>
                  )}
                </div>
              </div>
            </SectionPanel>
          </aside>
        </div>
        </div>
            </div>
          </div>
        </div>
      </div>

      {detailLayout ? (
        <div className="pointer-events-none absolute bottom-3 right-4 z-20 rounded-full border border-white/8 bg-black/45 px-3 py-1 text-[10px] font-bold tracking-[0.18em] text-white/55 backdrop-blur-md">
          {detailLayout.debugLabel}
        </div>
      ) : null}
    </div>
  );
}
