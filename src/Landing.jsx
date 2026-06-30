import React, { useState, useEffect, useRef } from 'react';
import { motion, useTransform, useMotionValue, AnimatePresence, animate as animateMV } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Heart } from 'lucide-react';
import GradualBlur from './components/GradualBlur';

/* ─── Tokens ─── */
const EASE = [0.22, 1, 0.36, 1];
const SERIF = '"Averia Serif Libre", Georgia, serif';
// Bold Averia, tightly tracked — every serif heading (the logo is the only Light one).
const serifHead = { fontFamily: SERIF, fontWeight: 700, letterSpacing: '-0.04em' };

// Effect PNG: 1792×874 (aspect 2.05). Central plateau ~0.558 of height from the bottom.
const EFFECT_ASPECT = 1792 / 874;
const EFFECT_PLATEAU = 0.558;

const STROKE_DOWN = '#0a0a0a'; // bold black outer stroke while the mouse is held

/* ─── Reveal ─── */
const Reveal = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 26, filter: 'blur(4px)' }}
    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.6, delay, ease: EASE }}
    className={className}
  >
    {children}
  </motion.div>
);

/* ─── Goopy serif word ─── */
const GoopWord = ({ word, interactive }) => (
  <span className="goop-word">
    <span className="goop-ph">{word}</span>
    <span className={`goop-animated${interactive ? ' interactive' : ''}`}>
      {[...word].map((ch, i) => <span key={i} className="goop-letter">{ch}</span>)}
    </span>
  </span>
);

/* ─── Header — logo centres then slides left; button only once the hero CTA is off-screen ─── */
const StickyHeader = ({ navigate, scrolled, pinnedLeft }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, ease: EASE }}
    className="fixed top-0 left-0 right-0 z-50"
  >
    <div className="px-6 h-16 flex items-center">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1 select-none hover:opacity-80 transition-opacity"
        style={{
          position: 'absolute',
          left: pinnedLeft ? '24px' : '50%',
          transform: pinnedLeft ? 'translateX(0)' : 'translateX(-50%)',
          transition: 'left 0.5s cubic-bezier(0.22,1,0.36,1), transform 0.5s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <span className="w-[22px] h-[22px] flex items-center justify-center shrink-0">
          <img src="/logolight.png" alt="Words" className="w-full h-full object-contain dark:hidden" />
          <img src="/logodark.png" alt="Words" className="w-full h-full object-contain hidden dark:block" />
        </span>
        <span className="leading-none" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '26px', letterSpacing: '-0.055em', transform: 'translateY(1px)' }}>
          Words
        </span>
      </button>

      <div className="ml-auto">
        <AnimatePresence>
          {scrolled && (
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.2, ease: EASE }}>
              <span className="btn-land-wrap">
                <button onClick={() => navigate('/documents')} className="btn-land group px-5 py-2 text-[13px] font-semibold rounded-lg flex items-center gap-2">
                  Start writing
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  </motion.div>
);

/* ─── Image-preview placeholder ─── */
const Preview = ({ label, instruction, className = '' }) => (
  <div className={`relative w-full h-full rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] overflow-hidden flex items-center justify-center ${className}`}>
    <div className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-text-faint)] bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-full px-2.5 py-1">
      Preview · {label}
    </div>
    <p className="px-8 text-center text-[13px] leading-relaxed text-[var(--color-text-muted)] max-w-[340px]">
      {instruction}
    </p>
  </div>
);

/* ─── Sticky accordion showcase — all items shown; the active one expands.
   Dia-style: pinned, scroll-driven, smooth height expansion (no rise/fade). ─── */
const SHOWCASE = [
  {
    title: 'A blank page that stays blank.',
    body: 'No menus, no chrome, no blinking toolbars — just you and the cursor. Words gets out of the way so the thinking can actually start.',
    previewLabel: 'Clean editor',
    previewInstruction: 'Animated preview: a calm, empty editor with text quietly flowing in and nothing else on screen.',
  },
  {
    title: 'Structure, the moment you want it.',
    body: 'Type “/” for a heading, a list, a quote, a table. It appears right under your cursor and disappears the second you move on.',
    previewLabel: 'The “/” menu',
    previewInstruction: 'Animated preview: typing “/”, the slash menu opening, and a heading + checklist dropping into the note.',
  },
  {
    title: 'Buddy thinks alongside you.',
    body: 'Highlight any tangle and Buddy reflects it back — clearer, shorter, unstuck. A second pair of eyes that never takes over.',
    previewLabel: 'Buddy',
    previewInstruction: 'Animated preview: selecting a clumsy sentence, the Buddy popup appearing, and the line rewriting itself.',
  },
];

const StickyShowcase = () => {
  const cardRefs = useRef([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const mid = window.innerHeight / 2;
      let best = 0, bestDist = Infinity;
      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      setActive(best);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, []);

  return (
    <section className="relative z-10 bg-[var(--color-bg-primary)] px-6 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-center mx-auto max-w-2xl text-[2.4rem] sm:text-[3.4rem] leading-[1.03] mb-6 sm:mb-8" style={{ ...serifHead, letterSpacing: '-0.08em' }}>
          Words works the way your mind already does.
        </h2>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-20">
          {/* LEFT — sticky accordion: every title visible, the active one expands */}
          <div className="hidden lg:block">
            <div className="sticky top-0 h-[100svh] flex items-center">
              <div className="w-full">
                {SHOWCASE.map((it, i) => (
                  <div key={i} className="py-1 flex gap-4 items-start">
                    <div style={{
                      width: '3px',
                      borderRadius: '2px',
                      alignSelf: 'stretch',
                      minHeight: '32px',
                      background: 'var(--color-accent)',
                      opacity: active === i ? 1 : 0.18,
                      transition: 'opacity 0.45s ease',
                      flexShrink: 0,
                      marginTop: '4px',
                    }} />
                    <div className="flex-1">
                      <h3
                        className="text-[1.5rem] leading-tight"
                        style={{ ...serifHead, color: active === i ? 'var(--color-text-primary)' : 'var(--color-text-faint)', transition: 'color 0.45s ease' }}
                      >
                        {it.title}
                      </h3>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateRows: active === i ? '1fr' : '0fr',
                          opacity: active === i ? 1 : 0,
                          transition: 'grid-template-rows 0.55s cubic-bezier(0.4,0,0.2,1), opacity 0.45s ease',
                        }}
                      >
                        <div className="overflow-hidden">
                          <p className="text-[var(--color-text-muted)] text-[15px] leading-relaxed max-w-sm pt-2 pb-1">{it.body}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — previews scroll normally; the left tracks whichever is centred */}
          <div className="space-y-10 lg:space-y-[10vh] lg:py-[6vh]">
            {SHOWCASE.map((it, i) => (
              <div key={i} ref={(el) => { cardRefs.current[i] = el; }}>
                <div className="lg:hidden mb-4">
                  <h3 className="text-[1.5rem] leading-tight mb-2" style={serifHead}>{it.title}</h3>
                  <p className="text-[var(--color-text-muted)] text-[15px] leading-relaxed">{it.body}</p>
                </div>
                <div className="aspect-[4/3] transition-all duration-500" style={{ opacity: active === i ? 1 : 0.5, transform: `scale(${active === i ? 1 : 0.97})` }}>
                  <Preview label={it.previewLabel} instruction={it.previewInstruction} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─── Bento feature cell (larger) ─── */
const FeatureCell = ({ title, body, previewLabel, previewInstruction, className = '' }) => (
  <Reveal className={className}>
    <div className="h-full rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] overflow-hidden flex flex-col hover:border-[var(--color-border-hover)] transition-colors">
      <div className="p-6 pb-3">
        <h3 className="text-[21px] mb-2" style={serifHead}>{title}</h3>
        <p className="text-[14px] text-[var(--color-text-muted)] leading-relaxed">{body}</p>
      </div>
      <div className="flex-1 min-h-[170px] m-4 mt-1">
        <Preview label={previewLabel} instruction={previewInstruction} />
      </div>
    </div>
  </Reveal>
);

/* ─── Giant footer wordmark — thinned by a stroke; the cursor REDUCES the
   stroke nearby, so the letters fill back in where you hover. ─── */
const FooterWordmark = () => {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const letters = [...root.querySelectorAll('.fw-letter')];
    let rects = [];
    let base = 16;
    const reset = () => letters.forEach(s => { s.style.webkitTextStrokeWidth = `${base}px`; });
    const upd = () => {
      base = parseFloat(getComputedStyle(root).fontSize) * 0.06; // stroke scales with the giant type
      rects = letters.map(s => { const r = s.getBoundingClientRect(); return { s, cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; });
    };
    const onMove = (e) => {
      for (const { s, cx, cy } of rects) {
        const d = Math.hypot(e.clientX - cx, e.clientY - cy);
        const t = Math.max(0, 1 - d / 320);
        // hovering reduces the stroke (letters thicken back toward solid)
        s.style.webkitTextStrokeWidth = `${(base * (1 - t * t)).toFixed(2)}px`;
      }
    };
    const onEnter = () => { upd(); document.addEventListener('mousemove', onMove); };
    const onLeave = () => { document.removeEventListener('mousemove', onMove); reset(); };
    upd();
    reset();
    root.addEventListener('mouseenter', onEnter);
    root.addEventListener('mouseleave', onLeave);
    window.addEventListener('resize', () => { upd(); reset(); });
    return () => {
      root.removeEventListener('mouseenter', onEnter);
      root.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mousemove', onMove);
    };
  }, []);
  return (
    <div ref={ref} className="fw" aria-hidden="true">
      {[...'Words'].map((c, i) => <span key={i} className="fw-letter">{c}</span>)}
    </div>
  );
};

/* ════════════════════════════════════════════════
   LANDING
   ════════════════════════════════════════════════ */
export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [revealed, setRevealed] = useState(false);   // button + glow appear WITH the text
  const [goopDone, setGoopDone] = useState(false);    // enables the hover bloom
  const [isNarrow, setIsNarrow] = useState(false);
  const [isDark, setIsDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);

  const titleRef = useRef(null);
  const ctaRef = useRef(null);
  const [buttonTop, setButtonTop] = useState(() => Math.round(window.innerHeight * 0.72));
  const [effect, setEffect] = useState({ w: 0, h: 0, bottom: 0, mask: 26 });

  // Glow scroll response: shoots UP faster than the scroll, blurring + fading.
  const glowScroll = useMotionValue(0);
  const glowY = useTransform(glowScroll, [0, 420], [0, -900]);
  const glowOpacity = useTransform(glowScroll, [0, 200, 380], [1, 0.35, 0]);
  const glowBlur = useTransform(glowScroll, (v) => `blur(${Math.min(26, (v / 380) * 26).toFixed(1)}px)`);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const h = e => setIsDark(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  useEffect(() => {
    const link = document.querySelector('link[rel="icon"]');
    const original = link?.href;
    if (link) link.href = '/landingfavicon.png';
    return () => { if (link) link.href = original; };
  }, []);

  useEffect(() => {
    const h = () => setIsNarrow(window.innerWidth < 640);
    h();
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // Header CTA only appears once the hero's button has actually scrolled off-screen.
  useEffect(() => {
    const h = () => {
      const y = window.scrollY;
      glowScroll.set(y);
      setHasScrolled(y > 2);
      const r = ctaRef.current?.getBoundingClientRect();
      setScrolled(r ? r.bottom < 6 : y > window.innerHeight * 0.9);
    };
    h();
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, [glowScroll]);

  // ── Goop-in (JS) + cursor bloom; mouse-down flips to a bold black outline ──
  useEffect(() => {
    let cancelled = false, controls;
    let moveHandler, leaveHandler, resizeHandler, downHandler, upHandler;
    const words = () => [...document.querySelectorAll('.goop-animated')];
    const setW = (v) => words().forEach(el => { el.style.webkitTextStrokeWidth = `${v}px`; });
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const enableHover = () => {
      if (cancelled) return;
      const letters = [...document.querySelectorAll('.goop-animated .goop-letter')];
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--color-bg-primary').trim() || '#fff';
      // phase 0 = white inner stroke, phase 1 = bold black outer; the width is
      // multiplied by |2·phase−1| so it collapses to zero exactly at the swap.
      let phase = 0;
      let last = null;
      let phaseAnim = null;
      let rects = [];

      const render = () => {
        const white = phase < 0.5;
        const mult = Math.abs(phase * 2 - 1);
        const color = white ? bg : STROKE_DOWN;
        const maxW = white ? 4.5 : 7;
        for (const { s, cx, cy } of rects) {
          s.style.webkitTextStrokeColor = color;
          if (!last) { s.style.webkitTextStrokeWidth = '0px'; continue; }
          const d = Math.hypot(last.x - cx, last.y - cy);
          const t = Math.max(0, 1 - d / 160);
          s.style.webkitTextStrokeWidth = `${(t * t * maxW * mult).toFixed(2)}px`;
        }
      };

      const upd = () => { rects = letters.map(s => { const r = s.getBoundingClientRect(); return { s, cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; }); render(); };
      upd();
      resizeHandler = upd;
      window.addEventListener('resize', resizeHandler);

      const animatePhase = (to) => {
        phaseAnim?.stop?.();
        phaseAnim = animateMV(phase, to, { duration: 0.34, ease: EASE, onUpdate: (v) => { phase = v; render(); } });
      };

      moveHandler = (e) => { last = { x: e.clientX, y: e.clientY }; render(); };
      leaveHandler = () => { last = null; render(); };
      downHandler = () => animatePhase(1);
      upHandler = () => animatePhase(0);
      document.addEventListener('mousemove', moveHandler);
      document.addEventListener('mouseleave', leaveHandler);
      document.addEventListener('mousedown', downHandler);
      document.addEventListener('mouseup', upHandler);
      setGoopDone(true);
    };

    const startId = setTimeout(() => {
      if (cancelled) return;
      setRevealed(true); // reveal button + glow together with the text
      if (reduce) { setW(0); enableHover(); return; }
      setW(15);
      controls = animateMV(15, 0, { duration: 0.95, ease: EASE, onUpdate: setW, onComplete: enableHover });
    }, 120);

    return () => {
      cancelled = true;
      clearTimeout(startId);
      controls?.stop?.();
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
      if (moveHandler) document.removeEventListener('mousemove', moveHandler);
      if (leaveHandler) document.removeEventListener('mouseleave', leaveHandler);
      if (downHandler) document.removeEventListener('mousedown', downHandler);
      if (upHandler) document.removeEventListener('mouseup', upHandler);
    };
  }, []);

  // Safety net.
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 2200);
    return () => clearTimeout(t);
  }, []);

  // ── Place the CTA halfway between the title bottom and the screen bottom,
  //    then size/position the glow (uniform scale, masked bottom) so its plateau
  //    cradles the button, dropped low. ──
  useEffect(() => {
    const measure = () => {
      const vh = window.innerHeight, vw = window.innerWidth;
      const title = titleRef.current;
      const titleH = title ? title.offsetHeight : 200;
      const titleBottom = vh / 2 + titleH / 2;
      const btnCenter = (titleBottom + vh) / 2;
      setButtonTop(Math.round(btnCenter));

      const btnH = ctaRef.current ? ctaRef.current.offsetHeight : 52;
      const cradleY = btnCenter + btnH / 2 + 42;          // dropped further below the button
      const hForWidth = (vw * 1.18) / EFFECT_ASPECT;
      const hForNest = (vh - cradleY) / EFFECT_PLATEAU;
      const h = Math.max(hForWidth, hForNest);
      const w = h * EFFECT_ASPECT;
      const bottom = Math.min(0, (vh - cradleY) - EFFECT_PLATEAU * h);
      // Ensure at least 150px of fade is visible within the viewport so the glow
      // dissolves naturally rather than cutting off at the fold.
      const visibleH = h + bottom; // h minus the below-viewport portion
      const targetFadePx = Math.max(150, visibleH * 0.26);
      const mask = Math.min(72, ((Math.abs(bottom) + targetFadePx) / h) * 100);
      setEffect({ w, h, bottom, mask });
    };
    measure();
    window.addEventListener('resize', measure);
    const t1 = setTimeout(measure, 300);
    const t2 = setTimeout(measure, 1200);
    if (document.fonts?.ready) document.fonts.ready.then(measure);
    return () => { window.removeEventListener('resize', measure); clearTimeout(t1); clearTimeout(t2); };
  }, [revealed]);

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-sans">

      {/* ── Cradling glow ── reveals with the text; scroll shoots it up + blurs + fades.
          Bottom is masked so the rising image never shows a hard cut. */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <motion.div className="absolute inset-0" style={{ y: glowY, opacity: glowOpacity, filter: glowBlur }}>
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0, y: 70, filter: 'blur(28px)' }}
            animate={{ opacity: revealed ? 1 : 0, y: revealed ? 0 : 70, filter: revealed ? 'blur(0px)' : 'blur(28px)' }}
            transition={{ duration: 0.85, ease: EASE }}
          >
            <img
              src={isDark ? '/newdoceffect/darkeffect.png' : '/newdoceffect/lighteffect.png'}
              alt=""
              draggable="false"
              className="absolute select-none"
              style={{
                width: `${effect.w}px`, height: `${effect.h}px`,
                left: '50%', bottom: `${effect.bottom}px`,
                transform: 'translateX(-50%)', maxWidth: 'none',
                filter: isDark ? 'brightness(1.55) saturate(1.5)' : 'none',
                WebkitMaskImage: `linear-gradient(to top, transparent 0%, #000 ${effect.mask || 26}%, #000 93%, transparent 100%)`,
                maskImage: `linear-gradient(to top, transparent 0%, #000 ${effect.mask || 26}%, #000 93%, transparent 100%)`,
              }}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Progressive blur top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none transition-opacity duration-300" style={{ height: '5.5rem', opacity: hasScrolled ? 1 : 0 }}>
        <GradualBlur position="top" height="5.5rem" strength={0.5} divCount={4} curve="ease-out" />
      </div>
      <div className="fixed top-0 left-0 right-0 h-12 z-40 pointer-events-none transition-opacity duration-300" style={{ background: 'linear-gradient(to bottom, var(--color-bg-primary) 25%, transparent 100%)', opacity: hasScrolled ? 1 : 0 }} />

      <StickyHeader navigate={navigate} scrolled={scrolled} pinnedLeft={scrolled || isNarrow} />

      {/* ── Hero ── */}
      <section className="relative h-[100svh]">
        <h1
          ref={titleRef}
          className="goop-headline absolute left-1/2 top-1/2 w-full px-6"
          style={{ transform: 'translate(-50%, -50%)' }}
          aria-label="A quiet place for a loud mind."
        >
          <span aria-hidden="true">
            <span className="goop-static">A&nbsp;</span>
            <GoopWord word="quiet" interactive={goopDone} />
            <span className="goop-static">&nbsp;place</span>
            <br />
            <span className="goop-static">for a&nbsp;</span>
            <GoopWord word="loud" interactive={goopDone} />
            <span className="goop-static">&nbsp;mind.</span>
          </span>
        </h1>

        <div className="absolute left-0 right-0 z-10 flex justify-center" style={{ top: `${buttonTop}px`, transform: 'translateY(-50%)' }}>
          <motion.div
            className="btn-land-wrap"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: revealed ? 1 : 0, y: revealed ? 0 : 8 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <button
              ref={ctaRef}
              onClick={() => navigate('/documents')}
              className="btn-land group px-8 py-3.5 rounded-xl font-semibold text-[17px] flex items-center gap-2"
            >
              Start writing
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── Sticky accordion showcase ── */}
      <StickyShowcase />

      {/* ── Feature bento grid (larger) ── */}
      <section className="relative z-10 bg-[var(--color-bg-primary)] px-6 py-14 sm:py-20">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-10">
              <h2 className="text-[2.4rem] sm:text-[3.4rem] leading-[1.03]" style={serifHead}>
                Built for how you<br className="hidden sm:inline" /> actually think.
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 auto-rows-[300px]">
            <FeatureCell
              className="lg:col-span-2 lg:row-span-2"
              title="Buddy, live"
              body="Talk to Buddy out loud and watch him sort the pile for you — grouping loose thoughts, pulling out the to-dos, and shaping a raw brain-dump into something you can actually use. Just ask."
              previewLabel="Talking to Buddy"
              previewInstruction="Animated preview: a messy brain-dump on the page while you talk to Buddy, and Buddy reorganizing it live into clean sections and a to-do list."
            />
            <FeatureCell
              className="lg:col-span-2"
              title="Organize as loosely as you like"
              body="Folders, pins, drag-to-reorder. Keep it spotless or let it sprawl — Words won’t nag you either way."
              previewLabel="Sidebar"
              previewInstruction="Animated preview: dragging notes between folders, pinning one to the top, reordering the list."
            />
            <FeatureCell
              title="Nothing is ever lost"
              body="Every keystroke saves itself. Wander back to any version, any time."
              previewLabel="Version history"
              previewInstruction="Animated preview: scrubbing a slider through earlier versions of a document."
            />
            <FeatureCell
              title="Lock a note"
              body="Tuck the personal ones behind a tap."
              previewLabel="Locked note"
              previewInstruction="Animated preview: a note blurring and locking shut."
            />
            <FeatureCell
              className="lg:col-span-2"
              title="Yours by default"
              body="No sign-up required — keep everything right here on this device. Turn on encrypted sync across your devices only if you want it."
              previewLabel="Local & private"
              previewInstruction="Animated preview: a note living locally with a small shield, then an optional toggle lighting up encrypted sync."
            />
            <FeatureCell
              className="lg:col-span-2"
              title="Math that just works"
              body="Type an equation and it renders as you go — no plugins, no LaTeX wrestling."
              previewLabel="Live math"
              previewInstruction="Animated preview: typing a fraction and an integral that render into clean math in place."
            />
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="relative z-10 bg-[var(--color-bg-primary)] px-6 pt-6 pb-16 sm:pb-20 overflow-hidden">
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[420px] pointer-events-none" style={{ background: 'radial-gradient(ellipse at center bottom, rgba(232,87,42,0.18) 0%, transparent 68%)' }} />
        <Reveal>
          <div className="relative max-w-3xl mx-auto text-center">
            <h2 className="text-[2.4rem] sm:text-[3.4rem] leading-[1.03] mb-4" style={serifHead}>
              Your next thought deserves<br className="hidden sm:inline" /> a good home.
            </h2>
            <p className="text-[18px] text-[var(--color-text-muted)] mb-10 max-w-lg mx-auto">
              Words is free, instant, and right there in your browser. No account, no setup — just open it and start.
            </p>
            <span className="btn-land-wrap">
              <button
                onClick={() => navigate('/documents')}
                className="btn-land group px-10 py-4 rounded-xl font-semibold text-lg inline-flex items-center gap-2"
              >
                Open Words
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </span>
          </div>
        </Reveal>
      </section>

      {/* ── Footer — links row, then a clean full-bleed goopy wordmark ── */}
      <footer className="relative z-10 bg-[var(--color-bg-primary)] overflow-hidden pt-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-8 text-[13px] text-[var(--color-text-faint)]">
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 flex items-center justify-center">
                <img src="/logolight.png" alt="" className="w-full h-full object-contain dark:hidden" />
                <img src="/logodark.png" alt="" className="w-full h-full object-contain hidden dark:block" />
              </span>
              <span>© {new Date().getFullYear()} Words</span>
              <a href="/privacy" className="ml-2 hover:text-[var(--color-text-muted)] transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-[var(--color-text-muted)] transition-colors">Terms</a>
            </div>
            <span className="flex items-center gap-1">Made with <Heart size={12} className="fill-current" /> by Julian M.</span>
          </div>
        </div>
        {/* full-bleed wordmark, baseline kissing the bottom of the page */}
        <div className="flex items-end justify-center -mb-[0.08em]">
          <FooterWordmark />
        </div>
      </footer>
    </div>
  );
}
