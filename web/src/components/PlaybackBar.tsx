import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Heart, Maximize2, ListMusic, Volume2, VolumeX, Sliders } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useLibrary } from '../context/LibraryContext';
import { HoverScale, AnimatePresence, motion } from '../components/motion';

const fmt = (s: number) => {
  if (!s || isNaN(s)) return '0:00';
  const min = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
};

export const PlaybackBar: React.FC<{
  onOpenNowPlaying: () => void;
  onOpenQueue: () => void;
  onOpenEq: () => void;
}> = ({ onOpenNowPlaying, onOpenQueue, onOpenEq }) => {
  const {
    currentSong, isPlaying, currentTime, duration, volume,
    isShuffle, repeatMode,
    togglePlayPause, seekTo, setVolume, playNext, playPrevious, toggleShuffle, toggleRepeatMode,
    isResolvingUrl, activeQueue
  } = useAudio();
  const { toggleLike, isLiked } = useLibrary();

  const [prevVol, setPrevVol] = useState(volume);
  const [showEqTooltip, setShowEqTooltip] = useState(false);
  const [eqHover, setEqHover] = useState(false);

  const liked = currentSong ? isLiked(currentSong.id) : false;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  useEffect(() => {
    if (eqHover) {
      const t = setTimeout(() => setShowEqTooltip(true), 400);
      return () => clearTimeout(t);
    } else {
      setShowEqTooltip(false);
    }
  }, [eqHover]);

  const handleMute = () => {
    if (volume > 0) {
      setPrevVol(volume);
      setVolume(0);
    } else {
      setVolume(prevVol || 0.8);
    }
  };

  const iconBtn = (onClick: () => void, active: boolean, children: React.ReactNode, title?: string, disabled?: boolean) => (
    <HoverScale scale={1.15} tapScale={0.9}>
      <button
        onClick={onClick} title={title} disabled={disabled}
        style={{ background: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', color: active ? 'var(--accent)' : 'rgba(255,255,255,0.5)', opacity: disabled ? 0.3 : 1, transition: 'color 0.2s', display: 'flex', alignItems: 'center' }}
        onMouseEnter={e => { if (!disabled && !active) e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={e => { if (!disabled && !active) e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
      >
        {children}
      </button>
    </HoverScale>
  );

  return (
    <AnimatePresence>
      {currentSong && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{ height: '96px', background: 'rgba(10,9,10,0.85)', backdropFilter: 'blur(30px)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 100, position: 'relative' }}
        >
          {/* Progress bar at top edge */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', zIndex: 2 }} onClick={e => { const r = e.currentTarget.getBoundingClientRect(); seekTo(((e.clientX - r.left) / r.width) * duration); }}>
            <motion.div style={{ height: '100%', background: 'var(--accent)', width: `${progress}%`, transition: 'width 0.1s linear' }} />
          </div>

          {/* LEFT: Song Info */}
          <div style={{ width: '30%', minWidth: '220px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <HoverScale scale={1.05} tapScale={0.95}>
              <div onClick={onOpenNowPlaying} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', flexShrink: 0 }}>
                <AnimatePresence mode="popLayout">
                  <motion.img
                    key={currentSong.imageUrl}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.2 }}
                    src={currentSong.imageUrl} alt={currentSong.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </AnimatePresence>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
                  <Maximize2 size={20} color="#fff" />
                </div>
              </div>
            </HoverScale>
            <div style={{ overflow: 'hidden', flex: 1, cursor: 'pointer' }} onClick={onOpenNowPlaying}>
              <AnimatePresence mode="wait">
                <motion.div key={currentSong.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentSong.title}</p>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentSong.artist}</p>
                </motion.div>
              </AnimatePresence>
            </div>
            <HoverScale scale={1.2} tapScale={0.9}>
              <button onClick={() => toggleLike(currentSong)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: liked ? 'var(--danger)' : 'rgba(255,255,255,0.4)', flexShrink: 0, padding: '4px' }}>
                <Heart size={18} fill={liked ? 'var(--danger)' : 'none'} />
              </button>
            </HoverScale>
          </div>

          {/* CENTER: Player Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '40%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
              {iconBtn(toggleShuffle, isShuffle, <Shuffle size={18} />, 'Shuffle')}
              
              <HoverScale scale={1.1} tapScale={0.9}>
                <button onClick={playPrevious} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: '4px' }}><SkipBack size={24} fill="currentColor" /></button>
              </HoverScale>

              <HoverScale scale={1.1} tapScale={0.95}>
                <button onClick={togglePlayPause} disabled={isResolvingUrl} style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px var(--accent-glow)', opacity: isResolvingUrl ? 0.6 : 1 }}>
                  <AnimatePresence mode="wait">
                    {isResolvingUrl ? (
                      <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid rgba(13,12,10,0.3)', borderTopColor: '#0d0c0a', borderRadius: '50%' }} />
                    ) : isPlaying ? (
                      <motion.div key="pause" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Pause size={20} fill="#0d0c0a" color="#0d0c0a" /></motion.div>
                    ) : (
                      <motion.div key="play" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Play size={20} fill="#0d0c0a" color="#0d0c0a" style={{ marginLeft: '2px' }} /></motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </HoverScale>

              <HoverScale scale={1.1} tapScale={0.9}>
                <button onClick={playNext} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: '4px' }}><SkipForward size={24} fill="currentColor" /></button>
              </HoverScale>
              
              <div style={{ position: 'relative' }}>
                {iconBtn(toggleRepeatMode, repeatMode !== 'none', <Repeat size={18} />, 'Repeat')}
                <AnimatePresence>
                  {repeatMode === 'song' && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} style={{ position: 'absolute', top: '-2px', right: '-2px', background: 'var(--accent)', color: '#0d0c0a', fontSize: '7px', fontWeight: 800, borderRadius: '50%', width: '10px', height: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', width: '35px', textAlign: 'right', fontWeight: 500 }}>{fmt(currentTime)}</span>
              <div style={{ flex: 1, position: 'relative', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', cursor: 'pointer' }} onClick={e => { const r = e.currentTarget.getBoundingClientRect(); seekTo(((e.clientX - r.left) / r.width) * duration); }}>
                <motion.div style={{ height: '100%', borderRadius: '99px', background: 'var(--text-secondary)', width: `${progress}%` }} layout transition={{ ease: 'linear', duration: 0.1 }} />
              </div>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', width: '35px', fontWeight: 500 }}>{fmt(duration)}</span>
            </div>
          </div>

          {/* RIGHT: Extra Controls */}
          <div style={{ width: '30%', minWidth: '220px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '18px' }}>
            
            <div style={{ position: 'relative' }} onMouseEnter={() => setEqHover(true)} onMouseLeave={() => setEqHover(false)}>
              <HoverScale scale={1.15} tapScale={0.9}>
                <button onClick={onOpenEq} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
                  <Sliders size={18} />
                </button>
              </HoverScale>
              <AnimatePresence>
                {showEqTooltip && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 8px', fontSize: '10px', color: '#fff', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', pointerEvents: 'none' }}>Equalizer</motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div style={{ position: 'relative' }}>
              <HoverScale scale={1.15} tapScale={0.9}>
                <button onClick={onOpenQueue} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
                  <ListMusic size={18} />
                </button>
              </HoverScale>
              {activeQueue.length > 0 && (
                <span style={{ position: 'absolute', top: '-5px', right: '-6px', background: 'var(--accent)', color: '#0d0c0a', fontSize: '8px', borderRadius: '10px', padding: '1px 4px', fontWeight: 800 }}>{activeQueue.length}</span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100px' }}>
              <button onClick={handleMute} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
                {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input type="range" min="0" max="1" step="0.01" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} style={{ width: '100%', '--range-progress': `${volume * 100}%` } as React.CSSProperties} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
