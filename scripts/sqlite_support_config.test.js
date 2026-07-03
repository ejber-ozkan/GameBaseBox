import { describe, expect, test } from 'vitest';
import { getPlatformImportConfig } from './sqlite_support_config.js';

describe('sqlite_support_config', () => {
  test('defines ZX Spectrum GameBaseZX and SpeccyMania import defaults', () => {
    const config = getPlatformImportConfig('zxspectrum');

    expect(config.displayName).toBe('ZX Spectrum');
    expect(config.sourceMdbName).toBe('Sinclair ZX Spectrum v6.mdb');
    expect(config.referenceMdbPath).toBe(
      'E:\\Backups\\RETRO-BACKUPS\\ZXSpectrum\\Sinclair ZX Spectrum v6\\Sinclair ZX Spectrum v6.mdb',
    );
    expect(config.aliases).toEqual(['GameBaseZX', 'SpeccyMania']);
    expect(config.requiredFolders).toEqual([
      'extrasPath',
      'gamesPath',
      'screenshotsPath',
      'photosPath',
      'musicPath',
    ]);
    expect(config.musicExtensions).toEqual(['.ay']);
    expect(config.launchExtensions).toEqual(expect.arrayContaining(['.tzx', '.tap', '.z80', '.sna']));
  });

  test('defines Atari ST import defaults', () => {
    const config = getPlatformImportConfig('atarist');

    expect(config.displayName).toBe('Atari ST');
    expect(config.sourceMdbName).toBe('Atari ST.mdb');
    expect(config.requiredFolders).toEqual(['extrasPath', 'gamesPath', 'screenshotsPath', 'musicPath']);
    expect(config.musicExtensions).toEqual([]);
    expect(config.launchExtensions).toEqual(expect.arrayContaining(['.st', '.msa', '.stx', '.dim']));
  });

  test('defines Commodore VIC-20 import defaults', () => {
    const config = getPlatformImportConfig('vic20');

    expect(config.displayName).toBe('Commodore VIC-20');
    expect(config.sourceMdbName).toBe('Commodore VIC-20.mdb');
    expect(config.requiredFolders).toEqual(['extrasPath', 'gamesPath', 'screenshotsPath', 'musicPath']);
    expect(config.musicExtensions).toEqual([]);
    expect(config.launchExtensions).toEqual(expect.arrayContaining(['.d64', '.t64', '.tap', '.prg', '.crt']));
  });
});
