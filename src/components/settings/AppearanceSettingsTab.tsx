import type { EditableSettings, ContentNavProps } from './types';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemedToggle } from './ThemedToggle';
import { useTranslation, SUPPORTED_LANGUAGES } from '../../i18n';

interface AppearanceSettingsTabProps extends ContentNavProps {
  draft: EditableSettings;
  setField: <K extends keyof EditableSettings>(key: K, value: EditableSettings[K]) => void;
}

export function AppearanceSettingsTab({
  draft,
  setField,
  isMouseMode,
  onMouseFocus,
  isFocused,
}: AppearanceSettingsTabProps) {
  const { theme, setTheme, availableThemes } = useTheme();
  const { t } = useTranslation();

  const sortedLanguages = Object.values(SUPPORTED_LANGUAGES).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="flex flex-col justify-start gap-4">
      {/* Language Picker */}
      <div className={`settings-card p-5 ${theme.effects.steppedBorders ? 'border-2' : 'rounded-theme-xl border'} border-theme-outline-variant bg-theme-surface/30 ${isFocused(5) ? 'settings-card-focused' : ''}`}>
        <div className="text-xs font-bold uppercase tracking-[0.22em] text-theme-primary">
          🌐 {t('settings.languageLabel')}
        </div>
        <p className="mt-2 max-w-xl text-[10px] text-theme-text-muted leading-relaxed">
          {t('settings.languageDescription')}
        </p>
        <div className="mt-4 max-w-md">
          <select
            aria-label={t('settings.languageLabel')}
            value={draft.language || 'system'}
            onChange={(e) => setField('language', e.target.value)}
            onFocus={() => onMouseFocus(5)}
            className={`w-full cursor-pointer border px-3 py-2 text-sm bg-theme-background text-theme-text transition-all focus:outline-none focus:border-theme-primary ${
              theme.effects.steppedBorders ? 'border-2' : 'rounded-theme-lg border-theme-outline-variant'
            }`}
          >
            <option value="system">🌐 {t('common.systemDefault')} (Auto)</option>
            {sortedLanguages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName} ({lang.name}){lang.dir === 'rtl' ? ' [RTL]' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Theme Picker */}
      <div className={`settings-card p-5 ${theme.effects.steppedBorders ? 'border-2' : 'rounded-theme-xl border'} border-theme-outline-variant bg-theme-surface/30 ${[0, 1, 2].some(isFocused) ? 'settings-card-focused' : ''}`}>
        <div className="text-xs font-bold uppercase tracking-[0.22em] text-theme-primary">{t('settings.themeLabel')}</div>
        <p className="mt-2 max-w-xl text-[10px] text-theme-text-muted leading-relaxed">
          {t('settings.themeDescription')}
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {availableThemes.map((availableTheme, index) => {
            const isActive = theme.id === availableTheme.id;

            return (
              <button
                key={availableTheme.id}
                type="button"
                aria-label={availableTheme.displayName}
                aria-pressed={isActive}
                onClick={() => setTheme(availableTheme.id)}
                onMouseEnter={() => isMouseMode && onMouseFocus(index)}
                className={`focus-idx-${index} cursor-pointer border px-4 py-3 text-left transition-all ${
                  isActive || isFocused(index)
                    ? 'border-theme-primary bg-theme-primary-container text-theme-text shadow-lg shadow-theme-primary/10'
                    : 'border-theme-outline-variant bg-theme-background/60 text-theme-text-muted hover:border-theme-primary/50 hover:text-theme-text'
                } ${theme.effects.steppedBorders ? '' : 'rounded-theme-lg'}`}
              >
                <span className="block text-sm font-bold">{availableTheme.displayName}</span>
                <span className="mt-1 block text-[10px] font-mono uppercase tracking-widest leading-none">
                  {isActive ? t('common.selected') : t('common.select')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail View Info Card */}
      <div className={`p-5 ${theme.effects.steppedBorders ? 'border-2' : 'rounded-theme-xl border'} border-theme-primary/20 bg-theme-primary/5`}>
        <div className="text-xs font-bold uppercase tracking-[0.22em] text-theme-primary">Detail View Layout</div>
        <p className="mt-2 max-w-xl text-[10px] text-theme-text-muted leading-relaxed">
          Single-game detail pages use the responsive, theme-consistent GBBox detail layout by default. The structure adapts automatically so future visual styles do not require custom layout files.
        </p>
      </div>

      {/* Card 3: UI Sound Effects Toggle */}
      <div className={`settings-card p-5 ${theme.effects.steppedBorders ? 'border-2' : 'rounded-theme-xl border'} border-theme-outline-variant bg-theme-surface/30 ${isFocused(3) ? 'settings-card-focused' : ''}`}>
        <label className="group flex cursor-pointer items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-theme-text">🔊 {t('settings.menuSoundsLabel')}</div>
            <div className="mt-1 max-w-xl text-[10px] text-theme-text-muted leading-relaxed">
              {t('settings.menuSoundsDescription')}
            </div>
          </div>
          <ThemedToggle
            label={t('settings.menuSoundsLabel')}
            checked={draft.menuSoundEffects}
            onChange={() => setField('menuSoundEffects', !draft.menuSoundEffects)}
            onMouseEnter={() => isMouseMode && onMouseFocus(3)}
            focusClassName="focus-idx-3"
            focused={isFocused(3)}
          />
        </label>
      </div>

      {/* Card 4: C64 Raster Lines Toggle (only when C64 Edition theme is selected) */}
      {theme.id === 'c64-edition' && (
        <div className={`settings-card p-5 ${theme.effects.steppedBorders ? 'border-2' : 'rounded-theme-xl border'} border-theme-outline-variant bg-theme-surface/30 ${isFocused(4) ? 'settings-card-focused' : ''}`}>
          <label className="group flex cursor-pointer items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-theme-text">📺 {t('settings.c64RasterLabel')}</div>
              <div className="mt-1 max-w-xl text-[10px] text-theme-text-muted leading-relaxed">
                {t('settings.c64RasterDescription')}
              </div>
            </div>
            <ThemedToggle
              label={t('settings.c64RasterLabel')}
              checked={draft.c64RasterLines ?? true}
              onChange={() => setField('c64RasterLines', !(draft.c64RasterLines ?? true))}
              onMouseEnter={() => isMouseMode && onMouseFocus(4)}
              focusClassName="focus-idx-4"
              focused={isFocused(4)}
            />
          </label>
        </div>
      )}
    </div>
  );
}
