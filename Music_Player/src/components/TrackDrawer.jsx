import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EllipsisVertical, GripVertical, ListMusic, Search, X } from 'lucide-react';
import gsap from 'gsap';
import { usePlayer } from '../context/PlayerContext';

const toRgba = (hex, alpha = 0.1) => {
  if (!hex || typeof hex !== 'string') return `rgba(14, 165, 233, ${alpha})`;

  const normalized = hex.replace('#', '');
  const full = normalized.length === 3
    ? normalized.split('').map((c) => c + c).join('')
    : normalized;

  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);

  if ([r, g, b].some((n) => Number.isNaN(n))) {
    return `rgba(14, 165, 233, ${alpha})`;
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const formatDuration = (seconds) => {
  if (!seconds || Number.isNaN(seconds)) return '--:--';
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
};

const HighlightedText = ({ text, query }) => {
  if (!query) return <>{text}</>;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'ig');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, idx) => {
        const isMatch = part.toLowerCase() === query.toLowerCase();
        return isMatch
          ? <mark key={`${part}-${idx}`} className="bg-cyan-200/70 text-gray-900 rounded px-0.5">{part}</mark>
          : <span key={`${part}-${idx}`}>{part}</span>;
      })}
    </>
  );
};

export default function TrackDrawer({ isOpen, onClose }) {
  const {
    queue,
    currentTrack,
    currentTrackIndex,
    isPlaying,
    preloadTrack,
    playTrack,
    playNext,
    addToEnd,
    removeFromQueue,
    reorderQueue,
    shuffleQueue,
    getTrackDuration
  } = usePlayer();

  const [search, setSearch] = useState('');
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const drawerRef = useRef(null);
  const backdropRef = useRef(null);
  const dragItem = useRef(null);
  const itemRefs = useRef({});
  const hoverTimeoutRef = useRef(null);

  const preloadPoster = useCallback((track) => {
    if (!track) return;
    const img = new Image();
    img.src = track.poster || `https://i.ytimg.com/vi/${track.youtubeId}/hqdefault.jpg`;
  }, []);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return queue
      .map((track, index) => ({ track, index }))
      .filter(({ track }) => {
        if (!q) return true;
        const inTitle = (track.title || '').toLowerCase().includes(q);
        const inArtist = (track.artist || '').toLowerCase().includes(q);
        return inTitle || inArtist;
      });
  }, [queue, search]);

  const getEntranceFrom = useCallback(() => {
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    return isDesktop
      ? { x: '100%', y: '0%', opacity: 0 }
      : { y: '100%', x: '0%', opacity: 0 };
  }, []);

  useEffect(() => {
    if (!drawerRef.current || !backdropRef.current) return;

    if (isOpen) {
      const from = getEntranceFrom();
      gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      gsap.fromTo(drawerRef.current, from, { x: '0%', y: '0%', opacity: 1, duration: 0.4, ease: 'power3.out' });
    } else {
      const exitTo = getEntranceFrom();
      gsap.to(backdropRef.current, { opacity: 0, duration: 0.2 });
      gsap.to(drawerRef.current, { ...exitTo, duration: 0.3, ease: 'power2.in' });
    }
  }, [getEntranceFrom, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };

    const handleOutsideMenu = (event) => {
      const target = event.target;
      const clickedMenu = target.closest('[data-menu-root="true"]');
      const clickedButton = target.closest('[data-menu-button="true"]');
      if (!clickedMenu && !clickedButton) setOpenMenuIndex(null);
    };

    window.addEventListener('keydown', handleEscape);
    window.addEventListener('mousedown', handleOutsideMenu);

    return () => {
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('mousedown', handleOutsideMenu);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !drawerRef.current) return;

    const focusable = drawerRef.current.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const trap = (event) => {
      if (event.key !== 'Tab') return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', trap);
    first.focus();

    return () => {
      document.removeEventListener('keydown', trap);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || search.trim()) return;

    const timer = setTimeout(() => {
      itemRefs.current[currentTrackIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 120);

    return () => clearTimeout(timer);
  }, [currentTrackIndex, isOpen, search, queue.length]);

  useEffect(() => {
    if (!isOpen) return;

    queue.slice(0, 20).forEach(preloadPoster);

    const firstVisible = queue.find((_, i) => i !== currentTrackIndex);
    if (firstVisible?.youtubeId) preloadTrack(firstVisible.youtubeId);
  }, [currentTrackIndex, isOpen, preloadPoster, preloadTrack, queue]);

  useEffect(() => () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  }, []);

  const handleDragStart = (event, index) => {
    dragItem.current = index;
    setDraggingIndex(index);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (event, index) => {
    event.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (event, index) => {
    event.preventDefault();
    const fromIndex = dragItem.current;

    if (fromIndex !== null) reorderQueue(fromIndex, index);

    dragItem.current = null;
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    dragItem.current = null;
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div
      ref={backdropRef}
      className={`absolute inset-0 z-50 bg-black/20 backdrop-blur-sm ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      onMouseDown={(event) => {
        if (isOpen && event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        ref={drawerRef}
        className="absolute inset-x-0 bottom-0 md:inset-y-4 md:right-4 md:left-auto w-full md:w-[420px] max-h-[80vh] md:max-h-[calc(100%-2rem)] bg-white/80 backdrop-blur-2xl border border-white/60 rounded-t-3xl md:rounded-3xl shadow-xl flex flex-col overflow-hidden"
        style={{ WebkitOverflowScrolling: 'touch' }}
        aria-label="Queue drawer"
      >
        <div className="md:hidden pt-3">
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
        </div>

        <header className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-black/10">
          <div className="flex items-center gap-2 text-gray-900 font-semibold">
            <ListMusic size={18} />
            <span className="text-base font-semibold">Queue</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-button min-h-[44px] text-sm font-semibold text-gray-700 cursor-pointer active:scale-95 transition-all duration-150 hover:text-gray-900"
              aria-label="Cancel queue"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        <div className="px-4 sm:px-5 pt-4">
          <label className="relative flex items-center">
            <Search size={16} className="pointer-events-none absolute left-3 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search songs..."
              aria-label="Search queue"
              className="w-full h-9 rounded-xl bg-black/5 pl-9 pr-9 border-0 outline-none text-sm text-gray-700 placeholder:text-gray-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 min-w-[44px] min-h-[44px] p-2.5 rounded-full text-gray-400 hover:text-gray-600 cursor-pointer active:scale-95 transition-all duration-150"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </label>
        </div>

        <section className="px-4 sm:px-5 mt-4 mb-2">
          <h3 className="text-xs font-semibold tracking-widest uppercase text-gray-400">Now Playing</h3>
          {currentTrack ? (
            <div
              className="rounded-2xl border px-3 py-2 mt-2"
              style={{
                borderColor: currentTrack.color || 'rgba(14, 165, 233, 0.4)',
                background: `linear-gradient(135deg, ${toRgba(currentTrack.color, 0.2)}, rgba(255,255,255,0.75))`
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <img src={currentTrack.poster} alt={currentTrack.title} loading="lazy" decoding="async" width="40" height="40" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 shadow-sm" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate text-gray-900" style={{ color: currentTrack.color || '#0891b2' }}>{currentTrack.title}</p>
                  <p className="text-xs text-gray-500 truncate">{currentTrack.artist || 'Unknown Artist'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-black/10 bg-white/60 px-3 py-3 mt-2 text-sm text-gray-600">Queue is empty</div>
          )}
        </section>

        <section className="px-4 sm:px-5 pt-0 pb-4 flex-1 min-h-0 flex flex-col">
          <h3 className="text-xs font-semibold tracking-widest uppercase text-gray-400 mt-4 mb-2">Up Next</h3>

          {!filteredItems.length && (
            <div className="rounded-2xl border border-dashed border-black/10 py-8 text-center text-sm text-gray-600">No results</div>
          )}

          <ul role="list" aria-label="Queue" className="flex-1 overflow-y-auto pr-1 space-y-2">
            {filteredItems.map(({ track, index }) => {
              const isCurrent = index === currentTrackIndex;
              const isDragging = draggingIndex === index;
              const isDropTarget = dragOverIndex === index && draggingIndex !== index;

              return (
                <li
                  key={`${track.id}-${index}`}
                  role="listitem"
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  draggable={true}
                  onDragStart={(event) => handleDragStart(event, index)}
                  onDragOver={(event) => handleDragOver(event, index)}
                  onDrop={(event) => handleDrop(event, index)}
                  onDragEnd={handleDragEnd}
                  onMouseEnter={(event) => {
                    gsap.to(event.currentTarget, { x: 4, duration: 0.15 });
                    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                    hoverTimeoutRef.current = setTimeout(() => preloadTrack(track.youtubeId), 300);
                    preloadPoster(track);
                  }}
                  onMouseLeave={(event) => {
                    gsap.to(event.currentTarget, { x: 0, duration: 0.15 });
                    if (hoverTimeoutRef.current) {
                      clearTimeout(hoverTimeoutRef.current);
                      hoverTimeoutRef.current = null;
                    }
                  }}
                  onTouchStart={() => preloadTrack(track.youtubeId)}
                  className={`relative group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors cursor-pointer active:bg-black/10 ${isCurrent ? 'border-l-[3px]' : 'border border-black/5 hover:bg-black/5'} ${isDragging ? 'opacity-50' : ''}`}
                  style={isCurrent
                    ? {
                      borderColor: track.color || 'rgba(14,165,233,0.4)',
                      borderLeftColor: track.color || 'rgba(14,165,233,0.4)',
                      backgroundColor: toRgba(track.color, 0.05),
                      paddingLeft: '13px'
                    }
                    : undefined}
                >
                  {isDropTarget && <div className="absolute top-0 left-3 right-3 h-0.5 rounded-full bg-cyan-500" />}

                  <button
                    onClick={() => playTrack(index)}
                    aria-label={`Play ${track.title} by ${track.artist || 'Unknown Artist'}`}
                    aria-current={isCurrent ? 'true' : undefined}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 text-center text-gray-300 group-hover:text-gray-500 transition-colors cursor-grab" aria-hidden="true">
                        <GripVertical size={16} />
                      </span>

                      <div className="w-6 text-center text-xs text-gray-400 font-medium flex-shrink-0" aria-hidden="true">
                        {isCurrent ? (
                          <div className="flex items-end justify-center gap-0.5" style={{ color: track.color || '#0891b2' }}>
                            <span className="eq-bar" style={{ '--dur': '0.4s', animationPlayState: isPlaying ? 'running' : 'paused' }} />
                            <span className="eq-bar" style={{ '--dur': '0.6s', animationPlayState: isPlaying ? 'running' : 'paused' }} />
                            <span className="eq-bar" style={{ '--dur': '0.5s', animationPlayState: isPlaying ? 'running' : 'paused' }} />
                          </div>
                        ) : (
                          index + 1
                        )}
                      </div>

                      <img src={track.poster} alt={track.title} loading="lazy" decoding="async" width="40" height="40" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />

                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium truncate ${isCurrent ? '' : 'text-gray-900'}`} style={isCurrent ? { color: track.color || '#0891b2' } : undefined}>
                          <HighlightedText text={track.title} query={search.trim()} />
                        </p>
                        <p className="text-xs text-gray-500 truncate">{track.artist || 'Unknown Artist'}</p>
                      </div>

                      <span className="ml-auto flex-shrink-0 text-xs text-gray-400 tabular-nums">{formatDuration(getTrackDuration(track))}</span>
                    </div>
                  </button>

                  <div className="absolute right-2 top-1/2 -translate-y-1/2" data-menu-root="true">
                    <button
                      data-menu-button="true"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenMenuIndex((prev) => (prev === index ? null : index));
                      }}
                      className={`p-1.5 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer active:scale-95 duration-150 ${openMenuIndex === index ? 'opacity-100 bg-black/5' : 'opacity-0 group-hover:opacity-100'}`}
                      aria-label={`Options for ${track.title}`}
                    >
                      <EllipsisVertical size={16} className="text-gray-700" />
                    </button>

                    {openMenuIndex === index && (
                      <div className="absolute right-0 top-10 w-44 bg-white shadow-xl rounded-xl border border-black/5 py-1 z-20" onClick={(event) => event.stopPropagation()}>
                        <button className="w-full text-left px-3 py-2 text-sm hover:bg-black/5 min-h-[44px]" onClick={() => { playTrack(index); setOpenMenuIndex(null); }}>Play now</button>
                        <button className="w-full text-left px-3 py-2 text-sm hover:bg-black/5 min-h-[44px]" onClick={() => { playNext(track); setOpenMenuIndex(null); }}>Play next</button>
                        <button className="w-full text-left px-3 py-2 text-sm hover:bg-black/5 min-h-[44px]" onClick={() => { addToEnd(track); setOpenMenuIndex(null); }}>Add to end of queue</button>
                        <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 min-h-[44px]" onClick={() => { removeFromQueue(index); setOpenMenuIndex(null); }}>Remove from queue</button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <footer className="px-5 pb-4 pt-2 border-t border-black/10 flex items-center gap-2">
          <button onClick={shuffleQueue} className="flex-1 py-2 text-sm rounded-xl glass-button min-h-[44px]" aria-label="Shuffle all">Shuffle All</button>
        </footer>
      </aside>
    </div>
  );
}
