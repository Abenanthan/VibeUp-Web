import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, SkipForward, SkipBack, Shuffle, Repeat,
  Heart, ChevronDown, ListMusic, Plus, Sliders, Volume2, VolumeX
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useLibrary } from '../context/LibraryContext';
import type { LyricLine } from '../services/api';

interface NowPlayingPageProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQueue: () => void;
  onOpenEq: () => void;
}

const fmt = (s: number) => { if (!s || isNaN(s)) return '0:00'; return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`; };

export const NowPlayingPage: React.FC<NowPlayingPageProps> = ({ isOpen, onClose, onOpenQueue, onOpenEq }) => {
  const {
    currentSong, isPlaying, currentTime, duration, volume,
    isShuffle, repeatMode, isResolvingUrl,
    togglePlayPause, seekTo, setVolume,
    playNext, playPrevious, toggleShuffle, toggleRepeatMode,
    activeQueue, lyricsState, lyricsLoading,
  } = useAudio();
  const { toggleLike, isLiked, playlists, addSongToPlaylist } = useLibrary();

  const [showPlaylist, setShowPlaylist] = useState(false);
  const [prevVol, setPrevVol] = useState(volume);
  const [activeIdx, setActiveIdx] = useState(-1);
  const lyricsRef = useRef<HTMLDivElement>(null);
  const lineRefs  = useRef<(HTMLParagraphElement | null)[]>([]);

  const liked    = currentSong ? isLiked(currentSong.id) : false;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleMute = () => { if (volume > 0) { setPrevVol(volume); setVolume(0); } else setVolume(prevVol || 0.8); };

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

  if (!currentSong) return null;

  const iconBtn = (onClick: () => void, active: boolean, children: React.ReactNode, title?: string) => (
    <button onClick={onClick} title={title} style={{ background: 'none', border: 'none', cursor: 'pointer', color: active ? 'var(--teal)' : 'rgba(255,255,255,0.45)', transition: 'color 0.2s', display: 'flex', alignItems: 'center', position: 'relative' }} onMouseEnter={e => (e.currentTarget.style.color = active ? 'var(--teal)' : 'rgba(255,255,255,0.85)')} onMouseLeave={e => (e.currentTarget.style.color = active ? 'var(--teal)' : 'rgba(255,255,255,0.45)')}>
      {children}
    </button>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', transform: isOpen ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)', overflow: 'hidden', backgroundColor: '#0a090a' }}>

      {/* Blurred album art background */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${currentSong.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(90px) brightness(0.18) saturate(1.4)', transform: 'scale(1.2)', zIndex: 0 }} />

      {/* Subtle dark overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,7,8,0.72)', zIndex: 1, pointerEvents: 'none' }} />

      {/* Amber top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--amber), transparent)', zIndex: 3, opacity: 0.6 }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%', padding: '36px 48px 28px', boxSizing: 'border-box' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexShrink: 0 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
            <ChevronDown size={26} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '2.5px', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>Now Playing</p>
          </div>
          <button onClick={() => setShowPlaylist(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.55)', transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
            <Plus size={22} />
          </button>
        </div>

        {/* Add to playlist dropdown */}
        {showPlaylist && playlists.length > 0 && (
          <div style={{ position: 'absolute', top: '76px', right: '48px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '5px', zIndex: 10, minWidth: '175px', boxShadow: '0 16px 48px rgba(0,0,0,0.7)' }}>
            {playlists.map(pl => (
              <button key={pl.id} onClick={() => { addSongToPlaylist(pl.id, currentSong); setShowPlaylist(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: '7px', color: 'var(--text-primary)', fontSize: '12px', textAlign: 'left', fontFamily: 'var(--font)', transition: 'background 0.12s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                <ListMusic size={12} color="var(--amber)" />{pl.name}
              </button>
            ))}
          </div>
        )}

        {/* Two-column layout */}
        <div style={{ display: 'flex', flex: 1, gap: '60px', overflow: 'hidden', alignItems: 'center' }}>

          {/* LEFT: art + controls */}
          <div style={{ width: '42%', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>

            {/* Album art */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px', flexShrink: 0 }}>
              <div style={{ width: 'min(275px, 100%)', aspectRatio: '1/1', borderRadius: '14px', overflow: 'hidden', boxShadow: `0 28px 70px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.07)`, transform: isPlaying ? 'scale(1)' : 'scale(0.95)', transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>
                <img src={currentSong.imageUrl} alt={currentSong.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            </div>

            {/* Song info */}
            <div style={{ marginBottom: '20px', flexShrink: 0 }}>
              <h2 style={{ fontSize: '21px', fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1.25, color: '#fff', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentSong.title}</h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}>{currentSong.artist}</p>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: '22px', flexShrink: 0 }}>
              <div style={{ position: 'relative', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', cursor: 'pointer', marginBottom: '8px' }} onClick={e => { const r = e.currentTarget.getBoundingClientRect(); seekTo(((e.clientX - r.left) / r.width) * duration); }}>
                <div style={{ height: '100%', borderRadius: '99px', background: 'var(--amber)', width: `${progress}%`, transition: 'width 0.1s linear' }} />
                <div style={{ position: 'absolute', top: '50%', left: `${progress}%`, transform: 'translate(-50%,-50%)', width: '11px', height: '11px', borderRadius: '50%', background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.5)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{fmt(currentTime)}</span>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{fmt(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexShrink: 0 }}>
              {iconBtn(toggleShuffle, isShuffle, <Shuffle size={18} />, 'Shuffle')}
              <button onClick={playPrevious} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.75)', transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}><SkipBack size={26} fill="currentColor" /></button>

              <button onClick={togglePlayPause} disabled={isResolvingUrl} style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'var(--amber)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 22px var(--amber-glow)', transition: 'transform 0.15s, background 0.15s', opacity: isResolvingUrl ? 0.6 : 1 }} onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.background = 'var(--amber-soft)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'var(--amber)'; }}>
                {isResolvingUrl ? <div className="animate-spin" style={{ width: '18px', height: '18px', border: '2px solid rgba(13,12,10,0.3)', borderTopColor: '#0d0c0a', borderRadius: '50%' }} /> : isPlaying ? <Pause size={22} fill="#0d0c0a" color="#0d0c0a" /> : <Play size={22} fill="#0d0c0a" color="#0d0c0a" style={{ marginLeft: '2px' }} />}
              </button>

              <button onClick={playNext} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.75)', transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}><SkipForward size={26} fill="currentColor" /></button>

              <div style={{ position: 'relative' }}>
                {iconBtn(toggleRepeatMode, repeatMode !== 'none', <Repeat size={18} />, 'Repeat')}
                {repeatMode === 'song' && <span style={{ position: 'absolute', top: '-3px', right: '-3px', background: 'var(--teal)', color: '#0d0c0a', fontSize: '7px', fontWeight: 800, borderRadius: '50%', width: '11px', height: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>}
              </div>
            </div>

            {/* Utility row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 'var(--radius-lg)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={() => toggleLike(currentSong)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: liked ? 'var(--danger)' : 'rgba(255,255,255,0.4)', transition: 'color 0.2s, transform 0.2s', display: 'flex' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}><Heart size={17} fill={liked ? 'var(--danger)' : 'none'} /></button>
                <button onClick={onOpenEq} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}><Sliders size={16} /></button>
                <div style={{ position: 'relative' }}>
                  <button onClick={onOpenQueue} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}><ListMusic size={16} /></button>
                  {activeQueue.length > 0 && <span style={{ position: 'absolute', top: '-5px', right: '-7px', background: 'var(--amber)', color: '#0d0c0a', fontSize: '7px', borderRadius: '10px', padding: '1px 3px', fontWeight: 800 }}>{activeQueue.length}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <button onClick={handleMute} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
                  {volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} style={{ width: '80px', '--range-progress': `${volume * 100}%` } as React.CSSProperties} />
              </div>
            </div>
          </div>

          {/* RIGHT: Lyrics */}
          <div style={{ flex: 1, height: '90%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <p style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--amber)', marginBottom: '18px', flexShrink: 0 }}>Lyrics</p>
            <div ref={lyricsRef} style={{ flex: 1, overflowY: 'auto', paddingRight: '8px', scrollBehavior: 'smooth', maskImage: 'linear-gradient(to bottom, transparent 0%, white 14%, white 86%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, white 14%, white 86%, transparent 100%)' }}>
              <div style={{ paddingTop: '80px', paddingBottom: '160px' }}>
                {lyricsLoading && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px' }}>
                    <div className="animate-spin" style={{ border: '2px solid var(--border-medium)', borderTopColor: 'var(--amber)', width: '24px', height: '24px', borderRadius: '50%' }} />
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Loading lyrics…</p>
                  </div>
                )}
                {!lyricsLoading && lyricsState?.instrumental && (
                  <div style={{ textAlign: 'center', padding: '80px 0' }}>
                    <p style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>Instrumental</p>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '6px' }}>No lyrics for this track</p>
                  </div>
                )}
                {!lyricsLoading && !lyricsState?.instrumental && !lyricsState?.plainLyrics && !lyricsState?.syncedLyrics && (
                  <div style={{ textAlign: 'center', padding: '80px 0' }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>No lyrics found</p>
                  </div>
                )}
                {!lyricsLoading && lyricsState?.synced && lyricsState.syncedLyrics && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {lyricsState.syncedLyrics.map((line: LyricLine, idx: number) => {
                      const isActive = idx === activeIdx;
                      return (
                        <p key={idx} ref={el => { lineRefs.current[idx] = el; }} onClick={() => seekTo(line.timeMs / 1000)} style={{ fontSize: isActive ? '21px' : '17px', fontWeight: 800, lineHeight: 1.5, cursor: 'pointer', transition: 'all 0.3s ease', color: isActive ? '#fff' : 'rgba(255,255,255,0.2)', letterSpacing: '-0.2px', margin: 0, padding: '3px 0' }} onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }} onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.2)'; }}>
                          {line.text}
                        </p>
                      );
                    })}
                  </div>
                )}
                {!lyricsLoading && !lyricsState?.synced && lyricsState?.plainLyrics && (
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', lineHeight: '1.9', whiteSpace: 'pre-line', fontWeight: 500 }}>{lyricsState.plainLyrics}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
