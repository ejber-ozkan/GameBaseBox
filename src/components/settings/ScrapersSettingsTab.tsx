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
  return (
    <div className="relative flex flex-col gap-6">
      <div className="absolute inset-0 z-50 flex items-center justify-center rounded-xl bg-gray-900/40 p-10 text-center backdrop-blur-[2px]">
        <div className="rotate-[-2deg] transform rounded-2xl border border-blue-400/50 bg-blue-600/90 px-8 py-4 text-white shadow-2xl">
          <div className="mb-2 text-3xl">🚧</div>
          <div className="text-xl font-black uppercase tracking-[0.2em]">Coming Soon</div>
          <div className="mt-1 max-w-[200px] text-[10px] font-bold opacity-80">
            Secure hardware encryption for scraper credentials is in development.
          </div>
        </div>
      </div>

      <div className="pointer-events-none select-none opacity-30 blur-[1px]">
        <div className="flex flex-col gap-6">
          <div className="rounded-lg border border-blue-700/40 bg-blue-900/20 p-4 text-sm text-blue-200">
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
                className={`focus-idx-${idx} flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
                  (draft.activeScraper === scraper && ![0, 1, 2].some(isFocused)) || isFocused(idx)
                    ? 'scale-105 border-blue-400 bg-blue-600 text-white shadow-xl'
                    : 'border-gray-700 bg-gray-800 text-gray-500 hover:text-gray-300'
                }`}
              >
                <span className="text-2xl">
                  {scraper === 'emumovies' ? '🎬' : scraper === 'screenscraper' ? '🌐' : '👾'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {scraper === 'emumovies' ? 'EmuMovies' : scraper === 'screenscraper' ? 'ScreenScraper' : 'TheGamesDB'}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-8">
            <div
              className={`rounded-2xl border p-6 transition-all ${
                draft.activeScraper === 'emumovies'
                  ? 'border-blue-500 bg-gray-800'
                  : 'border-gray-800 bg-gray-900/40 opacity-60'
              }`}
            >
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white">
                <span>🎬</span> EmuMovies Credentials
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Username</label>
                  <input
                    type="text"
                    className={`focus-idx-3 w-full rounded border bg-gray-950 px-3 py-2 font-mono text-xs text-white transition-colors ${
                      isFocused(3) ? 'border-blue-500 ring-1 ring-blue-500/50' : 'border-gray-700'
                    }`}
                    value={draft.emuMoviesUsername}
                    onChange={(event) => setField('emuMoviesUsername', event.target.value)}
                    onMouseEnter={() => isMouseMode && onMouseFocus(3)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Password</label>
                  <input
                    type="password"
                    className={`focus-idx-4 w-full rounded border bg-gray-950 px-3 py-2 font-mono text-xs text-white transition-colors ${
                      isFocused(4) ? 'border-blue-500 ring-1 ring-blue-500/50' : 'border-gray-700'
                    }`}
                    value={draft.emuMoviesPassword}
                    onChange={(event) => setField('emuMoviesPassword', event.target.value)}
                    onMouseEnter={() => isMouseMode && onMouseFocus(4)}
                  />
                </div>
              </div>
            </div>

            <div
              className={`rounded-2xl border p-6 transition-all ${
                draft.activeScraper === 'screenscraper'
                  ? 'border-blue-500 bg-gray-800'
                  : 'border-gray-800 bg-gray-900/40 opacity-60'
              }`}
            >
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white">
                <span>🌐</span> ScreenScraper.fr Credentials
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Username</label>
                  <input
                    type="text"
                    className={`focus-idx-5 w-full rounded border bg-gray-950 px-3 py-2 font-mono text-xs text-white transition-colors ${
                      isFocused(5) ? 'border-blue-500 ring-1 ring-blue-500/50' : 'border-gray-700'
                    }`}
                    value={draft.screenScraperUsername}
                    onChange={(event) => setField('screenScraperUsername', event.target.value)}
                    onMouseEnter={() => isMouseMode && onMouseFocus(5)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Password</label>
                  <input
                    type="password"
                    className={`focus-idx-6 w-full rounded border bg-gray-950 px-3 py-2 font-mono text-xs text-white transition-colors ${
                      isFocused(6) ? 'border-blue-500 ring-1 ring-blue-500/50' : 'border-gray-700'
                    }`}
                    value={draft.screenScraperPassword}
                    onChange={(event) => setField('screenScraperPassword', event.target.value)}
                    onMouseEnter={() => isMouseMode && onMouseFocus(6)}
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-700/50 pt-4">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Developer ID (Optional)
                  </label>
                  <input
                    type="text"
                    className={`focus-idx-7 w-full rounded border bg-gray-950 px-3 py-2 font-mono text-xs text-white transition-colors ${
                      isFocused(7) ? 'border-blue-500 ring-1 ring-blue-500/50' : 'border-gray-700'
                    }`}
                    value={draft.screenScraperDevId}
                    onChange={(event) => setField('screenScraperDevId', event.target.value)}
                    placeholder="e.g. skraper"
                    onMouseEnter={() => isMouseMode && onMouseFocus(7)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Developer Password</label>
                  <input
                    type="password"
                    className={`focus-idx-8 w-full rounded border bg-gray-950 px-3 py-2 font-mono text-xs text-white transition-colors ${
                      isFocused(8) ? 'border-blue-500 ring-1 ring-blue-500/50' : 'border-gray-700'
                    }`}
                    value={draft.screenScraperDevPassword}
                    onChange={(event) => setField('screenScraperDevPassword', event.target.value)}
                    placeholder="e.g. skraperpw"
                    onMouseEnter={() => isMouseMode && onMouseFocus(8)}
                  />
                </div>
              </div>
              <p className="mt-3 text-[10px] italic text-gray-500">
                Note: If developer credentials are left blank, communal ones (Skraper/Recalbox) will be used.
              </p>
            </div>

            <div
              className={`rounded-2xl border p-6 transition-all ${
                draft.activeScraper === 'thegamesdb'
                  ? 'border-blue-500 bg-gray-800'
                  : 'border-gray-800 bg-gray-900/40 opacity-60'
              }`}
            >
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white">
                <span>👾</span> TheGamesDB API Key
              </h3>
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Private API Key</label>
                <input
                  type="password"
                  className={`focus-idx-9 w-full rounded border bg-gray-950 px-3 py-2 font-mono text-xs text-white transition-colors ${
                    isFocused(9) ? 'border-blue-500 ring-1 ring-blue-500/50' : 'border-gray-700'
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
