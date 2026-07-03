import { describe, expect, test } from 'vitest';
import {
  ATARI800_REFERENCE_MDB_PATH,
  EMBEDDED_EMULATION_PLATFORM_IDS,
  PLATFORM_EMULATOR_PROFILES,
  PLATFORM_PROFILES,
  SUPPORTED_PLATFORMS,
  createDefaultPlatformSettings,
  isPlatformId,
  supportsEmbeddedEmulation,
  hasMusicCapability,
  hasPhotosCapability,
  hasScreenshotsCapability,
  hasExtrasCapability,
  hasVideosCapability,
} from './platform-capabilities';

describe('platform-capabilities', () => {
  test('registers all importable platform profiles', () => {
    expect(SUPPORTED_PLATFORMS.map((platform) => platform.id)).toEqual([
      'c64',
      'atari800',
      'atari2600',
      'zxspectrum',
      'bbcmicro',
      'amiga',
      'atarist',
      'vic20',
    ]);
  });

  test('defines Atari 800 import, media, launch, and emulator capabilities', () => {
    const atari800 = PLATFORM_PROFILES.atari800;

    expect(atari800.status).toBe('available');
    expect(atari800.importStatus).toBe('notImported');
    expect(atari800.folderTypes).toEqual(['games', 'music', 'photos', 'screenshots', 'extras']);
    expect(atari800.mediaCapabilities.music).toBe('sap');
    expect(atari800.defaultEmulatorProfileId).toBe('retroarch-atari800');
    expect(atari800.supportedEmulatorProfileIds).toContain('altirra-atari800');
    expect(atari800.launchExtensions).toEqual(
      expect.arrayContaining(['.atr', '.cas', '.xex', '.bin', '.m3u', '.zip']),
    );
    expect(PLATFORM_PROFILES.c64.launchExtensions).not.toEqual(expect.arrayContaining(['.cas', '.xex']));
    expect(ATARI800_REFERENCE_MDB_PATH).toContain('Atari 800 v12.mdb');
  });

  test('defines Atari 2600 as an importable RetroArch platform', () => {
    const atari2600 = PLATFORM_PROFILES.atari2600;

    expect(atari2600.status).toBe('available');
    expect(atari2600.importStatus).toBe('notImported');
    expect(atari2600.folderTypes).toEqual(['games', 'screenshots', 'extras']);
    expect(atari2600.mediaCapabilities.music).toBe('none');
    expect(atari2600.defaultEmulatorProfileId).toBe('retroarch-atari2600');
    expect(atari2600.supportedEmulatorProfileIds).toEqual(['retroarch-atari2600']);
    expect(atari2600.launchExtensions).toEqual(expect.arrayContaining(['.a26', '.bin', '.rom', '.zip']));
  });

  test('defines ZX Spectrum GameBase import and AY music capabilities', () => {
    const zxspectrum = PLATFORM_PROFILES.zxspectrum;

    expect(zxspectrum.displayName).toBe('ZX Spectrum');
    expect(zxspectrum.status).toBe('available');
    expect(zxspectrum.importStatus).toBe('notImported');
    expect(zxspectrum.folderTypes).toEqual(['extras', 'games', 'screenshots', 'photos', 'music']);
    expect(zxspectrum.mediaCapabilities.music).toBe('ay');
    expect(zxspectrum.defaultEmulatorProfileId).toBe('retroarch-zxspectrum');
    expect(zxspectrum.supportedEmulatorProfileIds).toEqual(['retroarch-zxspectrum', 'spectaculator-zxspectrum']);
    expect(PLATFORM_EMULATOR_PROFILES['spectaculator-zxspectrum'].displayName).toBe('Spectaculator');
    expect(zxspectrum.launchExtensions).toEqual(
      expect.arrayContaining(['.tzx', '.tap', '.z80', '.sna', '.trd', '.dsk', '.zip']),
    );
  });

  test('defines BBC Micro GameBase import folders and emulator capabilities', () => {
    const bbcMicro = PLATFORM_PROFILES.bbcmicro;

    expect(bbcMicro.displayName).toBe('Acorn BBC Micro');
    expect(bbcMicro.status).toBe('available');
    expect(bbcMicro.importStatus).toBe('notImported');
    expect(bbcMicro.folderTypes).toEqual(['extras', 'games', 'screenshots', 'music']);
    expect(bbcMicro.mediaCapabilities.music).toBe('generic');
    expect(bbcMicro.defaultEmulatorProfileId).toBe('retroarch-bbcmicro');
    expect(bbcMicro.supportedEmulatorProfileIds).toEqual(['retroarch-bbcmicro', 'beebem-bbcmicro']);
    expect(PLATFORM_EMULATOR_PROFILES['beebem-bbcmicro'].displayName).toBe('BeebEm');
    expect(bbcMicro.launchExtensions).toEqual(
      expect.arrayContaining(['.ssd', '.dsd', '.uef', '.rom', '.zip', '.7z']),
    );
  });

  test('defines Commodore Amiga GameBase import folders and emulator capabilities', () => {
    const amiga = PLATFORM_PROFILES.amiga;

    expect(amiga.displayName).toBe('Commodore Amiga');
    expect(amiga.status).toBe('available');
    expect(amiga.importStatus).toBe('notImported');
    expect(amiga.folderTypes).toEqual(['extras', 'games', 'screenshots', 'music']);
    expect(amiga.mediaCapabilities.music).toBe('generic');
    expect(amiga.defaultEmulatorProfileId).toBe('retroarch-amiga');
    expect(amiga.supportedEmulatorProfileIds).toEqual(['retroarch-amiga', 'winuae-amiga']);
    expect(PLATFORM_EMULATOR_PROFILES['winuae-amiga'].displayName).toBe('WinUAE / UAE');
    expect(amiga.launchExtensions).toEqual(
      expect.arrayContaining(['.adf', '.adz', '.dms', '.ipf', '.lha', '.hdf', '.zip', '.7z']),
    );
  });

  test('defines Atari ST GameBase import folders and emulator capabilities', () => {
    const atariSt = PLATFORM_PROFILES.atarist;

    expect(atariSt.displayName).toBe('Atari ST');
    expect(atariSt.status).toBe('available');
    expect(atariSt.importStatus).toBe('notImported');
    expect(atariSt.folderTypes).toEqual(['extras', 'games', 'screenshots', 'music']);
    expect(atariSt.mediaCapabilities.music).toBe('generic');
    expect(atariSt.defaultEmulatorProfileId).toBe('retroarch-atarist');
    expect(atariSt.supportedEmulatorProfileIds).toEqual(['retroarch-atarist', 'steem-atarist', 'hatari-atarist']);
    expect(PLATFORM_EMULATOR_PROFILES['steem-atarist'].displayName).toBe('STeem');
    expect(PLATFORM_EMULATOR_PROFILES['hatari-atarist'].displayName).toBe('Hatari');
    expect(atariSt.launchExtensions).toEqual(
      expect.arrayContaining(['.st', '.msa', '.stx', '.dim', '.ipf', '.zip', '.7z']),
    );
  });

  test('defines Commodore VIC-20 GameBase import folders and emulator capabilities', () => {
    const vic20 = PLATFORM_PROFILES.vic20;

    expect(vic20.displayName).toBe('Commodore VIC-20');
    expect(vic20.status).toBe('available');
    expect(vic20.importStatus).toBe('notImported');
    expect(vic20.folderTypes).toEqual(['extras', 'games', 'screenshots', 'music']);
    expect(vic20.mediaCapabilities.music).toBe('generic');
    expect(vic20.defaultEmulatorProfileId).toBe('retroarch-vic20');
    expect(vic20.supportedEmulatorProfileIds).toEqual(['retroarch-vic20', 'vice-vic20']);
    expect(PLATFORM_EMULATOR_PROFILES['vice-vic20'].displayName).toBe('VICE VIC-20');
    expect(vic20.launchExtensions).toEqual(
      expect.arrayContaining(['.d64', '.t64', '.tap', '.prg', '.crt', '.a0', '.20', '.zip', '.7z']),
    );
  });

  test('keeps SID and in-app emulation scoped to C64', () => {
    expect(PLATFORM_PROFILES.c64.mediaCapabilities.music).toBe('sid');
    expect(PLATFORM_PROFILES.c64.inAppEmulation).toBe(true);
    expect(PLATFORM_PROFILES.atari800.inAppEmulation).toBe(false);
    expect(PLATFORM_PROFILES.zxspectrum.inAppEmulation).toBe(false);
    expect(PLATFORM_PROFILES.bbcmicro.inAppEmulation).toBe(false);
    expect(PLATFORM_PROFILES.amiga.inAppEmulation).toBe(false);
    expect(PLATFORM_PROFILES.atarist.inAppEmulation).toBe(false);
    expect(PLATFORM_PROFILES.vic20.inAppEmulation).toBe(false);
    expect(PLATFORM_EMULATOR_PROFILES['altirra-atari800'].platformId).toBe('atari800');
  });

  test('lists platforms with embedded emulator support explicitly', () => {
    expect(EMBEDDED_EMULATION_PLATFORM_IDS).toEqual(['c64']);
    expect(supportsEmbeddedEmulation('c64')).toBe(true);
    expect(supportsEmbeddedEmulation('atari800')).toBe(false);
    expect(supportsEmbeddedEmulation('atari2600')).toBe(false);
    expect(supportsEmbeddedEmulation('zxspectrum')).toBe(false);
    expect(supportsEmbeddedEmulation('bbcmicro')).toBe(false);
    expect(supportsEmbeddedEmulation('amiga')).toBe(false);
    expect(supportsEmbeddedEmulation('atarist')).toBe(false);
    expect(supportsEmbeddedEmulation('vic20')).toBe(false);
  });

  test('creates platform settings from profile defaults', () => {
    const settings = createDefaultPlatformSettings('atari800');

    expect(settings.library.platformId).toBe('atari800');
    expect(settings.library.importStatus).toBe('notImported');
    expect(settings.emulator.preferredEmulatorProfileId).toBe('retroarch-atari800');
    expect(settings.navigation.lastFocusedIndex).toBe(0);
  });

  test('validates known platform identifiers', () => {
    expect(isPlatformId('c64')).toBe(true);
    expect(isPlatformId('atari800')).toBe(true);
    expect(isPlatformId('zxspectrum')).toBe(true);
    expect(isPlatformId('bbcmicro')).toBe(true);
    expect(isPlatformId('amiga')).toBe(true);
    expect(isPlatformId('atarist')).toBe(true);
    expect(isPlatformId('vic20')).toBe(true);
  });

  test('validates platform capability query helpers', () => {

    expect(hasMusicCapability('c64')).toBe(true);
    expect(hasMusicCapability('atari800')).toBe(true);
    expect(hasMusicCapability('atari2600')).toBe(false);
    expect(hasMusicCapability('zxspectrum')).toBe(true);
    expect(hasMusicCapability('bbcmicro')).toBe(true);
    expect(hasMusicCapability('amiga')).toBe(true);
    expect(hasMusicCapability('atarist')).toBe(true);
    expect(hasMusicCapability('vic20')).toBe(true);

    expect(hasPhotosCapability('c64')).toBe(true);
    expect(hasPhotosCapability('atari800')).toBe(true);
    expect(hasPhotosCapability('atari2600')).toBe(false);
    expect(hasPhotosCapability('zxspectrum')).toBe(true);
    expect(hasPhotosCapability('bbcmicro')).toBe(false);
    expect(hasPhotosCapability('amiga')).toBe(false);
    expect(hasPhotosCapability('atarist')).toBe(false);
    expect(hasPhotosCapability('vic20')).toBe(false);

    expect(hasScreenshotsCapability('c64')).toBe(true);
    expect(hasScreenshotsCapability('atari800')).toBe(true);
    expect(hasScreenshotsCapability('atari2600')).toBe(true);
    expect(hasScreenshotsCapability('zxspectrum')).toBe(true);
    expect(hasScreenshotsCapability('bbcmicro')).toBe(true);
    expect(hasScreenshotsCapability('amiga')).toBe(true);
    expect(hasScreenshotsCapability('atarist')).toBe(true);
    expect(hasScreenshotsCapability('vic20')).toBe(true);

    expect(hasExtrasCapability('c64')).toBe(true);
    expect(hasExtrasCapability('atari800')).toBe(true);
    expect(hasExtrasCapability('atari2600')).toBe(true);
    expect(hasExtrasCapability('zxspectrum')).toBe(true);
    expect(hasExtrasCapability('bbcmicro')).toBe(true);
    expect(hasExtrasCapability('amiga')).toBe(true);
    expect(hasExtrasCapability('atarist')).toBe(true);
    expect(hasExtrasCapability('vic20')).toBe(true);

    expect(hasVideosCapability('c64')).toBe(true);
    expect(hasVideosCapability('atari800')).toBe(false);
    expect(hasVideosCapability('atari2600')).toBe(false);
    expect(hasVideosCapability('zxspectrum')).toBe(false);
    expect(hasVideosCapability('bbcmicro')).toBe(false);
    expect(hasVideosCapability('amiga')).toBe(false);
    expect(hasVideosCapability('atarist')).toBe(false);
    expect(hasVideosCapability('vic20')).toBe(false);
  });
});
