"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  exitApp,
  getDatabaseBootstrapStatus,
  getDbGameCount,
  getGenres,
  getSubGenres,
  openDirectoryDialog,
  openMdbFileDialog,
} from '@/lib/tauri-bridge';
import { useSettings } from '@/contexts/SettingsContext';
import { DetailView } from '@/components/DetailView';
import { SettingsView } from '@/components/SettingsModal';
import { useInputMode } from '@/hooks/useInputMode';
import { UnifiedLibraryView } from '@/components/UnifiedLibraryView';
import type { BigBoxSessionState } from '@/components/UnifiedLibraryView';
import { useFavorites } from '@/hooks/useFavorites';
import { useLibraryBrowserState } from '@/hooks/useLibraryBrowserState';
import { AppLaunchSplash } from '@/components/AppLaunchSplash';
import { DatabaseSetupView } from '@/components/setup/DatabaseSetupView';
import { useWindowLibraryShelves } from '@/hooks/useWindowLibraryShelves';
import { usePlatformImport } from '@/hooks/usePlatformImport';
import { PLATFORM_PROFILES, SUPPORTED_PLATFORMS } from '@/lib/platform-capabilities';
import {
  getPlatformAliases,
  getRequiredPlatformFolderKeys as getManifestRequiredPlatformFolderKeys,
} from '@/lib/platform-manifest';
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

function getRequiredPlatformFolderKeys(platformId: keyof typeof PLATFORM_PROFILES): SetupFolderKey[] {
  return getManifestRequiredPlatformFolderKeys(platformId) as SetupFolderKey[];
}

function LibraryApp() {
  const { settings, updateSettings, setActivePlatform } = useSettings();
  const { favorites } = useFavorites();
  const { onGamepadInput } = useInputMode();
  const {
    closeDetail,
    effectiveFilters: filters,
    focusedIndex,
    games,
    handleGameSelect,
    handleSort,
    loadNextPage,
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
  const [listGameCount, setListGameCount] = useState<number | undefined>(undefined);
  const [bigBoxSession, setBigBoxSession] = useState<BigBoxSessionState | null>(null);
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
  const platformImport = usePlatformImport({
    platformName: activePlatform.displayName,
    platformId: settings.activePlatformId,
    platformSettings: settings.platformSettings,
    requiredFolderKeys: getRequiredPlatformFolderKeys(settings.activePlatformId),
    updateSettings,
  });

  useEffect(() => {
    void getGenres(settings.activePlatformId).then(setGenres);
  }, [settings.activePlatformId]);

  useEffect(() => {
    let cancelled = false;

    void getDbGameCount(filters, settings.activePlatformId).then((count) => {
      if (!cancelled) setListGameCount(count);
    });

    return () => { cancelled = true; };
  }, [filters, settings.activePlatformId]);

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

  const handleBrowsePlatformMdb = useCallback(async () => {
    const selected = await openMdbFileDialog();
    if (!selected) {
      return;
    }

    platformImport.setMdbPath(selected);
  }, [platformImport]);

  const handlePlatformFolderChange = useCallback((
    folderKey: SetupFolderKey,
    value: string,
  ) => {
    platformImport.setFolder(folderKey, value);
  }, [platformImport]);

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
    await platformImport.importPlatform();
  }, [platformImport]);

  if (activePlatformSettings.library.importStatus !== 'imported') {
    return (
      <>
        {showLaunchSplash ? <AppLaunchSplash /> : null}
        <DatabaseSetupView
          dbPath={activePlatformSettings.library.sqliteScope}
          error={platformImport.job.error ?? `${activePlatform.displayName} has not been imported yet.`}
          folderSettings={activePlatformSettings.folders}
          importProgress={platformImport.job.status === 'running' ? platformImport.job.progress : null}
          importResult={platformImport.job.result}
          isImporting={platformImport.job.status === 'running'}
          mdbPath={activePlatformSettings.library.sourceMdbPath ?? ''}
          platformAliases={getPlatformAliases(settings.activePlatformId)}
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
          onCancelImport={() => void platformImport.cancelImport()}
          onFolderChange={handlePlatformFolderChange}
          onPlatformSelect={(platformId) => {
            if (platformId in PLATFORM_PROFILES) {
              setActivePlatform(platformId as keyof typeof PLATFORM_PROFILES);
              platformImport.reset();
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
        <main className="min-h-screen bg-theme-background text-theme-text font-sans selection:bg-theme-primary/30 flex flex-col">
          <SettingsView onBack={handleBackFromSettings} onOpenTigerHeli={openTigerHeliFromSettings} />
        </main>
      </>
    )
  }



  if (selectedGame) {
    return (
      <>
        {showLaunchSplash ? <AppLaunchSplash /> : null}
        <main className="min-h-screen bg-[var(--theme-background)] text-[var(--theme-text)] font-sans selection:bg-[var(--theme-primary-container)]">
          <DetailView game={selectedGame} onBack={handleBackFromDetail} />
        </main>
      </>
    );
  }

  return (
    <>
      {showLaunchSplash ? <AppLaunchSplash /> : null}
      <UnifiedLibraryView
        settings={settings}
        updateSettings={updateSettings}
        onSelectGame={handleGameSelect}
        onPlatformSelect={setActivePlatform}
        filters={filters}
        onFiltersChange={setFilters}
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        games={games}
        focusedIndex={focusedIndex}
        setFocusedIndex={setFocusedIndex}
        loadNextPage={loadNextPage}
        handleSort={handleSort}
        shelfRef={shelfRef}
        toggleFocusedFavorite={toggleFocusedFavorite}
        onGamepadInput={onGamepadInput}
        recentGames={recentGames}
        favoriteGames={favoriteGames}
        classicGames={classicGames}
        genres={genres}
        subGenres={subGenres}
        listGameCount={listGameCount}
        persistWindowSize={persistWindowSize}
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
      />
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
  const [setupPlatformId, setSetupPlatformId] = useState<PlatformId>(settings.activePlatformId);
  const [setupPlatformSettings, setSetupPlatformSettings] = useState<Record<PlatformId, PlatformSettings>>(
    settings.platformSettings,
  );
  const [setupError, setSetupError] = useState<string | null>(null);
  const activeSetupPlatform = PLATFORM_PROFILES[setupPlatformId];
  const activeSetupPlatformSettings = setupPlatformSettings[setupPlatformId];
  const setupPlatformImport = usePlatformImport({
    platformName: activeSetupPlatform.displayName,
    platformId: setupPlatformId,
    platformSettings: setupPlatformSettings,
    requiredFolderKeys: getRequiredPlatformFolderKeys(setupPlatformId),
    setPlatformSettings: setSetupPlatformSettings,
    updateSettings,
  });

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
      setSetupError(typeof error === 'string' ? error : (error instanceof Error ? error.message : 'Unable to verify database setup.'));
    } finally {
      setIsCheckingSetup(false);
    }
  }, []);

  useEffect(() => {
    void refreshBootstrapStatus();
  }, [refreshBootstrapStatus]);

  const handleBrowseSetupMdb = useCallback(async () => {
    const selected = await openMdbFileDialog();
    if (!selected) {
      return;
    }

    setSetupError(null);
    setupPlatformImport.setMdbPath(selected);
  }, [setupPlatformImport]);

  const handleSetupFolderChange = useCallback((folderKey: SetupFolderKey, value: string) => {
    setupPlatformImport.setFolder(folderKey, value);
  }, [setupPlatformImport]);

  const handleBrowseSetupFolder = useCallback(async (folderKey: SetupFolderKey) => {
    const selected = await openDirectoryDialog();
    if (!selected) {
      return;
    }
    handleSetupFolderChange(folderKey, selected);
  }, [handleSetupFolderChange]);

  const handleImportSetupPlatform = useCallback(async () => {
    setSetupError(null);
    const result = await setupPlatformImport.importPlatform();
    if (result) {
      await refreshBootstrapStatus();
    }
  }, [
    refreshBootstrapStatus,
    setupPlatformImport,
  ]);

  if (isCheckingSetup || bootstrapStatus === null) {
    return (
      <main className="min-h-screen bg-[#06080f] text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-5">
            <div className="h-14 w-14 rounded-full border-4 border-cyan-400/15 border-t-cyan-300 animate-spin" />
            <div className="text-sm font-black uppercase tracking-[0.24em] text-cyan-200/75">
              Checking GameBaseBox Database
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
        error={setupError ?? setupPlatformImport.job.error ?? bootstrapStatus.reason}
        importProgress={setupPlatformImport.job.status === 'running' ? setupPlatformImport.job.progress : null}
        importResult={setupPlatformImport.job.result}
        isImporting={setupPlatformImport.job.status === 'running'}
        mdbPath={activeSetupPlatformSettings.library.sourceMdbPath ?? ''}
        platformAliases={getPlatformAliases(setupPlatformId)}
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
        onCancelImport={() => void setupPlatformImport.cancelImport()}
        onFolderChange={handleSetupFolderChange}
        onPlatformSelect={(platformId) => {
          if (platformId in PLATFORM_PROFILES) {
            const nextPlatformId = platformId as PlatformId;
            setSetupPlatformId(nextPlatformId);
            setActivePlatform(nextPlatformId);
            setSetupError(null);
            setupPlatformImport.reset();
          }
        }}
        onImport={handleImportSetupPlatform}
      />
    );
  }

  return <LibraryApp />;
}
