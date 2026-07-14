import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { Song } from '../types';
import { saavnApi } from '../services/api';

export type RepeatMode = 'none' | 'queue' | 'song';

interface AudioContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  queue: Song[];
  activeQueue: Song[];
  isShuffle: boolean;
  repeatMode: RepeatMode;
  isResolvingUrl: boolean;

  playSong: (song: Song, newQueue?: Song[]) => Promise<void>;
  togglePlayPause: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  toggleShuffle: () => void;
  toggleRepeatMode: () => void;
  removeFromQueue: (songId: string) => void;
  addToQueue: (song: Song) => void;
  clearQueue: () => void;

  // Equalizer API
  eqEnabled: boolean;
  setEqEnabled: (enabled: boolean) => void;
  eqBands: number[];
  setEqBand: (index: number, gain: number) => void;
  bassBoost: number;
  setBassBoost: (value: number) => void;
  preset: string;
  applyPreset: (presetName: string) => void;
}

const AudioPlayContext = createContext<AudioContextType | undefined>(undefined);

const EQ_FREQUENCIES = [60, 230, 910, 4000, 14000];

export const PRESETS: Record<string, number[]> = {
  Normal: [0, 0, 0, 0, 0],
  Pop: [-1.5, 1, 2.5, 1.5, -1],
  Rock: [4, 2.5, -1, 1.5, 3.5],
  Jazz: [3, 1.5, -2, 1.5, 2.5],
  Classical: [3, 2, -1, -2, -3],
  Vocal: [-2, -1.5, 2, 3, 1.5]
};

const getProxiedAudioUrl = (url: string) => {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'aac.saavncdn.com') {
      return url.replace('https://aac.saavncdn.com', '/audio-proxy-aac');
    }
    if (parsed.hostname === 'h.saavncdn.com') {
      return url.replace('https://h.saavncdn.com', '/audio-proxy-h');
    }
    if (parsed.hostname === 'c.saavncdn.com') {
      return url.replace('https://c.saavncdn.com', '/audio-proxy-c');
    }
  } catch (e) {
    // Ignore invalid URL
  }
  return url;
};

// Singleton audio element - created once, never recreated
const globalAudio = new Audio();
globalAudio.preload = 'auto';

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [queue, setQueue] = useState<Song[]>([]);
  const [activeQueue, setActiveQueue] = useState<Song[]>([]);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
  const [isResolvingUrl, setIsResolvingUrl] = useState(false);

  // Equalizer states
  const [eqEnabled, setEqEnabledState] = useState(false);
  const [eqBands, setEqBands] = useState<number[]>([0, 0, 0, 0, 0]);
  const [bassBoost, setBassBoostState] = useState(0);
  const [preset, setPreset] = useState('Normal');

  // Refs - use the singleton audio element
  const audioRef = useRef<HTMLAudioElement>(globalAudio);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const eqGainNodeRef = useRef<GainNode | null>(null);
  const webAudioInitialized = useRef(false);

  // Use refs to access latest state inside event callbacks (avoid stale closures)
  const activeQueueRef = useRef<Song[]>([]);
  const currentSongRef = useRef<Song | null>(null);
  const repeatModeRef = useRef<RepeatMode>('none');
  const currentTimeRef = useRef(0);

  useEffect(() => { activeQueueRef.current = activeQueue; }, [activeQueue]);
  useEffect(() => { currentSongRef.current = currentSong; }, [currentSong]);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);

  // Initialize Web Audio API (called on first user interaction only)
  const initWebAudio = useCallback(() => {
    if (webAudioInitialized.current || !audioRef.current) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      // Need crossOrigin for Web Audio API only if loading external source
      const audio = audioRef.current;
      if (audio.src && !audio.src.includes('/audio-proxy-')) {
        audio.crossOrigin = 'anonymous';
      } else {
        audio.removeAttribute('crossorigin');
      }

      const source = ctx.createMediaElementSource(audio);
      sourceNodeRef.current = source;

      // Bass boost filter
      const bassFilter = ctx.createBiquadFilter();
      bassFilter.type = 'lowshelf';
      bassFilter.frequency.value = 150;
      bassFilter.gain.value = 0;
      bassFilterRef.current = bassFilter;

      // 5-band EQ
      const filters = EQ_FREQUENCIES.map((freq) => {
        const filter = ctx.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.0;
        filter.gain.value = 0;
        return filter;
      });
      filtersRef.current = filters;

      // Preamp gain node
      const gainNode = ctx.createGain();
      gainNode.gain.value = 1.0;
      eqGainNodeRef.current = gainNode;

      // Chain: source -> bass -> eq bands -> gain -> destination
      let lastNode: AudioNode = source;
      lastNode.connect(bassFilter);
      lastNode = bassFilter;
      filters.forEach(f => { lastNode.connect(f); lastNode = f; });
      lastNode.connect(gainNode);
      gainNode.connect(ctx.destination);

      webAudioInitialized.current = true;
      console.log('Web Audio API initialized successfully');
    } catch (e) {
      console.warn('Web Audio API initialization failed:', e);
    }
  }, []);

  // Internal playNext using refs (safe inside event listeners)
  const playNextInternal = useCallback(() => {
    const queue = activeQueueRef.current;
    const song = currentSongRef.current;
    const mode = repeatModeRef.current;

    if (!queue.length || !song) return;

    const idx = queue.findIndex(s => s.id === song.id);
    let nextIdx = idx + 1;

    if (nextIdx >= queue.length) {
      if (mode === 'queue') {
        nextIdx = 0;
      } else {
        setIsPlaying(false);
        return;
      }
    }

    // Trigger playSong for the next track
    playSongInternal(queue[nextIdx]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Internal play function (also used in callbacks - no stale closure)
  const playSongInternal = useCallback(async (song: Song, newQueue?: Song[]) => {
    const audio = audioRef.current;

    setIsResolvingUrl(true);
    let resolvedSong = song;

    try {
      // If no audio URL, resolve via getSongById
      if (!song.audioUrl) {
        const resolved = await saavnApi.getSongById(song.id);
        if (resolved && resolved.audioUrl) {
          resolvedSong = resolved;
        } else {
          throw new Error('No audio URL available for this song');
        }
      }

      setCurrentSong(resolvedSong);
      currentSongRef.current = resolvedSong;

      const proxiedUrl = getProxiedAudioUrl(resolvedSong.audioUrl);
      if (proxiedUrl.startsWith('/audio-proxy-')) {
        audio.removeAttribute('crossorigin');
      } else {
        audio.crossOrigin = 'anonymous';
      }
      audio.src = proxiedUrl;
      audio.volume = volume;
      audio.load();

      await audio.play();
      setIsPlaying(true);

      // Update queue
      if (newQueue && newQueue.length > 0) {
        const updatedQueue = newQueue.map(s => s.id === song.id ? resolvedSong : s);
        setQueue(updatedQueue);
        activeQueueRef.current = updatedQueue;
      } else if (!activeQueueRef.current.some(s => s.id === resolvedSong.id)) {
        const newQ = [...activeQueueRef.current, resolvedSong];
        setQueue(newQ);
        activeQueueRef.current = newQ;
      }

      // Cache song data for playlist detail page to load from localStorage
      try {
        localStorage.setItem(`vibeup_song_${resolvedSong.id}`, JSON.stringify(resolvedSong));
      } catch (_e) { /* storage full */ }

    } catch (error) {
      console.error('Error playing song:', error);
      setIsPlaying(false);
    } finally {
      setIsResolvingUrl(false);
    }
  }, [volume]); // eslint-disable-line react-hooks/exhaustive-deps

  // Set up audio event listeners ONCE on mount
  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = volume;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      currentTimeRef.current = audio.currentTime;
    };
    const handleDurationChange = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      const mode = repeatModeRef.current;
      if (mode === 'song') {
        audio.currentTime = 0;
        audio.play().catch(e => console.warn('Repeat play error:', e));
      } else {
        playNextInternal();
      }
    };
    const handleError = (e: Event) => {
      const err = (e.target as HTMLAudioElement).error;
      console.error('Audio error:', err?.message || err?.code);
      setIsPlaying(false);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [playNextInternal]); // Only re-attach if playNextInternal changes



  // Update EQ filters when values change
  const updateAudioFilters = useCallback(() => {
    if (!audioContextRef.current) return;
    const bypass = !eqEnabled;
    filtersRef.current.forEach((f, i) => { f.gain.value = bypass ? 0 : eqBands[i]; });
    if (bassFilterRef.current) {
      bassFilterRef.current.gain.value = bypass ? 0 : (bassBoost / 100) * 10;
    }
  }, [eqEnabled, eqBands, bassBoost]);

  useEffect(() => { updateAudioFilters(); }, [updateAudioFilters]);

  // Handle shuffle state
  useEffect(() => {
    if (!currentSong) return;
    if (isShuffle) {
      const remaining = queue.filter(s => s.id !== currentSong.id);
      const shuffled = [...remaining].sort(() => Math.random() - 0.5);
      const newActive = [currentSong, ...shuffled];
      setActiveQueue(newActive);
      activeQueueRef.current = newActive;
    } else {
      setActiveQueue(queue);
      activeQueueRef.current = queue;
    }
  }, [isShuffle, queue]); // eslint-disable-line react-hooks/exhaustive-deps

  // Public API: playSong
  const playSong = useCallback(async (song: Song, newQueue?: Song[]) => {
    // Auto-initialize Web Audio on first play to prevent any routing glitches later
    if (!webAudioInitialized.current) {
      initWebAudio();
    }
    // Resume AudioContext if it was suspended (browser autoplay policy)
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    await playSongInternal(song, newQueue);
  }, [playSongInternal, initWebAudio]);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!currentSongRef.current) return;

    if (!webAudioInitialized.current) {
      initWebAudio();
    }
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (audio.paused) {
      audio.play().catch(e => console.error('Play error:', e));
    } else {
      audio.pause();
    }
  }, [initWebAudio]);

  const seekTo = useCallback((time: number) => {
    const audio = audioRef.current;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const setVolume = useCallback((vol: number) => {
    const safeVol = Math.max(0, Math.min(1, vol));
    setVolumeState(safeVol);
    audioRef.current.volume = safeVol;
  }, []);

  const playNext = useCallback(() => {
    playNextInternal();
  }, [playNextInternal]);

  const playPrevious = useCallback(() => {
    const queue = activeQueueRef.current;
    const song = currentSongRef.current;
    if (!queue.length || !song) return;

    if (currentTimeRef.current > 3) {
      seekTo(0);
      return;
    }

    const idx = queue.findIndex(s => s.id === song.id);
    let prevIdx = idx - 1;
    if (prevIdx < 0) {
      prevIdx = repeatModeRef.current === 'queue' ? queue.length - 1 : 0;
    }
    playSongInternal(queue[prevIdx]);
  }, [seekTo, playSongInternal]);

  const toggleShuffle = useCallback(() => { setIsShuffle(prev => !prev); }, []);

  const toggleRepeatMode = useCallback(() => {
    setRepeatMode(prev => {
      const next = prev === 'none' ? 'queue' : prev === 'queue' ? 'song' : 'none';
      repeatModeRef.current = next;
      return next;
    });
  }, []);

  const removeFromQueue = useCallback((songId: string) => {
    setQueue(prev => {
      const updated = prev.filter(s => s.id !== songId);
      activeQueueRef.current = updated;
      if (currentSongRef.current?.id === songId) {
        if (updated.length > 0) {
          playSongInternal(updated[0]);
        } else {
          setCurrentSong(null);
          currentSongRef.current = null;
          setIsPlaying(false);
          audioRef.current.src = '';
        }
      }
      return updated;
    });
  }, [playSongInternal]);

  const addToQueue = useCallback((song: Song) => {
    setQueue(prev => {
      if (prev.some(s => s.id === song.id)) return prev;
      return [...prev, song];
    });
  }, []);

  const clearQueue = useCallback(() => {
    audioRef.current.pause();
    audioRef.current.src = '';
    setQueue([]);
    setActiveQueue([]);
    activeQueueRef.current = [];
    setCurrentSong(null);
    currentSongRef.current = null;
    setIsPlaying(false);
  }, []);

  // EQ controls
  const setEqEnabled = useCallback((enabled: boolean) => {
    if (enabled && !webAudioInitialized.current) {
      initWebAudio();
    }
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    setEqEnabledState(enabled);
  }, [initWebAudio]);

  const setEqBand = useCallback((index: number, gain: number) => {
    setEqBands(prev => {
      const updated = [...prev];
      updated[index] = Math.max(-12, Math.min(12, gain));
      return updated;
    });
    setPreset('Custom');
  }, []);

  const setBassBoost = useCallback((value: number) => {
    setBassBoostState(Math.max(0, Math.min(100, value)));
  }, []);

  const applyPreset = useCallback((presetName: string) => {
    const values = PRESETS[presetName];
    if (values) {
      setEqBands([...values]);
      setPreset(presetName);
    }
  }, []);

  return (
    <AudioPlayContext.Provider
      value={{
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,
        queue,
        activeQueue,
        isShuffle,
        repeatMode,
        isResolvingUrl,
        playSong,
        togglePlayPause,
        seekTo,
        setVolume,
        playNext,
        playPrevious,
        toggleShuffle,
        toggleRepeatMode,
        removeFromQueue,
        addToQueue,
        clearQueue,
        eqEnabled,
        setEqEnabled,
        eqBands,
        setEqBand,
        bassBoost,
        setBassBoost,
        preset,
        applyPreset
      }}
    >
      {children}
    </AudioPlayContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioPlayContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
