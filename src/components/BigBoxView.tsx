"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Game } from '../types/game';
import { Settings } from '../contexts/SettingsContext';
import { useFavorites } from '../hooks/useFavorites';
import { useInputMode } from '../hooks/useInputMode';
import { GameFilters } from '../lib/tauri-bridge';
import { BigBoxHeader } from './bigbox/BigBoxHeader';
import { BigBoxAlphabetRail } from './bigbox/BigBoxAlphabetRail';
import { getThemeListPresentation } from '../themes/list-presentations';
import { BigBoxFooter } from './bigbox/BigBoxFooter';
import { BigBoxExitPrompt } from './bigbox/BigBoxExitPrompt';
import { HorizontalRail } from './HorizontalRail';
import { useBigBoxLibraryData } from '../hooks/useBigBoxLibraryData';
import { useBigBoxNavigation } from '../hooks/useBigBoxNavigation';
import { useBigBoxScrollSync } from '../hooks/useBigBoxScrollSync';
import { ControllerSearchKeyboard } from './ControllerSearchKeyboard';
import { SubGenrePickerModal } from './SubGenrePickerModal';
import { playRotatingUiSoundEffect, playUiSoundEffect, playUiSoundEffectAndWait } from '../lib/ui-sound-effects';
import { getVisibleSubGenres } from '../lib/subgenre-display';
import { useFullscreenLayoutMetrics } from '../hooks/useFullscreenLayoutMetrics';
import { SUPPORTED_PLATFORMS } from '../lib/platform-capabilities';
import type { PlatformId } from '../types/platform';
import { LIBRARY_BACKGROUND_OPACITY, resolveLibraryBackground } from '../lib/library-backgrounds';

interface BigBoxViewProps {
  settings: Settings;
  onSelectGame: (game: Game) => void;
  onSessionChange: (session: BigBoxSessionState) => void;
  onRequestExit: (snapshot: { dontAskAgain: boolean; focusedGameId: string | null; railId: string | null }) => void;
  sessionState?: BigBoxSessionState | null;
  searchInput: string;
  onSearchChange: (val: string) => void;
  onShowSettings: () => void;
  onPlatformSelect: (platformId: PlatformId) => void;
  filters: GameFilters;
  onFiltersChange: (f: GameFilters) => void;
}

export interface BigBoxSessionState {
  activeHeaderItemIndex: number;
  activeHeaderRow: number;
  activeRailIndex: number;
  focusedGameId: string | null;
  railFocusIndices: Record<string, number>;
  railId: string | null;
}

export function BigBoxView({
  settings,
  onSelectGame,
  onSessionChange,
  onRequestExit,
  sessionState,
  searchInput,
  onSearchChange,
  onShowSettings,
  onPlatformSelect,
  filters,
  onFiltersChange,
}: BigBoxViewProps) {
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { isMouseMode, onGamepadInput } = useInputMode();
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
  const bigBoxBackground = resolveLibraryBackground(settings.activePlatformId, 'grid', 0);

  const { genres, loading, rails, subGenres, totalGameCount } = useBigBoxLibraryData({
    activeRailIndex,
    activePlatformId: settings.activePlatformId,
    favorites,
    filters,
    recentlyPlayedIds: settings.recentlyPlayedIds,
    searchInput,
  });

  const currentRail = activeRailIndex >= 0 ? rails[activeRailIndex] : null;
  const currentFocusedIndex = currentRail ? (railFocusIndices[currentRail.id] ?? 0) : 0;
  const currentFocusedGame = currentRail?.games[currentFocusedIndex] ?? null;
  const isInteractionOverlayOpen = isControllerKeyboardOpen || isExitPromptOpen || isSubGenrePickerOpen;
  const isShowingFilteredCount = Boolean(searchInput.trim() || filters.genre || filters.subGenre);
  const { hasOverflow, visibleSubGenres } = useMemo(
    () => getVisibleSubGenres(subGenres, filters.subGenre, layout.maxVisibleSubGenres),
    [filters.subGenre, layout.maxVisibleSubGenres, subGenres],
  );
  const showPlatformSwitcher = SUPPORTED_PLATFORMS.length > 1;
  const cyclePlatform = useCallback(() => {
    const currentIndex = SUPPORTED_PLATFORMS.findIndex((platform) => platform.id === settings.activePlatformId);
    const nextPlatform = SUPPORTED_PLATFORMS[(currentIndex + 1) % SUPPORTED_PLATFORMS.length];
    if (nextPlatform) {
      onPlatformSelect(nextPlatform.id);
    }
  }, [onPlatformSelect, settings.activePlatformId]);

  useEffect(() => {
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
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (window.sessionStorage.getItem('gb64_bigbox_launch_sound_played')) {
      return;
    }

    window.sessionStorage.setItem('gb64_bigbox_launch_sound_played', '1');
    void playRotatingUiSoundEffect('bigbox-launch', ['open-app-1', 'open-app-2'], 0.6);
  }, []);

  useEffect(() => {
    const timeoutRef = classicTimeoutRef;
    return () => {
      const classicTimeout = timeoutRef.current;
      if (classicTimeout) {
        clearTimeout(classicTimeout);
      }
    };
  }, []);

  useEffect(() => {
    if (hasRestoredPosition || rails.length === 0 || searchInput.trim()) {
      return;
    }

    const targetRailId = sessionState?.railId ?? settings.lastBigBoxRailId;
    const targetGameId = sessionState?.focusedGameId ?? settings.lastBigBoxGameId;

    const frameId = window.requestAnimationFrame(() => {
      if (!targetRailId) {
        setHasRestoredPosition(true);
        return;
      }

      const targetRailIndex = rails.findIndex((rail) => rail.id === targetRailId);
      if (targetRailIndex === -1) {
        setHasRestoredPosition(true);
        return;
      }

      setActiveRailIndex(targetRailIndex);

      const targetRail = rails[targetRailIndex];
      if (!targetGameId) {
        setHasRestoredPosition(true);
        return;
      }

      const gameIndex = targetRail.games.findIndex(
        (game) => game.id.toString() === targetGameId,
      );

      if (gameIndex >= 0) {
        setRailFocusIndices((previous) => ({ ...previous, [targetRail.id]: gameIndex }));
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
    rails,
    searchInput,
    sessionState?.focusedGameId,
    sessionState?.railId,
    settings.lastBigBoxGameId,
    settings.lastBigBoxRailId,
  ]);

  const openExitPrompt = useCallback(() => {
    if (isInteractionOverlayOpen) {
      return;
    }

    if (!settings.confirmFullscreenExit) {
      onRequestExit({
        dontAskAgain: true,
        focusedGameId: currentFocusedGame?.id.toString() ?? null,
        railId: currentRail?.id ?? null,
      });
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

    const selectedGameIndex = currentRail
      ? currentRail.games.findIndex((candidate) => candidate.id === game.id)
      : -1;
    const resolvedFocusedIndex = selectedGameIndex >= 0 ? selectedGameIndex : currentFocusedIndex;
    const nextRailFocusIndices = currentRail
      ? {
          ...railFocusIndices,
          [currentRail.id]: resolvedFocusedIndex,
        }
      : railFocusIndices;

    onSessionChange({
      activeHeaderItemIndex,
      activeHeaderRow,
      activeRailIndex,
      focusedGameId: game.id.toString(),
      railFocusIndices: nextRailFocusIndices,
      railId: currentRail?.id ?? null,
    });

    void (async () => {
      await playUiSoundEffectAndWait('open-detail-1', 0.58);
      if (game.isClassic) {
        await playUiSoundEffect('classic-game', 0.62);
      }
    })();

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
  ]);

  const handleSearchChange = useCallback((value: string) => {
    if (!searchInput.trim() && value.trim()) {
      void playUiSoundEffect('search-filter', 0.42);
    }
    onSearchChange(value);
  }, [onSearchChange, searchInput]);

  const handleFiltersChange = useCallback((nextFilters: GameFilters) => {
    if (
      filters.genre !== nextFilters.genre ||
      filters.subGenre !== nextFilters.subGenre ||
      filters.letter !== nextFilters.letter
    ) {
      void playUiSoundEffect('search-filter', 0.42);
    }
    if (isSubGenrePickerOpen) {
      setIsSubGenrePickerOpen(false);
    }
    onFiltersChange(nextFilters);
  }, [filters.genre, filters.letter, filters.subGenre, isSubGenrePickerOpen, onFiltersChange]);

  const {
    currentRailId,
    currentRailType,
    focusHeader,
    focusRailItem,
    focusSearch,
    handleKeyDown,
    jumpToRail,
    sectionJumpDirection,
    setSectionJumpDirection,
  } = useBigBoxNavigation({
    activeHeaderItemIndex,
    activeHeaderRow,
    activeRailIndex,
    filters,
    genres,
    hasOverflowSubGenres: hasOverflow,
    isControllerKeyboardOpen: isInteractionOverlayOpen,
    gridColumns: layout.gridColumns,
    onBack: openExitPrompt,
    onFiltersChange: handleFiltersChange,
    onFocusSearchInput: () => {
      const input = headerRef.current?.querySelector('input');
      if (input) {
        (input as HTMLElement).focus();
      }
    },
    onGamepadInput,
    onLetterJump: () => {
      void playUiSoundEffect('search-filter', 0.42);
    },
    onNavigationMove: () => {
      void playUiSoundEffect('menu-move-1', 0.3);
    },
    onOpenControllerKeyboard: () => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      setIsControllerKeyboardOpen(true);
    },
    onOpenSubGenrePicker: () => setIsSubGenrePickerOpen(true),
    onPlatformCycle: cyclePlatform,
    onSelectGame: handleSelectGame,
    onShowSettings,
    platformSwitcherEnabled: showPlatformSwitcher,
    railFocusIndices,
    rails,
    setActiveHeaderItemIndex,
    setActiveHeaderRow,
    setActiveRailIndex,
    setRailFocusIndices,
    toggleFavorite,
    visibleSubGenres,
  });

  const { scrollContainerRef, headerRef } = useBigBoxScrollSync({
    activeRailIndex,
    currentFocusedIndex,
    currentRailId,
    currentRailType,
    onSectionJumpHandled: () => setSectionJumpDirection(null),
    sectionJumpDirection,
  });

  const listPresentation = getThemeListPresentation(
    typeof document === 'undefined' ? undefined : document.documentElement.dataset.theme,
  );

  return (
    <div 
      className="bigbox-list-surface fixed inset-0 flex flex-col overflow-hidden bg-[var(--theme-background)] text-[var(--theme-text)] select-none"
      data-list-presentation={listPresentation.layout}
      data-bigbox-rail-style={listPresentation.bigBox.railStyle}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat saturate-[0.9] contrast-[1.05]"
        style={{ backgroundImage: `url('${bigBoxBackground}')`, opacity: LIBRARY_BACKGROUND_OPACITY }}
      />
      {/* Top Bar - Fixed */}
      <header ref={headerRef}>
        <BigBoxHeader
          activeHeaderItemIndex={activeHeaderItemIndex}
          activeHeaderRow={activeHeaderRow}
          activeRailIndex={activeRailIndex}
          activePlatformId={settings.activePlatformId}
          filters={filters}
          genres={genres}
          hasOverflowSubGenres={hasOverflow}
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
          onShowSettings={onShowSettings}
          searchInput={searchInput}
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
          onRequestExit({
            dontAskAgain,
            focusedGameId: currentFocusedGame?.id.toString() ?? null,
            railId: currentRail?.id ?? null,
          });
        }}
        onGamepadInput={onGamepadInput}
      />

      <SubGenrePickerModal
        key={`${filters.genre ?? 'none'}:${filters.subGenre ?? 'none'}:${isSubGenrePickerOpen ? 'open' : 'closed'}`}
        isOpen={isSubGenrePickerOpen}
        onClose={() => setIsSubGenrePickerOpen(false)}
        onGamepadInput={onGamepadInput}
        onSelect={(subGenre) => {
          handleFiltersChange({
            ...filters,
            subGenre,
          });
          setIsSubGenrePickerOpen(false);
        }}
        selectedSubGenre={filters.subGenre}
        subGenres={subGenres}
        title={filters.genre ? `${filters.genre} Sub-Genres` : 'Choose Sub-Genre'}
      />

      {/* Rails Container - wrapper clips any stubborn native scrollbar off-canvas */}
      <div className="z-10 flex-1 overflow-hidden">
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
          {loading ? (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
               <div className="h-12 w-12 rounded-full border-4 border-[var(--theme-outline-variant)] border-t-[var(--theme-primary)] animate-spin"></div>
               <div className="font-bold uppercase tracking-widest text-[var(--theme-primary)] animate-pulse">Scanning Library...</div>
            </div>
          ) : (
            rails.map((rail, idx) => {
              const isActive = idx === activeRailIndex;
              const focusedIdx = railFocusIndices[rail.id] || 0;

              if (rail.type === 'alphabet') {
                return (
                  <BigBoxAlphabetRail
                    key={rail.id}
                    focusedIdx={focusedIdx}
                    isActive={isActive}
                    isFavorite={isFavorite}
                    isMouseMode={isMouseMode}
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
                    isMouseFocusEnabled={isMouseMode}
                    onFocusChange={(fIdx) => focusRailItem(idx, rail.id, fIdx)}
                    isFavorite={isFavorite}
                    layout={layout}
                    tileScale={rail.scale}
                    loop={rail.games.length > 6}
                  />
                </div>
              );
            })
          )}
        </main>
      </div>

      {/* Bottom Status Bar */}
      <BigBoxFooter isFiltered={isShowingFilteredCount} totalGameCount={totalGameCount} />
    </div>
  );
}
