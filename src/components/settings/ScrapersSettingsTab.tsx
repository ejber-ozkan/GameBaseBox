import { useTheme } from '../../contexts/ThemeContext';
import type { EditableSettings, ContentNavProps } from './types';

interface ScrapersSettingsTabProps extends ContentNavProps {
  draft: EditableSettings;
  setField: <K extends keyof EditableSettings>(key: K, value: EditableSettings[K]) => void;
}

export function ScrapersSettingsTab({
  draft,
  setField,
  isMouseMode,
  onMouseFocus,
  isFocused,
}: ScrapersSettingsTabProps) {
  const { theme } = useTheme();

  return (
    <div className="relative flex flex-col gap-6">
      <div className="absolute inset-0 z-50 flex items-center justify-center rounded-theme-xl bg-theme-background/60 p-10 text-center backdrop-blur-[2px]">
        <div className="rotate-[-2deg] transform rounded-theme-2xl border border-theme-primary/50 bg-theme-primary text-theme-surface px-8 py-4 shadow-2xl">
          <div className="mb-2 text-3xl">🚧</div>
          <div className="text-xl font-black uppercase tracking-[0.2em]">Coming Soon</div>
          <div className="mt-1 max-w-[200px] text-[10px] font-bold opacity-80">
            Secure hardware encryption for scraper credentials is in development.
          </div>
        </div>
      </div>

      <div className="pointer-events-none select-none opacity-30 blur-[1px]">
        <div className="flex flex-col gap-6">
          <div className="rounded-theme-lg border border-theme-primary/30 bg-theme-primary/10 p-4 text-sm text-theme-primary">
            <strong>Art & Info Scraper Configuration</strong>
            <br />
            Select your preferred active scraper and provide credentials below. The active scraper will be used for
            one-click metadata and artwork discovery.
          </div>

          <div className="grid grid-cols-3 gap-3">
            {(['emumovies', 'screenscraper', 'thegamesdb'] as const).map((scraper, idx) => (
              <button
                key={scraper}
                onClick={() => setField('activeScraper', scraper)}
                onMouseEnter={() => isMouseMode && onMouseFocus(idx)}
                className={`focus-idx-${idx} flex flex-col items-center gap-2 p-4 transition-all ${
                  theme.effects.steppedBorders ? 'border-2' : 'rounded-theme-xl border'
                } ${
                  (draft.activeScraper === scraper && ![0, 1, 2].some(isFocused)) || isFocused(idx)
                    ? 'scale-105 border-theme-primary bg-theme-primary text-theme-surface shadow-xl shadow-theme-primary/20'
                    : 'border-theme-outline-variant bg-theme-surface/30 text-theme-text-muted hover:text-theme-text'
                }`}
              >
                <span className="text-2xl">
                  {scraper === 'emumovies' ? '🎬' : scraper === 'screenscraper' ? '🌐' : '👾'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
                  {scraper === 'emumovies' ? 'EmuMovies' : scraper === 'screenscraper' ? 'ScreenScraper' : 'TheGamesDB'}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-8">
            <div
              className={`p-6 transition-all ${
                theme.effects.steppedBorders ? 'border-2' : 'rounded-theme-2xl border'
              } ${
                draft.activeScraper === 'emumovies'
                  ? 'border-theme-primary bg-theme-surface'
                  : 'border-theme-outline-variant bg-theme-surface/10 opacity-60'
              }`}
            >
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-theme-text">
                <span>🎬</span> EmuMovies Credentials
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-theme-text-muted">Username</label>
                  <input
                    type="text"
                    className={`focus-idx-3 w-full bg-theme-background px-3 py-2 font-mono text-xs text-theme-text transition-colors focus:outline-none ${
                      theme.effects.steppedBorders ? 'border-2' : 'rounded border'
                    } ${
                      isFocused(3) ? 'border-theme-primary ring-1 ring-theme-primary/50' : 'border-theme-outline-variant'
                    }`}
                    value={draft.emuMoviesUsername}
                    onChange={(event) => setField('emuMoviesUsername', event.target.value)}
                    onMouseEnter={() => isMouseMode && onMouseFocus(3)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-theme-text-muted">Password</label>
                  <input
                    type="password"
                    className={`focus-idx-4 w-full bg-theme-background px-3 py-2 font-mono text-xs text-theme-text transition-colors focus:outline-none ${
                      theme.effects.steppedBorders ? 'border-2' : 'rounded border'
                    } ${
                      isFocused(4) ? 'border-theme-primary ring-1 ring-theme-primary/50' : 'border-theme-outline-variant'
                    }`}
                    value={draft.emuMoviesPassword}
                    onChange={(event) => setField('emuMoviesPassword', event.target.value)}
                    onMouseEnter={() => isMouseMode && onMouseFocus(4)}
                  />
                </div>
              </div>
            </div>

            <div
              className={`p-6 transition-all ${
                theme.effects.steppedBorders ? 'border-2' : 'rounded-theme-2xl border'
              } ${
                draft.activeScraper === 'screenscraper'
                  ? 'border-theme-primary bg-theme-surface'
                  : 'border-theme-outline-variant bg-theme-surface/10 opacity-60'
              }`}
            >
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-theme-text">
                <span>🌐</span> ScreenScraper.fr Credentials
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-theme-text-muted">Username</label>
                  <input
                    type="text"
                    className={`focus-idx-5 w-full bg-theme-background px-3 py-2 font-mono text-xs text-theme-text transition-colors focus:outline-none ${
                      theme.effects.steppedBorders ? 'border-2' : 'rounded border'
                    } ${
                      isFocused(5) ? 'border-theme-primary ring-1 ring-theme-primary/50' : 'border-theme-outline-variant'
                    }`}
                    value={draft.screenScraperUsername}
                    onChange={(event) => setField('screenScraperUsername', event.target.value)}
                    onMouseEnter={() => isMouseMode && onMouseFocus(5)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-theme-text-muted">Password</label>
                  <input
                    type="password"
                    className={`focus-idx-6 w-full bg-theme-background px-3 py-2 font-mono text-xs text-theme-text transition-colors focus:outline-none ${
                      theme.effects.steppedBorders ? 'border-2' : 'rounded border'
                    } ${
                      isFocused(6) ? 'border-theme-primary ring-1 ring-theme-primary/50' : 'border-theme-outline-variant'
                    }`}
                    value={draft.screenScraperPassword}
                    onChange={(event) => setField('screenScraperPassword', event.target.value)}
                    onMouseEnter={() => isMouseMode && onMouseFocus(6)}
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-theme-outline-variant pt-4">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-theme-text-muted">
                    Developer ID (Optional)
                  </label>
                  <input
                    type="text"
                    className={`focus-idx-7 w-full bg-theme-background px-3 py-2 font-mono text-xs text-theme-text transition-colors focus:outline-none ${
                      theme.effects.steppedBorders ? 'border-2' : 'rounded border'
                    } ${
                      isFocused(7) ? 'border-theme-primary ring-1 ring-theme-primary/50' : 'border-theme-outline-variant'
                    }`}
                    value={draft.screenScraperDevId}
                    onChange={(event) => setField('screenScraperDevId', event.target.value)}
                    placeholder="e.g. skraper"
                    onMouseEnter={() => isMouseMode && onMouseFocus(7)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-theme-text-muted">Developer Password</label>
                  <input
                    type="password"
                    className={`focus-idx-8 w-full bg-theme-background px-3 py-2 font-mono text-xs text-theme-text transition-colors focus:outline-none ${
                      theme.effects.steppedBorders ? 'border-2' : 'rounded border'
                    } ${
                      isFocused(8) ? 'border-theme-primary ring-1 ring-theme-primary/50' : 'border-theme-outline-variant'
                    }`}
                    value={draft.screenScraperDevPassword}
                    onChange={(event) => setField('screenScraperDevPassword', event.target.value)}
                    placeholder="e.g. skraperpw"
                    onMouseEnter={() => isMouseMode && onMouseFocus(8)}
                  />
                </div>
              </div>
              <p className="mt-3 text-[10px] italic text-theme-text-muted font-mono">
                Note: If developer credentials are left blank, communal ones (Skraper/Recalbox) will be used.
              </p>
            </div>

            <div
              className={`p-6 transition-all ${
                theme.effects.steppedBorders ? 'border-2' : 'rounded-theme-2xl border'
              } ${
                draft.activeScraper === 'thegamesdb'
                  ? 'border-theme-primary bg-theme-surface'
                  : 'border-theme-outline-variant bg-theme-surface/10 opacity-60'
              }`}
            >
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-theme-text">
                <span>👾</span> TheGamesDB API Key
              </h3>
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-theme-text-muted">Private API Key</label>
                <input
                  type="password"
                  className={`focus-idx-9 w-full bg-theme-background px-3 py-2 font-mono text-xs text-theme-text transition-colors focus:outline-none ${
                    theme.effects.steppedBorders ? 'border-2' : 'rounded border'
                  } ${
                    isFocused(9) ? 'border-theme-primary ring-1 ring-theme-primary/50' : 'border-theme-outline-variant'
                  }`}
                  value={draft.theGamesDbApiKey}
                  onChange={(event) => setField('theGamesDbApiKey', event.target.value)}
                  placeholder="Enter your gamesdb.net API key"
                  onMouseEnter={() => isMouseMode && onMouseFocus(9)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

