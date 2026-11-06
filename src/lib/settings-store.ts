/**
 * Persistence for app settings.
 *
 * The backend (settings.json via `save_settings`) is the source of truth in the desktop
 * app; it also derives the folders and programs the backend may access from these
 * settings. localStorage keeps a mirror so the browser dev mode works and an older
 * app version still finds its settings after a rollback. Both copies carry a save
 * time, and loading prefers the newer one.
 */
import { loadBackendSettings, saveBackendSettings } from './tauri-bridge';

export const SETTINGS_STORAGE_KEY = 'gb64_settings';
const SAVED_AT_KEY = '__savedAt';
const BACKEND_SAVE_DELAY_MS = 250;

type StoredSettings = Record<string, unknown>;

let pendingBackendSave: StoredSettings | null = null;
let pendingTimer: ReturnType<typeof setTimeout> | null = null;

function savedAt(value: StoredSettings | null): number {
  const stamp = value?.[SAVED_AT_KEY];
  return typeof stamp === 'number' ? stamp : 0;
}

function withoutStamp(value: StoredSettings): StoredSettings {
  const copy = { ...value };
  delete copy[SAVED_AT_KEY];
  return copy;
}

function readLocalSettings(): StoredSettings | null {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return saved ? (JSON.parse(saved) as StoredSettings) : null;
  } catch (error) {
    console.error('Failed to load settings from localStorage', error);
    return null;
  }
}

/**
 * Returns the newest saved settings (backend or localStorage), or an empty object.
 * When only localStorage has settings (first run of this version), they are copied to
 * the backend.
 */
export async function loadPersistedSettings(): Promise<StoredSettings> {
  const local = readLocalSettings();
  let backend: StoredSettings | null = null;
  try {
    backend = await loadBackendSettings();
  } catch (error) {
    console.error('Failed to load settings from the app', error);
  }

  if (backend && savedAt(backend) >= savedAt(local)) {
    return withoutStamp(backend);
  }
  if (local) {
    if (backend === null || savedAt(local) > savedAt(backend)) {
      scheduleBackendSave({ ...local, [SAVED_AT_KEY]: savedAt(local) || Date.now() });
      void flushSettingsSave();
    }
    return withoutStamp(local);
  }
  return {};
}

function scheduleBackendSave(value: StoredSettings) {
  pendingBackendSave = value;
  if (pendingTimer) clearTimeout(pendingTimer);
  pendingTimer = setTimeout(() => void flushSettingsSave(), BACKEND_SAVE_DELAY_MS);
}

/** Writes any pending backend save now (also used when the window closes). */
export async function flushSettingsSave(): Promise<void> {
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
  }
  const value = pendingBackendSave;
  pendingBackendSave = null;
  if (!value) return;
  try {
    await saveBackendSettings(value);
  } catch (error) {
    console.error('Failed to save settings to the app', error);
  }
}

/** Persists settings: localStorage mirror immediately, backend debounced. */
export function persistSettings(settings: object): void {
  const stamped: StoredSettings = { ...(settings as StoredSettings), [SAVED_AT_KEY]: Date.now() };
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(stamped));
  } catch (error) {
    console.error('Failed to save settings to localStorage', error);
  }
  scheduleBackendSave(stamped);
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => void flushSettingsSave());
}
