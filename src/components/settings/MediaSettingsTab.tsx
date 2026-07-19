import type { EditableSettings, ContentNavProps } from './types';
import { ThemedToggle } from './ThemedToggle';
import { useTheme } from '../../contexts/ThemeContext';

interface MediaSettingsTabProps extends ContentNavProps {
  draft: EditableSettings;
  setField: <K extends keyof EditableSettings>(key: K, value: EditableSettings[K]) => void;
}

export function MediaSettingsTab({
  draft,
  setField,
  isMouseMode,
  onMouseFocus,
  isFocused,
}: MediaSettingsTabProps) {
  const { theme } = useTheme();

  return (
    <div className="flex h-full flex-col justify-start gap-6">
      {/* Title */}
      <div className="text-xs font-bold uppercase tracking-widest text-theme-text-muted font-mono">
        Screenshot & Media Gallery
      </div>

      {/* Card: Cycle Images */}
      <div className={`settings-card p-5 ${theme.effects.steppedBorders ? 'border-2' : 'rounded-theme-xl border'} border-theme-outline-variant bg-theme-surface/30 ${isFocused(0) ? 'settings-card-focused' : ''}`}>
        <label className="group flex cursor-pointer items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-theme-text">🔄 Cycle Multiple Images</div>
            <div className="mt-1 max-w-xl text-[10px] text-theme-text-muted leading-relaxed">
              Automatically cycle through gameplay screenshots and variants (every 3.5 seconds) in detail view.
            </div>
          </div>
          <ThemedToggle
            label="Cycle Multiple Images"
            checked={draft.imageCycling}
            onChange={() => setField('imageCycling', !draft.imageCycling)}
            onMouseEnter={() => isMouseMode && onMouseFocus(0)}
            focusClassName="focus-idx-0"
            focused={isFocused(0)}
          />
        </label>
      </div>

      {/* Card: Transition Effect */}
      <div className={`settings-card p-5 ${theme.effects.steppedBorders ? 'border-2' : 'rounded-theme-xl border'} border-theme-outline-variant bg-theme-surface/30 ${[1, 2].some(isFocused) ? 'settings-card-focused' : ''} ${!draft.imageCycling ? 'pointer-events-none opacity-40' : ''}`}>
        <label className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-theme-text-muted">
          Transition Effect
        </label>
        <div className="w-fit rounded-theme-lg border border-theme-outline-variant bg-theme-background/60 p-1">
          {([
            { value: 'none', label: 'Instant/Fade', idx: 1 },
            { value: 'slide', label: 'Graceful Slide', idx: 2 },
          ] as const).map((anim) => (
            <button
              key={anim.value}
              onClick={() => setField('imageAnimation', anim.value)}
              onMouseEnter={() => isMouseMode && onMouseFocus(anim.idx)}
              className={`focus-idx-${anim.idx} rounded-theme px-6 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                (draft.imageAnimation === anim.value && ![1, 2].some(isFocused)) || isFocused(anim.idx)
                  ? 'bg-theme-primary text-theme-surface shadow-lg'
                  : 'text-theme-text-muted hover:text-theme-text'
              }`}
            >
              {anim.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[9px] italic text-theme-text-muted leading-relaxed">
          Animation effects may impact performance on legacy hardware or handheld devices.
        </p>
      </div>
    </div>
  );
}
