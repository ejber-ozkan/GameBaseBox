import type { EditableSettings, ContentNavProps } from './types';
import { ThemedToggle } from './ThemedToggle';
import { useTheme } from '../../contexts/ThemeContext';

interface InteractionSettingsTabProps extends ContentNavProps {
  draft: EditableSettings;
  setField: <K extends keyof EditableSettings>(key: K, value: EditableSettings[K]) => void;
}

export function InteractionSettingsTab({
  draft,
  setField,
  isMouseMode,
  onMouseFocus,
  isFocused,
}: InteractionSettingsTabProps) {
  const { theme } = useTheme();

  return (
    <div className="flex h-full flex-col justify-start gap-4">
      {/* Title */}
      <div className="text-xs font-bold uppercase tracking-widest text-theme-text-muted font-mono">
        Input & Interaction Preferences
      </div>

      {/* Row of Settings */}
      <div className="flex flex-col gap-4">
        {[
          {
            key: 'mouseHoverSelection' as const,
            index: 0,
            title: '🖱️ Mouse Hover Focus',
            description:
              'Automatically focus list and grid items when the pointer moves over them. Turn off if your mouse is too sensitive.',
          },
          {
            key: 'scrollNavigation' as const,
            index: 1,
            title: '💎 Scroll Wheel Navigation',
            description: 'Navigate up and down through list and menu choices using your mouse scroll wheel.',
          },
          {
            key: 'bigBoxAnimateVertical' as const,
            index: 2,
            title: '↕️ BigBox Rail Animations',
            description: 'Enable smooth sliding transitions when swapping between game rails in BigBox mode.',
          },
        ].map((item) => (
          <div
            key={item.key}
            className={`settings-card p-5 ${theme.effects.steppedBorders ? 'border-2' : 'rounded-theme-xl border'} border-theme-outline-variant bg-theme-surface/30 ${isFocused(item.index) ? 'settings-card-focused' : ''}`}
          >
            <label className="group flex cursor-pointer items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-theme-text">{item.title}</div>
                <div className="mt-1 max-w-xl text-[10px] text-theme-text-muted leading-relaxed">{item.description}</div>
              </div>
              <ThemedToggle
                label={item.title.substring(item.title.indexOf(' ') + 1)}
                checked={draft[item.key]}
                onChange={() => setField(item.key, !draft[item.key])}
                onMouseEnter={() => isMouseMode && onMouseFocus(item.index)}
                focusClassName={`focus-idx-${item.index}`}
                focused={isFocused(item.index)}
              />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
