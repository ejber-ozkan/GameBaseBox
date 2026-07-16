import { useTheme } from '../../contexts/ThemeContext';
import type { ContentNavProps } from './types';

interface AboutSettingsTabProps extends ContentNavProps {
  onOpenTigerHeli?: () => void | Promise<void>;
}

export function AboutSettingsTab({
  isMouseMode,
  onMouseFocus,
  isFocused,
  onOpenTigerHeli,
}: AboutSettingsTabProps) {
  const { theme } = useTheme();

  return (
    <div className="flex flex-col gap-6">
      <div className={`p-6 ${theme.effects.steppedBorders ? 'border-2' : 'rounded-theme-xl border'} border-theme-outline-variant bg-theme-surface/30`}>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-theme-text">GBBox</h3>
        <p className="mb-4 text-sm text-theme-text-muted">
          GameBase Box is a local-first launcher for GameBase-style libraries, with imports for Commodore 64,
          Atari 800, Atari 2600, ZX Spectrum, Acorn BBC Micro, and Commodore Amiga.
        </p>

        <div className={`mb-4 p-4 ${theme.effects.steppedBorders ? 'border-2' : 'rounded-theme-xl border'} border-theme-primary/20 bg-theme-primary/5`}>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-theme-primary font-mono">Acknowledgement</h4>
          <p className="text-sm leading-relaxed text-theme-text-muted">
            GBBox began as a frontend for the GB64 Collection. Massive thanks to the GameBase64 project and the GB64
            Team for decades of preservation, documentation, and community work around Commodore 64 history.
          </p>
          <p className="mt-2 text-xs italic text-theme-text-muted font-mono">gb64.com ©1997-2022 The GB64 Team</p>
        </div>

        <div className={`mb-4 p-4 ${theme.effects.steppedBorders ? 'border-2' : 'rounded-theme-xl border'} border-theme-secondary/20 bg-theme-secondary/5`}>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-theme-secondary font-mono">Project Credits</h4>
          <p className="text-sm text-theme-text-muted">
            AI Wrangler &amp; Manipulator: <span className="font-semibold text-theme-text">Ejber Ozkan</span>
          </p>
          <p className="mt-2 text-sm text-theme-text-muted">My game is here too!</p>
          <button
            type="button"
            onClick={() => void onOpenTigerHeli?.()}
            onMouseEnter={() => isMouseMode && onMouseFocus(2)}
            className={`focus-idx-2 mt-3 inline-flex items-center px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              theme.effects.steppedBorders ? 'border-2' : 'rounded-theme-lg border'
            } ${
              isFocused(2)
                ? 'border-emerald-400 bg-emerald-500/15 text-emerald-100'
                : 'border-emerald-500/20 text-emerald-300 hover:text-emerald-200'
            }`}
          >
            Open Tiger Heli →
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-theme-text-muted font-mono">Open Source License</h4>
            <p className="mb-2 text-xs leading-relaxed text-theme-text-muted">
              This project is free software: you can redistribute it and/or modify it under the terms of the GNU
              General Public License as published by the Free Software Foundation, either version 3 of the License, or
              (at your option) any later version.
            </p>
            <a
              href="https://github.com/ejber-ozkan/GameBaseBox"
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => isMouseMode && onMouseFocus(0)}
              className={`focus-idx-0 inline-flex items-center px-3 py-2 text-xs font-mono transition-colors ${
                theme.effects.steppedBorders ? 'border-2' : 'rounded-theme-lg border'
              } ${
                isFocused(0)
                  ? 'border-theme-primary bg-theme-primary/20 text-theme-primary'
                  : 'border-theme-primary/20 text-theme-primary hover:text-theme-primary/80'
              }`}
            >
              View Source Code on GitHub →
            </a>
          </div>
        </div>
      </div>

      <div className={`p-6 ${theme.effects.steppedBorders ? 'border-2' : 'rounded-theme-xl border'} border-theme-outline-variant bg-theme-surface/30`}>
        <h3 className="mb-4 flex items-center gap-2 font-bold text-theme-text">Third-Party Credits</h3>
        <div className="mb-6 flex flex-wrap gap-3">
          <a
            href="https://gb64.com/"
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => isMouseMode && onMouseFocus(1)}
            className={`focus-idx-1 inline-flex items-center px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              theme.effects.steppedBorders ? 'border-2' : 'rounded-theme-lg border'
            } ${
              isFocused(1)
                ? 'border-theme-primary bg-theme-primary/20 text-theme-primary'
                : 'border-theme-primary/20 text-theme-primary hover:text-theme-primary/80'
            }`}
          >
            Visit GB64 →
          </a>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-theme-primary font-mono">Emulation Engine</h4>
            <div className="text-xs text-theme-text-muted">
              <p className="font-bold">EmulatorJS & VICE</p>
              <p className="mt-1 italic text-theme-text-muted">Licensed under GNU GPLv3 / GPLv2+</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-theme-primary font-mono">Metadata & Media</h4>
            <div className="text-xs text-theme-text-muted">
              <p className="font-bold">GB64 / GameBase64</p>
              <p className="mt-1 italic text-theme-text-muted">Historical C64 preservation, metadata, and documentation</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-theme-primary font-mono">Media Scraping</h4>
            <div className="text-xs text-theme-text-muted">
              <p className="font-bold">EmuMovies</p>
              <p className="mt-1 italic text-theme-text-muted">Video snaps & high-quality assets</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-theme-primary font-mono">Interface</h4>
            <div className="text-xs text-theme-text-muted">
              <p className="font-bold">React, Next.js, Tauri</p>
              <p className="mt-1 italic text-theme-text-muted">Modern desktop app technologies</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
