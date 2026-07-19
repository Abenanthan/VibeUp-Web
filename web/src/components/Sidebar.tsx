import React, { useState } from 'react';
import { Home, Search, Library, Plus, ListMusic, MoreVertical, Heart, X } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { HoverScale, StaggerContainer, StaggerItem, AnimatePresence, motion, ModalOverlay } from '../components/motion';
import logoImg from '../assets/image.png';

const NAV_ITEMS = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'library', icon: Library, label: 'Your Library' },
];

export const Sidebar: React.FC<{
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  setActivePlaylistId: (id: string) => void;
}> = ({ currentTab, setCurrentTab, setActivePlaylistId }) => {
  const { playlists, createPlaylist, removePlaylist } = useLibrary();

  const [showCreate, setShowCreate] = useState(false);
  const [newPlName, setNewPlName] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleCreate = () => {
    if (newPlName.trim()) {
      createPlaylist(newPlName.trim());
      setNewPlName('');
      setShowCreate(false);
    }
  };

  return (
    <div onClick={() => setActiveMenu(null)} style={{ width: '260px', height: '100%', background: 'var(--bg-surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

      {/* Logo Area */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, type: 'spring' }} style={{ padding: '24px 20px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
          <img src={logoImg} alt="VibeUp" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <h1 className="gradient-text" style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.5px' }}>VibeUp</h1>
      </motion.div>

      {/* Main Navigation */}
      <div style={{ padding: '0 12px', marginBottom: '16px' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {NAV_ITEMS.map((item, i) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <motion.li key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
                <button
                  onClick={() => setCurrentTab(item.id)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: active ? 'var(--text-primary)' : 'var(--text-secondary)', transition: 'color 0.2s', fontFamily: 'var(--font)', position: 'relative', background: 'transparent' }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = active ? 'var(--text-primary)' : 'var(--text-secondary)'; }}
                >
                  {active && (
                    <motion.div layoutId="sidebar-active" style={{ position: 'absolute', inset: 0, background: 'var(--gradient-glass)', borderRadius: 'var(--radius-md)', zIndex: 0, border: '1px solid var(--border-medium)' }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                  )}
                  <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color={active ? 'var(--accent)' : 'currentColor'} />
                  </span>
                  <span style={{ position: 'relative', zIndex: 1 }}>{item.label}</span>
                </button>
              </motion.li>
            );
          })}
        </ul>
      </div>

      <div style={{ padding: '0 20px', margin: '8px 0' }}>
        <div style={{ height: '1px', background: 'var(--border)' }} />
      </div>

      {/* Playlists Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={{ padding: '8px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--text-tertiary)' }}>Playlists</span>
        <HoverScale scale={1.2} tapScale={0.9}>
          <button onClick={() => setShowCreate(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
            <Plus size={16} />
          </button>
        </HoverScale>
      </motion.div>

      {/* Playlists List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }} className="hide-scrollbar">
        <StaggerContainer staggerDelay={0.04}>
          <StaggerItem>
            <button onClick={() => { setActivePlaylistId('liked'); setCurrentTab('playlist_detail'); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, fontFamily: 'var(--font)', transition: 'background 0.15s, color 0.15s' }} onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-hover)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #a855f7, #e879f9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Heart size={13} fill="#fff" color="#fff" />
              </div>
              <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Liked Songs</span>
            </button>
          </StaggerItem>

          {playlists.map(pl => {
            const menuOpen = activeMenu === pl.id;
            return (
              <StaggerItem key={pl.id}>
                <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => { setActivePlaylistId(pl.id); setCurrentTab('playlist_detail'); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, fontFamily: 'var(--font)', transition: 'background 0.15s, color 0.15s' }} onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-hover)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border)' }}>
                      <ListMusic size={13} color="var(--text-tertiary)" />
                    </div>
                    <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pl.name}</span>
                    <button onClick={e => { e.stopPropagation(); setActiveMenu(menuOpen ? null : pl.id); }} style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text-tertiary)', opacity: 0.5, transition: 'opacity 0.15s' }} onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}><MoreVertical size={14} /></button>
                  </button>
                  <AnimatePresence>
                    {menuOpen && (
                      <motion.div initial={{ opacity: 0, scale: 0.9, y: 0 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 0 }} style={{ position: 'absolute', top: '34px', right: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '5px', zIndex: 50, minWidth: '130px', boxShadow: '0 12px 32px rgba(0,0,0,0.6)' }}>
                        <button onClick={() => { removePlaylist(pl.id); setActiveMenu(null); if (currentTab === 'playlist_detail') setCurrentTab('library'); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 10px', borderRadius: '7px', color: 'var(--danger)', fontSize: '12px', fontWeight: 500, fontFamily: 'var(--font)' }}>Delete playlist</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>

      {/* Create Playlist Modal */}
      <AnimatePresence>
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
                type="text" autoFocus placeholder="My awesome playlist" value={newPlName}
                onChange={e => setNewPlName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowCreate(false); }}
                style={{ width: '100%', background: 'var(--bg-base)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '12px 14px', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'var(--font)', outline: 'none', marginBottom: '24px', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--border-medium)'}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <HoverScale scale={1.05} tapScale={0.95}>
                  <button onClick={() => setShowCreate(false)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '9px 18px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)' }}>Cancel</button>
                </HoverScale>
                <HoverScale scale={1.05} tapScale={0.95}>
                  <button onClick={handleCreate} disabled={!newPlName.trim()} className="neon-btn" style={{ padding: '9px 18px', fontSize: '13px', fontFamily: 'var(--font)', opacity: newPlName.trim() ? 1 : 0.5 }}>Create</button>
                </HoverScale>
              </div>
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </div>
  );
};
