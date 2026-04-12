import { createContext, useContext, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { tracks } from '../data';

const PlayerContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const usePlayer = () => useContext(PlayerContext);

const cloneTrack = (track) => ({ ...track });

export const PlayerProvider = ({ children }) => {
  const [queue, setQueue] = useState(() => tracks.map(cloneTrack));
  const [appReady, setAppReady] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [duration, setDuration] = useState(0);
  const [trackDurations, setTrackDurations] = useState({});

  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off');

  const playerRef = useRef(null);
  const preloadPlayerRef = useRef(null);
  const isReadyRef = useRef(false);
  const preloadReadyRef = useRef(false);
  const intervalRef = useRef(null);
  const switchTimeoutRef = useRef(null);
  const pendingSwitchRef = useRef(null);
  const preloadedVideoIdRef = useRef(null);
  const warmupTimersRef = useRef([]);
  const startupWarmupDoneRef = useRef(false);
  const wakeLockRef = useRef(null);

  // Optimization: cache visited IDs for this tab session to choose the fastest switch strategy.
  const playedIdsRef = useRef(new Set());
  const hasPreloadedCurrentTrackRef = useRef(false);

  const currentTrack = queue[currentTrackIndex] ?? null;

  // Ref to hold the latest state to avoid stale closures in vanilla JS events.
  const stateRef = useRef({
    queue,
    currentTrackIndex,
    repeatMode,
    shuffle,
    duration,
    isPlaying,
    isBuffering,
    isMuted,
    volume
  });

  useEffect(() => {
    stateRef.current = {
      queue,
      currentTrackIndex,
      repeatMode,
      shuffle,
      duration,
      isPlaying,
      isBuffering,
      isMuted,
      volume
    };
  }, [queue, currentTrackIndex, repeatMode, shuffle, duration, isPlaying, isBuffering, isMuted, volume]);

  useEffect(() => {
    const raw = sessionStorage.getItem('playedYoutubeIds');
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        playedIdsRef.current = new Set(parsed);
      }
    } catch {
      playedIdsRef.current = new Set();
    }
  }, []);

  const persistPlayedIds = useCallback(() => {
    sessionStorage.setItem('playedYoutubeIds', JSON.stringify(Array.from(playedIdsRef.current)));
  }, []);

  const markTrackAsPlayed = useCallback((youtubeId) => {
    if (!youtubeId) return;
    playedIdsRef.current.add(youtubeId);
    persistPlayedIds();
  }, [persistPlayedIds]);

  const normalizeIndex = useCallback((index, arr = stateRef.current.queue) => {
    const length = arr.length;
    if (!length) return 0;
    return ((index % length) + length) % length;
  }, []);

  const getNextIndex = useCallback((baseIndex, arr = stateRef.current.queue) => {
    if (!arr.length) return 0;

    if (!stateRef.current.shuffle) {
      return (baseIndex + 1) % arr.length;
    }

    const remainingIndices = arr.map((_, i) => i).filter((i) => i !== baseIndex);
    if (!remainingIndices.length) return baseIndex;
    return remainingIndices[Math.floor(Math.random() * remainingIndices.length)] ?? baseIndex;
  }, []);

  const cuePreloadTrack = useCallback((indexToPreload, arr = stateRef.current.queue) => {
    if (!preloadReadyRef.current || !preloadPlayerRef.current || arr.length < 2) return;

    const targetIndex = normalizeIndex(indexToPreload, arr);
    const targetTrack = arr[targetIndex];
    if (!targetTrack?.youtubeId) return;

    if (preloadedVideoIdRef.current === targetTrack.youtubeId) return;

    // Optimization: cue the next track silently so switching feels instant.
    preloadPlayerRef.current.cueVideoById({
      videoId: targetTrack.youtubeId,
      suggestedQuality: 'small'
    });
    preloadPlayerRef.current.setPlaybackQuality('small');
    preloadedVideoIdRef.current = targetTrack.youtubeId;
  }, [normalizeIndex]);

  const preloadTrack = useCallback((youtubeId) => {
    if (!youtubeId || !preloadReadyRef.current || !preloadPlayerRef.current) return false;
    if (preloadedVideoIdRef.current === youtubeId) return true;

    // Optimization: pre-cue on hover/touch so click can swap instantly.
    preloadPlayerRef.current.cueVideoById({
      videoId: youtubeId,
      suggestedQuality: 'small'
    });
    preloadPlayerRef.current.setPlaybackQuality('small');
    preloadedVideoIdRef.current = youtubeId;
    return true;
  }, []);

  const runStartupWarmup = useCallback(() => {
    if (startupWarmupDoneRef.current) return;
    if (!preloadReadyRef.current || !preloadPlayerRef.current) return;

    const warmTargets = stateRef.current.queue.slice(1, 4).filter((track) => track?.youtubeId);
    if (!warmTargets.length) return;

    startupWarmupDoneRef.current = true;

    warmupTimersRef.current.forEach((timer) => clearTimeout(timer));
    warmupTimersRef.current = [];

    // Optimization: lightly warm likely early selections, then settle on track 2 as the active preloaded target.
    warmTargets.forEach((track, idx) => {
      const timer = setTimeout(() => {
        preloadTrack(track.youtubeId);

        if (idx === warmTargets.length - 1 && warmTargets[0]?.youtubeId) {
          preloadTrack(warmTargets[0].youtubeId);
        }
      }, idx * 220);
      warmupTimersRef.current.push(timer);
    });
  }, [preloadTrack]);

  const swapToPreloadedPlayer = useCallback((targetTrack) => {
    if (!preloadReadyRef.current || !preloadPlayerRef.current) return false;
    if (!targetTrack?.youtubeId || preloadedVideoIdRef.current !== targetTrack.youtubeId) return false;

    const oldMainPlayer = playerRef.current;
    playerRef.current = preloadPlayerRef.current;
    preloadPlayerRef.current = oldMainPlayer;

    if (playerRef.current) {
      playerRef.current.unMute();
      playerRef.current.setVolume(stateRef.current.isMuted ? 0 : stateRef.current.volume * 100);
      if (stateRef.current.isMuted) {
        playerRef.current.mute();
      }
      playerRef.current.setPlaybackQuality('small');
      playerRef.current.playVideo();
    }

    if (preloadPlayerRef.current) {
      preloadPlayerRef.current.pauseVideo();
      preloadPlayerRef.current.mute();
      preloadPlayerRef.current.setVolume(0);
    }

    preloadedVideoIdRef.current = null;
    hasPreloadedCurrentTrackRef.current = false;
    return true;
  }, []);

  const swapPlayers = useCallback((targetIndex) => {
    const activeQueue = stateRef.current.queue;
    if (!activeQueue.length) return false;

    const normalizedIndex = normalizeIndex(targetIndex, activeQueue);
    const targetTrack = activeQueue[normalizedIndex];
    if (!targetTrack) return false;

    const swapped = swapToPreloadedPlayer(targetTrack);
    if (!swapped) return false;

    setCurrentTrackIndex(normalizedIndex);
    setDuration(0);
    setIsPlaying(true);
    setIsBuffering(true);

    const nextOfNextIndex = getNextIndex(normalizedIndex, activeQueue);
    cuePreloadTrack(nextOfNextIndex, activeQueue);
    return true;
  }, [cuePreloadTrack, getNextIndex, normalizeIndex, swapToPreloadedPlayer]);

  const playTrackByIndex = useCallback((targetIndex, shouldAutoplay = true, queueOverride = null) => {
    const activeQueue = queueOverride ?? stateRef.current.queue;
    if (!activeQueue.length) {
      setIsPlaying(false);
      setIsBuffering(false);
      setDuration(0);
      return;
    }

    const normalizedIndex = normalizeIndex(targetIndex, activeQueue);
    const targetTrack = activeQueue[normalizedIndex];
    if (!targetTrack?.youtubeId) return;

    setCurrentTrackIndex(normalizedIndex);
    setDuration(0);
    setIsPlaying(shouldAutoplay);
    setIsBuffering(shouldAutoplay);

    if (!isReadyRef.current || !playerRef.current) {
      return;
    }

    if (swapToPreloadedPlayer(targetTrack)) {
      const nextOfNextIndex = getNextIndex(normalizedIndex, activeQueue);
      cuePreloadTrack(nextOfNextIndex, activeQueue);
      return;
    }

    const wasPlayed = playedIdsRef.current.has(targetTrack.youtubeId);

    if (wasPlayed) {
      // Optimization: revisits usually benefit from browser/YT cache, so direct load is faster.
      playerRef.current.loadVideoById(targetTrack.youtubeId);
      playerRef.current.setPlaybackQuality('small');
    } else {
      // Optimization: cue first with small quality for faster perceived startup, then play.
      playerRef.current.cueVideoById({
        videoId: targetTrack.youtubeId,
        suggestedQuality: 'small'
      });
      playerRef.current.setPlaybackQuality('small');
      if (shouldAutoplay) {
        playerRef.current.playVideo();
      }
    }

    hasPreloadedCurrentTrackRef.current = false;

    const nextIndex = getNextIndex(normalizedIndex, activeQueue);
    cuePreloadTrack(nextIndex, activeQueue);
  }, [cuePreloadTrack, getNextIndex, normalizeIndex, swapToPreloadedPlayer]);

  const switchTrack = useCallback((targetIndex) => {
    if (switchTimeoutRef.current) {
      clearTimeout(switchTimeoutRef.current);
    }

    // Optimization: debounce rapid next/prev clicks to avoid stacked YT load calls.
    switchTimeoutRef.current = setTimeout(() => {
      playTrackByIndex(targetIndex, true);
    }, 150);
  }, [playTrackByIndex]);

  const onPlayerReady = useCallback((event) => {
    if (event.target === playerRef.current) {
      isReadyRef.current = true;
      setAppReady(true);
      const dur = event.target.getDuration();
      if (dur) setDuration(dur);
      event.target.setVolume(100);
      event.target.setPlaybackQuality('small');
      runStartupWarmup();
      return;
    }

    if (event.target === preloadPlayerRef.current) {
      preloadReadyRef.current = true;
      event.target.setVolume(0);
      event.target.mute();
      event.target.setPlaybackQuality('small');
      runStartupWarmup();
    }
  }, [runStartupWarmup]);

  const next = useCallback(() => {
    const activeQueue = stateRef.current.queue;
    if (!activeQueue.length) return;

    const nextIdx = getNextIndex(stateRef.current.currentTrackIndex, activeQueue);
    switchTrack(nextIdx);
  }, [getNextIndex, switchTrack]);

  const play = useCallback(() => {
    if (!stateRef.current.queue.length) return;

    if (isReadyRef.current && playerRef.current) {
      playerRef.current.playVideo();
    } else {
      playTrackByIndex(stateRef.current.currentTrackIndex, true);
    }
    setIsBuffering(true);
    setIsPlaying(true);
  }, [playTrackByIndex]);

  const pause = useCallback(() => {
    if (isReadyRef.current && playerRef.current) playerRef.current.pauseVideo();
    setIsPlaying(false);
    setIsBuffering(false);
  }, []);

  const prev = useCallback(() => {
    const activeQueue = stateRef.current.queue;
    if (!activeQueue.length) return;

    const curr = (isReadyRef.current && playerRef.current) ? playerRef.current.getCurrentTime() : 0;
    if (curr > 3 && isReadyRef.current && playerRef.current) {
      playerRef.current.seekTo(0, true);
      return;
    }

    const prevIdx = normalizeIndex(stateRef.current.currentTrackIndex - 1, activeQueue);
    switchTrack(prevIdx);
  }, [normalizeIndex, switchTrack]);

  const playTrack = useCallback((index) => {
    const activeQueue = stateRef.current.queue;
    if (!activeQueue.length) return;

    const normalizedIndex = normalizeIndex(index, activeQueue);
    const targetTrack = activeQueue[normalizedIndex];
    if (!targetTrack?.youtubeId) return;

    // Optimization: instant UI response before player I/O starts.
    setCurrentTrackIndex(normalizedIndex);
    setDuration(0);
    setIsPlaying(true);
    setIsBuffering(true);

    if (pendingSwitchRef.current) {
      clearTimeout(pendingSwitchRef.current);
    }

    // Optimization: debounce random rapid clicks to prevent stacked YT requests.
    pendingSwitchRef.current = setTimeout(() => {
      if (preloadedVideoIdRef.current === targetTrack.youtubeId && swapPlayers(normalizedIndex)) {
        return;
      }

      if (!isReadyRef.current || !playerRef.current) {
        playTrackByIndex(normalizedIndex, true);
        return;
      }

      // Graceful fallback when swap is unavailable.
      playerRef.current.loadVideoById(targetTrack.youtubeId);
      playerRef.current.setPlaybackQuality('small');

      const nextIndex = getNextIndex(normalizedIndex, activeQueue);
      cuePreloadTrack(nextIndex, activeQueue);
    }, 100);
  }, [cuePreloadTrack, getNextIndex, normalizeIndex, playTrackByIndex, swapPlayers]);

  const playNext = useCallback((track) => {
    if (!track) return;

    const updated = [...stateRef.current.queue];
    const insertIndex = updated.length ? stateRef.current.currentTrackIndex + 1 : 0;
    updated.splice(insertIndex, 0, cloneTrack(track));
    setQueue(updated);

    if (!updated.length) {
      setCurrentTrackIndex(0);
    }
  }, []);

  const addToEnd = useCallback((track) => {
    if (!track) return;

    const updated = [...stateRef.current.queue, cloneTrack(track)];
    setQueue(updated);

    if (updated.length === 1) {
      setCurrentTrackIndex(0);
    }
  }, []);

  const removeFromQueue = useCallback((index) => {
    const activeQueue = stateRef.current.queue;
    if (!activeQueue.length || index < 0 || index >= activeQueue.length) return;

    const updated = activeQueue.filter((_, i) => i !== index);

    if (!updated.length) {
      setQueue([]);
      setCurrentTrackIndex(0);
      pause();
      return;
    }

    if (index === stateRef.current.currentTrackIndex) {
      const nextIndex = index >= updated.length ? 0 : index;
      setQueue(updated);
      setCurrentTrackIndex(nextIndex);
      playTrackByIndex(nextIndex, true, updated);
      return;
    }

    let nextCurrentIndex = stateRef.current.currentTrackIndex;
    if (index < nextCurrentIndex) {
      nextCurrentIndex -= 1;
    }

    setQueue(updated);
    setCurrentTrackIndex(nextCurrentIndex);
  }, [pause, playTrackByIndex]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentTrackIndex(0);
    pause();
  }, [pause]);

  const reorderQueue = useCallback((fromIndex, toIndex) => {
    const activeQueue = stateRef.current.queue;
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= activeQueue.length ||
      toIndex >= activeQueue.length ||
      fromIndex === toIndex
    ) {
      return;
    }

    const updated = [...activeQueue];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);

    let nextCurrentIndex = stateRef.current.currentTrackIndex;

    if (fromIndex === stateRef.current.currentTrackIndex) {
      nextCurrentIndex = toIndex;
    } else if (fromIndex < stateRef.current.currentTrackIndex && toIndex >= stateRef.current.currentTrackIndex) {
      nextCurrentIndex -= 1;
    } else if (fromIndex > stateRef.current.currentTrackIndex && toIndex <= stateRef.current.currentTrackIndex) {
      nextCurrentIndex += 1;
    }

    setQueue(updated);
    setCurrentTrackIndex(nextCurrentIndex);
  }, []);

  const shuffleQueue = useCallback(() => {
    const activeQueue = stateRef.current.queue;
    if (!activeQueue.length) return;

    const current = activeQueue[stateRef.current.currentTrackIndex] ?? activeQueue[0];
    const rest = activeQueue.filter((_, i) => i !== stateRef.current.currentTrackIndex);

    for (let i = rest.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }

    const updated = [current, ...rest];
    setQueue(updated);
    setCurrentTrackIndex(0);
  }, []);

  const playFromTop = useCallback(() => {
    if (!stateRef.current.queue.length) return;
    playTrackByIndex(0, true);
  }, [playTrackByIndex]);

  const handleSongEnd = useCallback(() => {
    const { repeatMode: rm, currentTrackIndex: idx, queue: activeQueue } = stateRef.current;

    if (!activeQueue.length) {
      setIsPlaying(false);
      setIsBuffering(false);
      return;
    }

    if (rm === 'one') {
      if (playerRef.current) {
        playerRef.current.seekTo(0);
        playerRef.current.playVideo();
      }
      return;
    }

    if (rm === 'all') {
      next();
      return;
    }

    if (idx === activeQueue.length - 1 && rm === 'off') {
      setIsPlaying(false);
      setIsBuffering(false);
      if (playerRef.current) playerRef.current.pauseVideo();
      return;
    }

    next();
  }, [next]);

  const onPlayerStateChange = useCallback((event) => {
    if (event.target !== playerRef.current) return;

    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      setIsBuffering(false);

      const currentDur = event.target.getDuration();
      if (currentDur && currentDur !== stateRef.current.duration) {
        setDuration(currentDur);
      }

      const activeTrack = stateRef.current.queue[stateRef.current.currentTrackIndex];
      if (activeTrack?.youtubeId) {
        markTrackAsPlayed(activeTrack.youtubeId);
        setTrackDurations((prev) => {
          if (!currentDur || prev[activeTrack.youtubeId]) return prev;
          return { ...prev, [activeTrack.youtubeId]: currentDur };
        });
      }
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      setIsPlaying(false);
      setIsBuffering(false);
    } else if (event.data === window.YT.PlayerState.BUFFERING) {
      setIsBuffering(true);
    } else if (event.data === window.YT.PlayerState.ENDED) {
      setIsBuffering(false);
      handleSongEnd();
    }
  }, [handleSongEnd, markTrackAsPlayed]);

  // Optimization: initialize both players once and handle API race condition safely.
  useEffect(() => {
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      console.warn('YouTube API requires HTTPS in production');
    }

    const createPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      if (playerRef.current || preloadPlayerRef.current) return;

      const optimizedPlayerVars = {
        controls: 0,
        disablekb: 1,
        rel: 0,
        autoplay: 0,
        playsinline: 1,
        enablejsapi: 1,
        vq: 'small',
        origin: window.location.origin,
        iv_load_policy: 3,
        cc_load_policy: 0
      };

      const initialVideoId = stateRef.current.queue[0]?.youtubeId;

      playerRef.current = new window.YT.Player('yt-player-main', {
        height: '10',
        width: '10',
        videoId: initialVideoId,
        playerVars: optimizedPlayerVars,
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange
        }
      });

      preloadPlayerRef.current = new window.YT.Player('yt-player-preload', {
        height: '10',
        width: '10',
        videoId: '',
        playerVars: {
          controls: 0,
          autoplay: 0,
          playsinline: 1,
          enablejsapi: 1,
          vq: 'small',
          origin: window.location.origin
        },
        events: {
          onReady: onPlayerReady
        }
      });
    };

    const initPlayer = () => {
      if (window.YT && window.YT.Player) {
        createPlayer();
      } else {
        window.onYouTubeIframeAPIReady = createPlayer;
      }
    };

    initPlayer();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (switchTimeoutRef.current) clearTimeout(switchTimeoutRef.current);
      if (pendingSwitchRef.current) clearTimeout(pendingSwitchRef.current);
      warmupTimersRef.current.forEach((timer) => clearTimeout(timer));
      warmupTimersRef.current = [];

      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      if (preloadPlayerRef.current?.destroy) {
        preloadPlayerRef.current.destroy();
        preloadPlayerRef.current = null;
      }

      isReadyRef.current = false;
      preloadReadyRef.current = false;
      preloadedVideoIdRef.current = null;
      hasPreloadedCurrentTrackRef.current = false;
      startupWarmupDoneRef.current = false;

      if (window.onYouTubeIframeAPIReady === createPlayer) {
        window.onYouTubeIframeAPIReady = null;
      }
    };
  }, [onPlayerReady, onPlayerStateChange]);

  // Optimization: while the current song plays, cue the next around 70% progress.
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (!isPlaying || !duration || !isReadyRef.current || !playerRef.current || queue.length < 2) {
      return;
    }

    intervalRef.current = setInterval(() => {
      if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;

      const currentTime = playerRef.current.getCurrentTime() || 0;
      const threshold = duration * 0.7;

      if (!hasPreloadedCurrentTrackRef.current && currentTime >= threshold) {
        const activeQueue = stateRef.current.queue;
        const nextIndex = getNextIndex(stateRef.current.currentTrackIndex, activeQueue);
        cuePreloadTrack(nextIndex, activeQueue);
        hasPreloadedCurrentTrackRef.current = true;
      }
    }, 700);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cuePreloadTrack, duration, getNextIndex, isPlaying, queue.length]);

  useEffect(() => {
    hasPreloadedCurrentTrackRef.current = false;
  }, [currentTrackIndex]);

  // Optimization: warm likely startup items so first interactions feel instant.
  useEffect(() => {
    if (!queue.length) return;

    queue.slice(0, 3).forEach((track) => {
      const img = new Image();
      img.src = track.poster || `https://i.ytimg.com/vi/${track.youtubeId}/hqdefault.jpg`;
    });
  }, [queue]);

  // Optimization: preload next poster image to avoid visible flash on track changes.
  useEffect(() => {
    if (!queue.length) return;

    const nextIndex = (currentTrackIndex + 1) % queue.length;
    const nextTrack = queue[nextIndex];
    if (!nextTrack) return;

    const img = new Image();
    img.src = nextTrack.poster || `https://i.ytimg.com/vi/${nextTrack.youtubeId}/hqdefault.jpg`;
  }, [currentTrackIndex, queue]);

  useEffect(() => {
    if (!currentTrack || !('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist || 'Unknown Artist',
      artwork: [{
        src: currentTrack.poster || `https://i.ytimg.com/vi/${currentTrack.youtubeId}/hqdefault.jpg`,
        sizes: '512x512',
        type: 'image/jpeg'
      }]
    });

    navigator.mediaSession.setActionHandler('play', play);
    navigator.mediaSession.setActionHandler('pause', pause);
    navigator.mediaSession.setActionHandler('nexttrack', next);
    navigator.mediaSession.setActionHandler('previoustrack', prev);
  }, [currentTrack, next, pause, play, prev]);

  useEffect(() => {
    let cancelled = false;

    const manageWakeLock = async () => {
      if (!('wakeLock' in navigator)) return;

      try {
        if (isPlaying && !wakeLockRef.current) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        }

        if (!isPlaying && wakeLockRef.current) {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
        }
      } catch {
        if (!cancelled) {
          wakeLockRef.current = null;
        }
      }
    };

    manageWakeLock();

    return () => {
      cancelled = true;
    };
  }, [isPlaying]);

  useEffect(() => () => {
    const releaseWakeLock = async () => {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };

    releaseWakeLock();
  }, []);

  const seekTo = useCallback((seconds) => {
    if (isReadyRef.current && playerRef.current) {
      playerRef.current.seekTo(seconds, true);
    }
  }, []);

  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prevMode) => {
      const modes = ['off', 'all', 'one'];
      const nextIdx = (modes.indexOf(prevMode) + 1) % modes.length;
      return modes[nextIdx];
    });
  }, []);

  // Apply volume changes sequentially.
  useEffect(() => {
    if (isReadyRef.current && playerRef.current) {
      if (isMuted) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
        playerRef.current.setVolume(volume * 100);
      }
    }
  }, [volume, isMuted]);

  const getTrackDuration = useCallback((track) => {
    if (!track?.youtubeId) return null;
    return trackDurations[track.youtubeId] ?? null;
  }, [trackDurations]);

  const contextValue = useMemo(() => ({
    queue,
    setQueue,
    appReady,
    currentTrack,
    currentTrackIndex,
    isPlaying,
    isBuffering,
    duration,
    volume,
    isMuted,
    shuffle,
    repeatMode,
    trackDurations,
    play,
    pause,
    next,
    prev,
    seekTo,
    setVolume,
    setIsMuted,
    toggleShuffle,
    toggleRepeat,
    playerRef,
    preloadPlayerRef,
    playTrack,
    playNext,
    addToEnd,
    removeFromQueue,
    clearQueue,
    reorderQueue,
    shuffleQueue,
    playFromTop,
    getTrackDuration,
    preloadTrack,
    swapPlayers
  }), [
    queue,
    appReady,
    currentTrack,
    currentTrackIndex,
    isPlaying,
    isBuffering,
    duration,
    volume,
    isMuted,
    shuffle,
    repeatMode,
    trackDurations,
    play,
    pause,
    next,
    prev,
    seekTo,
    toggleShuffle,
    toggleRepeat,
    playTrack,
    playNext,
    addToEnd,
    removeFromQueue,
    clearQueue,
    reorderQueue,
    shuffleQueue,
    playFromTop,
    getTrackDuration,
    preloadTrack,
    swapPlayers
  ]);

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
      <div style={{ display: 'none' }}>
        <div id="yt-player-main"></div>
        <div id="yt-player-preload"></div>
      </div>
    </PlayerContext.Provider>
  );
};
