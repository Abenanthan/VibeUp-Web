import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Pause, Clock, Heart } from 'lucide-react';
import { saavnApi } from '../services/api';
import type { Song } from '../types';
import { useAudio } from '../context/AudioContext';
import { useLibrary } from '../context/LibraryContext';
import { FadeInView, HoverScale, StaggerContainer, StaggerItem } from '../components/motion';

interface ArtistDetailProps {
  artistId?: string;
  artistName?: string;
  onBack: () => void;
}

const fmtDur = (sec: number) => {
  if (isNaN(sec) || sec <= 0) return '0:00';
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
};

export const ArtistDetail: React.FC<ArtistDetailProps> = ({ artistId, artistName, onBack }) => {
  const { playSong, currentSong, isPlaying, togglePlayPause } = useAudio();
  const { toggleLike, isLiked, addToRecentlyPlayed } = useLibrary();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [artist, setArtist] = useState<{ id: string; name: string; imageUrl: string; songs: Song[] } | null>(null);
  const [hoveredSong, setHoveredSong] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        let resolvedId = artistId;
        
        // If we only have the name, search for the artist first to find their ID
        if (!resolvedId && artistName) {
          const searchResults = await saavnApi.searchArtists(artistName);
          if (searchResults && searchResults.length > 0) {
            // Find an exact match if possible, otherwise take the first
            const match = searchResults.find(a => a.name.toLowerCase() === artistName.toLowerCase()) || searchResults[0];
            resolvedId = match.id;
          }
        }

        if (!resolvedId) {
          if (active) {
            setError('Artist not found.');
            setLoading(false);
          }
          return;
        }

        const data = await saavnApi.getArtistDetails(resolvedId);
        if (active) {
          if (data) {
            setArtist(data);
          } else {
            setError('Failed to load artist details.');
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching artist details:', err);
        if (active) {
          setError('An error occurred while fetching artist details.');
          setLoading(false);
        }
      }
    };

    fetchDetails();
    return () => {
      active = false;
    };
  }, [artistId, artistName]);

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--accent-dim)', borderTopColor: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontFamily: 'var(--font)' }}>Loading artist profile...</p>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px', padding: '20px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontFamily: 'var(--font)', textAlign: 'center' }}>{error || 'Artist not found.'}</p>
        <HoverScale scale={1.05} tapScale={0.95}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '99px', padding: '8px 18px', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
            <ArrowLeft size={14} /> Go Back
          </button>
        </HoverScale>
      </div>
    );
  }

  const isPlayingThis = currentSong && artist.songs.some(s => s.id === currentSong.id) && isPlaying;

  const handlePlayAll = () => {
    if (artist.songs.length === 0) return;
    if (currentSong && artist.songs.some(s => s.id === currentSong.id)) {
      togglePlayPause();
      return;
    }
    addToRecentlyPlayed(artist.songs[0]);
    playSong(artist.songs[0], artist.songs);
  };

  const handlePlaySong = (song: Song) => {
    addToRecentlyPlayed(song);
    playSong(song, artist.songs);
  };

  const totalSecs = artist.songs.reduce((acc, s) => acc + s.duration, 0);
  const totalMins = Math.floor(totalSecs / 60);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 100px 0', height: '100%', position: 'relative', fontFamily: 'var(--font)' }}>
      {/* Hero Header */}
      <div style={{ position: 'relative', padding: '40px 32px 32px', background: `linear-gradient(180deg, rgba(168, 85, 247, 0.20) 0%, transparent 100%)`, minHeight: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', borderBottom: '1px solid var(--border)' }}>
        {artist.imageUrl && (
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${artist.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(80px) brightness(0.18) saturate(1.3)', zIndex: 0, opacity: 0.7 }} />
        )}
        
        <div style={{ position: 'relative', zIndex: 2 }}>
          <HoverScale scale={1.05} tapScale={0.95} style={{ display: 'inline-block', marginBottom: '24px' }}>
            <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '99px', padding: '6px 14px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 500, backdropFilter: 'blur(10px)', transition: 'background 0.2s, color 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
              <ArrowLeft size={14} /> Back
            </button>
          </HoverScale>

          <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <FadeInView direction="up" delay={0.1} style={{ width: '200px', height: '200px', flexShrink: 0, borderRadius: '50%', boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 20px var(--accent-glow)', overflow: 'hidden', border: '3px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)' }}>
              {artist.imageUrl ? <img src={artist.imageUrl} alt={artist.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '48px' }}>🎤</span>}
            </FadeInView>
            <FadeInView direction="up" delay={0.2} style={{ flex: 1, minWidth: '250px', paddingBottom: '10px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--accent-2)', marginBottom: '8px' }}>Verified Artist</p>
              <h1 style={{ fontSize: '52px', fontWeight: 800, letterSpacing: '-1.5px', color: '#fff', marginBottom: '16px', lineHeight: 1.1 }}>{artist.name}</h1>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--text-primary)' }}>{artist.songs.length} Top Songs</span>
                <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                <span>{totalMins} min runtime</span>
              </p>
            </FadeInView>
          </div>
        </div>
      </div>

      {/* Play Controls Bar */}
      <div style={{ padding: '24px 32px', display: 'flex', alignItems: 'center', gap: '24px', position: 'relative', zIndex: 2 }}>
        {artist.songs.length > 0 && (
          <HoverScale scale={1.06} tapScale={0.95}>
            <button onClick={handlePlayAll} style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--gradient-main)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 24px rgba(168,85,247,0.4), 0 0 15px var(--accent-glow)' }}>
              {isPlayingThis ? <Pause size={24} fill="#fff" /> : <Play size={24} fill="#fff" style={{ marginLeft: '4px' }} />}
            </button>
          </HoverScale>
        )}
      </div>

      {/* Songs Table */}
      <div style={{ padding: '0 32px' }}>
        <StaggerContainer style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {artist.songs.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic', padding: '16px 0' }}>No songs found for this artist.</p>
          ) : (
            artist.songs.map((song, idx) => {
              const isCurrent = currentSong?.id === song.id;
              const isHovered = hoveredSong === song.id;
              const liked = isLiked(song.id);

              return (
                <StaggerItem key={song.id}>
                  <div
                    onMouseEnter={() => setHoveredSong(song.id)}
                    onMouseLeave={() => setHoveredSong(null)}
                    onClick={() => handlePlaySong(song)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: isCurrent ? 'var(--accent-dim)' : isHovered ? 'var(--bg-hover)' : 'transparent',
                      border: `1px solid ${isCurrent ? 'var(--accent-glow)' : 'transparent'}`,
                      cursor: 'pointer',
                      transition: 'background 0.2s, border 0.2s',
                    }}
                  >
                    {/* Index / Play Status */}
                    <div style={{ width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', color: 'var(--text-secondary)', fontSize: '14px' }}>
                      {isCurrent && isPlaying ? (
                        <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '12px' }}>
                          <span className="bar-anim" style={{ width: '3px', height: '100%', background: 'var(--accent)', animation: 'bounce-bar 0.8s ease-in-out infinite alternate' }} />
                          <span className="bar-anim" style={{ width: '3px', height: '60%', background: 'var(--accent)', animation: 'bounce-bar 0.5s ease-in-out infinite alternate 0.1s' }} />
                          <span className="bar-anim" style={{ width: '3px', height: '80%', background: 'var(--accent)', animation: 'bounce-bar 0.7s ease-in-out infinite alternate 0.2s' }} />
                        </div>
                      ) : isHovered ? (
                        <Play size={14} style={{ color: 'var(--accent)' }} />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    {/* Image & Title & Album */}
                    <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <img src={song.imageUrl} alt={song.title} style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: isCurrent ? 'var(--accent)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</p>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>{song.artist}</p>
                      </div>
                    </div>

                    <div className="artist-album" style={{ flex: 1, color: 'var(--text-secondary)', fontSize: '13px', paddingLeft: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {song.album}
                    </div>

                    {/* Like & Duration */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(song);
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '4px', color: liked ? 'var(--magenta)' : 'var(--text-tertiary)', transition: 'color 0.2s' }}
                      >
                        <Heart size={16} fill={liked ? 'var(--magenta)' : 'none'} />
                      </button>
                      
                      <div style={{ width: '50px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        <Clock size={12} style={{ marginRight: '6px' }} />
                        {fmtDur(song.duration)}
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              );
            })
          )}
        </StaggerContainer>
      </div>
      
      <style>{`
        @keyframes bounce-bar {
          from { height: 20%; }
          to { height: 100%; }
        }
        @media (max-width: 768px) {
          .artist-album {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
