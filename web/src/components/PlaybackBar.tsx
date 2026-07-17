import React, { useState } from 'react';
import {
  Play, Pause, SkipForward, SkipBack, Shuffle, Repeat,
  Volume2, VolumeX, ListMusic, Sliders, AlignLeft, ChevronUp, Heart
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useLibrary } from '../context/LibraryContext';

interface PlaybackBarProps {
  onOpenEq: () => void;
  onToggleLyrics: () => void;
  showLyrics: boolean;
  onOpenQueue: () => void;
  onOpenNowPlaying: () => void;
}

const formatTime = (s: number): string => {
  if (isNaN(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const BarBtn: React.FC<{
  onClick: () => void;
  title?: string;
  active?: boolean;
  children: React.ReactNode;
}> = ({ onClick, title, active, children }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: active ? 'var(--teal)' : 'var(--text-secondary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '6px',
      borderRadius: '6px',
      transition: 'color 0.15s ease, background 0.15s ease',
      flexShrink: 0,
    }}
    onMouseEnter={e => {
      e.currentTarget.style.color = active ? 'var(--teal)' : 'var(--text-primary)';
      e.currentTarget.style.background = 'var(--bg-hover)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.color = active ? 'var(--teal)' : 'var(--text-secondary)';
      e.currentTarget.style.background = 'none';
    }}
  >
    {children}
  </button>
);

export const PlaybackBar: React.FC<PlaybackBarProps> = ({
  onOpenEq,
  onToggleLyrics,
  showLyrics,
  onOpenQueue,
  onOpenNowPlaying,
}) => {
  const {
    currentSong, isPlaying, currentTime, duration, volume,
    isShuffle, repeatMode, isResolvingUrl,
    togglePlayPause, seekTo, setVolume,
    playNext, playPrevious, toggleShuffle, toggleRepeatMode,
  } = useAudio();
  const { toggleLike, isLiked } = useLibrary();
  const [prevVolume, setPrevVolume] = useState(volume);

  const handleVolumeMute = () => {
    if (volume > 0) { setPrevVolume(volume); setVolume(0); }
    else setVolume(prevVolume || 0.8);
  };

  if (!currentSong) return null;

  const songLiked = isLiked(currentSong.id);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      height: '78px',
      backgroundColor: 'var(--bg-surface)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      zIndex: 40,
      gap: '12px',
    }}>

      {/* ── Left: Song Info ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '30%', minWidth: 0 }}>

        {/* Album Art — clicking opens Now Playing */}
        <div
          onClick={onOpenNowPlaying}
          style={{ position: 'relative', flexShrink: 0, cursor: 'pointer', borderRadius: '8px', overflow: 'hidden' }}
          title="Open Now Playing"
        >
          <img
            src={currentSong.imageUrl}
            alt={currentSong.title}
            style={{
              width: '46px', height: '46px',
              objectFit: 'cover', display: 'block',
            }}
          />
          <div
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0, transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
          >
            <ChevronUp size={16} color="white" />
          </div>
        </div>

        {/* Song title & artist */}
        <div
          onClick={onOpenNowPlaying}
          style={{ overflow: 'hidden', cursor: 'pointer', flex: 1, minWidth: 0 }}
        >
          <p style={{
            fontSize: '13px', fontWeight: 600,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            color: 'var(--text-primary)',
          }}>
            {currentSong.title}
          </p>
          <p style={{
            fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {currentSong.artist}
          </p>
        </div>

        {/* Heart */}
        <button
          onClick={() => toggleLike(currentSong)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: songLiked ? 'var(--danger)' : 'var(--text-secondary)',
            flexShrink: 0, transition: 'color 0.2s, transform 0.2s',
            display: 'flex', alignItems: 'center', padding: '4px',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Heart size={15} fill={songLiked ? 'var(--danger)' : 'none'} />
        </button>

        {/* Visualizer (playing indicator) */}
        {isPlaying && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '18px', flexShrink: 0 }}>
            <span className="visualizer-bar" />
            <span className="visualizer-bar" />
            <span className="visualizer-bar" />
            <span className="visualizer-bar" />
            <span className="visualizer-bar" />
          </div>
        )}
      </div>

      {/* ── Center: Controls + Progress ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>

        {/* Control buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Shuffle */}
          <BarBtn onClick={toggleShuffle} title="Shuffle" active={isShuffle}>
            <Shuffle size={15} />
          </BarBtn>

          {/* Prev */}
          <BarBtn onClick={playPrevious}>
            <SkipBack size={18} />
          </BarBtn>

          {/* Play / Pause */}
          <button
            onClick={togglePlayPause}
            disabled={isResolvingUrl}
            title={isPlaying ? 'Pause' : 'Play'}
            style={{
              width: '38px', height: '38px',
              borderRadius: '50%',
              background: 'var(--amber)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px var(--amber-glow)',
              transition: 'background 0.15s ease, transform 0.15s ease',
              opacity: isResolvingUrl ? 0.6 : 1,
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--amber-soft)';
              e.currentTarget.style.transform = 'scale(1.06)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--amber)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {isResolvingUrl ? (
              <div className="animate-spin" style={{
                width: '15px', height: '15px',
                border: '2px solid rgba(13,12,10,0.3)',
                borderTopColor: '#0d0c0a',
                borderRadius: '50%',
              }} />
            ) : isPlaying ? (
              <Pause size={16} fill="#0d0c0a" color="#0d0c0a" />
            ) : (
              <Play size={16} fill="#0d0c0a" color="#0d0c0a" style={{ marginLeft: '2px' }} />
            )}
          </button>

          {/* Next */}
          <BarBtn onClick={playNext}>
            <SkipForward size={18} />
          </BarBtn>

          {/* Repeat */}
          <div style={{ position: 'relative' }}>
            <BarBtn onClick={toggleRepeatMode} title={`Repeat: ${repeatMode}`} active={repeatMode !== 'none'}>
              <Repeat size={15} />
            </BarBtn>
            {repeatMode === 'song' && (
              <span style={{
                position: 'absolute', top: '1px', right: '1px',
                background: 'var(--teal)', color: 'var(--bg-base)',
                fontSize: '7px', fontWeight: 800,
                borderRadius: '50%', width: '10px', height: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1,
              }}>
                1
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', maxWidth: '480px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 500, width: '32px', textAlign: 'right', flexShrink: 0 }}>
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={e => seekTo(parseFloat(e.target.value))}
            style={{
              flex: 1,
              '--range-progress': `${progress}%`,
            } as React.CSSProperties}
          />
          <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 500, width: '32px', flexShrink: 0 }}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* ── Right: Extras + Volume ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px', width: '28%', minWidth: 0 }}>

        <BarBtn onClick={onToggleLyrics} title="Lyrics" active={showLyrics}>
          <AlignLeft size={16} />
        </BarBtn>

        <BarBtn onClick={onOpenQueue} title="Queue">
          <ListMusic size={16} />
        </BarBtn>

        <BarBtn onClick={onOpenEq} title="Equalizer">
          <Sliders size={16} />
        </BarBtn>

        {/* Volume */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
          <button
            onClick={handleVolumeMute}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', display: 'flex', alignItems: 'center',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={e => setVolume(parseFloat(e.target.value))}
            style={{
              width: '84px',
              '--range-progress': `${volume * 100}%`,
            } as React.CSSProperties}
          />
        </div>
      </div>
    </div>
  );
};
