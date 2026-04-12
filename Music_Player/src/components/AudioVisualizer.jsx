export default function AudioVisualizer({ isPlaying, color }) {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
      <div
        style={{
          background: color || '#8a2be2',
          opacity: 0.15,
          animation: isPlaying
            ? 'orb-pulse 2s ease-in-out infinite alternate'
            : 'orb-idle 4s ease-in-out infinite alternate',
          position: 'absolute'
        }}
        className="-top-20 -left-20 w-72 h-72 rounded-full blur-3xl transition-all duration-1000"
        aria-hidden="true"
      />
      <div
        style={{
          background: color || '#8a2be2',
          opacity: 0.2,
          animation: isPlaying
            ? 'orb-pulse 1.2s ease-in-out infinite alternate'
            : 'orb-idle 3s ease-in-out infinite alternate',
          position: 'absolute'
        }}
        className="bottom-[-5rem] right-[-5rem] w-48 h-48 sm:w-56 sm:h-56 rounded-full blur-3xl transition-all duration-1000"
        aria-hidden="true"
      />
    </div>
  );
}
