"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getGameExtras } from '../../../lib/tauri-bridge';
import { useSettings } from '../../../contexts/SettingsContext';
import { cleanMetadataValue, getGameStudios } from '../../../lib/game-display';
import type { Extra } from '../../../types/game';
import { getVisibleDetailExtraCategories, groupExtras } from '../../../lib/extras';
import { isLaunchableExtra } from '../../../lib/extras';
import { ImageSlider } from '../../ImageSlider';
import { ExtrasDetail } from '../../ExtrasDetail';
import { MusicianPhoto } from '../../MusicianPhoto';
import { MusicPlayer } from '../../MusicPlayer';
import { StatusRow } from '../../StatusRow';
import { PlayButton } from '../PlayButton';
import { DetailGameTitle } from '../../detail/DetailGameTitle';
import { DetailTitleBanner } from '../../detail/DetailTitleBanner';
import type { DetailLayoutProps } from '../../DetailView';
import { useResolvedBoxArtUrl } from '../../../hooks/useResolvedBoxArtUrl';

type WindowedMediaId = 'gameplay' | 'titlescreen' | 'videosna' | 'boxfront';
type WindowedDetailTab = 'gallery' | 'extras-alt' | 'extras';

export interface WindowedThemePalette {
  accentPanel: string;
  accentText: string;
  background: string;
  favoriteButton: string;
  surface: string;
}

interface WindowedDetailLayoutProps extends DetailLayoutProps {
  palette: WindowedThemePalette;
}

const ZONE_TO_MEDIA: Partial<Record<string, WindowedMediaId>> = {
  'media-gameplay': 'gameplay',
  'media-titlescreen': 'titlescreen',
  'media-videosna': 'videosna',
  'media-boxfront': 'boxfront',
};

function mediaZoneFor(id: WindowedMediaId) {
  switch (id) {
    case 'gameplay':
      return 'media-gameplay';
    case 'titlescreen':
      return 'media-titlescreen';
    case 'videosna':
      return 'media-videosna';
    case 'boxfront':
      return 'media-boxfront';
  }
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/8 pb-3">
      <span className="text-white/45">{label}</span>
      <span className="text-right font-medium text-white">{value}</span>
    </div>
  );
}

export function WindowedDetailLayout({
  game,
  onBack,
  nav,
  onFullscreen,
  palette,
  isFavorite,
  onToggleFavorite,
}: WindowedDetailLayoutProps) {
  const { resolveMediaPath, settings } = useSettings();
  const [extras, setExtras] = useState<Extra[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<WindowedMediaId>('gameplay');
  const [activeTab, setActiveTab] = useState<WindowedDetailTab>('gallery');

  useEffect(() => {
    let isCancelled = false;
    getGameExtras(game.id, settings.activePlatformId).then((items) => {
      if (!isCancelled) {
        setExtras(items);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [game.id, settings.activePlatformId]);

  const studios = getGameStudios(game);
  const headerArtworkUrl = useResolvedBoxArtUrl(game);
  const showBoxArtPanel = Boolean(headerArtworkUrl);
  const groupedExtras = useMemo(() => groupExtras(extras), [extras]);
  const launchableExtras = useMemo(
    () => (groupedExtras.find((group) => group.category === 'games')?.items ?? []).filter(isLaunchableExtra),
    [groupedExtras],
  );
  const galleryExtras = useMemo(
    () => groupedExtras
      .filter((group) => getVisibleDetailExtraCategories(settings.activePlatformId).includes(group.category))
      .flatMap((group) => group.items),
    [groupedExtras, settings.activePlatformId],
  );
  const availableTabs = useMemo(() => {
    const tabs: WindowedDetailTab[] = ['gallery'];
    if (launchableExtras.length > 0) {
      tabs.push('extras-alt');
    }
    if (galleryExtras.length > 0) {
      tabs.push('extras');
    }
    return tabs;
  }, [galleryExtras.length, launchableExtras.length]);
  const visibleTab = availableTabs.includes(activeTab) ? activeTab : 'gallery';

  const availableMedia = useMemo(() => {
    const items: Array<{ id: WindowedMediaId; label: string; filename: string | null }> = [
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
  }, [game.boxFrontFilename, game.coverPath, game.screenshotFilename, game.titlescreenFilename, game.videoSnapFilename, showBoxArtPanel]);

  const focusedMedia = ZONE_TO_MEDIA[nav.focusedZone];
  const activeMedia = focusedMedia ?? selectedMedia;
  const currentMediaIndex = Math.max(availableMedia.findIndex((item) => item.id === activeMedia), 0);
  const galleryFocusZone = availableMedia.length > 0 ? mediaZoneFor(availableMedia[Math.max(currentMediaIndex, 0)].id) : 'play';

  const selectTab = useCallback((tab: WindowedDetailTab) => {
    setActiveTab(tab);
    nav.setFocusedZone(tab === 'gallery' ? galleryFocusZone : 'media-extras');
  }, [galleryFocusZone, nav]);

  const cycleTab = useCallback((direction: 'previous' | 'next') => {
    if (availableTabs.length <= 1) {
      return;
    }
    const currentIndex = availableTabs.indexOf(visibleTab);
    const delta = direction === 'next' ? 1 : -1;
    const nextIndex = (currentIndex + delta + availableTabs.length) % availableTabs.length;
    selectTab(availableTabs[nextIndex]);
  }, [availableTabs, selectTab, visibleTab]);

  useEffect(() => {
    nav.registerAction('play', () => document.getElementById('play-game-btn')?.click());
    nav.registerAction('play-web', () => document.getElementById('play-browser-btn')?.click());
    nav.registerAction('sid', () => (document.getElementById('sid-play-btn') ?? document.getElementById('sap-play-btn'))?.click());
    nav.registerAction('favorite', onToggleFavorite);
    nav.registerAction('media-gameplay', () => onFullscreen(game.screenshotFilename));
    nav.registerAction('media-titlescreen', () => onFullscreen(game.titlescreenFilename));
    nav.registerAction('media-videosna', () => onFullscreen(game.screenshotFilename));
    nav.registerAction('media-boxfront', () => onFullscreen(game.boxFrontFilename ?? game.coverPath ?? null));
    nav.registerAction('media-extras', () => undefined);
    nav.registerTabActions({
      previous: () => cycleTab('previous'),
      next: () => cycleTab('next'),
    });

    if (visibleTab === 'gallery') {
      availableMedia.forEach((item, index) => {
        nav.registerDirectionalOverride(mediaZoneFor(item.id), (dir) => {
          if (dir === 'left' && index > 0) {
            const previousMedia = availableMedia[index - 1];
            setSelectedMedia(previousMedia.id);
            nav.setFocusedZone(mediaZoneFor(previousMedia.id));
            return true;
          }
          if (dir === 'right' && index < availableMedia.length - 1) {
            const nextMedia = availableMedia[index + 1];
            setSelectedMedia(nextMedia.id);
            nav.setFocusedZone(mediaZoneFor(nextMedia.id));
            return true;
          }
          return false;
        });
      });
    }
  }, [
    availableMedia,
    cycleTab,
    game.boxFrontFilename,
    game.coverPath,
    game.screenshotFilename,
    game.titlescreenFilename,
    nav,
    onFullscreen,
    onToggleFavorite,
    visibleTab,
  ]);

  const titleLine = [game.year, ...studios].filter(Boolean).join(' • ');
  const stageMediaFilename =
    activeMedia === 'gameplay'
      ? game.screenshotFilename
      : activeMedia === 'titlescreen'
        ? game.titlescreenFilename
        : activeMedia === 'videosna'
          ? game.videoSnapFilename
          : activeMedia === 'boxfront'
            ? game.boxFrontFilename ?? game.coverPath ?? null
            : null;

  return (
    <div className={`flex h-full min-h-screen w-full flex-col ${palette.background}`}>
      <div className="mx-auto flex w-full max-w-[1680px] flex-1 flex-col gap-6 px-4 py-5 md:px-6 xl:px-8">
        <DetailTitleBanner
          artUrl={headerArtworkUrl}
          className={`rounded-[28px] border ${palette.surface} shadow-[0_24px_80px_rgba(2,6,23,0.35)]`}
          contentClassName="px-5 py-5"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <button
                  onClick={onBack}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/70 transition-all hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
                >
                  ← Library
                </button>
                <button
                  onClick={onToggleFavorite}
                  onMouseEnter={() => nav.hoverZone('favorite')}
                  className={`flex h-12 w-12 items-center justify-center rounded-full border text-xl transition-all ${palette.favoriteButton} ${nav.focusCls('favorite')}`}
                  title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {isFavorite ? '♥' : '♡'}
                </button>
              </div>

              <DetailGameTitle
                className="max-w-5xl flex flex-wrap items-center gap-4 text-3xl font-black tracking-tighter text-white md:text-5xl xl:text-6xl"
                isClassic={game.isClassic}
                outlined
                title={game.name}
              />
              <div
                className={`mt-3 text-sm font-bold uppercase tracking-[0.18em] md:text-base ${palette.accentText}`}
                style={headerArtworkUrl ? { textShadow: '0 2px 10px rgba(0, 0, 0, 0.9)' } : undefined}
              >
                {titleLine || 'GB64'}
              </div>
            </div>

            <div className="w-full max-w-[420px]" onMouseEnter={() => nav.hoverZone('play')}>
              <PlayButton game={game} nav={nav} />
            </div>
          </div>
        </DetailTitleBanner>

        <div className="grid min-h-0 flex-1 gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
          <div className="min-w-0 space-y-6">
            <div className={`rounded-[28px] border ${palette.surface} p-4 shadow-[0_20px_70px_rgba(2,6,23,0.3)]`}>
              <div className="mb-4 flex flex-wrap gap-2 border-b border-white/10 pb-4">
                <button
                  type="button"
                  onClick={() => selectTab('gallery')}
                  onMouseEnter={() => nav.hoverZone(galleryFocusZone)}
                  className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all ${
                    visibleTab === 'gallery'
                      ? `${palette.accentPanel} ${palette.accentText}`
                      : 'border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white'
                  } ${visibleTab === 'gallery' ? nav.focusCls(galleryFocusZone) : ''}`}
                >
                  Gallery
                </button>
                {launchableExtras.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => selectTab('extras-alt')}
                    onMouseEnter={() => nav.hoverZone('media-extras')}
                    className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all ${
                      visibleTab === 'extras-alt'
                        ? `${palette.accentPanel} ${palette.accentText}`
                        : 'border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white'
                    } ${visibleTab === 'extras-alt' ? nav.focusCls('media-extras') : ''}`}
                  >
                    Extras Alt. ({launchableExtras.length})
                  </button>
                ) : null}
                {galleryExtras.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => selectTab('extras')}
                    onMouseEnter={() => nav.hoverZone('media-extras')}
                    className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all ${
                      visibleTab === 'extras'
                        ? `${palette.accentPanel} ${palette.accentText}`
                        : 'border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white'
                    } ${visibleTab === 'extras' ? nav.focusCls('media-extras') : ''}`}
                  >
                    Extras ({galleryExtras.length})
                  </button>
                ) : null}
              </div>

              {visibleTab === 'gallery' ? (
                <>
              <div className="mb-4 flex flex-wrap gap-2">
                {availableMedia.map((item) => {
                  const zone = mediaZoneFor(item.id);
                  const active = activeMedia === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedMedia(item.id);
                        nav.setFocusedZone(zone);
                      }}
                      onMouseEnter={() => nav.hoverZone(zone)}
                      className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all ${
                        active ? `${palette.accentPanel} ${palette.accentText}` : 'border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white'
                      } ${nav.focusCls(zone)}`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {
                <button
                  type="button"
                  onClick={() => {
                    if (activeMedia === 'videosna') {
                      onFullscreen(game.screenshotFilename);
                      return;
                    }
                    onFullscreen(stageMediaFilename);
                  }}
                  onMouseEnter={() => nav.hoverZone(mediaZoneFor(activeMedia))}
                  className={`group block w-full overflow-hidden rounded-[24px] border border-white/10 bg-black/40 shadow-[0_20px_60px_rgba(2,6,23,0.35)] transition-all ${nav.focusCls(mediaZoneFor(activeMedia))}`}
                >
                  <div className="aspect-[16/10] w-full overflow-hidden bg-black/50">
                    {activeMedia === 'videosna' && game.videoSnapFilename ? (
                      <video
                        autoPlay
                        className="h-full w-full object-contain"
                        loop
                        muted
                        src={resolveMediaPath('screenshot', game.videoSnapFilename)}
                      />
                    ) : activeMedia === 'boxfront' ? (
                      <div className="h-full w-full flex items-center justify-center bg-black/50">
                        {headerArtworkUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={headerArtworkUrl}
                            alt={`${game.name} box art`}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <span className="text-xs text-white/55">No Image</span>
                        )}
                      </div>
                    ) : (
                      <ImageSlider
                        type="screenshot"
                        filename={stageMediaFilename}
                        alt={game.name}
                        className="h-full w-full object-contain"
                      />
                    )}
                  </div>
                </button>
              }
                </>
              ) : visibleTab === 'extras-alt' ? (
                <div
                  onMouseEnter={() => nav.hoverZone('media-extras')}
                  className={`rounded-[22px] border border-white/6 bg-black/15 p-4 ${nav.focusCls('media-extras')}`}
                >
                  <ExtrasDetail game={game} extras={launchableExtras} visibleCategories={['games']} hideEmptyState />
                </div>
              ) : (
                <div
                  onMouseEnter={() => nav.hoverZone('media-extras')}
                  className={`rounded-[22px] border border-white/6 bg-black/15 p-4 ${nav.focusCls('media-extras')}`}
                >
                  <ExtrasDetail game={game} extras={galleryExtras} visibleCategories={getVisibleDetailExtraCategories(settings.activePlatformId)} hideEmptyState />
                </div>
              )}
            </div>
          </div>

          <aside className="min-w-0 space-y-6">
            <div className={`rounded-[28px] border ${palette.surface} p-5`}>
              <div className={`mb-4 text-[11px] font-black uppercase tracking-[0.24em] ${palette.accentText}`}>
                Game Info
              </div>
              <div className="grid gap-3 text-sm text-white/75">
                <InfoRow label="Genre" value={game.parentGenre} />
                <InfoRow label="Sub-Genre" value={game.subGenre} />
                <InfoRow label="Control" value={game.control || 'Joystick'} />
                <InfoRow
                  label="Players"
                  value={
                    game.playersFrom === game.playersTo
                      ? game.playersFrom || '1'
                      : `${game.playersFrom || '1'}-${game.playersTo || '1'}`
                  }
                />
                <InfoRow label="Coder" value={cleanMetadataValue(game.coderName) || 'Unknown'} />
                <InfoRow label="Graphics" value={cleanMetadataValue(game.graphicsName) || 'Unknown'} />
              </div>
            </div>

            {game.musician ? (
              <div className={`rounded-[28px] border ${palette.surface} p-5`}>
                <div className={`mb-4 text-[11px] font-black uppercase tracking-[0.24em] ${palette.accentText}`}>
                  Music
                </div>
                <div className="mb-5 flex items-center gap-4">
                  <MusicianPhoto
                    className="h-16 w-16 shrink-0"
                    musicianName={game.musician.name}
                    photoFilename={game.musician.photoPath}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-lg font-black text-white">{game.musician.name}</div>
                    {game.musician.nick ? (
                      <div className="text-sm text-blue-300/80">&quot;{game.musician.nick}&quot;</div>
                    ) : null}
                  </div>
                </div>
                <div onMouseEnter={() => nav.hoverZone('sid')} className={nav.focusCls('sid')}>
                  <MusicPlayer platformId={settings.activePlatformId} filename={game.sidFilename} />
                </div>
              </div>
            ) : (
              <div onMouseEnter={() => nav.hoverZone('sid')} className={nav.focusCls('sid')}>
                <MusicPlayer platformId={settings.activePlatformId} filename={game.sidFilename} />
              </div>
            )}

            <div className={`rounded-[28px] border ${palette.surface} p-5`}>
              <div className={`mb-4 text-[11px] font-black uppercase tracking-[0.24em] ${palette.accentText}`}>
                Version Details
              </div>
              <div className="space-y-2">
                <InfoRow label="Version By" value={game.versionBy || '---'} />
                <InfoRow label="PAL / NTSC" value={game.vPalNtsc || '---'} />
                <InfoRow label="Size" value={game.vLength ? `${game.vLength} Blocks` : '---'} />
                <InfoRow label="Trainers" value={game.vTrainers || '0'} />
                <div className="my-3 h-px bg-white/10" />
                <StatusRow label="Loading Screen" value={game.vLoadingScreen} />
                <StatusRow label="High Score Saver" value={game.vHighScoreSaver} />
                <StatusRow label="Included Docs" value={game.vIncludedDocs} />
                <StatusRow label="True Drive Emul" value={game.vTrueDriveEmu} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
