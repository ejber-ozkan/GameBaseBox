"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { getPlatformImportStatus, getSecureSetting, saveSecureSetting, clearMediaCache } from '../lib/tauri-bridge';
import {
  createDefaultPlatformSettingsMap,
  isPlatformId,
  SUPPORTED_PLATFORMS,
} from '../lib/platform-capabilities';
import type {
  PlatformId,
  PlatformImportStatus,
  PlatformSettings,
} from '../types/platform';

export interface Settings {
  screenshotsPath: string;
  soundsPath: string;
  musicianPhotosPath: string;
  romsPath: string;
  emulatorPath: string;
  emuMoviesUsername: string;
  emuMoviesPassword: string;
  scrapedMediaPath: string;
  extrasPath: string;
  activeScraper: 'emumovies' | 'screenscraper' | 'thegamesdb';
  screenScraperUsername: string;
  screenScraperPassword: string;
  screenScraperDevId: string;
  screenScraperDevPassword: string;
  theGamesDbApiKey: string;
  hideAdultContent: boolean;
  recentlyPlayedIds: string[];
  retroarchPath: string;
  retroarchCorePath: string;
  preferredEmulator: 'vice' | 'retroarch';
  imageAnimation: 'none' | 'slide';
  imageCycling: boolean;
  lastSelectedGameId: string | null;
  lastFocusedIndex: number;
  lastViewMode: 'grid' | 'list';
  isFullscreen: boolean;
  fullscreenDensity: 'auto' | 'compact' | 'standard' | 'comfortable';
  displayResolution: string; // presets like "720p", "1080p", "default"
  windowWidth: number;
  windowHeight: number;
  mouseHoverSelection: boolean;
  scrollNavigation: boolean;
  menuSoundEffects: boolean;
  c64RasterLines: boolean;
  bigBoxAnimateVertical: boolean;
  confirmFullscreenExit: boolean;
  lastBigBoxRailId: string | null;
  lastBigBoxGameId: string | null;
  activePlatformId: PlatformId;
  lastUsedPlatformId: PlatformId | null;
  platformSettings: Record<PlatformId, PlatformSettings>;
  themeId: string;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  setActivePlatform: (platformId: PlatformId) => void;
  resolveMediaPath: (type: 'screenshot' | 'sound' | 'musician' | 'extras', filename: string) => string;
  findAllVariants: (type: 'screenshot' | 'sound' | 'musician' | 'extras', filename: string) => Promise<string[]>;
  markAsPlayed: (gameId: string) => void;
}

const defaultPlatformSettings = createDefaultPlatformSettingsMap();
defaultPlatformSettings.c64.folders = {
  ...defaultPlatformSettings.c64.folders,
  gamesPath: '',
  musicPath: '/media/sounds',
  photosPath: '/media/musicians',
  screenshotsPath: '/media/screenshots',
  extrasPath: '/media/extras',
};

const defaultSettings: Settings = {
  screenshotsPath: '/media/screenshots',
  soundsPath: '/media/sounds',
  musicianPhotosPath: '/media/musicians',
  romsPath: '',
  emulatorPath: '',
  emuMoviesUsername: '',
  emuMoviesPassword: '',
  scrapedMediaPath: '/media/scraped',
  extrasPath: '/media/extras',
  activeScraper: 'emumovies',
  screenScraperUsername: '',
  screenScraperPassword: '',
  screenScraperDevId: '',
  screenScraperDevPassword: '',
  theGamesDbApiKey: '',
  hideAdultContent: false,
  recentlyPlayedIds: [],
  retroarchPath: '',
  retroarchCorePath: '',
  preferredEmulator: 'vice',
  imageAnimation: 'none',
  imageCycling: true,
  lastSelectedGameId: null,
  lastFocusedIndex: 0,
  lastViewMode: 'grid',
  isFullscreen: false,
  fullscreenDensity: 'auto',
  displayResolution: 'default',
  windowWidth: 1200,
  windowHeight: 800,
  mouseHoverSelection: true,
  scrollNavigation: true,
  menuSoundEffects: true,
  c64RasterLines: true,
  bigBoxAnimateVertical: true,
  confirmFullscreenExit: true,
  lastBigBoxRailId: null,
  lastBigBoxGameId: null,
  activePlatformId: 'c64',
  lastUsedPlatformId: 'c64',
  platformSettings: defaultPlatformSettings,
  themeId: 'arcade-void',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SECURE_FIELDS = ['emuMoviesPassword', 'screenScraperPassword', 'screenScraperDevPassword', 'theGamesDbApiKey'] as const;
const LEGACY_PATH_FIELDS = [
  'romsPath',
  'soundsPath',
  'musicianPhotosPath',
  'screenshotsPath',
  'extrasPath',
] as const;

function migratePlatformSettings(
  values: Partial<Settings>,
  hasStoredPlatformSettings = Boolean(values.platformSettings),
): Record<PlatformId, PlatformSettings> {
  const platformSettings = createDefaultPlatformSettingsMap();
  const existing = values.platformSettings;

  if (existing) {
    (Object.keys(existing) as PlatformId[]).forEach((platformId) => {
      if (!isPlatformId(platformId)) return;
      platformSettings[platformId] = {
        ...platformSettings[platformId],
        ...existing[platformId],
        library: {
          ...platformSettings[platformId].library,
          ...existing[platformId]?.library,
        },
        folders: {
          ...platformSettings[platformId].folders,
          ...existing[platformId]?.folders,
        },
        emulator: {
          ...platformSettings[platformId].emulator,
          ...existing[platformId]?.emulator,
          executablePaths: {
            ...platformSettings[platformId].emulator.executablePaths,
            ...existing[platformId]?.emulator?.executablePaths,
          },
          corePaths: {
            ...platformSettings[platformId].emulator.corePaths,
            ...existing[platformId]?.emulator?.corePaths,
          },
        },
        navigation: {
          ...platformSettings[platformId].navigation,
          ...existing[platformId]?.navigation,
        },
      };
    });
  }

  const c64 = platformSettings.c64;
  c64.library = {
    ...c64.library,
    importStatus: 'imported',
    active: true,
  };
  if (!hasStoredPlatformSettings) {
    c64.folders = {
      ...c64.folders,
      gamesPath: values.romsPath ?? c64.folders.gamesPath,
      musicPath: values.soundsPath ?? c64.folders.musicPath,
      photosPath: values.musicianPhotosPath ?? c64.folders.photosPath,
      screenshotsPath: values.screenshotsPath ?? c64.folders.screenshotsPath,
      extrasPath: values.extrasPath ?? c64.folders.extrasPath,
    };
    c64.emulator = {
      ...c64.emulator,
      preferredEmulatorProfileId: values.preferredEmulator === 'retroarch' ? 'retroarch-c64' : 'vice-c64',
      executablePaths: {
        ...c64.emulator.executablePaths,
        'vice-c64': values.emulatorPath ?? c64.emulator.executablePaths['vice-c64'] ?? '',
        'retroarch-c64': values.retroarchPath ?? c64.emulator.executablePaths['retroarch-c64'] ?? '',
      },
      corePaths: {
        ...c64.emulator.corePaths,
        'retroarch-c64': values.retroarchCorePath ?? c64.emulator.corePaths['retroarch-c64'] ?? '',
      },
    };
    c64.navigation = {
      ...c64.navigation,
      recentlyPlayedIds: values.recentlyPlayedIds ?? c64.navigation.recentlyPlayedIds,
      lastSelectedGameId: values.lastSelectedGameId ?? c64.navigation.lastSelectedGameId,
      lastFocusedIndex: values.lastFocusedIndex ?? c64.navigation.lastFocusedIndex,
      lastViewMode: values.lastViewMode ?? c64.navigation.lastViewMode,
      lastBigBoxRailId: values.lastBigBoxRailId ?? c64.navigation.lastBigBoxRailId,
      lastBigBoxGameId: values.lastBigBoxGameId ?? c64.navigation.lastBigBoxGameId,
    };
  }

  return platformSettings;
}

type PlatformImportStatusSnapshot = {
  platformId: string;
  importStatus: string;
  sourceMdbPath?: string | null;
  gameCount: number;
  lastImportError?: string | null;
};

function isPlatformImportStatus(value: string): value is PlatformImportStatus {
  return ['notImported', 'importing', 'imported', 'failed'].includes(value);
}

export function applyPlatformImportStatuses(
  platformSettings: Record<PlatformId, PlatformSettings>,
  statuses: PlatformImportStatusSnapshot[],
): Record<PlatformId, PlatformSettings> {
  const next = { ...platformSettings };

  statuses.forEach((status) => {
    if (!isPlatformId(status.platformId)) {
      return;
    }
    if (!isPlatformImportStatus(status.importStatus)) {
      return;
    }

    next[status.platformId] = {
      ...next[status.platformId],
      library: {
        ...next[status.platformId].library,
        importStatus: status.importStatus,
        sourceMdbPath: status.sourceMdbPath ?? next[status.platformId].library.sourceMdbPath,
        lastImportError: status.lastImportError ?? null,
        gameCount: status.gameCount,
      },
    };
  });

  return next;
}

function resolveStartupPlatformId(
  requestedPlatformId: PlatformId,
  platformSettings: Record<PlatformId, PlatformSettings>,
): PlatformId {
  if (platformSettings[requestedPlatformId]?.library.importStatus === 'imported') {
    return requestedPlatformId;
  }

  return (Object.keys(platformSettings) as PlatformId[])
    .find((platformId) => platformSettings[platformId].library.importStatus === 'imported') ?? requestedPlatformId;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  // Initialize and load
  useEffect(() => {
    async function initializeSettings() {
      // 1. Load basic settings from localStorage
      let localValues: Partial<Settings> = {};
      try {
        const saved = localStorage.getItem('gb64_settings');
        if (saved) {
          localValues = JSON.parse(saved);
        }
      } catch (e) {
        console.error('Failed to load settings from localStorage', e);
      }

      // 2. Load secure settings from Rust/SQLite
      const secureValues: Partial<Settings> = {};
      for (const field of SECURE_FIELDS) {
        try {
          const value = await getSecureSetting(field);
          if (value) {
            secureValues[field] = value;
          } else if (localValues[field]) {
            // 3. MIGRATION: If found in localStorage but NOT in secure storage, move it
            console.log(`Migrating ${field} to secure storage...`);
            await saveSecureSetting(field, localValues[field] as string);
            secureValues[field] = localValues[field];
          }
        } catch (err) {
          console.error(`Error loading/migrating secure field ${field}:`, err);
        }
      }

      // 4. Sanitize localStorage (remove secure fields)
      const sanitizedLocal = { ...localValues };
      let needsSanitization = false;
      SECURE_FIELDS.forEach(field => {
        if (sanitizedLocal[field]) {
          delete sanitizedLocal[field];
          needsSanitization = true;
        }
      });
      const legacyPathValues: Partial<Settings> = {};
      LEGACY_PATH_FIELDS.forEach((field) => {
        if (sanitizedLocal[field] !== undefined) {
          legacyPathValues[field] = sanitizedLocal[field];
          delete sanitizedLocal[field];
          needsSanitization = true;
        }
      });
      const combinedSettings = {
        ...defaultSettings,
        ...sanitizedLocal,
        ...legacyPathValues,
        ...secureValues
      };
      const activePlatformId = isPlatformId(combinedSettings.activePlatformId)
        ? combinedSettings.activePlatformId
        : 'c64';

      let platformSettings = migratePlatformSettings(combinedSettings, Boolean(sanitizedLocal.platformSettings));
      const platformStatuses = await Promise.all(
        SUPPORTED_PLATFORMS.map((platform) => getPlatformImportStatus(platform.id)),
      );
      platformSettings = applyPlatformImportStatuses(platformSettings, platformStatuses);
      const startupPlatformId = resolveStartupPlatformId(activePlatformId, platformSettings);

      (Object.keys(platformSettings) as PlatformId[]).forEach((platformId) => {
        platformSettings[platformId] = {
          ...platformSettings[platformId],
          library: {
            ...platformSettings[platformId].library,
            active: platformId === startupPlatformId,
          },
        };
      });

      if (needsSanitization) {
        const normalizedLocal = {
          ...combinedSettings,
          activePlatformId: startupPlatformId,
          lastUsedPlatformId: startupPlatformId,
          platformSettings,
        };
        SECURE_FIELDS.forEach((field) => delete normalizedLocal[field]);
        LEGACY_PATH_FIELDS.forEach((field) => delete normalizedLocal[field]);
        localStorage.setItem('gb64_settings', JSON.stringify(normalizedLocal));
      }

      // 5. Set final combined state
      const startupNav = platformSettings[startupPlatformId].navigation;
      setSettings({
        ...combinedSettings,
        activePlatformId: startupPlatformId,
        lastUsedPlatformId: startupPlatformId,
        lastSelectedGameId: startupNav.lastSelectedGameId,
        lastFocusedIndex: startupNav.lastFocusedIndex,
        lastViewMode: startupNav.lastViewMode,
        recentlyPlayedIds: startupNav.recentlyPlayedIds,
        lastBigBoxRailId: startupNav.lastBigBoxRailId,
        lastBigBoxGameId: startupNav.lastBigBoxGameId,
        platformSettings,
      });
      setIsLoaded(true);
    }

    if (typeof window !== 'undefined') {
      initializeSettings();
    }
  }, []);

  // Apply window settings when they change
  useEffect(() => {
    if (isLoaded) {
      import('../lib/tauri-bridge').then(({ setWindowMode }) => {
        let w = settings.windowWidth;
        let h = settings.windowHeight;

        // Overlay preset if not "default"
        if (settings.displayResolution !== 'default') {
          const [pw, ph] = settings.displayResolution.split('x').map(Number);
          if (!isNaN(pw) && !isNaN(ph)) {
            w = pw;
            h = ph;
          }
        }
        
        setWindowMode(settings.isFullscreen, w, h);
      });
    }
  }, [isLoaded, settings.isFullscreen, settings.displayResolution, settings.windowWidth, settings.windowHeight]);

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings((prev) => {
      // Flat media paths are consumed only by migratePlatformSettings for pre-scoped installs.
      const scopedNewSettings = { ...newSettings };
      LEGACY_PATH_FIELDS.forEach((field) => delete scopedNewSettings[field]);

      // Check if anything actually changed to avoid unnecessary state updates
      const hasChange = Object.entries(scopedNewSettings).some(([k, v]) => prev[k as keyof Settings] !== v);
      if (!hasChange) return prev;

      const updated = { ...prev, ...scopedNewSettings };

      // Clear the frontend media path/URL cache ONLY if the active platform or folder paths changed.
      // This prevents clearing the cache during navigation (lastFocusedIndex, lastSelectedGameId, recentlyPlayedIds, etc.).
      const platformChanged = prev.activePlatformId !== updated.activePlatformId;
      const pathsChanged = Object.keys(updated.platformSettings).some(platformId => {
        const pId = platformId as PlatformId;
        const prevFolders = prev.platformSettings[pId]?.folders;
        const newFolders = updated.platformSettings[pId]?.folders;
        if (!prevFolders || !newFolders) return false;
        return (
          prevFolders.screenshotsPath !== newFolders.screenshotsPath ||
          prevFolders.musicPath !== newFolders.musicPath ||
          prevFolders.photosPath !== newFolders.photosPath ||
          prevFolders.extrasPath !== newFolders.extrasPath ||
          prevFolders.boxArtPath !== newFolders.boxArtPath ||
          prevFolders.videosPath !== newFolders.videosPath ||
          prevFolders.gamesPath !== newFolders.gamesPath
        );
      });

      if (platformChanged || pathsChanged) {
        clearMediaCache();
      }
      
      // Sync flat navigation properties into platform-scoped settings
      const activePlatformId = updated.activePlatformId;
      if (activePlatformId && updated.platformSettings[activePlatformId]) {
        const currentNav = updated.platformSettings[activePlatformId].navigation;
        const newNav = {
          lastSelectedGameId: updated.lastSelectedGameId,
          lastFocusedIndex: updated.lastFocusedIndex,
          lastViewMode: updated.lastViewMode,
          recentlyPlayedIds: updated.recentlyPlayedIds,
          lastBigBoxRailId: updated.lastBigBoxRailId,
          lastBigBoxGameId: updated.lastBigBoxGameId,
        };
        
        if (
          currentNav.lastSelectedGameId !== newNav.lastSelectedGameId ||
          currentNav.lastFocusedIndex !== newNav.lastFocusedIndex ||
          currentNav.lastViewMode !== newNav.lastViewMode ||
          currentNav.recentlyPlayedIds !== newNav.recentlyPlayedIds ||
          currentNav.lastBigBoxRailId !== newNav.lastBigBoxRailId ||
          currentNav.lastBigBoxGameId !== newNav.lastBigBoxGameId
        ) {
          updated.platformSettings = {
            ...updated.platformSettings,
            [activePlatformId]: {
              ...updated.platformSettings[activePlatformId],
              navigation: newNav,
            },
          };
        }
      }
      
      // 1. Persist sensitive fields to Secure storage (Rust/SQLite)
      SECURE_FIELDS.forEach(field => {
        if (scopedNewSettings[field] !== undefined) {
          saveSecureSetting(field, scopedNewSettings[field] as string);
        }
      });

      // 2. Persist others to localStorage (JSON)
      if (typeof window !== 'undefined') {
        try {
          const toSave = { ...updated };
          // Remove secure fields from localStorage object
          SECURE_FIELDS.forEach(field => delete toSave[field as keyof Settings]);
          LEGACY_PATH_FIELDS.forEach(field => delete toSave[field]);
          localStorage.setItem('gb64_settings', JSON.stringify(toSave));
        } catch (e) {
          console.error('Failed to save settings to localStorage', e);
        }
      }
      return updated;
    });
  }, []);

  const setActivePlatform = useCallback((platformId: PlatformId) => {
    const targetNav = settings.platformSettings[platformId].navigation;

    updateSettings({
      activePlatformId: platformId,
      lastUsedPlatformId: platformId,
      lastSelectedGameId: targetNav.lastSelectedGameId,
      lastFocusedIndex: targetNav.lastFocusedIndex,
      lastViewMode: targetNav.lastViewMode,
      recentlyPlayedIds: targetNav.recentlyPlayedIds,
      lastBigBoxRailId: targetNav.lastBigBoxRailId,
      lastBigBoxGameId: targetNav.lastBigBoxGameId,
      platformSettings: {
        ...(Object.fromEntries(
          (Object.keys(settings.platformSettings) as PlatformId[]).map((candidatePlatformId) => [
            candidatePlatformId,
            {
              ...settings.platformSettings[candidatePlatformId],
              library: {
                ...settings.platformSettings[candidatePlatformId].library,
                active: platformId === candidatePlatformId,
              },
            },
          ]),
        ) as Record<PlatformId, PlatformSettings>),
      },
    });
  }, [settings.platformSettings, updateSettings]);


  const resolveMediaPath = useCallback((type: 'screenshot' | 'sound' | 'musician' | 'extras', filename: string) => {
    const folders = settings.platformSettings[settings.activePlatformId]?.folders;
    const basePath = (() => {
      switch (type) {
        case 'screenshot':
          return folders?.screenshotsPath ?? '';
        case 'sound':
          return folders?.musicPath ?? '';
        case 'musician':
          return folders?.photosPath ?? '';
        case 'extras':
          return folders?.extrasPath ?? '';
        default:
          return '';
      }
    })();
    return basePath ? `${basePath}/${filename}` : filename;
  }, [settings.platformSettings, settings.activePlatformId]);

  const findAllVariants = useCallback(async (type: 'screenshot' | 'sound' | 'musician' | 'extras', filename: string): Promise<string[]> => {
    if (typeof window === 'undefined') return [];
    
    try {
      const { findAllMediaVariants, getMediaUrl, getAssetUrl } = await import('../lib/tauri-bridge');
      const folders = settings.platformSettings[settings.activePlatformId]?.folders;
      const baseDir = (() => {
        switch (type) {
          case 'screenshot':
            return folders?.screenshotsPath ?? '';
          case 'sound':
            return folders?.musicPath ?? '';
          case 'musician':
            return folders?.photosPath ?? '';
          case 'extras':
            return folders?.extrasPath ?? '';
          default:
            return '';
        }
      })();

      if (!baseDir) return [resolveMediaPath(type, filename)];

      const variants = await findAllMediaVariants(baseDir, filename);
      
      const urls = await Promise.all(
        variants.map(v => {
          if (type === 'screenshot' || type === 'musician' || type === 'extras') {
            return getAssetUrl(v);
          } else {
            return getMediaUrl(v);
          }
        })
      );
      return urls;
    } catch {
      return [resolveMediaPath(type, filename)];
    }
  }, [settings.platformSettings, settings.activePlatformId, resolveMediaPath]);
  
  const markAsPlayed = useCallback((gameId: string) => {
    setSettings(prev => {
      const newList = [gameId, ...prev.recentlyPlayedIds.filter(id => id !== gameId)].slice(0, 10);
      if (prev.recentlyPlayedIds[0] === gameId && prev.recentlyPlayedIds.length === newList.length) {
         return prev;
      }
      
      const activePlatformId = prev.activePlatformId;
      const platformSettings = { ...prev.platformSettings };
      if (activePlatformId && platformSettings[activePlatformId]) {
        platformSettings[activePlatformId] = {
          ...platformSettings[activePlatformId],
          navigation: {
            ...platformSettings[activePlatformId].navigation,
            recentlyPlayedIds: newList,
          },
        };
      }
      
      const updated = { ...prev, recentlyPlayedIds: newList, platformSettings };
      if (typeof window !== 'undefined') {
        localStorage.setItem('gb64_settings', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, setActivePlatform, resolveMediaPath, findAllVariants, markAsPlayed }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
