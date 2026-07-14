import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, Heart, Plus, Play, Clock, X, TrendingUp } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useLibrary } from '../context/LibraryContext';
import { saavnApi } from '../services/api';
import type { Song } from '../types';

const formatDuration = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// Genre quick searches
const BROWSE_CATEGORIES = [
  { label: 'Tamil Hits', query: 'tamil hits 2025', grad: 'linear-gradient(135deg, #7C3AED, #4F46E5)', emoji: '🎵' },
  { label: 'Telugu', query: 'telugu hits 2025', grad: 'linear-gradient(135deg, #0EA5E9, #2563EB)', emoji: '🎶' },
  { label: 'Hindi', query: 'hindi hits 2025', grad: 'linear-gradient(135deg, #F97316, #EF4444)', emoji: '🎼' },
  { label: 'Trending', query: 'trending songs 2025', grad: 'linear-gradient(135deg, #10B981, #0EA5E9)', emoji: '🔥' },
  { label: 'Romantic', query: 'romantic love songs', grad: 'linear-gradient(135deg, #EC4899, #F97316)', emoji: '💕' },
  { label: 'Party', query: 'party dance songs', grad: 'linear-gradient(135deg, #F59E0B, #EF4444)', emoji: '🎉' },
  { label: 'Chill', query: 'chill relaxing songs', grad: 'linear-gradient(135deg, #0E7490, #1D4ED8)', emoji: '😌' },
  { label: 'Workout', query: 'workout gym songs', grad: 'linear-gradient(135deg, #7C3AED, #DC2626)', emoji: '💪' },
];

export const Search: React.FC = () => {
  const { playSong } = useAudio();
  const { toggleLike, isLiked, playlists, addSongToPlaylist, addToRecentlyPlayed } = useLibrary();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeMenuSongId, setActiveMenuSongId] = useState<string | null>(null);
  const [hoveredSong, setHoveredSong] = useState<string | null>(null);

  const debounceTimer = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('vibeup_search_history');
    if (stored) setHistory(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return; }
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      try {
        const matches = await saavnApi.searchSongs(query.trim(), 6);
        const titles = [...new Set(matches.map(s => s.title).filter(Boolean))].slice(0, 5);
        setSuggestions(titles);
        setShowSuggestions(true);
      } catch (e) { console.error(e); }
    }, 300);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [query]);

  const saveHistory = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    const updated = [clean, ...history.filter(h => h !== clean)].slice(0, 10);
    setHistory(updated);
    localStorage.setItem('vibeup_search_history', JSON.stringify(updated));
  };

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setShowSuggestions(false);
    setSuggestions([]);
    setQuery(searchQuery);
    saveHistory(searchQuery);
    try {
      const res = await saavnApi.searchSongs(searchQuery, 30);
      setResults(res);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCategoryClick = async (query: string) => {
    inputRef.current?.blur();
    await handleSearch(query);
  };

  const handlePlaySong = (song: Song) => {
    addToRecentlyPlayed(song);
    playSong(song, results);
  };

  const clearHistoryItem = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    const updated = history.filter(h => h !== item);
    setHistory(updated);
    localStorage.setItem('vibeup_search_history', JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('vibeup_search_history');
  };

  const hasResults = results.length > 0;

  return (
    <div
      onClick={() => { setActiveMenuSongId(null); setShowSuggestions(false); }}
      style={{ flex: 1, overflowY: 'auto', padding: '36px 32px 120px 32px', height: '100%', color: '#F3F4F6' }}
    >
      {/* ── Page Header ── */}
      <header style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 800, fontFamily: "'Outfit', sans-serif", marginBottom: '4px', letterSpacing: '-0.5px' }}>
          Search
        </h2>
        <p style={{ fontSize: '14px', color: '#6B7280' }}>Find songs, artists and albums</p>
      </header>

      {/* ── Search Bar ── */}
      <div
        style={{ position: 'relative', maxWidth: '680px', marginBottom: '40px' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          display: 'flex', alignItems: 'center',
          background: 'rgba(255,255,255,0.06)',
          border: '1.5px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '0 20px',
          height: '56px',
          transition: 'border-color 0.2s ease',
          backdropFilter: 'blur(8px)',
        }}
          onFocus={() => setShowSuggestions(suggestions.length > 0)}
        >
          <SearchIcon size={20} color="#6B7280" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for songs, artists, albums..."
            value={query}
            onChange={e => { setQuery(e.target.value); setShowSuggestions(true); }}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(query); if (e.key === 'Escape') { setShowSuggestions(false); inputRef.current?.blur(); } }}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            style={{
              flex: 1,
              background: 'transparent', border: 'none', outline: 'none',
              color: '#F3F4F6', fontSize: '16px',
              padding: '0 16px',
            }}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); setSuggestions([]); inputRef.current?.focus(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex', alignItems: 'center', flexShrink: 0 }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
            background: '#111128',
            border: '1px solid rgba(124, 58, 237, 0.2)',
            borderRadius: '14px',
            overflow: 'hidden',
            zIndex: 100,
            boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          }}>
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSearch(s)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '13px 18px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#D1D5DB', fontSize: '14px', textAlign: 'left',
                  borderBottom: idx < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124, 58, 237, 0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <SearchIcon size={14} color="#4B5563" />
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '16px' }}>
          <div style={{
            width: '36px', height: '36px',
            border: '3px solid rgba(124, 58, 237, 0.2)',
            borderTopColor: '#7C3AED',
            borderRadius: '50%',
            animation: 'spin-slow 0.8s linear infinite',
          }} />
          <p style={{ fontSize: '14px', color: '#6B7280' }}>Searching for your vibe...</p>
        </div>
      ) : hasResults ? (
        <>
          {/* ── Results Header ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>
              {results.length} results for <span style={{ color: '#A78BFA' }}>"{query}"</span>
            </p>
            <button
              onClick={() => { setResults([]); setQuery(''); inputRef.current?.focus(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <X size={13} /> Clear
            </button>
          </div>

          {/* ── Results List ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {results.map((song, index) => {
              const liked = isLiked(song.id);
              const isMenuOpen = activeMenuSongId === song.id;
              const isHovered = hoveredSong === song.id;
              return (
                <div
                  key={song.id}
                  onClick={() => handlePlaySong(song)}
                  onMouseEnter={() => setHoveredSong(song.id)}
                  onMouseLeave={() => setHoveredSong(null)}
                  style={{
                    display: 'flex', alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: isHovered ? 'rgba(255,255,255,0.05)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                    gap: '14px',
                  }}
                >
                  {/* Track number / play icon */}
                  <div style={{ width: '28px', textAlign: 'center', flexShrink: 0 }}>
                    {isHovered
                      ? <Play size={14} color="#7C3AED" fill="#7C3AED" />
                      : <span style={{ fontSize: '13px', color: '#4B5563', fontWeight: 600 }}>{index + 1}</span>
                    }
                  </div>

                  {/* Album art */}
                  <img
                    src={song.imageUrl}
                    alt={song.title}
                    style={{ width: '46px', height: '46px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                  />

                  {/* Song info */}
                  <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#F3F4F6' }}>
                      {song.title}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                      {song.artist} {song.album ? `· ${song.album}` : ''}
                    </p>
                  </div>

                  {/* Duration */}
                  <span style={{ fontSize: '12px', color: '#4B5563', fontWeight: 600, flexShrink: 0, minWidth: '40px', textAlign: 'right' }}>
                    {formatDuration(song.duration)}
                  </span>

                  {/* Like button */}
                  <button
                    onClick={e => { e.stopPropagation(); toggleLike(song); }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: liked ? '#EF4444' : '#4B5563',
                      flexShrink: 0,
                      opacity: isHovered || liked ? 1 : 0,
                      transition: 'opacity 0.15s ease',
                      display: 'flex', alignItems: 'center',
                    }}
                  >
                    <Heart size={15} fill={liked ? '#EF4444' : 'none'} />
                  </button>

                  {/* Menu */}
                  <div style={{ position: 'relative', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setActiveMenuSongId(isMenuOpen ? null : song.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#6B7280', fontSize: '20px', fontWeight: 700,
                        opacity: isHovered ? 1 : 0,
                        transition: 'opacity 0.15s ease',
                        lineHeight: 1,
                        padding: '0 4px',
                      }}
                    >
                      ⋮
                    </button>
                    {isMenuOpen && (
                      <div style={{
                        position: 'absolute', right: 0, top: '28px',
                        background: '#111128',
                        border: '1px solid rgba(124, 58, 237, 0.2)',
                        borderRadius: '12px', padding: '6px',
                        zIndex: 50, minWidth: '170px',
                        boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                      }}>
                        <button
                          onClick={() => { toggleLike(song); setActiveMenuSongId(null); }}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: '9px 12px', borderRadius: '8px',
                            color: liked ? '#EF4444' : '#F3F4F6', fontSize: '12px', fontWeight: 600,
                          }}
                        >
                          <Heart size={12} fill={liked ? '#EF4444' : 'none'} />
                          {liked ? 'Unlike' : 'Like Song'}
                        </button>
                        {playlists.length > 0 && <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />}
                        {playlists.map(pl => (
                          <button
                            key={pl.id}
                            onClick={() => { addSongToPlaylist(pl.id, song); setActiveMenuSongId(null); }}
                            style={{
                              width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                              background: 'none', border: 'none', cursor: 'pointer',
                              padding: '8px 12px', borderRadius: '8px',
                              color: '#9CA3AF', fontSize: '12px',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}
                          >
                            <Plus size={10} />
                            Add to {pl.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {/* ── Recent Searches ── */}
          {history.length > 0 && (
            <section style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                  Recent Searches
                </h3>
                <button
                  onClick={clearHistory}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#6B7280' }}
                >
                  Clear all
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {history.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '8px 14px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '100px',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onClick={() => handleSearch(h)}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124, 58, 237, 0.12)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  >
                    <Clock size={12} color="#6B7280" />
                    <span style={{ fontSize: '13px', color: '#D1D5DB', fontWeight: 500 }}>{h}</span>
                    <button
                      onClick={e => clearHistoryItem(e, h)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', display: 'flex', alignItems: 'center', padding: 0 }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Browse Categories ── */}
          <section>
            <h3 style={{ fontSize: '20px', fontWeight: 800, fontFamily: "'Outfit', sans-serif", marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} color="#7C3AED" />
              Browse Categories
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
              {BROWSE_CATEGORIES.map(cat => (
                <button
                  key={cat.label}
                  onClick={() => handleCategoryClick(cat.query)}
                  style={{
                    height: '100px',
                    background: cat.grad,
                    border: 'none', borderRadius: '14px',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'flex-end',
                    padding: '16px',
                    textAlign: 'left',
                    transition: 'transform 0.2s ease, filter 0.2s ease',
                    position: 'relative', overflow: 'hidden',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.filter = 'brightness(1.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'brightness(1)'; }}
                >
                  <span style={{ position: 'absolute', top: '14px', right: '16px', fontSize: '28px' }}>{cat.emoji}</span>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.2px' }}>
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};
