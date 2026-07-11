import { describe, expect, test } from 'vitest';
import {
  getPlatformLaunchCapabilities,
  getRequiredPlatformFolderKeys,
  normalizePlatformManifestId,
} from './platform-manifest';

describe('platform manifest', () => {
  test('normalizes user-facing aliases to their canonical platform identifier', () => {
    expect(normalizePlatformManifestId('Commodore VIC-20')).toBe('vic20');
  });

  test('defines Atari 800 extras as an import requirement', () => {
    expect(getRequiredPlatformFolderKeys('atari800')).toEqual([
      'gamesPath',
      'musicPath',
      'photosPath',
      'screenshotsPath',
      'extrasPath',
    ]);
  });

  test('makes the desktop launch providers explicit per platform', () => {
    expect(getPlatformLaunchCapabilities('c64', 'desktop')).toEqual(['external', 'embedded']);
    expect(getPlatformLaunchCapabilities('atari800', 'desktop')).toEqual(['external']);
  });
});
