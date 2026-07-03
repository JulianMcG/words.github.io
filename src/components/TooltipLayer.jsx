import React, { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Delegated tooltip system: any element with a `title` attribute gets the
// styled tooltip instead of the browser-native one. On first hover the title
// is promoted to data-tip (removing the attribute suppresses the native
// tooltip); React re-adds title only when its value changes, which re-promotes.
//
// Title format: "Label" or "Label||⌘ K" — the part after || renders as
// skeuomorphic keyboard keys that press down left-to-right on appear.
//
// The bubble matches the theme (light in light mode, dark in dark mode) and
// slides sideways when near a viewport edge while the tail stays anchored to
// the hovered element.
//
// Elements inside .editor-content are skipped — the editor's innerHTML is
// persisted, and injected data-tip attributes would leak into saved docs.
const SHOW_DELAY = 500;
const EDGE_PAD = 8;

export default function TooltipLayer() {
  const [tip, setTip] = useState(null); // { text, keys, x, y, below }
  const [shift, setShift] = useState(0); // horizontal bubble slide to stay on-screen
  const shiftRef = useRef(0); // applied shift — subtracted when re-measuring
  const bubbleRef = useRef(null);
  const showTimerRef = useRef(null);
  const currentElRef = useRef(null);

  useEffect(() => {
    const hide = () => {
      clearTimeout(showTimerRef.current);
      currentElRef.current = null;
      setTip(null);
    };

    const onOver = (e) => {
      const el = e.target.closest?.('[title], [data-tip]');
      if (!el || el === currentElRef.current) return;
      if (el.closest('.editor-content')) return;
      if (el.hasAttribute('title')) {
        const t = el.getAttribute('title');
        if (t) el.dataset.tip = t;
        el.removeAttribute('title');
      }
      const raw = el.dataset.tip;
      if (!raw) return;
      clearTimeout(showTimerRef.current);
      currentElRef.current = el;
      showTimerRef.current = setTimeout(() => {
        if (!el.isConnected || currentElRef.current !== el) return;
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return;
        const [text, shortcut] = (el.dataset.tip || raw).split('||');
        const below = r.top < 44;
        setTip({
          text: text.trim(),
          keys: shortcut ? shortcut.trim().split(/\s+/) : null,
          x: r.left + r.width / 2,
          y: below ? r.bottom + 9 : r.top - 9,
          below,
        });
      }, SHOW_DELAY);
    };

    const onOut = (e) => {
      const el = currentElRef.current;
      if (!el) return;
      if (e.relatedTarget && el.contains(e.relatedTarget)) return;
      if (el === e.target || el.contains(e.target)) hide();
    };

    document.addEventListener('mouseover', onOver, true);
    document.addEventListener('mouseout', onOut, true);
    document.addEventListener('mousedown', hide, true);
    document.addEventListener('keydown', hide, true);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('blur', hide);
    return () => {
      clearTimeout(showTimerRef.current);
      document.removeEventListener('mouseover', onOver, true);
      document.removeEventListener('mouseout', onOut, true);
      document.removeEventListener('mousedown', hide, true);
      document.removeEventListener('keydown', hide, true);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('blur', hide);
    };
  }, []);

  // Slide the bubble sideways if it would run past a viewport edge — the tail
  // stays put (anchored to the target) so it keeps pointing at the control.
  useLayoutEffect(() => {
    if (!tip) { shiftRef.current = 0; setShift(0); return; }
    const el = bubbleRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // Subtract any shift already painted so the math is against the true center
    const baseLeft = r.left - shiftRef.current;
    const baseRight = r.right - shiftRef.current;
    let s = 0;
    if (baseLeft < EDGE_PAD) s = EDGE_PAD - baseLeft;
    else if (baseRight > window.innerWidth - EDGE_PAD) s = window.innerWidth - EDGE_PAD - baseRight;
    shiftRef.current = s;
    setShift(s);
  }, [tip]);

  return (
    <AnimatePresence>
      {tip && (
        <div
          style={{
            position: 'fixed',
            left: tip.x,
            top: tip.y,
            zIndex: 10000,
            pointerEvents: 'none',
            transform: `translate(-50%, ${tip.below ? '0%' : '-100%'})`,
          }}
        >
          <motion.div
            key={`${tip.text}-${tip.x}-${tip.y}`}
            initial={{ opacity: 0, scale: 0.94, y: tip.below ? -3 : 3 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.08 } }}
            transition={{ type: 'spring', stiffness: 550, damping: 32 }}
            style={{ position: 'relative', transformOrigin: tip.below ? 'top center' : 'bottom center' }}
          >
            {/* Bubble — theme-matching: light in light mode, dark in dark mode */}
            <div
              ref={bubbleRef}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-primary)] text-[11px] font-medium whitespace-nowrap shadow-lg select-none"
              style={{ maxWidth: 280, transform: `translateX(${shift}px)` }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{tip.text}</span>
              {tip.keys && (
                <span className="flex items-center gap-[3px]" aria-label={tip.keys.join(' ')}>
                  {tip.keys.map((k, i) => (
                    <motion.span
                      key={`${k}-${i}`}
                      initial={{ y: 0 }}
                      animate={{ y: [0, 2, 0] }}
                      transition={{ delay: 0.35 + i * 0.14, duration: 0.26, times: [0, 0.5, 1], ease: 'easeInOut' }}
                      className="inline-flex items-center justify-center min-w-[16px] h-[15px] px-[4px] rounded-[4px] text-[9px] font-semibold bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
                      style={{
                        '--lisse-skip': 1,
                        border: '1px solid var(--color-border-primary)',
                        // The keycap "side" — the cap dips onto it when pressed
                        boxShadow: '0 2px 0 var(--color-border-hover)',
                        marginBottom: 2,
                        lineHeight: 1,
                      }}
                    >
                      {k}
                    </motion.span>
                  ))}
                </span>
              )}
            </div>
            {/* Tail — anchored to the target even when the bubble slides.
                Sibling of the bubble: the squircle clip would slice it off. */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                [tip.below ? 'top' : 'bottom']: -3.5,
                width: 8,
                height: 8,
                background: 'var(--color-bg-primary)',
                borderRight: tip.below ? 'none' : '1px solid var(--color-border-primary)',
                borderBottom: tip.below ? 'none' : '1px solid var(--color-border-primary)',
                borderLeft: tip.below ? '1px solid var(--color-border-primary)' : 'none',
                borderTop: tip.below ? '1px solid var(--color-border-primary)' : 'none',
                transform: 'translateX(-50%) rotate(45deg)',
                borderRadius: 1.5,
              }}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
