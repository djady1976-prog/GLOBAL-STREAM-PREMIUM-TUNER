/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Search,
  Heart,
  Play,
  Pause,
  Square,
  Languages,
  RotateCcw,
  Power,
  Loader2,
  Activity,
  Check,
  ExternalLink,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Sliders,
  Globe,
  Tag
} from 'lucide-react';

import {
  Language,
  ThemeId,
  ThemeConfig,
  RadioStation,
  UserSettings,
  THEMES,
  TRANSLATIONS,
  EQ_FREQUENCIES,
  EQ_PRESETS
} from './types';

import { CURATED_STATIONS } from './stations';
import VolumeKnob from './components/VolumeKnob';
import AudioEqualizer from './components/AudioEqualizer';
import AudioVisualizer from './components/AudioVisualizer';
import WindowsSetup from './components/WindowsSetup';
import AboutModal from './components/AboutModal';
import RadioRadar from './components/RadioRadar';
import HardwareVUMeter from './components/HardwareVUMeter';

export default function App() {
  // ----------------------------------------------------
  // LOCAL PERSISTENCE STORAGE CONTROLS
  // ----------------------------------------------------
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const persisted = localStorage.getItem('global_stream_radio_settings_v1');
      if (persisted) {
        const parsed = JSON.parse(persisted);
        return {
          language: parsed.language || 'ro',
          theme: parsed.theme || 'matrix',
          volume: parsed.volume !== undefined ? parsed.volume : 0.8,
          favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
          eqWeights: Array.isArray(parsed.eqWeights) ? parsed.eqWeights : [0, 0, 0, 0, 0, 0, 0],
          activeEqPreset: parsed.activeEqPreset || 'flat',
          visualizerMode: parsed.visualizerMode || 'led',
        };
      }
    } catch (e) {
      console.warn('Could not read user settings, defaulting.', e);
    }
    return {
      language: 'ro',
      theme: 'matrix',
      volume: 0.8,
      favorites: ['ro_kissfm', 'it_radioitalia', 'int_cafedelmar', 'int_groovesalad'],
      eqWeights: [0, 0, 0, 0, 0, 0, 0],
      activeEqPreset: 'flat',
      visualizerMode: 'led',
    };
  });

  // Sync settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('global_stream_radio_settings_v1', JSON.stringify(settings));
  }, [settings]);

  // Translate labels dynamically depending on active locale
  const locale = TRANSLATIONS[settings.language] || TRANSLATIONS.en;
  const activeTheme = THEMES.find((t) => t.id === settings.theme) || THEMES[0];

  // ----------------------------------------------------
  // APP STATES
  // ----------------------------------------------------
  const [selectedStation, setSelectedStation] = useState<RadioStation>(CURATED_STATIONS[0]);
  const [playbackState, setPlaybackState] = useState<'stopped' | 'connecting' | 'buffering' | 'playing' | 'error'>('stopped');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<'name' | 'country' | 'tag'>('name');
  const [searchResults, setSearchResults] = useState<RadioStation[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [activeTab, setActiveTab] = useState<'recommended' | 'all' | 'favorites' | 'search'>('recommended');
  
  // Custom dialog toggles
  const [showWindowsGuide, setShowWindowsGuide] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  // Audio system status states
  const [isSimulated, setIsSimulated] = useState(false);
  const [signalStrength, setSignalStrength] = useState(100);
  const [playDuration, setPlayDuration] = useState(0);
  const [analyserStateNode, setAnalyserStateNode] = useState<AnalyserNode | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // New tactile physical features state
  const [sleepTimeLeft, setSleepTimeLeft] = useState<number | null>(null);
  const [isStereoWide, setIsStereoWide] = useState(true);

  // ----------------------------------------------------
  // WEB AUDIO & AUDIO GRAPH REF POINTERS
  // ----------------------------------------------------
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCorsRef = useRef<HTMLAudioElement | null>(null);
  const audioDirectRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const audioCleanupRef = useRef<(() => void) | null>(null);

  // Refs for custom physical features
  const sleepTimerRef = useRef<any>(null);
  const staticNoiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const staticNoiseGainRef = useRef<GainNode | null>(null);
  const delayRNodeRef = useRef<DelayNode | null>(null);

  // Refs for tracking active station and state, avoiding stale closures in on-mount audio listeners
  const selectedStationRef = useRef<RadioStation>(selectedStation);
  const playbackStateRef = useRef<'stopped' | 'connecting' | 'buffering' | 'playing' | 'error'>(playbackState);
  const retryStreamWithoutCorsRef = useRef<(url?: string) => void>(() => {});

  // Sync state values directly to mutable refs on every state change
  useEffect(() => {
    selectedStationRef.current = selectedStation;
  }, [selectedStation]);

  useEffect(() => {
    playbackStateRef.current = playbackState;
  }, [playbackState]);

  useEffect(() => {
    retryStreamWithoutCorsRef.current = retryStreamWithoutCors;
  });

  // 1-second dynamic ping / signal strength noise mock to look premium and alive
  useEffect(() => {
    const signalInterval = setInterval(() => {
      if (playbackState === 'playing') {
        // Vary slightly between 96% and 100% to represent crystal clear RDS tuning
        setSignalStrength(Math.floor(Math.random() * 5) + 96);
      } else if (playbackState === 'connecting' || playbackState === 'buffering') {
        setSignalStrength(Math.floor(Math.random() * 30) + 40);
      } else {
        setSignalStrength(0);
      }
    }, 1200);

    return () => clearInterval(signalInterval);
  }, [playbackState]);

  // Keep track of active stream play duration
  useEffect(() => {
    if (playbackState === 'playing') {
      durationTimerRef.current = setInterval(() => {
        setPlayDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      if (playbackState === 'stopped') {
        setPlayDuration(0);
      }
    }

    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [playbackState]);

  // Clean initialization of native HTMLAudioElement references on mount
  useEffect(() => {
    // Lazy initialized when streaming starts to prevent potential autoplay blockages
    return () => {
      if (audioCorsRef.current) {
        audioCorsRef.current.pause();
        audioCorsRef.current.src = '';
      }
      if (audioDirectRef.current) {
        audioDirectRef.current.pause();
        audioDirectRef.current.src = '';
      }
    };
  }, []);

  // Sync Volume immediately to HTMLAudioElement instances and FM static noise
  useEffect(() => {
    if (audioCorsRef.current) {
      audioCorsRef.current.volume = settings.volume;
    }
    if (audioDirectRef.current) {
      audioDirectRef.current.volume = settings.volume;
    }
    if (staticNoiseGainRef.current && audioContextRef.current) {
      staticNoiseGainRef.current.gain.setValueAtTime(0.06 * settings.volume, audioContextRef.current.currentTime);
    }
  }, [settings.volume]);

  // Sleep Timer Tick Countdown Effect
  useEffect(() => {
    if (sleepTimeLeft !== null && sleepTimeLeft > 0) {
      sleepTimerRef.current = setTimeout(() => {
        setSleepTimeLeft((prev) => {
          if (prev !== null && prev <= 1) {
            handleStop();
            return null;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
    } else {
      if (sleepTimerRef.current) {
        clearTimeout(sleepTimerRef.current);
        sleepTimerRef.current = null;
      }
    }
    return () => {
      if (sleepTimerRef.current) {
        clearTimeout(sleepTimerRef.current);
      }
    };
  }, [sleepTimeLeft]);

  // Dynamic Stereo/Mono Haas Delay Update Effect
  useEffect(() => {
    if (delayRNodeRef.current && audioContextRef.current) {
      const targetDelay = isStereoWide ? 0.018 : 0.0;
      delayRNodeRef.current.delayTime.setValueAtTime(targetDelay, audioContextRef.current.currentTime);
    }
  }, [isStereoWide]);

  // FM Static Noise Play/Fade controller helpers
  const playFMStaticNoise = () => {
    const ctx = audioContextRef.current;
    if (!ctx || ctx.state === 'closed') return;

    if (staticNoiseSourceRef.current) {
      if (staticNoiseGainRef.current) {
        staticNoiseGainRef.current.gain.setValueAtTime(staticNoiseGainRef.current.gain.value, ctx.currentTime);
        staticNoiseGainRef.current.gain.linearRampToValueAtTime(0.06 * settings.volume, ctx.currentTime + 0.3);
      }
      return;
    }

    try {
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.001, ctx.currentTime);
      noiseGain.gain.linearRampToValueAtTime(0.06 * settings.volume, ctx.currentTime + 0.4);

      noiseSource.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseSource.start();

      staticNoiseSourceRef.current = noiseSource;
      staticNoiseGainRef.current = noiseGain;
    } catch (err) {
      console.warn('Could not launch FM static noise synthesis:', err);
    }
  };

  const fadeOutFMStaticNoise = () => {
    const ctx = audioContextRef.current;
    const gainNode = staticNoiseGainRef.current;
    const sourceNode = staticNoiseSourceRef.current;

    if (ctx && gainNode && sourceNode) {
      try {
        gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.6);
        
        setTimeout(() => {
          try {
            if (staticNoiseSourceRef.current === sourceNode) {
              sourceNode.stop();
              sourceNode.disconnect();
              staticNoiseSourceRef.current = null;
              staticNoiseGainRef.current = null;
            }
          } catch (e) {}
        }, 700);
      } catch (err) {
        console.warn('Error fading out static FM hiss:', err);
      }
    }
  };

  const stopFMStaticNoise = () => {
    if (staticNoiseSourceRef.current) {
      try {
        staticNoiseSourceRef.current.stop();
        staticNoiseSourceRef.current.disconnect();
      } catch (e) {}
      staticNoiseSourceRef.current = null;
      staticNoiseGainRef.current = null;
    }
  };

  // FM Static Noise Trigger Effect
  useEffect(() => {
    if (playbackState === 'connecting' || playbackState === 'buffering') {
      if (audioRef.current) {
        try {
          initAudioGraph(audioRef.current);
        } catch (e) {}
      }
      playFMStaticNoise();
    } else if (playbackState === 'playing') {
      fadeOutFMStaticNoise();
    } else {
      stopFMStaticNoise();
    }
  }, [playbackState]);

  // ----------------------------------------------------
  // WEB AUDIO GRAPH FABRICATOR
  // ----------------------------------------------------
  const initAudioGraph = (audioElement: HTMLAudioElement) => {
    if (audioContextRef.current) {
      // Connect newly created audio element to existing equalizer chain
      try {
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().catch(console.warn);
        }

        // Check if this audio element was already linked to a MediaElementSourceNode
        if ((audioElement as any)._hasSourceNode) {
          setAnalyserStateNode(analyserNodeRef.current);
          setIsSimulated(false);
          return;
        }

        // Cleanly disconnect old media source link from filters to avoid ghost nodes
        if (sourceNodeRef.current) {
          try {
            sourceNodeRef.current.disconnect();
          } catch (e) {
            // Ignore
          }
        }

        const source = audioContextRef.current.createMediaElementSource(audioElement);
        (audioElement as any)._hasSourceNode = true;
        sourceNodeRef.current = source;
        if (filtersRef.current.length > 0) {
          source.connect(filtersRef.current[0]);
        }
        setAnalyserStateNode(analyserNodeRef.current);
        setIsSimulated(false);
      } catch (err) {
        console.warn('Could not plug audio element to existing audio graph:', err);
        setIsSimulated(true);
      }
      return;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      // Configure latencyHint as 'playback' to request optimized, larger audio buffer alignments
      const ctx = new AudioCtxClass({ latencyHint: 'playback' });
      audioContextRef.current = ctx;

      if (ctx.state === 'suspended') {
        ctx.resume().catch(console.warn);
      }

      // 1. Build Analyser
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128; // compact power of 2 (64 frequency bounds) for real-time performance
      analyser.smoothingTimeConstant = 0.85;
      analyserNodeRef.current = analyser;
      setAnalyserStateNode(analyser);

      // 2. Build 7-Band Equalizer cascade filters
      const filterNodes = EQ_FREQUENCIES.map((freq, i) => {
        const filter = ctx.createBiquadFilter();
        if (i === 0) {
          filter.type = 'lowshelf';
        } else if (i === EQ_FREQUENCIES.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
        }
        filter.frequency.setValueAtTime(freq, ctx.currentTime);
        filter.Q.setValueAtTime(1.0, ctx.currentTime);
        filter.gain.setValueAtTime(settings.eqWeights[i], ctx.currentTime);
        return filter;
      });
      filtersRef.current = filterNodes;

      // 3. Connect Media Source
      const source = ctx.createMediaElementSource(audioElement);
      (audioElement as any)._hasSourceNode = true;
      sourceNodeRef.current = source;

      // Connect source -> filter 1 -> filter 2 -> ... -> filter 7 -> Haas Stereo Delay -> analyser -> output
      let lastNode: AudioNode = source;
      filterNodes.forEach((filter) => {
        lastNode.connect(filter);
        lastNode = filter;
      });

      try {
        const splitter = ctx.createChannelSplitter(2);
        const merger = ctx.createChannelMerger(2);
        const delayR = ctx.createDelay();
        delayRNodeRef.current = delayR;
        delayR.delayTime.value = isStereoWide ? 0.018 : 0.0;

        lastNode.connect(splitter);
        splitter.connect(merger, 0, 0); // Left direct to left merger
        splitter.connect(delayR, 1, 0); // Right direct to delay R
        delayR.connect(merger, 0, 1);   // Delayed R to right merger

        merger.connect(analyser);
      } catch (haasErr) {
        console.warn('Haas spatial delay build failed, using fallback connection:', haasErr);
        lastNode.connect(analyser);
      }

      analyser.connect(ctx.destination);

      setIsSimulated(false);
    } catch (err) {
      console.warn('Failed to build Web Audio Context. Defaulting to safe simulation overlay.', err);
      setIsSimulated(true);
    }
  };

  // Sync active equalizer weights into hardware Biquad Filters
  useEffect(() => {
    if (audioContextRef.current && filtersRef.current.length > 0) {
      filtersRef.current.forEach((filter, idx) => {
        filter.gain.setValueAtTime(settings.eqWeights[idx], audioContextRef.current!.currentTime);
      });
    }
  }, [settings.eqWeights]);

  // ----------------------------------------------------
  // STREAM INGRESS CONTROLS
  // ----------------------------------------------------
  const handleSelectStation = (station: RadioStation) => {
    selectedStationRef.current = station; // update immediately to satisfy synchronous callbacks
    setSelectedStation(station);
    setPlayDuration(0);
    tuneToStream(station.url);
  };

  const tuneToStream = (streamUrl: string, forceNoCors = false, attempt = 1) => {
    playbackStateRef.current = 'connecting';
    setPlaybackState('connecting');
    setIsSimulated(false);

    // Initialize Web Audio context immediately on click to avoid user-interaction lock blocks
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(console.warn);
    }

    let finalUrl = streamUrl;
    let actualForceNoCors = forceNoCors;

    if (attempt === 1 && !forceNoCors) {
      finalUrl = `/api/proxy-stream?url=${encodeURIComponent(streamUrl)}`;
      actualForceNoCors = false;
      console.log('[STAGE 1 TUNING] Connecting stream via Proxy:', finalUrl);
    } else if (attempt === 2) {
      // Stage 2: Retry via proxy with timestamp cache-buster
      finalUrl = `/api/proxy-stream?url=${encodeURIComponent(streamUrl)}&_t=${Date.now()}`;
      actualForceNoCors = false;
      console.log('[STAGE 2 TUNING] Retrying stream via Proxy with cache-buster:', finalUrl);
    } else {
      // Stage 3: Direct URL fallback if HTTPS
      finalUrl = streamUrl;
      actualForceNoCors = true;
      console.log('[STAGE 3 TUNING] Trying direct stream connection:', finalUrl);
    }

    const useCors = !actualForceNoCors;

    // 1. Clean up old event listeners from previous session
    if (audioCleanupRef.current) {
      try {
        audioCleanupRef.current();
      } catch (e) {
        console.warn('Error during previous audio listeners cleanup:', e);
      }
      audioCleanupRef.current = null;
    }

    // 2. Shut down and reset active elements
    if (audioCorsRef.current) {
      try {
        audioCorsRef.current.pause();
        audioCorsRef.current.removeAttribute('src');
        audioCorsRef.current.load();
      } catch (e) {
        console.warn('Error resetting CORS element:', e);
      }
    }
    if (audioDirectRef.current) {
      try {
        audioDirectRef.current.pause();
        audioDirectRef.current.removeAttribute('src');
        audioDirectRef.current.load();
      } catch (e) {
        console.warn('Error resetting direct element:', e);
      }
    }

    // Allocate current audio player accordingly based on CORS needs
    let audio: HTMLAudioElement;
    if (useCors) {
      if (!audioCorsRef.current) {
        audioCorsRef.current = new Audio();
      }
      audio = audioCorsRef.current;
      audio.crossOrigin = 'anonymous';
    } else {
      if (!audioDirectRef.current) {
        audioDirectRef.current = new Audio();
      }
      audio = audioDirectRef.current;
      audio.removeAttribute('crossOrigin');
      setIsSimulated(true);
    }

    // Assign reference so secondary handlers track the active player
    audioRef.current = audio;
    audio.preload = 'auto';
    audio.volume = settings.volume;

    // 3. Attach event listeners
    const onWaiting = () => setPlaybackState('buffering');
    const onPlaying = () => {
      setPlaybackState('playing');
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(console.warn);
      }
    };
    const onEnded = () => setPlaybackState('stopped');

    const handlePlayFailure = (err: any) => {
      if (
        err.name === 'AbortError' ||
        (err.message && err.message.toLowerCase().includes('pause')) ||
        (err.message && err.message.toLowerCase().includes('interrupted'))
      ) {
        return;
      }
      console.warn(`[PLAY FAILURE] Attempt ${attempt} failed:`, err.message || err);
      if (attempt < 3) {
        setTimeout(() => tuneToStream(streamUrl, false, attempt + 1), 200);
      } else {
        setPlaybackState('error');
      }
    };

    const onError = (e: Event) => {
      if (playbackStateRef.current === 'stopped') {
        return;
      }
      console.warn(`[AUDIO ERROR] Stream error on attempt ${attempt}:`, e);
      if (attempt < 3) {
        setTimeout(() => tuneToStream(streamUrl, false, attempt + 1), 200);
      } else {
        setPlaybackState('error');
      }
    };

    const onCanPlay = () => {
      if (audio.paused && playbackStateRef.current === 'connecting') {
        audio.play().catch(handlePlayFailure);
      }
    };

    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);

    audioCleanupRef.current = () => {
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
    };

    // 4. Connect Web Audio graph ONLY if useCors is true
    if (useCors) {
      try {
        initAudioGraph(audio);
      } catch (err) {
        console.warn('Failed to link audio to graph, switching to safe simulated mode', err);
        setIsSimulated(true);
      }
    }

    // 5. Request Stream Load & Play
    try {
      audio.src = finalUrl;
      audio.load();
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setPlaybackState('playing');
        }).catch(handlePlayFailure);
      }
    } catch (e) {
      console.warn('Audio play crashed. Fallback triggered:', e);
      if (attempt < 3) {
        tuneToStream(streamUrl, false, attempt + 1);
      } else {
        setPlaybackState('error');
      }
    }
  };

  const retryStreamWithoutCors = (url?: string) => {
    const targetUrl = url || selectedStationRef.current.url;
    tuneToStream(targetUrl, true);
  };

  const handleTogglePlay = () => {
    if (!audioRef.current) return;

    if (playbackState === 'playing' || playbackState === 'buffering' || playbackState === 'connecting') {
      playbackStateRef.current = 'stopped';
      try {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current.load();
      } catch (err) {
        console.warn('Error pausing stream:', err);
      }
      setPlaybackState('stopped');
    } else {
      tuneToStream(selectedStation.url);
    }
  };

  const handleStop = () => {
    playbackStateRef.current = 'stopped';
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current.load();
      } catch (err) {
        console.warn('Error stopping stream:', err);
      }
    }
    setPlaybackState('stopped');
    setPlayDuration(0);
  };

  // Prev / Next station dial tuner
  const handleNavStation = (direction: 'next' | 'prev') => {
    const list = getActiveStationList();
    if (list.length === 0) return;
    const currentIdx = list.findIndex((s) => s.id === selectedStation.id);
    let nextIdx = 0;

    if (direction === 'next') {
      nextIdx = currentIdx + 1 >= list.length ? 0 : currentIdx + 1;
    } else {
      nextIdx = currentIdx - 1 < 0 ? list.length - 1 : currentIdx - 1;
    }

    handleSelectStation(list[nextIdx]);
  };

  const getActiveStationList = () => {
    if (activeTab === 'recommended') return CURATED_STATIONS;
    if (activeTab === 'favorites') {
      return CURATED_STATIONS.concat(searchResults).filter((s) => settings.favorites.includes(s.id));
    }
    if (activeTab === 'search') return searchResults;
    
    // For "All Stations", merge curated and searches cleanly
    const unique = new Map<string, RadioStation>();
    CURATED_STATIONS.forEach(s => unique.set(s.id, s));
    searchResults.forEach(s => unique.set(s.id, s));
    return Array.from(unique.values());
  };

  // ----------------------------------------------------
  // GLOBAL SEARCH ENGINE (RADIO BROWSER WIRE)
  // ----------------------------------------------------
  const handleCountryQuickSearch = async (countryName: string) => {
    setSearchFilter('country');
    setSearchQuery(countryName);
    setLoadingSearch(true);
    setSearchResults([]);
    setActiveTab('search');

    // Query standard load-balanced instances of Radio Browser API
    const endpoints = [
      'https://de1.api.radio-browser.info/json/stations/search',
      'https://at1.api.radio-browser.info/json/stations/search',
      'https://nl1.api.radio-browser.info/json/stations/search'
    ];

    let success = false;
    for (const endpoint of endpoints) {
      if (success) break;
      try {
        const queryParams = new URLSearchParams({
          limit: '60',
          order: 'votes',
          reverse: 'true',
          hidebroken: 'true',
          country: countryName
        });

        const res = await fetch(`${endpoint}?${queryParams.toString()}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'GlobalStreamHiFiRadio/1.0'
          }
        });

        if (!res.ok) continue;

        const data = await res.json();
        if (Array.isArray(data)) {
          const formatted: RadioStation[] = data
            .filter((item: any) => item.url_resolved && item.name)
            .map((item: any) => ({
              id: `api_${item.stationuuid}`,
              name: item.name.trim(),
              url: item.url_resolved,
              country: item.country ? item.country : 'Unknown',
              language: item.language ? item.language : 'Unknown',
              tags: item.tags ? item.tags.split(',').slice(0, 4).map((t: string) => t.trim()).filter(Boolean) : [],
              bitrate: item.bitrate || 128,
              format: item.codec || 'MP3',
              votes: item.votes || 0,
              homepage: item.homepage || '',
            }));

          setSearchResults(formatted);
          success = true;
        }
      } catch (err) {
        console.warn('Radio Browser quick country selection point failed, trying next node...', err);
      }
    }

    setLoadingSearch(false);
  };

  const triggerGlobalSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoadingSearch(true);
    setSearchResults([]);
    setActiveTab('search');

    // Query standard load-balanced instances of Radio Browser API
    const endpoints = [
      'https://de1.api.radio-browser.info/json/stations/search',
      'https://at1.api.radio-browser.info/json/stations/search',
      'https://nl1.api.radio-browser.info/json/stations/search'
    ];

    let success = false;
    // Iterate over available cluster points to guarantee results
    for (const endpoint of endpoints) {
      if (success) break;
      try {
        const queryParams = new URLSearchParams({
          limit: '60',
          order: 'votes',
          reverse: 'true',
          hidebroken: 'true',
        });

        if (searchFilter === 'name') {
          queryParams.append('name', searchQuery);
        } else if (searchFilter === 'country') {
          queryParams.append('country', searchQuery);
        } else if (searchFilter === 'tag') {
          queryParams.append('tag', searchQuery);
        }

        const res = await fetch(`${endpoint}?${queryParams.toString()}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'GlobalStreamHiFiRadio/1.0'
          }
        });

        if (!res.ok) continue;

        const data = await res.json();
        if (Array.isArray(data)) {
          // Parse response cleanly to RadioStation type
          const formatted: RadioStation[] = data
            .filter((item: any) => item.url_resolved && item.name)
            .map((item: any) => ({
              id: item.stationuuid || String(Math.random()),
              name: item.name.trim(),
              url: item.url_resolved,
              country: item.country || 'Global Stream',
              language: item.language || 'International',
              tags: item.tags ? item.tags.split(',').slice(0, 4).map((t: string) => t.trim()).filter(Boolean) : [],
              bitrate: item.bitrate || 128,
              format: item.codec || 'MP3',
              votes: item.votes || 0,
              homepage: item.homepage || '',
            }));

          setSearchResults(formatted);
          success = true;
        }
      } catch (err) {
        console.warn(`Query cluster point ${endpoint} failed. Trying next...`, err);
      }
    }

    setLoadingSearch(false);
  };

  // Trigger search on keyboard 'Enter'
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      triggerGlobalSearch();
    }
  };

  // ----------------------------------------------------
  // EQUALIZER CALIBRATORS
  // ----------------------------------------------------
  const handleBandGainChange = (bandIndex: number, newValue: number) => {
    setSettings((prev) => {
      const updatedWeights = [...prev.eqWeights];
      updatedWeights[bandIndex] = newValue;
      return {
        ...prev,
        eqWeights: updatedWeights,
        activeEqPreset: 'custom',
      };
    });
  };

  const handleSelectEqPreset = (presetId: string) => {
    const preset = EQ_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setSettings((prev) => ({
        ...prev,
        eqWeights: [...preset.gains],
        activeEqPreset: presetId,
      }));
    }
  };

  // ----------------------------------------------------
  // FAVORITES ACCUMULATION
  // ----------------------------------------------------
  const handleToggleFavorite = (stationId: string) => {
    setSettings((prev) => {
      const isFav = prev.favorites.includes(stationId);
      const updated = isFav
        ? prev.favorites.filter((id) => id !== stationId)
        : [...prev.favorites, stationId];
      return { ...prev, favorites: updated };
    });
  };

  // ----------------------------------------------------
  // CUSTOM SETTINGS EXPORT / IMPORT ENGINE
  // ----------------------------------------------------
  const handleImportSettings = (imported: Partial<UserSettings>) => {
    setSettings((prev) => ({
      ...prev,
      language: imported.language || prev.language,
      theme: imported.theme || prev.theme,
      volume: imported.volume !== undefined ? imported.volume : prev.volume,
      favorites: Array.isArray(imported.favorites) ? imported.favorites : prev.favorites,
      eqWeights: Array.isArray(imported.eqWeights) ? imported.eqWeights : prev.eqWeights,
      activeEqPreset: imported.activeEqPreset || prev.activeEqPreset,
    }));
  };

  // Format dynamic clocks / time strings
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`min-h-screen ${activeTheme.bg} text-slate-100 flex flex-col justify-between transition-all duration-500 overflow-x-hidden`}
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* ----------------------------------------------------
          APPLICATION HEADER WITH SPECTRUM LIGHT BAR ACCENT
          ---------------------------------------------------- */}
      <header
        className="border-b bg-black/45 backdrop-blur-md relative z-40"
        style={{ borderColor: activeTheme.accentHex + '25' }}
      >
        {/* Glow neon horizontal line */}
        <div
          className="h-[3px] w-full transition-all duration-500"
          style={{
            backgroundColor: activeTheme.accentHex,
            boxShadow: `0 0 12px ${activeTheme.glowColor}`
          }}
        />

        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Audio Brand Logotype block */}
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border flex items-center justify-center relative transition-all duration-300 ${activeTheme.accentBg}`}
              style={{ borderColor: activeTheme.accentHex + '33' }}
            >
              <Radio
                size={22}
                className={playbackState === 'playing' ? 'animate-bounce' : 'animate-pulse'}
                style={{ color: activeTheme.accentHex }}
              />
            </div>
            
            <div className="flex flex-col">
              <h1 className="font-mono text-sm font-black tracking-widest text-white leading-none">
                {locale.appTitle}
              </h1>
              <span className="font-mono text-[9px] text-stone-500 tracking-wider">
                {locale.deckTitle} • STEREO DIGITAL PROCESSOR
              </span>
            </div>
          </div>

          {/* Quick Header Tools List */}
          <div className="flex flex-wrap items-center gap-3.5 justify-center md:justify-end" id="header-tools">
            
            {/* Lang toggle list */}
            <div className="flex items-center gap-1.5 bg-black/40 border border-stone-800 rounded-lg p-1">
              <button
                onClick={() => setSettings((p) => ({ ...p, language: 'ro' }))}
                className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded cursor-pointer transition-all duration-200 ${
                  settings.language === 'ro' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
                style={{ backgroundColor: settings.language === 'ro' ? activeTheme.accentHex + '25' : '' }}
              >
                RO
              </button>
              <button
                onClick={() => setSettings((p) => ({ ...p, language: 'it' }))}
                className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded cursor-pointer transition-all duration-200 ${
                  settings.language === 'it' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
                style={{ backgroundColor: settings.language === 'it' ? activeTheme.accentHex + '25' : '' }}
              >
                IT
              </button>
              <button
                onClick={() => setSettings((p) => ({ ...p, language: 'en' }))}
                className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded cursor-pointer transition-all duration-200 ${
                  settings.language === 'en' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
                style={{ backgroundColor: settings.language === 'en' ? activeTheme.accentHex + '25' : '' }}
              >
                EN
              </button>
            </div>

            {/* Config theme selection menu switcher */}
            <div className="flex items-center gap-1">
              <select
                value={settings.theme}
                onChange={(e) => setSettings((p) => ({ ...p, theme: e.target.value as ThemeId }))}
                className="bg-black/60 border border-stone-850 rounded-lg py-1 px-2.5 text-xxs font-mono text-slate-300 font-bold focus:outline-hidden cursor-pointer"
                style={{ borderColor: activeTheme.accentHex + '33' }}
              >
                {THEMES.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name[settings.language] || theme.name.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Easy install Windows guide trigger */}
            <button
              onClick={() => setShowWindowsGuide(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-stone-900 border border-stone-850 rounded-lg text-xxs font-mono hover:bg-stone-800 transition-colors duration-250 cursor-pointer"
            >
              <HelpCircle size={12} style={{ color: activeTheme.accentHex }} />
              <span className="text-slate-300 font-bold">SETUP WIN 10/11</span>
            </button>

            {/* About popup trigger */}
            <button
              onClick={() => setShowAbout(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-stone-900 border border-stone-850 rounded-lg text-xxs font-mono hover:bg-stone-800 transition-colors duration-250 cursor-pointer"
            >
              <Sparkles size={12} style={{ color: activeTheme.accentHex }} />
              <span className="text-slate-300 font-bold">ABOUT</span>
            </button>

          </div>
        </div>
      </header>

      {/* ----------------------------------------------------
          APPLICATION CHASSIS & GRID WORKSPACE
          ---------------------------------------------------- */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-5 lg:p-7 grid grid-cols-1 lg:grid-cols-12 gap-5 z-25">
        
        {/* LEFT COLUMN: RECEIVER DIAGNOSTICS & ANALYZERS (GRID SPAN L-7) */}
        <section className="lg:col-span-7 flex flex-col gap-5">
          
          {/* DIGITAL TUNER & PLAYBACK FEED SPECS DECK */}
          <div
            className="rounded-2xl border bg-black/70 backdrop-blur-md shadow-xl shadow-black/40 p-5 relative overflow-auto flex flex-col gap-4 resize min-h-[220px] min-w-[280px]"
            style={{ borderColor: activeTheme.accentHex + '25' }}
            id="station-card-module"
          >
            {/* Real aesthetic design: top corner glass reflection details */}
            <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none bg-linear-to-bl from-white/5 to-transparent" />

            {/* Active digital parameter stats strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 bg-black/90 p-3 rounded-xl border border-stone-900/60 font-mono text-[10px]">
              <div className="space-y-0.5">
                <span className="text-stone-500 uppercase font-black text-[9px] tracking-widest">{locale.signalLock}</span>
                <div className="flex items-center gap-1 text-[11px] font-bold" style={{ color: activeTheme.accentHex }}>
                  <span className="h-1.5 w-1.5 rounded-full inline-block animate-pulse bg-emerald-500" style={{ backgroundColor: activeTheme.accentHex }} />
                  <span>{playbackState === 'playing' ? 'LOCK ACTIVE' : playbackState === 'connecting' || playbackState === 'buffering' ? 'ACQUIRING...' : 'DISENGAGED'}</span>
                </div>
              </div>
              <div className="space-y-0.5 border-l border-stone-900 pl-3">
                <span className="text-stone-500 uppercase font-black text-[9px] tracking-widest">{locale.bitrate}</span>
                <p className="text-slate-200 font-black text-[11px]">
                  {selectedStation.bitrate > 0 ? `${selectedStation.bitrate} kbps` : '128 kbps'}
                </p>
              </div>
              <div className="space-y-0.5 border-l border-stone-900 pl-3">
                <span className="text-stone-500 uppercase font-black text-[9px] tracking-widest">{locale.signalStrength}</span>
                <p className="text-slate-205 font-black text-[11px]" style={{ color: playbackState === 'playing' ? activeTheme.accentHex : '' }}>
                  {signalStrength > 0 ? `${signalStrength}%` : '0%'}
                </p>
              </div>
              <div className="space-y-0.5 border-l border-stone-900 pl-3">
                <span className="text-stone-500 uppercase font-black text-[9px] tracking-widest">TUNED DURATION</span>
                <p className="text-slate-200 font-bold font-mono text-[11px]">
                  {formatTime(playDuration)}
                </p>
              </div>
            </div>

            {/* Selected Station Title metadata segment */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-1.5">
              
              {/* Logo / Genre / Name strip */}
              <div className="flex items-center gap-4 w-full md:w-auto">
                {/* Glowing LED status point */}
                <div
                  className="w-14 h-14 rounded-2xl bg-stone-950 border-2 flex items-center justify-center shrink-0 shadow-inner relative"
                  style={{
                    borderColor: playbackState === 'playing' ? activeTheme.accentHex : '#2e2e2e',
                    boxShadow: playbackState === 'playing' ? `0 0 10px ${activeTheme.glowColor}25` : 'none'
                  }}
                >
                  <Radio
                    size={24}
                    className={playbackState === 'playing' ? 'animate-pulse' : ''}
                    style={{ color: playbackState === 'playing' ? activeTheme.accentHex : '#4b5563' }}
                  />
                  <div className="absolute -bottom-1 -right-1 bg-stone-900 p-0.5 border rounded-md border-stone-800 text-[8px] font-mono leading-none">
                    {selectedStation.format}
                  </div>
                </div>

                <div className="flex flex-col gap-1 overflow-hidden">
                  <div className="flex flex-wrap gap-1">
                    <span className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-[7px] font-mono font-bold uppercase tracking-widest text-[#9ca3af]">
                      {selectedStation.country}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-850 text-[7px] font-mono font-bold text-[#6b7280]">
                      {selectedStation.language}
                    </span>
                  </div>
                  
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-white line-clamp-1">
                    {selectedStation.name}
                  </h2>
                  
                  <p className="text-[10px] font-mono text-stone-500 truncate line-clamp-1">
                    {selectedStation.tags && selectedStation.tags.length > 0
                      ? selectedStation.tags.map((t) => `#${t.toUpperCase()}`).join('  ')
                      : '#WORLD #LIVE'}
                  </p>
                </div>
              </div>

              {/* Favorites bookmark toggle button */}
              <button
                onClick={() => handleToggleFavorite(selectedStation.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 justify-center w-full md:w-auto flex items-center gap-2 ${
                  settings.favorites.includes(selectedStation.id)
                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                    : 'bg-stone-900/60 border-stone-800 text-stone-500 hover:text-stone-300'
                }`}
              >
                <Heart size={16} fill={settings.favorites.includes(selectedStation.id) ? 'currentColor' : 'transparent'} />
                <span className="md:hidden font-mono text-xxs font-bold uppercase">
                  {settings.favorites.includes(selectedStation.id) ? locale.removeFav : locale.addFav}
                </span>
              </button>

            </div>

            {/* Real-time Hardware stereophonic VU needle monitors */}
            <HardwareVUMeter
              analyserNode={analyserStateNode}
              theme={activeTheme}
              isSimulated={isSimulated}
              isPlaying={playbackState === 'playing'}
              audioVolume={settings.volume}
            />

            {/* Custom Interactive physical state machine sliders/buttons deck */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-3 border-t border-stone-900/60">
              
              {/* Playback physical buttons list (Grid span L-6) */}
              <div className="md:col-span-6 flex flex-row gap-2 border border-stone-900 bg-stone-950/60 p-2 rounded-xl h-fit">
                
                {/* Tune PREV Dial button */}
                <button
                  onClick={() => handleNavStation('prev')}
                  className="flex-1 py-3 px-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-[#d1d5db] font-mono text-center text-xxs font-black cursor-pointer border border-stone-800/80 active:scale-95 transition-all duration-150 uppercase"
                >
                  ◀ {locale.prev}
                </button>

                {/* Primary PLAY toggling button */}
                <button
                  onClick={handleTogglePlay}
                  className="flex-[1.5] py-3 px-3 rounded-lg text-white font-mono text-center text-xxs font-black border cursor-pointer hover:brightness-110 active:scale-95 transition-all duration-150 flex items-center justify-center gap-1.5 uppercase shadow-inner"
                  style={{
                    backgroundColor: playbackState === 'playing' ? activeTheme.accentHex + '25' : '#1e1c1c',
                    borderColor: activeTheme.accentHex + '66'
                  }}
                >
                  {playbackState === 'playing' ? (
                    <>
                      <Pause size={12} className="shrink-0 animate-pulse" style={{ color: activeTheme.accentHex }} />
                      <span style={{ color: activeTheme.accentHex }}>{locale.pause}</span>
                    </>
                  ) : playbackState === 'connecting' || playbackState === 'buffering' ? (
                    <>
                      <Loader2 size={12} className="animate-spin shrink-0 text-amber-500" />
                      <span className="text-amber-500 tracking-tighter">WAIT...</span>
                    </>
                  ) : (
                    <>
                      <Play size={12} className="shrink-0" />
                      <span>{locale.play}</span>
                    </>
                  )}
                </button>

                {/* Tune STOP physical button */}
                <button
                  onClick={handleStop}
                  className="p-3 rounded-lg bg-red-650 hover:bg-red-750 border border-[#dc2626]/20 text-[#ef4444] font-mono text-center text-xxs font-bold cursor-pointer active:scale-95 transition-all duration-150"
                  title="Force Power Off Stream"
                >
                  <Square size={12} fill="currentColor" />
                </button>

                {/* Tune NEXT Dial button */}
                <button
                  onClick={() => handleNavStation('next')}
                  className="flex-1 py-3 px-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-[#d1d5db] font-mono text-center text-xxs font-black cursor-pointer border border-stone-800/80 active:scale-95 transition-all duration-150 uppercase"
                >
                  {locale.next} ▶
                </button>
              </div>

              {/* Playback connection feedback readout strip (Grid span L-6) */}
              <div className="md:col-span-6 bg-[#030303] border border-stone-900/80 p-3 rounded-xl flex items-center justify-center font-mono text-center relative overflow-hidden h-16">
                
                {/* Horizontal progress scanner line */}
                {playbackState === 'playing' && (
                  <div
                    className="absolute inset-y-0 left-0 w-0.5 opacity-40 animate-slide-left-right"
                    style={{ backgroundColor: activeTheme.accentHex }}
                  />
                )}

                <div className="space-y-1">
                  <span className="text-[10px] text-stone-500 font-bold tracking-widest block uppercase">
                    RECEIVER TELEMETRY FEED
                  </span>
                  <p
                    className="text-xs font-black tracking-tight"
                    style={{
                      color:
                        playbackState === 'playing'
                          ? activeTheme.accentHex
                          : playbackState === 'connecting' || playbackState === 'buffering'
                          ? '#eab308'
                          : playbackState === 'error'
                          ? '#ef4444'
                          : '#94a3b8'
                    }}
                  >
                    {playbackState === 'playing'
                      ? locale.connected
                      : playbackState === 'connecting'
                      ? locale.connecting
                      : playbackState === 'buffering'
                      ? locale.buffering
                      : playbackState === 'error'
                      ? locale.error
                      : locale.paused}
                  </p>
                </div>
              </div>

              {/* Row 2: Sleep Timer control block (md:col-span-6) */}
              <div className="md:col-span-6 bg-[#030303]/90 border border-stone-900/80 p-3 rounded-xl flex flex-col justify-between font-mono h-[74px]">
                <div className="flex justify-between items-center text-[10px] text-stone-500 font-bold uppercase tracking-widest leading-none mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${sleepTimeLeft !== null ? 'bg-amber-500 animate-ping' : 'bg-stone-700'}`} />
                    {locale.sleepTimer}
                  </span>
                  {sleepTimeLeft !== null ? (
                    <span style={{ color: activeTheme.accentHex }} className="font-extrabold tracking-wider animate-pulse">
                      [{Math.floor(sleepTimeLeft / 60)}:{(sleepTimeLeft % 60).toString().padStart(2, '0')}]
                    </span>
                  ) : (
                    <span className="text-stone-600 font-black">{locale.off}</span>
                  )}
                </div>

                <div className="flex gap-1">
                  {[
                    { label: locale.off, val: null },
                    { label: '15m', val: 15 * 60 },
                    { label: '30m', val: 30 * 60 },
                    { label: '45m', val: 45 * 60 },
                    { label: '60m', val: 60 * 60 },
                  ].map((btn, idx) => {
                    const isActive = (btn.val === null && sleepTimeLeft === null) || 
                                     (btn.val !== null && sleepTimeLeft !== null && Math.abs(sleepTimeLeft - btn.val) <= 15);
                    return (
                      <button
                        key={idx}
                        onClick={() => setSleepTimeLeft(btn.val)}
                        className="flex-1 py-1.5 px-1 rounded-md text-[9px] font-bold tracking-tight border cursor-pointer active:scale-95 transition-all duration-155 uppercase text-center"
                        style={{
                          backgroundColor: isActive ? activeTheme.accentHex + '18' : '#0a0a0c',
                          borderColor: isActive ? activeTheme.accentHex + '55' : '#18181c',
                          color: isActive ? activeTheme.accentHex : '#71717a'
                        }}
                      >
                        {btn.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 2: Stereo Wide / Mono hardware controller (md:col-span-6) */}
              <div className="md:col-span-6 bg-[#030303]/90 border border-stone-900/80 p-3 rounded-xl flex items-center justify-between font-mono h-[74px]">
                <div className="flex flex-col justify-between h-full flex-1 pr-2">
                  <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest leading-none mb-1">
                    AUDIO MATRIX SPATIAL
                  </span>
                  
                  {/* Status readout */}
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="h-2 w-2 rounded-full shadow-lg animate-pulse"
                      style={{ 
                        backgroundColor: isStereoWide ? activeTheme.accentHex : '#f59e0b',
                        boxShadow: `0 0 6px ${isStereoWide ? activeTheme.accentHex : '#f59e0b'}`
                      }}
                    />
                    <span 
                      className="text-[9.5px] font-extrabold uppercase tracking-tight text-stone-200"
                    >
                      {isStereoWide ? 'HAAS STEREO WIDE' : 'MONO DECK'}
                    </span>
                  </div>

                  <span className="text-[7.5px] text-stone-600 font-bold uppercase">
                    {isStereoWide ? '18ms Haas delay active' : 'Dual summation'}
                  </span>
                </div>

                {/* Tactile slide switch wrapper */}
                <div 
                  onClick={() => setIsStereoWide(!isStereoWide)}
                  className="w-24 bg-stone-950 border border-stone-850 p-0.5 rounded-lg flex items-center justify-between cursor-pointer select-none relative overflow-hidden"
                  title="Toggle stereophonic spatial soundstage enhancer"
                >
                  <div 
                    className="absolute inset-y-0.5 w-[46px] rounded bg-stone-900 border border-stone-800 transition-all duration-200 shadow-md flex items-center justify-center"
                    style={{
                      left: isStereoWide ? '50px' : '2px',
                      borderColor: activeTheme.accentHex + '33'
                    }}
                  />
                  <span className={`flex-1 text-center text-[7.5px] font-black z-10 py-1 transition-colors ${!isStereoWide ? 'text-amber-500 font-extrabold' : 'text-stone-600 font-bold'}`}>
                    MONO
                  </span>
                  <span className={`flex-1 text-center text-[7.5px] font-black z-10 py-1 transition-colors ${isStereoWide ? 'text-white font-extrabold' : 'text-stone-600 font-bold'}`} style={{ color: isStereoWide ? activeTheme.accentHex : '' }}>
                    STEREO
                  </span>
                </div>
              </div>

            </div>

            {/* Custom caution message alerting user regarding possible CORS blocks */}
            {isSimulated && playbackState === 'playing' && (
              <div className="bg-amber-950/20 border border-amber-500/15 p-2 rounded-lg text-[9px] font-mono text-stone-400 mt-1 flex items-start gap-1.5 leading-relaxed">
                <span className="inline-block bg-amber-500/25 text-amber-300 font-bold px-1.5 py-0.5 rounded uppercase font-black text-[8px] tracking-widest">
                  WSA BYPASS
                </span>
                <span>{locale.simulatedWarning}</span>
              </div>
            )}

            {/* Corner Resize Grip */}
            <div className="absolute bottom-1.5 right-1.5 pointer-events-none opacity-40 select-none hidden sm:block" style={{ color: activeTheme.accentHex }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 0L0 10M10 4L4 10M10 8L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>

          </div>

          {/* REALTIME CANVAS GRAPH SPECTRUM ANALYZER */}
          <AudioVisualizer
            analyserNode={analyserStateNode}
            theme={activeTheme}
            isSimulated={isSimulated}
            isPlaying={playbackState === 'playing'}
            audioVolume={settings.volume}
            mode={settings.visualizerMode || 'led'}
            onChangeMode={(newMode) => setSettings((p) => ({ ...p, visualizerMode: newMode }))}
          />

          {/* DYNAMIC RADIO DOPPLER STATION EMISSION POWER RADAR & PL SYSTEM */}
          <RadioRadar
            stations={getActiveStationList()}
            selectedStation={selectedStation}
            playbackState={playbackState}
            onSelectStation={handleSelectStation}
            theme={activeTheme}
            locale={locale}
          />

        </section>

        {/* RIGHT COLUMN: RECEPTIONS DIAL PANEL & EQUALIZER ACCENT (GRID SPAN L-5) */}
        <section className="lg:col-span-5 flex flex-col gap-5">
          
          {/* VOLUME POTENTIOMETER & EQUALIZER SYSTEM */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-4">
              <VolumeKnob
                volume={settings.volume}
                onChange={(v) => setSettings((p) => ({ ...p, volume: v }))}
                theme={activeTheme}
                label={locale.volume.split(' ')[0]}
              />
            </div>
            
            <div className="md:col-span-8 bg-black/70 backdrop-blur-md border rounded-2xl p-5 shadow-xl shadow-black/40 flex flex-col justify-between font-mono font-semibold overflow-auto resize min-h-[140px]"
                 style={{ borderColor: activeTheme.accentHex + '25' }} id="deck-config-summary">
              <span className="text-[10px] text-stone-500 tracking-widest uppercase block mb-2 font-bold">
                {locale.stereoActive.split(' ')[0]} SYSTEM DATA
              </span>

              <div className="space-y-1.5 text-xs text-stone-300">
                <div className="flex justify-between border-b border-stone-800/40 pb-1 flex-1">
                  <span className="text-stone-500 text-[10px] uppercase font-bold">CHANNEL DETECT:</span>
                  <span style={{ color: activeTheme.accentHex }} className="font-bold">2-CH DUAL-MONO STEREO</span>
                </div>
                <div className="flex justify-between border-b border-stone-800/40 pb-1 flex-1">
                  <span className="text-stone-500 text-[10px] uppercase font-bold">TUNED FREQ RES:</span>
                  <span className="text-slate-300">48.0 KHZ DUPLEX DECODER</span>
                </div>
                <div className="flex justify-between border-b border-stone-800/40 pb-1 flex-1">
                  <span className="text-stone-500 text-[10px] uppercase font-bold">AUDIO PRESET:</span>
                  <span className="text-slate-300 capitalize font-bold">{settings.activeEqPreset}</span>
                </div>
                <div className="flex justify-between border-b border-stone-800/20 pb-0.5 flex-1">
                  <span className="text-stone-500 text-[10px] uppercase font-bold">LATENCY LINK:</span>
                  <span className="text-slate-300">{playbackState === 'playing' ? '42 ms SINC' : '--- ms'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xxs text-slate-400 bg-stone-900/10 p-2 rounded-lg border border-stone-900 mt-3 font-semibold text-[9px] leading-relaxed">
                <Activity size={12} className="shrink-0" style={{ color: activeTheme.accentHex }} />
                <span>Double-Deck Chassis model GSR-9000 integrates full dynamic audio compression with 7 customized audio hardware profiles.</span>
              </div>

              {/* Corner Resize Grip */}
              <div className="absolute bottom-1.5 right-1.5 pointer-events-none opacity-40 select-none hidden sm:block" style={{ color: activeTheme.accentHex }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 0L0 10M10 4L4 10M10 8L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>

            </div>
          </div>

          {/* 7-BAND EQUALIZER PROCESSOR PANEL */}
          <AudioEqualizer
            eqWeights={settings.eqWeights}
            onChangeBand={handleBandGainChange}
            activeEqPresetId={settings.activeEqPreset}
            onSelectPreset={handleSelectEqPreset}
            theme={activeTheme}
            locale={locale}
          />

          {/* STATION SELECTOR BOARD */}
          <div
            className="rounded-2xl border bg-black/70 backdrop-blur-md shadow-xl shadow-black/40 overflow-auto flex flex-col min-h-[250px] max-h-[1200px] h-112 relative resize"
            style={{ borderColor: activeTheme.accentHex + '25' }}
            id="station-browser-module"
          >
            {/* Nav Tabs for station list splits */}
            <div className="flex border-b border-stone-900 bg-black/20" id="browser-tab-selectors">
              <button
                onClick={() => setActiveTab('recommended')}
                className={`flex-1 py-3 text-[10.5px] font-mono font-bold border-b-2 transition-all duration-300 cursor-pointer ${
                  activeTab === 'recommended' ? 'text-white' : 'text-stone-500 hover:text-stone-300'
                }`}
                style={{ borderBottomColor: activeTab === 'recommended' ? activeTheme.accentHex : 'transparent' }}
              >
                {locale.lang === 'ROMÂNĂ' ? 'FAVORITE RETRO' : locale.lang === 'LINGUA' ? 'RICEZIONI RECOM' : 'CURATED'}
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`flex-1 py-3 text-[10.5px] font-mono font-bold border-b-2 flex items-center justify-center gap-1 transition-all duration-300 cursor-pointer ${
                  activeTab === 'favorites' ? 'text-white' : 'text-stone-500 hover:text-stone-300'
                }`}
                style={{ borderBottomColor: activeTab === 'favorites' ? activeTheme.accentHex : 'transparent' }}
              >
                <Heart size={10} className="fill-current text-rose-500 shrink-0" />
                <span>FAVS ({settings.favorites.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-3 text-[10.5px] font-mono font-bold border-b-2 transition-all duration-300 cursor-pointer ${
                  activeTab === 'all' ? 'text-white' : 'text-stone-500 hover:text-stone-300'
                }`}
                style={{ borderBottomColor: activeTab === 'all' ? activeTheme.accentHex : 'transparent' }}
              >
                {locale.allStations.split(' ')[0]} ALL
              </button>
            </div>

            {/* Direct dynamic Global database search bar */}
            <div className="p-3 bg-stone-950/45 border-b border-stone-900/80 flex flex-col gap-2.5">
              
              <div className="flex gap-1 bg-black/40 rounded-lg p-0.5 border border-stone-900" id="search-filter-toggles">
                <button
                  onClick={() => setSearchFilter('name')}
                  className={`flex-1 py-1 text-[9px] font-mono font-bold rounded cursor-pointer transition-colors ${
                    searchFilter === 'name' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-300'
                  }`}
                  style={{ color: searchFilter === 'name' ? activeTheme.accentHex : '' }}
                >
                  {locale.searchByName}
                </button>
                <button
                  onClick={() => setSearchFilter('country')}
                  className={`flex-1 py-1 text-[9px] font-mono font-bold rounded cursor-pointer transition-colors ${
                    searchFilter === 'country' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-300'
                  }`}
                  style={{ color: searchFilter === 'country' ? activeTheme.accentHex : '' }}
                >
                  {locale.country}
                </button>
                <button
                  onClick={() => setSearchFilter('tag')}
                  className={`flex-1 py-1 text-[9px] font-mono font-bold rounded cursor-pointer transition-colors ${
                    searchFilter === 'tag' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-300'
                  }`}
                  style={{ color: searchFilter === 'tag' ? activeTheme.accentHex : '' }}
                >
                  {locale.searchByTag}
                </button>
              </div>

              {/* Quick Country Buttons Row */}
              <div className="flex flex-col gap-1.5 mt-0.5" id="countries-selector-container">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-mono font-bold text-stone-500 uppercase tracking-wider block">
                    {locale.lang === 'ROMÂNĂ' ? '🚀 SELECȚIE RAPIDĂ PE ȚĂRI' : '🚀 QUICK COUNTRY SEARCH'}
                  </span>
                  {searchFilter === 'country' && searchQuery && activeTab === 'search' && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setActiveTab('recommended');
                      }}
                      className="text-[8px] font-mono font-bold text-rose-500 hover:text-rose-400 uppercase tracking-wider cursor-pointer"
                    >
                      {locale.lang === 'ROMÂNĂ' ? '[ RESETEAZĂ ]' : '[ RESET ]'}
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-1 select-none" id="country-quick-chips">
                  {[
                    { name: 'Romania', flag: '🇷🇴' },
                    { name: 'France', flag: '🇫🇷' },
                    { name: 'United Kingdom', flag: '🇬🇧' },
                    { name: 'Italy', flag: '🇮🇹' },
                    { name: 'Germany', flag: '🇩🇪' },
                    { name: 'Spain', flag: '🇪🇸' },
                    { name: 'United States', flag: '🇺🇸' },
                    { name: 'Canada', flag: '🇨🇦' },
                    { name: 'Netherlands', flag: '🇳🇱' },
                    { name: 'Switzerland', flag: '🇨🇭' },
                    { name: 'Brazil', flag: '🇧🇷' },
                    { name: 'Greece', flag: '🇬🇷' },
                    { name: 'Japan', flag: '🇯🇵' },
                    { name: 'Austria', flag: '🇦🇹' },
                    { name: 'Portugal', flag: '🇵🇹' },
                    { name: 'Moldova', flag: '🇲🇩' },
                    { name: 'Hungary', flag: '🇭🇺' },
                    { name: 'Bulgaria', flag: '🇧🇬' },
                    { name: 'Poland', flag: '🇵🇱' },
                    { name: 'Belgium', flag: '🇧🇪' },
                    { name: 'Turkey', flag: '🇹🇷' },
                    { name: 'Sweden', flag: '🇸🇪' },
                    { name: 'Norway', flag: '🇳🇴' },
                    { name: 'Australia', flag: '🇦🇺' },
                  ].map((cty) => {
                    const isActive = searchFilter === 'country' && searchQuery === cty.name && activeTab === 'search';
                    return (
                      <button
                        key={cty.name}
                        onClick={() => handleCountryQuickSearch(cty.name)}
                        className="px-2 py-1.5 rounded-md text-[9.5px] font-mono font-bold border transition-all flex items-center gap-1.5 cursor-pointer hover:border-stone-600 bg-stone-900/60 hover:bg-stone-850"
                        style={{
                          borderColor: isActive ? activeTheme.accentHex : '#292524',
                          color: isActive ? activeTheme.accentHex : '#9ca3af',
                          boxShadow: isActive ? `0 0 10px ${activeTheme.accentHex}15` : ''
                        }}
                      >
                        <span className="text-[11px] leading-none select-none shrink-0">{cty.flag}</span>
                        <span className="truncate leading-none">{cty.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input
                    type="text"
                    placeholder={locale.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-black/50 border border-stone-900 rounded-xl py-2 pl-9 pr-4 text-xs font-mono text-slate-100 placeholder-stone-600 focus:outline-hidden focus:border-stone-800 transition-colors"
                  />
                </div>
                <button
                  onClick={triggerGlobalSearch}
                  disabled={loadingSearch}
                  className="px-4.5 rounded-xl text-xs font-bold font-mono tracking-wide bg-stone-900 hover:bg-stone-800 text-slate-100 border border-stone-800 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-10 transition-colors"
                >
                  {loadingSearch ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <>
                      <span>SEARCH</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* List Stations Browser space */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-black/20" id="stations-grid-list">
              {loadingSearch ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3 font-mono">
                  <Loader2 size={32} className="animate-spin block" style={{ color: activeTheme.accentHex }} />
                  <p className="text-xs text-stone-500 blink">{locale.loadingSearch}</p>
                </div>
              ) : getActiveStationList().length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-stone-600 font-mono space-y-2">
                  <Radio size={24} className="opacity-30" />
                  <p className="text-xs">
                    {activeTab === 'favorites' ? locale.noFavorites : locale.noStationsFound}
                  </p>
                </div>
              ) : (
                getActiveStationList().map((station) => {
                  const isCurrent = station.id === selectedStation.id;
                  const isFav = settings.favorites.includes(station.id);
                  return (
                    <div
                      key={station.id}
                      onClick={() => handleSelectStation(station)}
                      style={{
                        borderColor: isCurrent ? activeTheme.accentHex + '44' : 'transparent',
                        backgroundColor: isCurrent ? activeTheme.accentHex + '10' : '#0e0b1250'
                      }}
                      className={`group p-3 border border-stone-900 hover:border-stone-800 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all duration-200`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden min-w-0">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all duration-300 shrink-0 ${
                            isCurrent ? activeTheme.accentBg : 'bg-black/60 border-stone-850'
                          }`}
                          style={{ borderColor: isCurrent ? activeTheme.accentHex + '33' : '' }}
                        >
                          {isCurrent && playbackState === 'playing' ? (
                            <Activity size={14} className="animate-pulse" style={{ color: activeTheme.accentHex }} />
                          ) : (
                            <Radio size={14} className="text-stone-500 group-hover:text-stone-300 transition-colors" />
                          )}
                        </div>

                        <div className="flex flex-col gap-0.5 min-w-0 overflow-hidden text-left">
                          <span className="text-[11px] font-bold text-white group-hover:text-[#f3f4f6] line-clamp-1 truncate block transition-colors">
                            {station.name}
                          </span>
                          <div className="flex items-center gap-1.5 font-mono text-[9px] text-[#9ca3af] truncate">
                            <span className="font-bold shrink-0">{station.country}</span>
                            <span className="text-stone-700">•</span>
                            <span className="truncate">{station.tags ? station.tags.slice(0, 2).join(' ') : 'Radio'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-[9px] font-bold text-stone-500 bg-stone-900 border border-stone-850 px-1.5 py-0.5 rounded text-right">
                          {station.bitrate > 0 ? `${station.bitrate}k` : '128k'}
                        </span>
                        
                        {/* Inline short favorite bookmark toggle */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(station.id);
                          }}
                          className={`p-1.5 rounded-md hover:bg-stone-800 cursor-pointer transition-colors ${
                            isFav ? 'text-rose-500' : 'text-stone-600 hover:text-stone-400'
                          }`}
                        >
                          <Heart size={12} fill={isFav ? 'currentColor' : 'transparent'} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Total search indicator tag */}
            {activeTab === 'search' && searchResults.length > 0 && (
              <div className="p-2 border-t border-stone-900 bg-stone-950/60 font-mono text-[9px] text-stone-500 text-center flex items-center justify-center gap-1.5">
                <Check size={11} className="text-emerald-500" />
                <span>{locale.totalFound}: {searchResults.length} {locale.searchResults.toLowerCase()}</span>
              </div>
            )}

            {/* Corner Resize Grip */}
            <div className="absolute bottom-1.5 right-1.5 pointer-events-none opacity-40 select-none hidden sm:block" style={{ color: activeTheme.accentHex }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 0L0 10M10 4L4 10M10 8L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>

          </div>

        </section>

      </main>

      {/* ----------------------------------------------------
          APPLICATION FOOTER WITH FACTORY CREDITS
          ---------------------------------------------------- */}
      <footer
        className="py-4 border-t bg-stone-950/80 backdrop-blur-md relative z-30"
        style={{ borderColor: activeTheme.accentHex + '18' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="font-mono text-stone-600 text-[10px] tracking-wider">
            GSR-9000 DIGITAL REPRODUCTION CONSOLE • MADE IN ROMANIA
          </p>
          <div className="flex items-center gap-2 text-xxs text-stone-500 font-mono">
            <span>DEVELOPED BY</span>
            <span className="font-bold text-slate-350 tracking-widest border border-stone-800/80 bg-stone-900/60 px-2 py-0.5 rounded-md text-[9.5px]">
              ANDREI ADRIAN BUTA
            </span>
          </div>
        </div>
      </footer>

      {/* ----------------------------------------------------
          MODAL OVERLAYS: WINDOWS SETUP & ABOUT DIALOGUES
          ---------------------------------------------------- */}
      {showWindowsGuide && (
        <WindowsSetup
          onClose={() => setShowWindowsGuide(false)}
          theme={activeTheme}
          locale={locale}
        />
      )}

      {showAbout && (
        <AboutModal
          onClose={() => setShowAbout(false)}
          theme={activeTheme}
          locale={locale}
          settings={settings}
          onImportSettings={handleImportSettings}
          onChangeVisualizerMode={(newMode) => setSettings((p) => ({ ...p, visualizerMode: newMode }))}
        />
      )}
    </div>
  );
}
