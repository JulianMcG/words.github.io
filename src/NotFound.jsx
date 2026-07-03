import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const SERIF = '"Averia Serif Libre", Georgia, serif';

// Sits normal (solid, no stroke) at rest. On hover, a radial goop emanates
// from the cursor — letters nearest it thicken with a page-coloured stroke
// that eats into the glyph, fading back to normal with distance.
const GoopDigits = () => {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const letters = [...root.querySelectorAll('.nf-goop-letter')];
    let rects = [];
    let base = 16;
    const reset = () => letters.forEach(s => { s.style.webkitTextStrokeWidth = '0px'; });
    const upd = () => {
      base = parseFloat(getComputedStyle(root).fontSize) * 0.09;
      rects = letters.map(s => { const r = s.getBoundingClientRect(); return { s, cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; });
    };
    const onMove = (e) => {
      for (const { s, cx, cy } of rects) {
        const d = Math.hypot(e.clientX - cx, e.clientY - cy);
        const t = Math.max(0, 1 - d / 220);
        s.style.webkitTextStrokeWidth = `${(base * t * t).toFixed(2)}px`;
      }
    };
    const onEnter = () => { upd(); document.addEventListener('mousemove', onMove); };
    const onLeave = () => { document.removeEventListener('mousemove', onMove); reset(); };
    reset();
    root.addEventListener('mouseenter', onEnter);
    root.addEventListener('mouseleave', onLeave);
    window.addEventListener('resize', upd);
    return () => {
      root.removeEventListener('mouseenter', onEnter);
      root.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', upd);
    };
  }, []);
  return (
    <p
      ref={ref}
      className="nf-goop select-none leading-none text-[clamp(6rem,22vw,13rem)] text-[var(--color-bg-hover-strong)]"
      style={{ fontFamily: SERIF, fontWeight: 700, letterSpacing: '-0.06em' }}
      aria-hidden="true"
    >
      {[...'404'].map((c, i) => <span key={i} className="nf-goop-letter">{c}</span>)}
    </p>
  );
};

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] flex flex-col items-center justify-center px-6 text-center">
      <GoopDigits />
      <h1
        className="mt-2 text-[1.6rem] sm:text-[2rem]"
        style={{ fontFamily: SERIF, fontWeight: 700, letterSpacing: '-0.04em' }}
      >
        This page wandered off.
      </h1>
      <p className="mt-3 text-[14px] text-[var(--color-text-muted)] max-w-sm">
        Whatever was here isn&rsquo;t anymore — or never was. Your notes are safe where you left them.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] active:bg-[var(--color-bg-hover-strong)] rounded-md px-3 py-2 transition-all duration-150 select-none"
        >
          <ArrowLeft size={13} className="shrink-0 group-hover:-translate-x-0.5 transition-transform duration-150" />
          Back home
        </button>
        <span className="btn-land-wrap">
          <button
            onClick={() => navigate('/documents')}
            className="btn-land group inline-flex items-center gap-1.5 text-[13px] font-semibold rounded-lg px-4 py-2 select-none"
          >
            Open Words
            <ArrowRight size={13} className="shrink-0 group-hover:translate-x-0.5 transition-transform duration-150" />
          </button>
        </span>
      </div>
    </div>
  );
}
