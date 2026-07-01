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
});
