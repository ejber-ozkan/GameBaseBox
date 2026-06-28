import { describe, expect, test } from 'vitest';
import {
  buildExtraAssetPath,
  getVisibleDetailExtraCategories,
  groupExtras,
  isAtariAdvertExtra,
  isAtariCoverArtExtra,
  supportsAtariExtraCoverArt,
} from './extras';

describe('groupExtras', () => {

  test('groups extras by extension first and then by folder', () => {
    const groups = groupExtras([
      { id: '1', name: 'Cover', path: 'Cover/front.png', type: 'image' },
      { id: '2', name: 'Manual', path: 'Docs/manual.pdf', type: 'doc' },
      { id: '3', name: 'Trailer', path: 'Trailer/clip.mp4', type: 'video' },
      { id: '4', name: 'Tape', path: 'Tapes/game.tap', type: 'game' },
    ]);

    expect(groups.map((group) => group.category)).toEqual(['visual', 'docs', 'media', 'games']);
    expect(groups[0].items[0].name).toBe('Cover');
    expect(groups[3].items[0].name).toBe('Tape');
  });

  test('falls back to documents for unknown extensions and folders', () => {
    const groups = groupExtras([
      { id: '1', name: 'Readme', path: 'Unknown/readme.xyz', type: 'unknown' },
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].category).toBe('docs');
  });

  test('uses folder fallback rules for known folders with unknown extensions', () => {
    const groups = groupExtras([
      { id: '1', name: 'Advert', path: 'Advert/item.custom', type: 'unknown' },
      { id: '2', name: 'Audio', path: 'mp3s/track.custom', type: 'unknown' },
      { id: '3', name: 'Disk', path: 'Disks/game.custom', type: 'unknown' },
    ]);

    expect(groups.map((group) => group.category)).toEqual(['visual', 'media', 'games']);
  });
});

describe('buildExtraAssetPath', () => {
  test('joins simple paths properly', () => {
    expect(buildExtraAssetPath('base', 'file.txt')).toBe('base/file.txt');
  });

  test('strips trailing slashes from base and leading from extra path', () => {
    expect(buildExtraAssetPath('base//', '//file.txt')).toBe('base/file.txt');
  });

  test('normalizes backslashes to forward slashes', () => {
    expect(buildExtraAssetPath('base\\folder\\', '\\sub\\file.txt')).toBe('base/folder/sub/file.txt');
  });

  test('handles empty or null base paths gracefully', () => {
    expect(buildExtraAssetPath('', 'file.txt')).toBe('file.txt');
    expect(buildExtraAssetPath(null, 'file.txt')).toBe('file.txt');
    expect(buildExtraAssetPath(undefined, 'file.txt')).toBe('file.txt');
  });
});
import {
  getExtraExtension,
  getExtraLaunchLabel,
  getExtraSourceLabel,
  isImageExtra,
  isLaunchableExtra,
  isVideoExtra,
} from './extras';

const tapeExtra = { id: '1', name: 'Original Tape', path: 'Tapes\\TigerHeli.tap', type: 'game' };
const imageExtra = { id: '2', name: 'Cover', path: 'Cover/front.png', type: 'image' };
const videoExtra = { id: '3', name: 'Longplay', path: 'Longplays/clip.mp4', type: 'video' };

describe('steam extras helpers', () => {


  test('detects extra types from file extensions', () => {
    expect(getExtraExtension(imageExtra)).toBe('png');
    expect(isImageExtra(imageExtra)).toBe(true);
    expect(isVideoExtra(videoExtra)).toBe(true);
    expect(isVideoExtra(imageExtra)).toBe(false);
  });

  test('derives launch and source labels from folder roots', () => {
    expect(getExtraSourceLabel(tapeExtra)).toBe('Tapes');
    expect(getExtraLaunchLabel(tapeExtra)).toBe('Launch Tape');
    expect(isLaunchableExtra(tapeExtra)).toBe(true);
    expect(isLaunchableExtra(videoExtra)).toBe(false);
  });

  test('covers disk, cart, and default launch labels', () => {
    expect(getExtraLaunchLabel({ id: '4', name: 'Disk', path: 'Disks/game.d64', type: 'game' })).toBe('Launch Disk');
    expect(getExtraLaunchLabel({ id: '5', name: 'Cart', path: 'Carts/game.crt', type: 'game' })).toBe('Launch Cart');
    expect(getExtraLaunchLabel({ id: '6', name: 'Other', path: 'Variants/game.zip', type: 'game' })).toBe('Launch Variant');
  });

  test('treats Atari adverts as visible detail extras', () => {
    const advert = { id: '7', name: 'Magazine Ad', path: 'Adverts/game.pdf', type: 'doc' };

    expect(isAtariAdvertExtra(advert)).toBe(true);
    expect(getVisibleDetailExtraCategories('atari800')).toEqual(['visual', 'docs', 'media']);
  });

  test('treats cover extras as Atari-only box art', () => {
    const cover = { id: '8', name: 'Atari Box', path: 'Covers/game.png', type: 'image' };

    expect(isAtariCoverArtExtra(cover, 'atari800')).toBe(true);
    expect(isAtariCoverArtExtra(cover, 'c64')).toBe(false);
    expect(supportsAtariExtraCoverArt('atari800')).toBe(true);
    expect(supportsAtariExtraCoverArt('c64')).toBe(false);
  });
});
