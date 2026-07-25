"use client";

import { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme } from '../contexts/ThemeContext';
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
  const { theme } = useTheme();
  const platformId = settings?.activePlatformId || 'c64';
  const isSidPlatform = PLATFORM_PROFILES[platformId]?.mediaCapabilities.music === 'sid';
  const isArcade = theme?.id === 'arcade-void';

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [localUrl, setLocalUrl] = useState<string | undefined>(audioUrl);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const [barHeights, setBarHeights] = useState<number[]>([20, 20, 20, 20, 20]);

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

  // Listen for global game-launch event to stop playback and clean up on unmount
  useEffect(() => {
    const handleGameLaunch = () => {
      setIsPlaying(false);
    };
    window.addEventListener('game-launch', handleGameLaunch);
    return () => {
      window.removeEventListener('game-launch', handleGameLaunch);
      if (typeof window !== 'undefined' && window.SIDplayer) {
        try {
          window.SIDplayer.pause();
        } catch (err) {
          console.warn('SIDplayer pause on unmount ignored:', err);
        }
      }
    };
  }, []);

  useEffect(() => {
    setLocalUrl(audioUrl);
  }, [audioUrl]);

  // Check if SID exists on mount or if we just downloaded it
  useEffect(() => {
    async function checkLocalScrape() {
      if (!filename || localUrl) return;
      try {
        const safeName = filename.replace(/\\/g, '/');
        const roots = [
          settings.platformSettings?.[platformId]?.folders.musicPath,
          settings.scrapedMediaPath,
        ].filter((value): value is string => Boolean(value));
        for (const root of roots) {
          const res = await resolveMediaPath(root, safeName);
          if (!res.exists) continue;
           // Provide a direct file:// mapping for Tauri frontend once we implement asset serving.
           // For MVP, we pass the absolute path down (or use the web fallback)
           setLocalUrl(`file://${res.absolute_path}`);
           return;
        }
      } catch {
        // Ignored
      }
    }
    checkLocalScrape();
  }, [filename, localUrl, platformId, settings.platformSettings, settings.scrapedMediaPath]);

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
    return <div className={`text-theme-text-muted ${compact ? 'text-xs' : 'text-sm'}`}>No SID track available</div>;
  }

  if (isArcade) {
    return (
      <div data-testid="sid-player" className="w-full rounded-theme-lg border border-theme-outline bg-theme-surface/75 backdrop-blur-md p-3 flex flex-col gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          {localUrl ? (
            <button
              id="sid-play-btn"
              className={`w-9 h-9 rounded-full border border-theme-primary flex items-center justify-center shrink-0 transition-all ${
                isPlaying ? 'bg-theme-primary text-[#00363e] animate-pulse shadow-[0_0_12px_var(--theme-primary)]' : 'bg-transparent text-theme-primary hover:bg-theme-primary/10'
              }`}
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
              className="px-2.5 py-1 text-[10px] rounded border border-theme-primary bg-theme-primary-container text-theme-primary font-bold uppercase hover:brightness-110 disabled:opacity-50"
              onClick={handleScrape}
              disabled={isDownloading}
            >
              {isDownloading ? 'Scraping...' : '⬇ Scrape'}
            </button>
          )}
          
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] text-theme-primary tracking-widest uppercase truncate">
              {isPlaying ? 'SID 6581 - ACTIVE' : 'SID 6581 - STANDBY'}
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

        {localUrl && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-theme-text-muted">🔈</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full accent-[var(--theme-primary)] h-1 rounded bg-black/40"
              data-testid="volume-slider"
            />
          </div>
        )}

        {downloadError && (
          <div className="text-[9px] leading-tight text-red-400">
            ⚠ {downloadError}
          </div>
        )}
      </div>
    );
  }

  const isC64Theme = theme?.id === 'c64-edition';

  if (isC64Theme) {
    return (
      <div data-testid="sid-player" className="w-full flex flex-col gap-2 bg-[#1f1f1f] border-8 border-t-theme-outline-variant border-l-theme-outline-variant border-b-theme-secondary border-r-theme-secondary p-3">
        <div className="flex items-center justify-between border-b-4 border-theme-outline-variant pb-1.5 mb-1 select-none">
          <span className="text-[10px] font-mono font-bold text-theme-primary">SOUNDTRACK // C64 SID</span>
          <span className="text-[9px] font-mono text-theme-text-muted uppercase truncate max-w-[120px]">
            {isPlaying ? '6581 ACTIVE' : '6581 STANDBY'}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {localUrl ? (
            <button
              id="sid-play-btn"
              className={`w-9 h-9 flex items-center justify-center font-mono text-sm border-4 cursor-pointer transition-all ${
                isPlaying 
                  ? 'bg-theme-tertiary border-t-white border-l-white border-b-black border-r-black text-black font-black' 
                  : 'bg-theme-secondary-container border-t-theme-primary border-l-theme-primary border-b-black border-r-black text-theme-primary font-black'
              }`}
              onClick={() => {
                if (!isPlaying) {
                  if (typeof window !== 'undefined') {
                    if (!window.jsSID) {
                      setDownloadError("jsSID engine not loaded. Try refreshing.");
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
              {isPlaying ? '■' : '▶'}
            </button>
          ) : (
            <button
              id="sid-play-btn"
              className="px-2 py-1 text-[10px] bg-theme-primary text-black font-bold uppercase cursor-pointer border-4 border-t-white border-l-white border-b-black border-r-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white"
              onClick={handleScrape}
              disabled={isDownloading}
            >
              {isDownloading ? 'SCRAPING...' : 'SCRAPE'}
            </button>
          )}

          <div className="min-w-0 flex-1">
            <div className="text-xs font-mono font-bold text-theme-primary truncate" title={filename}>
              {filename.split(/[\\/]/).pop()}
            </div>
          </div>
        </div>

        {localUrl && (
          <div className="flex items-center gap-3 mt-1">
            {/* Visualizer bars */}
            <div className="flex gap-1 items-end h-8 bg-black/60 border-4 border-t-black border-l-black border-b-theme-secondary border-r-theme-secondary w-24 shrink-0 px-1.5 py-0.5">
              {barHeights.map((height, i) => (
                <div
                  key={i}
                  className="flex-1 bg-theme-primary transition-all duration-100"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            
            {/* Volume slider */}
            <div className="flex-1 flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-theme-primary">VOL</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full accent-[var(--theme-primary)] h-1 bg-black/50"
                data-testid="volume-slider"
              />
            </div>
          </div>
        )}

        {downloadError && (
          <div className="text-[9px] font-mono leading-tight text-red-400 mt-1">
            ⚠ {downloadError}
          </div>
        )}
      </div>
    );
  }

  return (
    <div data-testid="sid-player" className={`w-full rounded-theme-lg border border-theme-outline bg-theme-surface flex flex-col ${compact ? 'gap-2 p-3' : 'gap-3 p-4'}`}>
      <div className={`flex max-w-full items-center justify-between font-mono ${compact ? 'text-xs' : 'text-sm'}`}>
         <span className="truncate text-theme-primary mr-2" title={filename}>🎵 {filename.split(/[\\/]/).pop()}</span>
         <span className="text-[10px] text-theme-text-muted shrink-0">{isPlaying ? 'PLAYING' : 'STOPPED'}</span>
      </div>
      
      <div className={`flex items-center ${compact ? 'gap-3' : 'gap-4'}`}>
        {localUrl ? (
          <button
            id="sid-play-btn"
            className={`flex shrink-0 items-center justify-center rounded-full transition-colors ${compact ? 'h-8 w-8 text-sm' : 'h-10 w-10'} ${isPlaying ? 'bg-theme-primary text-theme-surface hover:brightness-110' : 'bg-theme-primary-container text-theme-primary hover:brightness-110'}`}
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
            className={`flex shrink-0 items-center justify-center rounded-theme transition-colors border border-theme-primary bg-theme-primary-container text-theme-primary font-bold uppercase tracking-wider hover:brightness-110 disabled:bg-theme-surface disabled:text-theme-text-muted disabled:cursor-not-allowed ${compact ? 'h-8 px-2.5 py-1 text-[10px]' : 'h-10 px-3 py-1 text-xs'}`}
            onClick={handleScrape}
            disabled={isDownloading}
            title="Download from the High Voltage SID Collection"
          >
            {isDownloading ? 'Scraping...' : '⬇ Scrape HVSC'}
          </button>
        )}


        {localUrl && (
          <div className="flex items-center gap-2 flex-1">
            <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-theme-text-muted`}>🔈</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full accent-[var(--theme-primary)]"
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
