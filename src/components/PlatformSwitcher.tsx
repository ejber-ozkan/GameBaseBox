"use client";

import { useContext, useMemo } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import { SUPPORTED_PLATFORMS } from '../lib/platform-capabilities';
import type { PlatformId, PlatformSettings } from '../types/platform';

interface PlatformSwitcherProps {
  activePlatformId: PlatformId;
  isFocused?: boolean;
  label?: string;
  platformSettings?: Record<PlatformId, PlatformSettings>;
  onFocus?: () => void;
  onMouseEnter?: () => void;
  onPlatformSelect: (platformId: PlatformId) => void;
}

export function PlatformSwitcher({
  activePlatformId,
  isFocused = false,
  label = 'Active Platform',
  platformSettings: propPlatformSettings,
  onFocus,
  onMouseEnter,
  onPlatformSelect,
}: PlatformSwitcherProps) {
  const settingsContext = useContext(SettingsContext);
  const currentPlatformSettings = propPlatformSettings ?? settingsContext?.settings?.platformSettings;

  const { importedPlatforms, unimportedPlatforms } = useMemo(() => {
    const imported: typeof SUPPORTED_PLATFORMS = [];
    const unimported: typeof SUPPORTED_PLATFORMS = [];

    const isPlatformImported = (platformId: PlatformId) => {
      if (currentPlatformSettings && currentPlatformSettings[platformId]) {
        return currentPlatformSettings[platformId].library.importStatus === 'imported';
      }
      return platformId === 'c64';
    };

    for (const platform of SUPPORTED_PLATFORMS) {
      if (isPlatformImported(platform.id)) {
        imported.push(platform);
      } else {
        unimported.push(platform);
      }
    }

    return { importedPlatforms: imported, unimportedPlatforms: unimported };
  }, [currentPlatformSettings]);

  const isSelectedImported = useMemo(() => {
    if (currentPlatformSettings && currentPlatformSettings[activePlatformId]) {
      return currentPlatformSettings[activePlatformId].library.importStatus === 'imported';
    }
    return activePlatformId === 'c64';
  }, [currentPlatformSettings, activePlatformId]);

  return (
    <label
      className={`flex items-center gap-3 rounded-[var(--theme-radius-lg)] border px-4 py-2.5 text-xs font-black uppercase tracking-[0.16em] transition-all hover:border-[var(--theme-outline)] hover:bg-[var(--theme-primary-container)] ${
        isFocused
          ? 'z-10 scale-105 border-[var(--theme-primary)] bg-[var(--theme-primary-container)] text-[var(--theme-text)] shadow-[0_0_18px_var(--theme-primary)]'
          : 'border-[var(--theme-primary)] bg-[var(--theme-primary-container)] text-[var(--theme-primary)]'
      }`}
      data-testid="platform-switcher"
      onMouseEnter={onMouseEnter}
    >
      <span className="text-[var(--theme-primary)]">{label}</span>
      <select
        aria-label="Active platform"
        className="min-w-36 cursor-pointer rounded-[var(--theme-radius-sm)] border border-[var(--theme-outline-variant)] bg-[var(--theme-background)] px-2 py-1 text-sm font-black normal-case tracking-normal text-[var(--theme-text)] outline-none transition-colors hover:border-[var(--theme-primary)] focus:border-[var(--theme-primary)] focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]"
        value={activePlatformId}
        onChange={(event) => onPlatformSelect(event.target.value as PlatformId)}
        onFocus={onFocus}
      >
        {importedPlatforms.length > 0 && unimportedPlatforms.length > 0 ? (
          <>
            <optgroup label="Imported GameBases" className="bg-[var(--theme-background)] text-[var(--theme-text-muted)] font-bold">
              {importedPlatforms.map((platform) => (
                <option key={platform.id} value={platform.id} className="bg-[var(--theme-background)] text-[var(--theme-text)] font-semibold">
                  {platform.displayName}
                </option>
              ))}
            </optgroup>
            <optgroup label="Not Imported" className="bg-[var(--theme-background)] text-[var(--theme-text-muted)] font-bold">
              {unimportedPlatforms.map((platform) => (
                <option key={platform.id} value={platform.id} className="bg-[var(--theme-background)] text-[var(--theme-text)] font-semibold">
                  {platform.displayName} (Not Imported)
                </option>
              ))}
            </optgroup>
          </>
        ) : (
          [...importedPlatforms, ...unimportedPlatforms].map((platform) => (
            <option key={platform.id} value={platform.id} className="bg-[var(--theme-background)] text-[var(--theme-text)]">
              {platform.displayName}
              {isSelectedImported ? '' : ' (Not Imported)'}
            </option>
          ))
        )}
      </select>
    </label>
  );
}
