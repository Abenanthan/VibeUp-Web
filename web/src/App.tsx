import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { PlaybackBar } from './components/PlaybackBar';
import { EqualizerModal } from './components/EqualizerModal';
import { LyricsView } from './pages/LyricsView';
import { NowPlayingPage } from './pages/NowPlayingPage';
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { Library } from './pages/Library';
import { PlaylistDetail } from './pages/PlaylistDetail';
import { useAudio } from './context/AudioContext';
import { Play, Trash2, X } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  // Audio UI panel toggles
  const [showEq, setShowEq] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showNowPlaying, setShowNowPlaying] = useState(false);

  const { activeQueue, currentSong, playSong, removeFromQueue, clearQueue } = useAudio();

  const renderContent = () => {
    switch (currentTab) {
      case 'home':
        return <Home setCurrentTab={setCurrentTab} />;
      case 'search':
        return <Search />;
      case 'library':
        return (
          <Library
            setCurrentTab={setCurrentTab}
            setSelectedPlaylistId={setSelectedPlaylistId}
          />
        );
      case 'playlist-detail':
        return (
          <PlaylistDetail
            playlistId={selectedPlaylistId}
            setCurrentTab={setCurrentTab}
          />
        );
      default:
        return <Home setCurrentTab={setCurrentTab} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>

      {/* ── Main Panel Grid Layout ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: '100%' }}>
        {/* Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          setSelectedPlaylistId={setSelectedPlaylistId}
        />

        {/* Center Screen */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'var(--bg-base)', minWidth: 0 }}>
          {renderContent()}
        </main>

        {/* ── Right Queue Drawer ── */}
        {showQueue && currentSong && (
          <aside style={{
            width: '280px',
            backgroundColor: 'var(--bg-surface)',
            borderLeft: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column',
            height: '100%', paddingBottom: '80px',
          }}>
            {/* Header */}
            <div style={{ padding: '20px 16px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Play Queue</h3>
                <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{activeQueue.length} tracks</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button onClick={clearQueue} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', display: 'flex', padding: '5px', borderRadius: '6px', transition: 'background 0.15s' }} title="Clear queue" onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                  <Trash2 size={13} />
                </button>
                <button onClick={() => setShowQueue(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: '5px', borderRadius: '6px', transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Queue List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
              {activeQueue.length === 0
                ? <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', padding: '12px 6px', fontStyle: 'italic' }}>Queue is empty.</p>
                : activeQueue.map(song => {
                    const isActive = currentSong.id === song.id;
                    return (
                      <div
                        key={song.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '9px',
                          padding: '7px 8px', borderRadius: '9px', marginBottom: '1px',
                          background: isActive ? 'var(--amber-dim)' : 'transparent',
                          border: `1px solid ${isActive ? 'var(--amber-glow)' : 'transparent'}`,
                          transition: 'background 0.12s',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{ position: 'relative', width: '34px', height: '34px', flexShrink: 0 }}>
                          <img src={song.imageUrl} alt={song.title}
                            style={{ width: '34px', height: '34px', borderRadius: '7px', objectFit: 'cover' }} />
                          {!isActive && (
                            <button
                              onClick={() => playSong(song)}
                              style={{
                                position: 'absolute', inset: 0,
                                background: 'rgba(0,0,0,0.6)',
                                border: 'none', cursor: 'pointer', borderRadius: '7px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                opacity: 0, transition: 'opacity 0.15s', color: '#fff',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                              onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                            >
                              <Play size={11} fill="white" />
                            </button>
                          )}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <p style={{ fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isActive ? 'var(--amber)' : 'var(--text-primary)' }}>
                            {song.title}
                          </p>
                          <p style={{ fontSize: '10px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                            {song.artist}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromQueue(song.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', flexShrink: 0, opacity: 0.4, transition: 'opacity 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = '0.4')}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })
              }
            </div>
          </aside>
        )}
      </div>

      {/* ── Playback Bar ── */}
      <PlaybackBar
        onOpenEq={() => setShowEq(true)}
        onToggleLyrics={() => setShowLyrics(!showLyrics)}
        showLyrics={showLyrics}
        onOpenQueue={() => setShowQueue(!showQueue)}
        onOpenNowPlaying={() => setShowNowPlaying(true)}
      />

      {/* ── Now Playing Full Screen ── */}
      <NowPlayingPage
        isOpen={showNowPlaying}
        onClose={() => setShowNowPlaying(false)}
        onOpenQueue={() => setShowQueue(!showQueue)}
        onOpenEq={() => setShowEq(true)}
      />

      {/* ── Synced Lyrics Drawer ── */}
      <LyricsView
        isOpen={showLyrics}
        onClose={() => setShowLyrics(false)}
      />

      {/* ── Equalizer Modal ── */}
      <EqualizerModal
        isOpen={showEq}
        onClose={() => setShowEq(false)}
      />
    </div>
  );
}
