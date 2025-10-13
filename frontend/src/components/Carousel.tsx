import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Carousel.css';

type Props = {
  children: React.ReactNode[];
  initialIndex?: number;
  autoplayMs?: number | null;
  teamId?: number | null;
};

const Carousel: React.FC<Props> = ({ children, initialIndex = 0, autoplayMs = null, teamId = null }) => {
  const navigate = useNavigate();
  const slides = React.Children.toArray(children);
  const [index, setIndex] = useState<number>(Math.max(0, Math.min(initialIndex, Math.max(0, slides.length - 1))));
  const autoplayRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const startXRef = useRef<number | null>(null);
  const deltaXRef = useRef<number>(0);

  const go = (delta: number) => {
    setIndex((prev) => {
      const next = (prev + delta + slides.length) % slides.length;
      return next;
    });
  };

  useEffect(() => {
    if (!autoplayMs) return;
    autoplayRef.current && window.clearInterval(autoplayRef.current);
    autoplayRef.current = window.setInterval(() => go(1), autoplayMs);
    return () => {
      if (autoplayRef.current) window.clearInterval(autoplayRef.current);
    };
  }, [autoplayMs, slides.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Basic touch drag/swipe
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      startXRef.current = e.touches[0].clientX;
      deltaXRef.current = 0;
      el.classList.add('dragging');
    };
    const onTouchMove = (e: TouchEvent) => {
      if (startXRef.current == null) return;
      deltaXRef.current = e.touches[0].clientX - startXRef.current;
    };
    const onTouchEnd = () => {
      el.classList.remove('dragging');
      if (Math.abs(deltaXRef.current) > 60) {
        go(deltaXRef.current < 0 ? 1 : -1);
      }
      startXRef.current = null;
      deltaXRef.current = 0;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart as any);
      el.removeEventListener('touchmove', onTouchMove as any);
      el.removeEventListener('touchend', onTouchEnd as any);
    };
  }, []);

  const getRelativeOffset = (i: number, active: number, len: number) => {
    const direct = i - active;
    const wrapLeft = i - active - len;
    const wrapRight = i - active + len;
    let rel = direct;
    if (Math.abs(wrapLeft) < Math.abs(rel)) rel = wrapLeft;
    if (Math.abs(wrapRight) < Math.abs(rel)) rel = wrapRight;
    return rel;
  };

  return (
    <div className="carousel" ref={containerRef}>
      <div className="carousel-viewport">
        <div className="carousel-layer">
          {slides.map((child, i) => {
            const rel = getRelativeOffset(i, index, slides.length);
            const abs = Math.abs(rel);
            const clamped = Math.min(abs, 3);
            const baseX = 160; // px spacing
            const x = rel * baseX;
            const scale = rel === 0 ? 1 : (1 - 0.15 * clamped);
            const opacity = 1 - 0.15 * clamped;
            const zIndex = 100 - clamped;
            const style: React.CSSProperties = {
              transform: `translate(-50%, -50%) translateX(${x}px) scale(${scale})`,
              opacity,
              zIndex,
              pointerEvents: rel === 0 ? 'auto' : 'none'
            };
            return (
              <div className={`carousel-slide pyramid${rel === 0 ? ' active' : ''}`} key={i} style={style} onClick={() => setIndex(i)}>
                {child}
              </div>
            );
          })}

      <button className="carousel-btn prev" onClick={() => go(-1)} aria-label="Previous">‹</button>
      <button className="carousel-btn next" onClick={() => go(1)} aria-label="Next">›</button>

        </div>
      </div>

      <button 
        className='myTeam'
        onClick={() => {
          if (teamId) {
            navigate(`/teams/${teamId}`);
          }
        }}
        disabled={!teamId}
      >
        View full team
      </button>
    </div>
  );
};

export default Carousel;


