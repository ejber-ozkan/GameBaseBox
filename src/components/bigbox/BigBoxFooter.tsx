"use client";

interface BigBoxFooterProps {
  isFiltered: boolean;
  totalGameCount: number;
}

export function BigBoxFooter({ isFiltered, totalGameCount }: BigBoxFooterProps) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-black to-transparent z-50 flex items-center justify-between px-12 pointer-events-none">
      <div className="flex items-center gap-8 text-[10px] font-black text-white/40 tracking-[0.2em] uppercase">
        <div className="flex items-center gap-2"><span className="w-5 h-5 bg-white/10 rounded flex items-center justify-center text-white">A</span> SELECT</div>
        <div className="flex items-center gap-2"><span className="w-5 h-5 bg-white/10 rounded flex items-center justify-center text-white">B</span> BACK</div>
        <div className="flex items-center gap-2"><span className="w-5 h-5 bg-white/10 rounded flex items-center justify-center text-white">Y</span> FAVORITE</div>
        <div className="flex items-center gap-2"><span className="min-w-8 h-5 px-1 bg-white/10 rounded flex items-center justify-center text-white">LT</span> TOP MENU</div>
      </div>

      <div className="text-[10px] font-black text-white/20 tracking-[0.2em] uppercase">
        {totalGameCount} {isFiltered ? 'GAMES FOUND' : 'GAMES AVAILABLE'}
      </div>
    </footer>
  );
}
