import React, { useEffect, useState } from 'react';
import { Play, Trash2, Search, Plus, Music, ArrowLeft, Heart, Shuffle } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { useAudio } from '../context/AudioContext';
import { saavnApi } from '../services/api';
import type { Song } from '../types';

interface PlaylistDetailProps {
  playlistId: string | null;
  setCurrentTab: (tab: string) => void;
}

const formatDuration = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const totalDurationText = (songs: Song[]) => {
  const total = songs.reduce((sum, s) => sum + (s.duration || 0), 0);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
};

export const PlaylistDetail: React.FC<PlaylistDetailProps> = ({ playlistId, setCurrentTab }) => {
  const { playlists, likedSongs, removeSongFromPlaylist, addSongToPlaylist, isLiked, toggleLike, addToRecentlyPlayed } = useLibrary();
  const { playSong, currentSong, isPlaying } = useAudio();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const isLikesTab = playlistId === 'liked-songs';
  const playlist = playlists.find(p => p.id === playlistId);

  useEffect(() => {
    if (isLikesTab) {
      setSongs(likedSongs);
    } else if (playlist) {
      const loaded: Song[] = [];
      playlist.songIds.forEach(id => {
        const stored = localStorage.getItem(`vibeup_song_${id}`);
        if (stored) { try { loaded.push(JSON.parse(stored)); } catch (_) {} }
      });
      setSongs(loaded);
    }
  }, [playlistId, playlist, likedSongs, isLikesTab]);

  const handlePlay = (startSong?: Song) => {
    if (songs.length === 0) return;
    const target = startSong || songs[0];
    addToRecentlyPlayed(target);
    playSong(target, songs);
  };

  const handleShufflePlay = () => {
    if (songs.length === 0) return;
    const randomSong = songs[Math.floor(Math.random() * songs.length)];
    addToRecentlyPlayed(randomSong);
    playSong(randomSong, songs);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await saavnApi.searchSongs(searchQuery, 10);
      setSearchResults(res);
    } catch (e) { console.error(e); }
    finally { setSearchLoading(false); }
  };

  const handleAdd = (song: Song) => {
    if (playlistId && !isLikesTab) {
      addSongToPlaylist(playlistId, song);
      setSearchResults(prev => prev.filter(s => s.id !== song.id));
    }
  };

  if (!playlist && !isLikesTab) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Playlist not found.</p>
        <button onClick={() => setCurrentTab('library')}
          style={{ padding: '10px 24px', background: 'var(--amber)', border: 'none', borderRadius: '10px', color: 'var(--bg-base)', cursor: 'pointer', fontWeight: 700 }}>
          Go Back
        </button>
      </div>
    );
  }

  const name = isLikesTab ? 'Liked Songs' : playlist?.name || 'Playlist';
  const desc = isLikesTab ? 'All your favourite tracks in one place.' : playlist?.description || 'Your custom music collection.';
  const coverImages = songs.slice(0, 4).map(s => s.imageUrl).filter(Boolean);

  return (
    <div style={{ flex: 1, overflowY: 'auto', height: '100%', color: 'var(--text-primary)' }}>

      {/* ── Hero Banner ── */}
      <div style={{
        position: 'relative',
        padding: '48px 32px 32px',
        background: 'linear-gradient(180deg, var(--amber-dim) 0%, rgba(0,0,0,0) 100%)',
        overflow: 'hidden',
      }}>
        {/* Background blur from first song */}
        {songs[0]?.imageUrl && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${songs[0].imageUrl})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            filter: 'blur(60px) brightness(0.15)',
            transform: 'scale(1.1)',
          }} />
        )}

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Back */}
          <button
            onClick={() => setCurrentTab('library')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600,
              marginBottom: '28px',
              padding: 0,
            }}
          >
            <ArrowLeft size={16} /> Back to Library
          </button>

          <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            {/* Cover art */}
            <div style={{
              width: '180px', height: '180px',
              borderRadius: '16px', flexShrink: 0,
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
              background: 'var(--bg-elevated)',
            }}>
              {coverImages.length >= 4 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', height: '100%' }}>
                  {coverImages.map((img, i) => (
                    <img key={i} src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ))}
                </div>
              ) : coverImages.length === 1 ? (
                <img src={coverImages[0]} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isLikesTab
                    ? <Heart size={64} fill="var(--amber)" color="var(--amber)" />
                    : <Music size={64} color="var(--text-tertiary)" />
                  }
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--amber)', marginBottom: '8px' }}>
                Playlist
              </p>
              <h2 style={{
                fontSize: 'clamp(24px, 4vw, 48px)', fontWeight: 900,
                fontFamily: "'Outfit', sans-serif", lineHeight: 1.05,
                letterSpacing: '-1px', marginBottom: '10px',
                textShadow: '0 2px 20px rgba(0,0,0,0.5)',
              }}>
                {name}
              </h2>
              {desc && <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>{desc}</p>}
              <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                {songs.length} songs
                {songs.length > 0 && ` · ${totalDurationText(songs)}`}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '28px', flexWrap: 'wrap' }}>
            {songs.length > 0 && (
              <>
                <button
                  onClick={() => handlePlay()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '14px 28px',
                    background: 'var(--amber)',
                    border: 'none', borderRadius: '100px',
                    color: 'var(--bg-base)', fontWeight: 800, fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 8px 28px var(--amber-glow)',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <Play size={18} fill="currentColor" color="currentColor" />
                  Play
                </button>
                <button
                  onClick={handleShufflePlay}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '13px 22px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '100px',
                    color: 'var(--text-primary)', fontWeight: 700, fontSize: '13px',
                    cursor: 'pointer',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <Shuffle size={15} /> Shuffle
                </button>
              </>
            )}
            {!isLikesTab && (
              <button
                onClick={() => setShowSearch(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '13px 22px',
                  background: showSearch ? 'var(--amber-dim)' : 'var(--bg-elevated)',
                  border: `1px solid ${showSearch ? 'var(--amber)' : 'var(--border)'}`,
                  borderRadius: '100px',
                  color: showSearch ? 'var(--amber)' : 'var(--text-secondary)',
                  fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                }}
              >
                <Plus size={15} /> Add Songs
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Add Songs Search Panel ── */}
      {!isLikesTab && showSearch && (
        <div style={{
          margin: '0 32px 24px',
          padding: '20px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '16px',
        }}>
          <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>Search &amp; Add Songs</h4>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: '10px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px', padding: '0 14px', height: '44px',
            }}>
              <Search size={15} color="#4B5563" />
              <input
                type="text"
                placeholder="Search songs to add..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F3F4F6', fontSize: '14px' }}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searchLoading}
              style={{
                padding: '0 20px', height: '44px',
                background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                border: 'none', borderRadius: '12px',
                color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
              }}
            >
              {searchLoading ? '...' : 'Search'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {searchResults.map(song => (
                <div key={song.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px',
                }}>
                  <img src={song.imageUrl} alt={song.title}
                    style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontSize: '13px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.title}</p>
                    <p style={{ fontSize: '11px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.artist}</p>
                  </div>
                  <button
                    onClick={() => handleAdd(song)}
                    style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: 'rgba(124,58,237,0.15)',
                      border: '1px solid rgba(124,58,237,0.3)',
                      cursor: 'pointer', color: '#A78BFA',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Track List ── */}
      <div style={{ padding: '0 32px 120px' }}>
        {/* Column headers */}
        {songs.length > 0 && (
          <div style={{
            display: 'grid', gridTemplateColumns: '40px 1fr auto auto',
            gap: '12px', padding: '0 12px 10px',
            borderBottom: '1px solid var(--border)', marginBottom: '8px',
          }}>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 700 }}>#</span>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 700 }}>TITLE</span>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 700, paddingRight: '40px' }}>DURATION</span>
            <span />
          </div>
        )}

        {songs.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            border: '1px dashed var(--border)', borderRadius: '16px',
          }}>
            <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>
              {isLikesTab ? '💔' : '💿'}
            </span>
            <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              {isLikesTab ? 'No liked songs yet' : 'This playlist is empty'}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
              {isLikesTab ? 'Like songs while browsing to see them here.' : 'Click "Add Songs" above to get started.'}
            </p>
          </div>
        ) : songs.map((song, index) => {
          const liked = isLiked(song.id);
          const isHovered = hoveredIdx === index;
          return (
            <div
              key={song.id}
              onMouseEnter={() => setHoveredIdx(index)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => handlePlay(song)}
              style={{
                display: 'grid', gridTemplateColumns: '40px 1fr auto auto',
                gap: '12px', alignItems: 'center',
                padding: '8px 12px',
                borderRadius: '10px',
                background: isHovered ? 'var(--bg-hover)' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              {/* # or play */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px' }}>
                {currentSong?.id === song.id && isPlaying ? (
                  <span style={{ width: '12px', height: '12px', display: 'flex', gap: '2px', alignItems: 'flex-end', justifyContent: 'center' }}>
                    {[1,2,3].map(i => <span key={i} className="visualizer-bar" style={{ background: 'var(--amber)' }} />)}
                  </span>
                ) : isHovered ? (
                  <Play size={14} color="var(--amber)" fill="var(--amber)" />
                ) : (
                  <span style={{ fontSize: '13px', color: currentSong?.id === song.id ? 'var(--amber)' : 'var(--text-tertiary)', fontWeight: 600 }}>{index + 1}</span>
                )}
              </div>

              {/* Song info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                <img src={song.imageUrl} alt={song.title}
                  style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                <div style={{ overflow: 'hidden' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: currentSong?.id === song.id ? 'var(--amber)' : 'var(--text-primary)' }}>
                    {song.title}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                    {song.artist}
                  </p>
                </div>
              </div>

              {/* Duration */}
              <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                {formatDuration(song.duration)}
              </span>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => toggleLike(song)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: liked ? 'var(--danger)' : 'var(--text-tertiary)',
                    opacity: isHovered || liked ? 1 : 0,
                    transition: 'opacity 0.15s',
                    display: 'flex', alignItems: 'center', padding: '6px',
                  }}
                >
                  <Heart size={14} fill={liked ? 'var(--danger)' : 'none'} />
                </button>
                {!isLikesTab && (
                  <button
                    onClick={() => removeSongFromPlaylist(playlistId!, song.id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--danger)',
                      opacity: isHovered ? 1 : 0,
                      transition: 'opacity 0.15s',
                      display: 'flex', alignItems: 'center', padding: '6px',
                    }}
                    title="Remove from playlist"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
