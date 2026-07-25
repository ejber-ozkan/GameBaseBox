"use client";

import { useState } from 'react';
import { launchEmulator } from '../../lib/tauri-bridge';
import { useSettings } from '../../contexts/SettingsContext';
import { Game } from '../../types/game';
import { WasmPlayer } from '../WasmPlayer';
import { DetailNavigationHook } from '../../hooks/useDetailNavigation';
import { buildLaunchRequest, buildPlatformAssetPath, getPlatformLaunchSettings } from '../../lib/platform-launch';
import { supportsEmbeddedEmulation } from '../../lib/platform-capabilities';
import { useTheme } from '../../contexts/ThemeContext';

export interface PlayLaunchTarget {
  label?: string;
  relativePath: string;
  source: 'extras' | 'roms';
}

interface PlayButtonProps {
  game: Game;
  launchTarget?: PlayLaunchTarget | null;
  nav?: DetailNavigationHook;
  compact?: boolean;
}

function RocketGlyph({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none">
      <path d="M14.6 4.8c2.9.3 4.6 2 4.9 4.9l-3.7 3.7-4.9-4.9 3.7-3.7Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.3 9.7 5.4 13.6c-.7.7-1.2 1.6-1.4 2.5l-.5 2.4 2.4-.5c.9-.2 1.8-.7 2.5-1.4l3.9-3.9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m8.1 15.9-2 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.1 6.9 17 10.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="15.6" cy="8.4" r="1.2" fill="currentColor" />
    </svg>
  );
}

function EmbeddedGlyph({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none">
      <rect x="4.2" y="6.2" width="15.6" height="10.8" rx="2.1" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10 19.1h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 17v2.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="m10.2 9.4 4.4 2.2-4.4 2.2V9.4Z" fill="currentColor" />
    </svg>
  );
}

export function PlayButton({ game, launchTarget, nav, compact = false }: PlayButtonProps) {
  const { markAsPlayed, settings } = useSettings();
  const { theme } = useTheme();
  const [status, setStatus] = useState<'idle' | 'launching' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [showWasm, setShowWasm] = useState(false);

  const romRelativePath = launchTarget?.relativePath || game.filename || game.gameFilename || '';
  const launchSource = launchTarget?.source ?? 'roms';
  const romPath = buildPlatformAssetPath(settings, launchSource, romRelativePath);
  const platformLaunchSettings = getPlatformLaunchSettings(settings);
  const canPlayEmbedded = supportsEmbeddedEmulation(settings.activePlatformId);

  const handlePlayNative = async () => {
    if (!platformLaunchSettings.emulatorPath) {
      setStatus('error');
      setMessage(`No emulator configured. Set your ${platformLaunchSettings.providerLabel} path in Settings.`);
      setTimeout(() => setStatus('idle'), 4000);
      return;
    }

    if (platformLaunchSettings.isRetroarch && !platformLaunchSettings.corePath) {
      setStatus('error');
      setMessage('RetroArch requires a Core (DLL/SO). Please select one in the platform paths settings.');
      setTimeout(() => setStatus('idle'), 6000);
      return;
    }

    if (!romRelativePath) {
      setStatus('error');
      setMessage('No ROM file linked to this game.');
      setTimeout(() => setStatus('idle'), 4000);
      return;
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('game-launch'));
    }

    setStatus('launching');
    try {
      const result = await launchEmulator(buildLaunchRequest(settings, launchSource, romRelativePath, game));

      if (result.success) {
        setStatus('success');
        setMessage(result.message);
        markAsPlayed(game.id.toString());
      } else {
        setStatus('error');
        setMessage(result.message);
      }
    } catch (err) {
      setStatus('error');
      setMessage(String(err));
    }
    setTimeout(() => setStatus('idle'), 4000);
  };

  const isArcade = theme.id === 'arcade-void';

  const nativeButtonStyles: Record<typeof status, string> = {
    idle:      isArcade
      ? 'border-theme-primary bg-theme-primary text-[#00363e] shadow-[0_0_15px_var(--theme-primary-muted)] hover:shadow-[0_0_25px_var(--theme-primary)] hover:scale-[1.02]'
      : 'border-theme-primary bg-theme-primary text-theme-surface shadow-[0_0_0_1px_var(--theme-primary-container)_inset] hover:brightness-110',
    launching: 'border-theme-outline-variant bg-theme-surface text-theme-text-muted cursor-not-allowed',
    success:   'border-emerald-300/60 bg-emerald-950/45 text-emerald-100',
    error:     'border-rose-400/55 bg-rose-950/45 text-rose-100',
  };

  const nativeIconStyles: Record<typeof status, string> = {
    idle: isArcade ? 'text-[#00363e]' : 'text-theme-surface',
    launching: 'text-theme-text-muted',
    success: 'text-emerald-100',
    error: 'text-rose-100',
  };

  const buttonLabel: Record<typeof status, string> = {
    idle:      'Launch Emulator',
    launching: 'Launching',
    success:   'Launched',
    error:     'Launch Failed',
  };

  const handlePlayWeb = () => {
    if (!canPlayEmbedded) {
      return;
    }

    if (!romRelativePath) {
      setStatus('error');
      setMessage('No ROM file linked to this game.');
      setTimeout(() => setStatus('idle'), 4000);
      return;
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('game-launch'));
    }

    markAsPlayed(game.id.toString());
    setShowWasm(true);
  };

  const buttonMinHeight = compact ? '56px' : '66px';
  const iconWrapClass = compact ? 'h-8 w-8' : 'h-9 w-9';
  const iconGlyphClass = compact ? 'h-[18px] w-[18px]' : 'h-5 w-5';
  const buttonPaddingClass = compact ? 'px-4 py-2.5' : 'px-5 py-3';
  const buttonGridClass = compact ? 'grid-cols-[32px_minmax(0,1fr)_auto]' : 'grid-cols-[36px_minmax(0,1fr)_auto]';
  const labelClass = compact
    ? 'text-[12px] uppercase tracking-[0.16em] leading-none'
    : 'text-[14px] uppercase tracking-[0.16em] leading-none';
  const sideLabelClass = compact
    ? 'shrink-0 text-right text-[9px] uppercase tracking-[0.18em] text-white/75'
    : 'shrink-0 text-right text-[10px] uppercase tracking-[0.18em] text-white/75';
  const webButtonClass = isArcade
    ? 'border-theme-primary bg-transparent text-theme-primary shadow-none hover:bg-theme-primary/10 hover:scale-[1.02]'
    : 'border-theme-primary/70 bg-theme-primary-container text-theme-primary shadow-[0_0_0_1px_var(--theme-primary-container)_inset] hover:border-theme-primary hover:brightness-110';
  const webIconClass = 'text-theme-primary';
  const nativeProviderLabel = platformLaunchSettings.providerLabel;

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-1 gap-3 w-full">
          <div
            onMouseEnter={() => nav && nav.hoverZone('play')}
            className={`flex-1 rounded-lg transition-all ${nav ? nav.focusCls('play') : ''}`}
          >
            <button
              id="play-game-btn"
              onClick={handlePlayNative}
              disabled={status === 'launching'}
              className={`grid w-full ${buttonGridClass} items-center gap-3 rounded-[14px] border text-left font-black transition-all ${buttonPaddingClass} ${nativeButtonStyles[status]}`}
              style={{ minHeight: buttonMinHeight }}
            >
              <span className={`flex shrink-0 items-center justify-center rounded-[10px] bg-black/18 ${iconWrapClass} ${nativeIconStyles[status]}`}>
                <RocketGlyph className={iconGlyphClass} />
              </span>
              <span className={`min-w-0 truncate ${labelClass}`}>{buttonLabel[status]}</span>
              <span className={sideLabelClass}>
                {nativeProviderLabel}
              </span>
            </button>
          </div>
          {canPlayEmbedded && (
            <div
              onMouseEnter={() => nav && nav.hoverZone('play-web')}
              className={`flex-1 rounded-lg transition-all ${nav ? nav.focusCls('play-web') : ''}`}
            >
              <button
                id="play-browser-btn"
                onClick={handlePlayWeb}
                className={`grid w-full ${buttonGridClass} items-center gap-3 rounded-[14px] border text-left font-black transition-all ${buttonPaddingClass} ${webButtonClass}`}
                style={{ minHeight: buttonMinHeight }}
              >
                <span className={`flex shrink-0 items-center justify-center rounded-[10px] bg-black/18 ${iconWrapClass} ${webIconClass}`}>
                  <EmbeddedGlyph className={iconGlyphClass} />
                </span>
                <span className={`min-w-0 truncate ${labelClass}`}>Play Embedded</span>
                <span className={sideLabelClass}>Instant</span>
              </button>
            </div>
          )}
        </div>

        {message && (
          <p className={`text-[10px] leading-snug text-center ${status === 'error' ? 'text-red-400' : 'text-green-400'}`}>
            {message}
          </p>
        )}
        {!platformLaunchSettings.emulatorPath && status === 'idle' && (
          <p className="text-[10px] text-yellow-600 text-center">
            ⚠ Desktop emulator not set
          </p>
        )}
      </div>

      {showWasm && canPlayEmbedded && (
        <WasmPlayer
          romPath={romPath}
          onClose={() => setShowWasm(false)}
        />
      )}
    </>
  );
}
