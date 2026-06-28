"use client";

import { useEffect, useState } from 'react';
import { getMediaUrl } from '../lib/tauri-bridge';

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

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
    return <div className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>No SAP track available</div>;
  }

  return (
    <div className={`flex w-full flex-col rounded-lg border border-gray-700 bg-gray-800 ${compact ? 'gap-2 p-3' : 'gap-3 p-4'}`}>
      <div className={`flex max-w-full items-center justify-between font-mono ${compact ? 'text-xs' : 'text-sm'}`}>
        <span className="mr-2 truncate text-amber-300" title={filename}>♪ {filename.split(/[\\/]/).pop()}</span>
        <span className="shrink-0 text-[10px] text-gray-500">{isPlaying ? 'PLAYING' : 'STOPPED'}</span>
      </div>

      <div className={`flex items-center ${compact ? 'gap-3' : 'gap-4'}`}>
        <button
          id="sap-play-btn"
          className={`flex shrink-0 items-center justify-center rounded-full transition-colors ${compact ? 'h-8 w-8 text-sm' : 'h-10 w-10'} ${isPlaying ? 'bg-amber-600 text-white hover:bg-amber-500' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
          onClick={() => void handleToggle()}
          data-testid="sap-play-button"
          title="Play SAP"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <div className="flex flex-1 items-center gap-2">
          <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-gray-500`}>▮</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(event) => setVolume(parseFloat(event.target.value))}
            className="w-full accent-amber-500"
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
