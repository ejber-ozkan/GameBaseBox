/**
 * emumovies.ts
 *
 * EmuMovies API integration for downloading video snaps, box art,
 * and other media for C64 games.
 *
 * API Docs: https://emumovies.com/api
 * System Name for C64: "Commodore 64"
 */

const C64_SYSTEM = 'Commodore_64';

let currentSessionId: string | null = null;

export interface EmuMoviesSearchResult {
  id: string;
  name: string;
  mediaType: string;
  url: string;
  previewUrl: string;
}

export async function getVideoSnapUrl(userOrApi: string, apiOrGameName: string, maybeGameName?: string): Promise<string | null> {
  const user = maybeGameName ? userOrApi : '';
  const api = maybeGameName ? apiOrGameName : userOrApi;
  const gameName = maybeGameName ?? apiOrGameName;
  const results = await searchEmuMovies(user, api, gameName, 'Video');
  return results[0]?.url || null;
}

/**
 * Login to EmuMovies to get a session ID.
 */
export async function loginEmuMovies(user: string, api: string): Promise<string> {
  if (!user || !api) {
    throw new Error('EmuMovies credentials missing. Please go to Settings ⚙ -> Art & Info Scraper and enter your EmuMovies Username and Password.');
  }

  
  // Example of the older but common EmuMovies API login
  const url = `https://api.gamesdbase.com/login.aspx?user=${encodeURIComponent(user)}&api=${encodeURIComponent(api)}&product=GBBox`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Login failed: ${response.statusText}`);
  
  const text = await response.text();
  // Typically returns XML: <Results><Sessionid>XYZ</Sessionid></Results>
  // Simple regex parser for MVP
  const match = text.match(/<Sessionid>(.*?)<\/Sessionid>/i);
  if (match && match[1]) {
    currentSessionId = match[1];
    return currentSessionId;
  }
  
  throw new Error('Could not find Sessionid in EmuMovies response');
}

/**
 * Search EmuMovies for media assets.
 */
export async function searchEmuMovies(
  user: string,
  api: string,
  gameName: string,
  mediaType: 'Video' | 'Box_Front' | 'Screenshot' | 'Title_Screenshot' = 'Video'
): Promise<EmuMoviesSearchResult[]> {
  if (!currentSessionId) {
    await loginEmuMovies(user, api);
  }

  const params = new URLSearchParams({
    sessionid: currentSessionId!,
    system: C64_SYSTEM,
    search: gameName,
    mediatype: mediaType,
  });

  const response = await fetch(`https://api.gamesdbase.com/search.aspx?${params}`);
  if (!response.ok) throw new Error(`Search failed: ${response.statusText}`);

  const text = await response.text();
  // Parse XML results <Results><Item><ID>123</ID><Name>Game</Name><URL>...</URL></Item></Results>
  const results: EmuMoviesSearchResult[] = [];
  const itemRegex = /<Item>([\s\S]*?)<\/Item>/gi;
  let match;

  while ((match = itemRegex.exec(text)) !== null) {
    const content = match[1];
    results.push({
      id: content.match(/<ID>(.*?)<\/ID>/i)?.[1] || '',
      name: content.match(/<Name>(.*?)<\/Name>/i)?.[1] || gameName,
      mediaType: mediaType,
      url: content.match(/<URL>(.*?)<\/URL>/i)?.[1] || '',
      previewUrl: content.match(/<PreviewURL>(.*?)<\/PreviewURL>/i)?.[1] || '',
    });
  }

  return results;
}

/**
 * Download a media file from EmuMovies.
 */
export async function downloadEmuMoviesAsset(
  url: string,
  destDir: string,
  filename: string
): Promise<{ success: boolean; localPath?: string; error?: string }> {
  const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

  if (!isTauri) {
    return { success: true, localPath: url };
  }

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const result = await invoke<{ absolute_path: string }>(
      'download_media_asset',
      { url, destDir, filename }
    );
    return { success: true, localPath: result.absolute_path };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
