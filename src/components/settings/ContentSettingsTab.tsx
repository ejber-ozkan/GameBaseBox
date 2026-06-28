import type { EditableSettings, ContentNavProps } from './types';

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
      <div className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-500">Content Filters</div>
      <div className="flex flex-col gap-4 rounded-xl border border-gray-700 bg-gray-800 p-5">
        <label className="group flex cursor-pointer items-center justify-between">
          <div>
            <div className="flex items-center gap-2 font-semibold text-white">🔞 Hide Adult Content</div>
            <div className="mt-1 max-w-sm text-xs text-gray-400">
              Hides games marked as adult in the Gamebase64 database (223 games). This includes titles like
              &quot;Sex Games&quot;, &quot;Blue Angel 69&quot;, etc. Recommended to keep ON.
            </div>
          </div>
          <button
            onClick={() => setField('hideAdultContent', !draft.hideAdultContent)}
            onMouseEnter={() => isMouseMode && onMouseFocus(0)}
            className={`focus-idx-0 relative ml-6 h-7 w-14 shrink-0 rounded-full transition-colors ${
              (draft.hideAdultContent && !isFocused(0)) || isFocused(0) ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-600'
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                draft.hideAdultContent ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
        </label>
      </div>
      <p className="text-xs text-gray-500">
        Adult content filter is applied globally whenever you browse or search games. It uses the official Gamebase64
        Adult flag field. Toggling requires hitting &quot;Save Configuration&quot; to take effect.
      </p>
    </div>
  );
}
