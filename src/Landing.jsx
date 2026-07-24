import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { motion, useTransform, useMotionValue, AnimatePresence, animate as animateMV } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Heading1, Heading2, Heading3, CheckSquare,
  Mic, Highlighter, History, Calculator, Search, Lock, X, ListFilter, ArrowUpDown, ArrowUp,
  Pin, Folder, GripVertical, Smile, Moon, Printer, AlignLeft, List, WifiOff, Check,
} from 'lucide-react';
import GradualBlur from './components/GradualBlur';
import WordsWordmark from './WordsWordmark';

/* ─── Tokens ─── */
const EASE = [0.22, 1, 0.36, 1];
const SERIF = '"Averia Serif Libre", Georgia, serif';
// Bold Averia, tightly tracked — every serif heading (the logo is the only Light one).
const serifHead = { fontFamily: SERIF, fontWeight: 700, letterSpacing: '-0.04em' };

// Effect PNG: 1792×874 (aspect 2.05). Central plateau ~0.558 of height from the bottom.
const EFFECT_ASPECT = 1792 / 874;
const EFFECT_PLATEAU = 0.558;

/* ─── Reveal ─── */
const Reveal = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 34, filter: 'blur(6px)' }}
    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.75, delay, ease: EASE }}
    className={className}
  >
    {children}
  </motion.div>
);

/* ─── Masked word-rise headline — each word climbs out of its own clip box ─── */
const RiseTitle = ({ text, className = '', style = {} }) => (
  <h2 className={className} style={style} aria-label={text}>
    {text.split(' ').map((w, i) => (
      <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.13em] -mb-[0.13em]" aria-hidden="true">
        <motion.span
          className="inline-block"
          initial={{ y: '112%' }}
          whileInView={{ y: '0%' }}
          viewport={{ once: true, margin: '-90px' }}
          transition={{ duration: 0.75, delay: 0.06 + i * 0.055, ease: EASE }}
        >
          {w}
        </motion.span>
        {i < text.split(' ').length - 1 ? ' ' : ''}
      </span>
    ))}
  </h2>
);

/* ─── Card tilt-in — demos land with a shallow 3D settle ─── */
const TiltReveal = ({ children, delay = 0, className = '' }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 64, rotateX: 9, scale: 0.955, transformPerspective: 1100 }}
    whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.95, delay, ease: EASE }}
  >
    {children}
  </motion.div>
);

/* ─── Staggered accent-bar points — the bar grows in, the text follows ─── */
const pointList = { show: { transition: { staggerChildren: 0.13 } } };
const pointItem = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
};
const pointBar = {
  hidden: { scaleY: 0 },
  show: { scaleY: 1, transition: { duration: 0.6, delay: 0.12, ease: EASE } },
};

const PointGroup = ({ points, className = '' }) => (
  <motion.div
    className={`space-y-8 sm:space-y-9 ${className}`}
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, margin: '-70px' }}
    variants={pointList}
  >
    {points.map((p) => (
      <motion.div key={p.title} variants={pointItem} className="flex gap-4">
        <motion.span
          variants={pointBar}
          className="w-[3px] rounded-[2px] shrink-0 self-stretch"
          style={{ background: 'var(--color-accent)', transformOrigin: 'top' }}
        />
        <div>
          <h3 className="text-[19px] sm:text-[20px] mb-1.5" style={serifHead}>{p.title}</h3>
          <p className="text-[14px] sm:text-[14.5px] leading-relaxed text-[var(--color-text-primary)] max-w-md">{p.body}</p>
        </div>
      </motion.div>
    ))}
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
        <WordsWordmark className="h-[26px] w-auto shrink-0 text-[var(--landing-ink)]" />
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

/* ─── Chapter marker — "01 — Simplicity", the rule draws itself ─── */
const Chapter = ({ n, name }) => (
  <motion.div
    className="flex items-center justify-center gap-2.5 mb-5 text-[11px] font-bold uppercase tracking-[0.24em]"
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, margin: '-90px' }}
    variants={{ show: { transition: { staggerChildren: 0.12 } } }}
  >
    <motion.span
      variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE } } }}
      style={{ color: 'var(--color-accent)' }}
    >
      {n}
    </motion.span>
    <motion.span
      variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 0.55, ease: EASE } } }}
      className="w-5 h-px bg-[var(--color-border-hover)]"
      style={{ transformOrigin: 'left' }}
    />
    <motion.span
      variants={{ hidden: { opacity: 0, x: 8 }, show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE } } }}
      className="text-[var(--color-text-muted)]"
    >
      {name}
    </motion.span>
  </motion.div>
);

/* ════════════════════════════════════════════════
   MANIFESTO — the words surface one by one as you scroll.
   The three pillars land last, in the accent colour.
   ════════════════════════════════════════════════ */
const MANIFESTO =
  'Most writing apps want your attention. Words wants your thoughts. It opens instantly, stays silent while you think, and lifts the heavy things only when you ask. It all comes down to three ideas — simplicity, power, convenience.';

const Manifesto = () => {
  const ref = useRef(null);
  const wordRefs = useRef([]);
  const words = useMemo(() => MANIFESTO.split(' '), []);
  const pillarStart = words.length - 3; // "simplicity, power, convenience."

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const vh = window.innerHeight;
      const r = el.getBoundingClientRect();
      const total = r.height + vh * 0.35;
      const p = Math.min(1, Math.max(0, (vh * 0.82 - r.top) / total));
      const n = words.length;
      wordRefs.current.forEach((s, i) => {
        if (!s) return;
        const t = Math.min(1, Math.max(0, (p * (n + 5) - i) / 3.5));
        const e = 1 - (1 - t) * (1 - t); // ease-out
        s.style.opacity = (0.13 + 0.87 * t).toFixed(3);
        s.style.transform = `translateY(${((1 - e) * 0.38).toFixed(3)}em)`;
      });
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [words]);

  return (
    <section className="relative z-10 bg-[var(--color-bg-primary)] px-6 py-16 sm:py-36">
      <p
        ref={ref}
        className="max-w-4xl mx-auto text-center"
        style={{
          ...serifHead,
          letterSpacing: '-0.05em',
          fontSize: 'clamp(1.55rem, 3.7vw, 3.1rem)',
          lineHeight: 1.18,
        }}
      >
        {words.map((w, i) => (
          <span
            key={i}
            ref={(el) => { wordRefs.current[i] = el; }}
            className="inline-block will-change-transform"
            style={{ opacity: 0.13, color: i >= pillarStart ? 'var(--color-accent)' : undefined }}
          >
            {w}{i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </p>
    </section>
  );
};

/* ════════════════════════════════════════════════
   01 · SIMPLICITY — a real, self-playing editor demo.
   Types a title, opens the "/" menu, drops in a to-do list. Loops.
   ════════════════════════════════════════════════ */
/* The first five entries of the app's real COMMANDS list — titles,
   descriptions, and icons match src/App.jsx exactly. */
const SLASH_ITEMS = [
  { icon: null, title: 'Ask Buddy', description: 'Edit, generate, or brainstorm.', buddy: true },
  { icon: Heading1, title: 'Heading 1', description: 'Big section heading.' },
  { icon: Heading2, title: 'Heading 2', description: 'Medium section heading.' },
  { icon: Heading3, title: 'Heading 3', description: 'Small section heading.' },
  { icon: CheckSquare, title: 'To-do List', description: 'Track tasks with a checklist.' },
];
const DEMO_TITLE = "Saturday, before everyone's up";
const DEMO_TODOS = ['water the plants', 'fix the intro paragraph', 'call Dad back'];

const demoInitial = { title: '', slash: false, menu: false, menuIndex: 0, todos: [], checked: false, faded: false };
const demoFinal = { title: DEMO_TITLE, slash: false, menu: false, menuIndex: 4, todos: [...DEMO_TODOS], checked: true, faded: false };

const buildDemoSteps = () => {
  const steps = [];
  const push = (delay, fn) => steps.push({ delay, fn });
  push(700, (s) => s);
  [...DEMO_TITLE].forEach((ch) => push(38, (s) => ({ ...s, title: s.title + ch })));
  push(650, (s) => ({ ...s, slash: true }));
  push(380, (s) => ({ ...s, menu: true, menuIndex: 0 }));
  push(380, (s) => ({ ...s, menuIndex: 1 }));
  push(240, (s) => ({ ...s, menuIndex: 2 }));
  push(240, (s) => ({ ...s, menuIndex: 3 }));
  push(240, (s) => ({ ...s, menuIndex: 4 }));
  push(520, (s) => ({ ...s, menu: false, slash: false, todos: [''] }));
  DEMO_TODOS.forEach((todo, ti) => {
    [...todo].forEach((ch) => push(32, (s) => {
      const todos = [...s.todos];
      todos[todos.length - 1] += ch;
      return { ...s, todos };
    }));
    if (ti < DEMO_TODOS.length - 1) push(340, (s) => ({ ...s, todos: [...s.todos, ''] }));
  });
  push(600, (s) => ({ ...s, checked: true }));
  push(2800, (s) => ({ ...s, faded: true }));
  push(700, () => ({ ...demoInitial }));
  return steps;
};

const SlashDemo = () => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const [s, setS] = useState(demoInitial);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setS(demoFinal);
      return;
    }
    let cancelled = false;
    let tid;
    const run = () => {
      const steps = buildDemoSteps();
      let i = 0;
      const next = () => {
        if (cancelled) return;
        if (i >= steps.length) { run(); return; }
        const { delay, fn } = steps[i++];
        tid = setTimeout(() => {
          if (cancelled) return;
          setS(fn);
          next();
        }, delay);
      };
      next();
    };
    setS(demoInitial);
    run();
    return () => { cancelled = true; clearTimeout(tid); };
  }, [inView]);

  const typingTitle = s.title.length < DEMO_TITLE.length && !s.faded;
  const lastTodo = s.todos[s.todos.length - 1];
  const typingTodos = s.todos.length > 0 && !s.checked && !s.faded;

  return (
    <div ref={ref} className="relative h-[340px] sm:h-[400px] rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] shadow-[0_2px_16px_var(--color-shadow-primary)] overflow-hidden select-none">
      <div className="px-6 pt-7 sm:px-10 sm:pt-9 transition-opacity duration-500" style={{ opacity: s.faded ? 0 : 1 }}>
        {/* Title line — the app's title-input: 36/42px bold, "New Page" placeholder */}
        <div className="text-[24px] sm:text-[27px] font-bold tracking-tight leading-tight min-h-[34px]">
          {s.title.length === 0 && !typingTitle ? (
            <span className="text-[var(--color-text-faint)]">New Page</span>
          ) : (
            <>
              {s.title}
              {typingTitle && <span className="land-caret" />}
            </>
          )}
        </div>

        {/* Body */}
        <div className="relative mt-4 text-[15px] leading-relaxed">
          {s.slash && (
            <div className="text-[var(--color-text-primary)]">
              /<span className="land-caret" />
            </div>
          )}

          {s.todos.length > 0 && (
            <div className="space-y-2">
              {s.todos.map((t, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span
                    className="w-4 h-4 rounded-[4px] flex items-center justify-center shrink-0 transition-all duration-200"
                    style={{
                      boxShadow: s.checked && i === 0 ? 'inset 0 0 0 1.5px var(--color-accent)' : 'inset 0 0 0 1.5px var(--color-icon-muted)',
                      background: s.checked && i === 0 ? 'var(--color-accent)' : 'transparent',
                    }}
                  >
                    {s.checked && i === 0 && <Check size={11} strokeWidth={3} className="text-white" />}
                  </span>
                  <span
                    className="transition-colors duration-200"
                    style={s.checked && i === 0 ? { color: 'var(--color-text-muted)', textDecoration: 'line-through' } : undefined}
                  >
                    {t}
                    {typingTodos && i === s.todos.length - 1 && lastTodo.length < DEMO_TODOS[i].length && <span className="land-caret" />}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Slash menu — mirrors the app's popover: w-56, spring pop, two-line rows */}
          <AnimatePresence>
            {s.menu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
                transition={{ opacity: { duration: 0.12 }, filter: { duration: 0.15 }, scale: { type: 'spring', stiffness: 450, damping: 28 } }}
                style={{ transformOrigin: 'top left' }}
                className="absolute left-0 top-8 z-10 w-56 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] shadow-xl py-1 px-1"
              >
                {SLASH_ITEMS.map((it, i) => (
                  <div
                    key={it.title}
                    className="w-full text-left px-2.5 py-1.5 rounded flex items-center gap-2.5 text-[13px] text-[var(--color-text-primary)] transition-colors duration-150"
                    style={{ background: s.menuIndex === i ? 'var(--color-bg-hover)' : 'transparent' }}
                  >
                    {it.buddy
                      ? <BuddyFace size={14} />
                      : <it.icon size={14} className={s.menuIndex === i ? 'text-[var(--color-text-primary)] shrink-0' : 'text-[var(--color-icon-muted)] shrink-0'} />}
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium leading-tight">{it.title}</span>
                      <span className="text-[11px] text-[var(--color-text-faint)] truncate leading-tight">{it.description}</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const SIMPLICITY_POINTS = [
  {
    title: 'Type “/” for structure',
    body: 'Headings, lists, quotes, tables — they appear right under your cursor and vanish the moment you move on.',
  },
  {
    title: 'Titles write themselves',
    body: 'Leave a note untitled and Words names it from what you wrote — a fitting emoji included.',
  },
  {
    title: 'An interface that fades',
    body: 'Menus, toolbars, even the scrollbar — everything shows up when you reach for it and gets out of the way while you write.',
  },
];

const SimplicitySection = () => (
  <section className="relative z-10 bg-[var(--color-bg-primary)] px-6 py-16 sm:py-28">
    <div className="max-w-6xl mx-auto">
      <Chapter n="01" name="Simplicity" />
      <RiseTitle
        text="Nothing between you and the page."
        className="text-center mx-auto max-w-2xl text-[2.1rem] sm:text-[3.4rem] leading-[1.03]"
        style={{ ...serifHead, letterSpacing: '-0.08em' }}
      />
      <Reveal delay={0.25}>
        <p className="text-center mx-auto max-w-xl mt-5 text-[15px] sm:text-[16px] leading-relaxed text-[var(--color-text-muted)]">
          Words opens to a blank page and keeps it that way — no setup screens, no toolbars, no noise.
        </p>
      </Reveal>

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center mt-12 sm:mt-20">
        <PointGroup points={SIMPLICITY_POINTS} className="order-2 lg:order-1" />
        <TiltReveal delay={0.08} className="order-1 lg:order-2">
          <SlashDemo />
        </TiltReveal>
      </div>
    </div>
  </section>
);

/* ════════════════════════════════════════════════
   02 · POWER — a working miniature of the app itself.
   The sidebar is the selector; each "document" is a live,
   looping recreation of the real feature.
   ════════════════════════════════════════════════ */

/* Shared looping-timeline hook: steps are {delay, fn(prev) → next}.
   Restarts when the list runs out; reduced-motion jumps to the final frame. */
const useTimeline = (buildSteps, initial, finalState, run = true) => {
  const [s, setS] = useState(initial);
  useEffect(() => {
    if (!run) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setS(finalState);
      return;
    }
    let cancelled = false;
    let tid;
    const go = () => {
      const steps = buildSteps();
      let i = 0;
      const next = () => {
        if (cancelled) return;
        if (i >= steps.length) { go(); return; }
        const { delay, fn } = steps[i++];
        tid = setTimeout(() => {
          if (cancelled) return;
          setS(fn);
          next();
        }, delay);
      };
      next();
    };
    setS(initial);
    go();
    return () => { cancelled = true; clearTimeout(tid); };
  }, [run]); // eslint-disable-line react-hooks/exhaustive-deps
  return s;
};

/* Buddy's actual face — the same PNGs the app ships */
const BuddyFace = ({ size = 64, className = '' }) => (
  <span className={`inline-block shrink-0 ${className}`} style={{ width: size, height: size }}>
    <img src="/buddy expressions/buddylight.png" alt="" draggable="false" className="w-full h-full object-contain dark:hidden" />
    <img src="/buddy expressions/buddydark.png" alt="" draggable="false" className="w-full h-full object-contain hidden dark:block" />
  </span>
);

const demoItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

/* ── Demo 1: Buddy dump mode — orange glow, timer, then the sorted note ── */
const DumpDemo = ({ run }) => {
  const s = useTimeline(
    () => {
      const steps = [];
      steps.push({ delay: 400, fn: (p) => ({ ...p, phase: 'rec', t: 0 }) });
      for (let i = 0; i < 5; i++) steps.push({ delay: 800, fn: (p) => ({ ...p, t: p.t + 1 }) });
      steps.push({ delay: 600, fn: (p) => ({ ...p, phase: 'org' }) });
      steps.push({ delay: 1500, fn: (p) => ({ ...p, phase: 'done' }) });
      steps.push({ delay: 3600, fn: () => ({ phase: 'rec', t: 0 }) });
      return steps;
    },
    { phase: 'rec', t: 0 },
    { phase: 'done', t: 5 },
    run
  );

  if (s.phase !== 'done') {
    return (
      <div className="relative h-full overflow-hidden bg-[var(--color-bg-primary)]">
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: '-42%', left: '50%', transform: 'translateX(-50%)',
            width: '145%', height: '75%', filter: 'blur(32px)',
            background: 'radial-gradient(ellipse 80% 100% at 50% 100%, rgba(232,87,42,0.85) 0%, rgba(232,87,42,0.45) 38%, rgba(232,87,42,0.12) 65%, transparent 82%)',
          }}
        />
        <div className="relative h-full flex flex-col items-center justify-center gap-3 px-8">
          <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}>
            <BuddyFace size={68} />
          </motion.div>
          <div className="flex items-center gap-2">
            <motion.span
              className="w-2 h-2 rounded-full"
              style={{ background: '#E8572A' }}
              animate={{ opacity: [1, 0.15, 1], scale: [1, 0.7, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span className="text-[21px] font-semibold tabular-nums" style={{ letterSpacing: '-0.5px' }}>0:0{s.t}</span>
          </div>
          <span className="text-[11.5px] text-center text-[var(--color-text-muted)] max-w-[300px] leading-relaxed">
            {s.phase === 'org'
              ? 'Buddy is sorting it out…'
              : '“…and I still need to renew my passport before the trip, oh and send Sam the deck—”'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[var(--color-bg-primary)] px-6 py-5 sm:px-8 overflow-hidden">
      <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.09 } } }}>
        <motion.div variants={demoItem} className="text-[15px] font-semibold mb-3">everything in my head rn</motion.div>
        <motion.div variants={demoItem} className="text-[13px] font-bold mb-1.5">This week</motion.div>
        {['renew passport', 'send Sam the deck'].map((t) => (
          <motion.div key={t} variants={demoItem} className="flex items-center gap-2 mb-1.5 text-[12.5px]">
            <span className="w-[14px] h-[14px] rounded-[4px] border border-[var(--color-border-hover)] shrink-0" />
            {t}
          </motion.div>
        ))}
        <motion.div variants={demoItem} className="text-[13px] font-bold mt-3 mb-1.5">Ideas</motion.div>
        <motion.div variants={demoItem} className="text-[12.5px] flex gap-2"><span className="text-[var(--color-text-faint)]">•</span>a podcast about tiny museums</motion.div>
      </motion.div>
    </div>
  );
};

/* ── Demo 2: highlight → Buddy popup → red/green diff → clean line ── */
const RW_BEFORE = 'We talked for a really long time about a bunch of different things that were mostly related to the launch.';
const RW_AFTER = 'The meeting ran long, mostly about the launch.';
const RW_CMD = 'make this clearer';

const RewriteDemo = ({ run }) => {
  const s = useTimeline(
    () => {
      const steps = [];
      const push = (d, fn) => steps.push({ delay: d, fn });
      push(700, (p) => ({ ...p, hl: true }));
      push(500, (p) => ({ ...p, panel: true }));
      [...RW_CMD].forEach((ch) => push(42, (p) => ({ ...p, typed: p.typed + ch })));
      push(500, (p) => ({ ...p, diff: true }));
      push(1700, (p) => ({ ...p, panel: false, applied: true }));
      push(950, (p) => ({ ...p, settled: true }));
      push(2600, () => ({ hl: false, panel: false, typed: '', diff: false, applied: false, settled: false }));
      return steps;
    },
    { hl: false, panel: false, typed: '', diff: false, applied: false, settled: false },
    { hl: false, panel: false, typed: RW_CMD, diff: false, applied: true, settled: true },
    run
  );

  return (
    <div className="relative h-full bg-[var(--color-bg-primary)] px-6 py-5 sm:px-8 text-[13.5px] leading-relaxed overflow-hidden">
      <div className="text-[15px] font-semibold mb-3">notes from tuesday</div>
      <p>
        Launch check-in with the team.{' '}
        {s.applied ? (
          <span
            className="rounded-[3px] transition-colors duration-700"
            style={{ background: s.settled ? 'transparent' : 'rgba(52,211,153,0.18)' }}
          >
            {RW_AFTER}
          </span>
        ) : (
          <span
            className="rounded-[3px] transition-colors duration-300"
            style={{ background: s.hl ? 'rgba(232,87,42,0.25)' : 'transparent' }}
          >
            {RW_BEFORE}
          </span>
        )}
      </p>

      <AnimatePresence>
        {s.panel && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.26, ease: EASE }}
            className="absolute right-4 bottom-4 sm:right-6 sm:bottom-6 w-[280px] max-w-[calc(100%-32px)] rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] shadow-[0_12px_32px_var(--color-shadow-primary)] overflow-hidden"
          >
            {s.diff && (
              <div className="p-3 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-primary)] text-[11.5px] leading-relaxed">
                <div className="text-red-500/70 line-through decoration-red-500/40 mb-1">{RW_BEFORE}</div>
                <div className="text-green-600 dark:text-green-400">{RW_AFTER}</div>
              </div>
            )}
            <div className="flex items-center gap-2 px-2.5 py-2">
              <BuddyFace size={20} />
              <span className="flex-1 min-w-0 truncate text-[13px]">
                {s.typed ? s.typed : <span className="text-[var(--color-text-faint)]">Ask Buddy to edit this…</span>}
                {!s.diff && <span className="land-caret" />}
              </span>
              <span className={`w-6 h-6 flex items-center justify-center rounded-md shrink-0 transition-colors ${s.typed ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]' : 'text-[var(--color-text-faint)]'}`}>
                <ArrowUp size={13} />
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Demo 3: version history panel — hover previews the diff, Restore appears ── */
const V_ROWS = [
  { time: '2:41 PM', label: 'Current version', current: true },
  { time: '2:18 PM', label: '3 edits' },
  { time: '1:52 PM', label: 'Buddy edit', buddy: true },
  { time: '11:06 AM', label: 'First version' },
];

const VersionsDemo = ({ run }) => {
  const s = useTimeline(
    () => {
      const steps = [];
      const push = (d, fn) => steps.push({ delay: d, fn });
      push(600, (p) => ({ ...p, panel: true }));
      push(900, (p) => ({ ...p, hover: 1, diff: 1 }));
      push(1800, (p) => ({ ...p, hover: 2, diff: 2 }));
      push(1800, (p) => ({ ...p, hover: -1, diff: 0 }));
      push(900, (p) => ({ ...p, panel: false }));
      push(1400, () => ({ panel: false, hover: -1, diff: 0 }));
      return steps;
    },
    { panel: false, hover: -1, diff: 0 },
    { panel: true, hover: 1, diff: 1 },
    run
  );

  const mark = (n) => ({
    background: s.diff === n ? 'rgba(52,211,153,0.18)' : 'transparent',
    color: s.diff === n ? '#059669' : 'inherit',
    borderRadius: '2px',
    transition: 'background 0.3s ease, color 0.3s ease',
  });

  return (
    <div className="relative h-full bg-[var(--color-bg-primary)] overflow-hidden">
      <div className="px-6 py-5 sm:px-8 text-[13px] leading-relaxed pr-[190px]">
        <div className="text-[15px] font-semibold mb-3">cover letter — draft two</div>
        <p className="mb-2">Dear Maya,</p>
        <p>
          I&rsquo;ve spent <span style={mark(1)}>eight years turning messy briefs into shipped products</span>, and I&rsquo;d
          like to spend the next few doing that <span style={mark(2)}>for a team whose work I already admire</span>.
        </p>
      </div>

      <motion.div
        initial={false}
        animate={{ x: s.panel ? '0%' : '100%' }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-0 right-0 bottom-0 w-[178px] bg-[var(--color-bg-primary)] border-l border-[var(--color-border-primary)] shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--color-border-primary)] shrink-0">
          <span className="text-[11.5px] font-semibold tracking-[-0.01em]">Version history</span>
          <X size={11} className="text-[var(--color-text-faint)]" />
        </div>
        <div className="px-3 pt-3 pb-1">
          <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-faint)]">Today</span>
        </div>
        <div className="flex flex-col px-1.5 gap-px">
          {V_ROWS.map((r, i) => (
            <div
              key={r.time}
              className="flex items-center gap-2 px-2 py-[7px] rounded-lg transition-colors duration-200"
              style={{ background: r.current ? 'var(--color-bg-secondary)' : s.hover === i ? 'var(--color-bg-hover)' : 'transparent' }}
            >
              <span className="w-[14px] flex items-center justify-center shrink-0">
                {r.buddy
                  ? <BuddyFace size={13} />
                  : <span className="w-[6px] h-[6px] rounded-full" style={{ background: r.current ? '#E8572A' : 'var(--color-text-faint)' }} />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[10.5px] font-semibold leading-tight">{r.time}</span>
                <span className="block text-[9px] text-[var(--color-text-muted)] leading-tight">{r.label}</span>
              </span>
              {s.hover === i && (
                <span className="px-1.5 py-[2px] rounded-md text-[8px] font-semibold bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] whitespace-nowrap">
                  Restore
                </span>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

/* ── Demo 4: instant math — type "… =", the answer ghosts in, Tab commits it ── */
const M1 = 'dinner split: 214/4 =';
const A1 = '53.5';
const M2 = 'with tip: 53.5*1.18 =';
const A2 = '63.13';

const MathDemo = ({ run }) => {
  const s = useTimeline(
    () => {
      const steps = [];
      const push = (d, fn) => steps.push({ delay: d, fn });
      push(500, (p) => p);
      [...M1].forEach((ch) => push(36, (p) => ({ ...p, l1: p.l1 + ch })));
      push(400, (p) => ({ ...p, p1: true }));
      push(1200, (p) => ({ ...p, c1: true }));
      push(450, (p) => p);
      [...M2].forEach((ch) => push(36, (p) => ({ ...p, l2: p.l2 + ch })));
      push(400, (p) => ({ ...p, p2: true }));
      push(1200, (p) => ({ ...p, c2: true }));
      push(2800, (p) => ({ ...p, faded: true }));
      push(600, () => ({ l1: '', p1: false, c1: false, l2: '', p2: false, c2: false, faded: false }));
      return steps;
    },
    { l1: '', p1: false, c1: false, l2: '', p2: false, c2: false, faded: false },
    { l1: M1, p1: false, c1: true, l2: M2, p2: false, c2: true, faded: false },
    run
  );

  const typing1 = s.l1.length > 0 && s.l1.length < M1.length;
  const typing2 = s.l2.length > 0 && s.l2.length < M2.length;

  return (
    <div className="h-full bg-[var(--color-bg-primary)] px-6 py-5 sm:px-8 overflow-hidden transition-opacity duration-500" style={{ opacity: s.faded ? 0 : 1 }}>
      <div className="text-[15px] font-semibold mb-3">saturday, with friends</div>
      <div className="text-[13.5px] leading-loose">
        <div className="min-h-[24px]">
          {s.l1}
          {s.p1 && !s.c1 && <span className="text-[var(--color-text-muted)]"> {A1}</span>}
          {s.c1 && <span> {A1}</span>}
          {(typing1 || (s.l1.length === M1.length && !s.p1)) && <span className="land-caret" />}
        </div>
        <div className="min-h-[24px]">
          {s.l2}
          {s.p2 && !s.c2 && <span className="text-[var(--color-text-muted)]"> {A2}</span>}
          {s.c2 && <span> {A2}</span>}
          {(typing2 || (s.l2.length === M2.length && !s.p2)) && <span className="land-caret" />}
        </div>
      </div>
    </div>
  );
};

/* ── Demo 5: spotlight — paper-card grid filtering live as you type ── */
const S_DOCS = [
  { emoji: '🚀', name: 'Launch plan', lines: ['Ship the beta to the first', 'fifty people. Pricing stays', 'simple — one plan.'] },
  { emoji: '📦', name: 'Launch checklist', lines: ['· App icon, final pass', '· Landing page copy', '· Email the waitlist'] },
  { emoji: '📓', name: 'journal', lines: ['Slept badly but the morning', 'was good. Long walk, two', 'coffees, no phone.'] },
  { emoji: '🍝', name: 'dinner ideas', lines: ['cacio e pepe', 'miso salmon + rice', 'that soup Lena made'] },
  { emoji: '💡', name: 'shower thoughts', lines: ['Maps, but for smells.', 'Why are receipts still', 'so long?'] },
  { emoji: '✈️', name: 'tokyo trip', lines: ['Day 1 — Shimokitazawa', 'Day 2 — the museum, then', 'izakaya with Kenji'] },
];
const S_QUERY = 'laun';

const SpotlightDemo = ({ run }) => {
  const s = useTimeline(
    () => {
      const steps = [];
      const push = (d, fn) => steps.push({ delay: d, fn });
      push(900, (p) => p);
      [...S_QUERY].forEach((ch) => push(150, (p) => ({ ...p, q: p.q + ch })));
      push(2400, (p) => p);
      for (let i = 0; i < S_QUERY.length; i++) push(70, (p) => ({ ...p, q: p.q.slice(0, -1) }));
      push(1600, () => ({ q: '' }));
      return steps;
    },
    { q: '' },
    { q: '' },
    run
  );

  const filtered = s.q ? S_DOCS.filter((d) => d.name.toLowerCase().includes(s.q)) : S_DOCS;

  return (
    <div className="relative h-full bg-[var(--color-bg-primary)] overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.18)' }} />
      <div
        className="absolute inset-x-4 top-4 bottom-4 sm:inset-x-10 sm:top-5 sm:bottom-5 rounded-2xl border border-[var(--color-border-primary)] shadow-[0_18px_40px_var(--color-shadow-primary)] flex flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
      >
        <div className="flex items-center gap-2.5 px-4 py-3 shrink-0">
          <Search size={15} className="text-[var(--color-text-muted)] shrink-0" />
          <span className="flex-1 min-w-0 text-[15px]">
            {s.q ? s.q : <span className="text-[var(--color-text-faint)]">Search notes…</span>}
            <span className="land-caret" />
          </span>
          <span className="p-1 rounded-md bg-[var(--color-bg-hover-strong)] text-[var(--color-text-muted)] shrink-0"><ListFilter size={12} /></span>
          <span className="p-1 rounded-md text-[var(--color-text-muted)] shrink-0"><ArrowUpDown size={12} /></span>
        </div>
        <div className="flex-1 overflow-hidden px-4 pb-3">
          <div className="grid grid-cols-3 gap-x-2.5 gap-y-3">
            <AnimatePresence>
              {filtered.map((d) => (
                <motion.div
                  layout
                  key={d.name}
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.22, ease: EASE }}
                  className="flex flex-col items-center min-w-0"
                >
                  <div className="w-full h-[84px] rounded-lg border border-[var(--color-border-primary)] bg-white dark:bg-[#2a2a2a] px-2 pt-2 overflow-hidden">
                    {d.lines.map((l, i) => (
                      <div key={i} className="text-[7px] leading-[1.6] text-[var(--color-text-muted)] truncate">{l}</div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 max-w-full">
                    <span className="text-[10px] leading-none shrink-0">{d.emoji}</span>
                    <span className="text-[10.5px] font-medium truncate">{d.name}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

const POWER_TABS = [
  { id: 'live', icon: Mic, label: 'Buddy, live', caption: 'Talk through the mess out loud — Buddy sorts it into sections and to-dos while you speak.', Demo: DumpDemo },
  { id: 'rewrite', icon: Highlighter, label: 'Rewrite anything', caption: 'Highlight a tangle, tell Buddy what you want, and the line rewrites itself in place.', Demo: RewriteDemo },
  { id: 'versions', icon: History, label: 'Version history', caption: 'Every keystroke is kept. Hover a version to see what changed — restore any of them.', Demo: VersionsDemo },
  { id: 'math', icon: Calculator, label: 'Instant math', caption: 'Type an expression, hit “=”, and the answer is already there. Tab keeps it.', Demo: MathDemo },
  { id: 'search', icon: Search, label: 'Spotlight search', caption: 'One search over everything you’ve written — filter, sort, and jump without the mouse.', Demo: SpotlightDemo },
];

const AUTO_MS = 10000;

const PowerSection = () => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || !auto) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setActive((a) => (a + 1) % POWER_TABS.length), AUTO_MS);
    return () => clearInterval(id);
  }, [inView, auto]);

  const tab = POWER_TABS[active];

  const rowBtn = (t, i, mobile) => {
    const isActive = i === active;
    return (
      <button
        key={t.id}
        onClick={() => { setActive(i); setAuto(false); }}
        className={
          mobile
            ? `flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium whitespace-nowrap shrink-0 transition-colors duration-200 ${isActive ? 'bg-[var(--color-bg-hover-strong)] text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}`
            : `flex items-center gap-2 px-2 py-[7px] rounded-lg text-[13px] text-left transition-colors duration-200 ${isActive ? 'bg-[var(--color-bg-hover)] text-[var(--color-text-primary)] font-medium' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]'}`
        }
      >
        <t.icon size={mobile ? 13 : 14} className={isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-icon-muted)]'} />
        <span className="truncate">{t.label}</span>
      </button>
    );
  };

  return (
    <section ref={ref} className="relative z-10 bg-[var(--color-bg-primary)] px-3 sm:px-6 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto rounded-3xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] px-4 sm:px-10 py-10 sm:py-14 overflow-hidden">
        <Chapter n="02" name="Power" />
        <RiseTitle
          text="Quiet on the surface. Not underneath."
          className="text-center mx-auto max-w-2xl text-[2.1rem] sm:text-[3.4rem] leading-[1.03]"
          style={{ ...serifHead, letterSpacing: '-0.08em' }}
        />
        <Reveal delay={0.25}>
          <p className="text-center mx-auto max-w-xl mt-5 text-[15px] sm:text-[16px] leading-relaxed text-[var(--color-text-muted)]">
            Everything heavy lives one ask away. These are real recreations — not screenshots.
          </p>
        </Reveal>

        {/* The app, in miniature — the sidebar is the switcher */}
        <TiltReveal delay={0.12} className="mt-8 sm:mt-10 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row h-[430px] sm:h-[400px] rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] shadow-[0_2px_16px_var(--color-shadow-primary)] overflow-hidden text-left select-none">
            {/* Sidebar (desktop) */}
            <div className="hidden sm:flex flex-col w-[190px] shrink-0 bg-[var(--color-bg-tertiary)] border-r border-[var(--color-border-primary)] px-2 py-3">
              <div className="flex items-center gap-1 px-2 mb-3">
                <span className="w-[14px] h-[14px] flex items-center justify-center shrink-0">
                  <img src="/logolight.png" alt="" className="w-full h-full object-contain dark:hidden" />
                  <img src="/logodark.png" alt="" className="w-full h-full object-contain hidden dark:block" />
                </span>
                <span className="text-[15px] leading-none translate-y-[1px]" style={{ fontFamily: SERIF, fontWeight: 300, letterSpacing: '-0.05em' }}>Words</span>
              </div>
              <div className="flex flex-col gap-0.5">
                {POWER_TABS.map((t, i) => rowBtn(t, i, false))}
              </div>
            </div>

            {/* Selector row (mobile) */}
            <div className="sm:hidden flex items-center gap-1 px-2 py-2 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)] overflow-x-auto no-scrollbar">
              {POWER_TABS.map((t, i) => rowBtn(t, i, true))}
            </div>

            {/* Page */}
            <div className="relative flex-1 min-h-0 min-w-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab.id}
                  className="absolute inset-0"
                  initial={{ opacity: 0, scale: 0.99, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.995, filter: 'blur(5px)' }}
                  transition={{ duration: 0.3, ease: EASE }}
                >
                  <tab.Demo run={inView} />
                </motion.div>
              </AnimatePresence>
              {auto && inView && (
                <motion.div
                  key={`prog-${active}`}
                  className="absolute bottom-0 left-0 right-0 h-[2px] origin-left z-10"
                  style={{ background: 'var(--color-accent)', opacity: 0.5 }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: AUTO_MS / 1000, ease: 'linear' }}
                />
              )}
            </div>
          </div>

          {/* Caption for the active feature */}
          <div className="mt-5 min-h-[44px] sm:min-h-[24px] text-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={tab.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="text-[13.5px] leading-relaxed text-[var(--color-text-muted)] max-w-xl mx-auto"
              >
                {tab.caption}
              </motion.p>
            </AnimatePresence>
          </div>
        </TiltReveal>
      </div>
    </section>
  );
};

/* ════════════════════════════════════════════════
   03 · CONVENIENCE — a lockable note you can actually click,
   the local-first story, and a marquee of little things.
   ════════════════════════════════════════════════ */
const LockDemo = () => {
  const [locked, setLocked] = useState(true);
  const [unlocking, setUnlocking] = useState(false);

  const toggle = () => {
    if (locked) {
      if (unlocking) return;
      setUnlocking(true);
      setTimeout(() => { setLocked(false); setUnlocking(false); }, 480);
    } else {
      setLocked(true);
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={locked ? 'Unlock the note' : 'Lock the note'}
      className="relative block w-full text-left h-[400px] sm:h-[360px] rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] shadow-[0_2px_16px_var(--color-shadow-primary)] overflow-hidden cursor-pointer select-none"
    >
      <div
        className="px-6 pt-7 sm:px-10 sm:pt-9 transition-all duration-500"
        style={{ filter: locked ? 'blur(9px)' : 'blur(0px)', opacity: locked ? 0.65 : 1, transform: locked ? 'scale(1.015)' : 'scale(1)' }}
        aria-hidden={locked}
      >
        <div className="text-[18px] sm:text-[20px] font-semibold leading-snug mb-4">things i&rsquo;m not ready to say out loud</div>
        <div className="space-y-3 text-[13.5px] sm:text-[14.5px] leading-relaxed text-[var(--color-text-primary)]">
          <p>I think I want to leave the job. Not soon — now. The idea showed up in March and never left.</p>
          <p>The scary part isn&rsquo;t the money. It&rsquo;s telling people. It&rsquo;s the face Mum will make.</p>
          <p>Anyway. Draft one of the resignation letter is below, and it feels amazing.</p>
        </div>
      </div>

      <AnimatePresence>
        {locked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="w-14 h-14 rounded-full bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] shadow-[0_4px_20px_var(--color-shadow-primary)] flex items-center justify-center"
            >
              <Lock size={22} className="text-[var(--color-text-primary)]" />
            </motion.div>
            <div className="flex gap-2.5">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="w-2.5 h-2.5 rounded-full transition-colors duration-150"
                  style={{
                    background: unlocking ? 'var(--color-accent)' : 'var(--color-border-hover)',
                    transitionDelay: unlocking ? `${i * 90}ms` : '0ms',
                  }}
                />
              ))}
            </div>
            <span className="text-[12px] font-semibold text-[var(--color-text-muted)]">This note is locked — click to unlock</span>
          </motion.div>
        )}
      </AnimatePresence>

      {!locked && (
        <div className="absolute bottom-4 left-0 right-0 text-center text-[12px] font-semibold text-[var(--color-text-faint)]">
          click anywhere to lock it again
        </div>
      )}
    </button>
  );
};

const CONVENIENCE_POINTS = [
  {
    title: 'Lock the personal ones.',
    body: 'Some notes aren’t for shoulder-surfers. Tuck them behind a passcode with a tap — go on, try the one right there.',
  },
  {
    title: 'No account at the door.',
    body: 'Open the page and start. Notes live on this device by default — nothing leaves it unless you say so.',
  },
  {
    title: 'Sync only if you ask.',
    body: 'Flip one switch and your notes follow you across devices, encrypted. Flip it back and they come home.',
  },
  {
    title: 'Saved before you think to save.',
    body: 'Autosave runs on every keystroke, and ⌘S drops a named save point when a version really matters.',
  },
];

const LITTLE_THINGS = [
  { icon: Pin, label: 'Pin what matters' },
  { icon: Folder, label: 'Folders, your way' },
  { icon: GripVertical, label: 'Drag to reorder' },
  { icon: Smile, label: 'An emoji for every note' },
  { icon: Moon, label: 'Dark mode' },
  { icon: Printer, label: 'Print & export' },
  { icon: AlignLeft, label: 'Line spacing & full width' },
  { icon: List, label: 'Heading navigator' },
  { icon: WifiOff, label: 'Works offline' },
];

const ConvenienceSection = () => (
  <section className="relative z-10 bg-[var(--color-bg-primary)] px-6 py-16 sm:py-28 overflow-hidden">
    <div className="max-w-6xl mx-auto">
      <Chapter n="03" name="Convenience" />
      <RiseTitle
        text="It’s already handled."
        className="text-center mx-auto max-w-2xl text-[2.1rem] sm:text-[3.4rem] leading-[1.03]"
        style={{ ...serifHead, letterSpacing: '-0.08em' }}
      />
      <Reveal delay={0.25}>
        <p className="text-center mx-auto max-w-xl mt-5 text-[15px] sm:text-[16px] leading-relaxed text-[var(--color-text-muted)]">
          The chores of a writing app — saving, syncing, organizing, hiding — happen on their own.
        </p>
      </Reveal>

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center mt-12 sm:mt-20">
        <TiltReveal>
          <LockDemo />
        </TiltReveal>
        <PointGroup points={CONVENIENCE_POINTS} />
      </div>
    </div>

    {/* …and the little things */}
    <Reveal className="mt-16 sm:mt-24">
      <p className="text-center text-[12px] font-bold uppercase tracking-[0.22em] text-[var(--color-text-faint)] mb-6">
        …and the little things
      </p>
      <div className="land-marquee" aria-hidden="true">
        <div className="land-marquee-track">
          {[...LITTLE_THINGS, ...LITTLE_THINGS].map((t, i) => (
            <span
              key={i}
              className="land-marquee-item flex items-center gap-2.5 px-5 py-3 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] text-[13.5px] font-medium whitespace-nowrap"
            >
              <t.icon size={15} className="text-[var(--color-accent)]" />
              {t.label}
            </span>
          ))}
        </div>
      </div>
      <ul className="sr-only">
        {LITTLE_THINGS.map((t) => <li key={t.label}>{t.label}</li>)}
      </ul>
    </Reveal>
  </section>
);

/* ─── Giant footer wordmark — thinned by a stroke; the cursor REDUCES the
   stroke nearby, so the letters fill back in where you hover. Clipped to
   its top half so the page runs out of scroll partway through it, and a
   mousedown press widens + deepens the fill-in for a stronger effect. ─── */
const FooterWordmark = () => {
  const ref = useRef(null);
  const clipRef = useRef(null);
  const [clipHeight, setClipHeight] = useState(0);

  // Only ever reveal the top half — the clip height caps how far the page can scroll.
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const measure = () => setClipHeight(root.getBoundingClientRect().height / 2);
    measure();
    window.addEventListener('resize', measure);
    if (document.fonts?.ready) document.fonts.ready.then(measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const letters = [...root.querySelectorAll('.fw-letter')];
    let rects = [];
    let base = 16;
    let pressed = false;
    const reset = () => letters.forEach(s => { s.style.webkitTextStrokeWidth = `${base}px`; });
    const upd = () => {
      base = parseFloat(getComputedStyle(root).fontSize) * 0.06; // stroke scales with the giant type
      rects = letters.map(s => { const r = s.getBoundingClientRect(); return { s, cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; });
    };
    const onMove = (e) => {
      // Pressing the mouse down widens the radius and pushes the fill further, for a more intense goop.
      const boost = pressed ? 1.6 : 1;
      for (const { s, cx, cy } of rects) {
        const d = Math.hypot(e.clientX - cx, e.clientY - cy);
        const t = Math.max(0, 1 - d / (320 * boost));
        const fill = Math.min(1, t * t * boost);
        // hovering reduces the stroke (letters thicken back toward solid)
        s.style.webkitTextStrokeWidth = `${(base * (1 - fill)).toFixed(2)}px`;
      }
    };
    const onEnter = () => { upd(); document.addEventListener('mousemove', onMove); };
    const onLeave = () => { document.removeEventListener('mousemove', onMove); reset(); };
    const onDown = () => { pressed = true; };
    const onUp = () => { pressed = false; };
    upd();
    reset();
    root.addEventListener('mouseenter', onEnter);
    root.addEventListener('mouseleave', onLeave);
    root.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('resize', () => { upd(); reset(); });
    return () => {
      root.removeEventListener('mouseenter', onEnter);
      root.removeEventListener('mouseleave', onLeave);
      root.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.removeEventListener('mousemove', onMove);
    };
  }, []);
  return (
    <div ref={clipRef} className="fw-clip" style={{ height: clipHeight ? `${clipHeight}px` : undefined }}>
      <div ref={ref} className="fw" aria-hidden="true">
        {[...'Words'].map((c, i) => <span key={i} className="fw-letter">{c}</span>)}
      </div>
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

  // ── Goop-in on load; quiet shrinks on hover, loud expands on hover ──
  useEffect(() => {
    let cancelled = false, controls;
    let moveHandler, leaveHandler, resizeHandler;
    const words = () => [...document.querySelectorAll('.goop-animated')];
    const setW = (v) => words().forEach(el => { el.style.webkitTextStrokeWidth = `${v}px`; });
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const enableHover = () => {
      if (cancelled) return;
      const letters = [...document.querySelectorAll('.goop-animated .goop-letter')];
      const rootStyle = getComputedStyle(document.documentElement);
      const bg = rootStyle.getPropertyValue('--color-bg-primary').trim() || '#fff';
      const fg = rootStyle.getPropertyValue('--landing-ink').trim() || '#252525';
      let last = null;
      let rects = [];

      const render = () => {
        for (const { s, cx, cy, isQuiet } of rects) {
          // quiet → bg stroke (letters shrink/press in); loud → ink stroke (letters expand/pop out)
          s.style.webkitTextStrokeColor = isQuiet ? bg : fg;
          const maxW = isQuiet ? 4.5 : 7;
          if (!last) { s.style.webkitTextStrokeWidth = '0px'; continue; }
          const d = Math.hypot(last.x - cx, last.y - cy);
          const t = Math.max(0, 1 - d / 160);
          s.style.webkitTextStrokeWidth = `${(t * t * maxW).toFixed(2)}px`;
        }
      };

      const upd = () => {
        rects = letters.map(s => {
          const r = s.getBoundingClientRect();
          const isQuiet = s.closest('.goop-word')?.querySelector('.goop-ph')?.textContent?.trim() === 'quiet';
          return { s, cx: r.left + r.width / 2, cy: r.top + r.height / 2, isQuiet };
        });
        render();
      };
      upd();
      resizeHandler = upd;
      window.addEventListener('resize', resizeHandler);

      moveHandler = (e) => { last = { x: e.clientX, y: e.clientY }; render(); };
      leaveHandler = () => { last = null; render(); };
      document.addEventListener('mousemove', moveHandler);
      document.addEventListener('mouseleave', leaveHandler);
      setGoopDone(true);
    };

    const startId = setTimeout(() => {
      if (cancelled) return;
      setRevealed(true);
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

      {/* ── What is Words? ── */}
      <Manifesto />

      {/* ── The three pillars ── */}
      <SimplicitySection />
      <PowerSection />
      <ConvenienceSection />

      {/* ── Bottom CTA + Footer (unified) ── */}
      <footer className="relative z-10 bg-[var(--color-bg-primary)] overflow-hidden">
        <Reveal>
          <div className="max-w-4xl mx-auto px-6 pt-16 sm:pt-24 pb-12 text-center">
            <h2 className="text-[2.4rem] sm:text-[3.4rem] leading-[1.03] mb-8" style={serifHead}>
              Your next thought deserves<br className="hidden sm:inline" /> a good home.
            </h2>
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

        <div className="relative z-20 max-w-6xl mx-auto px-6 pt-12 pb-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-[12px] text-[var(--color-text-faint)]">
          <div className="flex items-center gap-5">
            <span>© {new Date().getFullYear()} Words</span>
            <a
              href="/privacy"
              onClick={(e) => { e.preventDefault(); navigate('/privacy'); }}
              className="hover:text-[var(--color-text-primary)] transition-colors"
            >
              Privacy
            </a>
            <a
              href="/terms"
              onClick={(e) => { e.preventDefault(); navigate('/terms'); }}
              className="hover:text-[var(--color-text-primary)] transition-colors"
            >
              Terms
            </a>
          </div>
          <span>
            With love, the{' '}
            <a
              href="https://thenewjerseysoftware.company"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--color-text-primary)] transition-colors underline"
            >
              New Jersey Software Company
            </a>
          </span>
        </div>

        <div className="flex items-end justify-center -mb-[0.08em]">
          <FooterWordmark />
        </div>
      </footer>
    </div>
  );
}
