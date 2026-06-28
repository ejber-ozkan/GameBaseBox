"use client";

import { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { downloadMediaAsset, resolveMediaPath, getMediaUrl } from '../lib/tauri-bridge';
import { PLATFORM_PROFILES } from '../lib/platform-capabilities';

interface SidPlayerRuntime {
  loadstart: (url: string, subtune: number) => void;
  setvolume: (volume: number) => void;
  pause: () => void;
}

interface SidRuntimeConstructor {
  new (bufferSize: number, backgroundNoise: number): SidPlayerRuntime;
}

declare global {
  interface Window {
    jsSID?: SidRuntimeConstructor;
    SIDplayer?: SidPlayerRuntime;
    jsSID_aCtx?: AudioContext;
  }
}

interface SidPlayerProps {
  filename: string | null;
  audioUrl?: string;
  compact?: boolean;
}

export function SidPlayer({ filename, audioUrl, compact = false }: SidPlayerProps) {
  const { settings } = useSettings();
  const platformId = settings?.activePlatformId || 'c64';
  const isSidPlatform = PLATFORM_PROFILES[platformId]?.mediaCapabilities.music === 'sid';

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [localUrl, setLocalUrl] = useState<string | undefined>(audioUrl);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    setLocalUrl(audioUrl);
  }, [audioUrl]);

  // Check if SID exists on mount or if we just downloaded it
  useEffect(() => {
    async function checkLocalScrape() {
      if (!filename || localUrl || !settings.scrapedMediaPath) return;
      try {
        const safeName = filename.replace(/\\/g, '/');
        const res = await resolveMediaPath(settings.scrapedMediaPath, safeName);
        if (res.exists) {
           // Provide a direct file:// mapping for Tauri frontend once we implement asset serving.
           // For MVP, we pass the absolute path down (or use the web fallback)
           setLocalUrl(`file://${res.absolute_path}`);
        }
      } catch {
        // Ignored
      }
    }
    checkLocalScrape();
  }, [filename, localUrl, settings.scrapedMediaPath]);

  // Play/Pause effect using jsSID
  useEffect(() => {
    const playSid = async () => {
      if (isPlaying && localUrl) {
        if (typeof window !== 'undefined' && window.SIDplayer) {
          try {
            let finalUrl = localUrl;
            if (localUrl.startsWith('file://')) {
              // Strip file:// and optionally leading slash before C:
              let path = localUrl.replace('file://', '');
              if (path.startsWith('/') && path.charAt(2) === ':') {
                 path = path.substring(1); // /C:/... -> C:/...
              }
              finalUrl = await getMediaUrl(path);
            }
            console.log(`[SidPlayer] Loading URL into jsSID: ${finalUrl}`);
            window.SIDplayer.loadstart(finalUrl, 0);
            window.SIDplayer.setvolume(volume);
          } catch (e) {
            console.error("Failed to load or process SID", e);
            setDownloadError("Audio Error: " + String(e));
          }
        }
      } else {
        if (typeof window !== 'undefined' && window.SIDplayer) {
          try {
            window.SIDplayer.pause();
          } catch (err) {
            console.warn('SIDplayer pause ignored:', err);
          }
        }
      }
    };
    playSid();
  }, [isPlaying, localUrl, volume]);

  // Volume effect
  useEffect(() => {
    if (typeof window !== 'undefined' && window.SIDplayer) {
      window.SIDplayer.setvolume(volume);
    }
  }, [volume]);

  // React cleanup when component unmounts or track changes
  useEffect(() => {
    setIsPlaying(false);
    setDownloadError(null);
  }, [filename]);

  const handleScrape = async () => {
    if (!filename || !settings.scrapedMediaPath) {
      setDownloadError("Configure your Scraped Media folder in Settings first!");
      return;
    }
    setIsDownloading(true);
    setDownloadError(null);
    try {
      const hvscUrl = `https://hvsc.c64.org/download/C64Music/${filename.replace(/\\/g, '/')}`;
      const result = await downloadMediaAsset(hvscUrl, settings.scrapedMediaPath, filename);
      if (result.exists) {
        setLocalUrl(`file://${result.absolute_path}`);
      } else {
        setDownloadError("Failed to verify downloaded file.");
      }
    } catch (err) {
      setDownloadError(String(err));
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isSidPlatform) {
    return null;
  }

  if (!filename) {
    return <div className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>No SID track available</div>;
  }

  return (
    <div className={`w-full rounded-lg border border-gray-700 bg-gray-800 flex flex-col ${compact ? 'gap-2 p-3' : 'gap-3 p-4'}`}>
      <div className={`flex max-w-full items-center justify-between font-mono ${compact ? 'text-xs' : 'text-sm'}`}>
         <span className="truncate text-emerald-400 mr-2" title={filename}>🎵 {filename.split(/[\\/]/).pop()}</span>
         <span className="text-[10px] text-gray-500 shrink-0">{isPlaying ? 'PLAYING' : 'STOPPED'}</span>
      </div>
      
      <div className={`flex items-center ${compact ? 'gap-3' : 'gap-4'}`}>
        {localUrl ? (
          <button
            id="sid-play-btn"
            className={`flex shrink-0 items-center justify-center rounded-full transition-colors ${compact ? 'h-8 w-8 text-sm' : 'h-10 w-10'} ${isPlaying ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}`}
            onClick={() => {
              if (!isPlaying) {
                if (typeof window !== 'undefined') {
                  if (!window.jsSID) {
                    setDownloadError("jsSID engine not loaded. Try refreshing the page.");
                    return;
                  }
                  if (!window.SIDplayer) {
                    window.SIDplayer = new window.jsSID(16384, 0.0005);
                  }
                  if (window.jsSID_aCtx && window.jsSID_aCtx.state === 'suspended') {
                    window.jsSID_aCtx.resume();
                  }
                }
              }
              setDownloadError(null);
              setIsPlaying(!isPlaying);
            }}
            data-testid="play-button"
            title="Play SID"
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
        ) : (
          <button
            id="sid-play-btn"
            className={`flex shrink-0 items-center justify-center rounded-lg transition-colors bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed ${compact ? 'h-8 px-2.5 py-1 text-[10px]' : 'h-10 px-3 py-1 text-xs'}`}
            onClick={handleScrape}
            disabled={isDownloading}
            title="Download from the High Voltage SID Collection"
          >
            {isDownloading ? 'Scraping...' : '⬇ Scrape HVSC'}
          </button>
        )}


        {localUrl && (
          <div className="flex items-center gap-2 flex-1">
            <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-gray-500`}>🔈</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
              data-testid="volume-slider"
            />
          </div>
        )}
      </div>

      {downloadError && (
        <div className={`${compact ? 'text-[9px]' : 'text-[10px]'} leading-tight text-red-400`}>
          ⚠ {downloadError}
        </div>
      )}
    </div>
  );
}
