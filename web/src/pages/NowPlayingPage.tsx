import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Pause, SkipForward, SkipBack, Shuffle, Repeat,
  Heart, ChevronDown, ListMusic, Plus, Sliders, Volume2, VolumeX,
  Disc3, Square, Sparkles, User, Music2,
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useLibrary } from '../context/LibraryContext';
import { saavnApi } from '../services/api';
import type { LyricLine } from '../services/api';
import type { Song } from '../types';
import {
  motion, AnimatePresence, useMotionValue, useTransform, useSpring,
  HoverScale, ParticleBurst,
} from '../components/motion';

interface NowPlayingPageProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQueue: () => void;
  onOpenEq: () => void;
  onArtistClick?: (artistId: string | null, artistName: string) => void;
}

type ArtMode = 'vinyl' | 'cover' | 'ambient';
type RightTab = 'lyrics' | 'artist';

const fmt = (s: number) => { if (!s || isNaN(s)) return '0:00'; return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`; };

/* Mount-animated reveal (safe inside fixed overlays — no IntersectionObserver) */
const Reveal: React.FC<{ children: React.ReactNode; delay?: number; y?: number; x?: number; style?: React.CSSProperties }> =
  ({ children, delay = 0, y = 12, x = 0, style }) => (
    <motion.div
      initial={{ opacity: 0, y, x }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={style}
    >
      {children}
    </motion.div>
  );

export const NowPlayingPage: React.FC<NowPlayingPageProps> = ({ isOpen, onClose, onOpenQueue, onOpenEq, onArtistClick }) => {
  const {
    currentSong, isPlaying, currentTime, duration, volume,
    isShuffle, repeatMode, isResolvingUrl,
    togglePlayPause, seekTo, setVolume,
    playNext, playPrevious, toggleShuffle, toggleRepeatMode,
    activeQueue, lyricsState, lyricsLoading, playSong,
  } = useAudio();
  const { toggleLike, isLiked, playlists, addSongToPlaylist, addToRecentlyPlayed } = useLibrary();

  const [showPlaylist, setShowPlaylist] = useState(false);
  const [prevVol, setPrevVol] = useState(volume);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [artMode, setArtMode] = useState<ArtMode>('vinyl');
  const [rightTab, setRightTab] = useState<RightTab>('lyrics');
  const [showParticles, setShowParticles] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const [artistSongs, setArtistSongs] = useState<Song[]>([]);
  const [artistImage, setArtistImage] = useState<string | null>(null);
  const [artistLoading, setArtistLoading] = useState(false);
  const artistFetchedFor = useRef<string>('');

  const lyricsRef = useRef<HTMLDivElement>(null);
  const lineRefs  = useRef<(HTMLParagraphElement | null)[]>([]);

  // 3D Parallax Motion Values (cover mode)
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const rotateX = useTransform(mouseY, [0, 1], [22, -22]);
  const rotateY = useTransform(mouseX, [0, 1], [-22, 22]);
  const springRotateX = useSpring(rotateX, { stiffness: 200, damping: 20 });
  const springRotateY = useSpring(rotateY, { stiffness: 200, damping: 20 });
  const glareX = useTransform(mouseX, [0, 1], [0, 100]);
  const glareY = useTransform(mouseY, [0, 1], [0, 100]);
  const glare = useTransform([glareX, glareY], ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.16) 0%, transparent 55%)`);

  const liked    = currentSong ? isLiked(currentSong.id) : false;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isDisk = artMode === 'vinyl';

  const handleMute = () => { if (volume > 0) { setPrevVol(volume); setVolume(0); } else setVolume(prevVol || 0.8); };

  // Synced lyric highlight
  useEffect(() => {
    if (!lyricsState?.syncedLyrics?.length) return;
    const ms = currentTime * 1000;
    let idx = 0;
    for (let i = 0; i < lyricsState.syncedLyrics.length; i++) {
      if (ms >= lyricsState.syncedLyrics[i].timeMs) idx = i; else break;
    }
    if (idx !== activeIdx) {
      setActiveIdx(idx);
      const el = lineRefs.current[idx];
      if (el && lyricsRef.current) {
        const c = lyricsRef.current;
        c.scrollTo({ top: el.offsetTop - c.clientHeight / 2 + el.clientHeight / 2, behavior: 'smooth' });
      }
    }
  }, [currentTime, lyricsState, activeIdx]);

  useEffect(() => { if (!isOpen) setShowPlaylist(false); }, [isOpen]);

  // Fetch "more from artist" and artist profile image when the Artist tab opens for a new artist
  useEffect(() => {
    if (!isOpen || rightTab !== 'artist' || !currentSong) return;
    const key = currentSong.artist;
    if (!key || artistFetchedFor.current === key) return;
    artistFetchedFor.current = key;
    setArtistLoading(true);
    setArtistSongs([]);
    setArtistImage(null);
    const primary = key.split(',')[0].trim();
    
    Promise.all([
      saavnApi.searchArtists(primary).then(results => {
        if (results && results.length > 0) {
          const match = results.find(a => a.name.toLowerCase() === primary.toLowerCase()) || results[0];
          return match.imageUrl;
        }
        return null;
      }).catch(() => null),
      saavnApi.searchSongs(primary, 16).catch(() => [])
    ]).then(([imgUrl, songs]) => {
      setArtistImage(imgUrl);
      setArtistSongs(songs.filter((s) => s.id !== currentSong.id).slice(0, 12));
    }).catch(() => {
      setArtistImage(null);
      setArtistSongs([]);
    }).finally(() => {
      setArtistLoading(false);
    });
  }, [isOpen, rightTab, currentSong]);

  // Reset artist cache when the song's artist changes
  useEffect(() => {
    if (currentSong && artistFetchedFor.current !== currentSong.artist) {
      artistFetchedFor.current = '';
      if (rightTab === 'artist') setArtistSongs([]);
    }
  }, [currentSong]); // eslint-disable-line react-hooks/exhaustive-deps

  const cycleMode = useCallback(() => {
    setArtMode((m) => (m === 'vinyl' ? 'cover' : m === 'cover' ? 'ambient' : 'vinyl'));
    setShowParticles(true);
    setTimeout(() => setShowParticles(false), 900);
  }, []);

  const pickMode = (m: ArtMode) => {
    if (m === artMode) return;
    setArtMode(m);
    setShowParticles(true);
    setTimeout(() => setShowParticles(false), 900);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };
  const handleMouseLeave = () => { setIsHovered(false); mouseX.set(0.5); mouseY.set(0.5); };

  const playArtistSong = (song: Song) => { addToRecentlyPlayed(song); playSong(song, artistSongs); };

  if (!currentSong) return null;

  const primaryArtist = currentSong.artist.split(',')[0].trim();

  const iconBtn = (onClick: () => void, active: boolean, children: React.ReactNode, title?: string) => (
    <HoverScale scale={1.15} tapScale={0.9}>
      <button onClick={onClick} title={title} style={{ background: 'none', border: 'none', cursor: 'pointer', color: active ? 'var(--magenta)' : 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center' }}>
        {children}
      </button>
    </HoverScale>
  );

  const modeBtns: { id: ArtMode; icon: React.ReactNode; label: string }[] = [
    { id: 'vinyl',   icon: <Disc3 size={15} />,    label: 'Vinyl' },
    { id: 'cover',   icon: <Square size={14} />,   label: 'Cover' },
    { id: 'ambient', icon: <Sparkles size={14} />, label: 'Ambient' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#08060f' }}
        >
          {/* Blurred album art background */}
          <motion.div
            key={currentSong.imageUrl}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
            style={{ position: 'absolute', inset: 0, backgroundImage: `url(${currentSong.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(90px) brightness(0.22) saturate(1.5)', transform: 'scale(1.25)', zIndex: 0 }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,6,15,0.7), rgba(8,6,15,0.82))', zIndex: 1, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--accent), var(--magenta), transparent)', zIndex: 3, opacity: 0.7 }} />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%', padding: 'min(30px, 3vh) 48px min(26px, 2.5vh)', boxSizing: 'border-box' }}>

            {/* Top bar */}
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'min(20px, 2.5vh)', flexShrink: 0 }}>
              <HoverScale>
                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50%', width: '38px', height: '38px', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronDown size={22} />
                </button>
              </HoverScale>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '2.5px', color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>Now Playing</p>
              </div>
              <HoverScale>
                <button onClick={() => setShowPlaylist(v => !v)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50%', width: '38px', height: '38px', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={20} />
                </button>
              </HoverScale>
            </motion.div>

            {/* Add to playlist dropdown */}
            <AnimatePresence>
              {showPlaylist && playlists.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  style={{ position: 'absolute', top: '70px', right: '48px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '5px', zIndex: 10, minWidth: '175px', boxShadow: '0 16px 48px rgba(0,0,0,0.7)' }}
                >
                  {playlists.map(pl => (
                    <button key={pl.id} onClick={() => { addSongToPlaylist(pl.id, currentSong); setShowPlaylist(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: '7px', color: 'var(--text-primary)', fontSize: '12px', textAlign: 'left', fontFamily: 'var(--font)' }}>
                      <ListMusic size={12} color="var(--accent)" />{pl.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Two-column layout */}
            <div style={{ display: 'flex', flex: 1, gap: '56px', overflow: 'hidden', alignItems: 'center' }}>

              {/* LEFT: art + controls */}
              <div style={{ width: '42%', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '4px 0', boxSizing: 'border-box' }}>

                {/* Album art */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'min(20px, 2.5vh)', flexShrink: 0 }}>
                  <motion.div
                    layout
                    onClick={cycleMode}
                    onMouseMove={artMode === 'cover' ? handleMouseMove : undefined}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={handleMouseLeave}
                    animate={{ y: artMode === 'ambient' && isPlaying ? [-5, 5, -5] : 0 }}
                    transition={{ y: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }}
                    title="Tap artwork to switch view"
                    style={{
                      position: 'relative',
                      width: artMode === 'ambient' ? 'min(290px, 36vh, 100%)' : 'min(340px, 42vh, 100%)',
                      aspectRatio: '1/1',
                      borderRadius: isDisk ? '50%' : '18px',
                      overflow: 'visible',
                      rotateX: springRotateX,
                      rotateY: springRotateY,
                      scale: isHovered ? 1.03 : (isPlaying ? 1 : 0.96),
                      perspective: '1000px',
                      transformStyle: 'preserve-3d',
                      cursor: 'pointer',
                      boxShadow: isHovered
                        ? '0 32px 80px rgba(0,0,0,0.85), 0 0 40px var(--magenta-glow)'
                        : (isDisk ? '0 20px 60px rgba(0,0,0,0.6)' : '0 18px 44px rgba(0,0,0,0.55)'),
                    }}
                    className={isPlaying && artMode === 'ambient' ? 'breathing-glow-active' : ''}
                  >
                    {/* Ambient aurora behind art */}
                    <AnimatePresence>
                      {artMode === 'ambient' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="aurora-blob" />
                      )}
                    </AnimatePresence>

                    <motion.div
                      layout
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        borderRadius: 'inherit',
                        overflow: 'hidden',
                        // Album artwork occasionally has credits right at its edge. Keep an
                        // inset in non-vinyl modes so those details stay fully visible.
                        padding: isDisk ? 0 : '12px',
                        boxSizing: 'border-box',
                        background: isDisk ? 'transparent' : '#121018',
                      }}
                    >
                      <img
                        src={currentSong.imageUrl}
                        alt={currentSong.title}
                        style={{
                          // Preserve the entire cover in square and ambient modes; the vinyl view
                          // deliberately remains filled so it reads as a record.
                          width: '100%', height: '100%', objectFit: isDisk ? 'cover' : 'contain', objectPosition: 'center', display: 'block',
                          animation: isDisk ? 'spinVinyl 20s linear infinite' : 'none',
                          animationPlayState: isPlaying ? 'running' : 'paused',
                          borderRadius: 'inherit',
                        }}
                      />

                      {/* Vinyl overlays */}
                      <AnimatePresence>
                        {isDisk && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, borderRadius: '50%', pointerEvents: 'none' }}>
                            <div className="vinyl-spindle" />
                            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle, transparent 35%, rgba(0,0,0,0.15) 40%, rgba(255,255,255,0.03) 45%, transparent 50%, rgba(0,0,0,0.15) 55%, rgba(255,255,255,0.03) 60%, transparent 65%)' }} />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Cover overlays (holo sheen + glare) */}
                      <AnimatePresence>
                        {artMode === 'cover' && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                            <div className={`holo-sheen ${isHovered ? 'holo-sheen-active' : ''}`} />
                            <motion.div style={{ position: 'absolute', inset: 0, background: glare, opacity: isHovered ? 1 : 0 }} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* Neon ring (vinyl + playing) */}
                    <AnimatePresence>
                      {isDisk && isPlaying && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="neon-orbit-ring" />
                      )}
                    </AnimatePresence>

                    {/* Ambient prismatic ring */}
                    <AnimatePresence>
                      {artMode === 'ambient' && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 0.7, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="prismatic-ring" />
                      )}
                    </AnimatePresence>

                    {showParticles && <ParticleBurst count={16} color="var(--magenta)" size={5} />}
                  </motion.div>
                </div>

                {/* View-mode segmented control */}
                <Reveal delay={0.1} style={{ display: 'flex', justifyContent: 'center', marginBottom: 'min(14px, 1.5vh)', flexShrink: 0 }}>
                  <div style={{ display: 'flex', gap: '4px', padding: '4px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '99px' }}>
                    {modeBtns.map((m) => {
                      const active = artMode === m.id;
                      return (
                        <button key={m.id} onClick={() => pickMode(m.id)} title={m.label} aria-label={`${m.label} artwork mode`} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', borderRadius: '99px', border: 'none', cursor: 'pointer', background: 'none', color: active ? '#fff' : 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font)' }}>
                          {active && <motion.div layoutId="art-mode-pill" style={{ position: 'absolute', inset: 0, background: 'var(--gradient-main)', borderRadius: '99px', zIndex: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
                          <span style={{ position: 'relative', zIndex: 1, display: 'flex' }}>{m.icon}</span>
                        </button>
                      );
                    })}
                  </div>
                </Reveal>

                {/* Song info */}
                <Reveal delay={0.15} style={{ marginBottom: 'min(14px, 1.5vh)', flexShrink: 0, textAlign: 'center' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1.25, color: '#fff', marginBottom: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentSong.title}</h2>
                  <p style={{ fontSize: '13px', color: 'var(--accent-2)', fontWeight: 600 }}>{currentSong.artist}</p>
                </Reveal>

                {/* Progress bar */}
                <Reveal delay={0.2} style={{ marginBottom: 'min(14px, 1.5vh)', flexShrink: 0 }}>
                  <input 
                    type="range" 
                    min="0" 
                    max={duration || 100} 
                    step="0.1"
                    value={currentTime} 
                    onChange={e => seekTo(parseFloat(e.target.value))} 
                    style={{ width: '100%', cursor: 'pointer', marginBottom: '8px', '--range-progress': `${progress}%` } as React.CSSProperties} 
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{fmt(currentTime)}</span>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{fmt(duration)}</span>
                  </div>
                </Reveal>

                {/* Controls */}
                <Reveal delay={0.25} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'min(18px, 2vh)', flexShrink: 0 }}>
                  {iconBtn(toggleShuffle, isShuffle, <Shuffle size={18} />, 'Shuffle')}
                  <HoverScale scale={1.15} tapScale={0.9}>
                    <button onClick={playPrevious} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)' }}><SkipBack size={26} fill="currentColor" /></button>
                  </HoverScale>
                  <HoverScale scale={1.06} tapScale={0.9}>
                    <button onClick={togglePlayPause} disabled={isResolvingUrl} style={{ width: '58px', height: '58px', borderRadius: '50%', background: 'var(--gradient-main)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 26px var(--accent-glow)', opacity: isResolvingUrl ? 0.6 : 1 }}>
                      <AnimatePresence mode="wait">
                        {isResolvingUrl ? (
                          <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                            <div className="animate-spin" style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%' }} />
                          </motion.div>
                        ) : isPlaying ? (
                          <motion.div key="pause" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                            <Pause size={24} fill="#fff" color="#fff" />
                          </motion.div>
                        ) : (
                          <motion.div key="play" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                            <Play size={24} fill="#fff" color="#fff" style={{ transform: 'translateX(2px)' }} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  </HoverScale>
                  <HoverScale scale={1.15} tapScale={0.9}>
                    <button onClick={playNext} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)' }}><SkipForward size={26} fill="currentColor" /></button>
                  </HoverScale>
                  <div style={{ position: 'relative' }}>
                    {iconBtn(toggleRepeatMode, repeatMode !== 'none', <Repeat size={18} />, 'Repeat')}
                    <AnimatePresence>
                      {repeatMode === 'song' && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} style={{ position: 'absolute', top: '-3px', right: '-3px', background: 'var(--magenta)', color: '#fff', fontSize: '7px', fontWeight: 800, borderRadius: '50%', width: '12px', height: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </Reveal>

                {/* Utility row */}
                <Reveal delay={0.3} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 'var(--radius-lg)', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <HoverScale scale={1.2} tapScale={0.9}>
                      <button onClick={() => toggleLike(currentSong)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: liked ? 'var(--danger)' : 'rgba(255,255,255,0.5)', display: 'flex' }}><Heart size={17} fill={liked ? 'var(--danger)' : 'none'} /></button>
                    </HoverScale>
                    <HoverScale scale={1.15} tapScale={0.9}>
                      <button onClick={onOpenEq} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex' }}><Sliders size={16} /></button>
                    </HoverScale>
                    <HoverScale scale={1.15} tapScale={0.9}>
                      <div style={{ position: 'relative' }}>
                        <button onClick={onOpenQueue} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex' }}><ListMusic size={16} /></button>
                        {activeQueue.length > 0 && <span style={{ position: 'absolute', top: '-5px', right: '-7px', background: 'var(--magenta)', color: '#fff', fontSize: '7px', borderRadius: '10px', padding: '1px 3px', fontWeight: 800 }}>{activeQueue.length}</span>}
                      </div>
                    </HoverScale>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <button onClick={handleMute} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex' }}>
                      {volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </button>
                    <input type="range" min="0" max="1" step="0.01" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} style={{ width: '80px', '--range-progress': `${volume * 100}%` } as React.CSSProperties} />
                  </div>
                </Reveal>
              </div>

              {/* RIGHT: Lyrics / Artist tabs */}
              <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.5 }} style={{ flex: 1, height: '92%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* Tab switcher */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexShrink: 0 }}>
                  {([['lyrics', 'Lyrics', <Music2 size={13} key="l" />], ['artist', 'Artist', <User size={13} key="a" />]] as const).map(([id, label, icon]) => {
                    const active = rightTab === id;
                    return (
                      <button key={id} onClick={() => setRightTab(id as RightTab)} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 16px', borderRadius: '99px', border: 'none', cursor: 'pointer', background: 'none', color: active ? '#fff' : 'rgba(255,255,255,0.45)', fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font)' }}>
                        {active && <motion.div layoutId="right-tab-pill" style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border-medium)', borderRadius: '99px', zIndex: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
                        <span style={{ position: 'relative', zIndex: 1, display: 'flex' }}>{icon}</span>
                        <span style={{ position: 'relative', zIndex: 1 }}>{label}</span>
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait">
                  {rightTab === 'lyrics' ? (
                    <motion.div key="lyrics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <div ref={lyricsRef} style={{ flex: 1, overflowY: 'auto', paddingRight: '8px', scrollBehavior: 'smooth', maskImage: 'linear-gradient(to bottom, transparent 0%, white 14%, white 86%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, white 14%, white 86%, transparent 100%)' }}>
                        <div style={{ paddingTop: '70px', paddingBottom: '160px' }}>
                          {lyricsLoading && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px' }}>
                              <div className="animate-spin" style={{ border: '2px solid var(--border-medium)', borderTopColor: 'var(--accent)', width: '24px', height: '24px', borderRadius: '50%' }} />
                              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Loading lyrics…</p>
                            </div>
                          )}
                          {!lyricsLoading && lyricsState?.instrumental && (
                            <div style={{ textAlign: 'center', padding: '80px 0' }}>
                              <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)' }}>Instrumental</p>
                              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '6px' }}>No lyrics for this track</p>
                            </div>
                          )}
                          {!lyricsLoading && !lyricsState?.instrumental && !lyricsState?.plainLyrics && !lyricsState?.syncedLyrics && (
                            <div style={{ textAlign: 'center', padding: '80px 0' }}>
                              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-tertiary)' }}>No lyrics found</p>
                            </div>
                          )}
                          {!lyricsLoading && lyricsState?.synced && lyricsState.syncedLyrics && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                              {lyricsState.syncedLyrics.map((line: LyricLine, idx: number) => {
                                const isActive = idx === activeIdx;
                                return (
                                  <motion.p
                                    key={idx}
                                    ref={el => { lineRefs.current[idx] = el; }}
                                    onClick={() => seekTo(line.timeMs / 1000)}
                                    initial={false}
                                    animate={{ fontSize: isActive ? '22px' : '17px', color: isActive ? 'var(--accent-2)' : 'var(--text-secondary)', opacity: isActive ? 1 : 0.35, scale: isActive ? 1.04 : 1 }}
                                    style={{ fontWeight: 800, lineHeight: 1.5, cursor: 'pointer', letterSpacing: '-0.2px', margin: 0, padding: '3px 0', transformOrigin: 'left center' }}
                                    whileHover={{ color: 'var(--text-primary)', opacity: 0.75 }}
                                  >
                                    {line.text}
                                  </motion.p>
                                );
                              })}
                            </div>
                          )}
                          {!lyricsLoading && !lyricsState?.synced && lyricsState?.plainLyrics && (
                            <div style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.9', whiteSpace: 'pre-line', fontWeight: 500 }}>{lyricsState.plainLyrics}</div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="artist" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }} className="hide-scrollbar">
                      {/* Artist header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '26px' }}>
                        <div style={{ position: 'relative', width: '92px', height: '92px', flexShrink: 0 }}>
                          <div style={{ position: 'absolute', inset: '-3px', borderRadius: '50%', background: 'var(--gradient-main)', filter: 'blur(2px)', opacity: 0.8 }} />
                          <img src={artistImage || currentSong.imageUrl} alt={primaryArtist} style={{ position: 'relative', width: '92px', height: '92px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--magenta)', marginBottom: '5px' }}>Artist</p>
                          <h2
                            onClick={() => {
                              onClose();
                              onArtistClick?.(null, primaryArtist);
                            }}
                            style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.6px', color: '#fff', lineHeight: 1.1, marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer', transition: 'color 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                            onMouseLeave={e => e.currentTarget.style.color = '#fff'}
                          >
                            {primaryArtist}
                          </h2>
                          <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                            {currentSong.language && <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 10px', borderRadius: '99px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-medium)', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{currentSong.language}</span>}
                            {currentSong.album && currentSong.album !== 'Unknown Album' && <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 10px', borderRadius: '99px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-medium)', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{currentSong.album}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Full artist credit if multiple */}
                      {currentSong.artist.includes(',') && (
                        <div style={{ marginBottom: '22px' }}>
                          <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-tertiary)', marginBottom: '7px' }}>Featuring</p>
                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{currentSong.artist}</p>
                        </div>
                      )}

                      {/* More from artist */}
                      <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--accent-2)', marginBottom: '14px' }}>More from {primaryArtist}</p>

                      {artistLoading && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: '12px' }}>
                          <div className="animate-spin" style={{ border: '2px solid var(--border-medium)', borderTopColor: 'var(--accent)', width: '22px', height: '22px', borderRadius: '50%' }} />
                          <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Finding tracks…</p>
                        </div>
                      )}

                      {!artistLoading && artistSongs.length === 0 && (
                        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', padding: '20px 0', fontStyle: 'italic' }}>No other tracks found.</p>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '40px' }}>
                        {artistSongs.map((song) => {
                          const active = currentSong.id === song.id;
                          return (
                            <HoverScale key={song.id} scale={1.01} tapScale={0.99}>
                              <button onClick={() => playArtistSong(song)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 10px', borderRadius: 'var(--radius-md)', background: active ? 'var(--accent-dim)' : 'transparent', border: `1px solid ${active ? 'var(--accent-glow)' : 'transparent'}`, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font)', transition: 'background 0.15s' }}
                                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                                <div style={{ position: 'relative', width: '42px', height: '42px', flexShrink: 0 }}>
                                  <img src={song.imageUrl} alt={song.title} style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover' }} />
                                  <div style={{ position: 'absolute', inset: 0, borderRadius: '8px', background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: active ? 1 : 0 }}>
                                    <Play size={14} fill="#fff" color="#fff" />
                                  </div>
                                </div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                  <p style={{ fontSize: '13px', fontWeight: 600, color: active ? 'var(--accent-2)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.title}</p>
                                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>{song.album || song.artist}</p>
                                </div>
                                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 500, flexShrink: 0 }}>{fmt(song.duration)}</span>
                              </button>
                            </HoverScale>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
