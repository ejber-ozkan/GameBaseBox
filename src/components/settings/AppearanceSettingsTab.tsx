import type { EditableSettings, ContentNavProps } from './types';

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
  return (
    <>
      <div className="rounded-xl border border-cyan-900/40 bg-cyan-950/15 p-5">
        <div className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">Detail View</div>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-cyan-50/75">
          Single-game detail pages now use the responsive GBBox detail layout by default. The structure is modular so future visual styles can be added without bringing back separate theme-specific layouts.
        </p>
      </div>

      <div className="mt-8 space-y-6">
        <div className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">
          Screenshot & Media Gallery
        </div>

        <div className="flex flex-col gap-6 rounded-xl border border-gray-700 bg-gray-800/50 p-5">
          <label className="group flex cursor-pointer items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-white">🔄 Cycle Multiple Images</div>
              <div className="mt-1 max-w-sm text-[10px] text-gray-400">
                Automatically cycle through gameplay screenshots and variants (every 3.5 seconds).
              </div>
            </div>
            <button
              onClick={() => setField('imageCycling', !draft.imageCycling)}
              onMouseEnter={() => isMouseMode && onMouseFocus(0)}
              className={`focus-idx-0 relative ml-6 h-6 w-12 shrink-0 rounded-full transition-colors ${
                (draft.imageCycling && !isFocused(0)) || isFocused(0) ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-600'
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  draft.imageCycling ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </label>

          <div className={`transition-opacity ${!draft.imageCycling ? 'pointer-events-none opacity-40' : ''}`}>
            <label className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Transition Effect
            </label>
            <div className="w-fit rounded-lg border border-gray-700 bg-gray-950 p-1">
              {(['none', 'slide'] as const).map((anim, idx) => (
                <button
                  key={anim}
                  onClick={() => setField('imageAnimation', anim)}
                  onMouseEnter={() => isMouseMode && onMouseFocus(idx + 1)}
                  className={`focus-idx-${idx + 1} rounded-md px-6 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                    (draft.imageAnimation === anim && ![1, 2].some(isFocused)) || isFocused(idx + 1)
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-500 hover:text-gray-300'
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
        <div className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Display & Window</div>
        <div className="space-y-6 rounded-xl border border-gray-700 bg-gray-800/50 p-5">
          <label className="group flex cursor-pointer items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-white">🖥️ Fullscreen Mode (BigBox)</div>
              <div className="mt-1 max-w-sm text-[10px] text-gray-400">
                Runs the application in immersive fullscreen mode. Toggle with Alt+Enter.
              </div>
            </div>
            <button
              onClick={() => setField('isFullscreen', !draft.isFullscreen)}
              onMouseEnter={() => isMouseMode && onMouseFocus(3)}
              className={`focus-idx-3 relative ml-6 h-6 w-12 shrink-0 rounded-full transition-colors ${
                (draft.isFullscreen && !isFocused(3)) || isFocused(3) ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-600'
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  draft.isFullscreen ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </label>

          <div className={`transition-opacity ${draft.isFullscreen ? 'pointer-events-none opacity-40' : ''}`}>
            <label className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Window Resolution
            </label>
            <div className="flex flex-wrap gap-1 rounded-lg border border-gray-700 bg-gray-950 p-1">
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
                  onMouseEnter={() => isMouseMode && onMouseFocus(idx + 4)}
                  className={`focus-idx-${idx + 4} rounded-md px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                    (draft.displayResolution === resolution.value && ![4, 5, 6, 7, 8].some(isFocused)) || isFocused(idx + 4)
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {resolution.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[9px] italic text-gray-500">
              Note: These only apply in windowed mode. Fullscreen uses your primary monitor resolution.
            </p>
          </div>

          <div>
            <label className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Fullscreen Density
            </label>
            <div className="flex flex-wrap gap-1 rounded-lg border border-gray-700 bg-gray-950 p-1">
              {([
                { value: 'auto', label: 'Auto' },
                { value: 'compact', label: 'Compact' },
                { value: 'standard', label: 'Standard' },
                { value: 'comfortable', label: 'Comfortable' },
              ] as const).map((density, idx) => (
                <button
                  key={density.value}
                  onClick={() => setField('fullscreenDensity', density.value)}
                  onMouseEnter={() => isMouseMode && onMouseFocus(idx + 9)}
                  className={`focus-idx-${idx + 9} rounded-md px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                    (draft.fullscreenDensity === density.value && ![9, 10, 11, 12].some(isFocused)) || isFocused(idx + 9)
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {density.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[9px] italic text-gray-500">
              Auto keeps fullscreen layouts tighter on high-DPI and 4K displays. Compact shows more content; Comfortable keeps larger artwork and spacing.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Mouse & Interaction</div>
        <div className="space-y-6 rounded-xl border border-gray-700 bg-gray-800/50 p-5">
          {[
            {
              key: 'mouseHoverSelection' as const,
              index: 13,
              title: '🖱️ Mouse Hover Selection',
              description:
                'Automatically focus items when the mouse pointer moves over them. Turn off if your mouse is too sensitive.',
            },
            {
              key: 'scrollNavigation' as const,
              index: 14,
              title: '💎 Scroll Wheel Navigation',
              description: 'Use the mouse scroll button (wheel) to move up and down through menu items.',
            },
            {
              key: 'menuSoundEffects' as const,
              index: 15,
              title: '🔊 Menu Sound Effects',
              description: 'Play UI and menu navigation sounds while moving around the frontend.',
            },
            {
              key: 'bigBoxAnimateVertical' as const,
              index: 16,
              title: '↕️ BigBox Vertical Animation',
              description: 'Enable smooth sliding animations when swapping between game rails in BigBox mode.',
              withBorder: true,
            },
          ].map((item) => (
            <label
              key={item.key}
              className={`group flex cursor-pointer items-center justify-between ${item.withBorder ? 'border-t border-gray-800 pt-6' : ''}`}
            >
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-white">{item.title}</div>
                <div className="mt-1 max-w-sm text-[10px] text-gray-400">{item.description}</div>
              </div>
              <button
                onClick={() => setField(item.key, !draft[item.key])}
                onMouseEnter={() => isMouseMode && onMouseFocus(item.index)}
                className={`focus-idx-${item.index} relative ml-6 h-6 w-12 shrink-0 rounded-full transition-colors ${
                  (draft[item.key] && !isFocused(item.index)) || isFocused(item.index)
                    ? 'bg-blue-600 ring-2 ring-blue-400'
                    : 'bg-gray-600'
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    draft[item.key] ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>
          ))}
        </div>
      </div>
    </>
  );
}
