"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { Game } from '../types/game';
import type { PlatformId } from '../types/platform';
import type { Settings } from '../contexts/SettingsContext';
import { useFavorites } from '../hooks/useFavorites';
import { useInputMode } from '../hooks/useInputMode';
import { type GameFilters, exitApp } from '../lib/tauri-bridge';
import type { LibraryViewMode } from '../hooks/useLibraryBrowserState';
import { useTheme } from '../contexts/ThemeContext';

// Fullscreen / BigBox Subcomponents
import { BigBoxHeader } from './bigbox/BigBoxHeader';
import { BigBoxAlphabetRail } from './bigbox/BigBoxAlphabetRail';
import { BigBoxFooter } from './bigbox/BigBoxFooter';
import { BigBoxExitPrompt } from './bigbox/BigBoxExitPrompt';
import { HorizontalRail } from './HorizontalRail';
import { ControllerSearchKeyboard } from './ControllerSearchKeyboard';
import { SubGenrePickerModal } from './SubGenrePickerModal';
import { useBigBoxLibraryData } from '../hooks/useBigBoxLibraryData';
import { useBigBoxScrollSync } from '../hooks/useBigBoxScrollSync';
import { useFullscreenLayoutMetrics } from '../hooks/useFullscreenLayoutMetrics';
import { SUPPORTED_PLATFORMS } from '../lib/platform-capabilities';
import { getC64NavigationRails } from './BigBoxView';

// Windowed Subcomponents
import { LibraryHeader } from './library/LibraryHeader';
import { AlphabetJumpBar } from './AlphabetJumpBar';
import { WindowGameShelf } from './library/WindowGameShelf';
import { GridView } from './GridView';
import { WindowGameListSection } from './library/WindowGameListSection';
import { ListView } from './ListView';

// Custom Themed Grids
import { C64EditionGrid } from './library/C64EditionGrid';
import { CyberpunkCrtGrid } from './library/CyberpunkCrtGrid';

// Unified Traversal Hook
import { useUnifiedLibraryNavigation } from '../hooks/useUnifiedLibraryNavigation';
import { LIBRARY_BACKGROUND_OPACITY, resolveLibraryBackground } from '../lib/library-backgrounds';
import { playRotatingUiSoundEffect, playUiSoundEffect, playUiSoundEffectAndWait } from '../lib/ui-sound-effects';

export interface BigBoxSessionState {
  activeHeaderItemIndex: number;
  activeHeaderRow: number;
  activeRailIndex: number;
  focusedGameId: string | null;
  railFocusIndices: Record<string, number>;
  railId: string | null;
}

interface UnifiedLibraryViewProps {
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;
  onSelectGame: (game: Game) => void;
  onPlatformSelect: (platformId: PlatformId) => void;
  filters: GameFilters;
  onFiltersChange: React.Dispatch<React.SetStateAction<GameFilters>>;
  viewMode: LibraryViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<LibraryViewMode>>;
  searchInput: string;
  onSearchChange: (val: string) => void;

  // Windowed Data
  games: Game[];
  focusedIndex: number;
  setFocusedIndex: React.Dispatch<React.SetStateAction<number>>;
  loadNextPage: () => void;
  handleSort: (column: keyof Game) => void;
  shelfRef?: React.RefObject<HTMLDivElement | null>;
  toggleFocusedFavorite: () => boolean;
  onGamepadInput: () => void;
  recentGames: Game[];
  favoriteGames: Game[];
  classicGames: Game[];
  genres: string[];
  subGenres: string[];
  listGameCount?: number;
  persistWindowSize?: (size: { width: number; height: number }) => void;

  // Fullscreen state persistence
  sessionState?: BigBoxSessionState | null;
  onSessionChange?: (session: BigBoxSessionState) => void;
  onRequestExit?: (snapshot: { dontAskAgain: boolean; focusedGameId: string | null; railId: string | null }) => void;
}

export function UnifiedLibraryView({
  settings,
  updateSettings,
  onSelectGame,
  onPlatformSelect,
  filters,
  onFiltersChange,
  viewMode,
  setViewMode,
  searchInput,
  onSearchChange,
  games,
  focusedIndex,
  setFocusedIndex,
  loadNextPage,
  handleSort,
  shelfRef,
  toggleFocusedFavorite,
  onGamepadInput,
  recentGames,
  favoriteGames,
  classicGames,
  genres: windowGenres,
  subGenres: windowSubGenres,
  listGameCount,
  persistWindowSize,
  sessionState,
  onSessionChange,
  onRequestExit,
}: UnifiedLibraryViewProps) {
  const { theme } = useTheme();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { showMouse, isMouseMode } = useInputMode();

  // Fullscreen positioning states
  const [activeRailIndex, setActiveRailIndex] = useState(sessionState?.activeRailIndex ?? 0);
  const [activeHeaderRow, setActiveHeaderRow] = useState(sessionState?.activeHeaderRow ?? 0);
  const [activeHeaderItemIndex, setActiveHeaderItemIndex] = useState(sessionState?.activeHeaderItemIndex ?? 0);
  const [railFocusIndices, setRailFocusIndices] = useState<Record<string, number>>(sessionState?.railFocusIndices ?? {});
  const [isControllerKeyboardOpen, setIsControllerKeyboardOpen] = useState(false);
  const [isExitPromptOpen, setIsExitPromptOpen] = useState(false);
  const [isSubGenrePickerOpen, setIsSubGenrePickerOpen] = useState(false);
  const [hasRestoredPosition, setHasRestoredPosition] = useState(Boolean(sessionState));
  const classicTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const layout = useFullscreenLayoutMetrics();
  const usesRailGridNavigation = theme.layout.structure === 'flat-alphabet';
  const isC64Edition = theme.id === 'c64-edition';
  const isCyberpunkCrt = theme.id === 'cyberpunk-crt';
  const isArcadeVoid = theme.id === 'arcade-void';
  const cyberpunkGridColumns =
    layout.viewportWidth >= 2560 ? 8 :
    layout.viewportWidth >= 1440 ? 7 :
    layout.viewportWidth >= 1024 ? 6 :
    layout.viewportWidth >= 768 ? 4 : 2;

  // Background Resolver
  const [libraryBackgroundSeed] = useState(() => Math.floor(Math.random() * 1000));
  const backgroundMode = viewMode === 'list' ? 'list' : 'grid';
  const libraryBackground = resolveLibraryBackground(
    settings.activePlatformId,
    backgroundMode,
    libraryBackgroundSeed,
  );

  // Full-Screen (BigBox) specific data loader
  const {
    flatGames: bigboxFlatGames,
    genres: bigboxGenres,
    loading: bigboxLoading,
    rails: bigboxRails,
    subGenres: bigboxSubGenres,
    totalGameCount: bigboxTotalGameCount,
  } = useBigBoxLibraryData({
    activeRailIndex,
    activePlatformId: settings.activePlatformId,
    favorites,
    filters,
    recentlyPlayedIds: settings.recentlyPlayedIds,
    searchInput,
    loadFlatLibrary: usesRailGridNavigation,
  });

  const finalGenres = settings.isFullscreen ? bigboxGenres : windowGenres;
  const finalSubGenres = settings.isFullscreen ? bigboxSubGenres : windowSubGenres;

  const navigationRails = useMemo(
    () => usesRailGridNavigation ? getC64NavigationRails(bigboxRails, bigboxFlatGames) : bigboxRails,
    [bigboxFlatGames, bigboxRails, usesRailGridNavigation],
  );

  const currentRail = activeRailIndex >= 0 ? navigationRails[activeRailIndex] : null;
  const currentFocusedIndex = currentRail ? (railFocusIndices[currentRail.id] ?? 0) : 0;
  const currentFocusedGame = currentRail?.games[currentFocusedIndex] ?? null;
  const currentRailId = currentRail?.id ?? null;
  const currentRailType = currentRail?.type ?? null;
  const isInteractionOverlayOpen = isControllerKeyboardOpen || isExitPromptOpen || isSubGenrePickerOpen;
  const isShowingFilteredCount = Boolean(searchInput.trim() || filters.genre || filters.subGenre);

  const { hasOverflow, visibleSubGenres } = useMemo(
    () => getVisibleSubGenresHelper(finalSubGenres, filters.subGenre, layout.maxVisibleSubGenres),
    [filters.subGenre, layout.maxVisibleSubGenres, finalSubGenres],
  );

  const showPlatformSwitcher = SUPPORTED_PLATFORMS.length > 1;

  const cyclePlatform = useCallback(() => {
    const currentIndex = SUPPORTED_PLATFORMS.findIndex((p) => p.id === settings.activePlatformId);
    const nextPlatform = SUPPORTED_PLATFORMS[(currentIndex + 1) % SUPPORTED_PLATFORMS.length];
    if (nextPlatform) {
      onPlatformSelect(nextPlatform.id);
    }
  }, [onPlatformSelect, settings.activePlatformId]);

  // Sync session state to parent when in Fullscreen Mode
  useEffect(() => {
    if (!settings.isFullscreen || !onSessionChange) return;
    onSessionChange({
      activeHeaderItemIndex,
      activeHeaderRow,
      activeRailIndex,
      focusedGameId: currentFocusedGame?.id.toString() ?? null,
      railFocusIndices,
      railId: currentRail?.id ?? null,
    });
  }, [
    activeHeaderItemIndex,
    activeHeaderRow,
    activeRailIndex,
    currentFocusedGame?.id,
    currentRail?.id,
    onSessionChange,
    railFocusIndices,
    settings.isFullscreen,
  ]);

  // Sound triggers for fullscreen setup
  useEffect(() => {
    if (!settings.isFullscreen || typeof window === 'undefined') return;
    if (window.sessionStorage.getItem('gb64_bigbox_launch_sound_played')) return;

    window.sessionStorage.setItem('gb64_bigbox_launch_sound_played', '1');
    void playRotatingUiSoundEffect('bigbox-launch', ['open-app-1', 'open-app-2'], 0.6);
  }, [settings.isFullscreen]);

  // Restore BigBox focus position
  useEffect(() => {
    if (!settings.isFullscreen || hasRestoredPosition || navigationRails.length === 0 || searchInput.trim()) {
      return;
    }

    const targetRailId = sessionState?.railId ?? settings.lastBigBoxRailId;
    const targetGameId = sessionState?.focusedGameId ?? settings.lastBigBoxGameId;

    const frameId = window.requestAnimationFrame(() => {
      if (!targetRailId) {
        setHasRestoredPosition(true);
        return;
      }

      const targetRailIndex = navigationRails.findIndex((rail) => rail.id === targetRailId);
      if (targetRailIndex === -1) {
        setHasRestoredPosition(true);
        return;
      }

      setActiveRailIndex(targetRailIndex);

      const targetRail = navigationRails[targetRailIndex];
      if (!targetGameId) {
        setHasRestoredPosition(true);
        return;
      }

      const gameIndex = targetRail.games.findIndex(
        (g) => g.id.toString() === targetGameId,
      );

      if (gameIndex >= 0) {
        setRailFocusIndices((prev) => ({ ...prev, [targetRail.id]: gameIndex }));
        setHasRestoredPosition(true);
        return;
      }

      if (targetRail.type !== 'alphabet' || targetRail.games.length > 0) {
        setHasRestoredPosition(true);
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [
    hasRestoredPosition,
    navigationRails,
    searchInput,
    sessionState?.focusedGameId,
    sessionState?.railId,
    settings.lastBigBoxGameId,
    settings.lastBigBoxRailId,
    settings.isFullscreen,
  ]);

  const openExitPrompt = useCallback(() => {
    if (isInteractionOverlayOpen) return;

    if (!settings.confirmFullscreenExit) {
      if (onRequestExit) {
        onRequestExit({
          dontAskAgain: true,
          focusedGameId: currentFocusedGame?.id.toString() ?? null,
          railId: currentRail?.id ?? null,
        });
      }
      return;
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setIsExitPromptOpen(true);
  }, [
    currentFocusedGame?.id,
    currentRail?.id,
    isInteractionOverlayOpen,
    onRequestExit,
    settings.confirmFullscreenExit,
  ]);

  const handleSelectGame = useCallback((game: Game) => {
    if (classicTimeoutRef.current) {
      clearTimeout(classicTimeoutRef.current);
    }

    if (settings.isFullscreen) {
      const selectedGameIndex = currentRail
        ? currentRail.games.findIndex((c) => c.id === game.id)
        : -1;
      const resolvedFocusedIndex = selectedGameIndex >= 0 ? selectedGameIndex : currentFocusedIndex;
      const nextRailFocusIndices = currentRail
        ? { ...railFocusIndices, [currentRail.id]: resolvedFocusedIndex }
        : railFocusIndices;

      if (onSessionChange) {
        onSessionChange({
          activeHeaderItemIndex,
          activeHeaderRow,
          activeRailIndex,
          focusedGameId: game.id.toString(),
          railFocusIndices: nextRailFocusIndices,
          railId: currentRail?.id ?? null,
        });
      }

      void (async () => {
        await playUiSoundEffectAndWait('open-detail-1', 0.58);
        if (game.isClassic) {
          await playUiSoundEffect('classic-game', 0.62);
        }
      })();
    }

    onSelectGame(game);
  }, [
    activeHeaderItemIndex,
    activeHeaderRow,
    activeRailIndex,
    currentFocusedIndex,
    currentRail,
    onSelectGame,
    onSessionChange,
    railFocusIndices,
    settings.isFullscreen,
  ]);

  const handleSearchChange = useCallback((value: string) => {
    if (!searchInput.trim() && value.trim()) {
      void playUiSoundEffect('search-filter', 0.42);
    }
    onSearchChange(value);
  }, [onSearchChange, searchInput]);

  const handleFiltersChange = useCallback((nextFilters: React.SetStateAction<GameFilters>) => {
    const resolvedFilters = typeof nextFilters === 'function' ? (nextFilters as Function)(filters) : nextFilters;
    if (
      filters.genre !== resolvedFilters.genre ||
      filters.subGenre !== resolvedFilters.subGenre ||
      filters.letter !== resolvedFilters.letter
    ) {
      void playUiSoundEffect('search-filter', 0.42);
    }
    if (isSubGenrePickerOpen) {
      setIsSubGenrePickerOpen(false);
    }
    onFiltersChange(nextFilters);
  }, [filters, isSubGenrePickerOpen, onFiltersChange]);

  // Bind the Unified library navigation state and focus logic
  const {
    focusHeader,
    focusRailItem,
    focusSearch,
    handleKeyDown,
    jumpToRail,
    sectionJumpDirection,
    setSectionJumpDirection,
  } = useUnifiedLibraryNavigation({
    isFullscreen: settings.isFullscreen,
    viewMode,
    setViewMode,
    games,
    selectedGame: null, // detail page handles its own logic
    handleGameSelect: handleSelectGame,
    filters,
    setFilters: handleFiltersChange as any,
    searchInput,
    setSearchInput: onSearchChange as any,
    focusedIndex,
    setFocusedIndex,
    toggleFocusedFavorite,
    updateSettings,
    onGamepadInput,
    activeHeaderItemIndex,
    setActiveHeaderItemIndex,
    activeHeaderRow,
    setActiveHeaderRow,
    activeRailIndex,
    setActiveRailIndex,
    railFocusIndices,
    setRailFocusIndices,
    rails: navigationRails,
    genres: finalGenres,
    visibleSubGenres,
    hasOverflowSubGenres: hasOverflow,
    gridColumns: isCyberpunkCrt ? cyberpunkGridColumns : layout.gridColumns,
    onOpenSubGenrePicker: () => setIsSubGenrePickerOpen(true),
    onOpenControllerKeyboard: () => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      setIsControllerKeyboardOpen(true);
    },
    onShowSettings: () => setViewMode('settings'),
    onBack: openExitPrompt,
    onPlatformCycle: cyclePlatform,
    platformSwitcherEnabled: showPlatformSwitcher,
    onGenreSelect: () => {},
    onLetterJump: () => {
      void playUiSoundEffect('search-filter', 0.42);
    },
    onNavigationMove: () => {
      void playUiSoundEffect('menu-move-1', 0.3);
    },
    persistWindowSize,
    scrollNavigation: settings.scrollNavigation,
    recentlyPlayedIds: settings.recentlyPlayedIds,
    onFocusSearchInput: () => {
      const input = headerRef.current?.querySelector('input');
      if (input) {
        (input as HTMLElement).focus();
      }
    },
  });

  const { scrollContainerRef, headerRef } = useBigBoxScrollSync({
    activeRailIndex,
    currentFocusedIndex,
    currentRailId,
    currentRailType,
    onSectionJumpHandled: () => setSectionJumpDirection(null),
    sectionJumpDirection,
  });

  // Fullscreen specific elements
  const c64RecentGames = bigboxRails.find((r) => r.id === 'recent')?.games ?? [];
  const c64FavoriteGames = bigboxRails.find((r) => r.id === 'favorites')?.games ?? [];
  const c64ClassicGames = bigboxRails.find((r) => r.id === 'classics')?.games ?? [];

  // BigBox sound for list navigation
  const triggerListFocusChange = (idx: number) => {
    setFocusedIndex(idx);
    if (settings.isFullscreen) {
      void playUiSoundEffect('menu-move-1', 0.3);
    }
  };

  // RENDER FULLSCREEN BIGBOX LAYOUT
  if (settings.isFullscreen) {
    return (
      <div
        className={`bigbox-list-surface fixed inset-0 flex flex-col overflow-hidden bg-[var(--theme-background)] text-[var(--theme-text)] select-none ${
          !showMouse ? 'cursor-none' : ''
        } ${isC64Edition ? 'border-[24px] border-[var(--theme-secondary)]' : ''}`}
        data-list-presentation={theme.layout.railStyle}
        data-bigbox-rail-style={theme.layout.railStyle}
        data-c64-presentation={isC64Edition ? 'monitor' : undefined}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat saturate-[0.9] contrast-[1.05]"
          style={{
            backgroundImage: `url('${theme.assets.wallpaper || libraryBackground}')`,
            opacity: LIBRARY_BACKGROUND_OPACITY,
          }}
        />

        <header ref={headerRef}>
          <BigBoxHeader
            activeHeaderItemIndex={activeHeaderItemIndex}
            activeHeaderRow={activeHeaderRow}
            activeRailIndex={activeRailIndex}
            activePlatformId={settings.activePlatformId}
            filters={filters}
            genres={finalGenres}
            hasOverflowSubGenres={hasOverflow}
            isFiltered={isShowingFilteredCount}
            layout={layout}
            onExit={openExitPrompt}
            onFiltersChange={handleFiltersChange}
            onOpenSubGenrePicker={() => setIsSubGenrePickerOpen(true)}
            onPlatformSelect={onPlatformSelect}
            onJumpToRail={(railId) => {
              void playUiSoundEffect('search-filter', 0.42);
              jumpToRail(railId);
            }}
            onSearchChange={handleSearchChange}
            onSearchFocus={focusSearch}
            onSetHeaderFocus={focusHeader}
            onShowSettings={() => setViewMode('settings')}
            searchInput={searchInput}
            totalGameCount={bigboxTotalGameCount}
            visibleSubGenres={visibleSubGenres}
          />
        </header>

        <ControllerSearchKeyboard
          isOpen={isControllerKeyboardOpen}
          onClose={() => setIsControllerKeyboardOpen(false)}
          onGamepadInput={onGamepadInput}
          onSearchChange={handleSearchChange}
          searchInput={searchInput}
        />

        <BigBoxExitPrompt
          key={isExitPromptOpen ? 'open' : 'closed'}
          isOpen={isExitPromptOpen}
          onCancel={() => setIsExitPromptOpen(false)}
          onConfirm={(dontAskAgain) => {
            setIsExitPromptOpen(false);
            if (onRequestExit) {
              onRequestExit({
                dontAskAgain,
                focusedGameId: currentFocusedGame?.id.toString() ?? null,
                railId: currentRail?.id ?? null,
              });
            }
          }}
          onGamepadInput={onGamepadInput}
        />

        <SubGenrePickerModal
          key={`${filters.genre ?? 'none'}:${filters.subGenre ?? 'none'}:${isSubGenrePickerOpen ? 'open' : 'closed'}`}
          isOpen={isSubGenrePickerOpen}
          onClose={() => setIsSubGenrePickerOpen(false)}
          onGamepadInput={onGamepadInput}
          onSelect={(subGenre) => {
            handleFiltersChange({ ...filters, subGenre });
            setIsSubGenrePickerOpen(false);
          }}
          selectedSubGenre={filters.subGenre}
          subGenres={finalSubGenres}
          title={filters.genre ? `${filters.genre} Sub-Genres` : 'Choose Sub-Genre'}
        />

        {/* Fullscreen Core Display */}
        <div className="z-10 flex-1 overflow-hidden">
          {viewMode === 'list' ? (
            <div className="h-full overflow-y-auto px-12 py-6 no-scrollbar" data-fullscreen-list="true">
              <ListView
                games={bigboxFlatGames}
                onSelectGame={handleSelectGame}
                onSort={handleSort}
                focusedIndex={focusedIndex >= 0 ? focusedIndex : -1}
                onFocusChange={triggerListFocusChange}
                isFavorite={isFavorite}
                onEndReached={loadNextPage}
                activePlatformName={SUPPORTED_PLATFORMS.find((p) => p.id === settings.activePlatformId)?.displayName}
                totalGameCount={bigboxTotalGameCount}
                favoriteCount={favorites.length}
                themeId={theme.id}
              />
            </div>
          ) : (
            <main
              ref={scrollContainerRef}
              className="no-scrollbar h-full overflow-y-auto scroll-smooth pb-[100vh]"
              style={{
                width: 'calc(100% + 28px)',
                paddingRight: '28px',
                marginRight: '-28px',
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
              }}
            >
              {bigboxLoading ? (
                <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                  <div className="h-12 w-12 rounded-full border-4 border-[var(--theme-outline-variant)] border-t-[var(--theme-primary)] animate-spin"></div>
                  <div className="font-bold uppercase tracking-widest text-[var(--theme-primary)] animate-pulse">Scanning Library...</div>
                </div>
              ) : usesRailGridNavigation ? (
                isC64Edition ? (
                  <C64EditionGrid
                    activeAlphabetRailId={currentRail?.type === 'alphabet' ? currentRail.id : null}
                    alphabetLabel={filters.letter}
                    alphabetSections={navigationRails
                      .filter((r) => r.type === 'alphabet')
                      .map((r) => ({ id: r.id, label: r.letter ?? r.title, games: r.games }))}
                    classicGames={c64ClassicGames}
                    favoriteGames={c64FavoriteGames}
                    focusedGameId={currentFocusedGame?.id.toString()}
                    focusedIndex={currentFocusedIndex}
                    focusedRailId={currentRail?.id}
                    gridColumns={layout.gridColumns}
                    games={bigboxFlatGames}
                    isFavorite={isFavorite}
                    onFocusSectionItem={(railId, index) => focusRailItem(navigationRails.findIndex((r) => r.id === railId), railId, index)}
                    onFocusRailItem={(railId, index) => focusRailItem(navigationRails.findIndex((r) => r.id === railId), railId, index)}
                    onSelectGame={handleSelectGame}
                    recentGames={c64RecentGames}
                    toggleFavorite={toggleFavorite}
                  />
                ) : (
                  <CyberpunkCrtGrid
                    activeAlphabetRailId={currentRail?.type === 'alphabet' ? currentRail.id : null}
                    alphabetLabel={filters.letter}
                    alphabetSections={navigationRails
                      .filter((r) => r.type === 'alphabet')
                      .map((r) => ({ id: r.id, label: r.letter ?? r.title, games: r.games }))}
                    classicGames={c64ClassicGames}
                    favoriteGames={c64FavoriteGames}
                    focusedGameId={currentFocusedGame?.id.toString()}
                    focusedIndex={currentFocusedIndex}
                    focusedRailId={currentRail?.id}
                    games={bigboxFlatGames}
                    gridColumns={cyberpunkGridColumns}
                    isFavorite={isFavorite}
                    onFocusSectionItem={(railId, index) => focusRailItem(navigationRails.findIndex((r) => r.id === railId), railId, index)}
                    onFocusRailItem={(railId, index) => focusRailItem(navigationRails.findIndex((r) => r.id === railId), railId, index)}
                    onSelectGame={handleSelectGame}
                    recentGames={c64RecentGames}
                    toggleFavorite={toggleFavorite}
                  />
                )
              ) : (
                bigboxRails.map((rail, idx) => {
                  const isActive = idx === activeRailIndex;
                  const focusedIdx = railFocusIndices[rail.id] || 0;

                  if (rail.type === 'alphabet') {
                    return (
                      <BigBoxAlphabetRail
                        key={rail.id}
                        focusedIdx={focusedIdx}
                        isActive={isActive}
                        isFavorite={isFavorite}
                        layout={layout}
                        onFocus={(gameIndex) => focusRailItem(idx, rail.id, gameIndex)}
                        onSelectGame={(gameId) => {
                          const game = rail.games.find((candidate) => candidate.id === gameId);
                          if (game) {
                            handleSelectGame(game);
                          }
                        }}
                        rail={rail}
                      />
                    );
                  }

                  return (
                    <div key={rail.id} className="scroll-mt-[340px]">
                      <HorizontalRail
                        title={rail.title}
                        games={rail.games}
                        onSelectGame={handleSelectGame}
                        focusedIndex={focusedIdx}
                        isActive={isActive}
                        onFocusChange={(fIdx) => focusRailItem(idx, rail.id, fIdx)}
                        isFavorite={isFavorite}
                        layout={layout}
                        tileScale={theme.id === 'arcade-void' ? rail.scale : undefined}
                        loop={rail.games.length > 6}
                      />
                    </div>
                  );
                })
              )}
            </main>
          )}
        </div>

        <BigBoxFooter />
      </div>
    );
  }

  // RENDER WINDOWED LAYOUT
  return (
    <main
      className={`h-screen overflow-hidden bg-[var(--theme-background)] text-[var(--theme-text)] flex flex-col font-sans transition-all`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat saturate-[0.85] contrast-[1.08]"
        style={{
          backgroundImage: `url('${theme.assets.wallpaper || libraryBackground}')`,
          opacity: LIBRARY_BACKGROUND_OPACITY,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--theme-background) 58%, transparent), var(--theme-background))',
        }}
      />
      <LibraryHeader
        filters={filters}
        genres={finalGenres}
        onExit={exitApp}
        onFiltersChange={handleFiltersChange}
        onOpenSettings={() => setViewMode('settings')}
        onPlatformSelect={onPlatformSelect}
        onSearchChange={handleSearchChange}
        subGenres={finalSubGenres}
        onViewModeChange={setViewMode}
        searchInput={searchInput}
        activePlatformId={settings.activePlatformId}
        totalGameCount={listGameCount}
        viewMode={viewMode}
      />

      <div data-library-scroll-container className="no-scrollbar relative z-10 flex-1 overflow-y-auto overflow-x-hidden pl-8 pr-4">
        {(theme.layout.alphabetNavType === 'jump-bar' || theme.id === 'c64-edition' || theme.id === 'cyberpunk-crt') && (
          <AlphabetJumpBar
            activeLetter={filters.letter}
            onLetterSelect={(l) => {
              handleFiltersChange({
                ...filters,
                letter: filters.letter === l ? undefined : l,
                searchQuery: undefined,
              });
              onSearchChange('');
            }}
          />
        )}

        {viewMode === 'grid' ? (
          usesRailGridNavigation ? (
            isC64Edition ? (
              <C64EditionGrid
                alphabetLabel={filters.letter}
                classicGames={classicGames}
                favoriteGames={favoriteGames}
                focusedIndex={focusedIndex >= 0 ? focusedIndex : -1}
                games={games}
                isFavorite={isFavorite}
                onEndReached={loadNextPage}
                onFocusChange={isMouseMode && settings.mouseHoverSelection ? setFocusedIndex : undefined}
                onSelectGame={handleSelectGame}
                recentGames={recentGames}
                toggleFavorite={toggleFavorite}
              />
            ) : (
              <CyberpunkCrtGrid
                alphabetLabel={filters.letter}
                classicGames={classicGames}
                favoriteGames={favoriteGames}
                focusedIndex={focusedIndex >= 0 ? focusedIndex : -1}
                games={games}
                gridColumns={undefined}
                isFavorite={isFavorite}
                onEndReached={loadNextPage}
                onFocusChange={isMouseMode && settings.mouseHoverSelection ? setFocusedIndex : undefined}
                onSelectGame={handleSelectGame}
                recentGames={recentGames}
                toggleFavorite={toggleFavorite}
              />
            )
          ) : (
            <>
              <WindowGameShelf
                games={recentGames}
                isFavorite={isFavorite}
                isArcadeVoid={isArcadeVoid}
                isMouseMode={isMouseMode}
                onFocusChange={() => {}}
                onSelectGame={handleSelectGame}
                section="recent"
                subtitle="Your latest launches, kept near the top for quick return trips."
                shelfRef={shelfRef}
                title="Recent Games"
              />

              <WindowGameShelf
                games={favoriteGames}
                isFavorite={isFavorite}
                isArcadeVoid={isArcadeVoid}
                isMouseMode={isMouseMode}
                onFocusChange={() => {}}
                onSelectGame={handleSelectGame}
                section="favorites"
                subtitle="Pinned titles from your personal shortlist."
                title="Your Favorites"
              />

              <WindowGameShelf
                games={classicGames}
                isFavorite={isFavorite}
                isArcadeVoid={isArcadeVoid}
                isMouseMode={isMouseMode}
                onFocusChange={() => {}}
                onSelectGame={handleSelectGame}
                section="legendary"
                subtitle="Essential GB64 staples surfaced in the windowed library too."
                title="🏆 Legendary Classics 🏆"
              />

              <GridView
                games={games}
                onSelectGame={handleSelectGame}
                focusedIndex={focusedIndex >= 0 ? focusedIndex : -1}
                onFocusChange={isMouseMode && settings.mouseHoverSelection ? setFocusedIndex : undefined}
                onEndReached={loadNextPage}
              />
            </>
          )
        ) : (
          <>
            <WindowGameListSection
              games={recentGames}
              isFavorite={isFavorite}
              onSelectGame={handleSelectGame}
              section="recent"
              title="Recent Games"
            />
            <WindowGameListSection
              games={favoriteGames}
              isFavorite={isFavorite}
              onSelectGame={handleSelectGame}
              section="favorites"
              title="Your Favorites"
            />
            <WindowGameListSection
              games={classicGames}
              isFavorite={isFavorite}
              onSelectGame={handleSelectGame}
              section="legendary"
              title="🏆 Legendary Classics 🏆"
            />
            <ListView
              games={games}
              onSelectGame={handleSelectGame}
              onSort={handleSort}
              focusedIndex={focusedIndex >= 0 ? focusedIndex : -1}
              onFocusChange={isMouseMode && settings.mouseHoverSelection ? setFocusedIndex : undefined}
              isFavorite={isFavorite}
              onEndReached={loadNextPage}
              activePlatformName={SUPPORTED_PLATFORMS.find((p) => p.id === settings.activePlatformId)?.displayName}
              totalGameCount={listGameCount}
              favoriteCount={favorites.length}
              themeId={theme.id}
            />
          </>
        )}
      </div>
    </main>
  );
}

// Private helper to prevent scrollbar issues in header visible subgenres
function getVisibleSubGenresHelper(subGenres: string[], activeSubGenre: string | undefined, maxCount: number) {
  const visible = subGenres.slice(0, maxCount);
  const overflow = subGenres.length > maxCount;

  if (activeSubGenre && !visible.includes(activeSubGenre)) {
    const index = subGenres.indexOf(activeSubGenre);
    if (index !== -1) {
      visible[maxCount - 1] = activeSubGenre;
    }
  }

  return {
    visibleSubGenres: visible,
    hasOverflow: overflow,
  };
}
