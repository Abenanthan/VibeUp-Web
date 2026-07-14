import React, { useEffect, useState, useCallback } from 'react';
import { Play, Heart, Plus, Search, ChevronRight } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useLibrary } from '../context/LibraryContext';
import { saavnApi } from '../services/api';
import type { Song } from '../types';

const FAVOURITE_IDS = [
  'GWwnRe0u', 'rjkrTnma', 'm1iXOUID', 'mPTrDSun',
  '__YIeFT-', 'uP7MlTHz', 'eLm-JvK4', 'SM-rvz75',
  'qcVqPqk5', 'vRNpPA7_', 'yBmo2qWU', 'QWLY3Ls_',
  'QkFUdVod', 'BH07HVc8', 'kehuVn2F', 'cDHlLKvW', '_KjTxjcC'
];

interface ArtistInfo { name: string; image: string; query: string; }

const ARTISTS: ArtistInfo[] = [
  { name: 'Anirudh', image: 'https://c.saavncdn.com/artists/Anirudh_Ravichander_500x500.jpg', query: 'Anirudh Ravichander' },
  { name: 'Sid Sriram', image: 'https://c.saavncdn.com/artists/Sid_Sriram_500x500.jpg', query: 'Sid Sriram' },
  { name: 'Arijit Singh', image: 'https://c.saavncdn.com/artists/Arijit_Singh_500x500.jpg', query: 'Arijit Singh' },
  { name: 'GV Prakash', image: 'https://c.saavncdn.com/artists/G_V_Prakash_Kumar_500x500.jpg', query: 'GV Prakash' },
  { name: 'Hiphop Tamizha', image: 'https://c.saavncdn.com/artists/Hiphop_Tamizha_500x500.jpg', query: 'Hiphop Tamizha' },
  { name: 'AR Rahman', image: 'https://c.saavncdn.com/artists/AR_Rahman_500x500.jpg', query: 'AR Rahman' },
];

const MOODS = [
  { label: 'Romantic', emoji: '💕', query: 'romantic love songs', grad: 'linear-gradient(135deg, #BE185D 0%, #F97316 100%)' },
  { label: 'Party', emoji: '🎉', query: 'party dance songs', grad: 'linear-gradient(135deg, #B45309 0%, #DC2626 100%)' },
  { label: 'Chill', emoji: '😌', query: 'chill relaxing songs', grad: 'linear-gradient(135deg, #0E7490 0%, #1D4ED8 100%)' },
  { label: 'Sad', emoji: '😢', query: 'sad emotional songs', grad: 'linear-gradient(135deg, #4C1D95 0%, #1E3A8A 100%)' },
  { label: 'Focus', emoji: '🎯', query: 'focus concentration music', grad: 'linear-gradient(135deg, #065F46 0%, #0369A1 100%)' },
  { label: 'Workout', emoji: '💪', query: 'workout gym songs', grad: 'linear-gradient(135deg, #991B1B 0%, #B45309 100%)' },
];

interface HomeProps { setCurrentTab: (tab: string) => void; }

export const Home: React.FC<HomeProps> = ({ setCurrentTab }) => {
  const { playSong } = useAudio();
  const { toggleLike, isLiked, recentlyPlayed, playlists, addSongToPlaylist, addToRecentlyPlayed } = useLibrary();

  const [favourites, setFavourites] = useState<Song[]>([]);
  const [trending, setTrending] = useState<Song[]>([]);
  const [newReleases, setNewReleases] = useState<Song[]>([]);
  const [tamilHits, setTamilHits] = useState<Song[]>([]);
  const [teluguHits, setTeluguHits] = useState<Song[]>([]);
  const [hindiHits, setHindiHits] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMenuSongId, setActiveMenuSongId] = useState<string | null>(null);
  const [hoveredSong, setHoveredSong] = useState<string | null>(null);

  // Greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const favSongs = await saavnApi.getSongsByIds(FAVOURITE_IDS);
        setFavourites(favSongs);
        setLoading(false);

        const [trendSongs, newTamil, newHindi, newTelugu, tamil, telugu, hindi] = await Promise.all([
          saavnApi.searchSongs('trending hits 2025', 12),
          saavnApi.searchSongs('new tamil songs 2025', 5),
          saavnApi.searchSongs('new hindi songs 2025', 5),
          saavnApi.searchSongs('new telugu songs 2025', 5),
          saavnApi.searchSongs('tamil hits 2025', 10),
          saavnApi.searchSongs('telugu hits 2025', 10),
          saavnApi.searchSongs('hindi hits 2025', 10),
        ]);
        setTrending(trendSongs);
        setNewReleases([...newTamil, ...newHindi, ...newTelugu].sort(() => Math.random() - 0.5));
        setTamilHits(tamil);
        setTeluguHits(telugu);
        setHindiHits(hindi);
      } catch (e) {
        console.error('Failed to load home data:', e);
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  const handlePlay = useCallback((song: Song, queue: Song[]) => {
    addToRecentlyPlayed(song);
    playSong(song, queue);
  }, [playSong, addToRecentlyPlayed]);

  const handleMoodClick = async (query: string) => {
    try {
      const songs = await saavnApi.searchSongs(query, 20);
      if (songs.length > 0) {
        const randomSong = songs[Math.floor(Math.random() * songs.length)];
        handlePlay(randomSong, songs);
      }
    } catch (e) { console.error(e); }
  };

  const handleArtistClick = async (query: string) => {
    try {
      const songs = await saavnApi.searchSongs(query, 25);
      if (songs.length > 0) handlePlay(songs[0], songs);
    } catch (e) { console.error(e); }
  };

  const SongCard = ({ song, queue }: { song: Song; queue: Song[] }) => {
    const liked = isLiked(song.id);
    const isMenuOpen = activeMenuSongId === song.id;
    const isHovered = hoveredSong === song.id;

    return (
      <div
        style={{
          width: '152px',
          flexShrink: 0,
          cursor: 'pointer',
          position: 'relative',
        }}
        onMouseEnter={() => setHoveredSong(song.id)}
        onMouseLeave={() => setHoveredSong(null)}
      >
        {/* Cover */}
        <div
          style={{
            position: 'relative',
            width: '152px',
            height: '152px',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '10px',
            boxShadow: isHovered ? '0 12px 32px rgba(0,0,0,0.6)' : '0 4px 16px rgba(0,0,0,0.3)',
            transition: 'box-shadow 0.3s ease',
            transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
          }}
        >
          <img
            src={song.imageUrl}
            alt={song.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s ease', transform: isHovered ? 'scale(1.04)' : 'scale(1)' }}
          />
          {/* Play button overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.2s ease',
          }}>
            <button
              onClick={() => handlePlay(song, queue)}
              style={{
                width: '44px', height: '44px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(124, 58, 237, 0.6)',
                transform: isHovered ? 'scale(1)' : 'scale(0.8)',
                transition: 'transform 0.2s ease',
              }}
            >
              <Play size={18} fill="white" color="white" style={{ marginLeft: '2px' }} />
            </button>
          </div>
          {/* Options button */}
          <button
            onClick={e => { e.stopPropagation(); setActiveMenuSongId(isMenuOpen ? null : song.id); }}
            style={{
              position: 'absolute', top: '8px', right: '8px',
              background: 'rgba(0,0,0,0.7)',
              border: 'none', cursor: 'pointer',
              borderRadius: '50%',
              width: '26px', height: '26px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '16px', fontWeight: 700,
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.2s ease',
            }}
          >
            ⋮
          </button>
          {/* Options dropdown */}
          {isMenuOpen && (
            <div
              style={{
                position: 'absolute', top: '36px', right: '8px',
                background: '#111128',
                border: '1px solid rgba(124, 58, 237, 0.2)',
                borderRadius: '12px',
                padding: '6px',
                zIndex: 50,
                minWidth: '160px',
                boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => { toggleLike(song); setActiveMenuSongId(null); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '8px 12px', borderRadius: '8px',
                  color: liked ? '#EF4444' : '#F3F4F6', fontSize: '12px', fontWeight: 600,
                }}
              >
                <Heart size={12} fill={liked ? '#EF4444' : 'none'} />
                {liked ? 'Unlike' : 'Like Song'}
              </button>
              {playlists.length > 0 && <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />}
              {playlists.map(pl => (
                <button
                  key={pl.id}
                  onClick={() => { addSongToPlaylist(pl.id, song); setActiveMenuSongId(null); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '7px 12px', borderRadius: '8px',
                    color: '#9CA3AF', fontSize: '11px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                >
                  <Plus size={10} />
                  Add to {pl.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Metadata */}
        <h4 style={{
          fontSize: '13px', fontWeight: 700, color: '#F3F4F6',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: '3px',
        }}>
          {song.title}
        </h4>
        <p style={{
          fontSize: '11px', color: '#6B7280',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {song.artist}
        </p>
      </div>
    );
  };

  const Section = ({ title, songs, viewAll }: { title: string; songs: Song[]; viewAll?: () => void }) => {
    if (songs.length === 0) return null;
    return (
      <section style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800, fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.3px' }}>{title}</h3>
          {viewAll && (
            <button
              onClick={viewAll}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#7C3AED', fontSize: '12px', fontWeight: 600,
              }}
            >
              See all <ChevronRight size={14} />
            </button>
          )}
        </div>
        <div style={{
          display: 'flex', gap: '16px',
          overflowX: 'auto', paddingBottom: '12px',
          scrollbarWidth: 'none',
        }}>
          {songs.map(song => <SongCard key={song.id} song={song} queue={songs} />)}
        </div>
      </section>
    );
  };

  return (
    <div
      onClick={() => setActiveMenuSongId(null)}
      style={{
        flex: 1, overflowY: 'auto',
        padding: '36px 32px 120px 32px',
        height: '100%',
        color: '#F3F4F6',
      }}
    >
      {/* ── Hero Header ── */}
      <header style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px', fontWeight: 500 }}>
              {greeting} 👋
            </p>
            <h2 style={{
              fontSize: '36px', fontWeight: 800,
              fontFamily: "'Outfit', sans-serif",
              letterSpacing: '-0.5px', lineHeight: 1.1,
              background: 'linear-gradient(135deg, #FFFFFF 0%, #A78BFA 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              What's your vibe today?
            </h2>
          </div>
          <button
            onClick={() => setCurrentTab('search')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 20px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px',
              cursor: 'pointer', color: '#9CA3AF',
              fontSize: '14px', fontWeight: 500,
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s ease',
            }}
          >
            <Search size={16} />
            <span>Search music...</span>
          </button>
        </div>
      </header>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '16px' }}>
          <div style={{
            width: '40px', height: '40px',
            border: '3px solid rgba(124, 58, 237, 0.2)',
            borderTopColor: '#7C3AED',
            borderRadius: '50%',
            animation: 'spin-slow 0.8s linear infinite',
          }} />
          <p style={{ fontSize: '14px', color: '#6B7280' }}>Loading your music...</p>
        </div>
      ) : (
        <>
          {/* ── Recently Played quick row ── */}
          {recentlyPlayed.length > 0 && (
            <section style={{ marginBottom: '40px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.3px', marginBottom: '16px' }}>
                🕐 Recently Played
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                {recentlyPlayed.slice(0, 6).map(song => (
                  <button
                    key={song.id}
                    onClick={() => handlePlay(song, recentlyPlayed)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '8px 12px 8px 8px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '10px',
                      cursor: 'pointer', color: '#F3F4F6',
                      textAlign: 'left',
                      transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124, 58, 237, 0.12)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  >
                    <img src={song.imageUrl} alt={song.title}
                      style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ overflow: 'hidden' }}>
                      <p style={{ fontSize: '13px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {song.title}
                      </p>
                      <p style={{ fontSize: '11px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {song.artist}
                      </p>
                    </div>
                    <Play size={16} style={{ marginLeft: 'auto', flexShrink: 0, color: '#7C3AED' }} />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ── Moods ── */}
          <section style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, fontFamily: "'Outfit', sans-serif", marginBottom: '16px' }}>
              🎭 Moods
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
              {MOODS.map(m => (
                <button
                  key={m.label}
                  onClick={() => handleMoodClick(m.query)}
                  style={{
                    height: '90px',
                    background: m.grad,
                    border: 'none', borderRadius: '14px',
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '14px 16px',
                    textAlign: 'left',
                    transition: 'transform 0.2s ease, filter 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.filter = 'brightness(1.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'brightness(1)'; }}
                >
                  <span style={{ position: 'absolute', top: '12px', right: '14px', fontSize: '22px' }}>{m.emoji}</span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>{m.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Song sections */}
          <Section title="❤️ Abe's Favourites" songs={favourites} />
          <Section title="🔥 Trending Now" songs={trending} />
          <Section title="🆕 New Releases" songs={newReleases} />

          {/* ── Artists ── */}
          <section style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, fontFamily: "'Outfit', sans-serif", marginBottom: '20px' }}>
              🎤 Artists
            </h3>
            <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'none' }}>
              {ARTISTS.map(art => (
                <div
                  key={art.name}
                  onClick={() => handleArtistClick(art.query)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: '10px', flexShrink: 0, cursor: 'pointer',
                    width: '96px',
                  }}
                >
                  <div style={{ position: 'relative', width: '88px', height: '88px' }}>
                    <img
                      src={art.image}
                      alt={art.name}
                      style={{
                        width: '88px', height: '88px',
                        borderRadius: '50%', objectFit: 'cover',
                        border: '2px solid rgba(124, 58, 237, 0.25)',
                        transition: 'border-color 0.2s ease',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = '#7C3AED')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.25)')}
                    />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textAlign: 'center', lineHeight: 1.3 }}>
                    {art.name}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Regional */}
          <Section title="🎵 Tamil Hits" songs={tamilHits} />
          <Section title="🎶 Telugu Hits" songs={teluguHits} />
          <Section title="🎼 Hindi Hits" songs={hindiHits} />
        </>
      )}
    </div>
  );
};
