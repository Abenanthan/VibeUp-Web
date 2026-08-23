import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  Play, Heart, Plus, ChevronRight, ChevronLeft, Shuffle, Sparkles,
  Flame, PartyPopper, Waves, CloudRain, Target, Dumbbell,
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useLibrary } from '../context/LibraryContext';
import { saavnApi } from '../services/api';
import type { Song } from '../types';
import { FadeInView, StaggerContainer, StaggerItem, HoverScale, MotionCard } from '../components/motion';
import { ArtistCoverflow } from '../components/ArtistCoverflow';

/* ── Live equaliser strip — pauses with the transport ── */
const LiveEq: React.FC<{ playing: boolean; bars?: number; height?: number }> = ({ playing, bars = 7, height = 22 }) => (
  <span className={`eq-live${playing ? '' : ' eq-paused'}`} style={{ height: `${height}px` }} aria-hidden="true">
    {Array.from({ length: bars }, (_, i) => <i key={i} />)}
  </span>
);

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
  rank?: number;
}> = ({ song, queue, activeMenuId, setActiveMenuId, handlePlay, onArtistClick, rank }) => {
  const { toggleLike, isLiked, playlists, addSongToPlaylist } = useLibrary();
  const { currentSong, isPlaying } = useAudio();
  const [hov, setHov] = useState(false);
  const liked = isLiked(song.id);
  const menuOpen = activeMenuId === song.id;
  const isNowPlaying = currentSong?.id === song.id;

  return (
    <StaggerItem style={{ width: '148px', flexShrink: 0, cursor: 'pointer', position: 'relative' }}>
      <div className="song-card-hot" onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ position: 'relative' }}>
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
          {/* Now-playing badge — live bars instead of a static dot */}
          {isNowPlaying && (
            <div style={{ position: 'absolute', top: '7px', left: '7px', zIndex: 4, display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 8px', borderRadius: '99px', background: 'rgba(8,6,15,0.72)', backdropFilter: 'blur(8px)', border: '1px solid var(--border-strong)' }}>
              <LiveEq playing={isPlaying} bars={3} height={10} />
            </div>
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
          {/* Chart position — outlined numeral bleeding off the artwork corner */}
          {rank !== undefined && <span className="rank-badge">{rank}</span>}
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

/* ── Section header — accent bar + display type + optional play-all ── */
const SectionHead: React.FC<{
  title: string; eyebrow?: string; onPlayAll?: () => void; viewAll?: () => void;
}> = ({ title, eyebrow, onPlayAll, viewAll }) => (
  <div className="section-head">
    <div className="section-head-title">
      <span className="section-bar" />
      <div style={{ minWidth: 0 }}>
        {eyebrow && <p className="section-label" style={{ marginBottom: '1px' }}>{eyebrow}</p>}
        <h3>{title}</h3>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
      {onPlayAll && (
        <HoverScale scale={1.08} tapScale={0.92}>
          <button onClick={onPlayAll} title={`Shuffle ${title}`} aria-label={`Shuffle ${title}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-medium)', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'color 0.15s, border-color 0.15s' }} onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-2)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-medium)'; }}>
            <Shuffle size={13} />
          </button>
        </HoverScale>
      )}
      {viewAll && (
        <HoverScale scale={1.05} tapScale={0.95}>
          <button onClick={viewAll} style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font)', transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
            See all <ChevronRight size={13} />
          </button>
        </HoverScale>
      )}
    </div>
  </div>
);

/* ── Section ── */
const Section: React.FC<{
  title: string; eyebrow?: string; songs: Song[]; viewAll?: () => void;
  activeMenuId: string | null; setActiveMenuId: (id: string | null) => void;
  handlePlay: (s: Song, q: Song[]) => void;
  onArtistClick?: (id: string | null, name: string) => void;
  ranked?: boolean;
}> = ({ title, eyebrow, songs, viewAll, activeMenuId, setActiveMenuId, handlePlay, onArtistClick, ranked }) => {
  if (!songs.length) return null;
  const shuffleSection = () => handlePlay(songs[Math.floor(Math.random() * songs.length)], songs);
  return (
    <FadeInView direction="left" delay={0.1} style={{ marginBottom: '38px', minWidth: 0, width: '100%', position: 'relative', zIndex: 1 }}>
      <SectionHead title={title} eyebrow={eyebrow} onPlayAll={shuffleSection} viewAll={viewAll} />
      <HorizontalScroll gap="14px">
        <StaggerContainer style={{ display: 'flex', gap: '14px' }}>
          {songs.map((song, i) => <SongCard key={song.id} song={song} queue={songs} activeMenuId={activeMenuId} setActiveMenuId={setActiveMenuId} handlePlay={handlePlay} onArtistClick={onArtistClick} rank={ranked ? i + 1 : undefined} />)}
        </StaggerContainer>
      </HorizontalScroll>
    </FadeInView>
  );
};

/* ── Static data ── */
const HOME_CACHE_KEY = 'vibeup_home_v1';
/* Last hero pick, so the next visit starts on a different track. */
const FEATURED_LAST_KEY = 'vibeup_featured_last';
const FAV_IDS =['GWwnRe0u', 'rjkrTnma', 'm1iXOUID', 'mPTrDSun', '__YIeFT-', 'uP7MlTHz', 'eLm-JvK4', 'SM-rvz75', 'qcVqPqk5', 'vRNpPA7_', 'yBmo2qWU', 'QWLY3Ls_', 'QkFUdVod', 'BH07HVc8', 'kehuVn2F', 'cDHlLKvW', '_KjTxjcC'];

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

const MOODS: { label: string; sub: string; query: string; bg: string; icon: React.ReactNode }[] = [
  { label: 'Romantic', sub: 'Slow burn',    query: 'romantic love songs',        bg: 'linear-gradient(135deg, #7a1f52 0%, #d6407e 100%)', icon: <Heart size={17} /> },
  { label: 'Party',    sub: 'Full send',    query: 'party dance songs',          bg: 'linear-gradient(135deg, #4a1d7a 0%, #a855f7 100%)', icon: <PartyPopper size={17} /> },
  { label: 'Chill',    sub: 'Wind down',    query: 'chill relaxing songs',       bg: 'linear-gradient(135deg, #0c3a52 0%, #1591b0 100%)', icon: <Waves size={17} /> },
  { label: 'Sad',      sub: 'In your feels',query: 'sad emotional songs',        bg: 'linear-gradient(135deg, #1e1a40 0%, #3a2d6e 100%)', icon: <CloudRain size={17} /> },
  { label: 'Focus',    sub: 'Locked in',    query: 'focus concentration music',  bg: 'linear-gradient(135deg, #241a52 0%, #4f46c8 100%)', icon: <Target size={17} /> },
  { label: 'Workout',  sub: 'Go harder',    query: 'workout gym songs',          bg: 'linear-gradient(135deg, #5a0c3a 0%, #c01e6e 100%)', icon: <Dumbbell size={17} /> },
];

export const Home: React.FC<{
  setCurrentTab: (tab: string) => void;
  onArtistClick: (artistId: string | null, artistName: string) => void;
}> = ({ setCurrentTab: _setCurrentTab, onArtistClick }) => {
  const { playSong, currentSong, isPlaying } = useAudio();
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
    let cancelled = false;

    // ── 1) Instant paint from this session's cache (stale-while-revalidate) ──
    try {
      const raw = sessionStorage.getItem(HOME_CACHE_KEY);
      if (raw) {
        const c = JSON.parse(raw) as Partial<Record<string, Song[]>>;
        if (c.favourites?.length) {
          setFavourites(c.favourites);
          setTrending(c.trending ?? []);
          setNewReleases(c.newReleases ?? []);
          setTamilHits(c.tamilHits ?? []);
          setTeluguHits(c.teluguHits ?? []);
          setHindiHits(c.hindiHits ?? []);
          setLoading(false);
        }
      }
    } catch { /* ignore malformed cache */ }

    // ── 2) Revalidate in the background — all requests fire in parallel ──
    (async () => {
      try {
        const year = new Date().getFullYear();
        const favsP = saavnApi.getSongsByIds(FAV_IDS);
        const restP = Promise.all([
          saavnApi.searchSongs(`trending songs ${year}`, 24),
          saavnApi.searchSongs(`new tamil songs ${year}`, 5),
          saavnApi.searchSongs(`new hindi songs ${year}`, 5),
          saavnApi.searchSongs(`new telugu songs ${year}`, 5),
          saavnApi.searchSongs(`tamil hits ${year}`, 24),
          saavnApi.searchSongs(`telugu hits ${year}`, 24),
          saavnApi.searchSongs(`hindi hits ${year}`, 24),
        ]);

        // Clear the spinner the moment favourites land — don't wait on the rows.
        favsP.then((favs) => {
          if (!cancelled && favs.length) { setFavourites(favs); setLoading(false); }
        }).catch(() => {});

        const [favs, [trend, nTamil, nHindi, nTelugu, tamil, telugu, hindi]] = await Promise.all([favsP, restP]);
        if (cancelled) return;

        const usedIds = new Set<string>();
        const usedArtwork = new Set<string>();
        // Keep the broad Trending row separate from the regional rows below it.
        const trendingSongs = selectDistinctSongs(trend, 12, usedIds, usedArtwork, ['english', 'hindi', 'punjabi']);
        const tamilSongs = selectDistinctSongs(tamil, 10, usedIds, usedArtwork, 'tamil');
        const teluguSongs = selectDistinctSongs(telugu, 10, usedIds, usedArtwork, 'telugu');
        const hindiSongs = selectDistinctSongs(hindi, 10, usedIds, usedArtwork, 'hindi');
        const newReleases = selectDistinctSongs([...nTamil, ...nHindi, ...nTelugu], 15, usedIds, usedArtwork).sort(() => Math.random() - 0.5);

        setTrending(trendingSongs);
        setTamilHits(tamilSongs);
        setTeluguHits(teluguSongs);
        setHindiHits(hindiSongs);
        setNewReleases(newReleases);
        setLoading(false);

        // Cache for instant paint next time the Home tab mounts this session.
        if (favs.length) {
          try {
            sessionStorage.setItem(HOME_CACHE_KEY, JSON.stringify({
              favourites: favs, trending: trendingSongs, tamilHits: tamilSongs,
              teluguHits: teluguSongs, hindiHits: hindiSongs, newReleases,
            }));
          } catch { /* quota — ignore */ }
        }
      } catch (e) { console.error(e); if (!cancelled) setLoading(false); }
    })();

    return () => { cancelled = true; };
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

  /* ── The one track the hero puts front and centre ──
     Picked at random from the favourites pool (trending as fallback), once per
     mount. Locking it in state matters: the pool is set twice — cache paint then
     revalidate — and re-rolling on every change would swap the hero out from
     under the user mid-scroll. The previous pick is remembered so two
     consecutive visits don't land on the same track. */
  const [featured, setFeatured] = useState<Song | null>(null);

  useEffect(() => {
    if (featured) return;
    const pool = favourites.length ? favourites : trending;
    if (!pool.length) return;

    let prev: string | null = null;
    try { prev = localStorage.getItem(FEATURED_LAST_KEY); } catch { /* private mode */ }

    const fresh = pool.length > 1 ? pool.filter(s => s.id !== prev) : pool;
    const pick = fresh[Math.floor(Math.random() * fresh.length)];

    setFeatured(pick);
    try { localStorage.setItem(FEATURED_LAST_KEY, pick.id); } catch { /* quota */ }
  }, [favourites, trending, featured]);

  const heroIsLive = !!featured && currentSong?.id === featured.id && isPlaying;

  /* Everything on the page, flattened — powers the "Shuffle everything" CTA. */
  const allSongs = useMemo(
    () => [...favourites, ...trending, ...newReleases, ...tamilHits, ...teluguHits, ...hindiHits],
    [favourites, trending, newReleases, tamilHits, teluguHits, hindiHits],
  );

  const shuffleAll = () => {
    if (!allSongs.length) return;
    const shuffled = [...allSongs].sort(() => Math.random() - 0.5);
    handlePlay(shuffled[0], shuffled);
  };

  return (
    <div onClick={() => setActiveMenuId(null)} className="page-content" style={{ position: 'relative' }}>

      {/* Ambient colour wash anchored to the top of the scroll region */}
      <div className="home-aurora" aria-hidden="true" />

      {/* ── Header ── */}
      <FadeInView direction="up" delay={0.1} style={{ marginBottom: '26px', position: 'relative', zIndex: 1 }} className="home-greeting">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Sparkles size={13} color="var(--accent-2)" />
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '1.2px', textTransform: 'uppercase' }}>{greeting}</p>
        </div>
        <h2 className="display-head" style={{ fontSize: '38px', color: 'var(--text-primary)' }}>
          What's your <span className="text-flame">vibe</span>
          <span style={{ color: 'var(--magenta)' }}>?</span>
        </h2>
      </FadeInView>

      {loading ? (
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '320px', flexDirection: 'column', gap: '18px' }}>
          <LiveEq playing bars={7} height={46} />
          <p className="shimmer-text" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.4px' }}>Warming up the decks…</p>
        </div>
      ) : (
        <>
          {/* ── Featured hero ── */}
          {featured && (
            <FadeInView direction="up" delay={0.05}>
              <div className="hero-feature">
                <div className="hero-feature-bleed" style={{ backgroundImage: `url(${featured.imageUrl})` }} aria-hidden="true" />

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '12px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 11px', borderRadius: '99px', background: 'var(--magenta-dim)', border: '1px solid var(--border-strong)', fontSize: '9px', fontWeight: 800, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--accent-3)' }}>
                      <Flame size={11} /> Fresh pick
                    </span>
                    {heroIsLive && <LiveEq playing bars={5} height={14} />}
                  </div>

                  <h3 className="display-head" style={{ fontSize: 'clamp(24px, 4vw, 40px)', color: '#fff', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {featured.title}
                  </h3>
                  <p
                    onClick={() => onArtistClick?.(null, featured.artist)}
                    style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-2)', marginBottom: '20px', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--accent-2)')}
                  >
                    {featured.artist}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    <button className="hype-btn" onClick={() => handlePlay(featured, favourites.length ? favourites : trending)}>
                      <Play size={15} fill="#fff" /> Play now
                    </button>
                    <button className="hype-btn hype-btn-ghost" onClick={shuffleAll}>
                      <Shuffle size={15} /> Shuffle everything
                    </button>
                  </div>
                </div>

                <div className="hero-feature-art">
                  <img src={featured.imageUrl} alt={featured.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              </div>
            </FadeInView>
          )}

          {/* ── Recently Played — glass chips ── */}
          {recentlyPlayed.length > 0 && (
            <FadeInView direction="up" delay={0.1} style={{ marginBottom: '36px', position: 'relative', zIndex: 1 }}>
              <SectionHead title="Jump back in" eyebrow="Recently played" />
              <StaggerContainer style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '9px' }}>
                {recentlyPlayed.slice(0, 6).map(song => {
                  const active = currentSong?.id === song.id;
                  return (
                    <StaggerItem key={song.id}>
                      <button onClick={() => handlePlay(song, recentlyPlayed)} className={`recent-chip${active ? ' is-active' : ''}`}>
                        <img src={song.imageUrl} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        <div style={{ overflow: 'hidden', flex: 1 }}>
                          <p style={{ fontSize: '12px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: active ? 'var(--accent-2)' : 'var(--text-primary)' }}>{song.title}</p>
                          <p
                            onClick={(e) => { e.stopPropagation(); onArtistClick?.(null, song.artist); }}
                            style={{ fontSize: '10px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px', cursor: 'pointer' }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                          >
                            {song.artist}
                          </p>
                        </div>
                        {active
                          ? <LiveEq playing={isPlaying} bars={3} height={13} />
                          : <Play size={13} fill="var(--text-tertiary)" color="var(--text-tertiary)" style={{ flexShrink: 0 }} />}
                      </button>
                    </StaggerItem>
                  );
                })}
              </StaggerContainer>
            </FadeInView>
          )}

          <Section title="Abe's Favourites" eyebrow="Hand-picked" songs={favourites} activeMenuId={activeMenuId} setActiveMenuId={setActiveMenuId} handlePlay={handlePlay} onArtistClick={onArtistClick} />

          {/* ── Moods ── */}
          <FadeInView direction="up" delay={0.2} style={{ marginBottom: '36px', position: 'relative', zIndex: 1 }}>
            <SectionHead title="Pick a mood" eyebrow="Instant playlist" />
            <StaggerContainer style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))', gap: '11px' }}>
              {MOODS.map(m => (
                <StaggerItem key={m.label}>
                  <button className="mood-tile" onClick={() => handleMood(m.query)} style={{ background: m.bg }}>
                    <span className="mood-tile-icon">{m.icon}</span>
                    <span style={{ display: 'block' }}>
                      <span style={{ display: 'block', fontSize: '15px', fontWeight: 800, color: '#fff', letterSpacing: '-0.2px' }}>{m.label}</span>
                      <span style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.65)', marginTop: '1px' }}>{m.sub}</span>
                    </span>
                  </button>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </FadeInView>

          <Section title="Trending Now" eyebrow="Top 12 this week" songs={trending} ranked activeMenuId={activeMenuId} setActiveMenuId={setActiveMenuId} handlePlay={handlePlay} onArtistClick={onArtistClick} />
          <Section title="New Releases" eyebrow="Fresh drops" songs={newReleases} activeMenuId={activeMenuId} setActiveMenuId={setActiveMenuId} handlePlay={handlePlay} onArtistClick={onArtistClick} />

          {/* Artists — scroll-driven 3D coverflow */}
          <FadeInView direction="left" delay={0.1} style={{ marginBottom: '38px', minWidth: 0, position: 'relative', zIndex: 1 }}>
            <SectionHead title="Artists" eyebrow="On repeat" />
            <ArtistCoverflow
              artists={ARTISTS.map(a => ({ image: a.image, name: a.name, query: a.query }))}
              onArtistClick={onArtistClick}
            />
          </FadeInView>

          <Section title="Tamil Hits" eyebrow="Kollywood" songs={tamilHits} activeMenuId={activeMenuId} setActiveMenuId={setActiveMenuId} handlePlay={handlePlay} onArtistClick={onArtistClick} />
          <Section title="Telugu Hits" eyebrow="Tollywood" songs={teluguHits} activeMenuId={activeMenuId} setActiveMenuId={setActiveMenuId} handlePlay={handlePlay} onArtistClick={onArtistClick} />
          <Section title="Hindi Hits" eyebrow="Bollywood" songs={hindiHits} activeMenuId={activeMenuId} setActiveMenuId={setActiveMenuId} handlePlay={handlePlay} onArtistClick={onArtistClick} />
        </>
      )}
    </div>
  );
};
