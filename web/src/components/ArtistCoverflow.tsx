import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type CSSProperties,
} from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ArtistSlide {
  image: string;
  name: string;
  query: string;
}

interface ArtistCoverflowProps {
  artists: ArtistSlide[];
  onArtistClick: (id: string | null, name: string) => void;
  cardWidth?: number;
  cardHeight?: number;
  radius?: number;
  tilt?: number;
  sideTilt?: number;
  gap?: number;
  opacity?: number;
}

const PERSPECTIVE = 1600;
const SCALE_STEP = 0.16;
const MAX_VISIBLE = 2;
const DEPTH = 240;
const TRANSITION = 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1)';

export function ArtistCoverflow({
  artists,
  onArtistClick,
  cardWidth = 280,
  cardHeight = 340,
  radius = 12,
  tilt = 12,
  sideTilt = 8,
  gap = 8,
  opacity = 60,
}: ArtistCoverflowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const lockRef = useRef(false);
  const n = artists.length;

  // Autoplay functionality: auto cycles slides every 4.5 seconds when user is not hovering
  useEffect(() => {
    if (hovered || n <= 1) return;
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % n);
    }, 4500);
    return () => clearInterval(interval);
  }, [n, hovered]);

  useEffect(() => {
    setActive((a) => Math.max(0, Math.min(n - 1, a)));
  }, [n]);

  const dragStart = useRef<number | null>(null);
  const dragMoved = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || n <= 1) return;

    // Trackpad and mouse scroll/wheel listener
    const onWheelNative = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 6) return;

      e.preventDefault();
      e.stopPropagation();

      if (lockRef.current) return;
      lockRef.current = true;
      setTimeout(() => { lockRef.current = false; }, 200);

      const dir = delta > 0 ? 1 : -1;
      setActive((prev) => (((prev + dir) % n) + n) % n);
    };

    const onMouseDown = (e: MouseEvent) => {
      dragStart.current = e.clientX;
      dragMoved.current = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (dragStart.current === null) return;
      const diffX = e.clientX - dragStart.current;
      if (Math.abs(diffX) > 8) {
        dragMoved.current = true;
      }
      if (Math.abs(diffX) > 55) {
        if (lockRef.current) return;
        lockRef.current = true;
        setTimeout(() => { lockRef.current = false; }, 250);

        const dir = diffX > 0 ? -1 : 1;
        setActive((prev) => (((prev + dir) % n) + n) % n);
        dragStart.current = e.clientX;
      }
    };

    const onMouseUp = () => {
      dragStart.current = null;
    };

    el.addEventListener('wheel', onWheelNative, { passive: false });
    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mouseleave', onMouseUp);

    return () => {
      el.removeEventListener('wheel', onWheelNative);
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mouseleave', onMouseUp);
    };
  }, [active, n]);

  const handleCardClick = useCallback(
    (i: number, query: string) => {
      if (dragMoved.current) {
        dragMoved.current = false;
        return;
      }
      if (lockRef.current) return;
      lockRef.current = true;
      window.setTimeout(() => { lockRef.current = false; }, 600);

      if (i === active) {
        onArtistClick(null, query);
      } else {
        setActive(i);
      }
    },
    [active, onArtistClick],
  );

  const effectiveRadius =
    (Math.max(0, Math.min(20, radius)) / 20) * (Math.min(cardWidth, cardHeight) / 2);
  const dim = 1 - Math.max(0, Math.min(100, opacity)) / 100;

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        width: '100%',
        height: `${cardHeight + 40}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: `${PERSPECTIVE}px`,
        overflow: 'hidden',
        outline: 'none',
      }}
      tabIndex={0}
      role="group"
      aria-roledescription="carousel"
      aria-label="Featured artists"
    >
      {/* Floating navigation chevrons for desktop */}
      {hovered && n > 1 && (
        <>
          <button
            onClick={() => setActive((prev) => (((prev - 1) % n) + n) % n)}
            style={{
              position: 'absolute',
              left: '24px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'rgba(15, 12, 30, 0.75)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              transition: 'background 0.2s, border-color 0.2s, transform 0.2s',
              zIndex: 40,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent)';
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(15, 12, 30, 0.75)';
              e.currentTarget.style.borderColor = 'var(--border-medium)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setActive((prev) => (prev + 1) % n)}
            style={{
              position: 'absolute',
              right: '24px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'rgba(15, 12, 30, 0.75)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              transition: 'background 0.2s, border-color 0.2s, transform 0.2s',
              zIndex: 40,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent)';
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(15, 12, 30, 0.75)';
              e.currentTarget.style.borderColor = 'var(--border-medium)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      <div
        style={{
          position: 'relative',
          width: cardWidth,
          height: cardHeight,
          transformStyle: 'preserve-3d',
        }}
      >
        {artists.map((artist, i) => {
          let rel = i - active;
          if (rel > n / 2) rel -= n;
          if (rel < -n / 2) rel += n;

          const ax = Math.abs(rel);
          const visible = ax <= MAX_VISIBLE;
          const isActive = rel === 0;
          const sc = Math.max(0.4, 1 - ax * SCALE_STEP);
          const tx = rel * (gap * 30);
          const tz = -ax * DEPTH;
          const ry = -rel * tilt;
          const rz = rel * sideTilt;

          const cardStyle: CSSProperties = {
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: cardWidth,
            height: cardHeight,
            borderRadius: effectiveRadius,
            overflow: 'hidden',
            transformStyle: 'preserve-3d',
            transformOrigin: 'center center',
            transform: `translate(-50%, -50%) translateX(${tx}px) translateZ(${tz}px) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${sc})`,
            transition: TRANSITION,
            opacity: visible ? 1 : 0,
            cursor: isActive ? 'pointer' : 'default',
            pointerEvents: visible ? 'auto' : 'none',
            backgroundColor: '#17132e',
            boxShadow: isActive
              ? '0 0 40px var(--accent-glow), 0 0 80px var(--magenta-glow), 0 16px 48px rgba(0,0,0,0.55)'
              : '0 8px 24px rgba(0,0,0,0.4)',
          };

          return (
            <div
              key={artist.name}
              style={cardStyle}
              onClick={() => handleCardClick(i, artist.query)}
              aria-label={artist.name}
              aria-hidden={!visible}
            >
              <img
                src={artist.image}
                alt={artist.name}
                draggable={false}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  userSelect: 'none',
                }}
              />

              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(8,6,15,0.85) 100%)',
                  pointerEvents: 'none',
                }}
              />

              <div
                style={{
                  position: 'absolute',
                  left: 22,
                  right: 22,
                  bottom: 24,
                  pointerEvents: 'none',
                }}
              >
                <span
                  style={{
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font)',
                    fontSize: 26,
                    fontWeight: 700,
                    lineHeight: '1.1em',
                    letterSpacing: '-0.02em',
                    textShadow: '0 2px 10px rgba(0,0,0,0.4)',
                  }}
                >
                  {artist.name}
                </span>
              </div>

              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: '#000',
                  opacity: isActive ? 0 : dim,
                  transition: 'opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                  pointerEvents: 'none',
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
