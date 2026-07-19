import type { EditableSettings, ContentNavProps } from './types';
import { ThemedToggle } from './ThemedToggle';
import { useTheme } from '../../contexts/ThemeContext';

interface DisplaySettingsTabProps extends ContentNavProps {
  draft: EditableSettings;
  setField: <K extends keyof EditableSettings>(key: K, value: EditableSettings[K]) => void;
}

export function DisplaySettingsTab({
  draft,
  setField,
  isMouseMode,
  onMouseFocus,
  isFocused,
}: DisplaySettingsTabProps) {
  const { theme } = useTheme();

  return (
    <div className="flex h-full flex-col justify-between gap-4">
      {/* Card 1: Fullscreen Mode */}
      <div className={`settings-card p-5 ${theme.effects.steppedBorders ? 'border-2' : 'rounded-theme-xl border'} border-theme-outline-variant bg-theme-surface/30 ${isFocused(0) ? 'settings-card-focused' : ''}`}>
        <label className="group flex cursor-pointer items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-theme-text">🖥️ Fullscreen Mode (BigBox)</div>
            <div className="mt-1 max-w-xl text-[10px] text-theme-text-muted leading-relaxed">
              Runs the application in immersive fullscreen mode. Toggle with Alt+Enter.
            </div>
          </div>
          <ThemedToggle
            label="Fullscreen Mode (BigBox)"
            checked={draft.isFullscreen}
            onChange={() => setField('isFullscreen', !draft.isFullscreen)}
            onMouseEnter={() => isMouseMode && onMouseFocus(0)}
            focusClassName="focus-idx-0"
            focused={isFocused(0)}
          />
        </label>
      </div>

      {/* Card 2: Window Resolution */}
      <div className={`settings-card p-5 ${theme.effects.steppedBorders ? 'border-2' : 'rounded-theme-xl border'} border-theme-outline-variant bg-theme-surface/30 ${[1, 2, 3, 4, 5].some(isFocused) ? 'settings-card-focused' : ''} ${draft.isFullscreen ? 'pointer-events-none opacity-40' : ''}`}>
        <label className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-theme-text-muted">
          Window Resolution
        </label>
        <div className="flex flex-wrap gap-1 rounded-theme-lg border border-theme-outline-variant bg-theme-background/60 p-1">
          {[
            { value: 'default', label: 'Default', idx: 1 },
            { value: '1280x720', label: '720p', idx: 2 },
            { value: '1920x1080', label: '1080p', idx: 3 },
            { value: '2560x1440', label: '1440p', idx: 4 },
            { value: '3840x2160', label: '4K', idx: 5 },
          ].map((resolution) => (
            <button
              key={resolution.value}
              onClick={() => setField('displayResolution', resolution.value)}
              onMouseEnter={() => isMouseMode && onMouseFocus(resolution.idx)}
              className={`focus-idx-${resolution.idx} rounded-theme px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                (draft.displayResolution === resolution.value && ![1, 2, 3, 4, 5].some(isFocused)) || isFocused(resolution.idx)
                  ? 'bg-theme-primary text-theme-surface shadow-lg'
                  : 'text-theme-text-muted hover:text-theme-text'
              }`}
            >
              {resolution.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[9px] italic text-theme-text-muted leading-relaxed">
          Note: These only apply in windowed mode. Fullscreen uses your primary monitor resolution.
        </p>
      </div>

      {/* Card 3: Fullscreen Density */}
      <div className={`settings-card p-5 ${theme.effects.steppedBorders ? 'border-2' : 'rounded-theme-xl border'} border-theme-outline-variant bg-theme-surface/30 ${[6, 7, 8, 9].some(isFocused) ? 'settings-card-focused' : ''}`}>
        <label className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-theme-text-muted">
          Fullscreen Density
        </label>
        <div className="flex flex-wrap gap-1 rounded-theme-lg border border-theme-outline-variant bg-theme-background/60 p-1">
          {([
            { value: 'auto', label: 'Auto', idx: 6 },
            { value: 'compact', label: 'Compact', idx: 7 },
            { value: 'standard', label: 'Standard', idx: 8 },
            { value: 'comfortable', label: 'Comfortable', idx: 9 },
          ] as const).map((density) => (
            <button
              key={density.value}
              onClick={() => setField('fullscreenDensity', density.value)}
              onMouseEnter={() => isMouseMode && onMouseFocus(density.idx)}
              className={`focus-idx-${density.idx} rounded-theme px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                (draft.fullscreenDensity === density.value && ![6, 7, 8, 9].some(isFocused)) || isFocused(density.idx)
                  ? 'bg-theme-primary text-theme-surface shadow-lg'
                  : 'text-theme-text-muted hover:text-theme-text'
              }`}
            >
              {density.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[9px] italic text-theme-text-muted leading-relaxed">
          Auto keeps fullscreen layouts tighter on high-DPI and 4K displays. Compact shows more content; Comfortable keeps larger artwork.
        </p>
      </div>
    </div>
  );
}
