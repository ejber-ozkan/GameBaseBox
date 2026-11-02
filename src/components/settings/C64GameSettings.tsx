'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSettings } from '../../contexts/SettingsContext';
import { c64Layers } from '../../lib/platform-launch';
import { getC64LaunchSettings } from '../../lib/tauri-bridge';
import type { C64Layers, C64Overrides, C64Resolved } from '../../types/c64';
import { C64OverridesEditor } from './C64OverridesEditor';
import { useGamepad } from '../../hooks/useGamepad';

function GameEditor({ gameId, layers, onChange }: { gameId: string; layers: C64Layers; onChange: (value: C64Overrides) => void }) {
  const [preview, setPreview] = useState<{ key: string; resolved?: C64Resolved; error?: string }>();
  const key = JSON.stringify(layers);
  const resolved = preview?.key === key ? preview.resolved : undefined;
  const error = preview?.key === key ? preview.error : undefined;
  useEffect(() => {
    let cancelled = false;
    getC64LaunchSettings(gameId, layers).then(value => { if (!cancelled) setPreview({ key, resolved: value }); }).catch(error => { if (!cancelled) setPreview({ key, error: String(error) }); });
    return () => { cancelled = true; };
  }, [gameId, layers, key]);
  return <>
    <C64OverridesEditor value={layers.game} scope="game" resolved={resolved} onChange={onChange} />
    {!resolved && !error && <p role="status" className="text-xs text-theme-text-muted">Reading game settings…</p>}
    {error && <p role="status" className="text-xs text-theme-text-muted">{error}</p>}
  </>;
}

function SettingsDialog({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  const controls = () => Array.from(panel.current?.querySelectorAll<HTMLElement>('select, button') ?? []);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLElement>('select')?.focus();
    return () => previous?.focus();
  }, []);
  useGamepad({ onButtonDown: button => {
    const elements = controls();
    const index = elements.indexOf(document.activeElement as HTMLElement);
    if (button === 'B') onClose();
    if (button === 'UP' || button === 'DOWN') elements[(index + (button === 'UP' ? -1 : 1) + elements.length) % elements.length]?.focus();
    if (['LEFT', 'RIGHT', 'A'].includes(button)) {
      const active = document.activeElement;
      if (active instanceof HTMLSelectElement) {
        active.selectedIndex = (active.selectedIndex + (button === 'LEFT' ? -1 : 1) + active.options.length) % active.options.length;
        active.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (button === 'A' && active instanceof HTMLButtonElement) active.click();
    }
  } });
  return createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" data-detail-modal="open">
    <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={id} className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-theme-xl border border-theme-outline-variant bg-theme-background p-5 text-theme-text shadow-xl" onKeyDown={event => {
      event.stopPropagation();
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key === 'Tab') {
        const elements = controls();
        if (event.shiftKey && document.activeElement === elements[0]) { event.preventDefault(); elements.at(-1)?.focus(); }
        else if (!event.shiftKey && document.activeElement === elements.at(-1)) { event.preventDefault(); elements[0]?.focus(); }
      }
    }}>
      <div className="mb-4 flex items-center justify-between gap-4"><h2 id={id} className="text-base font-bold">C64 emulation settings</h2><button type="button" onClick={onClose} className="min-h-11 px-3 text-sm focus-visible:outline-2 focus-visible:outline-theme-primary">Close</button></div>
      {children}
    </div>
  </div>, document.body);
}

export function C64GameSettings({ gameId, onMouseEnter, className }: { gameId: string; onMouseEnter?: () => void; className?: string }) {
  const { settings, updateSettings } = useSettings();
  const [open, setOpen] = useState(false);
  const id = useId();
  const preferences = settings.c64Emulation;
  const layers = useMemo(() => c64Layers(preferences, gameId), [preferences, gameId]);
  const save = (overrides: C64Overrides) => {
    const games = { ...preferences?.games };
    if (Object.keys(overrides).length) games[gameId] = overrides;
    else delete games[gameId];
    updateSettings({ c64Emulation: { ...preferences, global: preferences?.global ?? {}, games } });
  };
  return <>
    <button id="c64-emulation-settings" type="button" aria-haspopup="dialog" aria-expanded={open} onMouseEnter={onMouseEnter} onClick={() => setOpen(true)}
      className={`min-h-11 rounded-theme border border-theme-outline-variant bg-theme-surface/60 px-3 text-xs font-semibold text-theme-text focus-visible:outline-2 focus-visible:outline-theme-primary ${className ?? ''}`}>Emulation settings</button>
    {open && <SettingsDialog onClose={() => setOpen(false)}><div id={id} className="space-y-3">
      <GameEditor gameId={gameId} layers={layers} onChange={save} />
      <p className="text-xs text-theme-text-muted">Saved automatically. Overrides stay separate from imported GameBase data and do not affect embedded play.</p>
    </div></SettingsDialog>}
  </>;
}
