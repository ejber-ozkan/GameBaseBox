import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const backend = vi.hoisted(() => ({
  load: vi.fn<() => Promise<Record<string, unknown> | null>>(),
  save: vi.fn<(settings: Record<string, unknown>) => Promise<void>>(),
}));

vi.mock('./tauri-bridge', () => ({
  loadBackendSettings: backend.load,
  saveBackendSettings: backend.save,
}));

import { flushSettingsSave, loadPersistedSettings, persistSettings, SETTINGS_STORAGE_KEY } from './settings-store';

describe('settings-store', () => {
  beforeEach(() => {
    localStorage.clear();
    backend.load.mockReset().mockResolvedValue(null);
    backend.save.mockReset().mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await flushSettingsSave();
    vi.useRealTimers();
  });

  it('prefers backend settings when they are at least as new as localStorage', async () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ themeId: 'local', __savedAt: 10 }));
    backend.load.mockResolvedValue({ themeId: 'backend', __savedAt: 20 });

    expect(await loadPersistedSettings()).toEqual({ themeId: 'backend' });
    expect(backend.save).not.toHaveBeenCalled();
  });

  it('copies localStorage-only settings to the backend on first run', async () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ themeId: 'arcade-void' }));

    expect(await loadPersistedSettings()).toEqual({ themeId: 'arcade-void' });
    await flushSettingsSave();
    expect(backend.save).toHaveBeenCalledWith(expect.objectContaining({ themeId: 'arcade-void' }));
  });

  it('uses a newer localStorage copy (for example after a crash before the backend save)', async () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ themeId: 'newer', __savedAt: 30 }));
    backend.load.mockResolvedValue({ themeId: 'older', __savedAt: 20 });

    expect(await loadPersistedSettings()).toEqual({ themeId: 'newer' });
  });

  it('mirrors to localStorage immediately and debounces backend saves', async () => {
    vi.useFakeTimers();
    persistSettings({ themeId: 'a' });
    persistSettings({ themeId: 'b' });

    expect(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY)!)).toMatchObject({ themeId: 'b' });
    expect(backend.save).not.toHaveBeenCalled();

    await vi.runAllTimersAsync();
    expect(backend.save).toHaveBeenCalledTimes(1);
    expect(backend.save).toHaveBeenCalledWith(expect.objectContaining({ themeId: 'b' }));
  });

  it('falls back to localStorage when the backend cannot be read', async () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ themeId: 'c64-edition' }));
    backend.load.mockRejectedValue(new Error('unavailable'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(await loadPersistedSettings()).toEqual({ themeId: 'c64-edition' });
  });
});
