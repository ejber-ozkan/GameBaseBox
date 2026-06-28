import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchScreenScraper } from '../lib/screenscraper';
import { searchTheGamesDB } from '../lib/thegamesdb';

type MockFetch = ReturnType<typeof vi.fn>;

describe('Scraper Libraries', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  describe('ScreenScraper', () => {
    it('maps ScreenScraper JSON response correctly', async () => {
      const mockResponse = {
        jeu: {
          id: '123',
          nom: 'Test Game',
          noms: [{ langue: 'en', nom: 'English Name' }],
          synopsis: [{ langue: 'en', synopsis: 'A cool game.' }],
          medias: [
            { type: 'titlescreen', url: 'http://example.com/title.jpg', format: 'jpg' }
          ]
        }
      };

      (fetch as MockFetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await searchScreenScraper('user', 'pass', 'testgame');
      expect(result).not.toBeNull();
      expect(result?.name).toBe('English Name');
      expect(result?.media[0].url).toBe('http://example.com/title.jpg');
    });

    it('returns null on API error', async () => {
      (fetch as MockFetch).mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
        text: async () => 'Not Found',
      });

      const result = await searchScreenScraper('user', 'pass', 'badgame');
      expect(result).toBeNull();
    });
  });

  describe('TheGamesDB', () => {
    it('maps TheGamesDB response and fetches images', async () => {
      const mockGameResponse = {
        code: 200,
        data: {
          games: [{ id: '99', game_title: 'C64 Legend' }]
        }
      };

      const mockImgResponse = {
        data: {
          base_url: { original: 'http://images.net/' },
          images: {
            '99': [{ id: 'img1', type: 'fanart', filename: 'art.png' }]
          }
        }
      };

      (fetch as MockFetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGameResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockImgResponse,
        });

      const result = await searchTheGamesDB('apikey', 'C64 Legend');
      expect(result).not.toBeNull();
      expect(result.game_title).toBe('C64 Legend');
      expect(result.images).toHaveLength(1);
      expect(result.base_url).toBe('http://images.net/');
    });
  });
});
