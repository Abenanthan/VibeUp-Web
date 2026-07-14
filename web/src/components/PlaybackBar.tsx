import React, { useState } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, 
  Volume2, VolumeX, ListMusic, Sliders, AlignLeft, ChevronUp
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

// Format duration in seconds to MM:SS string
const formatTime = (timeInSecs: number): string => {
  if (isNaN(timeInSecs)) return '00:00';
  const mins = Math.floor(timeInSecs / 60);
  const secs = Math.floor(timeInSecs % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const PlaybackBar: React.FC<PlaybackBarProps> = ({
  onOpenEq,
  onToggleLyrics,
  showLyrics,
  onOpenQueue,
  onOpenNowPlaying
}) => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isShuffle,
    repeatMode,
    isResolvingUrl,
    togglePlayPause,
    seekTo,
    setVolume,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleRepeatMode
  } = useAudio();

  const { toggleLike, isLiked } = useLibrary();
  const [prevVolume, setPrevVolume] = useState(volume);

  const handleVolumeMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume || 0.8);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    seekTo(parseFloat(e.target.value));
  };

  if (!currentSong) return null;

  const songLiked = isLiked(currentSong.id);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 h-24 glass border-t border-glass-border flex items-center justify-between px-6 z-40 text-text-main"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '96px',
        borderTop: '1px solid rgba(124, 58, 237, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 40
      }}
    >
      {/* ── Left Section: Song Info & Visualizer ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '33.33%', minWidth: 0 }}>
        {/* Clickable album art + chevron to open Now Playing */}
        <div
          onClick={onOpenNowPlaying}
          style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }}
          title="Open Now Playing"
        >
          <img
            src={currentSong.imageUrl || 'https://c.saavncdn.com/artists/AR_Rahman_500x500.jpg'}
            alt={currentSong.title}
            className={isPlaying ? 'animate-spin-slow' : ''}
            style={{
              width: '52px', height: '52px',
              borderRadius: '10px',
              border: '1px solid rgba(124, 58, 237, 0.15)',
              objectFit: 'cover', display: 'block',
            }}
          />
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '10px',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0, transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
          >
            <ChevronUp size={18} color="white" />
          </div>
        </div>

        {/* Song title & artist - click to open Now Playing */}
        <div
          onClick={onOpenNowPlaying}
          style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflow: 'hidden', cursor: 'pointer', flex: 1, minWidth: 0 }}
        >
          <h4 style={{ fontSize: '13px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentSong.title}
          </h4>
          <p style={{ fontSize: '11px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentSong.artist}
          </p>
        </div>

        {/* Heart */}
        <button
          onClick={() => toggleLike(currentSong)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: songLiked ? '#EF4444' : '#6B7280', flexShrink: 0, transition: 'color 0.2s' }}
        >
          {songLiked ? '❤️' : '🤍'}
        </button>

        {/* Visualizer */}
        {isPlaying && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '20px', flexShrink: 0 }}>
            <span className="visualizer-bar" />
            <span className="visualizer-bar" />
            <span className="visualizer-bar" />
            <span className="visualizer-bar" />
            <span className="visualizer-bar" />
          </div>
        )}
      </div>

      {/* ── Middle Section: Timeline & Navigation Playback Controls ── */}
      <div className="flex flex-col items-center gap-2 w-1/3" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '33.33%' }}>
        {/* Buttons Row */}
        <div className="flex items-center gap-6" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* Shuffle button */}
          <button
            onClick={toggleShuffle}
            className={`transition-colors ${isShuffle ? 'text-green' : 'text-text-muted hover:text-white'}`}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: isShuffle ? '#10B981' : '#9CA3AF' }}
            title="Shuffle"
          >
            <Shuffle size={16} />
          </button>

          {/* Previous song button */}
          <button
            onClick={playPrevious}
            className="text-text-muted hover:text-white transition-colors"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
          >
            <SkipBack size={18} />
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={togglePlayPause}
            disabled={isResolvingUrl}
            className={`w-10 h-10 rounded-full flex items-center justify-center bg-white text-black hover:scale-105 transition-transform ${isResolvingUrl ? 'opacity-50' : ''}`}
            style={{
              border: 'none',
              cursor: 'pointer',
              backgroundColor: '#FFFFFF',
              color: '#000000',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isResolvingUrl ? (
              <span className="border-2 border-black border-t-transparent w-4 h-4 rounded-full animate-spin" style={{ display: 'inline-block', border: '2px solid #000', borderTopColor: 'transparent', width: '16px', height: '16px', borderRadius: '50%', animation: 'spin-slow 1s linear infinite' }}></span>
            ) : isPlaying ? (
              <Pause size={18} fill="black" />
            ) : (
              <Play size={18} fill="black" className="ml-0.5" style={{ marginLeft: '2px' }} />
            )}
          </button>

          {/* Next song button */}
          <button
            onClick={playNext}
            className="text-text-muted hover:text-white transition-colors"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
          >
            <SkipForward size={18} />
          </button>

          {/* Repeat button */}
          <button
            onClick={toggleRepeatMode}
            className={`transition-colors relative ${repeatMode !== 'none' ? 'text-green' : 'text-text-muted hover:text-white'}`}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: repeatMode !== 'none' ? '#10B981' : '#9CA3AF' }}
            title={`Repeat Mode: ${repeatMode}`}
          >
            <Repeat size={16} />
            {repeatMode === 'song' && (
              <span className="absolute -top-1 -right-1 text-[8px] bg-green text-black font-extrabold w-3 h-3 rounded-full flex items-center justify-center" style={{ position: 'absolute', top: '-4px', right: '-4px', fontSize: '8px', backgroundColor: '#10B981', color: '#000', width: '12px', height: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                1
              </span>
            )}
          </button>
        </div>

        {/* Playback Progress Slider */}
        <div className="w-full flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
          <span className="text-[10px] text-text-muted w-10 text-right" style={{ fontSize: '10px', color: '#9CA3AF', width: '40px', textAlign: 'right' }}>
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleProgressChange}
            className="flex-1"
            style={{ flex: 1 }}
          />
          <span className="text-[10px] text-text-muted w-10" style={{ fontSize: '10px', color: '#9CA3AF', width: '40px' }}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* ── Right Section: Audio Effects, Volume & Lyrics Controls ── */}
      <div className="flex items-center justify-end gap-4 w-1/3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px', width: '33.33%' }}>
        {/* Toggle Lyrics */}
        <button
          onClick={onToggleLyrics}
          className={`p-2 rounded-full hover:bg-card-hover transition-colors ${showLyrics ? 'text-primary' : 'text-text-muted hover:text-white'}`}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: showLyrics ? '#7C3AED' : '#9CA3AF' }}
          title="Synced Lyrics"
        >
          <AlignLeft size={18} />
        </button>

        {/* Open Queue List */}
        <button
          onClick={onOpenQueue}
          className="p-2 rounded-full hover:bg-card-hover text-text-muted hover:text-white transition-colors"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
          title="Play Queue"
        >
          <ListMusic size={18} />
        </button>

        {/* Equalizer Slider Settings */}
        <button
          onClick={onOpenEq}
          className="p-2 rounded-full hover:bg-card-hover text-text-muted hover:text-white transition-colors"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
          title="Equalizer & Sound Effects"
        >
          <Sliders size={18} />
        </button>

        {/* Volume controls */}
        <div className="flex items-center gap-2 w-32" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '128px' }}>
          <button
            onClick={handleVolumeMute}
            className="text-text-muted hover:text-white transition-colors"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
          >
            {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20"
            style={{ width: '80px' }}
          />
        </div>
      </div>
    </div>
  );
};
