import type { EditableSettings, ContentNavProps } from './types';
import { ThemedToggle } from './ThemedToggle';

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
  return (
    <div className="flex flex-col gap-5">
      <div className="mb-1 text-xs font-bold uppercase tracking-widest text-theme-text-muted font-mono">Content Filters</div>
      <div className="flex flex-col gap-4 rounded-theme-xl border border-theme-outline-variant bg-theme-surface/30 p-5">
        <label className="group flex cursor-pointer items-center justify-between">
          <div>
            <div className="flex items-center gap-2 font-semibold text-theme-text">🔞 Hide Adult Content</div>
            <div className="mt-1 max-w-sm text-xs text-theme-text-muted">
              Hides games marked as adult in the Gamebase64 database (223 games). This includes titles like
              &quot;Sex Games&quot;, &quot;Blue Angel 69&quot;, etc. Recommended to keep ON.
            </div>
          </div>
          <ThemedToggle label="Hide Adult Content" checked={draft.hideAdultContent} onChange={() => setField('hideAdultContent', !draft.hideAdultContent)} onMouseEnter={() => isMouseMode && onMouseFocus(0)} focusClassName="focus-idx-0" focused={isFocused(0)} large />
        </label>
      </div>
      <p className="text-xs text-theme-text-muted">
        Adult content filter is applied globally whenever you browse or search games. It uses the official Gamebase64
        Adult flag field. Toggling requires hitting &quot;Save Configuration&quot; to take effect.
      </p>
    </div>
  );
}

