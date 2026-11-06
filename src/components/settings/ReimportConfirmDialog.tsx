"use client";

import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from '../../i18n/I18nContext';

export type ReimportChoice = 'cancel' | 'confirm';

interface ReimportConfirmDialogProps {
  platformName: string;
  choice: ReimportChoice;
  onChoiceChange: (choice: ReimportChoice) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Warning shown before reimporting a platform's MDB. Keyboard and gamepad input is
 * handled by SettingsView (left/right picks, select activates, back cancels).
 */
export function ReimportConfirmDialog({ platformName, choice, onChoiceChange, onCancel, onConfirm }: ReimportConfirmDialogProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const buttonShape = theme.effects.steppedBorders ? 'border-2' : 'rounded-theme-md border';

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reimport-dialog-title"
      data-testid="reimport-confirm-dialog"
    >
      <div
        className={`w-full max-w-lg p-6 md:p-8 ${
          theme.effects.steppedBorders
            ? 'border-4 border-amber-500 bg-theme-surface rounded-theme-xl'
            : 'theme-panel rounded-theme-xl border border-amber-500/40 bg-theme-surface shadow-[0_25px_80px_rgba(0,0,0,0.8)]'
        }`}
        style={{ backgroundColor: theme.id === 'c64-edition' ? theme.colors.primaryContainer : undefined }}
      >
        <div className="mb-2 flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-amber-400">
          <svg className="h-5 w-5 shrink-0 fill-current" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{t('settings.reimport.sectionTitle')}</span>
        </div>
        <h2 id="reimport-dialog-title" className="mt-1 text-xl font-black text-theme-text">
          {t('settings.reimport.dialogTitle', { platform: platformName })}
        </h2>
        <p className="mt-4 text-sm leading-7 text-theme-text">
          {t('settings.reimport.dialogBody', { platform: platformName })}
        </p>
        <p className="mt-3 text-sm leading-7 text-theme-text-muted">{t('settings.reimport.dialogKept')}</p>
        <p className="mt-3 text-sm leading-7 text-theme-text-muted">{t('settings.reimport.dialogSafety')}</p>

        <div className="mt-8 flex flex-col justify-end gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            onMouseEnter={() => onChoiceChange('cancel')}
            className={`${buttonShape} px-5 py-3 text-xs font-black uppercase tracking-[0.18em] transition-all ${
              choice === 'cancel'
                ? 'border-theme-primary bg-theme-primary text-theme-background'
                : 'border-theme-outline/30 bg-theme-surface/50 text-theme-text-muted'
            }`}
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            onMouseEnter={() => onChoiceChange('confirm')}
            className={`${buttonShape} px-5 py-3 text-xs font-black uppercase tracking-[0.18em] transition-all ${
              choice === 'confirm'
                ? 'border-amber-400 bg-amber-400 text-black'
                : 'border-amber-500/60 bg-amber-500/10 text-amber-400'
            }`}
          >
            {t('settings.reimport.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
