import { Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Repeat1 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { usePlayer } from '../context/PlayerContext';

export default function PlayerControls() {
  const {
    isPlaying,
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

  // Sync seek bar progress locally to avoid global re-renders
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          setCurrentTime(playerRef.current.getCurrentTime() || 0);
        }
      }, 500); // 500ms for smoother visual bar update
    } else {
      if (interval) clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playerRef]);

  const playBtnRef = useRef(null);

  // Animate play/pause button on state change
  useEffect(() => {
    if (playBtnRef.current) {
      gsap.fromTo(playBtnRef.current, 
        { scale: 0.8 }, 
        { scale: 1, duration: 0.3, ease: 'back.out(1.7)' }
      );
    }
  }, [isPlaying]);

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full flex flex-col items-center gap-3 sm:gap-4 mt-6 sm:mt-8">
      {/* Progress Bar */}
      <div className="w-full flex items-center justify-between gap-4 text-xs text-gray-500 font-medium">
        <span>{formatTime(currentTime)}</span>
        <div 
          className="flex-1 h-1.5 bg-black/10 rounded-full cursor-pointer relative group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            seekTo(pos * duration);
          }}
        >
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full transition-all duration-100 cursor-pointer"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
          {/* Knob */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md shadow-gray-400 cursor-pointer pointer-events-none"
            style={{ left: `calc(${duration > 0 ? (currentTime / duration) * 100 : 0}% - 6px)` }}
          />
        </div>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-between w-full px-2 mt-2">
        <button 
          onClick={toggleShuffle} 
          className={`transition-colors p-2 ${shuffle ? 'text-cyan-600 drop-shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
        >
          <Shuffle size={20} />
        </button>
        
        <div className="flex items-center gap-4 sm:gap-6">
          <button 
            onClick={prev}
            className="text-gray-800 hover:text-cyan-600 transition-colors p-2"
          >
            <SkipBack size={28} fill="currentColor" />
          </button>
          
          <button 
            ref={playBtnRef}
            onClick={isPlaying ? pause : play}
            className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center bg-gray-900 text-white rounded-full hover:scale-105 active:scale-95 transition-transform shadow-[0_0_20px_rgba(0,0,0,0.1)]"
          >
            {isPlaying ? (
              <Pause size={32} fill="currentColor" />
            ) : (
              <Play size={32} fill="currentColor" className="ml-1" />
            )}
          </button>
          
          <button 
            onClick={next}
            className="text-gray-800 hover:text-cyan-600 transition-colors p-2"
          >
            <SkipForward size={28} fill="currentColor" />
          </button>
        </div>
        
        <button 
          onClick={toggleRepeat} 
          className={`transition-colors p-2 ${repeatMode !== 'off' ? 'text-cyan-600 drop-shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
        >
          {repeatMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
        </button>
      </div>

    </div>
  );
}
