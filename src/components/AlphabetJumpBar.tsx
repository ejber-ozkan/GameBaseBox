"use client";

interface AlphabetJumpBarProps {
  onLetterSelect: (letter: string) => void;
  activeLetter?: string;
}

const LETTERS = ['#', ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))];

export function AlphabetJumpBar({ onLetterSelect, activeLetter }: AlphabetJumpBarProps) {
  return (
    <div className="fixed left-0 top-16 bottom-0 w-8 bg-gray-950/90 backdrop-blur-md border-r border-gray-800/50 flex flex-col items-center justify-start gap-1 py-4 z-40 custom-scrollbar-hidden overflow-y-auto">
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
