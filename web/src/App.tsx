import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { PlaybackBar } from './components/PlaybackBar';
import { EqualizerModal } from './components/EqualizerModal';
import { LyricsView } from './pages/LyricsView';
import { NowPlayingPage } from './pages/NowPlayingPage';
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { Library } from './pages/Library';
import { PlaylistDetail } from './pages/PlaylistDetail';
import { SplashScreen } from './components/SplashScreen';
import { Landing } from './pages/Landing';
import { useAudio } from './context/AudioContext';
import { Play, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion, HoverScale, SlidePanel } from './components/motion';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  useEffect(() => {
    // Remove any stale theme class — the new design uses the root tokens directly
    document.documentElement.className = '';
  }, []);

  // Audio UI panel toggles
  const [showEq, setShowEq] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showNowPlaying, setShowNowPlaying] = useState(false);

  const { activeQueue, currentSong, playSong, removeFromQueue, clearQueue } = useAudio();

  const handleSplashFinished = useCallback(() => {
    setShowSplash(false);
  }, []);

  const handleEnterApp = useCallback(() => {
    setShowLanding(false);
  }, []);

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
            setActivePlaylistId={setSelectedPlaylistId}
          />
        );
      case 'playlist_detail':
        return (
          <PlaylistDetail
            playlistId={selectedPlaylistId!}
            onBack={() => setCurrentTab('library')}
          />
        );
      default:
        return <Home setCurrentTab={setCurrentTab} />;
    }
  };

  return (
    <>
      {/* Splash Screen — self-manages its fade-out, then unmounts (no
          AnimatePresence: a stuck exit here would trap the whole app) */}
      {showSplash && <SplashScreen onFinished={handleSplashFinished} />}

      {/* Landing Page — same self-managed exit pattern */}
      {!showSplash && showLanding && <Landing onEnter={handleEnterApp} />}

      {/* Main App — always rendered & visible; the splash and landing sit on
          top (higher z-index) and fade THEMSELVES out to reveal it, so the app
          can never be stuck invisible behind a failed reveal animation. */}
      <div
        style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}
      >

        {/* ── Main Panel Grid Layout ── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: '100%' }}>
          {/* Left Sidebar */}
          <Sidebar
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            setActivePlaylistId={setSelectedPlaylistId}
          />

          {/* Center Screen */}
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'var(--bg-base)', minWidth: 0, position: 'relative' }}>
            {/* Main content transitions */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTab + (selectedPlaylistId || '')}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* ── Right Queue Drawer ── */}
          <AnimatePresence>
            {showQueue && currentSong && (
              <SlidePanel direction="right" style={{ height: '100%', zIndex: 50 }}>
                <aside style={{
                  width: '300px',
                  backgroundColor: 'var(--bg-surface)',
                  borderLeft: '1px solid var(--border)',
                  display: 'flex', flexDirection: 'column',
                  height: '100%', paddingBottom: '80px',
                  boxShadow: '-12px 0 40px rgba(0,0,0,0.3)'
                }}>
                  {/* Header */}
                  <div style={{ padding: '20px 16px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Play Queue</h3>
                      <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{activeQueue.length} tracks</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <HoverScale scale={1.1} tapScale={0.9}>
                        <button onClick={clearQueue} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', display: 'flex', padding: '5px', borderRadius: '6px', transition: 'background 0.15s' }} title="Clear queue" onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                          <Trash2 size={13} />
                        </button>
                      </HoverScale>
                      <HoverScale scale={1.1} tapScale={0.9}>
                        <button onClick={() => setShowQueue(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: '5px', borderRadius: '6px', transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                          <X size={15} />
                        </button>
                      </HoverScale>
                    </div>
                  </div>

                  {/* Queue List */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
                    <AnimatePresence>
                      {activeQueue.length === 0
                        ? <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: '12px', color: 'var(--text-tertiary)', padding: '12px 6px', fontStyle: 'italic' }}>Queue is empty.</motion.p>
                        : activeQueue.map(song => {
                            const isActive = currentSong.id === song.id;
                            return (
                              <motion.div
                                key={song.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20, scale: 0.9 }}
                                layout
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '9px',
                                  padding: '7px 8px', borderRadius: '10px', marginBottom: '2px',
                                  background: isActive ? 'var(--accent-dim)' : 'transparent',
                                  border: `1px solid ${isActive ? 'var(--accent-glow)' : 'transparent'}`,
                                  transition: 'background 0.12s',
                                  cursor: 'pointer',
                                }}
                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? 'var(--accent-dim)' : 'transparent'; }}
                              >
                                <div style={{ position: 'relative', width: '36px', height: '36px', flexShrink: 0 }}>
                                  <img src={song.imageUrl} alt={song.title} style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
                                  {!isActive && (
                                    <button
                                      onClick={() => playSong(song)}
                                      style={{
                                        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s', color: '#fff',
                                      }}
                                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                                    >
                                      <Play size={11} fill="white" />
                                    </button>
                                  )}
                                </div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                  <p style={{ fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isActive ? 'var(--accent)' : 'var(--text-primary)' }}>{song.title}</p>
                                  <p style={{ fontSize: '10px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>{song.artist}</p>
                                </div>
                                <button
                                  onClick={() => removeFromQueue(song.id)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', flexShrink: 0, opacity: 0.4, transition: 'opacity 0.15s' }}
                                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0.4')}
                                >
                                  <X size={12} />
                                </button>
                              </motion.div>
                            );
                          })
                      }
                    </AnimatePresence>
                  </div>
                </aside>
              </SlidePanel>
            )}
          </AnimatePresence>
        </div>

        {/* ── Playback Bar ── */}
        <PlaybackBar
          onOpenEq={() => setShowEq(true)}
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
        <AnimatePresence>
          {showLyrics && (
            <LyricsView
              isOpen={showLyrics}
              onClose={() => setShowLyrics(false)}
            />
          )}
        </AnimatePresence>

        {/* ── Equalizer Modal ── */}
        <AnimatePresence>
          {showEq && (
            <EqualizerModal
              isOpen={showEq}
              onClose={() => setShowEq(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
