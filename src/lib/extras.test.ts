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

  test('detects Amiga WHDLoad and SPS extras as launchable variants', () => {
    const whdExtra = { id: '9', name: 'WHDLoad', path: 'WHDLoad\\T\\Turrican2_v1.7_0029.zip', type: '1' };
    const spsExtra = { id: '10', name: 'SPS', path: 'SPS\\1\\0029_Turrican II - The Final Fight.zip', type: '1' };
    const docExtra = { id: '11', name: 'Instructions', path: 'Instructions\\T\\Turrican II.txt', type: '0' };

    expect(isLaunchableExtra(whdExtra, 'amiga')).toBe(true);
    expect(isLaunchableExtra(spsExtra, 'amiga')).toBe(true);
    expect(isLaunchableExtra(docExtra, 'amiga')).toBe(false);

    expect(getExtraLaunchLabel(whdExtra, 'amiga')).toBe('Launch WHDLoad');
    expect(getExtraLaunchLabel(spsExtra, 'amiga')).toBe('Launch SPS');

    const grouped = groupExtras([whdExtra, spsExtra, docExtra], 'amiga');
    expect(grouped.find((g) => g.category === 'games')?.items).toHaveLength(2);
    expect(grouped.find((g) => g.category === 'docs')?.items).toHaveLength(1);
  });

  test('detects Atari ST STX preservation disks and HardDisk extras as launchable variants', () => {
    const stxExtra = { id: '20', name: 'Original Disk', path: 'STX\\Goldrunner.zip', type: '1' };
    const hdExtra = { id: '21', name: 'HardDisk (GEM)', path: 'HardDisk\\GOLDRUNR.ZIP', type: '1' };
    const hdOldExtra = { id: '22', name: 'HardDisk (Old)', path: 'HDOLD\\GOLDRUNR.ZIP', type: '1' };
    const docExtra = { id: '23', name: 'Instructions', path: 'Instructions\\G\\Goldrunner.pdf', type: '0' };
    const scanExtra = { id: '24', name: 'Boxscan - Front', path: 'Boxscans\\G\\Goldrunner - front.jpg', type: '0' };
    const diskscanExtra1 = { id: '25', name: 'Diskscan 1', path: 'Diskscans\\A\\Afterburner - diskscan 1.jpg', type: '0' };
    const diskscanExtra2 = { id: '26', name: 'Diskscan 2', path: 'Diskscans\\A\\Afterburner - diskscan 2.jpg', type: '0' };
    const cheatExtra = { id: '27', name: 'Cheat', path: 'Cheats\\A\\Afterburner - cheat.jpg', type: '0' };
    const reviewExtra = { id: '28', name: 'Review', path: 'Reviews\\A\\Afterburner - review.txt', type: '0' };

    expect(isLaunchableExtra(stxExtra, 'atarist')).toBe(true);
    expect(isLaunchableExtra(hdExtra, 'atarist')).toBe(true);
    expect(isLaunchableExtra(hdOldExtra, 'atarist')).toBe(true);
    expect(isLaunchableExtra(docExtra, 'atarist')).toBe(false);
    expect(isLaunchableExtra(scanExtra, 'atarist')).toBe(false);
    expect(isLaunchableExtra(diskscanExtra1, 'atarist')).toBe(false);
    expect(isLaunchableExtra(diskscanExtra2, 'atarist')).toBe(false);
    expect(isLaunchableExtra(cheatExtra, 'atarist')).toBe(false);
    expect(isLaunchableExtra(reviewExtra, 'atarist')).toBe(false);

    // Ensure platform isolation: Atari ST folders are not treated as launchable on C64 or Atari 800
    expect(isLaunchableExtra(stxExtra, 'c64')).toBe(false);
    expect(isLaunchableExtra(hdExtra, 'atari800')).toBe(false);

    expect(getExtraLaunchLabel(stxExtra, 'atarist')).toBe('Launch STX');
    expect(getExtraLaunchLabel(hdExtra, 'atarist')).toBe('Launch HardDisk');

    expect(getVisibleDetailExtraCategories('atarist')).toEqual(['visual', 'docs', 'media']);

    const grouped = groupExtras([
      stxExtra,
      hdExtra,
      docExtra,
      scanExtra,
      diskscanExtra1,
      diskscanExtra2,
      cheatExtra,
      reviewExtra,
    ], 'atarist');

    // Only HardDisk and STX should be in Alternative Versions (games)
    expect(grouped.find((g) => g.category === 'games')?.items).toHaveLength(2);
    // Boxscan, Diskscan 1, Diskscan 2, Cheat JPG should be in visual (Extras gallery)
    expect(grouped.find((g) => g.category === 'visual')?.items).toHaveLength(4);
    // Instructions PDF and Review TXT should be in docs
    expect(grouped.find((g) => g.category === 'docs')?.items).toHaveLength(2);
  });
});

