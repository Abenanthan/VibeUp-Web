import type { Song } from '../types';

const WORKER_BASE = 'https://jiosaavn-api.abenanthan-p-2024-cse.workers.dev/';
const LRCLIB_BASE_URL = 'https://lrclib.net/';

export interface LyricLine {
  timeMs: number;
  text: string;
}

export interface LyricsData {
  synced: boolean;
  instrumental: boolean;
  plainLyrics?: string;
  syncedLyrics?: LyricLine[];
}

// ─── DTO → Song mapper (worker API shape — matches SongMapper.kt) ─────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapWorkerDto(dto: any): Song {
  const imageUrl =
    Array.isArray(dto.image) && dto.image.length > 0
      ? dto.image[dto.image.length - 1].url
      : typeof dto.image === 'string'
      ? dto.image
      : '';
  const audioUrl =
    Array.isArray(dto.downloadUrl) && dto.downloadUrl.length > 0
      ? dto.downloadUrl[dto.downloadUrl.length - 1].url
      : typeof dto.downloadUrl === 'string'
      ? dto.downloadUrl
      : '';

  let artist = 'Unknown Artist';
  if (dto.artists?.primary?.length > 0) {
    artist = dto.artists.primary.map((a: { name: string }) => a.name).join(', ');
  } else if (typeof dto.primaryArtists === 'string' && dto.primaryArtists) {
    artist = dto.primaryArtists;
  }

  const albumName = dto.album?.name ?? (typeof dto.album === 'string' ? dto.album : '');
  return {
    id: dto.id ?? '',
    title: dto.name ?? dto.title ?? 'Unknown Title',
    artist,
    album: albumName || 'Unknown Album',
    duration: Number(dto.duration) || 0,
    imageUrl,
    audioUrl,
    language: dto.language ?? '',
  };
}

// ─── DTO → Song mapper for direct JioSaavn API (matches JioSaavnDirectMapper.kt) ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDirectDto(dto: any): Song {
  let imageUrl = '';
  if (Array.isArray(dto.image)) {
    const last = dto.image[dto.image.length - 1];
    imageUrl = last?.link || last?.url || '';
  } else if (typeof dto.image === 'string') {
    // Replace low-quality thumbnails with high-quality
    imageUrl = dto.image.replace('150x150', '500x500').replace('50x50', '500x500');
  }

  let audioUrl = '';
  if (Array.isArray(dto.downloadUrl)) {
    const last = dto.downloadUrl[dto.downloadUrl.length - 1];
    audioUrl = last?.link || last?.url || '';
  }

  let artist = 'Unknown Artist';
  const pArtists = dto.more_info?.artistMap?.primary_artists;
  if (pArtists?.length > 0) {
    artist = pArtists.map((a: { name: string }) => a.name).join(', ');
  } else if (dto.more_info?.primary_artists) {
    artist = dto.more_info.primary_artists;
  } else if (dto.subtitle) {
    artist = dto.subtitle.split(' - ')[0] || dto.subtitle;
  }

  return {
    id: dto.id ?? '',
    title: dto.title || dto.name || 'Unknown Title',
    artist,
    album: dto.more_info?.album || dto.album?.name || 'Unknown Album',
    duration: parseInt(String(dto.more_info?.duration ?? dto.duration ?? '0'), 10),
    imageUrl,
    audioUrl, // Can be empty "" — AudioContext.tsx automatically calls getSongById before playing!
    language: dto.more_info?.language || dto.language || '',
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Safe JSON fetch — returns null on any error
async function safeFetch(url: string): Promise<unknown> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

// Extract unique song IDs from JioSaavn autocomplete response
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractIdsFromAutocomplete(json: any): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  const add = (pid: string) => {
    if (pid && !seen.has(pid)) { seen.add(pid); ids.push(pid); }
  };

  json?.topquery?.data?.forEach((item: { type: string; id: string }) => {
    if (item.type === 'song') add(item.id);
  });
  json?.songs?.data?.forEach((item: { id: string }) => add(item.id));
  json?.albums?.data?.forEach((item: { song_pids?: string }) => {
    item.song_pids?.split(',').forEach(add);
  });

  return ids;
}

// ─── Public API ───────────────────────────────────────────────────────────────
export const saavnApi = {
  /**
   * Search algorithm that exactly mirrors Android's SongRepositoryImpl.kt:
   * 1. Calls directApi.searchSongs with languages=english,hindi,punjabi,tamil,telugu
   * 2. Maps to domain WITHOUT filtering out audioUrl (Android sets audioUrl="" and resolves via getSongById when played)
   * 3. Filters out tribute/instrumental/lofi/karaoke/mashup/remix/cover and sorts by exact/prefix match
   * 4. If direct API returns empty (gating/CORS), falls back to autocomplete IDs + worker getSongByIds, OR worker search.
   */
  searchSongs: async (query: string, limit = 20): Promise<Song[]> => {
    if (!query || !query.trim()) return [];
    const cleaned = cleanQuery(query);
    const enc = encodeURIComponent(cleaned);

    try {
      // ── Step 1: direct JioSaavn search (exact Android call) ─────────────────
      const searchParams = new URLSearchParams({
        '__call': 'search.getResults',
        '_format': 'json',
        '_marker': '0',
        'api_version': '4',
        'ctx': 'web6dot0',
        'q': cleaned,
        'n': String(limit),
        'p': '0',
        'languages': 'english,hindi,punjabi,tamil,telugu',
      });

      const searchUrl = `/jiosaavn-search?${searchParams}`;

      const searchJson = await safeFetch(searchUrl) as Record<string, unknown> | null;

      let directSongs: Song[] = [];
      if (searchJson) {
        let dtos: unknown[] = [];
        if (Array.isArray((searchJson as { results?: unknown[] }).results)) {
          dtos = (searchJson as { results: unknown[] }).results;
        } else {
          dtos = Object.entries(searchJson)
            .filter(([k]) => !isNaN(Number(k)))
            .map(([, v]) => v);
        }
        // Map all items — DO NOT drop items with empty audioUrl (`!s.audioUrl`)
        directSongs = dtos.map(mapDirectDto).filter((s) => s.id);
      }

      if (directSongs.length > 0) {
        const filteredResults = directSongs.filter((song) => {
          const titleLower = song.title.toLowerCase();
          return !(
            titleLower.includes('tribute') ||
            titleLower.includes('instrumental') ||
            titleLower.includes('lofi') ||
            titleLower.includes('karaoke') ||
            titleLower.includes('mashup') ||
            titleLower.includes('remix') ||
            titleLower.includes('cover')
          );
        }).sort((a, b) => getSortScore(b, query, cleaned) - getSortScore(a, query, cleaned));

        return (filteredResults.length === 0 ? directSongs : filteredResults).slice(0, limit);
      }

      // ── Step 2: Fallback to autocomplete + batch fetch IDs (works reliably when direct search is gated) ──
      const acUrl = `/jiosaavn-search?__call=autocomplete.get&_format=json&_marker=0&api_version=4&ctx=web6dot0&query=${enc}`;
      const acJson = await safeFetch(acUrl);

      let songIds = acJson ? extractIdsFromAutocomplete(acJson) : [];

      if (songIds.length > 0) {
        songIds = [...new Set(songIds)].slice(0, Math.min(limit, 20));
        const songsJson = await safeFetch(
          `${WORKER_BASE}api/songs?ids=${songIds.join(',')}`
        ) as { success?: boolean; data?: unknown[] } | null;

        if (songsJson?.success && songsJson.data) {
          const mapped = songsJson.data.map(mapWorkerDto).filter((s) => s.id);
          if (mapped.length > 0) return mapped;
        }
      }

      // ── Step 3: Fallback to Worker search with languages injected ───────────
      const workerJson = await safeFetch(
        `${WORKER_BASE}api/search/songs?query=${enc}&limit=${limit}&languages=english,hindi,punjabi,tamil,telugu`
      ) as { data?: { results?: unknown[] } } | null;

      if (workerJson?.data?.results?.length) {
        const workerSongs = workerJson.data.results.map(mapWorkerDto).filter((s) => s.id);
        const filteredWorker = workerSongs.filter((song) => {
          const titleLower = song.title.toLowerCase();
          return !(
            titleLower.includes('tribute') ||
            titleLower.includes('instrumental') ||
            titleLower.includes('lofi') ||
            titleLower.includes('karaoke') ||
            titleLower.includes('mashup') ||
            titleLower.includes('remix') ||
            titleLower.includes('cover')
          );
        }).sort((a, b) => getSortScore(b, query, cleaned) - getSortScore(a, query, cleaned));
        return (filteredWorker.length === 0 ? workerSongs : filteredWorker).slice(0, limit);
      }

      return [];
    } catch (err) {
      console.error('[search] Unexpected error:', err);
      return [];
    }
  },

  /**
   * Mirrors exact getSearchSuggestions from Android SongRepositoryImpl.kt
   */
  getSearchSuggestions: async (query: string): Promise<string[]> => {
    if (!query || !query.trim()) return [];
    try {
      const cleaned = cleanQuery(query);
      const enc = encodeURIComponent(cleaned);
      const acUrl = `/jiosaavn-search?__call=autocomplete.get&_format=json&_marker=0&api_version=4&ctx=web6dot0&query=${enc}`;
      const response = await safeFetch(acUrl) as any;

      if (!response) return [];
      const suggestions: string[] = [];

      response.topquery?.data?.forEach((item: { title?: string }) => {
        if (item.title) suggestions.push(item.title);
      });
      response.songs?.data?.forEach((item: { title?: string }) => {
        if (item.title) suggestions.push(item.title);
      });
      response.albums?.data?.forEach((item: { title?: string }) => {
        if (item.title) suggestions.push(item.title);
      });

      return [...new Set(suggestions.map((s) => s.trim()).filter(Boolean))].slice(0, 10);
    } catch (e) {
      console.error('getSearchSuggestions error:', e);
      return [];
    }
  },

  /**
   * Mirrors exact getTopSearches from Android SongRepositoryImpl.kt
   */
  getTopSearches: async (): Promise<string[]> => {
    try {
      const url = `/jiosaavn-search?__call=content.getTopSearches&_format=json&_marker=0&api_version=4&ctx=web6dot0`;
      const response = await safeFetch(url) as any;
      if (Array.isArray(response)) {
        return [...new Set(response.map((item: any) => item.title?.trim()).filter(Boolean))].slice(0, 10);
      }
      return [];
    } catch (e) {
      console.error('getTopSearches error:', e);
      return [];
    }
  },

  getSongById: async (id: string): Promise<Song | null> => {
    const json = await safeFetch(`${WORKER_BASE}api/songs?ids=${id}`) as {
      success?: boolean; data?: unknown[];
    } | null;
    if (json?.success && json.data?.[0]) return mapWorkerDto(json.data[0]);
    return null;
  },

  getSongsByIds: async (ids: string[]): Promise<Song[]> => {
    if (ids.length === 0) return [];
    const json = await safeFetch(
      `${WORKER_BASE}api/songs?ids=${ids.join(',')}`
    ) as { success?: boolean; data?: unknown[] } | null;
    if (json?.success && json.data) return json.data.map(mapWorkerDto).filter((s) => s.id);
    return [];
  },
};

// ─── LRC Lyrics ──────────────────────────────────────────────────────────────

function parseLrc(lrcText: string): LyricLine[] {
  const lines = lrcText.split('\n');
  const result: LyricLine[] = [];
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
  for (const line of lines) {
    const m = regex.exec(line.trim());
    if (m) {
      const min = parseInt(m[1], 10);
      const sec = parseInt(m[2], 10);
      const msStr = m[3];
      const text = m[4].trim();
      const msMultiplier = msStr.length === 2 ? 10 : 1;
      const timeMs = min * 60000 + sec * 1000 + parseInt(msStr, 10) * msMultiplier;
      result.push({ timeMs, text });
    }
  }
  return result.sort((a, b) => a.timeMs - b.timeMs);
}

function cleanArtist(artist: string): string {
  return artist
    .split(/[,&&|]|\b(feat|ft|by)\b/gi)[0]
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim();
}

function cleanTitle(title: string): string {
  return title
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/- From ".*?"/g, '')
    .replace(/- .*?$/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim();
}

function cleanQuery(query: string): string {
  if (!query) return '';
  let cleaned = query.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '');
  cleaned = cleaned.replace(/[-:_]/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned || query;
}

function getSortScore(song: Song, query: string, cleanedQuery: string): number {
  const title = song.title.toLowerCase().replace(/’/g, "'");
  const artist = song.artist.toLowerCase().replace(/’/g, "'");
  const album = (song.album || '').toLowerCase().replace(/’/g, "'");
  const qLower = query.toLowerCase().trim().replace(/’/g, "'");
  const clLower = cleanedQuery.toLowerCase().trim().replace(/’/g, "'");

  let score = 0;

  if (title === clLower) {
    score += 30;
  } else if (title.startsWith(clLower)) {
    score += 20;
  } else if (title.includes(clLower)) {
    score += 10;
  }

  if (title.includes(qLower) || album.includes(qLower)) {
    score += 100;
  } else {
    const origWords = qLower.split(/\s+/).filter(w => w.length > 2);
    const cleanWords = clLower.split(/\s+/);
    const extraWords = origWords.filter(w => !cleanWords.includes(w));
    
    extraWords.forEach(word => {
      if (title.includes(word)) score += 15;
      if (album.includes(word)) score += 10;
      if (artist.includes(word)) score += 5;
    });
  }

  return score;
}

const LOCAL_STORAGE_PREFIX = 'vibeup_lyrics_';

async function fetchLrcData(url: string, isSearch = false): Promise<LyricsData | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    if (isSearch) {
      if (Array.isArray(json) && json.length > 0) return processLrcResponse(json[0]);
      return null;
    }
    return processLrcResponse(json);
  } catch {
    return null;
  }
}

export const lyricsApi = {
  fetchLyrics: async (
    artist: string,
    title: string,
    _album?: string,
    songId?: string
  ): Promise<LyricsData> => {
    if (songId) {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_PREFIX + songId);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && (parsed.syncedLyrics || parsed.plainLyrics || parsed.instrumental)) {
            return parsed;
          }
        }
      } catch { /* ignore */ }
    }

    try {
      const cArtist = cleanArtist(artist);
      const cTitle = cleanTitle(title);

      const exactUrl = `${LRCLIB_BASE_URL}api/get?artist_name=${encodeURIComponent(cArtist)}&track_name=${encodeURIComponent(cTitle)}`;
      let data = await fetchLrcData(exactUrl, false);

      if (!data || (!data.syncedLyrics && !data.plainLyrics && !data.instrumental)) {
        const searchUrl = `${LRCLIB_BASE_URL}api/search?artist_name=${encodeURIComponent(cArtist)}&track_name=${encodeURIComponent(cTitle)}`;
        data = await fetchLrcData(searchUrl, true);
      }

      const result = data ?? { synced: false, instrumental: false };

      if (songId && (result.syncedLyrics || result.plainLyrics || result.instrumental)) {
        try {
          localStorage.setItem(LOCAL_STORAGE_PREFIX + songId, JSON.stringify(result));
        } catch { /* ignore */ }
      }

      return result;
    } catch (err) {
      console.error('Lyrics fetch error:', err);
      return { synced: false, instrumental: false };
    }
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function processLrcResponse(data: any): LyricsData {
  if (data.instrumental) return { synced: false, instrumental: true };
  if (data.syncedLyrics) {
    const lines = parseLrc(data.syncedLyrics);
    if (lines.length > 0) {
      return {
        synced: true,
        instrumental: false,
        syncedLyrics: lines,
        plainLyrics: data.plainLyrics ?? lines.map((l) => l.text).join('\n'),
      };
    }
  }
  if (data.plainLyrics) {
    return { synced: false, instrumental: false, plainLyrics: data.plainLyrics };
  }
  return { synced: false, instrumental: false };
}
