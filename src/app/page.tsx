"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  exitApp,
  getDatabaseBootstrapStatus,
  getGenres,
  getSubGenres,
  importPlatformDatabaseFromMdb,
  openDirectoryDialog,
  openMdbFileDialog,
} from '@/lib/tauri-bridge';
import { useSettings } from '@/contexts/SettingsContext';
import { GridView } from '@/components/GridView';
import { ListView } from '@/components/ListView';
import { DetailView } from '@/components/DetailView';
import { SettingsView } from '@/components/SettingsModal';
import { AlphabetJumpBar } from '@/components/AlphabetJumpBar';
import { useInputMode } from '@/hooks/useInputMode';
import { BigBoxView } from '@/components/BigBoxView';
import type { BigBoxSessionState } from '@/components/BigBoxView';
import { useFavorites } from '@/hooks/useFavorites';
import { useLibraryBrowserState } from '@/hooks/useLibraryBrowserState';
import { useLibraryShellInput } from '@/hooks/useLibraryShellInput';
import { LibraryHeader } from '@/components/library/LibraryHeader';
import { WindowGameShelf } from '@/components/library/WindowGameShelf';
import { WindowGameListSection } from '@/components/library/WindowGameListSection';
import { AppLaunchSplash } from '@/components/AppLaunchSplash';
import { DatabaseSetupView } from '@/components/setup/DatabaseSetupView';
import { useWindowLibraryShelves } from '@/hooks/useWindowLibraryShelves';
import { PLATFORM_PROFILES, SUPPORTED_PLATFORMS } from '@/lib/platform-capabilities';
import { LIBRARY_BACKGROUND_OPACITY, resolveLibraryBackground } from '@/lib/library-backgrounds';
import type { PlatformFolderSettings, PlatformId, PlatformSettings } from '@/types/platform';
import {
  playRotatingUiSoundEffectAndWait,
  playUiSoundEffect,
  playUiSoundEffectAndWait,
} from '@/lib/ui-sound-effects';

type SetupFolderKey = keyof Pick<
  PlatformFolderSettings,
  'gamesPath' | 'musicPath' | 'photosPath' | 'screenshotsPath' | 'extrasPath'
>;

const REQUIRED_PLATFORM_FOLDER_KEYS: Partial<Record<keyof typeof PLATFORM_PROFILES, SetupFolderKey[]>> = {
  atari800: ['gamesPath', 'musicPath', 'photosPath', 'screenshotsPath', 'extrasPath'],
  atari2600: ['gamesPath', 'screenshotsPath', 'extrasPath'],
  zxspectrum: ['extrasPath', 'gamesPath', 'screenshotsPath', 'photosPath', 'musicPath'],
  bbcmicro: ['extrasPath', 'gamesPath', 'screenshotsPath', 'musicPath'],
  amiga: ['extrasPath', 'gamesPath', 'screenshotsPath', 'musicPath'],
};

const PLATFORM_IMPORT_ALIASES: Partial<Record<keyof typeof PLATFORM_PROFILES, string[]>> = {
  zxspectrum: ['GameBaseZX', 'SpeccyMania'],
};

function getRequiredPlatformFolderKeys(platformId: keyof typeof PLATFORM_PROFILES): SetupFolderKey[] {
  return REQUIRED_PLATFORM_FOLDER_KEYS[platformId] ?? [];
}

function LibraryApp() {
  const { settings, updateSettings, setActivePlatform } = useSettings();
  const { favorites, isFavorite } = useFavorites();
  const { isMouseMode, onGamepadInput, showMouse } = useInputMode();
  const {
    closeDetail,
    effectiveFilters: filters,
    focusedIndex,
    games,
    handleGameSelect,
    handleSort,
    mounted,
    openTigerHeliFromSettings,
    persistWindowSize,
    searchInput,
    selectedGame,
    setFilters,
    setFocusedIndex,
    setSearchInput,
    setViewMode,
    shelfRef,
    toggleFocusedFavorite,
    viewMode,
  } = useLibraryBrowserState();
  const [genres, setGenres] = useState<string[]>([]);
  const [subGenres, setSubGenres] = useState<string[]>([]);
  const [showLaunchSplash, setShowLaunchSplash] = useState(true);
  const [bigBoxSession, setBigBoxSession] = useState<BigBoxSessionState | null>(null);
  const [platformSetupError, setPlatformSetupError] = useState<string | null>(null);
  const [platformSetupResult, setPlatformSetupResult] = useState<string | null>(null);
  const [isPlatformImporting, setIsPlatformImporting] = useState(false);
  const [libraryBackgroundSeed] = useState(() => Math.floor(Math.random() * 1000));
  const previousFullscreenRef = useRef(settings.isFullscreen);
  const { classicGames, favoriteGames, recentGames } = useWindowLibraryShelves({
    activePlatformId: settings.activePlatformId,
    favoriteIds: favorites,
    filters,
    recentlyPlayedIds: settings.recentlyPlayedIds,
    searchInput,
  });
  const activePlatform = PLATFORM_PROFILES[settings.activePlatformId];
  const activePlatformSettings = settings.platformSettings[settings.activePlatformId];
  const libraryViewBackgroundMode = viewMode === 'list' ? 'list' : 'grid';
  const libraryBackgroundImage = resolveLibraryBackground(
    settings.activePlatformId,
    libraryViewBackgroundMode,
    libraryBackgroundSeed,
  );

  useEffect(() => {
    void getGenres(settings.activePlatformId).then(setGenres);
  }, [settings.activePlatformId]);

  useEffect(() => {
    let cancelled = false;

    async function loadSubGenres() {
      const items = await getSubGenres(filters.genre, settings.activePlatformId);
      if (!cancelled) {
        setSubGenres(items);
      }
    }

    void loadSubGenres();

    return () => {
      cancelled = true;
    };
  }, [filters.genre, settings.activePlatformId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setShowLaunchSplash(false);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (previousFullscreenRef.current && !settings.isFullscreen) {
      void playUiSoundEffect('bigbox-switch', 0.55);
    }

    previousFullscreenRef.current = settings.isFullscreen;
  }, [settings.isFullscreen]);

  useLibraryShellInput({
    closeDetail,
    filters,
    focusedIndex,
    games,
    handleGameSelect,
    onGamepadInput,
    persistWindowSize,
    selectedGame,
    setFilters,
    setFocusedIndex,
    setSearchInput,
    setViewMode,
    settings: {
      isFullscreen: settings.isFullscreen,
      recentlyPlayedIds: settings.recentlyPlayedIds,
      scrollNavigation: settings.scrollNavigation,
    },
    toggleFocusedFavorite,
    updateSettings,
    viewMode,
  });

  const handleBrowsePlatformMdb = useCallback(async () => {
    const selected = await openMdbFileDialog();
    if (!selected) {
      return;
    }

    setPlatformSetupError(null);
    setPlatformSetupResult(`Selected MDB for ${activePlatform.displayName}.`);
    updateSettings({
      platformSettings: {
        ...settings.platformSettings,
        [settings.activePlatformId]: {
          ...activePlatformSettings,
          library: {
            ...activePlatformSettings.library,
            sourceMdbPath: selected,
          },
        },
      },
    });
  }, [
    activePlatform.displayName,
    activePlatformSettings,
    settings.activePlatformId,
    settings.platformSettings,
    updateSettings,
  ]);

  const handlePlatformFolderChange = useCallback((
    folderKey: SetupFolderKey,
    value: string,
  ) => {
    updateSettings({
      platformSettings: {
        ...settings.platformSettings,
        [settings.activePlatformId]: {
          ...activePlatformSettings,
          folders: {
            ...activePlatformSettings.folders,
            [folderKey]: value,
          },
        },
      },
    });
  }, [
    activePlatformSettings,
    settings.activePlatformId,
    settings.platformSettings,
    updateSettings,
  ]);

  const handleBrowsePlatformFolder = useCallback(async (
    folderKey: SetupFolderKey,
  ) => {
    const selected = await openDirectoryDialog();
    if (!selected) {
      return;
    }
    handlePlatformFolderChange(folderKey, selected);
  }, [handlePlatformFolderChange]);

  const handlePlatformImport = useCallback(async () => {
    setPlatformSetupResult(null);
    setPlatformSetupError(null);

    if (!activePlatformSettings.library.sourceMdbPath) {
      setPlatformSetupError(`Select the ${activePlatform.displayName} MDB file first.`);
      return;
    }

    const missingFolder = getRequiredPlatformFolderKeys(settings.activePlatformId)
      .find((folderKey) => !activePlatformSettings.folders[folderKey]?.trim());
    if (missingFolder) {
      setPlatformSetupError(`Select the ${missingFolder.replace('Path', '')} folder first.`);
      return;
    }

    setIsPlatformImporting(true);
    try {
      const result = await importPlatformDatabaseFromMdb({
        platformId: settings.activePlatformId,
        mdbPath: activePlatformSettings.library.sourceMdbPath,
        folderSettings: {
          gamesPath: activePlatformSettings.folders.gamesPath,
          musicPath: activePlatformSettings.folders.musicPath,
          photosPath: activePlatformSettings.folders.photosPath,
          screenshotsPath: activePlatformSettings.folders.screenshotsPath,
          extrasPath: activePlatformSettings.folders.extrasPath,
        },
      });
      updateSettings({
        romsPath: activePlatformSettings.folders.gamesPath,
        soundsPath: activePlatformSettings.folders.musicPath,
        musicianPhotosPath: activePlatformSettings.folders.photosPath,
        screenshotsPath: activePlatformSettings.folders.screenshotsPath,
        extrasPath: activePlatformSettings.folders.extrasPath,
        platformSettings: {
          ...settings.platformSettings,
          [settings.activePlatformId]: {
            ...activePlatformSettings,
            library: {
              ...activePlatformSettings.library,
              importStatus: 'imported',
              sourceMdbPath: activePlatformSettings.library.sourceMdbPath,
              sqliteScope: result.platformId,
              lastImportedAt: new Date().toISOString(),
              lastImportError: null,
              gameCount: result.gameCount,
            },
          },
        },
      });
      setPlatformSetupResult(
        `Imported ${activePlatform.displayName} and prepared ${result.importedTables} tables at ${result.dbPath}.`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : `${activePlatform.displayName} import failed.`;
      setPlatformSetupError(message);
      updateSettings({
        platformSettings: {
          ...settings.platformSettings,
          [settings.activePlatformId]: {
            ...activePlatformSettings,
            library: {
              ...activePlatformSettings.library,
              importStatus: 'failed',
              lastImportError: message,
            },
          },
        },
      });
    } finally {
      setIsPlatformImporting(false);
    }
  }, [
    activePlatform.displayName,
    activePlatformSettings,
    settings.activePlatformId,
    settings.platformSettings,
    updateSettings,
  ]);

  if (activePlatformSettings.library.importStatus !== 'imported') {
    return (
      <>
        {showLaunchSplash ? <AppLaunchSplash /> : null}
        <DatabaseSetupView
          dbPath={activePlatformSettings.library.sqliteScope}
          error={platformSetupError ?? `${activePlatform.displayName} has not been imported yet.`}
          folderSettings={activePlatformSettings.folders}
          importResult={platformSetupResult}
          isImporting={isPlatformImporting}
          mdbPath={activePlatformSettings.library.sourceMdbPath ?? ''}
          platformAliases={PLATFORM_IMPORT_ALIASES[settings.activePlatformId] ?? []}
          platformName={activePlatform.displayName}
          platformOptions={SUPPORTED_PLATFORMS.map((platform) => ({
            id: platform.id,
            displayName: platform.displayName,
            importStatus: settings.platformSettings[platform.id].library.importStatus,
          }))}
          requiredFolderKeys={getRequiredPlatformFolderKeys(settings.activePlatformId)}
          selectedPlatformId={settings.activePlatformId}
          onBrowse={handleBrowsePlatformMdb}
          onBrowseFolder={handleBrowsePlatformFolder}
          onFolderChange={handlePlatformFolderChange}
          onPlatformSelect={(platformId) => {
            if (platformId in PLATFORM_PROFILES) {
              setActivePlatform(platformId as keyof typeof PLATFORM_PROFILES);
              setPlatformSetupError(null);
              setPlatformSetupResult(null);
            }
          }}
          onImport={handlePlatformImport}
        />
      </>
    );
  }

  const handleBackFromSettings = async () => {
    await playUiSoundEffectAndWait('close-detail-1', 0.52);
    setViewMode('grid');
  };

  const handleBackFromDetail = async () => {
    await playUiSoundEffectAndWait('close-detail-1', 0.52);
    closeDetail();
  };

  if (viewMode === 'settings') {
    return (
      <>
        {showLaunchSplash ? <AppLaunchSplash /> : null}
        <main className="min-h-screen bg-gray-950 text-white font-sans selection:bg-blue-600/50 flex flex-col">
          <SettingsView onBack={handleBackFromSettings} onOpenTigerHeli={openTigerHeliFromSettings} />
        </main>
      </>
    )
  }



  if (selectedGame) {
    return (
      <>
        {showLaunchSplash ? <AppLaunchSplash /> : null}
        <main className="min-h-screen bg-gray-900 text-white font-sans selection:bg-blue-600/50">
          <DetailView game={selectedGame} onBack={handleBackFromDetail} />
        </main>
      </>
    );
  }

  if (settings.isFullscreen) {
    return (
      <>
        {showLaunchSplash ? <AppLaunchSplash /> : null}
        <BigBoxView 
          settings={settings}
          onSelectGame={handleGameSelect}
          sessionState={bigBoxSession}
          onSessionChange={setBigBoxSession}
          onRequestExit={({ dontAskAgain, focusedGameId, railId }) => {
            flushSync(() => {
              updateSettings({
                confirmFullscreenExit: !dontAskAgain,
                lastBigBoxGameId: focusedGameId,
                lastBigBoxRailId: railId,
              });
            });
            void (async () => {
              await playRotatingUiSoundEffectAndWait('bigbox-close', [
                'close-app-1',
                'close-app-2',
                'close-app-3',
                'close-app-4',
              ], 0.7);
              void exitApp();
            })();
          }}
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          onShowSettings={() => setViewMode('settings')}
          onPlatformSelect={setActivePlatform}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </>
    );
  }

  return (
    <>
      {showLaunchSplash ? <AppLaunchSplash /> : null}
      <main className={`h-screen overflow-hidden bg-gray-900 text-white flex flex-col font-sans transition-all ${
        settings.isFullscreen && !showMouse ? 'cursor-none' : ''
      }`}>
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat saturate-[0.85] contrast-[1.08]"
          style={{
            backgroundImage: `url('${libraryBackgroundImage}')`,
            opacity: LIBRARY_BACKGROUND_OPACITY,
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(180deg,rgba(17,24,39,0.58),rgba(17,24,39,0.84)_52%,rgba(17,24,39,0.94))]"
        />
        <LibraryHeader
          filters={filters}
          genres={genres}
          onExit={exitApp}
          onFiltersChange={setFilters}
          onOpenSettings={() => setViewMode('settings')}
          onPlatformSelect={setActivePlatform}
          onSearchChange={setSearchInput}
          subGenres={subGenres}
          onViewModeChange={setViewMode}
          searchInput={searchInput}
          activePlatformId={settings.activePlatformId}
          viewMode={viewMode}
        />

        <div className="no-scrollbar relative z-10 flex-1 overflow-auto pl-8 pr-4">
          <AlphabetJumpBar 
            activeLetter={filters.letter} 
            onLetterSelect={(l) => {
              setFilters(prev => ({ ...prev, letter: prev.letter === l ? undefined : l, searchQuery: undefined }));
              setSearchInput(''); // Clear search box when browsing by letter
            }} 
          />
          
          {viewMode === 'grid' ? (
            <>
              {mounted && (
                <WindowGameShelf
                  games={recentGames}
                  isFavorite={isFavorite}
                  isMouseMode={isMouseMode}
                  onFocusChange={() => {}}
                  onSelectGame={handleGameSelect}
                  subtitle="Your latest launches, kept near the top for quick return trips."
                  shelfRef={shelfRef}
                  title="Recent Games"
                />
              )}

              <WindowGameShelf
                games={favoriteGames}
                isFavorite={isFavorite}
                isMouseMode={isMouseMode}
                onFocusChange={() => {}}
                onSelectGame={handleGameSelect}
                subtitle="Pinned titles from your personal shortlist."
                title="Your Favorites"
              />

              <WindowGameShelf
                games={classicGames}
                isFavorite={isFavorite}
                isMouseMode={isMouseMode}
                onFocusChange={() => {}}
                onSelectGame={handleGameSelect}
                subtitle="Essential GB64 staples surfaced in the windowed library too."
                title="🏆 Legendary Classics 🏆"
              />

              <GridView 
                games={games} 
                onSelectGame={handleGameSelect} 
                focusedIndex={focusedIndex >= 0 ? focusedIndex : -1} 
                onFocusChange={isMouseMode && settings.mouseHoverSelection ? setFocusedIndex : undefined}
              />
            </>
          ) : (
            <>
              {mounted && (
                <WindowGameListSection
                  games={recentGames}
                  isFavorite={isFavorite}
                  onSelectGame={handleGameSelect}
                  title="Recent Games"
                />
              )}
              <WindowGameListSection
                games={favoriteGames}
                isFavorite={isFavorite}
                onSelectGame={handleGameSelect}
                title="Your Favorites"
              />
              <WindowGameListSection
                games={classicGames}
                isFavorite={isFavorite}
                onSelectGame={handleGameSelect}
                title="🏆 Legendary Classics 🏆"
              />
              <ListView 
                games={games} 
                onSelectGame={handleGameSelect} 
                onSort={handleSort} 
                focusedIndex={focusedIndex >= 0 ? focusedIndex : -1}
                onFocusChange={isMouseMode && settings.mouseHoverSelection ? setFocusedIndex : undefined}
                isFavorite={isFavorite}
              />
            </>
          )}
        </div>
      </main>
    </>
  );
}

export default function Home() {
  const { settings, updateSettings, setActivePlatform } = useSettings();
  const [bootstrapStatus, setBootstrapStatus] = useState<{
    dbPath: string;
    ready: boolean;
    reason: string | null;
  } | null>(null);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [setupPlatformId, setSetupPlatformId] = useState<PlatformId>(settings.activePlatformId);
  const [setupPlatformSettings, setSetupPlatformSettings] = useState<Record<PlatformId, PlatformSettings>>(
    settings.platformSettings,
  );
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupSuccess, setSetupSuccess] = useState<string | null>(null);
  const activeSetupPlatform = PLATFORM_PROFILES[setupPlatformId];
  const activeSetupPlatformSettings = setupPlatformSettings[setupPlatformId];

  const refreshBootstrapStatus = useCallback(async () => {
    setIsCheckingSetup(true);
    try {
      const status = await getDatabaseBootstrapStatus();
      setBootstrapStatus({
        dbPath: status.dbPath,
        ready: status.ready,
        reason: status.reason ?? null,
      });
      if (status.ready) {
        setSetupError(null);
      }
    } catch (error) {
      setBootstrapStatus({
        dbPath: '',
        ready: false,
        reason: null,
      });
      setSetupError(error instanceof Error ? error.message : 'Unable to verify database setup.');
    } finally {
      setIsCheckingSetup(false);
    }
  }, []);

  useEffect(() => {
    void refreshBootstrapStatus();
  }, [refreshBootstrapStatus]);

  const updateSetupPlatform = useCallback((
    platformId: PlatformId,
    updater: (current: PlatformSettings) => PlatformSettings,
  ) => {
    const nextSettings = {
      ...setupPlatformSettings,
      [platformId]: updater(setupPlatformSettings[platformId]),
    };
    setSetupPlatformSettings(nextSettings);
    updateSettings({ platformSettings: nextSettings });
  }, [setupPlatformSettings, updateSettings]);

  const handleBrowseSetupMdb = useCallback(async () => {
    const selected = await openMdbFileDialog();
    if (!selected) {
      return;
    }

    setSetupError(null);
    setSetupSuccess(`Selected MDB for ${activeSetupPlatform.displayName}.`);
    updateSetupPlatform(setupPlatformId, (current) => ({
      ...current,
      library: {
        ...current.library,
        sourceMdbPath: selected,
      },
    }));
  }, [activeSetupPlatform.displayName, setupPlatformId, updateSetupPlatform]);

  const handleSetupFolderChange = useCallback((folderKey: SetupFolderKey, value: string) => {
    updateSetupPlatform(setupPlatformId, (current) => ({
      ...current,
      folders: {
        ...current.folders,
        [folderKey]: value,
      },
    }));
  }, [setupPlatformId, updateSetupPlatform]);

  const handleBrowseSetupFolder = useCallback(async (folderKey: SetupFolderKey) => {
    const selected = await openDirectoryDialog();
    if (!selected) {
      return;
    }
    handleSetupFolderChange(folderKey, selected);
  }, [handleSetupFolderChange]);

  const handleImportSetupPlatform = useCallback(async () => {
    if (!activeSetupPlatformSettings.library.sourceMdbPath) {
      setSetupError(`Select the ${activeSetupPlatform.displayName} MDB file first.`);
      return;
    }

    const missingFolder = getRequiredPlatformFolderKeys(setupPlatformId)
      .find((folderKey) => !activeSetupPlatformSettings.folders[folderKey]?.trim());
    if (missingFolder) {
      setSetupError(`Select the ${missingFolder.replace('Path', '')} folder first.`);
      return;
    }

    setIsImporting(true);
    setSetupError(null);
    setSetupSuccess(null);

    try {
      const result = await importPlatformDatabaseFromMdb({
        platformId: setupPlatformId,
        mdbPath: activeSetupPlatformSettings.library.sourceMdbPath,
        folderSettings: {
          gamesPath: activeSetupPlatformSettings.folders.gamesPath,
          musicPath: activeSetupPlatformSettings.folders.musicPath,
          photosPath: activeSetupPlatformSettings.folders.photosPath,
          screenshotsPath: activeSetupPlatformSettings.folders.screenshotsPath,
          extrasPath: activeSetupPlatformSettings.folders.extrasPath,
        },
      });
      const importedSettings = {
        ...activeSetupPlatformSettings,
        library: {
          ...activeSetupPlatformSettings.library,
          active: true,
          importStatus: 'imported' as const,
          sourceMdbPath: activeSetupPlatformSettings.library.sourceMdbPath,
          sqliteScope: result.platformId,
          lastImportedAt: new Date().toISOString(),
          lastImportError: null,
          gameCount: result.gameCount,
        },
      };
      const nextPlatformSettings = (Object.keys(setupPlatformSettings) as PlatformId[]).reduce(
        (next, platformId) => ({
          ...next,
          [platformId]: {
            ...(platformId === setupPlatformId ? importedSettings : setupPlatformSettings[platformId]),
            library: {
              ...(platformId === setupPlatformId ? importedSettings : setupPlatformSettings[platformId]).library,
              active: platformId === setupPlatformId,
            },
          },
        }),
        {} as Record<PlatformId, PlatformSettings>,
      );
      setSetupPlatformSettings(nextPlatformSettings);
      updateSettings({
        activePlatformId: setupPlatformId,
        lastUsedPlatformId: setupPlatformId,
        romsPath: activeSetupPlatformSettings.folders.gamesPath,
        soundsPath: activeSetupPlatformSettings.folders.musicPath,
        musicianPhotosPath: activeSetupPlatformSettings.folders.photosPath,
        screenshotsPath: activeSetupPlatformSettings.folders.screenshotsPath,
        extrasPath: activeSetupPlatformSettings.folders.extrasPath,
        platformSettings: nextPlatformSettings,
      });
      setSetupSuccess(
        `Imported ${activeSetupPlatform.displayName} and prepared ${result.importedTables} tables at ${result.dbPath}.`,
      );
      await refreshBootstrapStatus();
    } catch (error) {
      const message = error instanceof Error ? error.message : `${activeSetupPlatform.displayName} import failed.`;
      setSetupError(message);
      updateSetupPlatform(setupPlatformId, (current) => ({
        ...current,
        library: {
          ...current.library,
          importStatus: 'failed',
          lastImportError: message,
        },
      }));
    } finally {
      setIsImporting(false);
    }
  }, [
    activeSetupPlatform.displayName,
    activeSetupPlatformSettings,
    refreshBootstrapStatus,
    setupPlatformId,
    setupPlatformSettings,
    updateSettings,
    updateSetupPlatform,
  ]);

  if (isCheckingSetup || bootstrapStatus === null) {
    return (
      <main className="min-h-screen bg-[#06080f] text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-5">
            <div className="h-14 w-14 rounded-full border-4 border-cyan-400/15 border-t-cyan-300 animate-spin" />
            <div className="text-sm font-black uppercase tracking-[0.24em] text-cyan-200/75">
              Checking GB64 Database
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!bootstrapStatus.ready) {
    return (
      <DatabaseSetupView
        dbPath={bootstrapStatus.dbPath}
        error={setupError ?? bootstrapStatus.reason}
        importResult={setupSuccess}
        isImporting={isImporting}
        mdbPath={activeSetupPlatformSettings.library.sourceMdbPath ?? ''}
        platformAliases={PLATFORM_IMPORT_ALIASES[setupPlatformId] ?? []}
        platformName={activeSetupPlatform.displayName}
        platformOptions={SUPPORTED_PLATFORMS.map((platform) => ({
          id: platform.id,
          displayName: platform.displayName,
          importStatus: setupPlatformSettings[platform.id].library.importStatus,
        }))}
        folderSettings={activeSetupPlatformSettings.folders}
        requiredFolderKeys={getRequiredPlatformFolderKeys(setupPlatformId)}
        selectedPlatformId={setupPlatformId}
        onBrowse={handleBrowseSetupMdb}
        onBrowseFolder={handleBrowseSetupFolder}
        onFolderChange={handleSetupFolderChange}
        onPlatformSelect={(platformId) => {
          if (platformId in PLATFORM_PROFILES) {
            const nextPlatformId = platformId as PlatformId;
            setSetupPlatformId(nextPlatformId);
            setActivePlatform(nextPlatformId);
            setSetupError(null);
            setSetupSuccess(null);
          }
        }}
        onImport={handleImportSetupPlatform}
      />
    );
  }

  return <LibraryApp />;
}
