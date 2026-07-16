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
      <header className="theme-panel sticky top-0 z-10 border-b border-[var(--theme-outline-variant)] bg-[var(--theme-surface)] px-8 py-5 shadow-lg backdrop-blur-2xl">
        <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className="bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] bg-clip-text text-4xl font-black italic leading-none tracking-tighter text-transparent">
              GBBox
            </h1>
            <div className="ml-1 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--theme-text-muted)]">
              GameBase Box
            </div>
          </div>
          <div className="mx-2 h-8 w-px bg-[var(--theme-outline-variant)]" />
          <PlatformSwitcher activePlatformId={activePlatformId} onPlatformSelect={onPlatformSelect} />
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="QUICK SEARCH"
              value={searchInput}
              onChange={(event) => onSearchChange(event.target.value)}
              className="w-80 rounded-[var(--theme-radius-xl)] border border-[var(--theme-outline-variant)] bg-[var(--theme-background)] px-6 py-3 text-sm font-bold text-[var(--theme-text)] shadow-inner transition-colors placeholder:text-[var(--theme-text-muted)] focus:border-[var(--theme-primary)] focus:bg-[var(--theme-surface)] focus:outline-none"
            />
          </div>

          <div className="ml-4 flex rounded-[var(--theme-radius-lg)] border border-[var(--theme-outline-variant)] bg-[var(--theme-background)] p-1.5">
          <button
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'grid' ? 'bg-[var(--theme-primary-container)] text-[var(--theme-text)] shadow' : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'
            }`}
            onClick={() => onViewModeChange('grid')}
          >
            Grid {viewMode === 'list' && <span className="ml-1 text-[10px] opacity-50">(X)</span>}
          </button>
          <button
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'list' ? 'bg-[var(--theme-primary-container)] text-[var(--theme-text)] shadow' : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'
            }`}
            onClick={() => onViewModeChange('list')}
          >
            List {viewMode === 'grid' && <span className="ml-1 text-[10px] opacity-50">(X)</span>}
          </button>
          </div>

          <button
            onClick={onOpenSettings}
            className="ml-2 flex h-11 w-11 items-center justify-center rounded-[var(--theme-radius-xl)] border border-[var(--theme-outline-variant)] bg-[var(--theme-surface)] text-[var(--theme-text-muted)] transition-colors hover:bg-[var(--theme-primary-container)] hover:text-[var(--theme-text)]"
            title="Settings"
          >
            <span>⚙️</span>
          </button>

          <button
            onClick={onExit}
            className="ml-1 flex h-11 w-11 items-center justify-center rounded-[var(--theme-radius-xl)] border border-[var(--theme-tertiary)] bg-[var(--theme-surface)] text-[var(--theme-tertiary)] transition-colors hover:bg-[var(--theme-tertiary)] hover:text-[var(--theme-background)]"
            title="Exit Application"
          >
            ⏻
          </button>
        </div>
        </div>

        <div className="mt-5 flex items-center gap-3 overflow-hidden">
        <div className="shrink-0 text-[10px] font-black uppercase tracking-[0.22em] text-[var(--theme-text-muted)]">Genre</div>
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
                    ? 'border-[var(--theme-primary)] bg-[var(--theme-primary-container)] text-[var(--theme-primary)]'
                    : 'border-[var(--theme-outline-variant)] bg-[var(--theme-surface)] text-[var(--theme-text-muted)] hover:border-[var(--theme-outline)] hover:text-[var(--theme-text)]'
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
          <div className="shrink-0 text-[10px] font-black uppercase tracking-[0.22em] text-[var(--theme-text-muted)]">Sub-Genre</div>
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
                      ? 'border-[var(--theme-primary)] bg-[var(--theme-primary-container)] text-[var(--theme-primary)]'
                      : 'border-[var(--theme-outline-variant)] bg-[var(--theme-surface)] text-[var(--theme-text-muted)] hover:border-[var(--theme-outline)] hover:text-[var(--theme-text)]'
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
                className="rounded-[var(--theme-radius-md)] border border-[var(--theme-primary)] bg-[var(--theme-primary-container)] px-4 py-1.5 text-xs font-bold text-[var(--theme-primary)] transition-all hover:bg-[var(--theme-surface)]"
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
