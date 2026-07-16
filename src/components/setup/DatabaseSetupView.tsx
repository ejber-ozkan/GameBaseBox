"use client";

import { useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { PlatformFolderSettings } from '@/types/platform';

type RequiredPlatformFolderKey = keyof Pick<
  PlatformFolderSettings,
  'gamesPath' | 'musicPath' | 'photosPath' | 'screenshotsPath' | 'extrasPath'
>;

interface DatabaseSetupViewProps {
  dbPath: string;
  error: string | null;
  importProgress?: { percent: number; stage: string } | null;
  importResult: string | null;
  isImporting: boolean;
  mdbPath: string;
  platformName?: string;
  platformAliases?: string[];
  selectedPlatformId?: string;
  platformOptions?: Array<{
    id: string;
    displayName: string;
    importStatus: string;
  }>;
  folderSettings?: PlatformFolderSettings;
  requiredFolderKeys?: RequiredPlatformFolderKey[];
  onBrowse: () => void;
  onCancelImport?: () => void;
  onPlatformSelect?: (platformId: string) => void;
  onBrowseFolder?: (folderKey: RequiredPlatformFolderKey) => void;
  onFolderChange?: (folderKey: RequiredPlatformFolderKey, value: string) => void;
  onImport: () => void;
}

const folderLabels = {
  gamesPath: 'Games',
  musicPath: 'Music',
  photosPath: 'Musician Photos',
  screenshotsPath: 'Screenshots',
  extrasPath: 'Extras',
} as const;

function getThemeIdForPlatform(platformId?: string): string {
  if (!platformId) return 'arcade-void';
  switch (platformId) {
    case 'c64':
    case 'vic20':
      return 'c64-edition';
    case 'atari800':
    case 'atari2600':
    case 'atarist':
      return 'cyberpunk-crt';
    case 'zxspectrum':
    case 'bbcmicro':
    case 'amiga':
    default:
      return 'arcade-void';
  }
}

export function DatabaseSetupView({
  dbPath,
  error,
  importProgress,
  importResult,
  isImporting,
  mdbPath,
  platformName = 'GameBase64',
  platformAliases = [],
  selectedPlatformId,
  platformOptions = [],
  folderSettings,
  requiredFolderKeys = [],
  onBrowse,
  onCancelImport,
  onPlatformSelect,
  onBrowseFolder,
  onFolderChange,
  onImport,
}: DatabaseSetupViewProps) {
  const { settings } = useSettings();
  const { theme, setTheme } = useTheme();

  // Temporarily apply the selected platform's theme on mount/dropdown change, and restore on unmount.
  useEffect(() => {
    const setupThemeId = getThemeIdForPlatform(selectedPlatformId);
    setTheme(setupThemeId, false);

    return () => {
      const globalThemeId = settings.themeId || 'arcade-void';
      setTheme(globalThemeId, false);
    };
  }, [selectedPlatformId, setTheme, settings.themeId]);

  const hasRequiredFolders = requiredFolderKeys.length > 0 && folderSettings;
  const showPlatformPicker = platformOptions.length > 1 && selectedPlatformId && onPlatformSelect;

  return (
    <main className="min-h-screen bg-theme-background px-6 py-10 text-theme-text font-sans transition-colors duration-250 flex items-center justify-center">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl w-full items-center justify-center">
        <div 
          className={`w-full max-w-4xl p-8 md:p-12 transition-all duration-250 ${
            theme.effects.steppedBorders ? 'border-4 border-theme-outline rounded-theme-xl' :
            theme.id === 'cyberpunk-crt' ? 'border-2 border-theme-primary rounded-theme-xl' :
            'theme-panel rounded-theme-xl shadow-[0_35px_120px_rgba(0,0,0,0.5)]'
          }`}
          style={{
            backgroundColor: theme.id === 'c64-edition' ? theme.colors.primaryContainer : undefined,
            boxShadow: theme.id === 'cyberpunk-crt' ? `0 0 30px ${theme.colors.primary}33, inset 0 0 15px ${theme.colors.primary}15` : undefined
          }}
        >
          {theme.id === 'c64-edition' && (
            <div className="mb-6 font-mono text-xs text-theme-primary text-center uppercase leading-5 border-b border-theme-outline pb-6">
              <div>**** COMMODORE 64 BASIC V2 ****</div>
              <div>64K RAM SYSTEM  38911 BASIC BYTES FREE</div>
              <div className="mt-2 theme-cursor-blink text-theme-secondary">READY.</div>
            </div>
          )}

          <div className="mb-10">
            <div className="mb-4 text-[12px] font-black uppercase tracking-[0.34em] text-theme-primary">
              First Run Setup
            </div>
            <h1 
              className="text-4xl font-black tracking-tight text-theme-text md:text-5xl"
              style={{
                textShadow: theme.id === 'cyberpunk-crt' ? `0 0 8px ${theme.colors.primary}cc` : undefined
              }}
            >
              Build Your {platformName} Database
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-theme-text-muted">
              GBBox needs the original <span className="font-bold text-theme-primary">{platformName}</span>{' '}
              MDB file to build the local SQLite database for search, filters, favorites, and BigBox browsing.
              {platformAliases.length > 0 ? (
                <>
                  {' '}
                  This importer supports {platformAliases.join(' and ')} GameBase databases for this platform.
                </>
              ) : null}
            </p>
            {showPlatformPicker ? (
              <label className="mt-6 block max-w-sm">
                <span className="text-[11px] font-black uppercase tracking-[0.24em] text-theme-primary">
                  GameBase
                </span>
                <select
                  value={selectedPlatformId}
                  onChange={(event) => onPlatformSelect(event.target.value)}
                  disabled={isImporting}
                  className="mt-2 w-full bg-theme-surface/50 border border-theme-outline/30 px-4 py-3 text-sm font-bold text-theme-text outline-none transition-all focus:border-theme-primary rounded-theme-md disabled:cursor-not-allowed disabled:opacity-45"
                  style={{
                    backgroundColor: theme.id === 'c64-edition' ? theme.colors.primaryContainer : undefined,
                    borderWidth: theme.effects.steppedBorders ? '2px' : '1px'
                  }}
                >
                  {platformOptions.map((platform) => (
                    <option key={platform.id} value={platform.id} className="bg-theme-surface text-theme-text">
                      {platform.displayName}
                      {platform.importStatus === 'imported' ? ' (imported)' : ''}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.9fr]">
            <section 
              className="p-6 border border-theme-outline/20 bg-theme-surface/10 rounded-theme-lg"
              style={{
                borderWidth: theme.effects.steppedBorders ? '2px' : '1px'
              }}
            >
              <div className="mb-4 text-[11px] font-black uppercase tracking-[0.24em] text-theme-primary">
                Source File
              </div>
              <div className="border border-theme-outline/20 bg-theme-surface/30 p-4 rounded-theme-md">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-theme-text-muted">Selected MDB</div>
                <div className="mt-2 break-all text-sm leading-7 text-theme-text font-bold">
                  {mdbPath || 'No MDB selected yet'}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onBrowse}
                  disabled={isImporting}
                  className="rounded-theme-md border border-theme-primary bg-theme-primary/10 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-theme-primary transition-all hover:bg-theme-primary/20 disabled:cursor-not-allowed disabled:opacity-45"
                  style={{
                    borderWidth: theme.effects.steppedBorders ? '2px' : '1px'
                  }}
                >
                  Choose MDB
                </button>
                <button
                  type="button"
                  onClick={onImport}
                  disabled={isImporting || !mdbPath}
                  className="rounded-theme-md border border-theme-secondary bg-theme-secondary/20 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-theme-text transition-all hover:bg-theme-secondary/30 disabled:cursor-not-allowed disabled:opacity-45"
                  style={{
                    borderWidth: theme.effects.steppedBorders ? '2px' : '1px',
                    borderColor: theme.colors.secondary
                  }}
                >
                  {isImporting ? 'Importing…' : 'Build Database'}
                </button>
                {isImporting && onCancelImport ? (
                  <button
                    type="button"
                    onClick={onCancelImport}
                    className="rounded-theme-md border border-theme-tertiary bg-theme-tertiary/10 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-theme-tertiary transition-all hover:bg-theme-tertiary/20"
                    style={{
                      borderWidth: theme.effects.steppedBorders ? '2px' : '1px',
                      borderColor: theme.colors.tertiary
                    }}
                  >
                    Cancel Import
                  </button>
                ) : null}
              </div>

              {isImporting && importProgress ? (
                <div className="mt-5 rounded-theme-md border border-theme-primary/20 bg-theme-primary/10 p-4 text-sm text-theme-text">
                  <div className="flex items-center justify-between gap-4 font-bold">
                    <span className={theme.effects.blinkingCursor ? 'theme-cursor-blink' : ''}>
                      {importProgress.stage}
                    </span>
                    <span>{importProgress.percent}%</span>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-theme-sm bg-black/40 border border-theme-outline/20">
                    <div 
                      className="h-full bg-theme-primary transition-all duration-300" 
                      style={{ 
                        width: `${importProgress.percent}%`,
                        boxShadow: theme.id === 'cyberpunk-crt' ? `0 0 10px ${theme.colors.primary}` : undefined
                      }} 
                    />
                  </div>
                  <p className="mt-3 text-xs leading-6 text-theme-text-muted">Cancellation is applied safely before the database merge.</p>
                </div>
              ) : null}

              {hasRequiredFolders ? (
                <div className="mt-7 space-y-4">
                  <div className="text-[11px] font-black uppercase tracking-[0.24em] text-theme-primary">
                    Platform Folders
                  </div>
                  {requiredFolderKeys.map((folderKey) => (
                    <label key={folderKey} className="block">
                      <span className="text-xs font-black uppercase tracking-[0.18em] text-theme-text-muted">
                        {folderLabels[folderKey]}
                      </span>
                      <div className="mt-2 flex gap-3">
                        <input
                          type="text"
                          value={folderSettings[folderKey]}
                          onChange={(event) => onFolderChange?.(folderKey, event.target.value)}
                          disabled={isImporting}
                          className="min-w-0 flex-1 rounded-theme-md border border-theme-outline/20 bg-theme-surface/30 px-4 py-3 text-sm text-theme-text outline-none transition-all placeholder:text-theme-text-muted/40 focus:border-theme-primary disabled:cursor-not-allowed disabled:opacity-45"
                          placeholder={`Select ${folderLabels[folderKey]} folder`}
                          style={{
                            borderWidth: theme.effects.steppedBorders ? '2px' : '1px'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => onBrowseFolder?.(folderKey)}
                          disabled={isImporting || !onBrowseFolder}
                          className="rounded-theme-md border border-theme-outline/30 bg-theme-surface/50 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-theme-text transition-all hover:bg-theme-primary/10 disabled:cursor-not-allowed disabled:opacity-45"
                          style={{
                            borderWidth: theme.effects.steppedBorders ? '2px' : '1px'
                          }}
                        >
                          Browse
                        </button>
                      </div>
                    </label>
                  ))}
                </div>
              ) : null}

              {error ? (
                <div className="mt-5 rounded-theme-md border border-theme-tertiary/30 bg-theme-tertiary/10 p-4 text-sm leading-7 text-theme-tertiary">
                  {error}
                </div>
              ) : null}

              {importResult ? (
                <div className="mt-5 rounded-theme-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm leading-7 text-emerald-400">
                  {importResult}
                </div>
              ) : null}
            </section>

            <section 
              className="p-6 border border-theme-outline/20 bg-theme-surface/10 rounded-theme-lg flex flex-col justify-between"
              style={{
                borderWidth: theme.effects.steppedBorders ? '2px' : '1px'
              }}
            >
              <div>
                <div className="mb-4 text-[11px] font-black uppercase tracking-[0.24em] text-theme-primary">
                  What Happens
                </div>
                <ol className="space-y-4 text-sm leading-7 text-theme-text-muted">
                  <li>1. GBBox exports the MDB tables to CSV on this machine.</li>
                  <li>2. The app imports those CSVs into a local optimized SQLite database.</li>
                  <li>3. Search indexes, cover lookup, and support tables are created automatically.</li>
                  <li>4. The normal library UI starts once the database is ready.</li>
                </ol>
              </div>

              <div className="mt-6 border border-theme-outline/20 bg-theme-surface/30 p-4 rounded-theme-md">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-theme-text-muted">Target SQLite Path</div>
                <div className="mt-2 break-all text-sm leading-7 text-theme-text font-bold">{dbPath}</div>
              </div>

              <p className="mt-6 text-sm leading-7 text-theme-text-muted/60">
                If export fails, install the Microsoft Access Database Engine and try again.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
