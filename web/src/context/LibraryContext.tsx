import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Song, Playlist } from '../types';

interface LibraryContextType {
  likedSongs: Song[];
  playlists: Playlist[];
  recentlyPlayed: Song[];
  toggleLike: (song: Song) => void;
  isLiked: (songId: string) => boolean;
  createPlaylist: (name: string, description: string) => string;
  deletePlaylist: (playlistId: string) => void;
  renamePlaylist: (playlistId: string, newName: string) => void;
  addSongToPlaylist: (playlistId: string, song: Song) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;
  addToRecentlyPlayed: (song: Song) => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedLikes = localStorage.getItem('vibeup_likes');
      const storedPlaylists = localStorage.getItem('vibeup_playlists');
      const storedRecent = localStorage.getItem('vibeup_recent');

      if (storedLikes) setLikedSongs(JSON.parse(storedLikes));
      if (storedPlaylists) setPlaylists(JSON.parse(storedPlaylists));
      if (storedRecent) setRecentlyPlayed(JSON.parse(storedRecent));
    } catch (e) {
      console.error('Failed to load library from localStorage:', e);
    }
  }, []);

  // Helpers to persist state
  const saveLikes = (likes: Song[]) => {
    setLikedSongs(likes);
    localStorage.setItem('vibeup_likes', JSON.stringify(likes));
  };

  const savePlaylists = (lists: Playlist[]) => {
    setPlaylists(lists);
    localStorage.setItem('vibeup_playlists', JSON.stringify(lists));
  };

  const saveRecent = (recent: Song[]) => {
    setRecentlyPlayed(recent);
    localStorage.setItem('vibeup_recent', JSON.stringify(recent));
  };

  const toggleLike = (song: Song) => {
    const isSongLiked = likedSongs.some(s => s.id === song.id);
    if (isSongLiked) {
      saveLikes(likedSongs.filter(s => s.id !== song.id));
    } else {
      saveLikes([...likedSongs, song]);
    }
  };

  const isLiked = (songId: string) => {
    return likedSongs.some(s => s.id === songId);
  };

  const createPlaylist = (name: string, description: string): string => {
    const id = crypto.randomUUID();
    const newPlaylist: Playlist = {
      id,
      name,
      description,
      createdAt: Date.now(),
      songIds: []
    };
    savePlaylists([...playlists, newPlaylist]);
    return id;
  };

  const deletePlaylist = (playlistId: string) => {
    savePlaylists(playlists.filter(p => p.id !== playlistId));
  };

  const renamePlaylist = (playlistId: string, newName: string) => {
    savePlaylists(
      playlists.map(p => (p.id === playlistId ? { ...p, name: newName } : p))
    );
  };

  const addSongToPlaylist = (playlistId: string, song: Song) => {
    savePlaylists(
      playlists.map(p => {
        if (p.id === playlistId) {
          // Avoid duplicate additions
          if (p.songIds.includes(song.id)) return p;
          
          // Store the song metadata in local storage if not already there,
          // to make sure we can load playlist details even if offline.
          const songKey = `vibeup_song_${song.id}`;
          localStorage.setItem(songKey, JSON.stringify(song));

          return { ...p, songIds: [...p.songIds, song.id] };
        }
        return p;
      })
    );
  };

  const removeSongFromPlaylist = (playlistId: string, songId: string) => {
    savePlaylists(
      playlists.map(p =>
        p.id === playlistId ? { ...p, songIds: p.songIds.filter(id => id !== songId) } : p
      )
    );
  };

  const addToRecentlyPlayed = (song: Song) => {
    // Remove if already exists to push it to the top
    const filtered = recentlyPlayed.filter(s => s.id !== song.id);
    const updated = [song, ...filtered].slice(0, 20); // Limit to top 20
    saveRecent(updated);
  };

  return (
    <LibraryContext.Provider
      value={{
        likedSongs,
        playlists,
        recentlyPlayed,
        toggleLike,
        isLiked,
        createPlaylist,
        deletePlaylist,
        renamePlaylist,
        addSongToPlaylist,
        removeSongFromPlaylist,
        addToRecentlyPlayed
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};
