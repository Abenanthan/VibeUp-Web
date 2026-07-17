import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, Heart, Plus, Play, Clock, X, Mic2 } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useLibrary } from '../context/LibraryContext';
import { saavnApi } from '../services/api';
import type { Song } from '../types';

const fmtDur = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

const CATEGORIES = [
  { label: 'Tamil',    query: 'tamil hits 2025',        bg: 'linear-gradient(135deg,#3d1a5e,#6b2fa0)' },
  { label: 'Telugu',   query: 'telugu hits 2025',       bg: 'linear-gradient(135deg,#0a3a5c,#1565a0)' },
  { label: 'Hindi',    query: 'hindi hits 2025',        bg: 'linear-gradient(135deg,#5c2000,#a03800)' },
  { label: 'Trending', query: 'trending songs 2025',    bg: 'linear-gradient(135deg,#0c4a30,#1a8a55)' },
  { label: 'Romantic', query: 'romantic love songs',    bg: 'linear-gradient(135deg,#5c0a2a,#a01c50)' },
  { label: 'Party',    query: 'party dance songs',      bg: 'linear-gradient(135deg,#5c3800,#a06000)' },
  { label: 'Chill',    query: 'chill relaxing songs',   bg: 'linear-gradient(135deg,#0a3040,#0e5070)' },
  { label: 'Workout',  query: 'workout gym songs',      bg: 'linear-gradient(135deg,#4a0808,#8a1414)' },
];

export const Search: React.FC = () => {
  const { playSong } = useAudio();
  const { toggleLike, isLiked, playlists, addSongToPlaylist, addToRecentlyPlayed } = useLibrary();

  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState<Song[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [history, setHistory]       = useState<string[]>([]);
  const [loading, setLoading]       = useState(false);
  const [showSug, setShowSug]       = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [hovered, setHovered]       = useState<string | null>(null);

  const timer = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('vibeup_search_history');
    if (stored) setHistory(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const matches = await saavnApi.searchSongs(query.trim(), 6).catch(() => []);
      setSuggestions([...new Set(matches.map(s => s.title).filter(Boolean))].slice(0, 5));
      setShowSug(true);
    }, 300);
    return () => clearTimeout(timer.current);
  }, [query]);

  const saveHistory = (term: string) => {
    const updated = [term, ...history.filter(h => h !== term)].slice(0, 10);
    setHistory(updated);
    localStorage.setItem('vibeup_search_history', JSON.stringify(updated));
  };

  const doSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true); setShowSug(false); setSuggestions([]); setQuery(q); saveHistory(q);
    const res = await saavnApi.searchSongs(q, 30).catch(() => []);
    setResults(res); setLoading(false);
  };

  const handlePlay = (song: Song) => { addToRecentlyPlayed(song); playSong(song, results); };

  return (
    <div onClick={() => { setActiveMenu(null); setShowSug(false); }} style={{ flex: 1, overflowY: 'auto', padding: '32px 28px 100px', height: '100%', color: 'var(--text-primary)' }}>

      <header style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.4px', color: 'var(--text-primary)', marginBottom: '3px' }}>Search</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Find songs, artists and more</p>
      </header>

      {/* Search bar */}
      <div style={{ position: 'relative', maxWidth: '620px', marginBottom: '36px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-lg)', padding: '0 16px', height: '50px', transition: 'border-color 0.2s' }} onFocus={() => setShowSug(suggestions.length > 0)}>
          <SearchIcon size={17} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Songs, artists, albums…"
            value={query}
            onChange={e => { setQuery(e.target.value); setShowSug(true); }}
            onKeyDown={e => { if (e.key === 'Enter') doSearch(query); if (e.key === 'Escape') { setShowSug(false); inputRef.current?.blur(); } }}
            onFocus={() => suggestions.length && setShowSug(true)}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '14px', padding: '0 12px', fontFamily: 'var(--font)' }}
          />
          {query && <button onClick={() => { setQuery(''); setResults([]); setSuggestions([]); inputRef.current?.focus(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}><X size={16} /></button>}
        </div>
        {showSug && suggestions.length > 0 && (
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', overflow: 'hidden', zIndex: 100, boxShadow: '0 16px 40px rgba(0,0,0,0.4)' }}>
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => doSearch(s)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '13px', textAlign: 'left', borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none', fontFamily: 'var(--font)', transition: 'background 0.12s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                <SearchIcon size={13} color="var(--text-tertiary)" />{s}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '180px', flexDirection: 'column', gap: '12px' }}>
          <div className="animate-spin" style={{ width: '28px', height: '28px', border: '2px solid var(--border-medium)', borderTopColor: 'var(--amber)', borderRadius: '50%' }} />
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Searching…</p>
        </div>
      ) : results.length > 0 ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}><span style={{ color: 'var(--amber)', fontWeight: 600 }}>{results.length}</span> results for "{query}"</p>
            <button onClick={() => { setResults([]); setQuery(''); inputRef.current?.focus(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font)' }}><X size={12} /> Clear</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {results.map((song, idx) => {
              const liked = isLiked(song.id);
              const menuOpen = activeMenu === song.id;
              const isHov = hovered === song.id;
              return (
                <div key={song.id} onClick={() => handlePlay(song)} onMouseEnter={() => setHovered(song.id)} onMouseLeave={() => setHovered(null)} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', borderRadius: 'var(--radius-md)', background: isHov ? 'var(--bg-elevated)' : 'transparent', cursor: 'pointer', gap: '12px', transition: 'background 0.12s' }}>
                  <div style={{ width: '26px', textAlign: 'center', flexShrink: 0 }}>
                    {isHov ? <Play size={13} color="var(--amber)" fill="var(--amber)" /> : <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500 }}>{idx + 1}</span>}
                  </div>
                  <img src={song.imageUrl} alt={song.title} style={{ width: '42px', height: '42px', borderRadius: '7px', objectFit: 'cover', flexShrink: 0 }} />
                  <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{song.title}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>{song.artist}{song.album ? ` · ${song.album}` : ''}</p>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500, flexShrink: 0 }}>{fmtDur(song.duration)}</span>
                  <button onClick={e => { e.stopPropagation(); toggleLike(song); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: liked ? 'var(--danger)' : 'var(--text-secondary)', opacity: isHov || liked ? 1 : 0, transition: 'opacity 0.15s', display: 'flex', flexShrink: 0 }}><Heart size={14} fill={liked ? 'var(--danger)' : 'none'} /></button>
                  <div style={{ position: 'relative', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => setActiveMenu(menuOpen ? null : song.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '18px', fontWeight: 700, opacity: isHov ? 1 : 0, transition: 'opacity 0.15s', lineHeight: 1, padding: '0 4px' }}>⋮</button>
                    {menuOpen && (
                      <div style={{ position: 'absolute', right: 0, top: '26px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '5px', zIndex: 50, minWidth: '165px', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}>
                        <button onClick={() => { toggleLike(song); setActiveMenu(null); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 10px', borderRadius: '7px', color: liked ? 'var(--danger)' : 'var(--text-primary)', fontSize: '12px', fontWeight: 500, fontFamily: 'var(--font)' }}><Heart size={12} fill={liked ? 'var(--danger)' : 'none'} />{liked ? 'Unlike' : 'Like'}</button>
                        {playlists.length > 0 && <div style={{ height: '1px', background: 'var(--border)', margin: '3px 0' }} />}
                        {playlists.map(pl => <button key={pl.id} onClick={() => { addSongToPlaylist(pl.id, song); setActiveMenu(null); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '7px', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: '7px', color: 'var(--text-secondary)', fontSize: '11px', fontFamily: 'var(--font)' }}><Plus size={9} />Add to {pl.name}</button>)}
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
          {history.length > 0 && (
            <section style={{ marginBottom: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Recent Searches</h3>
                <button onClick={() => { setHistory([]); localStorage.removeItem('vibeup_search_history'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font)' }}>Clear all</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                {history.map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '99px', cursor: 'pointer', transition: 'border-color 0.15s' }} onClick={() => doSearch(h)} onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--amber)')} onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                    <Clock size={11} color="var(--text-tertiary)" />
                    <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 400 }}>{h}</span>
                    <button onClick={e => { e.stopPropagation(); const u = history.filter(x => x !== h); setHistory(u); localStorage.setItem('vibeup_search_history', JSON.stringify(u)); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', padding: 0 }}><X size={10} /></button>
                  </div>
                ))}
              </div>
            </section>
          )}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Mic2 size={16} color="var(--amber)" strokeWidth={1.8} />
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Browse</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '10px' }}>
              {CATEGORIES.map(cat => (
                <button key={cat.label} onClick={() => doSearch(cat.query)} style={{ height: '92px', background: cat.bg, border: 'none', borderRadius: 'var(--radius-lg)', cursor: 'pointer', display: 'flex', alignItems: 'flex-end', padding: '14px 16px', textAlign: 'left', transition: 'transform 0.2s, filter 0.2s', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font)' }} onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.filter = 'brightness(1.12)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'brightness(1)'; }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.2px' }}>{cat.label}</span>
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};
