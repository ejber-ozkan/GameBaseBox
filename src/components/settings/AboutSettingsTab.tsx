import { useTheme } from '../../contexts/ThemeContext';
import type { ContentNavProps } from './types';
import packageJson from '../../../package.json';

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
  const appVersion = packageJson.version;

  return (
    <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left Column: Description & Credits */}
      <div className="flex flex-col gap-4">
        <div className={`p-5 ${theme.effects.steppedBorders ? 'border-2' : 'rounded-theme-xl border'} border-theme-outline-variant bg-theme-surface/30`}>
          <h3 className="mb-3 flex items-center gap-2 text-base font-black text-theme-text">GBBox v{appVersion}</h3>
          <p className="mb-3 text-[10px] text-theme-text-muted leading-relaxed">
            GameBase Box is a local-first launcher for GameBase-style libraries, with imports for Commodore 64,
            Atari 800, Atari 2600, ZX Spectrum, Acorn BBC Micro, and Commodore Amiga.
          </p>

          <div className={`mb-3 p-4 ${theme.effects.steppedBorders ? 'border-2' : 'rounded-theme-xl border'} border-theme-primary/20 bg-theme-primary/5`}>
            <h4 className="mb-1 text-[10px] font-bold uppercase tracking-widest text-theme-primary font-mono">Acknowledgement</h4>
            <p className="text-[10px] leading-relaxed text-theme-text-muted">
              GBBox began as a frontend for the GB64 Collection. Massive thanks to the GameBase64 project and the GB64
              Team for decades of preservation, documentation, and community work around Commodore 64 history.
            </p>
            <p className="mt-1 text-[9px] italic text-theme-text-muted font-mono">gb64.com ©1997-2022 The GB64 Team</p>
          </div>

          <div className={`p-4 ${theme.effects.steppedBorders ? 'border-2' : 'rounded-theme-xl border'} border-theme-secondary/20 bg-theme-secondary/5`}>
            <h4 className="mb-1 text-[10px] font-bold uppercase tracking-widest text-theme-secondary font-mono">Project Credits</h4>
            <p className="text-[10px] text-theme-text-muted leading-relaxed">
              AI Wrangler &amp; Manipulator: <span className="font-semibold text-theme-text">Ejber Ozkan</span>
            </p>
            <p className="mt-1 text-[10px] text-theme-text-muted">My game is here too!</p>
            <button
              type="button"
              onClick={() => void onOpenTigerHeli?.()}
              onMouseEnter={() => isMouseMode && onMouseFocus(2)}
              className={`focus-idx-2 mt-2 inline-flex items-center px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
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
        </div>

        <div>
          <h4 className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-theme-text-muted font-mono">Open Source</h4>
          <p className="mb-2 text-[9px] leading-relaxed text-theme-text-muted">
            This project is free software: licensed under the GNU General Public License v3 or later.
          </p>
          <a
            href="https://github.com/ejber-ozkan/GameBaseBox"
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => isMouseMode && onMouseFocus(0)}
            className={`focus-idx-0 inline-flex items-center px-3 py-1.5 text-[10px] font-mono transition-colors ${
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

      {/* Right Column: Third-Party Credits */}
      <div className={`flex flex-col gap-4 p-5 ${theme.effects.steppedBorders ? 'border-2' : 'rounded-theme-xl border'} border-theme-outline-variant bg-theme-surface/30`}>
        <h3 className="mb-2 flex items-center gap-2 font-bold text-theme-text text-sm">Third-Party Credits</h3>
        
        <div className="mb-3">
          <a
            href="https://gb64.com/"
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => isMouseMode && onMouseFocus(1)}
            className={`focus-idx-1 inline-flex items-center px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-theme-primary font-mono">Emulation Engine</h4>
            <div className="text-[10px] text-theme-text-muted leading-relaxed">
              <p className="font-bold">EmulatorJS & VICE</p>
              <p className="italic font-mono">GNU GPLv3 / GPLv2+</p>
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-theme-primary font-mono">Metadata & Media</h4>
            <div className="text-[10px] text-theme-text-muted leading-relaxed">
              <p className="font-bold">GB64 / GameBase64</p>
              <p className="italic font-mono">C64 historical preservation</p>
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-theme-primary font-mono">Media Scraping</h4>
            <div className="text-[10px] text-theme-text-muted leading-relaxed">
              <p className="font-bold">EmuMovies</p>
              <p className="italic font-mono">Video snaps & assets</p>
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-theme-primary font-mono">Video Playback</h4>
            <div className="text-[10px] text-theme-text-muted leading-relaxed">
              <p className="font-bold">video.js</p>
              <p className="italic font-mono">HTML5 player framework</p>
            </div>
          </div>

          <div className="space-y-1 col-span-1 sm:col-span-2">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-theme-primary font-mono">Frontend Interface</h4>
            <div className="text-[10px] text-theme-text-muted leading-relaxed">
              <p className="font-bold">React, Next.js, Tauri</p>
              <p className="italic font-mono">Modern cross-platform desktop</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
