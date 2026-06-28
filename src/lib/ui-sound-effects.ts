const UI_SFX_BASE_PATH = '/sfx';
const ROTATION_KEY_PREFIX = 'gb64_ui_sfx_rotation_';
const SETTINGS_STORAGE_KEY = 'gb64_settings';

function areMenuSoundEffectsEnabled() {
  if (typeof window === 'undefined') {
    return true;
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return true;
    }

    const parsed = JSON.parse(raw) as { menuSoundEffects?: boolean };
    return parsed.menuSoundEffects ?? true;
  } catch {
    return true;
  }
}

export function getUiSoundEffectUrl(filename: string) {
  if (!filename) {
    return '';
  }

  const normalized = filename.toLowerCase().endsWith('.mp3') ? filename : `${filename}.mp3`;
  return `${UI_SFX_BASE_PATH}/${normalized}`;
}

export function canPlayUiSoundEffects() {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') {
    return false;
  }

  const probe = new Audio();
  return probe.canPlayType('audio/mpeg') !== '';
}

const audioCache = new Map<string, HTMLAudioElement>();

function getAudioElement(filename: string) {
  const url = getUiSoundEffectUrl(filename);
  const cached = audioCache.get(url);

  if (cached) {
    return cached;
  }

  const audio = new Audio(url);
  audio.preload = 'auto';
  audioCache.set(url, audio);
  return audio;
}

export async function playUiSoundEffect(filename: string, volume = 0.7) {
  if (!areMenuSoundEffectsEnabled() || !canPlayUiSoundEffects()) {
    return false;
  }

  const audio = getAudioElement(filename);
  audio.pause();
  audio.currentTime = 0;
  audio.volume = Math.max(0, Math.min(1, volume));

  try {
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

export async function playUiSoundEffectAndWait(filename: string, volume = 0.7) {
  if (!areMenuSoundEffectsEnabled() || !canPlayUiSoundEffects()) {
    return false;
  }

  const audio = getAudioElement(filename);
  audio.pause();
  audio.currentTime = 0;
  audio.volume = Math.max(0, Math.min(1, volume));

  try {
    await audio.play();
  } catch {
    return false;
  }

  await new Promise<void>((resolve) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleEnded);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };

    const handleEnded = () => {
      cleanup();
      resolve();
    };

    audio.addEventListener('ended', handleEnded, { once: true });
    audio.addEventListener('error', handleEnded, { once: true });

    const fallbackMs =
      Number.isFinite(audio.duration) && audio.duration > 0
        ? Math.ceil(audio.duration * 1000) + 250
        : 5000;

    timeoutId = setTimeout(handleEnded, fallbackMs);
  });

  return true;
}

export function getNextRotatingUiSoundEffect(sequenceKey: string, filenames: string[]) {
  if (filenames.length === 0) {
    return null;
  }

  if (typeof window === 'undefined') {
    return filenames[0];
  }

  const storageKey = `${ROTATION_KEY_PREFIX}${sequenceKey}`;
  const currentIndex = Number.parseInt(window.localStorage.getItem(storageKey) ?? '0', 10);
  const safeIndex = Number.isFinite(currentIndex) ? currentIndex : 0;
  const nextFilename = filenames[safeIndex % filenames.length];
  window.localStorage.setItem(storageKey, String((safeIndex + 1) % filenames.length));
  return nextFilename;
}

export async function playRotatingUiSoundEffect(
  sequenceKey: string,
  filenames: string[],
  volume = 0.7,
) {
  const nextFilename = getNextRotatingUiSoundEffect(sequenceKey, filenames);
  if (!nextFilename) {
    return false;
  }

  return playUiSoundEffect(nextFilename, volume);
}

export async function playRotatingUiSoundEffectAndWait(
  sequenceKey: string,
  filenames: string[],
  volume = 0.7,
) {
  const nextFilename = getNextRotatingUiSoundEffect(sequenceKey, filenames);
  if (!nextFilename) {
    return false;
  }

  return playUiSoundEffectAndWait(nextFilename, volume);
}

export function clearUiSoundEffectCache() {
  audioCache.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
  audioCache.clear();
}

/**
 * Test helper — resets the rotation counter stored in localStorage for a
 * given sequence key so tests can start from a known clean state.
 * Not intended for production use.
 */
export function resetRotationState(sequenceKey: string) {
  if (typeof window === 'undefined') return;
  const storageKey = `${ROTATION_KEY_PREFIX}${sequenceKey}`;
  try {
    window.localStorage.setItem(storageKey, '0');
  } catch {
    // localStorage unavailable in this environment — silently skip
  }
}
