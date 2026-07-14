import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, SkipForward, SkipBack, Shuffle, Repeat,
  Heart, ChevronDown, ListMusic, Plus, Sliders, Volume2, VolumeX
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useLibrary } from '../context/LibraryContext';
import { lyricsApi } from '../services/api';
import type { LyricsData, LyricLine } from '../services/api';

interface NowPlayingPageProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQueue: () => void;
  onOpenEq: () => void;
}

const formatTime = (s: number) => {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export const NowPlayingPage: React.FC<NowPlayingPageProps> = ({
  isOpen, onClose, onOpenQueue, onOpenEq
}) => {
  const {
    currentSong, isPlaying, currentTime, duration, volume,
    isShuffle, repeatMode, isResolvingUrl,
    togglePlayPause, seekTo, setVolume,
    playNext, playPrevious, toggleShuffle, toggleRepeatMode,
    activeQueue
  } = useAudio();
  const { toggleLike, isLiked, playlists, addSongToPlaylist } = useLibrary();

  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);

  // Lyrics states
  const [lyricsState, setLyricsState] = useState<LyricsData | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState(-1);
  
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const lyricsLinesRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const [lyricsCache] = useState<Record<string, LyricsData>>({});

  const liked = currentSong ? isLiked(currentSong.id) : false;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Toggle Volume Mute
  const handleVolumeMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume || 0.8);
    }
  };

  // Fetch lyrics when song changes or page opens
  useEffect(() => {
    if (!currentSong || !isOpen) return;

    const fetchSongLyrics = async () => {
      const songId = currentSong.id;
      if (lyricsCache[songId]) {
        setLyricsState(lyricsCache[songId]);
        return;
      }

      setLyricsLoading(true);
      setLyricsState(null);
      try {
        const data = await lyricsApi.fetchLyrics(
          currentSong.artist,
          currentSong.title,
          currentSong.album
        );
        lyricsCache[songId] = data;
        setLyricsState(data);
      } catch (e) {
        console.error('Error fetching lyrics:', e);
      } finally {
        setLyricsLoading(false);
      }
    };

    fetchSongLyrics();
  }, [currentSong, isOpen]);

  // Sync lyrics to currentTime
  useEffect(() => {
    if (!lyricsState || !lyricsState.syncedLyrics || lyricsState.syncedLyrics.length === 0) return;
    
    const timeMs = currentTime * 1000;
    const lines = lyricsState.syncedLyrics;
    
    let index = 0;
    for (let i = 0; i < lines.length; i++) {
      if (timeMs >= lines[i].timeMs) {
        index = i;
      } else {
        break;
      }
    }

    if (index !== activeLineIndex) {
      setActiveLineIndex(index);
      
      // Auto-scroll active lyric line to center of lyrics container
      if (lyricsContainerRef.current && lyricsLinesRefs.current[index]) {
        const lineEl = lyricsLinesRefs.current[index];
        if (lineEl) {
          const container = lyricsContainerRef.current;
          const containerHeight = container.clientHeight;
          const lineOffsetTop = lineEl.offsetTop;
          const lineHalfHeight = lineEl.clientHeight / 2;
          
          container.scrollTo({
            top: lineOffsetTop - (containerHeight / 2) + lineHalfHeight,
            behavior: 'smooth'
          });
        }
      }
    }
  }, [currentTime, lyricsState]);

  const handleLineClick = (line: LyricLine) => {
    seekTo(line.timeMs / 1000);
  };

  useEffect(() => {
    if (!isOpen) setShowAddToPlaylist(false);
  }, [isOpen]);

  if (!currentSong) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        zIndex: 200,
        display: 'flex', flexDirection: 'column',
        background: `linear-gradient(180deg, #120922 0%, #060612 100%)`,
        transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(40px)',
        overflow: 'hidden',
      }}
    >
      {/* Blurred album art background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${currentSong.imageUrl})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'blur(100px) brightness(0.12)',
        transform: 'scale(1.15)',
        zIndex: 0,
      }} />

      {/* Purple radial glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 20%, rgba(124, 58, 237, 0.2) 0%, transparent 70%)',
        zIndex: 1, pointerEvents: 'none',
      }} />

      {/* Content Container */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', flexDirection: 'column',
        height: '100%',
        padding: '40px 48px 24px',
        boxSizing: 'border-box'
      }}>

        {/* ── Top Bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '20px', flexShrink: 0
        }}>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center' }}
            title="Minimize Now Playing"
          >
            <ChevronDown size={28} />
          </button>

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', fontWeight: 800 }}>
              Now Playing
            </p>
          </div>

          <button
            onClick={() => setShowAddToPlaylist(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}
            title="Add to playlist"
          >
            <Plus size={24} />
          </button>
        </div>

        {/* Add to Playlist Dropdown */}
        {showAddToPlaylist && playlists.length > 0 && (
          <div style={{
            position: 'absolute', top: '80px', right: '48px',
            background: '#0d0d1e',
            border: '1px solid rgba(124, 58, 237, 0.25)',
            borderRadius: '12px',
            padding: '6px',
            zIndex: 10, minWidth: '180px',
            boxShadow: '0 15px 45px rgba(0,0,0,0.7)',
          }}>
            {playlists.map(pl => (
              <button key={pl.id}
                onClick={() => { addSongToPlaylist(pl.id, currentSong); setShowAddToPlaylist(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '8px 12px', borderRadius: '8px', color: '#E5E7EB', fontSize: '12px',
                  textAlign: 'left'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <ListMusic size={13} color="#7C3AED" />
                {pl.name}
              </button>
            ))}
          </div>
        )}

        {/* ── Two-Column Layout ── */}
        <div style={{ display: 'flex', flex: 1, gap: '64px', overflow: 'hidden', alignItems: 'center' }}>
          
          {/* ── Left Column: Art, Title, Progress, Controls, Volume ── */}
          <div style={{
            width: '42%',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center',
            height: '100%',
            boxSizing: 'border-box'
          }}>
            {/* Album Art container */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px', flexShrink: 0 }}>
              <div style={{
                width: 'min(280px, 100%)',
                aspectRatio: '1/1',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)',
                transform: isPlaying ? 'scale(1)' : 'scale(0.95)',
                transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}>
                <img
                  src={currentSong.imageUrl}
                  alt={currentSong.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
            </div>

            {/* Song Metadata */}
            <div style={{ marginBottom: '24px', flexShrink: 0 }}>
              <h2 style={{
                fontSize: '22px', fontWeight: 800,
                fontFamily: "'Outfit', sans-serif",
                letterSpacing: '-0.3px', lineHeight: 1.25,
                color: '#fff', marginBottom: '4px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {currentSong.title}
              </h2>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                {currentSong.artist}
              </p>
            </div>

            {/* Progress / Seek Bar */}
            <div style={{ marginBottom: '24px', flexShrink: 0 }}>
              <div
                style={{ position: 'relative', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', cursor: 'pointer', marginBottom: '8px' }}
                onClick={e => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = (e.clientX - rect.left) / rect.width;
                  seekTo(ratio * duration);
                }}
              >
                <div style={{
                  height: '100%', borderRadius: '4px',
                  background: 'linear-gradient(to right, #A78BFA, #7C3AED)',
                  width: `${progress}%`,
                }} />
                <div style={{
                  position: 'absolute', top: '50%', left: `${progress}%`,
                  transform: 'translate(-50%, -50%)',
                  width: '10px', height: '10px',
                  borderRadius: '50%', background: '#fff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{formatTime(currentTime)}</span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Main Playback Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexShrink: 0 }}>
              <button
                onClick={toggleShuffle}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: isShuffle ? '#A78BFA' : 'rgba(255,255,255,0.35)', transition: 'color 0.2s' }}
                title="Shuffle"
              >
                <Shuffle size={18} />
              </button>

              <button
                onClick={playPrevious}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)' }}
              >
                <SkipBack size={26} fill="currentColor" />
              </button>

              <button
                onClick={togglePlayPause}
                disabled={isResolvingUrl}
                style={{
                  width: '56px', height: '56px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #A78BFA, #7C3AED)',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 6px 20px rgba(124, 58, 237, 0.4)',
                  transition: 'transform 0.15s ease, opacity 0.2s',
                  opacity: isResolvingUrl ? 0.6 : 1,
                }}
              >
                {isResolvingUrl
                  ? <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin-slow 0.8s linear infinite' }} />
                  : isPlaying
                    ? <Pause size={22} fill="white" color="white" />
                    : <Play size={22} fill="white" color="white" style={{ marginLeft: '2px' }} />
                }
              </button>

              <button
                onClick={playNext}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)' }}
              >
                <SkipForward size={26} fill="currentColor" />
              </button>

              <button
                onClick={toggleRepeatMode}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: repeatMode !== 'none' ? '#A78BFA' : 'rgba(255,255,255,0.35)',
                  position: 'relative', transition: 'color 0.2s'
                }}
                title={`Repeat Mode: ${repeatMode}`}
              >
                <Repeat size={18} />
                {repeatMode === 'song' && (
                  <span style={{
                    position: 'absolute', top: '-4px', right: '-4px',
                    background: '#7C3AED', color: '#fff', fontSize: '8px',
                    fontWeight: 800, borderRadius: '50%',
                    width: '12px', height: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>1</span>
                )}
              </button>
            </div>

            {/* Utility / Player Bar Row */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '14px',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button
                  onClick={() => toggleLike(currentSong)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: liked ? '#EF4444' : 'rgba(255,255,255,0.5)',
                    transition: 'color 0.2s',
                    display: 'flex'
                  }}
                  title={liked ? "Remove from Liked Songs" : "Like song"}
                >
                  <Heart size={18} fill={liked ? '#EF4444' : 'none'} />
                </button>

                <button
                  onClick={onOpenEq}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex' }}
                  title="Equalizer"
                >
                  <Sliders size={18} />
                </button>

                <button
                  onClick={onOpenQueue}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', position: 'relative' }}
                  title="Play Queue"
                >
                  <ListMusic size={18} />
                  {activeQueue.length > 0 && (
                    <span style={{
                      position: 'absolute', top: '-6px', right: '-8px',
                      background: '#7C3AED', color: '#fff', fontSize: '8px',
                      borderRadius: '10px', padding: '1px 4px', fontWeight: 700
                    }}>
                      {activeQueue.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Volume Slider inside Left Column Player Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100px' }}>
                <button
                  onClick={handleVolumeMute}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex' }}
                >
                  {volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
                <input
                  type="range"
                  min="0" max="1" step="0.01"
                  value={volume}
                  onChange={e => setVolume(parseFloat(e.target.value))}
                  style={{ flex: 1, height: '3px', accentColor: '#A78BFA', cursor: 'pointer' }}
                />
              </div>
            </div>

          </div>

          {/* ── Right Column: Synced / Live Lyrics ── */}
          <div style={{
            flex: 1,
            height: '90%',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            boxSizing: 'border-box'
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              marginBottom: '16px', flexShrink: 0
            }}>
              <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#A78BFA' }}>
                Lyrics
              </span>
            </div>

            {/* Lyrics Viewport Container */}
            <div
              ref={lyricsContainerRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                paddingRight: '12px',
                scrollBehavior: 'smooth',
                maskImage: 'linear-gradient(to bottom, transparent 0%, white 15%, white 85%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, white 15%, white 85%, transparent 100%)',
              }}
            >
              <div style={{ paddingTop: '80px', paddingBottom: '160px' }}>
                {lyricsLoading && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px' }}>
                    <div style={{ border: '3px solid rgba(124, 58, 237, 0.2)', borderTopColor: '#7C3AED', width: '28px', height: '28px', borderRadius: '50%', animation: 'spin-slow 1s linear infinite' }} />
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Fetching synced lyrics...</p>
                  </div>
                )}

                {!lyricsLoading && lyricsState?.instrumental && (
                  <div style={{ textAlign: 'center', padding: '80px 0' }}>
                    <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>🎻</span>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Instrumental Section</p>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>No lyrics available for this song</p>
                  </div>
                )}

                {!lyricsLoading && !lyricsState?.instrumental && !lyricsState?.plainLyrics && !lyricsState?.syncedLyrics && (
                  <div style={{ textAlign: 'center', padding: '80px 0' }}>
                    <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>🔇</span>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>No lyrics found</p>
                  </div>
                )}

                {/* Synced Lyric Lines */}
                {!lyricsLoading && lyricsState?.synced && lyricsState.syncedLyrics && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {lyricsState.syncedLyrics.map((line, idx) => {
                      const isActive = idx === activeLineIndex;
                      return (
                        <p
                          key={idx}
                          ref={el => { lyricsLinesRefs.current[idx] = el; }}
                          onClick={() => handleLineClick(line)}
                          style={{
                            fontSize: isActive ? '22px' : '18px',
                            fontWeight: 800,
                            lineHeight: '1.5',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            textAlign: 'left',
                            color: isActive ? '#A78BFA' : 'rgba(255, 255, 255, 0.25)',
                            padding: '4px 0',
                            margin: 0,
                            letterSpacing: '-0.3px',
                          }}
                          onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'; }}
                          onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255, 255, 255, 0.25)'; }}
                        >
                          {line.text}
                        </p>
                      );
                    })}
                  </div>
                )}

                {/* Plain Text Lyric lines */}
                {!lyricsLoading && !lyricsState?.synced && lyricsState?.plainLyrics && (
                  <div style={{
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '15px',
                    lineHeight: '1.8',
                    whiteSpace: 'pre-line',
                    fontWeight: 600,
                    textAlign: 'left'
                  }}>
                    {lyricsState.plainLyrics}
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
