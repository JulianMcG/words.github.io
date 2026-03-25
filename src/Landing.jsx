import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Heading1,
  Heading2,
  Layers,
  Cloud,
  Share2,
  Zap,
  Command,
  CheckSquare,
  List,
  Quote,
  FileText,
  Folder,
  ArrowRight,
  Table,
  Plus,
  Globe,
  Shield,
  Eye,
  Keyboard
} from 'lucide-react';
import GradualBlur from './components/GradualBlur';

/* ─── Springs ─── */
const SPRING = { type: 'spring', stiffness: 180, damping: 28 };
const SPRING_SNAPPY = { type: 'spring', stiffness: 300, damping: 26 };

/* ─── Reveal wrapper ─── */
const Reveal = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 28, filter: 'blur(4px)' }}
    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.55, delay, ...SPRING }}
    className={className}
  >
    {children}
  </motion.div>
);

/* ════════════════════════════════════════════════
   TYPEWRITER HOOK — natural, human-like typing
   Uses refs to avoid React Strict Mode double-fire
   ════════════════════════════════════════════════ */
function useTypewriter(text, { startDelay = 800, baseSpeed = 70, variance = 50, onComplete }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);
  const onCompleteRef = useRef(onComplete);
  const ranRef = useRef(false);
  const indexRef = useRef(0);

  // Keep callback ref fresh without triggering effects
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(t);
  }, [startDelay]);

  useEffect(() => {
    if (!started || ranRef.current) return;
    ranRef.current = true;
    indexRef.current = 0;
    let timeout;
    let cancelled = false;

    const type = () => {
      if (cancelled) return;
      if (indexRef.current < text.length) {
        indexRef.current++;
        const i = indexRef.current;
        setDisplayed(text.slice(0, i));

        // Natural timing: slower after spaces/punctuation, faster in bursts
        const char = text[i - 1];
        let delay = baseSpeed + (Math.random() - 0.5) * variance * 2;
        if (char === ' ') delay += 20 + Math.random() * 40;
        if (char === '\n') delay += 150 + Math.random() * 100;
        if (char === '.') delay += 250 + Math.random() * 150;
        // Occasional micro-pause (like thinking)
        if (Math.random() < 0.06) delay += 80 + Math.random() * 120;
        // Burst speed for vowels
        if (i > 1 && 'aeiou'.includes(char)) delay *= 0.75;

        timeout = setTimeout(type, Math.max(30, delay));
      } else {
        setDone(true);
        onCompleteRef.current?.();
      }
    };

    type();
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [started, text, baseSpeed, variance]);

  return { displayed, done, started };
}

/* ════════════════════════════════════════════════
   STICKY HEADER — logo centered→left, button fades in
   ════════════════════════════════════════════════ */
const StickyHeader = ({ navigate, scrolled }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      {/* Content */}
      <div className="relative" style={{ zIndex: 2 }}>
        <div className="px-6 h-14 flex items-center">
          {/* Logo — centered by default, moves to left on scroll */}
          <motion.button
            onClick={() => navigate('/')}
            layout
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-1.5 font-bold text-[19px] tracking-tight select-none hover:opacity-80 transition-opacity"
            style={{
              fontFamily: '"Gowun Batang", serif',
              position: 'absolute',
              left: scrolled ? '24px' : '50%',
              transform: scrolled ? 'translateX(0)' : 'translateX(-50%)',
              transition: 'left 0.5s cubic-bezier(0.22, 1, 0.36, 1), transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <div className="w-6 h-6 rounded flex items-center justify-center">
              <img src="/logolight.png" alt="Words" className="w-full h-full object-contain dark:hidden" />
              <img src="/logodark.png" alt="Words" className="w-full h-full object-contain hidden dark:block" />
            </div>
            Words
          </motion.button>

          {/* Button — far right corner, only on scroll */}
          <div className="ml-auto">
            <AnimatePresence>
              {scrolled && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => navigate('/app')}
                  className="group px-5 py-2 text-[13px] font-semibold rounded-[var(--radius-lg)] bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] hover:opacity-90 active:scale-[0.96] transition-all flex items-center gap-2"
                >
                  Start writing
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ════════════════════════════════════════════════
   ACCURATE APP PREVIEW — matches real Words app
   ════════════════════════════════════════════════ */
const AppPreview = () => {
  const editorRef = useRef(null);
  const [showSlash, setShowSlash] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowSlash(true), 2500);
    return () => clearTimeout(t);
  }, []);

  const handleEditorKeyDown = useCallback((e) => {
    if (e.key === '/') setShowSlash(true);
    else if (showSlash && e.key !== 'Shift') setShowSlash(false);
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      document.execCommand('insertParagraph');
    }
  }, [showSlash]);

  const slashCommands = [
    { icon: <Heading1 size={16} />, title: 'Heading 1', desc: 'Big section heading.', active: false },
    { icon: <Heading2 size={16} />, title: 'Heading 2', desc: 'Medium section heading.', active: true },
    { icon: <List size={16} />, title: 'Bulleted List', desc: 'Create a list.', active: false },
    { icon: <CheckSquare size={16} />, title: 'To-do List', desc: 'Track tasks.', active: false },
    { icon: <Quote size={16} />, title: 'Quote', desc: 'Capture a quote.', active: false },
    { icon: <Table size={16} />, title: 'Table', desc: 'Add a grid.', active: false },
  ];

  return (
    <div className="relative flex h-[540px] sm:h-[580px] rounded-[var(--radius-2xl)] border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] shadow-[0_12px_80px_-16px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_80px_-16px_rgba(0,0,0,0.6)] overflow-hidden">
      {/* ── Sidebar ── exact match to app */}
      <div className="hidden md:flex w-64 shrink-0 border-r border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] flex-col">
        {/* Doc list — starts at top, no logo/chevron header */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-6 pt-5 px-2">
          {/* New document button — exact match */}
          <div className="group relative flex items-center justify-between px-3 py-[6px] rounded-md cursor-pointer transition-colors text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] mb-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                <Plus size={16} className="text-[var(--color-icon-muted)]" />
              </div>
              <span className="text-[14px] truncate select-none text-[var(--color-icon-muted)]">New Document</span>
            </div>
          </div>

          {/* Documents — exact structure */}
          <div className="space-y-[2px]">
            {/* Active doc */}
            <div className="group relative flex items-center justify-between px-3 py-[6px] rounded-md cursor-pointer bg-[var(--color-bg-hover)] text-[var(--color-text-primary)]">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="text-base flex-shrink-0 leading-none select-none flex items-center justify-center w-5 h-5">📝</div>
                <span className="text-[14px] truncate select-none font-medium">Product Launch Plan</span>
              </div>
            </div>
            {/* Other docs */}
            <div className="group relative flex items-center justify-between px-3 py-[6px] rounded-md cursor-pointer text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] transition-colors">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="text-base flex-shrink-0 leading-none select-none flex items-center justify-center w-5 h-5">🎨</div>
                <span className="text-[14px] truncate select-none">Brand Guidelines</span>
              </div>
            </div>
            <div className="group relative flex items-center justify-between px-3 py-[6px] rounded-md cursor-pointer text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] transition-colors">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="text-base flex-shrink-0 leading-none select-none flex items-center justify-center w-5 h-5">
                  <FileText size={16} className="text-[var(--color-icon-muted)]" />
                </div>
                <span className="text-[14px] truncate select-none">Quick Notes</span>
              </div>
            </div>
          </div>

          {/* Folder — exact match with color */}
          <div className="mt-4">
            <div className="group relative flex items-center justify-between px-3 py-[6px] rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                  <Folder size={16} className="text-[var(--color-icon-muted)]" />
                </div>
                <span className="text-[14px] truncate select-none font-medium text-[var(--color-text-primary)]">Work</span>
              </div>
            </div>
            {/* Children */}
            <div className="ml-4 mt-[2px] space-y-[2px]">
              <div className="group relative flex items-center justify-between px-3 py-[6px] rounded-md cursor-pointer text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] transition-colors">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="text-base flex-shrink-0 leading-none select-none flex items-center justify-center w-5 h-5">📊</div>
                  <span className="text-[14px] truncate select-none">Q1 Analysis</span>
                </div>
              </div>
              <div className="group relative flex items-center justify-between px-3 py-[6px] rounded-md cursor-pointer text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] transition-colors">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="text-base flex-shrink-0 leading-none select-none flex items-center justify-center w-5 h-5">✅</div>
                  <span className="text-[14px] truncate select-none">Sprint Tasks</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Editor ── exact match: max-w-3xl, px-12, pt-24 */}
      <div className="flex-1 flex flex-col relative min-w-0 bg-[var(--color-bg-primary)] overflow-hidden">
        <main className="w-full max-w-3xl mx-auto px-8 sm:px-12 pt-8 sm:pt-10 pb-32 flex-grow">
          {/* Emoji + Title — exact: gap-3, text-[36px] sm:text-[42px] */}
          <div className="flex items-start gap-3 mb-8">
            <button className="w-[48px] h-[48px] mt-1 flex items-center justify-center -ml-2 hover:bg-[var(--color-bg-hover)] rounded-md transition-colors select-none cursor-pointer text-3xl">
              📝
            </button>
            <div
              className="flex-1 text-[36px] sm:text-[42px] font-bold leading-tight outline-none w-full break-words tracking-tight mt-0"
              contentEditable
              suppressContentEditableWarning
              spellCheck={false}
              style={{ fontFamily: 'inherit' }}
            >
              Product Launch Plan
            </div>
          </div>

          {/* Body — editable */}
          <div
            ref={editorRef}
            className="text-[15px] leading-[1.75] outline-none min-h-[200px]"
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            onKeyDown={handleEditorKeyDown}
            onClick={() => setShowSlash(false)}
            style={{ caretColor: 'var(--color-accent)' }}
            dangerouslySetInnerHTML={{ __html: `
              <p style="margin-bottom: 12px;">Our launch focuses on three pillars: <strong>clarity</strong>, <strong>speed</strong>, and <strong>delight</strong>. Every feature should feel invisible until you need it.</p>
              <blockquote style="border-left: 3px solid var(--color-accent); padding-left: 16px; margin: 16px 0; margin-left: 0; color: var(--color-text-muted); font-style: italic; font-family: 'Lora', serif;">"Simplicity is the ultimate sophistication."</blockquote>
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;"><div style="width: 18px; height: 18px; border-radius: 4px; border: 2px solid var(--color-accent); background: var(--color-accent); display: flex; align-items: center; justify-content: center; flex-shrink: 0;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div><span style="text-decoration: line-through; color: var(--color-text-muted);">Define brand identity</span></div>
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;"><div style="width: 18px; height: 18px; border-radius: 4px; border: 2px solid var(--color-border-hover); flex-shrink: 0;"></div><span>Build the landing page</span></div>
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;"><div style="width: 18px; height: 18px; border-radius: 4px; border: 2px solid var(--color-border-hover); flex-shrink: 0;"></div><span>Ship to production</span></div>
              <p style="margin-top: 16px;"><br></p>
            ` }}
          />

          {/* Slash cursor indicator */}
          {showSlash && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-0.5 text-lg text-[var(--color-text-faint)] mt-2"
            >
              <span>/</span>
              <motion.span initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }} transition={{ duration: 0.25 }} className="overflow-hidden whitespace-nowrap text-[var(--color-text-primary)] font-medium">h</motion.span>
              <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.9, ease: 'steps(1)' }} className="w-[2px] h-5 bg-[var(--color-accent)] inline-block ml-px" />
            </motion.div>
          )}
        </main>

        {/* Slash menu overlay */}
        <AnimatePresence>
          {showSlash && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 6, scale: 0.97, filter: 'blur(4px)' }}
              transition={{ duration: 0.15 }}
              className="absolute left-[72px] sm:left-[90px] bottom-20 w-[250px] bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-[var(--radius-xl)] shadow-xl overflow-hidden z-30"
            >
              <div className="px-3 py-1.5 text-[11px] font-semibold text-[var(--color-text-faint)] uppercase tracking-wider">
                Basic blocks
              </div>
              {slashCommands.map(cmd => (
                <div key={cmd.title} className={`flex items-center gap-3 px-3 py-[7px] mx-1 mb-0.5 rounded-[var(--radius-md)] ${cmd.active ? 'bg-[var(--color-bg-hover)]' : ''}`}>
                  <div className="w-8 h-8 rounded-[var(--radius)] border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] flex items-center justify-center text-[var(--color-text-muted)] shrink-0">{cmd.icon}</div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium truncate">{cmd.title}</div>
                    <div className="text-[11px] text-[var(--color-text-faint)] truncate">{cmd.desc}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ─── Feature Card ─── */
const FeatureCard = ({ icon, title, description, index }) => (
  <Reveal delay={index * 0.05}>
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2, ...SPRING_SNAPPY } }}
      className="group p-7 rounded-[var(--radius-2xl)] border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] hover:shadow-lg hover:border-[var(--color-border-hover)] transition-shadow duration-300"
    >
      <div className="w-10 h-10 rounded-[var(--radius-xl)] bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] flex items-center justify-center mb-5 text-[var(--color-accent)] group-hover:scale-105 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-[16px] font-bold mb-1.5 tracking-tight">{title}</h3>
      <p className="text-[14px] text-[var(--color-text-muted)] leading-relaxed">{description}</p>
    </motion.div>
  </Reveal>
);

/* ════════════════════════════════════════════════
   MAIN LANDING PAGE
   ════════════════════════════════════════════════ */
export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);

  // Parallax
  const previewRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: previewRef, offset: ['start end', 'end start'] });
  const previewY = useTransform(scrollYProgress, [0, 1], [20, -20]);

  // Page scroll for orange glow — visible at top and bottom, hidden in middle
  const { scrollY, scrollYProgress: pageProgress } = useScroll();
  const glowOpacity = useTransform(pageProgress, [0, 0.08, 0.15, 0.82, 0.92, 1], [1, 0.3, 0, 0, 0.3, 1]);

  // Swap favicon for landing page
  useEffect(() => {
    const link = document.querySelector('link[rel="icon"]');
    const original = link?.href;
    if (link) link.href = '/landingfavicon.png';
    return () => { if (link) link.href = original; };
  }, []);

  // Scroll listener
  useEffect(() => {
    const h = () => {
      setScrolled(window.scrollY > 300);
      setHasScrolled(window.scrollY > 2);
    };
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  // Typewriter
  const fullText = "Write without\nthe clutter.";
  const { displayed, done: typingDone, started } = useTypewriter(fullText, {
    startDelay: 600,
    baseSpeed: 75,
    variance: 45,
    onComplete: () => setTimeout(() => setIntroComplete(true), 400),
  });

  // Parse displayed text into lines
  const lines = displayed.split('\n');
  const line1 = lines[0] || '';
  const line2 = lines[1] || '';

  const features = [
    { icon: <Command size={20} />, title: 'Rich formatting', description: 'Type / to access headings, lists, quotes, tables, and more. No toolbar needed.' },
    { icon: <Eye size={20} />, title: 'Clutter-free', description: 'A clean canvas that gets out of your way. No buttons until you need them.' },
    { icon: <Layers size={20} />, title: 'Simple organization', description: 'Folders, pinned documents, drag and drop. Everything where you expect it.' },
    { icon: <Cloud size={20} />, title: 'Cloud sync', description: 'Sign in once, sync across every device. Entirely optional, always encrypted.' },
    { icon: <Zap size={20} />, title: 'Instant', description: 'Opens in milliseconds. No spinners, no splash screens, no waiting.' },
    { icon: <Shield size={20} />, title: 'Private by default', description: 'Your documents stay in your browser. Cloud sync is opt-in, never required.' },
  ];

  return (
    <div className={`min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-sans overflow-x-hidden ${!introComplete ? 'overflow-y-hidden max-h-screen' : ''}`}>

      {/* Orange glow behind preview area — appears after typing, fades on scroll */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: introComplete ? 1 : 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-[-800px] left-1/2 -translate-x-1/2 w-[200vw] h-[1200px] pointer-events-none z-10"
      >
        <motion.div style={{ opacity: glowOpacity }} className="w-full h-full">
          <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,#E8572A_0%,transparent_70%)] opacity-[0.35] dark:opacity-[0.25]" />
        </motion.div>
      </motion.div>

      {/* Progressive blur — only when scrolled */}
      <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none transition-opacity duration-300" style={{ height: '5.5rem', opacity: hasScrolled ? 1 : 0 }}>
        <GradualBlur position="top" height="5.5rem" strength={0.5} divCount={4} curve="ease-out" />
      </div>
      <div className="fixed top-0 left-0 right-0 h-12 z-40 pointer-events-none transition-opacity duration-300" style={{ background: 'linear-gradient(to bottom, var(--color-bg-primary) 25%, transparent 100%)', opacity: hasScrolled ? 1 : 0 }} />

      {/* Header — only after intro is done */}
      <AnimatePresence>
        {introComplete && <StickyHeader navigate={navigate} scrolled={scrolled} />}
      </AnimatePresence>

      {/* ─── Hero with typewriter ─── takes full viewport, content centered */}
      <section className="relative px-6 h-[100svh] flex flex-col items-center justify-center">


        <div className="relative max-w-4xl mx-auto w-full text-center">
          {/* Typewriter headline */}
          <h1
            className="text-[clamp(3rem,8vw,5.5rem)] font-bold tracking-tight leading-[1.06] mb-6 min-h-[2.2em]"
            style={{ fontFamily: '"Gowun Batang", serif' }}
          >
            {started ? (
              <>
                {line1}
                {lines.length > 1 && <br />}
                {/* Color "clutter" orange if visible */}
                {line2 && (() => {
                  const clutterIdx = 'the clutter.'.indexOf('clutter');
                  const fullLine2 = 'the clutter.';
                  // Only color the "clutter" portion that's been typed
                  if (line2.length > clutterIdx + 3) {
                    const before = line2.slice(0, clutterIdx);
                    const clutterPart = line2.slice(clutterIdx, clutterIdx + 7);
                    const after = line2.slice(clutterIdx + 7);
                    return <>{before}<span className="text-[var(--color-accent)]">{clutterPart}</span>{after}</>;
                  }
                  return line2;
                })()}
                {/* Blinking cursor */}
                {!typingDone && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: 'steps(1)' }}
                    className="inline-block w-[3px] h-[0.85em] bg-[var(--color-accent)] ml-1 align-baseline translate-y-[0.05em]"
                  />
                )}
              </>
            ) : (
              /* Initial blinking cursor before typing starts */
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'steps(1)' }}
                className="inline-block w-[3px] h-[0.85em] bg-[var(--color-accent)] align-baseline"
              />
            )}
          </h1>

          {/* Subtitle + CTA — always in layout (prevents jump), animated visible */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: introComplete ? 1 : 0, y: introComplete ? 0 : 20, filter: introComplete ? 'blur(0px)' : 'blur(10px)' }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-[clamp(1rem,2vw,1.2rem)] text-[var(--color-text-muted)] max-w-xl mx-auto leading-relaxed mb-10"
          >
            A distraction-free editor that lives in your browser.<br />
            No setup, no friction, just words.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: introComplete ? 1 : 0, y: introComplete ? 0 : 20, scale: introComplete ? 1 : 0.95, filter: introComplete ? 'blur(0px)' : 'blur(8px)' }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-4 mb-4"
          >
            <button
              onClick={() => navigate('/app')}
              className="group px-8 py-3.5 bg-[var(--color-accent)] text-white rounded-[var(--radius-xl)] font-semibold text-[17px] hover:brightness-110 active:scale-[0.97] transition-all flex items-center gap-2"
            >
              Start writing
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ─── Product Preview — peeks if enough space ─── */}
      <section
        className="px-6 pb-24 sm:pb-32 relative z-20"
        ref={previewRef}
        style={{ marginTop: 'clamp(-100px, calc(-100svh + 525px), 0px)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 80, filter: 'blur(10px)' }}
          animate={introComplete ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-[1000px] mx-auto z-20"
        >
          <AppPreview />
        </motion.div>
      </section>

      {/* ─── Features ─── */}
      <section className="px-6 py-24 sm:py-32">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3" style={{ fontFamily: '"Gowun Batang", serif' }}>
                Everything you need.
                <br className="hidden sm:inline" />
                {' '}Nothing you don't.
              </h2>
              <p className="text-[var(--color-text-muted)] text-lg">Built for writers who value simplicity.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <FeatureCard key={f.title} {...f} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── /commands Showcase ─── */}
      <section className="px-6 py-24 sm:py-32 border-t border-[var(--color-border-primary)]">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <Reveal>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] text-[13px] font-semibold text-[var(--color-text-muted)] mb-6">
                  <Command size={14} className="text-[var(--color-accent)]" />
                  /commands
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4" style={{ fontFamily: '"Gowun Batang", serif' }}>
                  Type <span className="text-[var(--color-accent)]">/</span> to do anything.
                </h2>
                <p className="text-[var(--color-text-muted)] text-lg leading-relaxed mb-8">
                  Headings, lists, quotes, tables — everything is one keystroke away. No toolbar hunting.
                </p>
                <div className="space-y-3">
                  {[
                    { cmd: '/h1', desc: 'Create a big heading' },
                    { cmd: '/todo', desc: 'Add a to-do checklist' },
                    { cmd: '/quote', desc: 'Insert a blockquote' },
                    { cmd: '/table', desc: 'Drop in a resizable table' },
                    { cmd: '/image', desc: 'Embed an image' },
                  ].map(item => (
                    <motion.div key={item.cmd} whileHover={{ x: 4, transition: { duration: 0.15 } }} className="flex items-center gap-3">
                      <code className="px-2 py-1 text-[13px] font-semibold rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] text-[var(--color-accent)] min-w-[70px] text-center">{item.cmd}</code>
                      <span className="text-[15px] text-[var(--color-text-muted)]">{item.desc}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="relative bg-[var(--color-bg-secondary)] rounded-[var(--radius-2xl)] border border-[var(--color-border-primary)] p-8 sm:p-10 min-h-[360px]">
                <div className="space-y-4 text-[15px]">
                  <div className="text-2xl font-bold tracking-tight">Meeting Notes</div>
                  <p className="text-[var(--color-text-muted)]">Discussed the product roadmap for Q2.</p>
                  <div className="flex items-center gap-3 mt-4">
                    <div className="w-[18px] h-[18px] rounded-[4px] border-2 border-[var(--color-accent)] bg-[var(--color-accent)] flex items-center justify-center shrink-0">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <span className="line-through text-[var(--color-text-muted)]">Review designs</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-[18px] h-[18px] rounded-[4px] border-2 border-[var(--color-border-hover)] shrink-0"></div>
                    <span>Ship the landing page</span>
                  </div>
                </div>
                <div className="mt-8 flex items-center gap-0.5 text-[var(--color-text-faint)]">
                  <span className="text-lg">/</span>
                  <span className="text-[var(--color-accent)] font-medium">quote</span>
                  <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.9, ease: 'steps(1)' }} className="w-[2px] h-5 bg-[var(--color-accent)] inline-block ml-px" />
                </div>
                <div className="absolute bottom-6 left-8 sm:left-10 w-[220px] bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-[var(--radius-xl)] shadow-xl overflow-hidden">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-[var(--color-text-faint)] uppercase tracking-wider border-b border-[var(--color-border-primary)]">Basic blocks</div>
                  <div className="p-1">
                    <div className="flex items-center gap-3 px-2 py-1.5 rounded-[var(--radius-md)] bg-[var(--color-bg-hover)]">
                      <div className="w-8 h-8 rounded-[var(--radius)] border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] flex items-center justify-center text-[var(--color-text-muted)]"><Quote size={15} /></div>
                      <div>
                        <div className="text-[13px] font-medium">Quote</div>
                        <div className="text-[11px] text-[var(--color-text-faint)]">Capture a quote.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <section className="px-6 pt-8 pb-24 sm:pb-32">
        <Reveal>
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ...SPRING_SNAPPY }}
              className="mb-8"
            >
              <div className="w-14 h-14 rounded-[var(--radius-2xl)] bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] flex items-center justify-center mx-auto mb-8">
                <img src="/logolight.png" alt="Words" className="w-7 h-7 object-contain dark:hidden" />
                <img src="/logodark.png" alt="Words" className="w-7 h-7 object-contain hidden dark:block" />
              </div>
            </motion.div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4" style={{ fontFamily: '"Gowun Batang", serif' }}>
              Your next thought deserves<br className="hidden sm:inline" /> a better home.
            </h2>
            <p className="text-lg text-[var(--color-text-muted)] mb-10 max-w-lg mx-auto">
              Words is free, instant, and works right in your browser. No account needed.
            </p>
            <button
              onClick={() => navigate('/app')}
              className="group px-10 py-4 bg-[var(--color-accent)] text-white rounded-[var(--radius-xl)] font-semibold text-lg hover:brightness-110 active:scale-[0.97] transition-all inline-flex items-center gap-2"
            >
              Open Words
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </Reveal>
      </section>

      {/* ─── Footer ─── */}
      <footer className="px-6 py-10 border-t border-[var(--color-border-primary)]">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 text-[13px] text-[var(--color-text-faint)]">
          <div className="w-4 h-4 flex items-center justify-center opacity-40">
            <img src="/faviconlight.png" alt="" className="w-full h-full object-contain dark:hidden" />
            <img src="/favicondark.png" alt="" className="w-full h-full object-contain hidden dark:block" />
          </div>
          © {new Date().getFullYear()} Words
        </div>
      </footer>
    </div>
  );
}
