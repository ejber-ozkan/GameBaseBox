import { describe, expect, test, vi, beforeEach } from 'vitest';
import {
  getExtraFilename,
  getAmigaArchiveDownloadUrl,
  isAmigaDownloadableExtra,
  checkAmigaExtraExists,
  downloadAmigaExtra,
} from './amiga-scraper';
import * as bridge from './tauri-bridge';

describe('amiga-scraper', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  test('extracts filename from extra path', () => {
    expect(getExtraFilename({ id: '1', name: 'WHDLoad', path: 'WHDLoad\\T\\Turrican2_v1.7_0029.zip' })).toBe('Turrican2_v1.7_0029.zip');
    expect(getExtraFilename({ id: '2', name: 'SPS', path: 'SPS/1/0029_Turrican II - The Final Fight.zip' })).toBe('0029_Turrican II - The Final Fight.zip');
  });

  test('derives WHDLoad Archive.org download URL with encoding', () => {
    const whdExtra = { id: '1', name: 'WHDLoad', path: 'WHDLoad\\1\\1000Miglia_v1.1b.zip' };
    expect(getAmigaArchiveDownloadUrl(whdExtra)).toBe(
      'https://archive.org/download/Amiga_WHD_Games/1000Miglia_v1.1b.zip'
    );
  });

  test('derives SPS Archive.org download URL with spaces encoded', () => {
    const spsExtra = { id: '2', name: 'SPS', path: 'SPS\\1\\0029_Turrican II - The Final Fight.zip' };
    expect(getAmigaArchiveDownloadUrl(spsExtra)).toBe(
      'https://archive.org/download/commodore-amiga-games-sps/0029_Turrican%20II%20-%20The%20Final%20Fight.zip'
    );
  });

  test('validates downloadable Amiga extras only for Amiga platform', () => {
    const whdExtra = { id: '1', name: 'WHDLoad', path: 'WHDLoad\\T\\Turrican2.zip' };
    const docExtra = { id: '2', name: 'Manual', path: 'Docs\\manual.pdf' };

    expect(isAmigaDownloadableExtra(whdExtra, 'amiga')).toBe(true);
    expect(isAmigaDownloadableExtra(whdExtra, 'c64')).toBe(false);
    expect(isAmigaDownloadableExtra(docExtra, 'amiga')).toBe(false);
  });

  test('checks extra existence via resolveMediaPath', async () => {
    const spy = vi.spyOn(bridge, 'resolveMediaPath').mockResolvedValueOnce({
      exists: true,
      absolute_path: 'E:/Extras/WHDLoad/T/Turrican2.zip',
    });

    const exists = await checkAmigaExtraExists('E:/Extras', 'WHDLoad/T/Turrican2.zip');
    expect(exists).toBe(true);
    expect(spy).toHaveBeenCalledWith('E:/Extras', 'WHDLoad/T/Turrican2.zip');
  });

  test('checks extra existence with Extras/ fallback when direct path fails', async () => {
    const spy = vi.spyOn(bridge, 'resolveMediaPath')
      .mockResolvedValueOnce({ exists: false, absolute_path: 'E:/Base/SPS/1/0002.zip' })
      .mockResolvedValueOnce({ exists: true, absolute_path: 'E:/Base/Extras/SPS/1/0002.zip' });

    const exists = await checkAmigaExtraExists('E:/Base', 'SPS/1/0002.zip');
    expect(exists).toBe(true);
    expect(spy).toHaveBeenNthCalledWith(1, 'E:/Base', 'SPS/1/0002.zip');
    expect(spy).toHaveBeenNthCalledWith(2, 'E:/Base', 'Extras/SPS/1/0002.zip');
  });

  test('checks extra existence with unpartitioned subpath fallback', async () => {
    const spy = vi.spyOn(bridge, 'resolveMediaPath')
      .mockResolvedValueOnce({ exists: false, absolute_path: 'E:/Base/WHDLoad/M/MagicPockets.zip' })
      .mockResolvedValueOnce({ exists: false, absolute_path: 'E:/Base/Extras/WHDLoad/M/MagicPockets.zip' })
      .mockResolvedValueOnce({ exists: false, absolute_path: 'E:/Base/extras/WHDLoad/M/MagicPockets.zip' })
      .mockResolvedValueOnce({ exists: true, absolute_path: 'E:/Base/WHDLoad/MagicPockets.zip' });

    const exists = await checkAmigaExtraExists('E:/Base', 'WHDLoad/M/MagicPockets.zip');
    expect(exists).toBe(true);
    expect(spy).toHaveBeenCalled();
  });

  test('checks extra existence in gamesPath if extrasPath fails', async () => {
    const spy = vi.spyOn(bridge, 'resolveMediaPath')
      .mockResolvedValueOnce({ exists: false, absolute_path: 'E:/Extras/WHDLoad/M/MagicPockets.zip' })
      .mockResolvedValueOnce({ exists: true, absolute_path: 'E:/Games/WHDLoad/M/MagicPockets.zip' });

    const exists = await checkAmigaExtraExists('E:/Extras', 'WHDLoad/M/MagicPockets.zip', 'E:/Games');
    expect(exists).toBe(true);
    expect(spy).toHaveBeenCalled();
  });

  test('downloads extra via downloadMediaAsset with relative path preserved', async () => {
    const spy = vi.spyOn(bridge, 'downloadMediaAsset').mockResolvedValueOnce({
      exists: true,
      absolute_path: 'E:/Extras/WHDLoad/1/1000Miglia_v1.1b.zip',
    });

    const whdExtra = { id: '1', name: 'WHDLoad', path: 'WHDLoad\\1\\1000Miglia_v1.1b.zip' };
    const result = await downloadAmigaExtra(whdExtra, 'E:/Extras');

    expect(result.exists).toBe(true);
    expect(spy).toHaveBeenCalledWith(
      'https://archive.org/download/Amiga_WHD_Games/1000Miglia_v1.1b.zip',
      'E:/Extras',
      'WHDLoad/1/1000Miglia_v1.1b.zip'
    );
  });

  test('downloads extra to temp folder when downloadTarget is temp', async () => {
    const spy = vi.spyOn(bridge, 'downloadMediaAsset').mockResolvedValueOnce({
      exists: true,
      absolute_path: 'E:/Extras/.gbbox-temp/WHDLoad/1/1000Miglia_v1.1b.zip',
    });

    const whdExtra = { id: '1', name: 'WHDLoad', path: 'WHDLoad\\1\\1000Miglia_v1.1b.zip' };
    const result = await downloadAmigaExtra(whdExtra, 'E:/Extras', 'temp');

    expect(result.exists).toBe(true);
    expect(spy).toHaveBeenCalledWith(
      'https://archive.org/download/Amiga_WHD_Games/1000Miglia_v1.1b.zip',
      'E:/Extras',
      '.gbbox-temp/WHDLoad/1/1000Miglia_v1.1b.zip'
    );
  });

  test('resolves SPS files by SPS ID code in brackets', async () => {
    // Mock global fetch for Archive.org metadata API
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        result: [
          { name: 'Commando (1989)(Elite)[0002].zip' },
          { name: 'Turrican II - The Final Fight (1991)(Rainbow Arts)[0029].zip' },
        ],
      }),
    } as Response);

    const spsExtra = { id: '2', name: 'SPS', path: 'SPS\\1\\0002_Commando.zip' };
    const { resolveAmigaArchiveDownloadUrl } = await import('./amiga-scraper');
    const url = await resolveAmigaArchiveDownloadUrl(spsExtra);

    expect(url).toBe(
      'https://archive.org/download/commodore-amiga-games-sps/Commando%20(1989)(Elite)%5B0002%5D.zip'
    );
    expect(mockFetch).toHaveBeenCalled();
  });
});
