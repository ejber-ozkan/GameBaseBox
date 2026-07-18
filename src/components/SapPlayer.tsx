"use client";

import { useEffect, useState } from 'react';
import { getMediaUrl } from '../lib/tauri-bridge';
import { useTheme } from '../contexts/ThemeContext';

interface SapPlayerRuntime {
  loadstart?: (url: string) => void;
  load?: (url: string) => void | Promise<void>;
  play?: () => void;
  setvolume?: (volume: number) => void;
  setVolume?: (volume: number) => void;
  pause?: () => void;
  stop?: () => void;
}

interface SapRuntimeConstructor {
  new (): SapPlayerRuntime;
}

declare global {
  interface Window {
    ASAPPlayer?: SapRuntimeConstructor;
    SAPplayer?: SapPlayerRuntime;
  }
}

interface SapPlayerProps {
  filename: string | null;
  audioUrl?: string;
  compact?: boolean;
}

function isNativePath(url: string) {
  return /^[A-Za-z]:[\\/]/.test(url) || url.startsWith('file://');
}

async function resolvePlayableSapUrl(url: string) {
  if (!isNativePath(url)) {
    return url;
  }

  let path = url.replace('file://', '');
  if (path.startsWith('/') && path.charAt(2) === ':') {
    path = path.substring(1);
  }

  return getMediaUrl(path);
}

export function SapPlayer({ filename, audioUrl, compact = false }: SapPlayerProps) {
  const { theme } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const [barHeights, setBarHeights] = useState<number[]>([20, 20, 20, 20, 20]);

  const isArcade = theme.id === 'arcade-void';

  useEffect(() => {
    if (!isPlaying) {
      const timer = setTimeout(() => {
        setBarHeights((prev) => prev.every((h) => h === 20) ? prev : [20, 20, 20, 20, 20]);
      }, 0);
      return () => clearTimeout(timer);
    }

    const interval = setInterval(() => {
      setBarHeights([
        Math.floor(Math.random() * 80) + 20,
        Math.floor(Math.random() * 80) + 20,
        Math.floor(Math.random() * 80) + 20,
        Math.floor(Math.random() * 80) + 20,
        Math.floor(Math.random() * 80) + 20,
      ]);
    }, 120);

    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    const player = typeof window !== 'undefined' ? window.SAPplayer : undefined;
    if (!player) return;

    player.setvolume?.(volume);
    player.setVolume?.(volume);
  }, [volume]);

  async function handleToggle() {
    if (!filename || !audioUrl) {
      setPlaybackError('Configure the Atari 800 Music folder first.');
      return;
    }

    if (isPlaying) {
      window.SAPplayer?.pause?.();
      window.SAPplayer?.stop?.();
      setIsPlaying(false);
      return;
    }

    if (typeof window === 'undefined' || !window.ASAPPlayer) {
      setPlaybackError('SAP playback engine not loaded yet.');
      return;
    }

    try {
      const finalUrl = await resolvePlayableSapUrl(audioUrl);
      const player = window.SAPplayer ?? new window.ASAPPlayer();
      window.SAPplayer = player;
      await player.load?.(finalUrl);
      player.loadstart?.(finalUrl);
      player.setvolume?.(volume);
      player.setVolume?.(volume);
      player.play?.();
      setPlaybackError(null);
      setIsPlaying(true);
    } catch (error) {
      setPlaybackError(`Audio Error: ${String(error)}`);
      setIsPlaying(false);
    }
  }

  if (!filename) {
    return <div className={`text-theme-text-muted ${compact ? 'text-xs' : 'text-sm'}`}>No SAP track available</div>;
  }

  if (isArcade) {
    return (
      <div data-testid="sap-player" className="w-full rounded-theme-lg border border-theme-outline bg-theme-surface/75 backdrop-blur-md p-3 flex flex-col gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            id="sap-play-btn"
            className={`w-9 h-9 rounded-full border border-theme-primary flex items-center justify-center shrink-0 transition-all ${
              isPlaying ? 'bg-theme-primary text-[#00363e] animate-pulse shadow-[0_0_12px_var(--theme-primary)]' : 'bg-transparent text-theme-primary hover:bg-theme-primary/10'
            }`}
            onClick={() => void handleToggle()}
            data-testid="sap-play-button"
            title="Play SAP"
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] text-theme-primary tracking-widest uppercase truncate">
              {isPlaying ? 'SAP ACTIVE' : 'SAP STANDBY'}
            </div>
            <div className="text-xs font-bold text-theme-primary truncate" title={filename}>
              {filename.split(/[\\/]/).pop()}
            </div>
          </div>
        </div>

        <div className="h-6 bg-black/40 rounded border border-theme-outline/50 flex items-end px-2 gap-1 py-1">
          {barHeights.map((height, i) => (
            <div
              key={i}
              className="flex-1 bg-theme-primary rounded-t transition-all duration-100"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-theme-text-muted">🔈</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(event) => setVolume(parseFloat(event.target.value))}
            className="w-full accent-[var(--theme-primary)] h-1 rounded bg-black/40"
            data-testid="sap-volume-slider"
          />
        </div>

        {playbackError && (
          <div className="text-[9px] leading-tight text-red-400">
            ⚠ {playbackError}
          </div>
        )}
      </div>
    );
  }

  return (
    <div data-testid="sap-player" className={`flex w-full flex-col rounded-theme-lg border border-theme-outline bg-theme-surface ${compact ? 'gap-2 p-3' : 'gap-3 p-4'}`}>
      <div className={`flex max-w-full items-center justify-between font-mono ${compact ? 'text-xs' : 'text-sm'}`}>
        <span className="mr-2 truncate text-theme-primary" title={filename}>♪ {filename.split(/[\\/]/).pop()}</span>
        <span className="shrink-0 text-[10px] text-theme-text-muted">{isPlaying ? 'PLAYING' : 'STOPPED'}</span>
      </div>

      <div className={`flex items-center ${compact ? 'gap-3' : 'gap-4'}`}>
        <button
          id="sap-play-btn"
          className={`flex shrink-0 items-center justify-center rounded-full transition-colors ${compact ? 'h-8 w-8 text-sm' : 'h-10 w-10'} ${isPlaying ? 'bg-theme-primary text-theme-surface hover:brightness-110' : 'bg-theme-primary-container text-theme-primary hover:brightness-110'}`}
          onClick={() => void handleToggle()}
          data-testid="sap-play-button"
          title="Play SAP"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <div className="flex flex-1 items-center gap-2">
          <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-theme-text-muted`}>▮</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(event) => setVolume(parseFloat(event.target.value))}
            className="w-full accent-[var(--theme-primary)]"
            data-testid="sap-volume-slider"
          />
        </div>
      </div>

      {playbackError ? (
        <div className={`${compact ? 'text-[9px]' : 'text-[10px]'} leading-tight text-red-400`}>
          ⚠ {playbackError}
        </div>
      ) : null}
    </div>
  );
}
