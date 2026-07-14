import React, { useState } from 'react';
import { Home, Search, Library, Plus, Music, Trash2, Headphones } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import type { Playlist } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  setSelectedPlaylistId: (id: string | null) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  setSelectedPlaylistId
}) => {
  const { playlists, createPlaylist, deletePlaylist } = useLibrary();
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
      setSelectedPlaylistId(id);
      setCurrentTab('playlist-detail');
    }
  };

  const handlePlaylistClick = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setCurrentTab('playlist-detail');
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'library', label: 'Your Library', icon: Library },
  ];

  return (
    <>
      <aside
        style={{
          width: '240px',
          minWidth: '240px',
          backgroundColor: '#060612',
          borderRight: '1px solid rgba(124, 58, 237, 0.12)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: '96px', // space for playback bar
        }}
      >
        {/* ── Brand Header ── */}
        <div style={{ padding: '28px 20px 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #7C3AED, #2563EB)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 20px rgba(124, 58, 237, 0.35)',
            }}>
              <Headphones size={20} color="white" />
            </div>
            <div>
              <h1 style={{
                fontSize: '20px',
                fontWeight: 800,
                fontFamily: "'Outfit', sans-serif",
                background: 'linear-gradient(135deg, #A78BFA, #60A5FA)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.3px',
                lineHeight: 1.1,
              }}>
                VibeUp
              </h1>
              <p style={{ fontSize: '10px', color: '#4B5563', marginTop: '1px', letterSpacing: '0.5px' }}>
                Feel the music
              </p>
            </div>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav style={{ padding: '4px 12px', marginBottom: '8px' }}>
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = currentTab === id || (currentTab === 'playlist-detail' && id === 'library');
            return (
              <button
                key={id}
                onClick={() => setCurrentTab(id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  marginBottom: '2px',
                  fontSize: '14px',
                  fontWeight: isActive ? 700 : 500,
                  fontFamily: "'Inter', sans-serif",
                  transition: 'all 0.2s ease',
                  background: isActive
                    ? 'rgba(124, 58, 237, 0.18)'
                    : 'transparent',
                  color: isActive ? '#A78BFA' : '#6B7280',
                  textAlign: 'left',
                  position: 'relative',
                }}
              >
                {isActive && (
                  <span style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '3px',
                    height: '60%',
                    background: 'linear-gradient(to bottom, #A78BFA, #60A5FA)',
                    borderRadius: '0 3px 3px 0',
                  }} />
                )}
                <Icon size={17} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* ── Divider ── */}
        <div style={{ height: '1px', background: 'rgba(124, 58, 237, 0.1)', margin: '4px 20px 16px 20px' }} />

        {/* ── Playlists Header ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          marginBottom: '10px',
        }}>
          <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#374151' }}>
            Playlists
          </span>
          <button
            onClick={() => setShowCreateModal(true)}
            title="Create playlist"
            style={{
              background: 'rgba(124, 58, 237, 0.12)',
              border: '1px solid rgba(124, 58, 237, 0.2)',
              borderRadius: '8px',
              width: '26px',
              height: '26px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#A78BFA',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
          >
            <Plus size={13} />
          </button>
        </div>

        {/* ── Playlist List ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
          {playlists.length === 0 ? (
            <div style={{ padding: '12px 10px' }}>
              <p style={{ fontSize: '12px', color: '#374151', fontStyle: 'italic', lineHeight: 1.5 }}>
                No playlists yet.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  marginTop: '8px',
                  fontSize: '11px',
                  color: '#7C3AED',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  fontWeight: 600,
                }}
              >
                + Create one
              </button>
            </div>
          ) : (
            playlists.map((playlist: Playlist) => (
              <div
                key={playlist.id}
                className="group"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '10px',
                  marginBottom: '2px',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124, 58, 237, 0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <button
                  onClick={() => handlePlaylistClick(playlist.id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6B7280',
                    fontSize: '13px',
                    fontWeight: 500,
                    textAlign: 'left',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '7px',
                    background: 'rgba(124, 58, 237, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Music size={13} color="#7C3AED" />
                  </div>
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>{playlist.name}</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${playlist.name}"?`)) {
                      deletePlaylist(playlist.id);
                      if (currentTab === 'playlist-detail') setCurrentTab('library');
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#EF4444',
                    padding: '8px 8px',
                    opacity: 0,
                    transition: 'opacity 0.15s ease',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                  title="Delete playlist"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ── Create Playlist Modal ── */}
      {showCreateModal && (
        <div
          onClick={() => setShowCreateModal(false)}
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '16px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: '#0E0E22',
              border: '1px solid rgba(124, 58, 237, 0.2)',
              borderRadius: '20px',
              width: '100%', maxWidth: '380px',
              padding: '28px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            }}
          >
            <h3 style={{ fontWeight: 800, fontSize: '18px', marginBottom: '20px', fontFamily: "'Outfit', sans-serif" }}>
              New Playlist
            </h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                placeholder="Playlist name"
                required
                autoFocus
                value={newListName}
                onChange={e => setNewListName(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(124, 58, 237, 0.2)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  color: '#F3F4F6',
                  outline: 'none',
                }}
              />
              <textarea
                placeholder="Description (optional)"
                value={newListDesc}
                onChange={e => setNewListDesc(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(124, 58, 237, 0.2)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  color: '#F3F4F6',
                  outline: 'none',
                  resize: 'none',
                  height: '80px',
                }}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    background: 'none',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#9CA3AF',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 24px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                    border: 'none',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 700,
                    boxShadow: '0 4px 16px rgba(124, 58, 237, 0.3)',
                  }}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
