"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { SubGenrePickerModal } from '../SubGenrePickerModal';
import type { GameFilters } from '../../lib/tauri-bridge';
import type { LibraryViewMode } from '../../hooks/useLibraryBrowserState';
import { getVisibleSubGenres } from '../../lib/subgenre-display';
import { PlatformSwitcher } from '../PlatformSwitcher';
import type { PlatformId } from '../../types/platform';

interface LibraryHeaderProps {
  filters: GameFilters;
  genres: string[];
  subGenres: string[];
  onExit: () => void;
  onFiltersChange: Dispatch<SetStateAction<GameFilters>>;
  onOpenSettings: () => void;
  onPlatformSelect: (platformId: PlatformId) => void;
  onSearchChange: (value: string) => void;
  onViewModeChange: (viewMode: LibraryViewMode) => void;
  searchInput: string;
  activePlatformId: PlatformId;
  viewMode: LibraryViewMode;
}

export function LibraryHeader({
  filters,
  genres,
  subGenres,
  onExit,
  onFiltersChange,
  onOpenSettings,
  onPlatformSelect,
  onSearchChange,
  onViewModeChange,
  searchInput,
  activePlatformId,
  viewMode,
}: LibraryHeaderProps) {
  const [isSubGenrePickerOpen, setIsSubGenrePickerOpen] = useState(false);
  const { hasOverflow, visibleSubGenres } = useMemo(
    () => getVisibleSubGenres(subGenres, filters.subGenre, 11),
    [filters.subGenre, subGenres],
  );

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-white/5 bg-[linear-gradient(180deg,rgba(7,11,18,0.98),rgba(10,10,15,0.92))] px-8 py-5 shadow-[0_20px_60px_rgba(2,6,23,0.45)] backdrop-blur-2xl">
        <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600 leading-none">
              GBBox
            </h1>
            <div className="ml-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
              GameBase Box
            </div>
          </div>
          <div className="mx-2 h-8 w-px bg-white/10" />
          <PlatformSwitcher activePlatformId={activePlatformId} onPlatformSelect={onPlatformSelect} />
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="QUICK SEARCH"
              value={searchInput}
              onChange={(event) => onSearchChange(event.target.value)}
              className="w-80 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white shadow-inner transition-colors placeholder:text-white/20 focus:border-blue-500 focus:bg-white/10 focus:outline-none"
            />
          </div>

          <div className="ml-4 flex rounded-2xl bg-black/30 p-1.5 border border-white/5">
          <button
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'grid' ? 'bg-white/10 text-white shadow' : 'text-white/45 hover:text-white'
            }`}
            onClick={() => onViewModeChange('grid')}
          >
            Grid {viewMode === 'list' && <span className="ml-1 text-[10px] opacity-50">(X)</span>}
          </button>
          <button
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'list' ? 'bg-white/10 text-white shadow' : 'text-white/45 hover:text-white'
            }`}
            onClick={() => onViewModeChange('list')}
          >
            List {viewMode === 'grid' && <span className="ml-1 text-[10px] opacity-50">(X)</span>}
          </button>
          </div>

          <button
            onClick={onOpenSettings}
            className="ml-2 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            title="Settings"
          >
            <span>⚙️</span>
          </button>

          <button
            onClick={onExit}
            className="ml-1 flex h-11 w-11 items-center justify-center rounded-full border border-red-500/30 bg-red-600/20 text-red-400 transition-colors hover:bg-red-600 hover:text-white"
            title="Exit Application"
          >
            ⏻
          </button>
        </div>
        </div>

        <div className="mt-5 flex items-center gap-3 overflow-hidden">
        <div className="shrink-0 text-[10px] font-black uppercase tracking-[0.22em] text-white/20">Genre</div>
        <div className="no-scrollbar flex flex-1 items-center gap-2 overflow-x-auto">
          {genres.map((genre) => {
            const isSelected = filters.genre === genre;
            return (
              <button
                key={genre}
                onClick={() =>
                  onFiltersChange((previous) => ({
                    ...previous,
                    genre: previous.genre === genre ? undefined : genre,
                    subGenre: undefined,
                    searchQuery: searchInput.trim() ? undefined : previous.searchQuery,
                  }))
                }
                className={`rounded-md border px-4 py-1.5 text-xs font-bold transition-all ${
                  isSelected
                    ? 'border-blue-500/50 bg-blue-900/40 text-blue-300'
                    : 'border-white/8 bg-white/[0.04] text-white/45 hover:border-white/20 hover:text-white'
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
        </div>

        {filters.genre && subGenres.length > 0 ? (
          <div className="mt-3 flex items-center gap-3 overflow-hidden">
          <div className="shrink-0 text-[10px] font-black uppercase tracking-[0.22em] text-white/20">Sub-Genre</div>
          <div className="no-scrollbar flex flex-1 items-center gap-2 overflow-x-auto">
            {visibleSubGenres.map((subGenre) => {
              const isSelected = filters.subGenre === subGenre;
              return (
                <button
                  key={subGenre}
                  onClick={() =>
                    onFiltersChange((previous) => ({
                      ...previous,
                      subGenre: previous.subGenre === subGenre ? undefined : subGenre,
                      searchQuery: searchInput.trim() ? undefined : previous.searchQuery,
                    }))
                  }
                  className={`rounded-md border px-4 py-1.5 text-xs font-bold transition-all ${
                    isSelected
                      ? 'border-cyan-500/50 bg-cyan-900/40 text-cyan-200'
                      : 'border-white/8 bg-white/[0.04] text-white/45 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {subGenre}
                </button>
              );
            })}
            {hasOverflow ? (
              <button
                type="button"
                onClick={() => setIsSubGenrePickerOpen(true)}
                className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-bold text-cyan-200 transition-all hover:border-cyan-400/50 hover:bg-cyan-500/16"
              >
                More...
              </button>
            ) : null}
          </div>
          </div>
        ) : null}
      </header>

      <SubGenrePickerModal
        key={`${filters.genre ?? 'none'}:${filters.subGenre ?? 'none'}:${isSubGenrePickerOpen ? 'open' : 'closed'}`}
        isOpen={isSubGenrePickerOpen}
        onClose={() => setIsSubGenrePickerOpen(false)}
        onSelect={(subGenre) => {
          onFiltersChange((previous) => ({
            ...previous,
            subGenre,
            searchQuery: searchInput.trim() ? undefined : previous.searchQuery,
          }));
          setIsSubGenrePickerOpen(false);
        }}
        selectedSubGenre={filters.subGenre}
        subGenres={subGenres}
        title={filters.genre ? `${filters.genre} Sub-Genres` : 'Choose Sub-Genre'}
      />
    </>
  );
}
