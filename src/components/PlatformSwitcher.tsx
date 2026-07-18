"use client";

import { SUPPORTED_PLATFORMS } from '../lib/platform-capabilities';
import type { PlatformId } from '../types/platform';

interface PlatformSwitcherProps {
  activePlatformId: PlatformId;
  isFocused?: boolean;
  label?: string;
  onFocus?: () => void;
  onMouseEnter?: () => void;
  onPlatformSelect: (platformId: PlatformId) => void;
}

export function PlatformSwitcher({
  activePlatformId,
  isFocused = false,
  label = 'Active Platform',
  onFocus,
  onMouseEnter,
  onPlatformSelect,
}: PlatformSwitcherProps) {
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
        {SUPPORTED_PLATFORMS.map((platform) => (
          <option key={platform.id} value={platform.id} className="bg-[var(--theme-background)] text-[var(--theme-text)]">
            {platform.displayName}
          </option>
        ))}
      </select>
    </label>
  );
}
