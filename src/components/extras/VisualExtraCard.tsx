"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Extra } from '../../types/game';
import { getAssetUrl, isDebugMode, logDebugMessage } from '../../lib/tauri-bridge';
import { buildExtraAssetPath } from '../../lib/extras';
import { ImageWithFallback } from '../ImageWithFallback';
import { useGamepad } from '../../hooks/useGamepad';
import { usePopupOpenSound } from '../../hooks/usePopupOpenSound';

export function VisualExtraCard({
  extra,
  extrasPath,
  extraIndex,
  enableCarousel,
  visualExtras,
}: {
  extra: Extra;
  extrasPath: string;
  extraIndex: number;
  enableCarousel: boolean;
  visualExtras: Extra[];
}) {
  const [url, setUrl] = useState<string>('');
  const [fallbackText, setFallbackText] = useState('No Image');
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const currentExtra = fullscreenIndex !== null ? (visualExtras[fullscreenIndex] ?? extra) : extra;
  const isFullscreen = fullscreenIndex !== null;
  usePopupOpenSound(isFullscreen, 'extras-visual-fullscreen');

  useEffect(() => {
    const fullPath = buildExtraAssetPath(extrasPath, currentExtra.path);
    getAssetUrl(fullPath)
      .then((resolvedUrl) => {
        setUrl(resolvedUrl);
        setFallbackText('No Image');
      })
      .catch((error) => {
        const errorStr = String(error);
        if (errorStr.includes('Asset parent directory does not exist')) {
          setFallbackText('unavailable');
        }
        isDebugMode().then((debug) => {
          if (debug) {
            logDebugMessage(`[DEBUG WARNING] VisualExtraCard: Failed to resolve asset parent directory for "${currentExtra.name}": ${errorStr}`);
          }
        });
      });
  }, [currentExtra.path, extrasPath, currentExtra.name]);

  const cycleFullscreen = useCallback((direction: -1 | 1) => {
    if (!enableCarousel || visualExtras.length <= 1) {
      return;
    }

    setFullscreenIndex((previous) => {
      const baseIndex = previous ?? extraIndex;
      return (baseIndex + direction + visualExtras.length) % visualExtras.length;
    });
  }, [enableCarousel, extraIndex, visualExtras.length]);

  useGamepad({
    onButtonDown: (button: string) => {
      if (!isFullscreen) {
        return;
      }

      if (button === 'B') {
        setFullscreenIndex(null);
        return;
      }

      if (button === 'LEFT' || button === 'DPAD_LEFT') {
        cycleFullscreen(-1);
        return;
      }

      if (button === 'RIGHT' || button === 'DPAD_RIGHT') {
        cycleFullscreen(1);
      }
    },
  });

  useEffect(() => {
    if (!isFullscreen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        cycleFullscreen(-1);
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        cycleFullscreen(1);
        return;
      }

      if (event.key === 'Escape' || event.key === 'Backspace') {
        event.preventDefault();
        setFullscreenIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cycleFullscreen, isFullscreen]);

  return (
    <>
      <div 
        className="group relative aspect-[4/3] bg-gray-950 rounded-xl overflow-hidden border border-gray-800 hover:border-blue-500/50 transition-all cursor-zoom-in shadow-lg"
        onClick={() => setFullscreenIndex(extraIndex)}
      >
        <ImageWithFallback
          src={url}
          alt={extra.name}
          fallbackText={fallbackText}
          fit="contain"
          className="w-full h-full bg-black/60 p-3 transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
          <p className="text-white font-bold text-xs truncate">{extra.name}</p>
          <p className="text-gray-400 text-[9px] uppercase tracking-widest">{extra.path.split(/[\/\\]/).shift()}</p>
        </div>
      </div>

      {isFullscreen && (
        <div 
          className="fixed inset-0 z-[120] bg-black/98 p-8 flex items-center justify-center backdrop-blur-xl animate-in fade-in zoom-in duration-300 pointer-events-auto"
          onClick={() => setFullscreenIndex(null)}
        >
          <div className="relative max-w-5xl w-full max-h-full flex flex-col items-center gap-4">
             {enableCarousel && visualExtras.length > 1 ? (
               <button
                 className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-black/60 px-4 py-5 text-3xl text-white transition-colors hover:border-blue-400/60 hover:text-blue-300"
                 onClick={() => cycleFullscreen(-1)}
               >
                 ‹
               </button>
             ) : null}
             <ImageWithFallback
                src={url}
                alt={currentExtra.name}
                fallbackText={fallbackText}
                fit="contain"
                className="max-w-full max-h-[85vh] shadow-2xl rounded-lg"
             />
             {enableCarousel && visualExtras.length > 1 ? (
               <button
                 className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-black/60 px-4 py-5 text-3xl text-white transition-colors hover:border-blue-400/60 hover:text-blue-300"
                 onClick={() => cycleFullscreen(1)}
               >
                 ›
               </button>
             ) : null}
             <div className="text-center">
                <h2 className="text-white font-bold text-xl">{currentExtra.name}</h2>
                <p className="text-gray-400 text-sm uppercase tracking-widest">{currentExtra.path}</p>
                {enableCarousel ? (
                  <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-white/50">Left / Right to browse • B / Esc to close</p>
                ) : null}
             </div>
             <button 
               className="absolute top-0 right-0 p-4 text-white hover:text-red-400 text-4xl leading-none"
               onClick={() => setFullscreenIndex(null)}
             >
               ×
             </button>
          </div>
        </div>
      )}
    </>
  );
}
