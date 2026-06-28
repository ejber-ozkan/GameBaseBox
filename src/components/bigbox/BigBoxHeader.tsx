"use client";

import { BIGBOX_LETTERS } from '../../hooks/useBigBoxLibraryData';
import { GameFilters } from '../../lib/tauri-bridge';
import { FullscreenLayoutMetrics } from '../../hooks/useFullscreenLayoutMetrics';
import { SUPPORTED_PLATFORMS } from '../../lib/platform-capabilities';
import type { PlatformId } from '../../types/platform';

interface BigBoxHeaderProps {
  activeHeaderItemIndex: number;
  activeHeaderRow: number;
  activeRailIndex: number;
  activePlatformId: PlatformId;
  filters: GameFilters;
  genres: string[];
  hasOverflowSubGenres: boolean;
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
  visibleSubGenres,
}: BigBoxHeaderProps) {
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
    'border bg-white/[0.03] text-white/45 hover:border-white/18 hover:bg-white/[0.05] hover:text-white/85';
  const headerPillFocusClass =
    'border-cyan-300 bg-cyan-400/16 text-cyan-100 scale-105 shadow-[0_0_0_1px_rgba(34,211,238,0.18)_inset,0_0_18px_rgba(34,211,238,0.16)] z-10';
  const headerPillSelectedClass =
    'border-cyan-500/45 bg-cyan-500/10 text-cyan-200 shadow-[0_0_0_1px_rgba(34,211,238,0.12)_inset]';
  const searchFocused = activeRailIndex === -1 && activeHeaderRow === 0 && activeHeaderItemIndex === 0;
  const platformFocused = showPlatformSwitcher && activeRailIndex === -1 && activeHeaderRow === 0 && activeHeaderItemIndex === 1;
  const settingsIndex = showPlatformSwitcher ? 2 : 1;
  const exitIndex = showPlatformSwitcher ? 3 : 2;

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[linear-gradient(180deg,rgba(7,11,18,0.96),rgba(10,10,15,0.82))] backdrop-blur-3xl flex flex-col shadow-[0_20px_60px_rgba(2,6,23,0.45)]">
      <div className="w-full" style={{ paddingTop: `${layout.headerPaddingY}px` }}>
        <div className="flex flex-wrap items-center justify-between gap-5" style={shellStyle}>
        <div className="flex min-w-0 flex-wrap items-center gap-5">
          <div className="flex min-w-0 flex-col">
            <h1
              className="font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600 leading-none"
              style={{ fontSize: `${layout.headerTitleSize}px` }}
            >
              GBBox
            </h1>
            <div
              className="ml-1 font-bold tracking-[0.3em] uppercase text-white/40"
              style={{ fontSize: `${layout.headerEyebrowSize}px` }}
            >
              GameBase Box
            </div>
          </div>

          <div className="mx-1 h-8 w-px bg-white/10"></div>

          {showPlatformSwitcher ? (
            <label
              className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-xs font-black uppercase tracking-[0.16em] transition-all ${
                platformFocused
                  ? headerPillFocusClass
                  : 'border-cyan-300/25 bg-cyan-400/10 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.08)]'
              }`}
              onMouseEnter={() => onSetHeaderFocus(0, 1)}
            >
              <span className="text-cyan-200/65">Platform</span>
              <select
                aria-label="Active platform"
                className="min-w-36 cursor-pointer rounded-md border border-white/10 bg-slate-950/80 px-2 py-1 text-sm font-black normal-case tracking-normal text-white outline-none transition-colors hover:border-cyan-300/40 focus:border-cyan-300/60"
                value={activePlatformId}
                onChange={(event) => onPlatformSelect(event.target.value as PlatformId)}
                onFocus={() => onSetHeaderFocus(0, 1)}
              >
                {SUPPORTED_PLATFORMS.map((platform) => (
                  <option key={platform.id} value={platform.id} className="bg-slate-950 text-white">
                    {platform.displayName}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <div className={`relative group max-w-full transition-all duration-300 ${searchFocused ? 'scale-105 z-10' : ''}`}>
            <input
              type="text"
              placeholder="QUICK SEARCH"
              value={searchInput}
              onChange={(event) => onSearchChange(event.target.value)}
              onFocus={onSearchFocus}
              className={`max-w-full rounded-full border font-black uppercase tracking-[0.14em] text-white outline-none transition-all placeholder:font-black placeholder:uppercase placeholder:tracking-[0.14em] placeholder:text-white/20 ${
                searchFocused
                  ? headerPillFocusClass
                  : headerPillBaseClass
              }`}
              style={{
                fontSize: `${Math.max(layout.headerTitleSize * 0.48, 16)}px`,
                padding: `${Math.max(layout.headerPaddingY * 0.55, 10)}px ${Math.max(layout.headerPaddingX, 16)}px`,
                width: `${layout.searchWidth}px`,
              }}
            />
            <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-opacity ${searchFocused ? 'opacity-70' : 'opacity-20 group-hover:opacity-40'}`}>🔍</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onShowSettings}
            onMouseEnter={() => onSetHeaderFocus(0, settingsIndex)}
            className={`flex items-center justify-center transition-all group rounded-full border ${
              activeRailIndex === -1 && activeHeaderRow === 0 && activeHeaderItemIndex === settingsIndex
                ? 'bg-blue-600 border-blue-400 text-white scale-105 shadow-[0_0_20px_rgba(59,130,246,0.5)]'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
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
                ? 'bg-red-600 border-red-400 text-white scale-105 shadow-[0_0_20px_rgba(220,38,38,0.5)]'
                : 'bg-red-600/20 border-red-500/30 text-red-500 hover:bg-red-600 hover:text-white hover:border-red-400'
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
            <div className="font-black text-white tabular-nums" style={{ fontSize: `${layout.clockSize}px` }}>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>
      </div>

      <div className="w-full" style={{ paddingTop: `${Math.max(layout.headerPaddingY - 8, 8)}px` }}>
        <div className="flex items-center gap-2 overflow-hidden max-w-full" style={{ ...shellStyle, paddingBottom: '12px' }}>
        <div className="shrink-0 font-black text-white/20 uppercase tracking-[0.2em]" style={{ fontSize: `${layout.headerEyebrowSize}px` }}>Genre</div>
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
        <div className="w-full border-t border-white/5" style={{ paddingTop: `${Math.max(layout.headerPaddingY - 6, 10)}px` }}>
        <div className="flex items-center gap-2 overflow-hidden max-w-full" style={{ ...shellStyle, paddingBottom: '12px' }}>
        <div className="shrink-0 font-black text-white/20 uppercase tracking-[0.2em]" style={{ fontSize: `${layout.headerEyebrowSize}px` }}>Sub-Genre</div>
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
                    : 'border border-cyan-500/25 bg-cyan-500/8 text-cyan-200 hover:border-cyan-400/35 hover:bg-cyan-500/12'
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

      <div className="w-full border-t border-white/5" style={{ paddingTop: `${Math.max(layout.headerPaddingY - 6, 10)}px`, paddingBottom: `${layout.headerPaddingY}px` }}>
        <div className="flex items-center gap-2 overflow-hidden max-w-full" style={shellStyle}>
        <div className="shrink-0 font-black text-white/20 uppercase tracking-[0.2em]" style={{ fontSize: `${layout.headerEyebrowSize}px` }}>Jump To</div>
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
