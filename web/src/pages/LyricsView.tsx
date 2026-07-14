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
      className="fixed inset-0 z-30 flex flex-col text-text-main"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: '96px', // leave room for playback bar
        background: 'linear-gradient(135deg, rgba(10, 10, 26, 0.95), rgba(7, 7, 20, 0.98))',
        backdropFilter: 'blur(30px)',
        zIndex: 30,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-glass-border/30" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', borderBottom: '1px solid rgba(124, 58, 237, 0.1)' }}>
        <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlignLeft className="text-primary" size={20} style={{ color: '#7C3AED' }} />
          <div>
            <h3 className="font-extrabold text-lg">Lyrics</h3>
            <p className="text-xs text-text-muted">{currentSong.title} — {currentSong.artist}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="hover:bg-card-hover p-1.5 rounded-full text-text-muted hover:text-white transition-colors"
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#9CA3AF' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Lyrics Content Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-6 md:p-12 flex flex-col items-center justify-start"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '48px 24px',
          scrollBehavior: 'smooth'
        }}
      >
        {lyricsLoading && (
          <div className="flex flex-col items-center justify-center h-64 gap-3 mt-12" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div className="border-4 border-primary border-t-transparent w-8 h-8 rounded-full animate-spin" style={{ border: '4px solid #7C3AED', borderTopColor: 'transparent', width: '32px', height: '32px', borderRadius: '50%', animation: 'spin-slow 1s linear infinite' }}></div>
            <p className="text-sm text-text-muted">Loading lyrics...</p>
          </div>
        )}

        {!lyricsLoading && lyricsState?.instrumental && (
          <div className="text-center mt-20" style={{ textAlign: 'center' }}>
            <span className="text-5xl block mb-4">🎻</span>
            <p className="text-xl font-bold tracking-wide text-text-muted">Instrumental</p>
            <p className="text-xs text-text-dark mt-1" style={{ color: '#4B5563' }}>No lyrics available for this song</p>
          </div>
        )}

        {!lyricsLoading && !lyricsState?.instrumental && !lyricsState?.plainLyrics && !lyricsState?.syncedLyrics && (
          <div className="text-center mt-20" style={{ textAlign: 'center' }}>
            <span className="text-4xl block mb-4">🔇</span>
            <p className="text-lg font-bold text-text-muted">Lyrics not found</p>
            <p className="text-xs text-text-dark mt-1" style={{ color: '#4B5563' }}>Could not fetch lyrics for this track</p>
          </div>
        )}

        {/* Synced Lyrics List */}
        {!lyricsLoading && lyricsState?.synced && lyricsState.syncedLyrics && (
          <div className="w-full max-w-2xl flex flex-col gap-6" style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '650px', paddingBottom: '100px' }}>
            {lyricsState.syncedLyrics.map((line, idx) => {
              const isActive = idx === activeLineIndex;
              return (
                <p
                  key={idx}
                  ref={el => { linesRefs.current[idx] = el; }}
                  onClick={() => handleLineClick(line)}
                  className={`text-lg md:text-2xl font-bold tracking-tight text-center cursor-pointer transition-all duration-300 transform origin-center py-2 px-4 rounded-2xl ${
                    isActive 
                      ? 'text-green scale-105 bg-card-hover/20 shadow-lg shadow-purple-500/5' 
                      : 'text-text-muted/50 hover:text-text-main hover:scale-102'
                  }`}
                  style={{
                    fontSize: isActive ? '24px' : '20px',
                    lineHeight: '1.6',
                    cursor: 'pointer',
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                    textAlign: 'center',
                    backgroundColor: isActive ? 'rgba(26, 26, 58, 0.3)' : 'transparent',
                    color: isActive ? '#10B981' : 'rgba(156, 163, 175, 0.4)',
                    fontWeight: isActive ? '800' : '600'
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
            className="w-full max-w-xl text-center text-text-muted text-base md:text-lg font-medium leading-loose whitespace-pre-line"
            style={{
              width: '100%',
              maxWidth: '550px',
              textAlign: 'center',
              lineHeight: '2',
              color: '#9CA3AF',
              whiteSpace: 'pre-line',
              fontSize: '16px',
              paddingBottom: '100px'
            }}
          >
            {lyricsState.plainLyrics}
          </div>
        )}
      </div>
    </div>
  );
};
