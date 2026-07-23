import type { EditableSettings, ContentNavProps } from './types';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemedToggle } from './ThemedToggle';

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

  return (
    <div className="flex flex-col justify-start gap-4">
      {/* Theme Picker */}
      <div className={`settings-card p-5 ${theme.effects.steppedBorders ? 'border-2' : 'rounded-theme-xl border'} border-theme-outline-variant bg-theme-surface/30 ${[0, 1, 2].some(isFocused) ? 'settings-card-focused' : ''}`}>
        <div className="text-xs font-bold uppercase tracking-[0.22em] text-theme-primary">Application Theme</div>
        <p className="mt-2 max-w-xl text-[10px] text-theme-text-muted leading-relaxed">
          Choose the visual treatment used throughout GameBase Box. Your selection is applied immediately.
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
                  {isActive ? 'Selected' : 'Select'}
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
            <div className="flex items-center gap-2 text-sm font-semibold text-theme-text">🔊 Menu Sound Effects</div>
            <div className="mt-1 max-w-xl text-[10px] text-theme-text-muted leading-relaxed">
              Play retro UI and menu navigation sounds while moving around the frontend interfaces.
            </div>
          </div>
          <ThemedToggle
            label="Menu Sound Effects"
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
              <div className="flex items-center gap-2 text-sm font-semibold text-theme-text">📺 C64 Background Raster Lines</div>
              <div className="mt-1 max-w-xl text-[10px] text-theme-text-muted leading-relaxed">
                Show animated background &apos;raster&apos; loading colour lines when C64 Edition theme is active.
              </div>
            </div>
            <ThemedToggle
              label="C64 Background Raster Lines"
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
