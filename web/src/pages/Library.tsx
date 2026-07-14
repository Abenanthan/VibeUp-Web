import React, { useState } from 'react';
import { Play, Plus, Music, Trash2 } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { useAudio } from '../context/AudioContext';
import type { Song, Playlist } from '../types';

interface LibraryProps {
  setCurrentTab: (tab: string) => void;
  setSelectedPlaylistId: (id: string | null) => void;
}

export const Library: React.FC<LibraryProps> = ({
  setCurrentTab,
  setSelectedPlaylistId
}) => {
  const { likedSongs, playlists, deletePlaylist, createPlaylist, addToRecentlyPlayed } = useLibrary();
  const { playSong } = useAudio();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newListName.trim()) {
      const id = createPlaylist(newListName.trim(), newListDesc.trim());
      setNewListName('');
      setNewListDesc('');
      setShowCreateModal(false);
      
      // Open detail page
      setSelectedPlaylistId(id);
      setCurrentTab('playlist-detail');
    }
  };

  const handlePlayLikes = () => {
    if (likedSongs.length > 0) {
      addToRecentlyPlayed(likedSongs[0]);
      playSong(likedSongs[0], likedSongs);
    }
  };

  const handlePlaylistClick = (id: string) => {
    setSelectedPlaylistId(id);
    setCurrentTab('playlist-detail');
  };

  const handlePlayPlaylist = async (playlist: Playlist, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playlist.songIds.length === 0) return;

    // Load songs details from storage
    const playlistSongs: Song[] = [];
    playlist.songIds.forEach((id) => {
      const stored = localStorage.getItem(`vibeup_song_${id}`);
      if (stored) {
        playlistSongs.push(JSON.parse(stored));
      }
    });

    if (playlistSongs.length > 0) {
      addToRecentlyPlayed(playlistSongs[0]);
      playSong(playlistSongs[0], playlistSongs);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 pb-32 h-full text-text-main" style={{ flex: 1, overflowY: 'auto', padding: '32px 24px 128px 24px', height: '100%' }}>
      <h2 className="font-extrabold text-3xl mb-8 tracking-tight">Your Library</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        
        {/* Liked Songs Quick Card */}
        <div
          onClick={() => {
            setSelectedPlaylistId('liked-songs');
            setCurrentTab('playlist-detail');
          }}
          className="lg:col-span-1 rounded-2xl flex flex-col justify-between p-6 cursor-pointer relative overflow-hidden group border border-glass-border/30 hover:border-glass-border transition-all"
          style={{
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED, #2563EB)',
            borderRadius: '16px',
            minHeight: '220px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '24px',
            cursor: 'pointer'
          }}
        >
          {/* Heart icon */}
          <div className="flex items-center justify-between" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="text-4xl">❤️</span>
            {likedSongs.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayLikes();
                }}
                className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl hover:scale-105 transition-transform"
                style={{ border: 'none', cursor: 'pointer', backgroundColor: '#FFFFFF', color: '#000000', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Play size={20} fill="black" className="ml-1" style={{ marginLeft: '4px' }} />
              </button>
            )}
          </div>
          
          <div>
            <h3 className="font-extrabold text-2xl tracking-tight text-white mb-1">Liked Songs</h3>
            <p className="text-xs text-white/70 font-semibold">{likedSongs.length} songs saved</p>
          </div>
        </div>

        {/* Create playlist quick card */}
        <div
          onClick={() => setShowCreateModal(true)}
          className="rounded-2xl border border-dashed border-glass-border/70 hover:border-primary bg-card-hover/10 hover:bg-card-hover/20 flex flex-col justify-center items-center p-6 cursor-pointer transition-all duration-300"
          style={{
            border: '2px dashed rgba(124, 58, 237, 0.3)',
            borderRadius: '16px',
            minHeight: '220px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            padding: '24px'
          }}
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4" style={{ backgroundColor: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.2)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED', marginBottom: '16px' }}>
            <Plus size={24} />
          </div>
          <h4 className="font-bold text-sm text-text-main mb-1">Create Playlist</h4>
          <p className="text-[11px] text-text-muted text-center" style={{ color: '#9CA3AF', fontSize: '11px', textAlign: 'center' }}>Build a custom music list</p>
        </div>
      </div>

      {/* Playlist Grid section */}
      <section className="mb-10" style={{ marginBottom: '40px' }}>
        <h3 className="font-extrabold text-xl tracking-tight mb-4">Playlists</h3>
        {playlists.length === 0 ? (
          <p className="text-sm text-text-dark italic" style={{ color: '#4B5563' }}>No custom playlists created yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                onClick={() => handlePlaylistClick(playlist.id)}
                className="group bg-card-hover/20 hover:bg-card-hover border border-glass-border/30 hover:border-glass-border rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 relative cursor-pointer"
                style={{
                  backgroundColor: 'rgba(26, 26, 58, 0.2)',
                  border: '1px solid rgba(124, 58, 237, 0.08)',
                  borderRadius: '16px',
                  padding: '16px',
                  cursor: 'pointer',
                  minHeight: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                {/* Playlist Cover Icon & Play Button */}
                <div className="flex justify-between items-start" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary" style={{ backgroundColor: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.2)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}>
                    <Music size={20} />
                  </div>

                  {playlist.songIds.length > 0 && (
                    <button
                      onClick={(e) => handlePlayPlaylist(playlist, e)}
                      className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform opacity-0 group-hover:opacity-100"
                      style={{ border: 'none', cursor: 'pointer', backgroundColor: '#7C3AED', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.2s ease' }}
                    >
                      <Play size={16} fill="white" className="ml-0.5" style={{ marginLeft: '2px' }} />
                    </button>
                  )}
                </div>

                {/* Playlist Info */}
                <div className="mt-4 relative" style={{ marginTop: '16px' }}>
                  <h4 className="font-extrabold text-sm truncate pr-6" title={playlist.name}>{playlist.name}</h4>
                  <p className="text-[10px] text-text-muted mt-0.5" style={{ fontSize: '11px', color: '#9CA3AF' }}>{playlist.songIds.length} songs</p>
                  
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${playlist.name}"?`)) {
                        deletePlaylist(playlist.id);
                      }
                    }}
                    className="absolute bottom-0 right-0 opacity-0 group-hover:opacity-100 hover:text-danger text-text-dark p-1 transition-opacity"
                    style={{ position: 'absolute', bottom: 0, right: 0, background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563' }}
                  >
                    <Trash2 size={14} style={{ color: '#EF4444' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Create Playlist Modal (Overlay) */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        >
          <div
            className="bg-card w-full max-w-sm rounded-2xl border border-glass-border p-6 shadow-2xl"
            style={{ backgroundColor: '#12122A', border: '1px solid rgba(124, 58, 237, 0.15)', borderRadius: '16px', width: '100%', maxWidth: '380px' }}
          >
            <h3 className="font-bold text-lg mb-4 text-text-main">Create New Playlist</h3>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Playlist name"
                required
                value={newListName}
                onChange={e => setNewListName(e.target.value)}
                className="w-full bg-card-hover border border-glass-border rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:border-primary"
                style={{ backgroundColor: '#1A1A3A', border: '1px solid rgba(124, 58, 237, 0.15)', borderRadius: '12px', color: '#F3F4F6' }}
              />
              <textarea
                placeholder="Description (optional)"
                value={newListDesc}
                onChange={e => setNewListDesc(e.target.value)}
                className="w-full bg-card-hover border border-glass-border rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:border-primary resize-none h-24"
                style={{ backgroundColor: '#1A1A3A', border: '1px solid rgba(124, 58, 237, 0.15)', borderRadius: '12px', color: '#F3F4F6' }}
              />
              <div className="flex gap-2 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-card-hover text-text-muted"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', borderRadius: '12px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/80 transition-all"
                  style={{ border: 'none', cursor: 'pointer', backgroundColor: '#7C3AED', color: '#FFFFFF', borderRadius: '12px' }}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
