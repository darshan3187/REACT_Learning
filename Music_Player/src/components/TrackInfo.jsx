import { useRef, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';

export default function TrackInfo() {
  const { currentTrack, isBuffering } = usePlayer();
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // Animates the poster and text when a track changes
  useEffect(() => {
    if (!currentTrack) return;
    let mounted = true;
    let localCtx = null;

    // Optimization: lazy-load GSAP only when this animation is needed.
    import('gsap').then(({ default: gsap }) => {
      if (!mounted) return;

      localCtx = gsap.context(() => {
        // Fade out slightly then bounce in new poster.
        gsap.fromTo(imageRef.current,
          { scale: 0.9, opacity: 0.5, rotationY: 15 },
          { scale: 1, opacity: 1, rotationY: 0, duration: 0.8, ease: 'elastic.out(1, 0.75)' }
        );

        // Slide up text items staggered.
        gsap.fromTo('.track-text',
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
        );
      }, containerRef);
    });

    return () => {
      mounted = false;
      if (localCtx) localCtx.revert();
    };
  }, [currentTrack]);

  if (!currentTrack) {
    return (
      <div className="flex flex-col items-center w-full mt-4 animate-pulse">
        <div className="w-full max-w-[280px] sm:max-w-[340px] aspect-video mb-6 bg-gray-200 rounded-2xl" />
        <div className="h-8 w-48 bg-gray-200 rounded-full mb-2" />
        <div className="h-5 w-32 bg-gray-200 rounded-full" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col items-center w-full mt-4">
      {/* Poster with soft glow based on track color */}
      <div className="relative w-full max-w-[280px] sm:max-w-[340px] aspect-video mb-6 sm:mb-8 perspective-1000">
        <div 
          className="absolute inset-0 blur-2xl opacity-40 transition-colors duration-1000"
          style={{ backgroundColor: currentTrack.color || '#a855f7' }}
        />
        <img 
          ref={imageRef}
          src={currentTrack.poster} 
          alt={currentTrack.title}
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          width="340"
          height="191"
          className={`w-full h-full object-cover rounded-2xl shadow-2xl relative z-10 block transition-opacity ${isBuffering ? 'animate-pulse opacity-70' : 'opacity-100'}`}
        />
      </div>

      {/* Title & Artist */}
      <div className="text-center px-4 w-full">
        <h2 className="track-text text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 truncate">
          {currentTrack.title}
        </h2>
        <p className="track-text text-base sm:text-lg text-gray-600 truncate">
          {currentTrack.artist}
        </p>
      </div>
    </div>
  );
}
