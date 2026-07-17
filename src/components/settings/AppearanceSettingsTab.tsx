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
    <>
      <div className="rounded-theme-xl border border-theme-outline-variant bg-theme-surface/30 p-5">
        <div className="text-xs font-bold uppercase tracking-[0.22em] text-theme-primary">Application Theme</div>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-theme-text-muted">
          Choose the visual treatment used throughout GameBase Box. Your selection is saved immediately.
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
                className={`focus-idx-${index} border px-4 py-3 text-left transition-all ${
                  isActive || isFocused(index)
                    ? 'border-theme-primary bg-theme-primary-container text-theme-text shadow-lg shadow-theme-primary/10'
                    : 'border-theme-outline-variant bg-theme-background/60 text-theme-text-muted hover:border-theme-primary/50 hover:text-theme-text'
                } ${theme.effects.steppedBorders ? '' : 'rounded-theme-lg'}`}
              >
                <span className="block text-sm font-bold">{availableTheme.displayName}</span>
                <span className="mt-1 block text-[10px] font-mono uppercase tracking-widest">
                  {isActive ? 'Selected' : 'Select theme'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-theme-xl border border-theme-primary/30 bg-theme-primary/5 p-5">
        <div className="text-xs font-bold uppercase tracking-[0.22em] text-theme-primary">Detail View</div>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-theme-text-muted">
          Single-game detail pages now use the responsive GBBox detail layout by default. The structure is modular so future visual styles can be added without bringing back separate theme-specific layouts.
        </p>
      </div>

      <div className="mt-8 space-y-6">
        <div className="mb-4 text-xs font-bold uppercase tracking-widest text-theme-text-muted font-mono">
          Screenshot & Media Gallery
        </div>

        <div className="flex flex-col gap-6 rounded-theme-xl border border-theme-outline-variant bg-theme-surface/30 p-5">
          <label className="group flex cursor-pointer items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-theme-text">🔄 Cycle Multiple Images</div>
              <div className="mt-1 max-w-sm text-[10px] text-theme-text-muted">
                Automatically cycle through gameplay screenshots and variants (every 3.5 seconds).
              </div>
            </div>
            <ThemedToggle label="Cycle Multiple Images" checked={draft.imageCycling} onChange={() => setField('imageCycling', !draft.imageCycling)} onMouseEnter={() => isMouseMode && onMouseFocus(3)} focusClassName="focus-idx-3" focused={isFocused(3)} />
          </label>

          <div className={`transition-opacity ${!draft.imageCycling ? 'pointer-events-none opacity-40' : ''}`}>
            <label className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-theme-text-muted">
              Transition Effect
            </label>
            <div className="w-fit rounded-theme-lg border border-theme-outline-variant bg-theme-background/60 p-1">
              {(['none', 'slide'] as const).map((anim, idx) => (
                <button
                  key={anim}
                  onClick={() => setField('imageAnimation', anim)}
                onMouseEnter={() => isMouseMode && onMouseFocus(idx + 4)}
                className={`focus-idx-${idx + 4} rounded-theme px-6 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                    (draft.imageAnimation === anim && ![4, 5].some(isFocused)) || isFocused(idx + 4)
                      ? 'bg-theme-primary text-theme-surface shadow-lg'
                      : 'text-theme-text-muted hover:text-theme-text'
                  }`}
                >
                  {anim === 'none' ? 'Instant/Fade' : 'Graceful Slide'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-4 text-xs font-bold uppercase tracking-widest text-theme-text-muted font-mono">Display & Window</div>
        <div className="space-y-6 rounded-theme-xl border border-theme-outline-variant bg-theme-surface/30 p-5">
          <label className="group flex cursor-pointer items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-theme-text">🖥️ Fullscreen Mode (BigBox)</div>
              <div className="mt-1 max-w-sm text-[10px] text-theme-text-muted">
                Runs the application in immersive fullscreen mode. Toggle with Alt+Enter.
              </div>
            </div>
            <ThemedToggle label="Fullscreen Mode (BigBox)" checked={draft.isFullscreen} onChange={() => setField('isFullscreen', !draft.isFullscreen)} onMouseEnter={() => isMouseMode && onMouseFocus(6)} focusClassName="focus-idx-6" focused={isFocused(6)} />
          </label>

          <div className={`transition-opacity ${draft.isFullscreen ? 'pointer-events-none opacity-40' : ''}`}>
            <label className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-theme-text-muted">
              Window Resolution
            </label>
            <div className="flex flex-wrap gap-1 rounded-theme-lg border border-theme-outline-variant bg-theme-background/60 p-1">
              {[
                { value: 'default', label: 'Default' },
                { value: '1280x720', label: '720p' },
                { value: '1920x1080', label: '1080p' },
                { value: '2560x1440', label: '1440p' },
                { value: '3840x2160', label: '4K' },
              ].map((resolution, idx) => (
                <button
                  key={resolution.value}
                  onClick={() => setField('displayResolution', resolution.value)}
                  onMouseEnter={() => isMouseMode && onMouseFocus(idx + 7)}
                  className={`focus-idx-${idx + 7} rounded-theme px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                    (draft.displayResolution === resolution.value && ![7, 8, 9, 10, 11].some(isFocused)) || isFocused(idx + 7)
                      ? 'bg-theme-primary text-theme-surface shadow-lg'
                      : 'text-theme-text-muted hover:text-theme-text'
                  }`}
                >
                  {resolution.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[9px] italic text-theme-text-muted">
              Note: These only apply in windowed mode. Fullscreen uses your primary monitor resolution.
            </p>
          </div>

          <div>
            <label className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-theme-text-muted">
              Fullscreen Density
            </label>
            <div className="flex flex-wrap gap-1 rounded-theme-lg border border-theme-outline-variant bg-theme-background/60 p-1">
              {([
                { value: 'auto', label: 'Auto' },
                { value: 'compact', label: 'Compact' },
                { value: 'standard', label: 'Standard' },
                { value: 'comfortable', label: 'Comfortable' },
              ] as const).map((density, idx) => (
                <button
                  key={density.value}
                  onClick={() => setField('fullscreenDensity', density.value)}
                onMouseEnter={() => isMouseMode && onMouseFocus(idx + 12)}
                className={`focus-idx-${idx + 12} rounded-theme px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                    (draft.fullscreenDensity === density.value && ![12, 13, 14, 15].some(isFocused)) || isFocused(idx + 12)
                      ? 'bg-theme-primary text-theme-surface shadow-lg'
                      : 'text-theme-text-muted hover:text-theme-text'
                  }`}
                >
                  {density.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[9px] italic text-theme-text-muted">
              Auto keeps fullscreen layouts tighter on high-DPI and 4K displays. Compact shows more content; Comfortable keeps larger artwork and spacing.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-4 text-xs font-bold uppercase tracking-widest text-theme-text-muted font-mono">Mouse & Interaction</div>
        <div className="space-y-6 rounded-theme-xl border border-theme-outline-variant bg-theme-surface/30 p-5">
          {[
            {
              key: 'mouseHoverSelection' as const,
              index: 16,
              title: '🖱️ Mouse Hover Selection',
              description:
                'Automatically focus items when the mouse pointer moves over them. Turn off if your mouse is too sensitive.',
            },
            {
              key: 'scrollNavigation' as const,
              index: 17,
              title: '💎 Scroll Wheel Navigation',
              description: 'Use the mouse scroll button (wheel) to move up and down through menu items.',
            },
            {
              key: 'menuSoundEffects' as const,
              index: 18,
              title: '🔊 Menu Sound Effects',
              description: 'Play UI and menu navigation sounds while moving around the frontend.',
            },
            {
              key: 'bigBoxAnimateVertical' as const,
              index: 19,
              title: '↕️ BigBox Vertical Animation',
              description: 'Enable smooth sliding animations when swapping between game rails in BigBox mode.',
              withBorder: true,
            },
          ].map((item) => (
            <label
              key={item.key}
              className={`group flex cursor-pointer items-center justify-between ${item.withBorder ? 'border-t border-theme-outline-variant pt-6' : ''}`}
            >
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-theme-text">{item.title}</div>
                <div className="mt-1 max-w-sm text-[10px] text-theme-text-muted">{item.description}</div>
              </div>
              <ThemedToggle label={item.title.replace(/^\S+\s/, '')} checked={draft[item.key]} onChange={() => setField(item.key, !draft[item.key])} onMouseEnter={() => isMouseMode && onMouseFocus(item.index)} focusClassName={`focus-idx-${item.index}`} focused={isFocused(item.index)} />
            </label>
          ))}
        </div>
      </div>
    </>
  );
}

