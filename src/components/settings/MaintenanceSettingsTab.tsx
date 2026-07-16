import { useTheme } from '../../contexts/ThemeContext';

export function MaintenanceSettingsTab() {
  const { theme } = useTheme();

  return (
    <div className="flex flex-col gap-6">
      <div className={`p-6 opacity-50 ${theme.effects.steppedBorders ? 'border-2' : 'rounded-theme-xl border'} border-theme-outline-variant bg-theme-surface/30`}>
        <h3 className="mb-2 flex items-center gap-2 font-bold text-theme-text">🧼 Database Cleanup</h3>
        <p className="mb-4 text-xs text-theme-text-muted">
          Removes missing file paths and clears cached media entries that no longer exist on disk.
        </p>
        <button disabled className={`cursor-not-allowed px-4 py-2 text-xs font-bold uppercase text-theme-text-muted bg-theme-outline-variant ${theme.effects.steppedBorders ? 'border-2 border-theme-outline-variant' : 'rounded-theme'}`}>
          Soon...
        </button>
      </div>
    </div>
  );
}

