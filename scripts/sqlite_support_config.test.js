import { describe, expect, test } from 'vitest';
import { getPlatformImportConfig } from './sqlite_support_config.js';

describe('sqlite_support_config', () => {
  test('has empty requiredFolders array for Atari 800 consistent with optional folders setup flow', () => {
    expect(getPlatformImportConfig('atari800').requiredFolders).toEqual([]);
  });

  test('defines ZX Spectrum GameBaseZX and SpeccyMania import defaults', () => {
    const config = getPlatformImportConfig('zxspectrum');

    expect(config.displayName).toBe('ZX Spectrum');
    expect(config.sourceMdbName).toBe('Sinclair ZX Spectrum v6.mdb');
    expect(config.referenceMdbPath).toBe(
      'E:\\Backups\\RETRO-BACKUPS\\ZXSpectrum\\Sinclair ZX Spectrum v6\\Sinclair ZX Spectrum v6.mdb',
    );
    expect(config.aliases).toEqual(expect.arrayContaining(['GameBaseZX', 'SpeccyMania']));
    expect(config.requiredFolders).toEqual([]);
    expect(config.musicExtensions).toEqual(['.ay']);
    expect(config.launchExtensions).toEqual(expect.arrayContaining(['.tzx', '.tap', '.z80', '.sna']));
  });

  test('defines Atari ST import defaults', () => {
    const config = getPlatformImportConfig('atarist');

    expect(config.displayName).toBe('Atari ST');
    expect(config.sourceMdbName).toBe('Atari ST.mdb');
    expect(config.requiredFolders).toEqual([]);
    expect(config.musicExtensions).toEqual([]);
    expect(config.launchExtensions).toEqual(expect.arrayContaining(['.st', '.msa', '.stx', '.dim']));
  });

  test('defines Commodore VIC-20 import defaults', () => {
    const config = getPlatformImportConfig('vic20');

    expect(config.displayName).toBe('Commodore VIC-20');
    expect(config.sourceMdbName).toBe('VIC-20.mdb');
    expect(config.aliases).toEqual(expect.arrayContaining(['VIC-20', 'Commodore VIC-20']));
    expect(config.requiredFolders).toEqual([]);
    expect(config.musicExtensions).toEqual([]);
    expect(config.launchExtensions).toEqual(expect.arrayContaining(['.d64', '.t64', '.tap', '.prg', '.crt']));
  });

  test('defines Amstrad CPC, Apple 2GS, Commodore PET, Atari 5200 and Atari 7800 import defaults', () => {
    const amstrad = getPlatformImportConfig('amstradcpc');
    expect(amstrad.displayName).toBe('Amstrad CPC');
    expect(amstrad.sourceMdbName).toBe('Amstrad CPC.mdb');
    expect(amstrad.musicExtensions).toEqual(['.ay']);

    const apple2gs = getPlatformImportConfig('apple2gs');
    expect(apple2gs.displayName).toBe('Apple 2GS');
    expect(apple2gs.sourceMdbName).toBe('Apple 2GS.mdb');

    const pet = getPlatformImportConfig('pet');
    expect(pet.displayName).toBe('Commodore PET');
    expect(pet.sourceMdbName).toBe('CBM_PET.mdb');

    const atari5200 = getPlatformImportConfig('atari5200');
    expect(atari5200.displayName).toBe('Atari 5200');
    expect(atari5200.sourceMdbName).toBe('Atari 5200.mdb');

    const atari7800 = getPlatformImportConfig('atari7800');
    expect(atari7800.displayName).toBe('Atari 7800');
    expect(atari7800.sourceMdbName).toBe('Atari 7800.mdb');

    const c128 = getPlatformImportConfig('c128');
    expect(c128.displayName).toBe('Commodore 128');
    expect(c128.sourceMdbName).toBe('C128.mdb');
    expect(c128.musicExtensions).toEqual(['.sid']);
  });


  test('normalizes user-facing VIC-20 platform names to the canonical import config', () => {
    expect(getPlatformImportConfig('VIC-20')).toBe(getPlatformImportConfig('vic20'));
    expect(getPlatformImportConfig('Commodore VIC-20')).toBe(getPlatformImportConfig('vic20'));
    expect(getPlatformImportConfig('Commodore VIC 20')).toBe(getPlatformImportConfig('vic20'));
  });
});
