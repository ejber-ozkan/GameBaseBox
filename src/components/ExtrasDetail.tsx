"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Game, Extra } from '../types/game';
import { groupExtras, ExtraGroup } from '../lib/extras';
import { useSettings } from '../contexts/SettingsContext';
import { openFile, launchEmulator } from '../lib/tauri-bridge';
import type { DetailLayoutSpec } from '../lib/detail-layout';
import { buildLaunchRequest, buildPlatformAssetPath, getPlatformLaunchSettings } from '../lib/platform-launch';
import { VisualExtraCard } from './extras/VisualExtraCard';
import { VisualExtrasBrowser } from './extras/VisualExtrasBrowser';
import { isVideoExtra, isAudioExtra } from './extras/ResolvedExtraMedia';

interface ExtrasDetailProps {
  game: Game;
  extras: Extra[];
  visibleCategories?: ExtraGroup['category'][];
  hideEmptyState?: boolean;
  enableBigscreenGalleryUX?: boolean;
  layoutSpec?: DetailLayoutSpec;
  onRegisterBigscreenNavigation?: (navigation: ExtrasBigscreenNavigation | null) => void;
}

export interface ExtrasBigscreenNavigation {
  move: (direction: 'left' | 'right' | 'up' | 'down') => boolean;
  activate: () => boolean;
}

export function ExtrasDetail({
  game,
  extras,
  visibleCategories,
  hideEmptyState = false,
  enableBigscreenGalleryUX = false,
  layoutSpec,
  onRegisterBigscreenNavigation,
}: ExtrasDetailProps) {
  const { markAsPlayed, settings } = useSettings();
  const [groupedExtras, setGroupedExtras] = useState<ExtraGroup[]>([]);
  const [launchStatus, setLaunchStatus] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const visualNavigationRef = useRef<ExtrasBigscreenNavigation | null>(null);

  useEffect(() => {
    setGroupedExtras(groupExtras(extras));
  }, [extras]);

  const visibleGroups = visibleCategories
    ? groupedExtras.filter((group) => visibleCategories.includes(group.category))
    : groupedExtras;

  const visualGroupItems = visibleGroups.find((group) => group.category === 'visual')?.items ?? [];
  const mediaGroupItems = visibleGroups.find((group) => group.category === 'media')?.items ?? [];
  const videoMediaExtras = mediaGroupItems.filter(isVideoExtra);
  const nonVideoMediaExtras = mediaGroupItems.filter((item) => !isVideoExtra(item));
  const galleryExtras = [...visualGroupItems, ...videoMediaExtras];
  const platformLaunchSettings = getPlatformLaunchSettings(settings);

  const handleLaunchExtra = async (extra: Extra) => {
    if (!platformLaunchSettings.emulatorPath) {
      setLaunchStatus("Error: Emulator path not configured in Settings.");
      return;
    }

    setLaunchStatus(`Launching ${extra.name}...`);
    try {
      const result = await launchEmulator(buildLaunchRequest(settings, 'extras', extra.path, game));

      if (!result.success) {
        setLaunchStatus(`Error: ${result.message}`);
      } else {
        markAsPlayed(game.id.toString());
        setLaunchStatus(null);
      }
    } catch (err) {
      setLaunchStatus(`Error: ${String(err)}`);
    }
    setTimeout(() => setLaunchStatus(null), 5000);
  };

  const handleOpenDoc = async (extra: Extra) => {
    if (/^https?:\/\//i.test(extra.path.trim())) {
      window.open(extra.path, '_blank', 'noopener,noreferrer');
      return;
    }
    const fullPath = buildPlatformAssetPath(settings, 'extras', extra.path);
    await openFile(fullPath);
  };

  useEffect(() => {
    if (!enableBigscreenGalleryUX || !onRegisterBigscreenNavigation) {
      return undefined;
    }

    const navigation: ExtrasBigscreenNavigation = {
      move: (direction) => {
        if (direction === 'left' || direction === 'right') {
          return visualNavigationRef.current?.move(direction) ?? false;
        }
        return false;
      },
      activate: () => visualNavigationRef.current?.activate() ?? false,
    };

    onRegisterBigscreenNavigation(navigation);
    return () => onRegisterBigscreenNavigation(null);
  }, [enableBigscreenGalleryUX, onRegisterBigscreenNavigation]);

  if (extras.length === 0 || visibleGroups.length === 0) {
    if (hideEmptyState) return null;
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 opacity-50">
        <span className="text-4xl mb-4">🗂️</span>
        <p className="text-sm font-medium">No additional extras available for this title.</p>
      </div>
    );
  }

  if (enableBigscreenGalleryUX && layoutSpec) {
    const docsExtras = (visibleGroups.find((group) => group.category === 'docs')?.items ?? []).slice(0, layoutSpec.extrasDocSlots);
    const mediaExtras = nonVideoMediaExtras.slice(0, layoutSpec.extrasMediaSlots);

    return (
      <div ref={scrollContainerRef} className="grid h-full min-h-0 min-w-0" style={{ gap: layoutSpec.panelInnerGap, gridTemplateRows: 'minmax(0,1fr) auto auto' }}>
        {launchStatus && (
          <div className="fixed bottom-8 right-8 z-[110] rounded-full border border-blue-500 bg-blue-900/90 px-6 py-3 text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300">
            {launchStatus}
          </div>
        )}

        {galleryExtras.length > 0 ? (
          <div className="min-h-0">
            <VisualExtrasBrowser
              extras={galleryExtras}
              extrasPath={settings.platformSettings[settings.activePlatformId].folders.extrasPath}
              previewHeight={layoutSpec.extrasPreviewHeight}
              thumbColumns={layoutSpec.extrasThumbColumns}
              thumbnailLimit={layoutSpec.extrasThumbColumns}
              onRegisterNavigation={(navigation) => {
                visualNavigationRef.current = navigation;
              }}
            />
          </div>
        ) : (
          <div className="flex min-h-0 items-center justify-center rounded-[18px] border border-white/8 bg-black/20 text-sm text-gray-400">
            No gallery or media artwork available for this title.
          </div>
        )}

        {docsExtras.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">Documents & Manuals</h3>
              <div className="h-px flex-1 bg-gradient-to-r from-gray-700/50 to-transparent"></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {docsExtras.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleOpenDoc(item)}
                  className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/40 p-3 text-left transition-all hover:border-gray-600 hover:bg-gray-800/60"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-500/20 bg-red-950/30 text-red-400">
                    {item.path.toLowerCase().endsWith('.pdf') ? '📄' : '📝'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-white">{item.name}</div>
                    <div className="truncate text-[10px] uppercase tracking-wider text-gray-500">{item.path.split(/[\/\\]/).shift()}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : <div />}

        {mediaExtras.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">Media Assets</h3>
              <div className="h-px flex-1 bg-gradient-to-r from-gray-700/50 to-transparent"></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {mediaExtras.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleOpenDoc(item)}
                  className="flex items-center gap-3 rounded-xl border border-purple-900/30 bg-purple-950/20 p-3 text-left transition-all hover:border-purple-500/50 hover:bg-purple-900/40"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-400">
                    {item.path.toLowerCase().endsWith('.mp3') ? '🎵' : '🎬'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-white">{item.name}</div>
                    <div className="truncate text-[10px] uppercase tracking-wider text-purple-300/55">Asset file</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : <div />}
      </div>
    );
  }

  return (
    <div ref={scrollContainerRef} className="space-y-8 animate-in fade-in duration-500 pb-12">
      {launchStatus && (
        <div className="fixed bottom-8 right-8 z-[110] bg-blue-900/90 border border-blue-500 text-white px-6 py-3 rounded-full shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300">
          {launchStatus}
        </div>
      )}

      {visibleGroups.map(group => (
        <div key={group.category} className="space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="text-white font-bold text-xs uppercase tracking-[0.2em] opacity-80">{group.label}</h3>
            <div className="h-px flex-1 bg-gradient-to-r from-gray-700/50 to-transparent"></div>
          </div>

          {group.category === 'visual' && (
            enableBigscreenGalleryUX ? (
              <VisualExtrasBrowser
                extras={galleryExtras}
                extrasPath={settings.platformSettings[settings.activePlatformId].folders.extrasPath}
                onRegisterNavigation={(navigation) => {
                  visualNavigationRef.current = navigation;
                }}
              />
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {group.items.map((item, index) => (
                  <VisualExtraCard
                    key={item.id}
                    extra={item}
                    extrasPath={settings.platformSettings[settings.activePlatformId].folders.extrasPath}
                    extraIndex={index}
                    enableCarousel={false}
                    visualExtras={group.items}
                  />
                ))}
              </div>
            )
          )}

          {group.category === 'docs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {group.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleOpenDoc(item)}
                  className="flex items-center gap-4 p-4 bg-gray-900/40 border border-gray-800 rounded-xl hover:bg-gray-800/60 hover:border-gray-600 transition-all text-left group"
                >
                  <div className="w-10 h-10 flex-shrink-0 bg-red-950/30 border border-red-500/20 rounded-lg flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                    {item.path.toLowerCase().endsWith('.pdf') ? '📄' : '📝'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm truncate">{item.name}</div>
                    <div className="text-gray-500 text-[10px] uppercase tracking-wider truncate">{item.path.split(/[\/\\]/).shift()}</div>
                  </div>
                  <span className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs">Open ↗</span>
                </button>
              ))}
            </div>
          )}

          {group.category === 'games' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {group.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleLaunchExtra(item)}
                  className="flex items-center gap-4 p-4 bg-blue-950/20 border border-blue-900/30 rounded-xl hover:bg-blue-900/40 hover:border-blue-500/50 transition-all text-left group"
                >
                  <div className="w-10 h-10 flex-shrink-0 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                    🕹️
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm truncate">{item.name}</div>
                    <div className="text-blue-400/60 text-[10px] uppercase tracking-wider truncate">Load from {item.path.split(/[\/\\]/).shift()}</div>
                  </div>
                  <span className="text-green-400 font-bold text-[10px] tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity">Launch</span>
                </button>
              ))}
            </div>
          )}

          {group.category === 'media' && (enableBigscreenGalleryUX ? nonVideoMediaExtras.length > 0 : group.items.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               {(enableBigscreenGalleryUX ? nonVideoMediaExtras : group.items).map(item => (
                <button
                  key={item.id}
                  onClick={() => handleOpenDoc(item)}
                  className="flex items-center gap-4 p-4 bg-purple-950/20 border border-purple-900/30 rounded-xl hover:bg-purple-900/40 hover:border-purple-500/50 transition-all text-left group"
                >
                  <div className="w-10 h-10 flex-shrink-0 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                    {isAudioExtra(item) ? '🎵' : '🎬'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm truncate">{item.name}</div>
                    <div className="text-purple-400/60 text-[10px] uppercase tracking-wider truncate">{isAudioExtra(item) ? 'Audio file' : 'Video file'}</div>
                  </div>
                   <span className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs">{isAudioExtra(item) ? 'Play ↗' : 'Open ↗'}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


