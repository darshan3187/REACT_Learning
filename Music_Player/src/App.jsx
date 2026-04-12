import { lazy, Suspense, useState } from 'react';
import { ListMusic } from 'lucide-react';
import AudioVisualizer from './components/AudioVisualizer';
import TrackInfo from './components/TrackInfo';
import PlayerControls from './components/PlayerControls';
import { PlayerProvider, usePlayer } from './context/PlayerContext';

const TrackDrawer = lazy(() => import('./components/TrackDrawer'));

function AppContent() {
  const { currentTrack, isPlaying } = usePlayer();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hasOpenedDrawer, setHasOpenedDrawer] = useState(false);

  return (
    <div className="relative w-full min-h-[100dvh] overflow-x-hidden bg-gray-50 flex items-center justify-center font-sans tracking-wide px-3 py-3 sm:px-6 sm:py-6">
      {/* Main Glassmorphic Player Container */}
      <AudioVisualizer isPlaying={isPlaying} color={currentTrack?.color} />
      <div className="relative z-10 w-full max-w-md mx-auto h-[min(94dvh,820px)] sm:h-[min(85dvh,800px)] flex flex-col p-4 sm:p-8 bg-white/70 backdrop-blur-3xl border border-white/60 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] transition-all duration-700">
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {isPlaying && currentTrack ? `Now playing: ${currentTrack.title} by ${currentTrack.artist || 'Unknown Artist'}` : ''}
        </div>

        <button
          onClick={() => {
            setHasOpenedDrawer(true);
            setDrawerOpen(true);
          }}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 min-w-[44px] min-h-[44px] p-2 rounded-full glass-button flex items-center justify-center"
          aria-label="Open queue"
        >
          <ListMusic size={18} />
        </button>
        
        {/* Top Header */}
        <div className="flex justify-center items-center w-full mt-2 sm:mt-4 mb-2 sm:mb-4">
          <span className="text-xs font-bold tracking-[0.25em] text-gray-500 uppercase">Now Playing</span>
        </div>

        {/* Track Info (Poster Component) */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <TrackInfo />
        </div>

        {/* Player Controls (Timeline + transport) */}
        <div className="pb-3 sm:pb-6">
          <PlayerControls />
        </div>

        {hasOpenedDrawer && (
          <Suspense fallback={null}>
            <TrackDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
          </Suspense>
        )}

      </div>
    </div>
  );
}

function App() {
  return (
    <PlayerProvider>
      <AppContent />
    </PlayerProvider>
  );
}

export default App;
