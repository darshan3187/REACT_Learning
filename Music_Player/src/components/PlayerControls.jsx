import { Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Repeat1, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';

export default function PlayerControls() {
  const {
    appReady,
    currentTrack,
    isPlaying,
    isBuffering,
    duration,
    shuffle,
    repeatMode,
    play,
    pause,
    next,
    prev,
    seekTo,
    toggleShuffle,
    toggleRepeat,
    playerRef
  } = usePlayer();

  const [currentTime, setCurrentTime] = useState(0);

  // Instantly reset the UI time when switching tracks to prevent lingering progress visually
  useEffect(() => {
    setCurrentTime(0);
  }, [currentTrack]);

  // Sync seek bar progress locally to avoid global re-renders
  useEffect(() => {
    let interval;
    // We strictly wait until duration > 0. Why? Because during the 1-2 seconds
    // when YouTube is buffering a new song, getCurrentTime() throws out STALE times 
    // from the previous song. This prevents the timestamp from "jumping" unevenly!
    if (isPlaying && duration > 0) {
      interval = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          setCurrentTime(playerRef.current.getCurrentTime() || 0);
        }
      }, 500); // 500ms for smoother visual bar update
    } else {
      if (interval) clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration, playerRef]);

  const playBtnRef = useRef(null);

  // Animate play/pause button on state change
  useEffect(() => {
    let mounted = true;

    if (!playBtnRef.current) return undefined;

    // Optimization: load GSAP only when this animation runs.
    import('gsap').then(({ default: gsap }) => {
      if (!mounted || !playBtnRef.current) return;
      gsap.fromTo(playBtnRef.current,
        { scale: 0.8 },
        { scale: 1, duration: 0.3, ease: 'back.out(1.7)' }
      );
    });

    return () => {
      mounted = false;
    };
  }, [isPlaying]);

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full flex flex-col items-center gap-2 sm:gap-4 mt-3 sm:mt-8">
      {/* Progress Bar */}
      <div className="w-full flex items-center justify-between gap-2 sm:gap-4 text-[11px] sm:text-xs text-gray-600 font-medium">
        <span className="w-9 sm:w-10 text-left tabular-nums">{formatTime(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={Math.max(Math.floor(duration), 0)}
          value={Math.min(Math.floor(currentTime), Math.max(Math.floor(duration), 0))}
          step={1}
          onChange={(event) => {
            const value = Number(event.target.value);
            seekTo(value);
            setCurrentTime(value);
          }}
          disabled={!appReady}
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.max(Math.floor(duration), 0)}
          aria-valuenow={Math.min(Math.floor(currentTime), Math.max(Math.floor(duration), 0))}
          aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
          style={{ accentColor: '#dc2626' }}
          className={`flex-1 bg-red-500 ${!appReady ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        <span className="w-9 sm:w-10 text-right tabular-nums">{formatTime(duration)}</span>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-between w-full px-1 sm:px-2 mt-1 sm:mt-2">
        <button 
          onClick={toggleShuffle} 
          disabled={!appReady}
          aria-label={shuffle ? 'Disable shuffle' : 'Enable shuffle'}
          className={`min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors p-2 ${shuffle ? 'text-red-600 drop-shadow-md' : 'text-gray-600 hover:text-red-600'} ${!appReady ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Shuffle size={20} />
        </button>
        
        <div className="flex items-center gap-2 sm:gap-6">
          <button 
            onClick={prev}
            disabled={!appReady}
            aria-label="Previous track"
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-800 hover:text-red-600 transition-colors p-2 ${!appReady ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <SkipBack size={28} fill="currentColor" />
          </button>
          
          <button 
            ref={playBtnRef}
            onClick={isPlaying ? pause : play}
            disabled={!appReady}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className={`w-14 h-14 sm:w-16 sm:h-16 min-w-[44px] min-h-[44px] flex items-center justify-center bg-gray-900 text-white rounded-full hover:scale-105 active:scale-95 transition-transform shadow-[0_0_20px_rgba(0,0,0,0.1)] ${!appReady ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isBuffering ? (
              <Loader2 size={28} className="animate-spin" />
            ) : isPlaying ? (
              <Pause size={32} fill="currentColor" />
            ) : (
              <Play size={32} fill="currentColor" className="ml-1" />
            )}
          </button>
          
          <button 
            onClick={next}
            disabled={!appReady}
            aria-label="Next track"
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-800 hover:text-red-600 transition-colors p-2 ${!appReady ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <SkipForward size={28} fill="currentColor" />
          </button>
        </div>
        
        <button 
          onClick={toggleRepeat} 
          disabled={!appReady}
          aria-label={`Repeat mode: ${repeatMode}`}
          className={`min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors p-2 ${repeatMode !== 'off' ? 'text-red-600 drop-shadow-md' : 'text-gray-600 hover:text-red-600'} ${!appReady ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {repeatMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
        </button>
      </div>

    </div>
  );
}
