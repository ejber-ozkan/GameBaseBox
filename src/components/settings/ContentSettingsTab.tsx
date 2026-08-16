import type { EditableSettings, ContentNavProps } from './types';
import { ThemedToggle } from './ThemedToggle';
import { useTranslation } from '../../i18n';

interface ContentSettingsTabProps extends ContentNavProps {
  draft: EditableSettings;
  setField: <K extends keyof EditableSettings>(key: K, value: EditableSettings[K]) => void;
}

export function ContentSettingsTab({
  draft,
  setField,
  isMouseMode,
  onMouseFocus,
  isFocused,
}: ContentSettingsTabProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-5">
      <div className="mb-1 text-xs font-bold uppercase tracking-widest text-theme-text-muted font-mono">{t('settings.content')}</div>
      <div className="flex flex-col gap-4 rounded-theme-xl border border-theme-outline-variant bg-theme-surface/30 p-5">
        <label className="group flex cursor-pointer items-center justify-between">
          <div>
            <div className="flex items-center gap-2 font-semibold text-theme-text">🔞 {t('settings.hideAdultContent')}</div>
            <div className="mt-1 max-w-sm text-xs text-theme-text-muted">
              {t('settings.hideAdultContentDescription')}
            </div>
          </div>
          <ThemedToggle label={t('settings.hideAdultContent')} checked={draft.hideAdultContent} onChange={() => setField('hideAdultContent', !draft.hideAdultContent)} onMouseEnter={() => isMouseMode && onMouseFocus(0)} focusClassName="focus-idx-0" focused={isFocused(0)} large />
        </label>
      </div>
      <p className="text-xs text-theme-text-muted">
        {t('settings.hideAdultContentDescription')}
      </p>
    </div>
  );
}
