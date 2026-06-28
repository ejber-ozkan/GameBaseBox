/**
 * thegamesdb.ts
 *
 * TheGamesDB.net API V1 integration.
 * API Docs: https://api.thegamesdb.net/
 */

const BASE_URL = 'https://api.thegamesdb.net/v1/';
const C64_PLATFORM_ID = '40'; // Common ID for Commodore 64

export interface TheGamesDBImage {
  id: string;
  type: string;
  filename: string;
}

export interface TheGamesDBResult {
  id: string;
  game_title: string;
  release_date: string;
  developer: string;
  images?: TheGamesDBImage[];
  base_url?: string;
}

interface TheGamesDBGameLookupResponse {
  code?: number;
  data?: {
    games?: TheGamesDBResult[];
  };
}

interface TheGamesDBImageLookupResponse {
  data?: {
    base_url?: {
      original?: string;
    };
    images?: Record<string, TheGamesDBImage[]>;
  };
}

export async function searchTheGamesDB(
  apiKey: string,
  gameName: string
): Promise<TheGamesDBResult | null> {
  if (!apiKey) return null;

  try {
    const params = new URLSearchParams({
      apikey: apiKey,
      name: gameName,
      platform: C64_PLATFORM_ID,
    });

    const response = await fetch(`${BASE_URL}Games/ByGameName?${params}`);
    if (!response.ok) return null;

    const data = await response.json() as TheGamesDBGameLookupResponse;
    if (data.code !== 200 || !data.data?.games?.length) return null;

    const game = data.data.games[0];
    
    // Also fetch images for this game
    const imgParams = new URLSearchParams({
      apikey: apiKey,
      games_id: game.id,
    });
    
    const imgResponse = await fetch(`${BASE_URL}Games/Images?${imgParams}`);
    if (imgResponse.ok) {
       const imgData = await imgResponse.json() as TheGamesDBImageLookupResponse;
       game.images = imgData.data?.images?.[game.id] || [];
       game.base_url = imgData.data?.base_url?.original || '';
    }

    return game;
  } catch (err) {
    console.error('TheGamesDB fetch error:', err);
    return null;
  }
}
