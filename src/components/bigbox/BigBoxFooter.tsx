"use client";

export function BigBoxFooter() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-between bg-[var(--theme-background)] px-12 pointer-events-none">
      <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--theme-text-muted)]">
        <div className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-[var(--theme-radius-sm)] bg-[var(--theme-surface)] text-[var(--theme-text)]">A</span> SELECT</div>
        <div className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-[var(--theme-radius-sm)] bg-[var(--theme-surface)] text-[var(--theme-text)]">B</span> BACK</div>
        <div className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-[var(--theme-radius-sm)] bg-[var(--theme-surface)] text-[var(--theme-text)]">Y</span> FAVORITE</div>
        <div className="flex items-center gap-2"><span className="flex h-5 min-w-8 items-center justify-center rounded-[var(--theme-radius-sm)] bg-[var(--theme-surface)] px-1 text-[var(--theme-text)]">LT</span> TOP MENU</div>
      </div>
    </footer>
  );
}
