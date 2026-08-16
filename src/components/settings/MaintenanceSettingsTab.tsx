import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from '../../i18n';

export function MaintenanceSettingsTab() {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <div className={`p-6 opacity-50 ${theme.effects.steppedBorders ? 'border-2' : 'rounded-theme-xl border'} border-theme-outline-variant bg-theme-surface/30`}>
        <h3 className="mb-2 flex items-center gap-2 font-bold text-theme-text">🧼 {t('settings.repairDatabase')}</h3>
        <p className="mb-4 text-xs text-theme-text-muted">
          {t('settings.repairDatabaseDescription')}
        </p>
        <button disabled className={`cursor-not-allowed px-4 py-2 text-xs font-bold uppercase text-theme-text-muted bg-theme-outline-variant ${theme.effects.steppedBorders ? 'border-2 border-theme-outline-variant' : 'rounded-theme'}`}>
          {t('settings.repairDatabaseButton')}
        </button>
      </div>
    </div>
  );
}
