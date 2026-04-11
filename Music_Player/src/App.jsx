import TrackInfo from './components/TrackInfo';
import PlayerControls from './components/PlayerControls';
import { PlayerProvider } from './context/PlayerContext';

function AppContent() {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-50 flex items-center justify-center font-sans tracking-wide">
      {/* Main Glassmorphic Player Container */}
      <div className="relative z-10 w-11/12 max-w-md mx-auto h-[90vh] sm:h-[85vh] max-h-[800px] flex flex-col p-6 sm:p-8 bg-white/70 backdrop-blur-3xl border border-white/60 rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] transition-all duration-700">
        
        {/* Top Header */}
        <div className="flex justify-center items-center w-full mt-4 mb-4">
          <span className="text-xs font-bold tracking-[0.25em] text-gray-400 uppercase">Now Playing</span>
        </div>

        {/* Track Info (Poster Component) */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <TrackInfo />
        </div>

        {/* Player Controls (Timeline, Play buttons, Volume) */}
        <div className="pb-6">
          <PlayerControls />
        </div>

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
