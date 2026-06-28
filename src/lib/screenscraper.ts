/**
 * screenscraper.ts
 *
 * ScreenScraper.fr API V2 integration.
 * API Docs: https://www.screenscraper.fr/api2/
 */

const BASE_URL = 'https://www.screenscraper.fr/api2/jeuInfos.php';
const DEV_ID = 'skraper'; 
const DEV_PASS = 'skraperpw';
const SOFT_NAME = 'Skraper';
const C64_SYSTEM_ID = '1';

export interface ScreenScraperMedia {
  type: string;
  url: string;
  format: string;
}

export interface ScreenScraperResult {
  id: string;
  name: string;
  description: string;
  media: ScreenScraperMedia[];
}

interface ScreenScraperLocalizedName {
  langue?: string;
  nom?: string;
}

interface ScreenScraperSynopsis {
  langue?: string;
  synopsis?: string;
}

interface ScreenScraperMediaResponse {
  type?: string;
  url?: string;
  format?: string;
}

interface ScreenScraperGameResponse {
  id?: string;
  nom?: string;
  noms?: ScreenScraperLocalizedName[];
  synopsis?: ScreenScraperSynopsis[];
  medias?: ScreenScraperMediaResponse[];
}

interface ScreenScraperApiResponse {
  response?: {
    error?: string;
  };
  jeu?: ScreenScraperGameResponse;
}

export async function searchScreenScraper(
  user: string,
  pass: string,
  romName: string,
  devId?: string,
  devPass?: string
): Promise<ScreenScraperResult | null> {
  const finalDevId = devId || DEV_ID;
  const finalDevPass = devPass || DEV_PASS;
  // If custom dev credentials are used, we should probably set softname to something else,
  // but if they are using skraper/recalbox, SOFT_NAME must match.
  // For now, we'll use 'Skraper' if they use the default, or 'GBBox' if they provide their own.
  const finalSoftName = (finalDevId === 'skraper' || finalDevId === 'recalbox') ? SOFT_NAME : 'GBBox';

  const params = new URLSearchParams({
    devid: finalDevId,
    devpassword: finalDevPass,
    softname: finalSoftName,
    output: 'json',
    romnom: romName,
    systemeid: C64_SYSTEM_ID,
    romtype: 'rom',
  });

  if (user && pass) {
    params.append('ssid', user);
    params.append('sspassword', pass);
  }

  try {
    const debugParams = new URLSearchParams(params);
    if (debugParams.has('sspassword')) debugParams.set('sspassword', '********');
    console.log('[ScreenScraper] Fetching:', `${BASE_URL}?${debugParams.toString()}`);

    const response = await fetch(`${BASE_URL}?${params}`);
    if (!response.ok) {
      console.error(`ScreenScraper search failed: HTTP ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error('Response body:', text);
      return null;
    }

    const data = await response.json() as ScreenScraperApiResponse;
    if (data.response?.error) {
       console.error('ScreenScraper API Error:', data.response.error);
       return null;
    }

    const jeu = data.jeu;
    if (!jeu) return null;

    // Map media
    const media: ScreenScraperMedia[] = (jeu.medias || []).map((m) => ({
      type: m.type ?? '',
      url: m.url ?? '',
      format: m.format ?? '',
    }));

    return {
      id: jeu.id ?? '',
      name: jeu.noms?.find((n) => n.langue === 'en')?.nom || jeu.nom || 'Unknown',
      description: jeu.synopsis?.find((s) => s.langue === 'en')?.synopsis || '',
      media,
    };
  } catch (err) {
    console.error('ScreenScraper fetch error:', err);
    return null;
  }
}
