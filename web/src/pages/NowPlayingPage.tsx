import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Pause, SkipForward, SkipBack, Shuffle, Repeat,
  Heart, ChevronDown, ListMusic, Plus, Sliders, Volume2, VolumeX,
  User, Music2,
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useLibrary } from '../context/LibraryContext';
import { saavnApi } from '../services/api';
import type { LyricLine } from '../services/api';
import type { Song } from '../types';
import {
  motion, AnimatePresence, HoverScale,
} from '../components/motion';

interface NowPlayingPageProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQueue: () => void;
  onOpenEq: () => void;
  onArtistClick?: (artistId: string | null, artistName: string) => void;
}

type RightTab = 'lyrics' | 'artist';

const fmt = (s: number) => { if (!s || isNaN(s)) return '0:00'; return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`; };

/* ── Live equaliser strip ── */
const LiveEq: React.FC<{ playing: boolean; bars?: number; height?: number }> = ({ playing, bars = 5, height = 14 }) => (
  <span className={`eq-live${playing ? '' : ' eq-paused'}`} style={{ height: `${height}px` }} aria-hidden="true">
    {Array.from({ length: bars }, (_, i) => <i key={i} />)}
  </span>
);

/* ──────────────────────────────────────────
   Scrub bar — drag/click/keyboard seeking.
   Replaces the native range input so the fill can carry the brand gradient
   and the whole track can grow on hover without fighting vendor pseudo-elements.
────────────────────────────────────────── */
const ScrubBar: React.FC<{ value: number; max: number; onSeek: (t: number) => void }> = ({ value, max, onSeek }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<number | null>(null);

  // While dragging, the thumb follows the pointer rather than the (still-playing) audio clock.
  const shown = drag ?? value;
  const pct = max > 0 ? Math.min(100, Math.max(0, (shown / max) * 100)) : 0;

  const posToTime = useCallback((clientX: number) => {
    const el = ref.current;
    if (!el || max <= 0) return 0;
    const r = el.getBoundingClientRect();
    return Math.min(max, Math.max(0, ((clientX - r.left) / r.width) * max));
  }, [max]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (max <= 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag(posToTime(e.clientX));
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (drag === null) return;
    setDrag(posToTime(e.clientX));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (drag === null) return;
    onSeek(posToTime(e.clientX));
    setDrag(null);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (max <= 0) return;
    const step = e.shiftKey ? 30 : 5;
    if (e.key === 'ArrowRight') { e.preventDefault(); onSeek(Math.min(max, value + step)); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); onSeek(Math.max(0, value - step)); }
    else if (e.key === 'Home') { e.preventDefault(); onSeek(0); }
    else if (e.key === 'End') { e.preventDefault(); onSeek(max); }
  };

  return (
    <div
      ref={ref}
      className="np-scrub"
      role="slider"
      tabIndex={0}
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
      aria-valuenow={Math.round(shown)}
      aria-valuetext={fmt(shown)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => setDrag(null)}
      onKeyDown={onKeyDown}
    >
      <div className="np-scrub-track">
        <div className="np-scrub-fill" style={{ width: `${pct}%` }} />
        <div className="np-scrub-thumb" style={{ left: `${pct}%` }} />
      </div>
    </div>
  );
};

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
  const [rightTab, setRightTab] = useState<RightTab>('lyrics');

  const [artistSongs, setArtistSongs] = useState<Song[]>([]);
  const [artistImage, setArtistImage] = useState<string | null>(null);
  const [artistLoading, setArtistLoading] = useState(false);
  const artistFetchedFor = useRef<string>('');

  const lyricsRef = useRef<HTMLDivElement>(null);
  const lineRefs  = useRef<(HTMLParagraphElement | null)[]>([]);

  const titleWrapRef = useRef<HTMLDivElement>(null);
  const titleRef     = useRef<HTMLHeadingElement>(null);

  const liked = currentSong ? isLiked(currentSong.id) : false;

  /* Only let the title scroll when it genuinely overflows — a marquee on a short
     title is pure noise. Re-measured whenever the track or the viewport changes. */
  useEffect(() => {
    const wrap = titleWrapRef.current;
    const el = titleRef.current;
    if (!wrap || !el) return;
    const measure = () => wrap.classList.toggle('is-scrolling', el.scrollWidth > wrap.clientWidth + 4);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [currentSong?.id, isOpen]);

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

  const playArtistSong = (song: Song) => { addToRecentlyPlayed(song); playSong(song, artistSongs); };

  if (!currentSong) return null;

  const primaryArtist = currentSong.artist.split(',')[0].trim();

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
          {/* Breathing album-art wash — the room lights up in the track's colours */}
          <motion.div
            key={currentSong.imageUrl}
            className="np-ambient"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}
            style={{ backgroundImage: `url(${currentSong.imageUrl})` }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,6,15,0.62), rgba(8,6,15,0.86))', zIndex: 1, pointerEvents: 'none' }} />
          {/* Fine grid + vignette to give the void some structure */}
          <div className="bg-grid" style={{ zIndex: 1, opacity: 0.5 }} />
          <div className="bg-vignette" style={{ zIndex: 1 }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--accent), var(--magenta), transparent)', zIndex: 3, opacity: 0.7 }} />

          {/* Content */}
          <div className="nowplaying-content" style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box', padding: 'min(30px, 3vh) 48px min(26px, 2.5vh)' }}>

            {/* Top bar */}
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'min(20px, 2.5vh)', flexShrink: 0 }}>
              <HoverScale>
                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50%', width: '38px', height: '38px', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronDown size={22} />
                </button>
              </HoverScale>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 14px', borderRadius: '99px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                <LiveEq playing={isPlaying} bars={4} height={11} />
                <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '2.5px', color: 'rgba(255,255,255,0.55)', fontWeight: 800 }}>
                  {isPlaying ? 'Now Playing' : 'Paused'}
                </p>
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
            <div className="nowplaying-two-col">

              {/* LEFT: art + controls */}
              <div className="nowplaying-left">

                {/* Album cover */}
                <div className="np-cover-wrap">
                  <div className={`np-halo${isPlaying ? '' : ' np-halo-idle'}`} aria-hidden="true" />
                  <img className="np-cover-art" src={currentSong.imageUrl} alt={`${currentSong.title} cover art`} />
                </div>
                {/* Song info */}
                <Reveal delay={0.15} style={{ marginBottom: 'min(14px, 1.5vh)', flexShrink: 0, textAlign: 'center' }}>
                  <div ref={titleWrapRef} className="np-title-wrap" style={{ marginBottom: '6px' }}>
                    <h2 ref={titleRef} className="np-title display-head" style={{ fontSize: 'clamp(22px, 3.4vh, 30px)', color: '#fff' }}>
                      {currentSong.title}
                    </h2>
                  </div>
                  <p
                    onClick={() => { onClose(); onArtistClick?.(null, primaryArtist); }}
                    style={{ fontSize: '13px', color: 'var(--accent-2)', fontWeight: 700, cursor: 'pointer', transition: 'color 0.18s', display: 'inline-block' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--accent-2)')}
                  >
                    {currentSong.artist}
                  </p>
                </Reveal>

                {/* Progress */}
                <Reveal delay={0.2} style={{ marginBottom: 'min(14px, 1.5vh)', flexShrink: 0 }}>
                  <ScrubBar value={currentTime} max={duration} onSeek={seekTo} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--accent-2)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(currentTime)}</span>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>-{fmt(Math.max(0, duration - currentTime))}</span>
                  </div>
                </Reveal>

                {/* Controls */}
                <Reveal delay={0.25} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'min(18px, 2vh)', flexShrink: 0 }}>
                  <button
                    onClick={toggleShuffle}
                    title="Shuffle"
                    aria-label="Shuffle"
                    aria-pressed={isShuffle}
                    className={`np-icon-btn${isShuffle ? ' is-active' : ''}`}
                  >
                    <Shuffle size={18} />
                  </button>

                  <button onClick={playPrevious} title="Previous" aria-label="Previous track" className="np-icon-btn" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    <SkipBack size={26} fill="currentColor" />
                  </button>

                  <div style={{ position: 'relative', display: 'flex' }}>
                    {/* Pulse rings only while audio is actually running */}
                    {isPlaying && !isResolvingUrl && (
                      <>
                        <span className="np-play-ring" aria-hidden="true" />
                        <span className="np-play-ring np-play-ring-b" aria-hidden="true" />
                      </>
                    )}
                    <button
                      onClick={togglePlayPause}
                      disabled={isResolvingUrl}
                      className="np-play"
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                      style={{ opacity: isResolvingUrl ? 0.6 : 1 }}
                    >
                      <AnimatePresence mode="wait">
                        {isResolvingUrl ? (
                          <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                            <div className="animate-spin" style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%' }} />
                          </motion.div>
                        ) : isPlaying ? (
                          <motion.div key="pause" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }} transition={{ type: 'spring', stiffness: 400, damping: 22 }} style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                            <Pause size={26} fill="#fff" color="#fff" />
                          </motion.div>
                        ) : (
                          <motion.div key="play" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }} transition={{ type: 'spring', stiffness: 400, damping: 22 }} style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                            <Play size={26} fill="#fff" color="#fff" style={{ transform: 'translateX(2px)' }} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  </div>

                  <button onClick={playNext} title="Next" aria-label="Next track" className="np-icon-btn" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    <SkipForward size={26} fill="currentColor" />
                  </button>

                  <div style={{ position: 'relative', display: 'flex' }}>
                    <button
                      onClick={toggleRepeatMode}
                      title={`Repeat: ${repeatMode}`}
                      aria-label={`Repeat: ${repeatMode}`}
                      className={`np-icon-btn${repeatMode !== 'none' ? ' is-active' : ''}`}
                    >
                      <Repeat size={18} />
                    </button>
                    <AnimatePresence>
                      {repeatMode === 'song' && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} style={{ position: 'absolute', top: '4px', right: '4px', background: 'var(--magenta)', color: '#fff', fontSize: '7px', fontWeight: 800, borderRadius: '50%', width: '13px', height: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>1</motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </Reveal>

                {/* Utility row */}
                <Reveal delay={0.3} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '6px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '99px', backdropFilter: 'blur(12px)', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <button
                      onClick={() => toggleLike(currentSong)}
                      className="np-icon-btn"
                      aria-label={liked ? 'Remove from liked songs' : 'Add to liked songs'}
                      aria-pressed={liked}
                      style={liked ? { color: 'var(--danger)', background: 'rgba(244,63,94,0.12)' } : undefined}
                    >
                      <Heart size={17} fill={liked ? 'var(--danger)' : 'none'} />
                    </button>
                    <button onClick={onOpenEq} className="np-icon-btn" aria-label="Equalizer" title="Equalizer"><Sliders size={16} /></button>
                    <div style={{ position: 'relative', display: 'flex' }}>
                      <button onClick={onOpenQueue} className="np-icon-btn" aria-label={`Queue (${activeQueue.length})`} title="Queue"><ListMusic size={16} /></button>
                      {activeQueue.length > 0 && <span style={{ position: 'absolute', top: '3px', right: '1px', background: 'var(--magenta)', color: '#fff', fontSize: '8px', borderRadius: '10px', padding: '1px 4px', fontWeight: 800, pointerEvents: 'none', boxShadow: '0 0 10px var(--magenta-glow)' }}>{activeQueue.length}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingRight: '8px' }}>
                    <button onClick={handleMute} className="np-icon-btn" style={{ width: '32px', height: '32px' }} aria-label={volume === 0 ? 'Unmute' : 'Mute'}>
                      {volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    </button>
                    <input type="range" min="0" max="1" step="0.01" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} aria-label="Volume" style={{ width: '80px', '--range-progress': `${volume * 100}%` } as React.CSSProperties} />
                  </div>
                </Reveal>
              </div>

              {/* RIGHT: Lyrics / Artist tabs */}
              <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="nowplaying-right">

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
                                    className={isActive ? 'lyric-active' : undefined}
                                    initial={false}
                                    animate={{ fontSize: isActive ? '24px' : '17px', color: isActive ? '#fff' : 'var(--text-secondary)', opacity: isActive ? 1 : 0.3, scale: isActive ? 1.02 : 1, x: isActive ? 6 : 0 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 26 }}
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
