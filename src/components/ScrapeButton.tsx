"use client";

import { Game } from '../types/game';

interface ScrapeButtonProps {
  game: Game;
  className?: string;
  onComplete?: () => void;
}

export function ScrapeButton({ game, className, onComplete }: ScrapeButtonProps) {
  void game;
  void onComplete;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <button
        disabled={true}
        className="relative flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg overflow-hidden bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed opacity-60"
      >
        <span className="text-lg">🛰️</span>
        <div className="flex flex-col items-start leading-tight">
          <span>Art & Info Scraper</span>
          <span className="text-[9px] opacity-70 font-black tracking-tighter">
            (Coming Soon)
          </span>
        </div>
      </button>
    </div>
  );
}
