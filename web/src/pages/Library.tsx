import React, { useState } from 'react';
import { Heart, Plus, ListMusic, MoreVertical, X } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { FadeInView, StaggerContainer, StaggerItem, HoverScale, ModalOverlay } from '../components/motion';

export const Library: React.FC<{
  setCurrentTab: (tab: string) => void;
  setActivePlaylistId: (id: string) => void;
}> = ({ setCurrentTab, setActivePlaylistId }) => {
  const { playlists, likedSongs, createPlaylist, removePlaylist } = useLibrary();
  const [showCreate, setShowCreate] = useState(false);
  const [newPlName, setNewPlName] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleCreate = () => {
    if (newPlName.trim()) { createPlaylist(newPlName.trim()); setNewPlName(''); setShowCreate(false); }
  };

  const getArt = (pl: any) => {
    if (pl.songIds && pl.songIds.length > 0) {
      try {
        const stored = localStorage.getItem(`vibeup_song_${pl.songIds[0]}`);
        if (stored) return JSON.parse(stored).imageUrl;
      } catch (e) {}
    }
    return null;
  };

  return (
    <div onClick={() => setActiveMenu(null)} style={{ flex: 1, overflowY: 'auto', padding: '32px 28px 100px', height: '100%', color: 'var(--text-primary)' }}>

      <FadeInView direction="up" delay={0.1} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.4px', color: 'var(--text-primary)', marginBottom: '3px' }}>Your Library</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Playlists and liked songs</p>
        </div>
      </FadeInView>

      <StaggerContainer style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '16px' }}>

        {/* Liked Songs Card */}
        <StaggerItem>
          <HoverScale scale={1.03} tapScale={0.97}>
            <div onClick={() => { setActivePlaylistId('liked'); setCurrentTab('playlist_detail'); }} style={{ height: '210px', background: 'linear-gradient(135deg, #4f2178 0%, #170d24 100%)', borderRadius: 'var(--radius-lg)', padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', border: '1px solid rgba(124,58,237,0.2)', transition: 'border-color 0.2s, filter 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)'; e.currentTarget.style.filter = 'brightness(1.1)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.2)'; e.currentTarget.style.filter = 'brightness(1)'; }}>
              <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.1, transform: 'rotate(-15deg)' }}>
                <Heart size={140} fill="#fff" />
              </div>
              <div>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', marginBottom: '16px' }}>
                  <Heart size={20} fill="#fff" />
                </div>
              </div>
              <div style={{ position: 'relative', zIndex: 2 }}>
                <h3 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.3px', marginBottom: '6px' }}>Liked Songs</h3>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{likedSongs.length} {likedSongs.length === 1 ? 'song' : 'songs'}</p>
              </div>
            </div>
          </HoverScale>
        </StaggerItem>

        {/* Create Playlist Card */}
        <StaggerItem>
          <HoverScale scale={1.03} tapScale={0.97}>
            <div onClick={() => setShowCreate(true)} style={{ height: '210px', background: 'transparent', borderRadius: 'var(--radius-lg)', padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border-medium)', transition: 'background 0.2s, border-color 0.2s, transform 0.2s', gap: '12px' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'rgba(168, 85, 247, 0.05)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-medium)'; e.currentTarget.style.background = 'transparent'; }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                <Plus size={24} color="var(--amber)" />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)' }}>Create Playlist</h3>
            </div>
          </HoverScale>
        </StaggerItem>

        {/* Custom Playlists */}
        {playlists.map(pl => {
          const art = getArt(pl);
          const menuOpen = activeMenu === pl.id;
          return (
            <StaggerItem key={pl.id}>
              <HoverScale scale={1.03} tapScale={0.97}>
                <div onClick={() => { setActivePlaylistId(pl.id); setCurrentTab('playlist_detail'); }} style={{ height: '210px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', padding: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', transition: 'border-color 0.2s, background 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--amber-dim)'; e.currentTarget.style.background = 'var(--bg-hover)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}>
                  <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: 'var(--radius-md)', background: art ? 'transparent' : 'var(--bg-surface)', marginBottom: '14px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', position: 'relative' }}>
                    {art ? <img src={art} alt={pl.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ListMusic size={32} color="var(--border-medium)" />}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pl.name}</h3>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{pl.songIds.length} {pl.songIds.length === 1 ? 'song' : 'songs'}</p>
                    </div>
                    <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => setActiveMenu(menuOpen ? null : pl.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '2px', display: 'flex', transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}>
                        <MoreVertical size={16} />
                      </button>
                      {menuOpen && (
                        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '5px', zIndex: 10, minWidth: '130px', boxShadow: '0 12px 32px rgba(0,0,0,0.6)' }}>
                          <button onClick={() => { removePlaylist(pl.id); setActiveMenu(null); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 10px', borderRadius: '7px', color: 'var(--danger)', fontSize: '12px', fontWeight: 500, fontFamily: 'var(--font)' }}>Delete playlist</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </HoverScale>
            </StaggerItem>
          );
        })}

      </StaggerContainer>

      {/* Create Playlist Modal */}
      {showCreate && (
        <ModalOverlay onClose={() => setShowCreate(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-lg)', padding: '28px', width: '90vw', maxWidth: '380px', boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>New Playlist</h3>
              <HoverScale scale={1.1} tapScale={0.9}>
                <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}><X size={18} /></button>
              </HoverScale>
            </div>
            <input
              type="text"
              autoFocus
              placeholder="My awesome playlist"
              value={newPlName}
              onChange={e => setNewPlName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowCreate(false); }}
              style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '12px 14px', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'var(--font)', outline: 'none', marginBottom: '24px', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--amber)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border-medium)'}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <HoverScale scale={1.05} tapScale={0.95}>
                <button onClick={() => setShowCreate(false)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '9px 18px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)' }}>Cancel</button>
              </HoverScale>
              <HoverScale scale={1.05} tapScale={0.95}>
                <button onClick={handleCreate} disabled={!newPlName.trim()} style={{ background: 'var(--amber)', border: 'none', borderRadius: 'var(--radius-md)', padding: '9px 18px', color: '#0d0c0a', fontSize: '13px', fontWeight: 700, cursor: newPlName.trim() ? 'pointer' : 'not-allowed', fontFamily: 'var(--font)', opacity: newPlName.trim() ? 1 : 0.5 }}>Create</button>
              </HoverScale>
            </div>
          </div>
        </ModalOverlay>
      )}

    </div>
  );
};
