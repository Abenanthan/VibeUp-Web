import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Pause, Heart, Clock, MoreVertical, Trash2, Search as SearchIcon, X, MoveDown, MoveUp } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { useAudio } from '../context/AudioContext';
import { saavnApi } from '../services/api';
import type { Song } from '../types';
import { FadeInView, StaggerContainer, StaggerItem, HoverScale, AnimatePresence, motion } from '../components/motion';

const fmtDur = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

export const PlaylistDetail: React.FC<{
  playlistId: string;
  onBack: () => void;
}> = ({ playlistId, onBack }) => {
  const { playlists, likedSongs, toggleLike, isLiked, removeSongFromPlaylist, removePlaylist, reorderPlaylist, addSongToPlaylist, addToRecentlyPlayed } = useLibrary();
  const { playSong, currentSong, isPlaying, togglePlayPause } = useAudio();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchRes, setSearchRes] = useState<Song[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [hoveredSong, setHoveredSong] = useState<string | null>(null);
  const searchTmr = useRef<any>(null);

  const isLikedView = playlistId === 'liked';
  const rawPlaylist = isLikedView
    ? { id: 'liked', name: 'Liked Songs', songIds: likedSongs.map(s => s.id) }
    : playlists.find(p => p.id === playlistId);

  const [playlistSongs, setPlaylistSongs] = useState<Song[]>([]);

  useEffect(() => {
    if (isLikedView) {
      setPlaylistSongs(likedSongs);
    } else if (rawPlaylist) {
      const resolved = rawPlaylist.songIds.map(id => {
        try {
          const stored = localStorage.getItem(`vibeup_song_${id}`);
          return stored ? JSON.parse(stored) : null;
        } catch(e) { return null; }
      }).filter(Boolean) as Song[];
      setPlaylistSongs(resolved);
    }
  }, [rawPlaylist, isLikedView, likedSongs]);

  const playlist = rawPlaylist ? { ...rawPlaylist, songs: playlistSongs } : null;

  useEffect(() => {
    if (!searchQ.trim()) { setSearchRes([]); return; }
    clearTimeout(searchTmr.current);
    searchTmr.current = setTimeout(async () => {
      try { const res = await saavnApi.searchSongs(searchQ, 10); setSearchRes(res); } catch (e) { console.error(e); }
    }, 400);
    return () => clearTimeout(searchTmr.current);
  }, [searchQ]);

  if (!playlist) return <div style={{ padding: '40px', color: 'var(--text-secondary)' }}>Playlist not found.</div>;

  const handlePlayAll = () => {
    if (playlist.songs.length === 0) return;
    if (currentSong && playlist.songs.some(s => s.id === currentSong.id)) { togglePlayPause(); return; }
    addToRecentlyPlayed(playlist.songs[0]);
    playSong(playlist.songs[0], playlist.songs);
  };

  const handlePlaySong = (song: Song) => {
    addToRecentlyPlayed(song);
    playSong(song, playlist.songs);
  };

  const art = playlist.songs.length > 0 ? playlist.songs[0].imageUrl : null;
  const isPlayingThis = currentSong && playlist.songs.some(s => s.id === currentSong.id) && isPlaying;
  const totalSecs = playlist.songs.reduce((acc, s) => acc + s.duration, 0);
  const totalMins = Math.floor(totalSecs / 60);

  return (
    <div onClick={() => setActiveMenu(null)} style={{ flex: 1, overflowY: 'auto', padding: '0 0 100px 0', height: '100%', position: 'relative' }}>

      {/* Hero Banner */}
      <div style={{ position: 'relative', padding: '40px 32px 32px', background: isLikedView ? 'linear-gradient(135deg, #3b1759 0%, #170d24 100%)' : `linear-gradient(180deg, rgba(168, 85, 247, 0.16) 0%, transparent 100%)`, minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', borderBottom: '1px solid var(--border)' }}>
        {art && !isLikedView && (
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${art})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(80px) brightness(0.2) saturate(1.2)', zIndex: 0, opacity: 0.6 }} />
        )}
        
        <div style={{ position: 'relative', zIndex: 2 }}>
          <HoverScale scale={1.05} tapScale={0.95} style={{ display: 'inline-block', marginBottom: '24px' }}>
            <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '99px', padding: '6px 14px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 500, backdropFilter: 'blur(10px)', transition: 'background 0.2s, color 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
              <ArrowLeft size={14} /> Back
            </button>
          </HoverScale>

          <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-end' }}>
            <FadeInView direction="up" delay={0.1} style={{ width: '210px', height: '210px', flexShrink: 0, borderRadius: 'var(--radius-lg)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', overflow: 'hidden', background: isLikedView ? 'linear-gradient(135deg, #4f2178 0%, #2e104f 100%)' : 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isLikedView ? <Heart size={80} fill="#fff" /> : art ? <img src={art} alt={playlist.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '48px' }}>🎵</span>}
            </FadeInView>
            <FadeInView direction="up" delay={0.2} style={{ flex: 1, paddingBottom: '10px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: isLikedView ? '#d8b4fe' : 'var(--text-tertiary)', marginBottom: '10px' }}>Playlist</p>
              <h1 style={{ fontSize: '56px', fontWeight: 800, letterSpacing: '-2px', color: '#fff', marginBottom: '16px', lineHeight: 1.1 }}>{playlist.name}</h1>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--text-primary)' }}>{playlist.songs.length} {playlist.songs.length === 1 ? 'song' : 'songs'}</span>
                {totalMins > 0 && <><span style={{ opacity: 0.3 }}>•</span><span>about {totalMins} min</span></>}
              </p>
            </FadeInView>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        
        {/* Actions bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <HoverScale scale={1.05} tapScale={0.95}>
              <button onClick={handlePlayAll} style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--amber)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px var(--amber-glow)', opacity: playlist.songs.length === 0 ? 0.5 : 1 }}>
                {isPlayingThis ? <Pause size={24} fill="#0d0c0a" color="#0d0c0a" /> : <Play size={24} fill="#0d0c0a" color="#0d0c0a" style={{ marginLeft: '3px' }} />}
              </button>
            </HoverScale>
            {!isLikedView && (
              <HoverScale scale={1.1} tapScale={0.95}>
                <button onClick={() => { removePlaylist(playlist.id); onBack(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font)', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                  <Trash2 size={18} /> Delete
                </button>
              </HoverScale>
            )}
          </div>
          {!isLikedView && (
            <HoverScale scale={1.05} tapScale={0.95}>
              <button onClick={() => setSearchOpen(!searchOpen)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: searchOpen ? 'rgba(255,255,255,0.1)' : 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '99px', padding: '6px 14px', color: searchOpen ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, transition: 'all 0.2s', fontFamily: 'var(--font)' }}>
                {searchOpen ? <X size={14} /> : <SearchIcon size={14} />} {searchOpen ? 'Close' : 'Add Songs'}
              </button>
            </HoverScale>
          )}
        </div>

        {/* Search Panel (if open) */}
        <AnimatePresence>
          {searchOpen && !isLikedView && (
            <motion.div initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: 32 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} style={{ overflow: 'hidden' }}>
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Let's find something for your playlist</h3>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '0 14px', height: '44px', marginBottom: '16px' }}>
                  <SearchIcon size={16} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                  <input type="text" placeholder="Search for songs..." value={searchQ} onChange={e => setSearchQ(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '13px', padding: '0 12px', fontFamily: 'var(--font)' }} />
                </div>
                {searchRes.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {searchRes.map(song => {
                      const inPl = playlist.songs.some(s => s.id === song.id);
                      return (
                        <div key={song.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 'var(--radius-md)', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img src={song.imageUrl} alt={song.title} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>{song.title}</p>
                              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{song.artist}</p>
                            </div>
                          </div>
                          <button onClick={() => { if (!inPl) addSongToPlaylist(playlist.id, song); }} disabled={inPl} style={{ background: inPl ? 'transparent' : 'var(--amber)', border: inPl ? '1px solid var(--border-medium)' : 'none', borderRadius: '99px', padding: '5px 12px', color: inPl ? 'var(--text-tertiary)' : '#0d0c0a', fontSize: '11px', fontWeight: 600, cursor: inPl ? 'default' : 'pointer', fontFamily: 'var(--font)' }}>
                            {inPl ? 'Added' : 'Add'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tracks Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px 12px', borderBottom: '1px solid var(--border)', marginBottom: '16px' }}>
          <span style={{ width: '32px', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textAlign: 'center' }}>#</span>
          <span style={{ flex: 1, fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Title</span>
          <span style={{ width: '60px', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textAlign: 'center' }}><Clock size={12} /></span>
        </div>

        {/* Track List */}
        {playlist.songs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '6px' }}>This playlist is empty</p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Find some tracks to add!</p>
          </div>
        ) : (
          <StaggerContainer style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {playlist.songs.map((song, idx) => {
              const active = currentSong?.id === song.id;
              const liked = isLiked(song.id);
              const isHov = hoveredSong === song.id;
              const menuOpen = activeMenu === song.id;

              return (
                <StaggerItem key={`${song.id}-${idx}`}>
                  <div onClick={() => handlePlaySong(song)} onMouseEnter={() => setHoveredSong(song.id)} onMouseLeave={() => setHoveredSong(null)} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderRadius: 'var(--radius-md)', background: isHov ? 'var(--bg-elevated)' : 'transparent', cursor: 'pointer', transition: 'background 0.15s' }}>
                    
                    <div style={{ width: '32px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {active && isPlaying ? (
                        <span style={{ width: '12px', height: '12px', display: 'flex', gap: '2px', alignItems: 'flex-end', justifyContent: 'center' }}>
                          {[1,2,3].map(i => <span key={i} className="visualizer-bar" style={{ background: 'var(--amber)' }} />)}
                        </span>
                      ) : isHov ? (
                        <Play size={14} color="var(--amber)" fill="var(--amber)" />
                      ) : (
                        <span style={{ fontSize: '12px', color: active ? 'var(--amber)' : 'var(--text-tertiary)', fontWeight: 600 }}>{idx + 1}</span>
                      )}
                    </div>

                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, paddingRight: '16px' }}>
                      <img src={song.imageUrl} alt={song.title} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                      <div style={{ overflow: 'hidden' }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: active ? 'var(--amber)' : 'var(--text-primary)', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.title}</p>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.artist}</p>
                      </div>
                    </div>

                    <span style={{ width: '50px', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500, textAlign: 'right', paddingRight: '16px' }}>{fmtDur(song.duration)}</span>

                    <HoverScale scale={1.2} tapScale={0.9}>
                      <button onClick={e => { e.stopPropagation(); toggleLike(song); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: liked ? 'var(--danger)' : 'var(--text-tertiary)', opacity: isHov || liked ? 1 : 0, transition: 'opacity 0.2s', display: 'flex' }}>
                        <Heart size={15} fill={liked ? 'var(--danger)' : 'none'} />
                      </button>
                    </HoverScale>

                    <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => setActiveMenu(menuOpen ? null : song.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '16px', opacity: isHov ? 1 : 0, transition: 'opacity 0.2s', padding: '4px' }}><MoreVertical size={16} /></button>
                      <AnimatePresence>
                        {menuOpen && (
                          <motion.div initial={{ opacity: 0, scale: 0.9, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -10 }} style={{ position: 'absolute', right: 0, top: '24px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '5px', zIndex: 50, minWidth: '150px', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}>
                            {!isLikedView && (
                              <>
                                <button onClick={() => { removeSongFromPlaylist(playlist.id, song.id); setActiveMenu(null); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 10px', borderRadius: '7px', color: 'var(--danger)', fontSize: '12px', fontWeight: 500, fontFamily: 'var(--font)' }}><Trash2 size={12} /> Remove</button>
                                {idx > 0 && <button onClick={() => { reorderPlaylist(playlist.id, idx, idx - 1); setActiveMenu(null); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 10px', borderRadius: '7px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, fontFamily: 'var(--font)' }}><MoveUp size={12} /> Move Up</button>}
                                {idx < playlist.songs.length - 1 && <button onClick={() => { reorderPlaylist(playlist.id, idx, idx + 1); setActiveMenu(null); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 10px', borderRadius: '7px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, fontFamily: 'var(--font)' }}><MoveDown size={12} /> Move Down</button>}
                              </>
                            )}
                            {isLikedView && (
                              <button onClick={() => { toggleLike(song); setActiveMenu(null); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 10px', borderRadius: '7px', color: 'var(--danger)', fontSize: '12px', fontWeight: 500, fontFamily: 'var(--font)' }}><Heart size={12} fill="var(--danger)" /> Unlike</button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}
      </div>
    </div>
  );
};
