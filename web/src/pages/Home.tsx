import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Play, Heart, Plus, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useLibrary } from '../context/LibraryContext';
import { saavnApi } from '../services/api';
import type { Song } from '../types';

/* ── Horizontal scroll container ── */
const HorizontalScroll: React.FC<{ children: React.ReactNode; gap?: string }> = ({ children, gap = '14px' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [showL, setShowL] = useState(false);
  const [showR, setShowR] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragX = useRef(0);
  const dragSL = useRef(0);

  const check = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setShowL(el.scrollLeft > 2);
    setShowR(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    check();
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0 || el.scrollWidth <= el.clientWidth) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
      const atStart = el.scrollLeft <= 2;
      if ((e.deltaY > 0 && atEnd) || (e.deltaY < 0 && atStart)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY * 1.5;
      check();
    };
    el.addEventListener('scroll', check);
    el.addEventListener('wheel', onWheel, { passive: false });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', check); el.removeEventListener('wheel', onWheel); ro.disconnect(); };
  }, [check]);

  const scroll = (dir: 'left' | 'right') => {
    const el = ref.current;
    if (el) { el.scrollBy({ left: dir === 'left' ? -el.clientWidth * 0.7 : el.clientWidth * 0.7, behavior: 'smooth' }); setTimeout(check, 350); }
  };

  const navBtn = (dir: 'left' | 'right') => ({
    position: 'absolute' as const,
    [dir]: '-14px',
    top: '36%',
    transform: 'translateY(-50%)',
    width: '32px', height: '32px',
    borderRadius: '50%',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-medium)',
    color: 'var(--text-primary)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 10,
    opacity: hovered ? 1 : 0,
    transition: 'opacity 0.2s, background 0.15s',
  });

  return (
    <div style={{ position: 'relative', width: '100%', minWidth: 0 }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {showL && <button style={navBtn('left')} onClick={() => scroll('left')} onMouseEnter={e => (e.currentTarget.style.background = 'var(--amber)')} onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}><ChevronLeft size={16} /></button>}
      {showR && <button style={navBtn('right')} onClick={() => scroll('right')} onMouseEnter={e => (e.currentTarget.style.background = 'var(--amber)')} onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}><ChevronRight size={16} /></button>}
      <div
        ref={ref}
        className="hide-scrollbar"
        onMouseDown={e => { setDragging(true); dragX.current = e.pageX - (ref.current?.offsetLeft || 0); dragSL.current = ref.current?.scrollLeft || 0; }}
        onMouseMove={e => { if (!dragging || !ref.current) return; e.preventDefault(); const x = e.pageX - (ref.current.offsetLeft); ref.current.scrollLeft = dragSL.current - (x - dragX.current) * 1.5; check(); }}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
        style={{ display: 'flex', gap, overflowX: 'auto', paddingBottom: '8px', width: '100%', minWidth: 0, cursor: dragging ? 'grabbing' : 'grab', userSelect: dragging ? 'none' : 'auto' }}
      >
        {children}
      </div>
    </div>
  );
};

/* ── Song Card ── */
const SongCard: React.FC<{
  song: Song; queue: Song[];
  activeMenuId: string | null; setActiveMenuId: (id: string | null) => void;
  handlePlay: (s: Song, q: Song[]) => void;
}> = ({ song, queue, activeMenuId, setActiveMenuId, handlePlay }) => {
  const { toggleLike, isLiked, playlists, addSongToPlaylist } = useLibrary();
  const { currentSong, isPlaying } = useAudio();
  const [hov, setHov] = useState(false);
  const liked = isLiked(song.id);
  const menuOpen = activeMenuId === song.id;
  const isNowPlaying = currentSong?.id === song.id;

  return (
    <div style={{ width: '148px', flexShrink: 0, cursor: 'pointer', position: 'relative' }} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{ position: 'relative', width: '148px', height: '148px', borderRadius: '10px', overflow: 'hidden', marginBottom: '10px', boxShadow: hov ? '0 10px 28px rgba(0,0,0,0.5)' : '0 3px 10px rgba(0,0,0,0.3)', transition: 'box-shadow 0.3s, transform 0.2s', transform: hov ? 'translateY(-2px)' : 'none' }}>
        <img src={song.imageUrl} alt={song.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s', transform: hov ? 'scale(1.04)' : 'scale(1)' }} />
        {/* Now playing teal indicator */}
        {isNowPlaying && (
          <div style={{ position: 'absolute', top: '8px', left: '8px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--teal)', boxShadow: '0 0 8px var(--teal)' }} />
        )}
        {/* Play overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: hov ? 1 : 0, transition: 'opacity 0.2s' }}>
          <button onClick={() => handlePlay(song, queue)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--amber)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px var(--amber-glow)', transform: hov ? 'scale(1)' : 'scale(0.8)', transition: 'transform 0.2s' }}>
            {isNowPlaying && isPlaying ? <span style={{ width: '14px', height: '14px', display: 'flex', gap: '2px', alignItems: 'flex-end' }}>
              {[1,2,3].map(i => <span key={i} className="visualizer-bar" style={{ height: '8px' }} />)}
            </span> : <Play size={15} fill="#0d0c0a" color="#0d0c0a" style={{ marginLeft: '2px' }} />}
          </button>
        </div>
        {/* Options */}
        <button onClick={e => { e.stopPropagation(); setActiveMenuId(menuOpen ? null : song.id); }} style={{ position: 'absolute', top: '7px', right: '7px', background: 'rgba(0,0,0,0.65)', border: 'none', cursor: 'pointer', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 700, opacity: hov ? 1 : 0, transition: 'opacity 0.2s' }}>⋮</button>
        {menuOpen && (
          <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: '34px', right: '7px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '5px', zIndex: 50, minWidth: '155px', boxShadow: '0 12px 32px rgba(0,0,0,0.6)' }}>
            <button onClick={() => { toggleLike(song); setActiveMenuId(null); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '7px 10px', borderRadius: '7px', color: liked ? 'var(--danger)' : 'var(--text-primary)', fontSize: '12px', fontWeight: 500, fontFamily: 'var(--font)' }}>
              <Heart size={12} fill={liked ? 'var(--danger)' : 'none'} />{liked ? 'Unlike' : 'Like'}
            </button>
            {playlists.length > 0 && <div style={{ height: '1px', background: 'var(--border)', margin: '3px 0' }} />}
            {playlists.map(pl => (
              <button key={pl.id} onClick={() => { addSongToPlaylist(pl.id, song); setActiveMenuId(null); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '7px', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: '7px', color: 'var(--text-secondary)', fontSize: '11px', fontFamily: 'var(--font)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <Plus size={9} />Add to {pl.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <p style={{ fontSize: '12px', fontWeight: 600, color: isNowPlaying ? 'var(--amber)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>{song.title}</p>
      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.artist}</p>
    </div>
  );
};

/* ── Section ── */
const Section: React.FC<{
  title: string; songs: Song[]; viewAll?: () => void;
  activeMenuId: string | null; setActiveMenuId: (id: string | null) => void;
  handlePlay: (s: Song, q: Song[]) => void;
}> = ({ title, songs, viewAll, activeMenuId, setActiveMenuId, handlePlay }) => {
  if (!songs.length) return null;
  return (
    <section style={{ marginBottom: '38px', minWidth: 0, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>{title}</h3>
        {viewAll && (
          <button onClick={viewAll} style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 500, fontFamily: 'var(--font)', transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--amber)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
            See all <ChevronRight size={13} />
          </button>
        )}
      </div>
      <HorizontalScroll gap="14px">
        {songs.map(song => <SongCard key={song.id} song={song} queue={songs} activeMenuId={activeMenuId} setActiveMenuId={setActiveMenuId} handlePlay={handlePlay} />)}
      </HorizontalScroll>
    </section>
  );
};

/* ── Static data ── */
const FAV_IDS = ['GWwnRe0u','rjkrTnma','m1iXOUID','mPTrDSun','__YIeFT-','uP7MlTHz','eLm-JvK4','SM-rvz75','qcVqPqk5','vRNpPA7_','yBmo2qWU','QWLY3Ls_','QkFUdVod','BH07HVc8','kehuVn2F','cDHlLKvW','_KjTxjcC'];

const ARTISTS = [
  { name: 'Anirudh',       image: 'https://c.saavncdn.com/artists/Anirudh_Ravichander_500x500.jpg',  query: 'Anirudh Ravichander' },
  { name: 'Sid Sriram',    image: 'https://c.saavncdn.com/artists/Sid_Sriram_500x500.jpg',           query: 'Sid Sriram' },
  { name: 'Arijit Singh',  image: 'https://c.saavncdn.com/artists/Arijit_Singh_500x500.jpg',         query: 'Arijit Singh' },
  { name: 'GV Prakash',    image: 'https://c.saavncdn.com/artists/G_V_Prakash_Kumar_500x500.jpg',    query: 'GV Prakash' },
  { name: 'Hiphop Tamizha',image: 'https://c.saavncdn.com/artists/Hiphop_Tamizha_500x500.jpg',      query: 'Hiphop Tamizha' },
  { name: 'AR Rahman',     image: 'https://c.saavncdn.com/artists/AR_Rahman_500x500.jpg',            query: 'AR Rahman' },
];

const MOODS = [
  { label: 'Romantic',  query: 'romantic love songs',       bg: 'linear-gradient(135deg, #8b2252 0%, #c94a6a 100%)' },
  { label: 'Party',     query: 'party dance songs',         bg: 'linear-gradient(135deg, #7a3200 0%, #c45c00 100%)' },
  { label: 'Chill',     query: 'chill relaxing songs',      bg: 'linear-gradient(135deg, #0c4a4a 0%, #0e7070 100%)' },
  { label: 'Sad',       query: 'sad emotional songs',       bg: 'linear-gradient(135deg, #1e1a40 0%, #3a2d6e 100%)' },
  { label: 'Focus',     query: 'focus concentration music', bg: 'linear-gradient(135deg, #0c3320 0%, #1a5c36 100%)' },
  { label: 'Workout',   query: 'workout gym songs',         bg: 'linear-gradient(135deg, #4a0c0c 0%, #8a1c1c 100%)' },
];

export const Home: React.FC<{ setCurrentTab: (tab: string) => void }> = ({ setCurrentTab }) => {
  const { playSong, currentSong } = useAudio();
  const { recentlyPlayed, addToRecentlyPlayed } = useLibrary();

  const [favourites, setFavourites]   = useState<Song[]>([]);
  const [trending, setTrending]       = useState<Song[]>([]);
  const [newReleases, setNewReleases] = useState<Song[]>([]);
  const [tamilHits, setTamilHits]     = useState<Song[]>([]);
  const [teluguHits, setTeluguHits]   = useState<Song[]>([]);
  const [hindiHits, setHindiHits]     = useState<Song[]>([]);
  const [loading, setLoading]         = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    (async () => {
      try {
        const favs = await saavnApi.getSongsByIds(FAV_IDS);
        setFavourites(favs);
        setLoading(false);
        const [trend, nTamil, nHindi, nTelugu, tamil, telugu, hindi] = await Promise.all([
          saavnApi.searchSongs('trending hits 2025', 12),
          saavnApi.searchSongs('new tamil songs 2025', 5),
          saavnApi.searchSongs('new hindi songs 2025', 5),
          saavnApi.searchSongs('new telugu songs 2025', 5),
          saavnApi.searchSongs('tamil hits 2025', 10),
          saavnApi.searchSongs('telugu hits 2025', 10),
          saavnApi.searchSongs('hindi hits 2025', 10),
        ]);
        setTrending(trend);
        setNewReleases([...nTamil, ...nHindi, ...nTelugu].sort(() => Math.random() - 0.5));
        setTamilHits(tamil); setTeluguHits(telugu); setHindiHits(hindi);
      } catch (e) { console.error(e); setLoading(false); }
    })();
  }, []);

  const handlePlay = useCallback((song: Song, queue: Song[]) => {
    addToRecentlyPlayed(song);
    playSong(song, queue);
  }, [playSong, addToRecentlyPlayed]);

  const handleMood = async (query: string) => {
    try {
      const songs = await saavnApi.searchSongs(query, 20);
      if (songs.length) handlePlay(songs[Math.floor(Math.random() * songs.length)], songs);
    } catch (e) { console.error(e); }
  };

  const handleArtist = async (query: string) => {
    try {
      const songs = await saavnApi.searchSongs(query, 25);
      if (songs.length) handlePlay(songs[0], songs);
    } catch (e) { console.error(e); }
  };

  return (
    <div onClick={() => setActiveMenuId(null)} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '32px 28px 100px', height: '100%', width: '100%', minWidth: 0 }}>

      {/* ── Header ── */}
      <header style={{ marginBottom: '36px' }}>
        <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-tertiary)', letterSpacing: '0.5px', marginBottom: '5px' }}>{greeting}</p>
        <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.15, color: 'var(--text-primary)' }}>
          What's your vibe<span style={{ color: 'var(--amber)' }}>?</span>
        </h2>
      </header>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '280px', flexDirection: 'column', gap: '14px' }}>
          <div className="animate-spin" style={{ width: '32px', height: '32px', border: '2.5px solid var(--border-medium)', borderTopColor: 'var(--amber)', borderRadius: '50%' }} />
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Loading music…</p>
        </div>
      ) : (
        <>
          {/* Recently Played */}
          {recentlyPlayed.length > 0 && (
            <section style={{ marginBottom: '36px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px', letterSpacing: '-0.2px' }}>Recently Played</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                {recentlyPlayed.slice(0, 6).map(song => {
                  const active = currentSong?.id === song.id;
                  return (
                    <button key={song.id} onClick={() => handlePlay(song, recentlyPlayed)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px 7px 7px', background: active ? 'var(--amber-dim)' : 'var(--bg-elevated)', border: `1px solid ${active ? 'var(--amber-glow)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--text-primary)', textAlign: 'left', transition: 'background 0.15s, border-color 0.15s', fontFamily: 'var(--font)' }} onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--bg-hover)'; }}} onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'var(--bg-elevated)'; }}}>
                      <img src={song.imageUrl} alt={song.title} style={{ width: '38px', height: '38px', borderRadius: '7px', objectFit: 'cover', flexShrink: 0 }} />
                      <div style={{ overflow: 'hidden', flex: 1 }}>
                        <p style={{ fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: active ? 'var(--amber)' : 'var(--text-primary)' }}>{song.title}</p>
                        <p style={{ fontSize: '10px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>{song.artist}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Moods */}
          <section style={{ marginBottom: '36px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px', letterSpacing: '-0.2px' }}>Moods</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
              {MOODS.map(m => (
                <button key={m.label} onClick={() => handleMood(m.query)} style={{ height: '82px', background: m.bg, border: 'none', borderRadius: 'var(--radius-lg)', cursor: 'pointer', display: 'flex', alignItems: 'flex-end', padding: '14px 16px', textAlign: 'left', transition: 'transform 0.2s, filter 0.2s', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font)' }} onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.filter = 'brightness(1.12)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'brightness(1)'; }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.1px' }}>{m.label}</span>
                </button>
              ))}
            </div>
          </section>

          <Section title="Favourites"   songs={favourites}   activeMenuId={activeMenuId} setActiveMenuId={setActiveMenuId} handlePlay={handlePlay} />
          <Section title="Trending Now" songs={trending}     activeMenuId={activeMenuId} setActiveMenuId={setActiveMenuId} handlePlay={handlePlay} />
          <Section title="New Releases" songs={newReleases}  activeMenuId={activeMenuId} setActiveMenuId={setActiveMenuId} handlePlay={handlePlay} />

          {/* Artists */}
          <section style={{ marginBottom: '38px', minWidth: 0 }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', letterSpacing: '-0.2px' }}>Artists</h3>
            <HorizontalScroll gap="20px">
              {ARTISTS.map(art => (
                <div key={art.name} onClick={() => handleArtist(art.query)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '9px', flexShrink: 0, cursor: 'pointer', width: '88px' }}>
                  <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--border-medium)', transition: 'border-color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--amber)')} onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-medium)')}>
                    <img src={art.image} alt={art.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.3 }}>{art.name}</span>
                </div>
              ))}
            </HorizontalScroll>
          </section>

          <Section title="Tamil Hits"   songs={tamilHits}   activeMenuId={activeMenuId} setActiveMenuId={setActiveMenuId} handlePlay={handlePlay} />
          <Section title="Telugu Hits"  songs={teluguHits}  activeMenuId={activeMenuId} setActiveMenuId={setActiveMenuId} handlePlay={handlePlay} />
          <Section title="Hindi Hits"   songs={hindiHits}   activeMenuId={activeMenuId} setActiveMenuId={setActiveMenuId} handlePlay={handlePlay} />
        </>
      )}
    </div>
  );
};
