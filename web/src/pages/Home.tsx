import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Play, Heart, Plus, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useLibrary } from '../context/LibraryContext';
import { saavnApi } from '../services/api';
import type { Song } from '../types';
import { FadeInView, StaggerContainer, StaggerItem, HoverScale, MotionCard } from '../components/motion';
import { ArtistCoverflow } from '../components/ArtistCoverflow';

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
      {showL && <button style={navBtn('left')} onClick={() => scroll('left')} onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent)')} onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}><ChevronLeft size={16} /></button>}
      {showR && <button style={navBtn('right')} onClick={() => scroll('right')} onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent)')} onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}><ChevronRight size={16} /></button>}
      <div
        ref={ref}
        className="hide-scrollbar"
        onMouseDown={e => { setDragging(true); dragX.current = e.pageX - (ref.current?.offsetLeft || 0); dragSL.current = ref.current?.scrollLeft || 0; }}
        onMouseMove={e => { if (!dragging || !ref.current) return; e.preventDefault(); const x = e.pageX - (ref.current.offsetLeft); ref.current.scrollLeft = dragSL.current - (x - dragX.current) * 1.5; check(); }}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
        style={{ display: 'flex', gap, overflowX: 'auto', padding: '14px 8px 12px', width: '100%', minWidth: 0, cursor: dragging ? 'grabbing' : 'grab', userSelect: dragging ? 'none' : 'auto' }}
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
  onArtistClick?: (id: string | null, name: string) => void;
}> = ({ song, queue, activeMenuId, setActiveMenuId, handlePlay, onArtistClick }) => {
  const { toggleLike, isLiked, playlists, addSongToPlaylist } = useLibrary();
  const { currentSong, isPlaying } = useAudio();
  const [hov, setHov] = useState(false);
  const liked = isLiked(song.id);
  const menuOpen = activeMenuId === song.id;
  const isNowPlaying = currentSong?.id === song.id;

  return (
    <StaggerItem style={{ width: '148px', flexShrink: 0, cursor: 'pointer', position: 'relative' }}>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ position: 'relative' }}>
        {hov && (
          <div
            className="song-card-glow"
            style={{
              position: 'absolute',
              inset: '-6px',
              top: '-6px',
              left: '-6px',
              right: '-6px',
              height: '148px',
              borderRadius: '14px',
              background: 'var(--gradient-main)',
              opacity: 0.3,
              filter: 'blur(14px)',
              zIndex: 0,
              pointerEvents: 'none',
            }}
          />
        )}
        <MotionCard style={{ position: 'relative', width: '148px', height: '148px', borderRadius: '10px', overflow: 'hidden', marginBottom: '10px', zIndex: 1, border: hov ? '1px solid var(--accent)' : '1px solid transparent', boxShadow: hov ? '0 0 20px var(--accent-glow), 0 0 40px var(--magenta-glow), 0 8px 32px rgba(0,0,0,0.55)' : '0 3px 10px rgba(0,0,0,0.3)', transition: 'box-shadow 0.35s ease, transform 0.25s ease, border-color 0.25s', transform: hov ? 'translateY(-6px) scale(1.03)' : 'none' }}>
          <img src={song.imageUrl} alt={song.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s', transform: hov ? 'scale(1.04)' : 'scale(1)' }} />
          {/* Now playing teal indicator */}
          {isNowPlaying && (
            <div style={{ position: 'absolute', top: '8px', left: '8px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--teal)', boxShadow: '0 0 8px var(--teal)' }} />
          )}
          {/* Play overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: hov ? 1 : 0, transition: 'opacity 0.2s' }}>
            <HoverScale scale={1.15} tapScale={0.9}>
              <button onClick={() => handlePlay(song, queue)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px var(--accent-glow)', transform: hov ? 'scale(1)' : 'scale(0.8)', transition: 'transform 0.2s' }}>
                {isNowPlaying && isPlaying ? <span style={{ width: '14px', height: '14px', display: 'flex', gap: '2px', alignItems: 'flex-end' }}>
                  {[1, 2, 3].map(i => <span key={i} className="visualizer-bar" style={{ background: 'var(--bg-base)' }} />)}
                </span> : <Play size={15} fill="#0d0c0a" color="#0d0c0a" style={{ marginLeft: '2px' }} />}
              </button>
            </HoverScale>
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
        </MotionCard>
        <p style={{ fontSize: '12px', fontWeight: 600, color: isNowPlaying ? 'var(--accent)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>{song.title}</p>
        <p
          onClick={(e) => {
            e.stopPropagation();
            onArtistClick?.(null, song.artist);
          }}
          style={{ fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          {song.artist}
        </p>
      </div>
    </StaggerItem>
  );
};

/* ── Section ── */
const Section: React.FC<{
  title: string; songs: Song[]; viewAll?: () => void;
  activeMenuId: string | null; setActiveMenuId: (id: string | null) => void;
  handlePlay: (s: Song, q: Song[]) => void;
  onArtistClick?: (id: string | null, name: string) => void;
}> = ({ title, songs, viewAll, activeMenuId, setActiveMenuId, handlePlay, onArtistClick }) => {
  if (!songs.length) return null;
  return (
    <FadeInView direction="left" delay={0.1} style={{ marginBottom: '38px', minWidth: 0, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>{title}</h3>
        {viewAll && (
          <HoverScale scale={1.05} tapScale={0.95}>
            <button onClick={viewAll} style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 500, fontFamily: 'var(--font)', transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
              See all <ChevronRight size={13} />
            </button>
          </HoverScale>
        )}
      </div>
      <HorizontalScroll gap="14px">
        <StaggerContainer style={{ display: 'flex', gap: '14px' }}>
          {songs.map(song => <SongCard key={song.id} song={song} queue={songs} activeMenuId={activeMenuId} setActiveMenuId={setActiveMenuId} handlePlay={handlePlay} onArtistClick={onArtistClick} />)}
        </StaggerContainer>
      </HorizontalScroll>
    </FadeInView>
  );
};

/* ── Static data ── */
const FAV_IDS = ['GWwnRe0u', 'rjkrTnma', 'm1iXOUID', 'mPTrDSun', '__YIeFT-', 'uP7MlTHz', 'eLm-JvK4', 'SM-rvz75', 'qcVqPqk5', 'vRNpPA7_', 'yBmo2qWU', 'QWLY3Ls_', 'QkFUdVod', 'BH07HVc8', 'kehuVn2F', 'cDHlLKvW', '_KjTxjcC'];

const selectDistinctSongs = (
  songs: Song[],
  limit: number,
  usedIds: Set<string>,
  usedArtwork: Set<string>,
  language?: string | string[],
) => {
  const languages = language ? new Set(Array.isArray(language) ? language : [language]) : null;
  const selected: Song[] = [];

  for (const song of songs) {
    const songLanguage = song.language.trim().toLowerCase();
    const artwork = song.imageUrl.trim();
    if ((languages && !languages.has(songLanguage)) || usedIds.has(song.id) || (artwork && usedArtwork.has(artwork))) continue;
    selected.push(song);
    usedIds.add(song.id);
    if (artwork) usedArtwork.add(artwork);
    if (selected.length === limit) break;
  }
  return selected;
};

const ARTISTS = [
  { name: 'Anirudh', image: 'https://c.saavncdn.com/artists/Anirudh_Ravichander_500x500.jpg', query: 'Anirudh Ravichander' },
  { name: 'Sid Sriram', image: 'https://c.saavncdn.com/artists/Sid_Sriram_500x500.jpg', query: 'Sid Sriram' },
  { name: 'Arijit Singh', image: 'https://c.saavncdn.com/artists/Arijit_Singh_500x500.jpg', query: 'Arijit Singh' },
  { name: 'Shreya Ghoshal', image: 'https://c.saavncdn.com/artists/Shreya_Ghoshal_500x500.jpg', query: 'Shreya Ghoshal' },
  { name: 'Pritam', image: 'https://c.saavncdn.com/artists/Pritam_Chakraborty-20170711073326_500x500.jpg', query: 'Pritam' },
  { name: 'Diljit Dosanjh', image: 'https://c.saavncdn.com/artists/Diljit_Dosanjh_500x500.jpg', query: 'Diljit Dosanjh' },
  { name: 'GV Prakash', image: 'https://c.saavncdn.com/artists/G_V_Prakash_Kumar_500x500.jpg', query: 'GV Prakash' },
  { name: 'Hiphop Tamizha', image: 'https://c.saavncdn.com/artists/Hiphop_Tamizha_500x500.jpg', query: 'Hiphop Tamizha' },
  { name: 'AR Rahman', image: 'https://c.saavncdn.com/artists/AR_Rahman_500x500.jpg', query: 'AR Rahman' },
  { name: 'Yo Yo Honey Singh', image: 'https://c.saavncdn.com/artists/Yo_Yo_Honey_Singh_500x500.jpg', query: 'Yo Yo Honey Singh' },
  { name: 'Yuvan Shankar Raja', image: 'https://c.saavncdn.com/artists/Yuvan_Shankar_Raja_500x500.jpg', query: 'Yuvan Shankar Raja' },
  { name: 'Harris Jayaraj', image: 'https://c.saavncdn.com/artists/Harris_Jayaraj_500x500.jpg', query: 'Harris Jayaraj' },
  { name: 'Santhosh Narayanan', image: 'https://c.saavncdn.com/artists/Santhosh_Narayanan_500x500.jpg', query: 'Santhosh Narayanan' },
  { name: 'Devi Sri Prasad', image: 'https://c.saavncdn.com/artists/Devi_Sri_Prasad_500x500.jpg', query: 'Devi Sri Prasad' },
];

const MOODS = [
  { label: 'Romantic', query: 'romantic love songs', bg: 'linear-gradient(135deg, #7a1f52 0%, #d6407e 100%)' },
  { label: 'Party', query: 'party dance songs', bg: 'linear-gradient(135deg, #4a1d7a 0%, #a855f7 100%)' },
  { label: 'Chill', query: 'chill relaxing songs', bg: 'linear-gradient(135deg, #0c3a52 0%, #1591b0 100%)' },
  { label: 'Sad', query: 'sad emotional songs', bg: 'linear-gradient(135deg, #1e1a40 0%, #3a2d6e 100%)' },
  { label: 'Focus', query: 'focus concentration music', bg: 'linear-gradient(135deg, #241a52 0%, #4f46c8 100%)' },
  { label: 'Workout', query: 'workout gym songs', bg: 'linear-gradient(135deg, #5a0c3a 0%, #c01e6e 100%)' },
];

export const Home: React.FC<{
  setCurrentTab: (tab: string) => void;
  onArtistClick: (artistId: string | null, artistName: string) => void;
}> = ({ setCurrentTab: _setCurrentTab, onArtistClick }) => {
  const { playSong, currentSong } = useAudio();
  const { recentlyPlayed, addToRecentlyPlayed } = useLibrary();

  const [favourites, setFavourites] = useState<Song[]>([]);
  const [trending, setTrending] = useState<Song[]>([]);
  const [newReleases, setNewReleases] = useState<Song[]>([]);
  const [tamilHits, setTamilHits] = useState<Song[]>([]);
  const [teluguHits, setTeluguHits] = useState<Song[]>([]);
  const [hindiHits, setHindiHits] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    (async () => {
      try {
        const favs = await saavnApi.getSongsByIds(FAV_IDS);
        setFavourites(favs);
        setLoading(false);
        const year = new Date().getFullYear();
        const [trend, nTamil, nHindi, nTelugu, tamil, telugu, hindi] = await Promise.all([
          saavnApi.searchSongs(`trending songs ${year}`, 24),
          saavnApi.searchSongs(`new tamil songs ${year}`, 5),
          saavnApi.searchSongs(`new hindi songs ${year}`, 5),
          saavnApi.searchSongs(`new telugu songs ${year}`, 5),
          saavnApi.searchSongs(`tamil hits ${year}`, 24),
          saavnApi.searchSongs(`telugu hits ${year}`, 24),
          saavnApi.searchSongs(`hindi hits ${year}`, 24),
        ]);
        const usedIds = new Set<string>();
        const usedArtwork = new Set<string>();
        // Keep the broad Trending row separate from the regional rows below it.
        const trendingSongs = selectDistinctSongs(trend, 12, usedIds, usedArtwork, ['english', 'hindi', 'punjabi']);
        const tamilSongs = selectDistinctSongs(tamil, 10, usedIds, usedArtwork, 'tamil');
        const teluguSongs = selectDistinctSongs(telugu, 10, usedIds, usedArtwork, 'telugu');
        const hindiSongs = selectDistinctSongs(hindi, 10, usedIds, usedArtwork, 'hindi');
        const releases = selectDistinctSongs([...nTamil, ...nHindi, ...nTelugu], 15, usedIds, usedArtwork);

        setTrending(trendingSongs);
        setTamilHits(tamilSongs);
        setTeluguHits(teluguSongs);
        setHindiHits(hindiSongs);
        setNewReleases(releases.sort(() => Math.random() - 0.5));
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

  return (
    <div onClick={() => setActiveMenuId(null)} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '32px 28px 100px', height: '100%', width: '100%', minWidth: 0 }}>

      {/* ── Header ── */}
      <FadeInView direction="up" delay={0.1} style={{ marginBottom: '36px' }}>
        <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-tertiary)', letterSpacing: '0.5px', marginBottom: '5px' }}>{greeting}</p>
        <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.15, color: 'var(--text-primary)' }}>
          What's your vibe<span style={{ color: 'var(--accent)' }}>?</span>
        </h2>
      </FadeInView>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '280px', flexDirection: 'column', gap: '14px' }}>
          <div className="animate-spin" style={{ width: '32px', height: '32px', border: '2.5px solid var(--border-medium)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Loading music…</p>
        </div>
      ) : (
        <>
          {/* Recently Played */}
          {recentlyPlayed.length > 0 && (
            <FadeInView direction="up" delay={0.1} style={{ marginBottom: '36px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px', letterSpacing: '-0.2px' }}>Recently Played</h3>
              <StaggerContainer style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                {recentlyPlayed.slice(0, 6).map(song => {
                  const active = currentSong?.id === song.id;
                  return (
                    <StaggerItem key={song.id}>
                      <HoverScale scale={1.03} tapScale={0.97}>
                        <div style={{ position: 'relative', width: '100%' }}>
                          <button onClick={() => handlePlay(song, recentlyPlayed)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px 7px 7px', background: active ? 'var(--accent-dim)' : 'var(--bg-elevated)', border: `1px solid ${active ? 'var(--accent-glow)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--text-primary)', textAlign: 'left', transition: 'background 0.15s, border-color 0.15s', fontFamily: 'var(--font)' }} onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--bg-hover)'; } }} onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'var(--bg-elevated)'; } }}>
                            <img src={song.imageUrl} alt={song.title} style={{ width: '38px', height: '38px', borderRadius: '7px', objectFit: 'cover', flexShrink: 0 }} />
                            <div style={{ overflow: 'hidden', flex: 1 }}>
                              <p style={{ fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: active ? 'var(--accent)' : 'var(--text-primary)' }}>{song.title}</p>
                              <p
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onArtistClick?.(null, song.artist);
                                }}
                                style={{ fontSize: '10px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px', cursor: 'pointer' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                              >
                                {song.artist}
                              </p>
                            </div>
                          </button>
                        </div>
                      </HoverScale>
                    </StaggerItem>
                  );
                })}
              </StaggerContainer>
            </FadeInView>
          )}

          <Section title="Abe's Favourites" songs={favourites} activeMenuId={activeMenuId} setActiveMenuId={setActiveMenuId} handlePlay={handlePlay} onArtistClick={onArtistClick} />

          {/* Moods */}
          <FadeInView direction="up" delay={0.2} style={{ marginBottom: '36px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px', letterSpacing: '-0.2px' }}>Moods</h3>
            <StaggerContainer style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
              {MOODS.map(m => (
                <StaggerItem key={m.label}>
                  <HoverScale scale={1.05} tapScale={0.95}>
                    <button onClick={() => handleMood(m.query)} style={{ width: '100%', height: '82px', background: m.bg, border: 'none', borderRadius: 'var(--radius-lg)', cursor: 'pointer', display: 'flex', alignItems: 'flex-end', padding: '14px 16px', textAlign: 'left', transition: 'filter 0.2s', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font)' }} onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.12)'; }} onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.1px' }}>{m.label}</span>
                    </button>
                  </HoverScale>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </FadeInView>
          <Section title="Trending Now" songs={trending} activeMenuId={activeMenuId} setActiveMenuId={setActiveMenuId} handlePlay={handlePlay} onArtistClick={onArtistClick} />
          <Section title="New Releases" songs={newReleases} activeMenuId={activeMenuId} setActiveMenuId={setActiveMenuId} handlePlay={handlePlay} onArtistClick={onArtistClick} />

          {/* Artists — scroll-driven 3D coverflow */}
          <FadeInView direction="left" delay={0.1} style={{ marginBottom: '38px', minWidth: 0 }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', letterSpacing: '-0.2px' }}>Artists</h3>
            <ArtistCoverflow
              artists={ARTISTS.map(a => ({ image: a.image, name: a.name, query: a.query }))}
              onArtistClick={onArtistClick}
            />
          </FadeInView>

          <Section title="Tamil Hits" songs={tamilHits} activeMenuId={activeMenuId} setActiveMenuId={setActiveMenuId} handlePlay={handlePlay} onArtistClick={onArtistClick} />
          <Section title="Telugu Hits" songs={teluguHits} activeMenuId={activeMenuId} setActiveMenuId={setActiveMenuId} handlePlay={handlePlay} onArtistClick={onArtistClick} />
          <Section title="Hindi Hits" songs={hindiHits} activeMenuId={activeMenuId} setActiveMenuId={setActiveMenuId} handlePlay={handlePlay} onArtistClick={onArtistClick} />
        </>
      )}
    </div>
  );
};
