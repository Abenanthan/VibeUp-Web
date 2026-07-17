import React, { useState } from 'react';
import { Home, Search, Library, Plus, Music2, Trash2 } from 'lucide-react';
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
  setSelectedPlaylistId,
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
    { id: 'home',    label: 'Home',        icon: Home    },
    { id: 'search',  label: 'Search',      icon: Search  },
    { id: 'library', label: 'Library',     icon: Library },
  ];

  return (
    <>
      <aside style={{
        width: '252px',
        minWidth: '252px',
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: '80px',
      }}>

        {/* ── Brand ── */}
        <div style={{ padding: '26px 20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Geometric logo mark */}
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              background: 'var(--amber)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="10" width="3" height="6" rx="1.5" fill="#0d0c0a"/>
                <rect x="7" y="6"  width="3" height="10" rx="1.5" fill="#0d0c0a"/>
                <rect x="12" y="2" width="3" height="14" rx="1.5" fill="#0d0c0a"/>
              </svg>
            </div>
            <div>
              <h1 style={{
                fontSize: '17px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.4px',
                lineHeight: 1,
              }}>
                VibeUp
              </h1>
              <p style={{
                fontSize: '9px',
                color: 'var(--text-tertiary)',
                marginTop: '3px',
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
                fontWeight: 500,
              }}>
                Music
              </p>
            </div>
          </div>
        </div>

        {/* ── Nav ── */}
        <nav style={{ padding: '0 12px', marginBottom: '6px' }}>
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
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  cursor: 'pointer',
                  marginBottom: '2px',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 400,
                  fontFamily: 'var(--font)',
                  transition: 'background 0.15s ease, color 0.15s ease',
                  background: isActive ? 'var(--amber-dim)' : 'transparent',
                  color: isActive ? 'var(--amber)' : 'var(--text-secondary)',
                  textAlign: 'left',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--bg-hover)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                {isActive && (
                  <span style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '3px',
                    height: '56%',
                    background: 'var(--amber)',
                    borderRadius: '0 3px 3px 0',
                  }} />
                )}
                <Icon size={16} strokeWidth={isActive ? 2.5 : 1.8} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* ── Divider ── */}
        <div style={{ height: '1px', background: 'var(--border)', margin: '6px 20px 14px' }} />

        {/* ── Playlists header ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px 10px',
        }}>
          <span style={{
            fontSize: '9px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            color: 'var(--text-tertiary)',
          }}>
            Playlists
          </span>
          <button
            onClick={() => setShowCreateModal(true)}
            title="New playlist"
            style={{
              background: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              width: '24px',
              height: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--amber)';
              e.currentTarget.style.color = '#0d0c0a';
              e.currentTarget.style.borderColor = 'var(--amber)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <Plus size={12} />
          </button>
        </div>

        {/* ── Playlist list ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
          {playlists.length === 0 ? (
            <div style={{ padding: '10px 6px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                No playlists yet.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  marginTop: '6px',
                  fontSize: '11px',
                  color: 'var(--amber)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  fontWeight: 600,
                  fontFamily: 'var(--font)',
                }}
              >
                + New playlist
              </button>
            </div>
          ) : (
            playlists.map((playlist: Playlist) => (
              <div
                key={playlist.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1px',
                  transition: 'background 0.12s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <button
                  onClick={() => handlePlaylistClick(playlist.id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    padding: '7px 10px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 400,
                    fontFamily: 'var(--font)',
                    textAlign: 'left',
                    overflow: 'hidden',
                    transition: 'color 0.12s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-active)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Music2 size={12} color="var(--text-tertiary)" strokeWidth={1.8} />
                  </div>
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {playlist.name}
                  </span>
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
                    color: 'var(--danger)',
                    padding: '7px 8px',
                    opacity: 0,
                    transition: 'opacity 0.15s ease',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                  title="Delete playlist"
                >
                  <Trash2 size={11} />
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
            backgroundColor: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '16px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-xl)',
              width: '100%', maxWidth: '360px',
              padding: '28px',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
            }}
          >
            <h3 style={{ fontWeight: 700, fontSize: '17px', marginBottom: '6px', color: 'var(--text-primary)' }}>
              New Playlist
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Name your playlist to get started.
            </p>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                placeholder="Playlist name"
                required
                autoFocus
                value={newListName}
                onChange={e => setNewListName(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-hover)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '11px 14px',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontFamily: 'var(--font)',
                  transition: 'border-color 0.15s ease',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--amber)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
              <textarea
                placeholder="Description (optional)"
                value={newListDesc}
                onChange={e => setNewListDesc(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-hover)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '11px 14px',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  resize: 'none',
                  height: '76px',
                  fontFamily: 'var(--font)',
                  transition: 'border-color 0.15s ease',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--amber)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-hover)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                    fontFamily: 'var(--font)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 22px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--amber)',
                    border: 'none',
                    color: '#0d0c0a',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 700,
                    fontFamily: 'var(--font)',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--amber-soft)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--amber)')}
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
