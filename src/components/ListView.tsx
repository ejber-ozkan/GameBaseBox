import { Game } from '../types/game';
import { useEffect, useRef } from 'react';
import { getThemeListPresentation } from '../themes/list-presentations';

interface ListViewProps {
  games: Game[];
  onSelectGame: (game: Game) => void;
  onSort: (column: keyof Game) => void;
  focusedIndex?: number;
  onFocusChange?: (index: number) => void;
  isFavorite?: (gameId: string) => boolean;
  onEndReached?: () => void | Promise<void>;
  activePlatformName?: string;
  totalGameCount?: number;
  favoriteCount?: number;
  themeId?: string;
}

function formatCount(count?: number) {
  return count === undefined ? 'NOT_AVAILABLE' : count.toLocaleString();
}

export function ListView({
  games,
  onSelectGame,
  onSort,
  focusedIndex = -1,
  onFocusChange,
  isFavorite,
  onEndReached,
  activePlatformName = 'CURRENT_PLATFORM',
  totalGameCount,
  favoriteCount,
  themeId: providedThemeId,
}: ListViewProps) {
  const tbodyRef = useRef<HTMLTableSectionElement>(null);
  const endSentinelRef = useRef<HTMLTableRowElement>(null);
  const themeId = providedThemeId ?? (typeof document === 'undefined' ? 'arcade-void' : document.documentElement.dataset.theme || 'arcade-void');
  const presentation = getThemeListPresentation(themeId);
  const isArcadeVoid = presentation.layout === 'arcade-dashboard';
  const isC64 = presentation.layout === 'c64-workspace';
  const isCyberpunk = presentation.layout === 'cyberpunk-terminal';

  useEffect(() => {
    if (focusedIndex >= 0 && tbodyRef.current) {
      const child = tbodyRef.current.children[focusedIndex] as HTMLElement;
      child?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [focusedIndex]);

  useEffect(() => {
    if (!onEndReached || !endSentinelRef.current || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void onEndReached();
    }, { rootMargin: '400px 0px' });
    observer.observe(endSentinelRef.current);
    return () => observer.disconnect();
  }, [onEndReached]);

  const shellClass = isC64
    ? 'border-4 border-[var(--theme-outline-variant)] bg-[var(--theme-surface)] p-3'
    : isCyberpunk
      ? 'border border-[var(--theme-outline-variant)] bg-[var(--theme-surface)] shadow-[2px_2px_0_var(--theme-primary)]'
      : 'theme-panel rounded-[var(--theme-radius-xl)] p-4 shadow-2xl';
  const headerClass = isC64
    ? 'bg-[var(--theme-outline-variant)] text-[var(--theme-tertiary)] border-b-4 border-[var(--theme-outline-variant)]'
    : isCyberpunk
      ? 'bg-[var(--theme-outline-variant)] text-[var(--theme-primary)] border-b border-[var(--theme-primary)]'
      : 'bg-[var(--theme-surface)] text-[var(--theme-text-muted)] border-b border-[var(--theme-outline-variant)]';

  return (
    <section
      className="space-y-4"
      data-testid="theme-list-view"
      data-theme-presenter={presentation.id}
      data-list-presentation={presentation.layout}
    >
      {isArcadeVoid && (
        <div className="theme-panel grid gap-4 rounded-[var(--theme-radius-xl)] p-5 md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--theme-primary)]">ACTIVE PLATFORM</p>
            <p className="mt-1 text-2xl font-black text-[var(--theme-text)]">{activePlatformName}</p>
            <p className="mt-2 text-xs text-[var(--theme-text-muted)]">LEGENDARY CLASSICS · LIST INDEX</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-xs">
            <div><dt className="text-[var(--theme-text-muted)]">TOTAL ENTRIES</dt><dd className="text-lg text-[var(--theme-secondary)]">{formatCount(totalGameCount)}</dd></div>
            <div><dt className="text-[var(--theme-text-muted)]">FAVORITES</dt><dd className="text-lg text-[var(--theme-tertiary)]">{formatCount(favoriteCount)}</dd></div>
          </dl>
        </div>
      )}

      {isC64 && (
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="border-4 border-[var(--theme-outline-variant)] bg-[var(--theme-surface)] p-4">
            <p className="text-xs uppercase text-[var(--theme-text-muted)]">CURRENTLY VIEWING</p>
            <p className="theme-cursor-blink text-lg font-bold text-[var(--theme-primary)]">DATABASE_ROOT/GAMES/INDEX_A</p>
          </div>
          <div className="border-4 border-[var(--theme-outline-variant)] bg-[var(--theme-surface)] px-5 py-3 font-mono">
            <p className="text-xs uppercase text-[var(--theme-text-muted)]">TOTAL ENTRIES</p>
            <p className="text-2xl text-[var(--theme-text)]">{formatCount(totalGameCount)}</p>
          </div>
        </div>
      )}

      {isCyberpunk && (
        <div className="flex items-center justify-between border-b border-[var(--theme-outline-variant)] pb-2 font-mono text-[10px] uppercase tracking-widest">
          <span className="text-[var(--theme-secondary)]">PATH: ROOT / GAMES / ALL_ENTRIES</span>
          <span className="text-[var(--theme-text-muted)]">VIEW: LIST_DETAIL</span>
        </div>
      )}

      <div className={`overflow-x-auto ${shellClass}`}>
        <table className="min-w-[760px] w-full table-fixed text-left text-sm text-[var(--theme-text-muted)]">
          <thead className={`text-xs uppercase ${headerClass}`}>
            <tr>
              <th scope="col" className="w-14 px-3 py-3 text-center">#</th>
              <th scope="col" className="w-[32%] cursor-pointer px-3 py-3 hover:text-[var(--theme-text)]" onClick={() => onSort('name')}>Title</th>
              <th scope="col" className="w-20 cursor-pointer px-3 py-3 hover:text-[var(--theme-text)]" onClick={() => onSort('year')}>Year</th>
              <th scope="col" className="w-[20%] cursor-pointer px-3 py-3 hover:text-[var(--theme-text)]" onClick={() => onSort('publisher')}>Publisher</th>
              <th scope="col" className="w-[18%] cursor-pointer px-3 py-3 hover:text-[var(--theme-text)]" onClick={() => onSort('parentGenre')}>Genre</th>
              <th scope="col" className="w-[15%] px-3 py-3 text-right">System</th>
            </tr>
          </thead>
          <tbody ref={tbodyRef}>
            {games.map((game, index) => {
              const isFocused = focusedIndex === index;
              const favorited = isFavorite?.(game.id.toString()) ?? false;
              const systemName = activePlatformName;
              const rowClass = isFocused
                ? isCyberpunk
                  ? 'bg-[var(--theme-primary-container)] border-l-4 border-[var(--theme-primary)]'
                  : 'bg-[var(--theme-primary-container)] outline outline-2 outline-[var(--theme-primary)]'
                : 'hover:bg-[var(--theme-surface)]';
              return (
                <tr
                  key={`${game.id}-${index}`}
                  data-focused={isFocused}
                  onClick={() => onSelectGame(game)}
                  onMouseEnter={() => onFocusChange?.(index)}
                  style={{ contentVisibility: 'auto', containIntrinsicSize: '0 46px' }}
                  className={`cursor-pointer border-b border-[var(--theme-outline-variant)] transition-colors ${rowClass}`}
                >
                  <td className="px-3 py-3 text-center font-mono text-[var(--theme-secondary)]">{String(index + 1).padStart(4, '0')}</td>
                  <td className="px-3 py-3 font-medium text-[var(--theme-text)]">
                    <div className="flex min-w-0 items-center gap-2">
                      <span aria-label={favorited ? 'Favorite' : 'Not favorite'} className={favorited ? 'text-[var(--theme-tertiary)]' : 'text-[var(--theme-text-muted)]'}>{favorited ? '♥' : '♡'}</span>
                      <span className="truncate">{game.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono">{game.year || '-'}</td>
                  <td className="truncate px-3 py-3">{game.publisher?.name || '-'}</td>
                  <td className="px-3 py-3"><span className="inline-block truncate border border-[var(--theme-outline-variant)] px-2 py-0.5 text-xs">{game.parentGenre || '-'}</span></td>
                  <td className="truncate px-3 py-3 text-right font-mono text-xs text-[var(--theme-secondary)]">{systemName}</td>
                </tr>
              );
            })}
            {onEndReached && <tr ref={endSentinelRef} aria-hidden="true"><td colSpan={6} className="h-px p-0" /></tr>}
          </tbody>
        </table>
      </div>

      {isCyberpunk && (
        <aside className="border border-[var(--theme-outline-variant)] bg-[var(--theme-surface)] p-3 font-mono text-xs">
          <p className="border-b border-[var(--theme-primary)] pb-1 text-[var(--theme-primary)]">SYSTEM_DIAGNOSTICS</p>
          <dl className="mt-3 grid gap-2 sm:grid-cols-3">
            <div><dt className="text-[var(--theme-text-muted)]">TOTAL_ENTRIES</dt><dd className="text-[var(--theme-secondary)]">{formatCount(totalGameCount)}</dd></div>
            <div><dt className="text-[var(--theme-text-muted)]">FAVORITES</dt><dd className="text-[var(--theme-tertiary)]">{formatCount(favoriteCount)}</dd></div>
            <div><dt className="text-[var(--theme-text-muted)]">MEDIA_REFERENCE</dt><dd>NOT_AVAILABLE</dd></div>
          </dl>
        </aside>
      )}
    </section>
  );
}
