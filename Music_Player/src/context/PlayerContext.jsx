import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { tracks } from '../data';

const PlayerContext = createContext();

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }) => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  
  const [volume, setVolume] = useState(1); // 0 to 1
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off', 'all', 'one'

  const playerRef = useRef(null);
  const isReadyRef = useRef(false);
  const intervalRef = useRef(null);
  const initialTrackRef = useRef(true);

  const currentTrack = tracks[currentTrackIndex];

  // TASK 1: Initialize YouTube IFrame API properly
  useEffect(() => {
    // Only load script once globally
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    // Assign global callback
    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player('yt-player-container', {
        height: '10',
        width: '10',
        videoId: tracks[0].youtubeId,
        playerVars: {
          controls: 0,
          disablekb: 1,
          showinfo: 0,
          rel: 0,
          autoplay: 0, // important
          playsinline: 1
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange
        }
      });
    };

    // If fast refresh and API was already loaded
    if (window.YT && window.YT.Player && !playerRef.current) {
        window.onYouTubeIframeAPIReady();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, []);

  const onPlayerReady = (event) => {
    isReadyRef.current = true;
    
    // TASK 2: AUTO FETCH DURATION
    // Sometimes it takes a moment to fetch duration initially
    const dur = event.target.getDuration();
    if (dur) setDuration(dur);

    // Apply init volume
    event.target.setVolume(volume * 100);
    if (isMuted) event.target.mute();
  };

  const onPlayerStateChange = (event) => {
    // TASK 1: Handle state changes precisely
    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      
      // Update duration securely when true playing starts
      const currentDur = event.target.getDuration();
      if (currentDur && currentDur !== duration) {
        setDuration(currentDur);
      }
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      setIsPlaying(false);
    } else if (event.data === window.YT.PlayerState.ENDED) {
      // Auto play next song when current ends
      handleSongEnd();
    }
  };

  const handleSongEnd = () => {
      if (repeatMode === 'one') {
          if (playerRef.current) {
            playerRef.current.seekTo(0);
            playerRef.current.playVideo();
          }
      } else if (repeatMode === 'all') {
          next();
      } else if (currentTrackIndex === tracks.length - 1 && repeatMode === 'off') {
          setIsPlaying(false);
          if (playerRef.current) playerRef.current.seekTo(0);
      } else {
          next();
      }
  };

  // Re-load video correctly when current track state changes
  useEffect(() => {
    if (initialTrackRef.current) {
      initialTrackRef.current = false;
      return; // Skip loadVideoById on absolute first render, the constructor handled it
    }
    if (isReadyRef.current && playerRef.current && currentTrack) {
       // TASK 1: To change songs, use loadVideoById NOT destroying player
       playerRef.current.loadVideoById(currentTrack.youtubeId);
       
       // Reset duration because new song started
       setDuration(0);

       if (isPlaying) {
         playerRef.current.playVideo(); // Force play if it was already playing
       }
    }
  }, [currentTrackIndex]);

  // Handle Play/Pause logic changes
  useEffect(() => {
    if (isReadyRef.current && playerRef.current) {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    }
  }, [isPlaying]);

  // Apply volume changes
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


  // --- TASK 4: FULL PLAYBACK EXTERNAL CONTROLS ---

  const play = () => setIsPlaying(true);
  const pause = () => setIsPlaying(false);

  const next = () => {
    if (shuffle) {
      const remainingTracks = tracks.filter((_, i) => i !== currentTrackIndex);
      const randTrack = remainingTracks[Math.floor(Math.random() * remainingTracks.length)];
      setCurrentTrackIndex(tracks.indexOf(randTrack));
    } else {
      setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
    }
    setIsPlaying(true);
  };

  const prev = () => {
    // If playing for > 3 seconds, previous goes to start of current song
    const curr = (isReadyRef.current && playerRef.current) ? playerRef.current.getCurrentTime() : 0;
    if (curr > 3 && isReadyRef.current && playerRef.current) {
      playerRef.current.seekTo(0, true);
    } else {
      // Otherwise skip to prev
      setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
      setIsPlaying(true);
    }
  };

  const seekTo = (seconds) => {
    if (isReadyRef.current && playerRef.current) {
      // Seek with allowSeekAhead = true
      playerRef.current.seekTo(seconds, true); 
    }
  };

  const toggleShuffle = () => setShuffle(!shuffle);
  
  const toggleRepeat = () => {
    const modes = ['off', 'all', 'one'];
    const nextIdx = (modes.indexOf(repeatMode) + 1) % modes.length;
    setRepeatMode(modes[nextIdx]);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack, isPlaying, duration, volume, isMuted,
        shuffle, repeatMode, play, pause, next, prev, seekTo, setVolume,
        setIsMuted, toggleShuffle, toggleRepeat, playerRef
      }}
    >
      {children}
      
      {/* 
        TASK 1: Always in DOM with display:none. 
        Will not unmount conditionally! 
      */}
      <div style={{ display: 'none' }}>
        <div id="yt-player-container"></div>
      </div>
    </PlayerContext.Provider>
  );
};
