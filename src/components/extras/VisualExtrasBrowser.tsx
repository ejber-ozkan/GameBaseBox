"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Extra } from '../../types/game';
import { ExtrasBigscreenNavigation } from '../ExtrasDetail';
import { ResolvedExtraMedia, VisualExtraThumb } from './ResolvedExtraMedia';
import { usePopupOpenSound } from '../../hooks/usePopupOpenSound';
import { useGamepad } from '../../hooks/useGamepad';

export function VisualExtrasBrowser({
  extras,
  extrasPath,
  previewHeight,
  thumbColumns = 5,
  thumbnailLimit,
  onRegisterNavigation,
}: {
  extras: Extra[];
  extrasPath: string;
  previewHeight?: number;
  thumbColumns?: number;
  thumbnailLimit?: number;
  onRegisterNavigation?: (navigation: ExtrasBigscreenNavigation | null) => void;
}) {
  const visibleExtras = thumbnailLimit ? extras.slice(0, thumbnailLimit) : extras;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const safeSelectedIndex = Math.min(selectedIndex, Math.max(visibleExtras.length - 1, 0));
  const selectedExtra = visibleExtras[safeSelectedIndex] ?? visibleExtras[0] ?? null;
  const fullscreenExtra = fullscreenIndex !== null ? (visibleExtras[fullscreenIndex] ?? selectedExtra) : null;
  const isFullscreen = fullscreenIndex !== null;
  usePopupOpenSound(isFullscreen, 'extras-visual-fullscreen');

  const moveSelection = useCallback((direction: -1 | 1) => {
    if (visibleExtras.length <= 1) {
      return;
    }

    setSelectedIndex((current) => (current + direction + visibleExtras.length) % visibleExtras.length);
  }, [visibleExtras.length]);

  const cycleFullscreen = useCallback((direction: -1 | 1) => {
    if (visibleExtras.length <= 1) {
      return;
    }

    setFullscreenIndex((current) => {
      const baseIndex = current ?? safeSelectedIndex;
      return (baseIndex + direction + visibleExtras.length) % visibleExtras.length;
    });
  }, [safeSelectedIndex, visibleExtras.length]);

  const moveWithinBrowser = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    if (isFullscreen) {
      if (direction === 'left') {
        cycleFullscreen(-1);
        return true;
      }
      if (direction === 'right') {
        cycleFullscreen(1);
        return true;
      }
      return false;
    }

    if (direction === 'left') {
      moveSelection(-1);
      return true;
    }
    if (direction === 'right') {
      moveSelection(1);
      return true;
    }
    return false;
  }, [cycleFullscreen, isFullscreen, moveSelection]);

  const activateSelection = useCallback(() => {
    if (isFullscreen) {
      return true;
    }

    if (!selectedExtra) {
      return false;
    }

    setFullscreenIndex(safeSelectedIndex);
    return true;
  }, [isFullscreen, safeSelectedIndex, selectedExtra]);

  useEffect(() => {
    if (!onRegisterNavigation) {
      return undefined;
    }

    onRegisterNavigation({
      move: moveWithinBrowser,
      activate: activateSelection,
    });

    return () => onRegisterNavigation(null);
  }, [activateSelection, moveWithinBrowser, onRegisterNavigation]);

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

  if (!selectedExtra) {
    return null;
  }

  return (
    <div className="min-w-0 space-y-3">
      <div className="rounded-[18px] border border-white/8 bg-black/20 p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">{selectedExtra.name}</div>
            <div className="truncate text-[10px] uppercase tracking-[0.2em] text-white/45">
              {selectedExtra.path.split(/[\/\\]/).shift()}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => moveSelection(-1)}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/70 transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
              aria-label="Previous extra image"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => moveSelection(1)}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/70 transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
              aria-label="Next extra image"
            >
              ›
            </button>
          </div>
        </div>
        <div
          onClick={() => setFullscreenIndex(safeSelectedIndex)}
          className="group relative block w-full overflow-hidden rounded-xl border border-gray-800 bg-gray-950 text-left transition-colors hover:border-blue-500/50"
          style={previewHeight ? { height: `${previewHeight}px` } : undefined}
        >
          <ResolvedExtraMedia
            extra={selectedExtra}
            extrasPath={extrasPath}
            fit="contain"
            mode="preview"
            className="h-full w-full bg-black/60 p-3"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent px-4 py-3 opacity-0 transition-opacity group-hover:opacity-100">
            <p className="truncate text-xs font-bold text-white">{selectedExtra.name}</p>
            <p className="text-[9px] uppercase tracking-widest text-gray-400">Press Enter for fullscreen</p>
          </div>
          <button
            type="button"
            aria-label={`Open ${selectedExtra.name} fullscreen`}
            onClick={(event) => {
              event.stopPropagation();
              setFullscreenIndex(safeSelectedIndex);
            }}
            className="absolute right-3 top-3 z-30 rounded-lg border border-white/20 bg-black/70 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/75 hover:border-blue-400/60 hover:text-blue-200"
          >
            Fullscreen
          </button>
        </div>
      </div>

      <div className="grid min-w-0 gap-2.5" style={{ gridTemplateColumns: `repeat(${thumbColumns}, minmax(0,1fr))` }}>
        {visibleExtras.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedIndex(index)}
            className={`rounded-[16px] border p-2 text-left transition-all ${
              selectedIndex === index ? 'border-cyan-400/70 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(34,211,238,0.15)_inset]' : 'border-white/8 bg-white/[0.02] hover:border-white/20'
            }`}
          >
            <div className="overflow-hidden rounded-[12px] border border-white/8 bg-black/40">
              <VisualExtraThumb extra={item} extrasPath={extrasPath} />
            </div>
            <div className="mt-1.5 truncate text-[11px] font-medium text-white">{item.name}</div>
          </button>
        ))}
      </div>

      {isFullscreen && fullscreenExtra ? (
        <div
          data-detail-modal="open"
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/98 p-8 backdrop-blur-xl animate-in fade-in zoom-in duration-300 pointer-events-auto"
          onClick={() => setFullscreenIndex(null)}
        >
          <div className="relative flex max-h-full w-full max-w-5xl flex-col items-center gap-4" onClick={(event) => event.stopPropagation()}>
            {visibleExtras.length > 1 ? (
              <button
                className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-black/60 px-4 py-5 text-3xl text-white transition-colors hover:border-blue-400/60 hover:text-blue-300"
                onClick={() => cycleFullscreen(-1)}
              >
                ‹
              </button>
            ) : null}
            <ResolvedExtraMedia
              extra={fullscreenExtra}
              extrasPath={extrasPath}
              fit="contain"
              mode="fullscreen"
              className="max-h-[85vh] max-w-full rounded-lg shadow-2xl"
            />
            {visibleExtras.length > 1 ? (
              <button
                className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-black/60 px-4 py-5 text-3xl text-white transition-colors hover:border-blue-400/60 hover:text-blue-300"
                onClick={() => cycleFullscreen(1)}
              >
                ›
              </button>
            ) : null}
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">{fullscreenExtra.name}</h2>
              <p className="text-sm uppercase tracking-widest text-gray-400">{fullscreenExtra.path}</p>
              {visibleExtras.length > 1 ? (
                <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-white/50">Left / Right to browse • B / Esc to close</p>
              ) : null}
            </div>
            <button
              className="absolute top-0 right-0 p-4 text-4xl leading-none text-white hover:text-red-400"
              onClick={() => setFullscreenIndex(null)}
            >
              ×
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
