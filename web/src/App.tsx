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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#080818', color: '#F3F4F6' }}>

      {/* ── Main Panel Grid Layout ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: '100%' }}>
        {/* Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          setSelectedPlaylistId={setSelectedPlaylistId}
        />

        {/* Center Screen */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#080818' }}>
          {renderContent()}
        </main>

        {/* ── Right Queue Drawer ── */}
        {showQueue && currentSong && (
          <aside style={{
            width: '300px',
            backgroundColor: '#060612',
            borderLeft: '1px solid rgba(124, 58, 237, 0.12)',
            display: 'flex', flexDirection: 'column',
            height: '100%', paddingBottom: '96px',
          }}>
            {/* Header */}
            <div style={{ padding: '24px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>Play Queue</h3>
                <p style={{ fontSize: '11px', color: '#4B5563', marginTop: '2px' }}>{activeQueue.length} tracks</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={clearQueue}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', padding: '6px' }}
                  title="Clear queue"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  onClick={() => setShowQueue(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex', padding: '6px' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Queue List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
              {activeQueue.length === 0
                ? <p style={{ fontSize: '12px', color: '#374151', padding: '12px', fontStyle: 'italic' }}>Queue is empty.</p>
                : activeQueue.map(song => {
                    const isActive = currentSong.id === song.id;
                    return (
                      <div
                        key={song.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '8px 10px', borderRadius: '10px', marginBottom: '2px',
                          background: isActive ? 'rgba(124,58,237,0.12)' : 'transparent',
                          border: isActive ? '1px solid rgba(124,58,237,0.25)' : '1px solid transparent',
                          transition: 'background 0.15s',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{ position: 'relative', width: '36px', height: '36px', flexShrink: 0 }}>
                          <img src={song.imageUrl} alt={song.title}
                            style={{ width: '36px', height: '36px', borderRadius: '7px', objectFit: 'cover' }} />
                          {!isActive && (
                            <button
                              onClick={() => playSong(song)}
                              style={{
                                position: 'absolute', inset: 0,
                                background: 'rgba(0,0,0,0.65)',
                                border: 'none', cursor: 'pointer', borderRadius: '7px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                opacity: 0, transition: 'opacity 0.15s', color: '#fff',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                              onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                            >
                              <Play size={12} fill="white" />
                            </button>
                          )}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <p style={{ fontSize: '12px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isActive ? '#A78BFA' : '#F3F4F6' }}>
                            {song.title}
                          </p>
                          <p style={{ fontSize: '10px', color: '#4B5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                            {song.artist}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromQueue(song.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', flexShrink: 0, opacity: 0.5, transition: 'opacity 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
                        >
                          <X size={13} />
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
