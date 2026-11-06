"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getGameExtras, launchEmulator } from '../../lib/tauri-bridge';
import { useSettings } from '../../contexts/SettingsContext';
import { cleanMetadataValue, getGameStudios } from '../../lib/game-display';
import type { Extra } from '../../types/game';
import { buildLaunchRequest } from '../../lib/platform-launch';
import { groupExtras } from '../../lib/extras';
import { isLaunchableExtra } from '../../lib/extras';
import { PLATFORM_PROFILES, supportsEmbeddedEmulation } from '../../lib/platform-capabilities';
import { checkAmigaExtraExists, downloadAmigaExtra } from '../../lib/amiga-scraper';
import { type ExtrasBigscreenNavigation } from '../ExtrasDetail';
import type { DetailLayoutProps } from '../DetailView';
import { useResolvedBoxArtUrl } from '../../hooks/useResolvedBoxArtUrl';
import { useTheme } from '../../contexts/ThemeContext';
import type { DetailZone } from '../../hooks/useDetailNavigation';
import { useTranslation } from '../../i18n';
import { UnifiedDetailTab, LaunchVersionOption, getPlayersDetailLabel, getArchiveNotes, openScreenshotFullscreen, openBoxArtFullscreen, buildPersonnel, readStoredVersionId, persistSelectedVersion, buildVersions, InfoDensity } from './detailParts';

/**
 * State, derived layout values and handlers for the game details page, shared by every
 * theme layout in ./layouts. Kept separate so each layout is presentation only.
 */
export function useUnifiedDetailViewModel({
  game,
  onBack,
  nav,
  onFullscreen,
  isFavorite,
  onToggleFavorite,
  fullscreenLayout,
}: DetailLayoutProps) {
  const { t } = useTranslation();
  const { settings, resolveMediaPath, markAsPlayed } = useSettings();
  const canPlayEmbedded = supportsEmbeddedEmulation(settings.activePlatformId);
  const { theme } = useTheme();
  const [extras, setExtras] = useState<Extra[]>([]);
  const [activeTab, setActiveTab] = useState<UnifiedDetailTab>('game');
  const [selectedVersionId, setSelectedVersionId] = useState(() => readStoredVersionId(game.id));
  const extrasNavigationRef = useRef<ExtrasBigscreenNavigation | null>(null);
  const [launchWarning, setLaunchWarning] = useState<string | null>(null);

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
      { id: 'gameplay', label: t('detail.gameplay'), filename: game.screenshotFilename },
    ];
    if (game.titlescreenFilename) {
      items.push({ id: 'titlescreen', label: t('detail.titleScreen'), filename: game.titlescreenFilename });
    }
    if (game.videoSnapFilename) {
      items.push({ id: 'videosna', label: t('detail.video'), filename: game.videoSnapFilename });
    }
    if (showBoxArtPanel) {
      items.push({ id: 'boxfront', label: t('detail.boxArt'), filename: game.boxFrontFilename ?? game.coverPath ?? null });
    }
    return items;
  }, [game, showBoxArtPanel, t]);

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

  const groupedExtras = useMemo(() => groupExtras(extras, settings.activePlatformId), [extras, settings.activePlatformId]);
  const launchableExtras = useMemo(
    () => (groupedExtras.find((group) => group.category === 'games')?.items ?? []).filter((extra) => isLaunchableExtra(extra, settings.activePlatformId)),
    [groupedExtras, settings.activePlatformId],
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
  const versions = useMemo(() => buildVersions(game, launchableExtras), [game, launchableExtras]);
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
  // The C64 bezel banner is taller than other heroes, but the layout spec is computed
  // for the whole window while the C64 theme also draws its outer border. On shorter
  // screens keep the banner at the hero height so the panels below still fit.
  const c64TitlePanelHeight = Math.round(heroMinHeight * ((detailLayout?.designHeight ?? 900) < 900 ? 1 : 1.25));
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

  const [showWasm, setShowWasm] = useState(false);
  const [extraAvailability, setExtraAvailability] = useState<Record<string, boolean>>({});

  const amigaExtrasPath =
    settings.platformSettings?.amiga?.folders.extrasPath ||
    settings.extrasPath ||
    '';
  const amigaGamesPath =
    settings.platformSettings?.amiga?.folders.gamesPath ||
    settings.romsPath ||
    '';

  const versionsKey = useMemo(
    () => versions.map((v) => `${v.id}:${v.relativePath || ''}`).join('|'),
    [versions],
  );

  useEffect(() => {
    let active = true;
    async function checkExtras() {
      if (settings.activePlatformId !== 'amiga' || (!amigaExtrasPath && !amigaGamesPath)) return;

      const results: Record<string, boolean> = {};
      for (const v of versions) {
        if (v.source === 'extras' && v.relativePath) {
          const exists = await checkAmigaExtraExists(amigaExtrasPath, v.relativePath, amigaGamesPath);
          results[v.id] = exists;
        }
      }
      if (active) {
        setExtraAvailability((prev) => ({ ...prev, ...results }));
      }
    }
    checkExtras();
    return () => {
      active = false;
    };
  }, [settings.activePlatformId, amigaExtrasPath, amigaGamesPath, versionsKey, versions]);

  useEffect(() => {
    const handleDownloaded = (e: Event) => {
      const detail = (e as CustomEvent<{ extraPath: string; success: boolean }>).detail;
      if (detail?.success && detail.extraPath) {
        const normTarget = detail.extraPath.replace(/\\/g, '/').toLowerCase();
        const filenameTarget = normTarget.split('/').pop() || normTarget;
        const matching = versions.filter((v) => {
          if (!v.relativePath) return false;
          const normRel = v.relativePath.replace(/\\/g, '/').toLowerCase();
          const filenameRel = normRel.split('/').pop() || normRel;
          return normRel === normTarget || normRel.endsWith(normTarget) || normTarget.endsWith(normRel) || filenameRel === filenameTarget;
        });
        if (matching.length > 0) {
          setExtraAvailability((prev) => {
            const next = { ...prev };
            for (const m of matching) {
              next[m.id] = true;
            }
            return next;
          });
        }
      }
    };
    window.addEventListener('amiga-extra-downloaded', handleDownloaded);
    return () => {
      window.removeEventListener('amiga-extra-downloaded', handleDownloaded);
    };
  }, [versions]);

  const handleDownloadExtra = useCallback(
    async (version: LaunchVersionOption) => {
      if (!version.relativePath || settings.activePlatformId !== 'amiga') return;
      const targetPath = amigaExtrasPath || amigaGamesPath;
      if (!targetPath) {
        console.warn('Extras folder path is missing');
        return;
      }

      try {
        const extraObj: Extra = {
          id: version.id,
          name: version.label,
          path: version.relativePath,
          type: '1',
        };
        const res = await downloadAmigaExtra(extraObj, targetPath, settings.amigaDownloadTarget);
        if (res.exists) {
          setExtraAvailability((prev) => ({ ...prev, [version.id]: true }));
        }
      } catch (err) {
        console.error('Failed to download Amiga extra:', err);
      }
    },
    [settings.activePlatformId, amigaExtrasPath, amigaGamesPath, settings.amigaDownloadTarget],
  );

  const selectVersion = useCallback((versionId: string) => {
    setSelectedVersionId(versionId);
    persistSelectedVersion(game.id, versionId);
  }, [game.id]);

  const handlePlayWeb = useCallback(() => {
    const romRelativePath = selectedVersion?.relativePath || game.filename || game.gameFilename || '';
    if (!romRelativePath) return;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('game-launch'));
    }

    markAsPlayed(game.id.toString());
    setShowWasm(true);
  }, [game, selectedVersion, markAsPlayed]);

  const handleLaunchVersion = useCallback(
    async (version: LaunchVersionOption) => {
      if (!version.relativePath) return;

      if (settings.activePlatformId === 'atarist') {
        const isHardDisk = /harddisk|hdold/i.test(version.relativePath || '') || /harddisk/i.test(version.label) || /harddisk/i.test(version.tag);
        const bootDisk = settings.platformSettings.atarist?.folders.bootDiskPath?.trim();
        if (isHardDisk && !bootDisk) {
          setLaunchWarning(t('settings.atariStBootDiskMissingWarning'));
          setTimeout(() => setLaunchWarning(null), 6000);
          return;
        }
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('game-launch'));
      }

      try {
        const result = await launchEmulator(buildLaunchRequest(settings, version.source, version.relativePath, game));
        if (!result.success) {
          setLaunchWarning(result.message);
          setTimeout(() => setLaunchWarning(null), 6000);
        } else {
          markAsPlayed(game.id.toString());
        }
      } catch (err) {
        console.error('Failed to launch emulator from files list:', err);
        setLaunchWarning(String(err));
        setTimeout(() => setLaunchWarning(null), 6000);
      }
    },
    [settings, game, markAsPlayed, t],
  );

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


  useEffect(() => {
    nav.registerAction('play', () => document.getElementById('play-game-btn')?.click());
    nav.registerAction('play-web', () => document.getElementById('play-browser-btn')?.click());
    nav.registerAction('favorite', onToggleFavorite);
    nav.registerAction('emulation-settings', () => document.getElementById('c64-emulation-settings')?.click());
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


  return {
    game,
    onBack,
    nav,
    onFullscreen,
    isFavorite,
    onToggleFavorite,
    fullscreenLayout,
    t,
    settings,
    resolveMediaPath,
    markAsPlayed,
    canPlayEmbedded,
    theme,
    extras,
    setExtras,
    activeTab,
    setActiveTab,
    selectedVersionId,
    setSelectedVersionId,
    extrasNavigationRef,
    launchWarning,
    setLaunchWarning,
    FLUSH_HEIGHT_SCALING,
    activeSidebarTab,
    setActiveSidebarTab,
    focusedFileIndex,
    setFocusedFileIndex,
    sidebarNotesScrollRef,
    sidebarCreditsScrollRef,
    boxArtUrl,
    showBoxArtPanel,
    isC64,
    isCyberpunk,
    isArcade,
    panelCls,
    insetPanelCls,
    availableMedia,
    selectedMedia,
    setSelectedMedia,
    focusedMedia,
    activeMedia,
    groupedExtras,
    launchableExtras,
    archiveExtras,
    availableTabs,
    visibleTab,
    galleryFocusZone,
    selectTab,
    cycleTab,
    archiveNotes,
    versions,
    selectedVersion,
    versionIds,
    versionIdsKey,
    detailLayout,
    versionColumns,
    personnel,
    useStackedColumns,
    shellMaxWidth,
    panelGap,
    panelPadding,
    panelInnerGap,
    heroPaddingX,
    heroPaddingY,
    heroMinHeight,
    c64TitlePanelHeight,
    detailTitleMax,
    compactButtons,
    sidebarWidth,
    topBarPaddingX,
    topBarPaddingY,
    topBarHeight,
    mediaRowHeight,
    lowerRowHeight,
    mainColumnHeight,
    designWidth,
    designHeight,
    renderScale,
    surfaceWidth,
    surfaceHeight,
    showSoundtrack,
    sidebarTrackHeights,
    sidebarTemplateRows,
    infoDensity,
    compactLowerPanelGap,
    compactLowerPanelPadding,
    compactInnerCardPadding,
    alternativeButtonSize,
    alternativeGlyphSize,
    largePanelFocusCls,
    sidebarStatusColumns,
    screenshotFilename,
    boxFrontFilename,
    heroMeta,
    heroSupplementalMeta,
    showWasm,
    setShowWasm,
    extraAvailability,
    setExtraAvailability,
    amigaExtrasPath,
    amigaGamesPath,
    versionsKey,
    handleDownloadExtra,
    selectVersion,
    handlePlayWeb,
    handleLaunchVersion,
    handleFullscreenMedia,
    cycleSidebarTab,
    bgStyle,
  };
}

export type DetailViewModel = ReturnType<typeof useUnifiedDetailViewModel>;
