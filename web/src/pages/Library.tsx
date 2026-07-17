import React, { useState } from 'react';
import { Play, Plus, Music2, Trash2, Heart } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { useAudio } from '../context/AudioContext';
import type { Song, Playlist } from '../types';

interface LibraryProps {
  setCurrentTab: (tab: string) => void;
  setSelectedPlaylistId: (id: string | null) => void;
}

export const Library: React.FC<LibraryProps> = ({ setCurrentTab, setSelectedPlaylistId }) => {
  const { likedSongs, playlists, deletePlaylist, createPlaylist, addToRecentlyPlayed } = useLibrary();
  const { playSong } = useAudio();

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      const id = createPlaylist(name.trim(), desc.trim());
      setName(''); setDesc(''); setShowModal(false);
      setSelectedPlaylistId(id); setCurrentTab('playlist-detail');
    }
  };

  const handlePlayLikes = () => {
    if (likedSongs.length > 0) { addToRecentlyPlayed(likedSongs[0]); playSong(likedSongs[0], likedSongs); }
  };

  const handlePlayPlaylist = async (playlist: Playlist, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!playlist.songIds.length) return;
    const songs: Song[] = [];
    playlist.songIds.forEach(id => { const s = localStorage.getItem(`vibeup_song_${id}`); if (s) songs.push(JSON.parse(s)); });
    if (songs.length) { addToRecentlyPlayed(songs[0]); playSong(songs[0], songs); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--bg-hover)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', padding: '10px 13px', fontSize: '13px',
    color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font)', transition: 'border-color 0.15s',
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 28px 100px', height: '100%' }}>

      <header style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.4px', color: 'var(--text-primary)', marginBottom: '3px' }}>Library</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Your saved songs and playlists</p>
      </header>

      {/* Top cards row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '36px' }}>

        {/* Liked Songs */}
        <div
          onClick={() => { setSelectedPlaylistId('liked-songs'); setCurrentTab('playlist-detail'); }}
          style={{ background: 'linear-gradient(135deg, #2a1a00 0%, #4a3000 100%)', border: '1px solid var(--amber-glow)', borderRadius: 'var(--radius-xl)', minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '22px', cursor: 'pointer', transition: 'filter 0.2s, transform 0.2s', position: 'relative', overflow: 'hidden' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1.08)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={20} fill="#0d0c0a" color="#0d0c0a" />
            </div>
            {likedSongs.length > 0 && (
              <button onClick={e => { e.stopPropagation(); handlePlayLikes(); }} style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--amber)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px var(--amber-glow)', transition: 'transform 0.15s, background 0.15s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.background = 'var(--amber-soft)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'var(--amber)'; }}>
                <Play size={17} fill="#0d0c0a" color="#0d0c0a" style={{ marginLeft: '2px' }} />
              </button>
            )}
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '4px', letterSpacing: '-0.3px' }}>Liked Songs</h3>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>{likedSongs.length} songs saved</p>
          </div>
        </div>

        {/* Create playlist */}
        <div
          onClick={() => setShowModal(true)}
          style={{ background: 'var(--bg-elevated)', border: '1px dashed var(--border-medium)', borderRadius: 'var(--radius-xl)', minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', padding: '22px', gap: '14px', transition: 'border-color 0.2s, background 0.2s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--amber)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-medium)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
        >
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'var(--bg-active)', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={20} color="var(--text-secondary)" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>New Playlist</p>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Build a custom collection</p>
          </div>
        </div>
      </div>

      {/* Playlists section */}
      <section>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px', letterSpacing: '-0.1px' }}>Playlists</h3>
        {playlists.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>No playlists yet. Create one to get started.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: '12px' }}>
            {playlists.map(pl => (
              <div
                key={pl.id}
                onClick={() => { setSelectedPlaylistId(pl.id); setCurrentTab('playlist-detail'); }}
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', cursor: 'pointer', minHeight: '170px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'border-color 0.15s, background 0.15s', position: 'relative' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'var(--bg-active)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Music2 size={18} color="var(--text-tertiary)" strokeWidth={1.5} />
                  </div>
                  {pl.songIds.length > 0 && (
                    <button onClick={e => handlePlayPlaylist(pl, e)} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--amber)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s, transform 0.15s' }} onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.05)'; }} onMouseLeave={e => { e.currentTarget.style.opacity = '0'; e.currentTarget.style.transform = 'scale(1)'; }}>
                      <Play size={13} fill="#0d0c0a" color="#0d0c0a" style={{ marginLeft: '2px' }} />
                    </button>
                  )}
                </div>
                <div style={{ marginTop: '14px', position: 'relative' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '20px' }}>{pl.name}</h4>
                  <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '3px' }}>{pl.songIds.length} songs</p>
                  <button
                    onClick={e => { e.stopPropagation(); if (confirm(`Delete "${pl.name}"?`)) deletePlaylist(pl.id); }}
                    style={{ position: 'absolute', bottom: 0, right: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', opacity: 0, transition: 'opacity 0.15s', padding: '2px' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal */}
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '360px', padding: '26px', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>
            <h3 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '5px', color: 'var(--text-primary)' }}>New Playlist</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '18px' }}>Give your playlist a name.</p>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
              <input type="text" placeholder="Playlist name" required autoFocus value={name} onChange={e => setName(e.target.value)} style={inputStyle} onFocus={e => (e.currentTarget.style.borderColor = 'var(--amber)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')} />
              <textarea placeholder="Description (optional)" value={desc} onChange={e => setDesc(e.target.value)} style={{ ...inputStyle, resize: 'none', height: '72px' }} onFocus={e => (e.currentTarget.style.borderColor = 'var(--amber)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')} />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '5px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 500, fontFamily: 'var(--font)' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: 'var(--radius-md)', background: 'var(--amber)', border: 'none', color: '#0d0c0a', cursor: 'pointer', fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font)', transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--amber-soft)')} onMouseLeave={e => (e.currentTarget.style.background = 'var(--amber)')}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
