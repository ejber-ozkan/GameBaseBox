"use client";

interface AlphabetJumpBarProps {
  onLetterSelect: (letter: string) => void;
  activeLetter?: string;
}

const LETTERS = ['#', ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))];

export function AlphabetJumpBar({ onLetterSelect, activeLetter }: AlphabetJumpBarProps) {
  return (
    <div className="alphabet-jump-bar fixed left-0 top-16 bottom-0 z-40 flex w-8 flex-col items-center justify-start gap-1 overflow-y-auto border-r border-gray-800/50 bg-gray-950/90 py-4 backdrop-blur-md custom-scrollbar-hidden">
      {LETTERS.map((letter) => (
        <button
          key={letter}
          onClick={() => onLetterSelect(letter)}
          className={`w-full text-center text-[10px] sm:text-xs font-bold font-mono py-1 hover:text-white hover:bg-blue-600 transition-colors ${
            activeLetter === letter ? 'text-blue-400 scale-125' : 'text-gray-500'
          }`}
        >
          {letter}
        </button>
      ))}
    </div>
  );
}
