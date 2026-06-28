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
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-white">GBBox</h3>
        <p className="mb-4 text-sm text-gray-300">
          GameBase Box is a local-first launcher for GameBase-style libraries, with imports for Commodore 64,
          Atari 800, and Atari 2600.
        </p>

        <div className="mb-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-300">Acknowledgement</h4>
          <p className="text-sm leading-relaxed text-gray-300">
            GBBox began as a frontend for the GB64 Collection. Massive thanks to the GameBase64 project and the GB64
            Team for decades of preservation, documentation, and community work around Commodore 64 history.
          </p>
          <p className="mt-2 text-xs italic text-gray-400">gb64.com ©1997-2022 The GB64 Team</p>
        </div>

        <div className="mb-4 rounded-xl border border-pink-500/20 bg-pink-500/5 p-4">
          <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-pink-300">Project Credits</h4>
          <p className="text-sm text-gray-300">
            AI Wrangler &amp; Manipulator: <span className="font-semibold text-white">Ejber Ozkan</span>
          </p>
          <p className="mt-2 text-sm text-gray-300">My game is here too!</p>
          <button
            type="button"
            onClick={() => void onOpenTigerHeli?.()}
            onMouseEnter={() => isMouseMode && onMouseFocus(2)}
            className={`focus-idx-2 mt-3 inline-flex items-center rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
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
            <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500">Open Source License</h4>
            <p className="mb-2 text-xs leading-relaxed text-gray-400">
              This project is free software: you can redistribute it and/or modify it under the terms of the GNU
              General Public License as published by the Free Software Foundation, either version 3 of the License, or
              (at your option) any later version.
            </p>
            <a
              href="https://github.com/ejber-ozkan/GameBaseBox"
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => isMouseMode && onMouseFocus(0)}
              className={`focus-idx-0 inline-flex items-center rounded-lg border px-3 py-2 text-xs font-mono transition-colors ${
                isFocused(0)
                  ? 'border-blue-500 bg-blue-600/20 text-blue-200'
                  : 'border-blue-500/20 text-blue-400 hover:text-blue-300'
              }`}
            >
              View Source Code on GitHub →
            </a>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="mb-4 flex items-center gap-2 font-bold text-white">Third-Party Credits</h3>
        <div className="mb-6 flex flex-wrap gap-3">
          <a
            href="https://gb64.com/"
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => isMouseMode && onMouseFocus(1)}
            className={`focus-idx-1 inline-flex items-center rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              isFocused(1)
                ? 'border-cyan-400 bg-cyan-500/15 text-cyan-100'
                : 'border-cyan-500/20 text-cyan-300 hover:text-cyan-200'
            }`}
          >
            Visit GB64 →
          </a>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-blue-400">Emulation Engine</h4>
            <div className="text-xs text-gray-300">
              <p className="font-bold">EmulatorJS & VICE</p>
              <p className="mt-1 italic text-gray-500">Licensed under GNU GPLv3 / GPLv2+</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-blue-400">Metadata & Media</h4>
            <div className="text-xs text-gray-300">
              <p className="font-bold">GB64 / GameBase64</p>
              <p className="mt-1 italic text-gray-500">Historical C64 preservation, metadata, and documentation</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-blue-400">Media Scraping</h4>
            <div className="text-xs text-gray-300">
              <p className="font-bold">EmuMovies</p>
              <p className="mt-1 italic text-gray-500">Video snaps & high-quality assets</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-blue-400">Interface</h4>
            <div className="text-xs text-gray-300">
              <p className="font-bold">React, Next.js, Tauri</p>
              <p className="mt-1 italic text-gray-500">Modern desktop app technologies</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
