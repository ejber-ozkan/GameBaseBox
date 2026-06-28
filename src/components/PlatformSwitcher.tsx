"use client";

import { SUPPORTED_PLATFORMS } from '../lib/platform-capabilities';
import type { PlatformId } from '../types/platform';

interface PlatformSwitcherProps {
  activePlatformId: PlatformId;
  onPlatformSelect: (platformId: PlatformId) => void;
}

export function PlatformSwitcher({ activePlatformId, onPlatformSelect }: PlatformSwitcherProps) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-cyan-300/25 bg-cyan-400/10 px-4 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.08)]">
      <span className="text-cyan-200/65">Active Platform</span>
      <select
        aria-label="Active platform"
        className="min-w-36 cursor-pointer rounded-md border border-white/10 bg-slate-950/80 px-2 py-1 text-sm font-black tracking-normal text-white outline-none transition-colors hover:border-cyan-300/40 focus:border-cyan-300/60"
        value={activePlatformId}
        onChange={(event) => onPlatformSelect(event.target.value as PlatformId)}
      >
        {SUPPORTED_PLATFORMS.map((platform) => (
          <option key={platform.id} value={platform.id} className="bg-slate-950 text-white">
            {platform.displayName}
          </option>
        ))}
      </select>
    </label>
  );
}
