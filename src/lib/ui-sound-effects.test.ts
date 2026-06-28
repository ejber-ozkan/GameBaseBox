import { describe, expect, test, vi } from 'vitest';
import {
  canPlayUiSoundEffects,
  clearUiSoundEffectCache,
  getNextRotatingUiSoundEffect,
  getUiSoundEffectUrl,
} from './ui-sound-effects';

describe('ui sound effects helpers', () => {
  test('builds urls under the public sfx directory', () => {
    expect(getUiSoundEffectUrl('menu-move-1')).toBe('/sfx/menu-move-1.mp3');
    expect(getUiSoundEffectUrl('menu-move-1.mp3')).toBe('/sfx/menu-move-1.mp3');
  });

  test('detects mp3 support through Audio.canPlayType', () => {
    const originalAudio = globalThis.Audio;
    const canPlayType = vi.fn().mockReturnValue('probably');
    // @ts-expect-error test shim
    globalThis.Audio = class {
      canPlayType = canPlayType;
    };

    expect(canPlayUiSoundEffects()).toBe(true);
    expect(canPlayType).toHaveBeenCalledWith('audio/mpeg');

    globalThis.Audio = originalAudio;
    clearUiSoundEffectCache();
  });

  test('rotates through sequence filenames using localStorage state', () => {
    // happy-dom does not expose window.localStorage in this test worker;
    // stub it with a minimal in-memory Map so the rotation logic is exerciseable.
    const store = new Map<string, string>();
    const localStorageStub = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
    };
    vi.stubGlobal('localStorage', localStorageStub);

    expect(getNextRotatingUiSoundEffect('launch', ['a.mp3', 'b.mp3'])).toBe('a.mp3');
    expect(getNextRotatingUiSoundEffect('launch', ['a.mp3', 'b.mp3'])).toBe('b.mp3');
    expect(getNextRotatingUiSoundEffect('launch', ['a.mp3', 'b.mp3'])).toBe('a.mp3');

    vi.unstubAllGlobals();
  });
});
