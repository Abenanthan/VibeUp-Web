import React, { useEffect, useState, useRef } from 'react';
import { AlignLeft, X } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import type { LyricLine } from '../services/api';

interface LyricsViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LyricsView: React.FC<LyricsViewProps> = ({ isOpen, onClose }) => {
  const { currentSong, currentTime, seekTo, lyricsState, lyricsLoading } = useAudio();
  const [activeLineIndex, setActiveLineIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const linesRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  // Synchronize current timestamp to active lyric index
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
      
      // Auto scroll active line to center
      if (containerRef.current && linesRefs.current[index]) {
        const lineEl = linesRefs.current[index];
        if (lineEl) {
          const container = containerRef.current;
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

  if (!isOpen || !currentSong) return null;

  return (
    <div
      className="fixed inset-0 z-30 flex flex-col"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: '96px', // leave room for playback bar
        background: 'linear-gradient(135deg, var(--bg-base), var(--bg-surface))',
        backdropFilter: 'blur(30px)',
        zIndex: 30,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlignLeft size={20} style={{ color: 'var(--amber)' }} />
          <div>
            <h3 style={{ fontWeight: 800, fontSize: '18px', color: 'var(--text-primary)' }}>Lyrics</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{currentSong.title} — {currentSong.artist}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <X size={20} />
        </button>
      </div>

      {/* Lyrics Content Container */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '48px 24px',
          scrollBehavior: 'smooth'
        }}
      >
        {lyricsLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '48px' }}>
            <div style={{ border: '4px solid var(--amber)', borderTopColor: 'transparent', width: '32px', height: '32px', borderRadius: '50%', animation: 'spinCw 1s linear infinite' }}></div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Loading lyrics...</p>
          </div>
        )}

        {!lyricsLoading && lyricsState?.instrumental && (
          <div style={{ textAlign: 'center', marginTop: '80px' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🎻</span>
            <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-secondary)' }}>Instrumental</p>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>No lyrics available for this song</p>
          </div>
        )}

        {!lyricsLoading && !lyricsState?.instrumental && !lyricsState?.plainLyrics && !lyricsState?.syncedLyrics && (
          <div style={{ textAlign: 'center', marginTop: '80px' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🔇</span>
            <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-secondary)' }}>Lyrics not found</p>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>Could not fetch lyrics for this track</p>
          </div>
        )}

        {/* Synced Lyrics List */}
        {!lyricsLoading && lyricsState?.synced && lyricsState.syncedLyrics && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '650px', paddingBottom: '100px', margin: '0 auto' }}>
            {lyricsState.syncedLyrics.map((line, idx) => {
              const isActive = idx === activeLineIndex;
              return (
                <p
                  key={idx}
                  ref={el => { linesRefs.current[idx] = el; }}
                  onClick={() => handleLineClick(line)}
                  style={{
                    fontSize: isActive ? '24px' : '20px',
                    lineHeight: '1.6',
                    cursor: 'pointer',
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                    textAlign: 'center',
                    backgroundColor: isActive ? 'var(--amber-dim)' : 'transparent',
                    color: isActive ? 'var(--amber)' : 'var(--text-secondary)',
                    opacity: isActive ? 1 : 0.45,
                    fontWeight: isActive ? '800' : '600',
                    padding: '8px 16px',
                    transform: isActive ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  {line.text}
                </p>
              );
            })}
          </div>
        )}

        {/* Plain Lyrics fallback */}
        {!lyricsLoading && !lyricsState?.synced && lyricsState?.plainLyrics && (
          <div
            style={{
              width: '100%',
              maxWidth: '550px',
              textAlign: 'center',
              lineHeight: '2',
              color: 'var(--text-secondary)',
              whiteSpace: 'pre-line',
              fontSize: '16px',
              paddingBottom: '100px',
              margin: '0 auto'
            }}
          >
            {lyricsState.plainLyrics}
          </div>
        )}
      </div>
    </div>
  );
};
