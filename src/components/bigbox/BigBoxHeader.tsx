"use client";

import { BIGBOX_LETTERS } from '../../hooks/useBigBoxLibraryData';
import { GameFilters } from '../../lib/tauri-bridge';
import { FullscreenLayoutMetrics } from '../../hooks/useFullscreenLayoutMetrics';
import { SUPPORTED_PLATFORMS } from '../../lib/platform-capabilities';
import type { PlatformId } from '../../types/platform';
import { PlatformSwitcher } from '../PlatformSwitcher';

interface BigBoxHeaderProps {
  activeHeaderItemIndex: number;
  activeHeaderRow: number;
  activeRailIndex: number;
  activePlatformId: PlatformId;
  filters: GameFilters;
  genres: string[];
  hasOverflowSubGenres: boolean;
  isFiltered: boolean;
  layout: FullscreenLayoutMetrics;
  onExit: () => void;
  onFiltersChange: (filters: GameFilters) => void;
  onOpenSubGenrePicker: () => void;
  onPlatformSelect: (platformId: PlatformId) => void;
  onJumpToRail: (railId: string) => void;
  onSearchChange: (value: string) => void;
  onSearchFocus: () => void;
  onSetHeaderFocus: (row: number, index: number) => void;
  onShowSettings: () => void;
  searchInput: string;
  totalGameCount: number;
  visibleSubGenres: string[];
}

export function BigBoxHeader({
  activeHeaderItemIndex,
  activeHeaderRow,
  activeRailIndex,
  activePlatformId,
  filters,
  genres,
  hasOverflowSubGenres,
  isFiltered,
  layout,
  onExit,
  onFiltersChange,
  onOpenSubGenrePicker,
  onPlatformSelect,
  onJumpToRail,
  onSearchChange,
  onSearchFocus,
  onSetHeaderFocus,
  onShowSettings,
  searchInput,
  totalGameCount,
  visibleSubGenres,
}: BigBoxHeaderProps) {
  const isC64Edition = typeof document !== 'undefined' && document.documentElement.dataset.theme === 'c64-edition';
  const hasSubGenres = Boolean(filters.genre && (visibleSubGenres.length > 0 || hasOverflowSubGenres));
  const showPlatformSwitcher = SUPPORTED_PLATFORMS.length > 1;
  const subGenreRowIndex = 2;
  const jumpRowIndex = hasSubGenres ? 3 : 2;
  const shellStyle = {
    margin: '0 auto',
    maxWidth: `${layout.shellWidth}px`,
    paddingLeft: `${layout.headerPaddingX}px`,
    paddingRight: `${layout.headerPaddingX}px`,
  };
  const chipStyle = {
    fontSize: `${layout.chipFontSize}px`,
    padding: `${layout.chipPaddingY}px ${layout.chipPaddingX}px`,
  };
  const jumpButtonStyle = {
    height: `${layout.jumpButtonSize}px`,
    width: `${layout.jumpButtonSize}px`,
    fontSize: `${Math.max(layout.chipFontSize - 0.5, 10)}px`,
  };
  const headerPillBaseClass =
    'border border-[var(--theme-outline-variant)] bg-[var(--theme-surface)] text-[var(--theme-text-muted)] hover:border-[var(--theme-outline)] hover:bg-[var(--theme-primary-container)] hover:text-[var(--theme-text)]';
  const headerPillFocusClass =
    'z-10 scale-105 border-[var(--theme-primary)] bg-[var(--theme-primary-container)] text-[var(--theme-text)] shadow-[0_0_18px_var(--theme-primary)]';
  const headerPillSelectedClass =
    'border-[var(--theme-primary)] bg-[var(--theme-primary-container)] text-[var(--theme-primary)]';
  const searchFocused = activeRailIndex === -1 && activeHeaderRow === 0 && activeHeaderItemIndex === 0;
  const platformFocused = showPlatformSwitcher && activeRailIndex === -1 && activeHeaderRow === 0 && activeHeaderItemIndex === 1;
  const settingsIndex = showPlatformSwitcher ? 2 : 1;
  const exitIndex = showPlatformSwitcher ? 3 : 2;

  return (
    <header className="theme-panel sticky top-0 z-50 flex flex-col border-b border-[var(--theme-outline-variant)] bg-[var(--theme-surface)] shadow-lg backdrop-blur-3xl">
      <div className="w-full" style={{ paddingTop: `${layout.headerPaddingY}px` }}>
        <div className="flex flex-wrap items-center justify-between gap-5" style={shellStyle}>
        <div className="flex min-w-0 flex-wrap items-center gap-5">
          <div className="flex min-w-0 flex-col">
            <h1
              className="bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] bg-clip-text font-black italic leading-none tracking-tighter text-transparent"
              style={{ fontSize: `${layout.headerTitleSize}px` }}
            >
              GBBox
            </h1>
            <div
              className="ml-1 font-bold uppercase tracking-[0.3em] text-[var(--theme-text-muted)]"
              style={{ fontSize: `${layout.headerEyebrowSize}px` }}
            >
              GameBase Box
            </div>
          </div>

          <div className="mx-1 h-8 w-px bg-[var(--theme-outline-variant)]"></div>

          {showPlatformSwitcher ? (
            <div className="flex items-center gap-2">
              <PlatformSwitcher
                activePlatformId={activePlatformId}
                isFocused={platformFocused}
                label="Platform"
                onFocus={() => onSetHeaderFocus(0, 1)}
                onMouseEnter={() => onSetHeaderFocus(0, 1)}
                onPlatformSelect={onPlatformSelect}
              />
              <div className="shrink-0 whitespace-nowrap text-[10px] font-black uppercase tracking-[0.2em] text-[var(--theme-text-muted)]">
                {totalGameCount} {isFiltered ? 'GAMES FOUND' : 'GAMES AVAILABLE'}
              </div>
            </div>
          ) : null}

          <div className={`relative group max-w-full transition-all duration-300 ${searchFocused ? 'scale-105 z-10' : ''}`}>
            <input
              type="text"
              placeholder="QUICK SEARCH"
              value={searchInput}
              onChange={(event) => onSearchChange(event.target.value)}
              onFocus={onSearchFocus}
              className={`max-w-full rounded-[var(--theme-radius-xl)] border font-black uppercase tracking-[0.14em] text-[var(--theme-text)] outline-none transition-all placeholder:font-black placeholder:uppercase placeholder:tracking-[0.14em] placeholder:text-[var(--theme-text-muted)] ${
                searchFocused
                  ? headerPillFocusClass
                  : headerPillBaseClass
              }`}
              style={{
                fontSize: `${Math.max(layout.headerTitleSize * 0.48, 16)}px`,
                padding: `${Math.max(layout.headerPaddingY * 0.55, 10)}px ${isC64Edition ? Math.max(layout.headerPaddingX + 24, 40) : Math.max(layout.headerPaddingX, 16)}px ${Math.max(layout.headerPaddingY * 0.55, 10)}px ${Math.max(layout.headerPaddingX, 16)}px`,
                width: `${layout.searchWidth}px`,
              }}
            />
            {isC64Edition ? <span aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 h-6 w-3 -translate-y-1/2 bg-[var(--theme-primary)] animate-[cursor-blink_1s_steps(1,end)_infinite]" data-testid="c64-search-cursor" /> : <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-opacity ${searchFocused ? 'opacity-70' : 'opacity-20 group-hover:opacity-40'}`}>🔍</div>}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onShowSettings}
            onMouseEnter={() => onSetHeaderFocus(0, settingsIndex)}
            className={`flex items-center justify-center transition-all group rounded-full border ${
              activeRailIndex === -1 && activeHeaderRow === 0 && activeHeaderItemIndex === settingsIndex
                ? 'scale-105 border-[var(--theme-primary)] bg-[var(--theme-primary-container)] text-[var(--theme-text)] shadow-[0_0_20px_var(--theme-primary)]'
                : 'border-[var(--theme-outline-variant)] bg-[var(--theme-surface)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-primary-container)] hover:text-[var(--theme-text)]'
            }`}
            style={{ height: `${layout.headerControlSize}px`, width: `${layout.headerControlSize}px` }}
            title="Settings"
          >
            <span
              className={`transition-transform duration-500 ${activeRailIndex === -1 && activeHeaderRow === 0 && activeHeaderItemIndex === settingsIndex ? 'rotate-45' : 'group-hover:rotate-45'}`}
              style={{ fontSize: `${Math.max(layout.headerControlSize * 0.5, 18)}px` }}
            >
              ⚙️
            </span>
          </button>

          <button
            onClick={onExit}
            onMouseEnter={() => onSetHeaderFocus(0, exitIndex)}
            className={`flex items-center justify-center transition-all group rounded-full border ${
              activeRailIndex === -1 && activeHeaderRow === 0 && activeHeaderItemIndex === exitIndex
                ? 'scale-105 border-[var(--theme-tertiary)] bg-[var(--theme-tertiary)] text-[var(--theme-background)] shadow-[0_0_20px_var(--theme-tertiary)]'
                : 'border-[var(--theme-tertiary)] bg-[var(--theme-surface)] text-[var(--theme-tertiary)] hover:bg-[var(--theme-tertiary)] hover:text-[var(--theme-background)]'
            }`}
            style={{ height: `${layout.headerControlSize}px`, width: `${layout.headerControlSize}px` }}
            title="Exit Application"
          >
            <span
              className={`transition-transform ${activeRailIndex === -1 && activeHeaderRow === 0 && activeHeaderItemIndex === exitIndex ? 'scale-110' : 'group-hover:scale-110'}`}
              style={{ fontSize: `${Math.max(layout.headerControlSize * 0.5, 18)}px` }}
            >
              ⏻
            </span>
          </button>

          <div className="flex flex-col items-end opacity-60">
            <div className="font-black tabular-nums text-[var(--theme-text)]" style={{ fontSize: `${layout.clockSize}px` }}>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>
      </div>

      <div className="w-full" style={{ paddingTop: `${Math.max(layout.headerPaddingY - 8, 8)}px` }}>
        <div className="flex items-center gap-2 overflow-hidden max-w-full" style={{ ...shellStyle, paddingBottom: '12px' }}>
        <div className="shrink-0 font-black uppercase tracking-[0.2em] text-[var(--theme-text-muted)]" style={{ fontSize: `${layout.headerEyebrowSize}px` }}>Genre</div>
        <div className="min-w-0 flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth flex-1 justify-start">
          {genres.map((genre, index) => {
            const isSelected = filters.genre === genre;
            const isFocused = activeRailIndex === -1 && activeHeaderRow === 1 && activeHeaderItemIndex === index;
            return (
              <button
                key={genre}
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    genre: filters.genre === genre ? undefined : genre,
                    subGenre: undefined,
                  })
                }
                onMouseEnter={() => onSetHeaderFocus(1, index)}
                className={`rounded-full font-black whitespace-nowrap transition-all ${
                  isFocused
                    ? headerPillFocusClass
                    : isSelected
                      ? headerPillSelectedClass
                      : headerPillBaseClass
                }`}
                style={chipStyle}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>
      </div>

      {hasSubGenres ? (
        <div className="w-full border-t border-[var(--theme-outline-variant)]" style={{ paddingTop: `${Math.max(layout.headerPaddingY - 6, 10)}px` }}>
        <div className="flex items-center gap-2 overflow-hidden max-w-full" style={{ ...shellStyle, paddingBottom: '12px' }}>
        <div className="shrink-0 font-black uppercase tracking-[0.2em] text-[var(--theme-text-muted)]" style={{ fontSize: `${layout.headerEyebrowSize}px` }}>Sub-Genre</div>
        <div className="min-w-0 flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth flex-1 justify-start">
            {visibleSubGenres.map((subGenre, index) => {
              const isSelected = filters.subGenre === subGenre;
              const isFocused =
                activeRailIndex === -1 && activeHeaderRow === subGenreRowIndex && activeHeaderItemIndex === index;
              return (
                <button
                  key={subGenre}
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      subGenre: filters.subGenre === subGenre ? undefined : subGenre,
                    })
                  }
                  onMouseEnter={() => onSetHeaderFocus(subGenreRowIndex, index)}
                  className={`rounded-full font-black whitespace-nowrap transition-all ${
                    isFocused
                      ? headerPillFocusClass
                      : isSelected
                        ? headerPillSelectedClass
                        : headerPillBaseClass
                  }`}
                  style={chipStyle}
                >
                  {subGenre}
                </button>
              );
            })}
            {hasOverflowSubGenres ? (
              <button
                type="button"
                onClick={onOpenSubGenrePicker}
                onMouseEnter={() => onSetHeaderFocus(subGenreRowIndex, visibleSubGenres.length)}
                className={`rounded-full font-black whitespace-nowrap transition-all ${
                  activeRailIndex === -1 &&
                  activeHeaderRow === subGenreRowIndex &&
                  activeHeaderItemIndex === visibleSubGenres.length
                    ? headerPillFocusClass
                    : 'border border-[var(--theme-primary)] bg-[var(--theme-surface)] text-[var(--theme-primary)] hover:bg-[var(--theme-primary-container)]'
                }`}
                style={chipStyle}
              >
                More...
              </button>
            ) : null}
          </div>
        </div>
        </div>
      ) : null}

      <div className="w-full border-t border-[var(--theme-outline-variant)]" style={{ paddingTop: `${Math.max(layout.headerPaddingY - 6, 10)}px`, paddingBottom: `${layout.headerPaddingY}px` }}>
        <div className="flex items-center gap-2 overflow-hidden max-w-full" style={shellStyle}>
        <div className="shrink-0 font-black uppercase tracking-[0.2em] text-[var(--theme-text-muted)]" style={{ fontSize: `${layout.headerEyebrowSize}px` }}>Jump To</div>
        <div className="min-w-0 flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth flex-1 justify-start">
          {BIGBOX_LETTERS.map((letter, index) => {
            const isFocused = activeRailIndex === -1 && activeHeaderRow === jumpRowIndex && activeHeaderItemIndex === index;
            return (
              <button
                key={letter}
                onClick={() => onJumpToRail(`alpha-${letter}`)}
                onMouseEnter={() => onSetHeaderFocus(jumpRowIndex, index)}
                className={`flex items-center justify-center rounded-full font-black transition-all ${
                  isFocused
                    ? headerPillFocusClass
                    : headerPillBaseClass
                }`}
                style={jumpButtonStyle}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>
      </div>
    </header>
  );
}
