import type { Song } from '../types';

const JIOSAAVN_BASE_URL = 'https://jiosaavn-api.abenanthan-p-2024-cse.workers.dev/';
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

// Map api responses to our domain Song model
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDtoToSong(dto: any): Song {
  const imageUrl = dto.image && dto.image.length > 0 
    ? dto.image[dto.image.length - 1].url 
    : '';
  const audioUrl = dto.downloadUrl && dto.downloadUrl.length > 0 
    ? dto.downloadUrl[dto.downloadUrl.length - 1].url 
    : '';

  // Get primary artist names
  let artist = 'Unknown Artist';
  if (dto.artists && dto.artists.primary && dto.artists.primary.length > 0) {
    artist = dto.artists.primary.map((a: { name: string }) => a.name).join(', ');
  } else if (dto.artist) {
    artist = dto.artist;
  }

  return {
    id: dto.id || '',
    title: dto.name || dto.title || 'Unknown Title',
    artist: artist,
    album: dto.album?.name || dto.album || 'Unknown Album',
    duration: dto.duration || 0,
    imageUrl: imageUrl,
    audioUrl: audioUrl,
    language: dto.language || ''
  };
}

export const saavnApi = {
  searchSongs: async (query: string, limit = 20): Promise<Song[]> => {
    try {
      const response = await fetch(`${JIOSAAVN_BASE_URL}api/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`);
      const json = await response.json();
      if (json.success && json.data && json.data.results) {
        const songs = json.data.results.map(mapDtoToSong);
        
        // Filter out covers, tributes, remixes by default just like the Android app
        const queryLower = query.toLowerCase().trim();
        const filtered = songs.filter((song: Song) => {
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
        });

        // Sort match relevance
        const sorted = filtered.sort((a: Song, b: Song) => {
          const aTitle = a.title.toLowerCase();
          const bTitle = b.title.toLowerCase();
          const aIndex = aTitle === queryLower ? 2 : aTitle.startsWith(queryLower) ? 1 : 0;
          const bIndex = bTitle === queryLower ? 2 : bTitle.startsWith(queryLower) ? 1 : 0;
          return bIndex - aIndex;
        });

        return sorted.length > 0 ? sorted : songs;
      }
      return [];
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  },

  getSongById: async (id: string): Promise<Song | null> => {
    try {
      const response = await fetch(`${JIOSAAVN_BASE_URL}api/songs?ids=${id}`);
      const json = await response.json();
      if (json.success && json.data && json.data.length > 0) {
        return mapDtoToSong(json.data[0]);
      }
      return null;
    } catch (error) {
      console.error('Get song by ID error:', error);
      return null;
    }
  },

  getSongsByIds: async (ids: string[]): Promise<Song[]> => {
    if (ids.length === 0) return [];
    try {
      const response = await fetch(`${JIOSAAVN_BASE_URL}api/songs?ids=${ids.join(',')}`);
      const json = await response.json();
      if (json.success && json.data) {
        return json.data.map(mapDtoToSong);
      }
      return [];
    } catch (error) {
      console.error('Get songs by IDs error:', error);
      return [];
    }
  }
};

// LRC lyrics helper
function parseLrc(lrcText: string): LyricLine[] {
  const lines = lrcText.split('\n');
  const result: LyricLine[] = [];
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

  for (const line of lines) {
    const match = regex.exec(line.trim());
    if (match) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const msStr = match[3];
      const text = match[4].trim();

      const msMultiplier = msStr.length === 2 ? 10 : 1;
      const timeMs = (min * 60000) + (sec * 1000) + (parseInt(msStr, 10) * msMultiplier);

      result.push({ timeMs, text });
    }
  }

  return result.sort((a, b) => a.timeMs - b.timeMs);
}

// Clean details to improve lyrics lookup successrate
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

const LOCAL_STORAGE_PREFIX = 'vibeup_lyrics_';

async function fetchLrcData(url: string, isSearch = false): Promise<LyricsData | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    if (isSearch) {
      if (Array.isArray(json) && json.length > 0) {
        return processLrcResponse(json[0]);
      }
      return null;
    }
    return processLrcResponse(json);
  } catch {
    return null;
  }
}

export const lyricsApi = {
  fetchLyrics: async (artist: string, title: string, _album?: string, songId?: string): Promise<LyricsData> => {
    // 1. Check local persistent storage cache
    if (songId) {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_PREFIX + songId);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && (parsed.syncedLyrics || parsed.plainLyrics || parsed.instrumental)) {
            return parsed;
          }
        }
      } catch (e) {
        // Ignore cache read errors
      }
    }

    try {
      const cArtist = cleanArtist(artist);
      const cTitle = cleanTitle(title);

      // Try cleaned exact match (1st request)
      const exactUrl = `${LRCLIB_BASE_URL}api/get?artist_name=${encodeURIComponent(cArtist)}&track_name=${encodeURIComponent(cTitle)}`;
      let data = await fetchLrcData(exactUrl, false);

      // If exact match fails, try search endpoint as fallback (2nd request)
      if (!data || (!data.syncedLyrics && !data.plainLyrics && !data.instrumental)) {
        const searchUrl = `${LRCLIB_BASE_URL}api/search?artist_name=${encodeURIComponent(cArtist)}&track_name=${encodeURIComponent(cTitle)}`;
        data = await fetchLrcData(searchUrl, true);
      }

      const result = data || { synced: false, instrumental: false };

      // Cache successful response in localStorage
      if (songId && result && (result.syncedLyrics || result.plainLyrics || result.instrumental)) {
        try {
          localStorage.setItem(LOCAL_STORAGE_PREFIX + songId, JSON.stringify(result));
        } catch (e) {
          // Ignore cache write errors
        }
      }

      return result;
    } catch (error) {
      console.error('Lyrics fetch error:', error);
      return { synced: false, instrumental: false };
    }
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function processLrcResponse(data: any): LyricsData {
  if (data.instrumental) {
    return { synced: false, instrumental: true };
  }
  if (data.syncedLyrics) {
    const lines = parseLrc(data.syncedLyrics);
    if (lines.length > 0) {
      return {
        synced: true,
        instrumental: false,
        syncedLyrics: lines,
        plainLyrics: data.plainLyrics || lines.map(l => l.text).join('\n')
      };
    }
  }
  if (data.plainLyrics) {
    return {
      synced: false,
      instrumental: false,
      plainLyrics: data.plainLyrics
    };
  }
  return { synced: false, instrumental: false };
}
