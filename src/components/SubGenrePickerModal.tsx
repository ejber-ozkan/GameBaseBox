"use client";

import { useEffect, useMemo, useState } from 'react';
import { useGamepad } from '../hooks/useGamepad';

interface SubGenrePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGamepadInput?: () => void;
  onSelect: (subGenre: string) => void;
  selectedSubGenre?: string;
  subGenres: string[];
  title?: string;
}

const GRID_COLUMNS = 4;

export function SubGenrePickerModal({
  isOpen,
  onClose,
  onGamepadInput,
  onSelect,
  selectedSubGenre,
  subGenres,
  title = 'Choose Sub-Genre',
}: SubGenrePickerModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const initialIndex = selectedSubGenre ? subGenres.indexOf(selectedSubGenre) : 0;
    return initialIndex >= 0 ? initialIndex : 0;
  });

  const currentSubGenre = useMemo(
    () => subGenres[Math.max(0, Math.min(selectedIndex, Math.max(subGenres.length - 1, 0)))],
    [selectedIndex, subGenres],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Backspace') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        if (currentSubGenre) {
          onSelect(currentSubGenre);
        }
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setSelectedIndex((current) => Math.max(current - 1, 0));
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setSelectedIndex((current) => Math.min(current + 1, subGenres.length - 1));
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((current) => Math.max(current - GRID_COLUMNS, 0));
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((current) => Math.min(current + GRID_COLUMNS, subGenres.length - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSubGenre, isOpen, onClose, onSelect, subGenres.length]);

  useGamepad({
    onButtonDown: (button) => {
      if (!isOpen) {
        return;
      }

      onGamepadInput?.();

      if (button === 'B') {
        onClose();
        return;
      }

      if (button === 'A') {
        if (currentSubGenre) {
          onSelect(currentSubGenre);
        }
        return;
      }

      if (button === 'LEFT' || button === 'DPAD_LEFT') {
        setSelectedIndex((current) => Math.max(current - 1, 0));
        return;
      }

      if (button === 'RIGHT' || button === 'DPAD_RIGHT') {
        setSelectedIndex((current) => Math.min(current + 1, subGenres.length - 1));
        return;
      }

      if (button === 'UP' || button === 'DPAD_UP') {
        setSelectedIndex((current) => Math.max(current - GRID_COLUMNS, 0));
        return;
      }

      if (button === 'DOWN' || button === 'DPAD_DOWN') {
        setSelectedIndex((current) => Math.min(current + GRID_COLUMNS, subGenres.length - 1));
      }
    },
  });

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/72 p-6 backdrop-blur-md">
      <div className="w-full max-w-[1100px] rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,12,20,0.98),rgba(6,10,18,0.99))] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300/70">Sub-Genres</div>
            <div className="mt-1 text-2xl font-black tracking-tight text-white">{title}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white/65 transition-all hover:border-white/20 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto pr-2">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {subGenres.map((subGenre, index) => {
              const isActive = index === selectedIndex;
              const isSelected = selectedSubGenre === subGenre;
              return (
                <button
                  key={subGenre}
                  type="button"
                  onClick={() => onSelect(subGenre)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`rounded-[18px] border px-4 py-3 text-left text-sm font-bold transition-all ${
                    isActive
                      ? 'border-cyan-400 bg-cyan-400/18 text-white shadow-[0_0_0_2px_rgba(34,211,238,0.14)]'
                      : isSelected
                        ? 'border-cyan-500/40 bg-cyan-900/30 text-cyan-100'
                        : 'border-white/8 bg-white/[0.04] text-white/72 hover:border-white/18 hover:text-white'
                  }`}
                >
                  {subGenre}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
