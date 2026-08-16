"use client";

import { useGamepadControls, type GamepadViewContext } from '../../lib/gamepad-controls';
import { useTranslation } from '../../i18n';

interface BigBoxFooterProps {
  context?: GamepadViewContext;
  className?: string;
}

export function BigBoxFooter({ context = 'grid', className = '' }: BigBoxFooterProps) {
  const controls = useGamepadControls(context);
  const { t } = useTranslation();

  const getLocalizedLabel = (id: string, defaultLabel: string) => {
    switch (id) {
      case 'navigate':
        return t('shortcuts.navigate');
      case 'select':
        return context === 'detail' ? `${t('shortcuts.select')} / ${t('shortcuts.play')}` : t('shortcuts.select');
      case 'back':
        return t('shortcuts.back');
      case 'favorite':
        return t('shortcuts.favorite');
      case 'sections':
        return t('shortcuts.sections');
      case 'tabs':
        return t('shortcuts.tabs');
      case 'top_menu':
        return t('shortcuts.topMenu');
      case 'settings':
        return t('shortcuts.settings');
      default:
        return defaultLabel;
    }
  };

  return (
    <footer
      className={`fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-t border-[var(--theme-outline-variant)]/30 bg-[var(--theme-background)]/90 px-4 sm:px-8 md:px-12 backdrop-blur-md pointer-events-none ${className}`}
      data-testid="bigbox-footer"
      data-footer-context={context}
    >
      <div className="flex flex-wrap items-center gap-3 sm:gap-6 md:gap-8 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-[var(--theme-text-muted)]">
        {controls.map((control) => (
          <div key={control.id} className="flex items-center gap-1.5 sm:gap-2">
            <span className="flex h-5 min-w-5 items-center justify-center rounded-[var(--theme-radius-sm)] border border-[var(--theme-outline-variant)] bg-[var(--theme-surface)] px-1.5 font-mono text-[10px] text-[var(--theme-text)] shadow-sm">
              {control.button}
            </span>
            <span>{getLocalizedLabel(control.id, control.label)}</span>
          </div>
        ))}
      </div>
    </footer>
  );
}
