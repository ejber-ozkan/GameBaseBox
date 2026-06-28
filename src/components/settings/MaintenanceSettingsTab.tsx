export function MaintenanceSettingsTab() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 opacity-50">
        <h3 className="mb-2 flex items-center gap-2 font-bold text-white">🧼 Database Cleanup</h3>
        <p className="mb-4 text-xs text-gray-400">
          Removes missing file paths and clears cached media entries that no longer exist on disk.
        </p>
        <button disabled className="cursor-not-allowed rounded bg-gray-700 px-4 py-2 text-xs font-bold uppercase text-gray-400">
          Soon...
        </button>
      </div>
    </div>
  );
}
