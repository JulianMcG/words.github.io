import React, {
  useState, useMemo, useEffect, useLayoutEffect, useCallback, useRef, memo,
} from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, animate } from 'framer-motion';
import { Search, X, Check, ListFilter } from 'lucide-react';
import { FolderIcon } from '../utils/folderIcons';
import GradualBlur from './GradualBlur';
import { generateClipPath } from '@lisse/core';

// ─── Icons ────────────────────────────────────────────────────────────────────
function DocPageIcon({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="14" y2="17" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function docHash(id = '') {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = (Math.imul(h | 0, 31) + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function getTilt(id) {
  const raw = ((docHash(id) % 71) - 35) / 10;
  return raw > -0.7 && raw < 0.7 ? (raw < 0 ? -1.2 : 1.2) : raw;
}
function stripHtml(html = '') {
  if (!html) return '';
  if (typeof html !== 'string') return '';
  try {
    const d = document.createElement('div');
    d.innerHTML = html;
    return d.textContent || '';
  } catch {
    return html.replace(/<[^>]+>/g, ' ');
  }
}
function getDocLines(content) {
  if (!content || typeof content !== 'string') return [];
  try {
    const d = document.createElement('div');
    d.innerHTML = content.slice(0, 4000);
    const items = [];
    const seen = new Set();
    d.querySelectorAll('h1,h2,h3,h4,p,li,blockquote,div,td,th').forEach((el) => {
      if (el.querySelector('h1,h2,h3,h4,p,li,blockquote,div')) return;
      const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!t || seen.has(t) || t.length < 2) return;
      seen.add(t);
      items.push({ text: t, tag: el.tagName.toLowerCase() });
    });
    return items.slice(0, 30);
  } catch {
    return [];
  }
}

const SORT_OPTIONS = [
  { id: 'name',     label: 'Name' },
  { id: 'created',  label: 'Date Created' },
  { id: 'modified', label: 'Date Modified' },
];

const SPRING = { stiffness: 320, damping: 26, mass: 0.55 };

// Inject static styles once at module load — not inside render
if (typeof document !== 'undefined' && !document.getElementById('sl-styles')) {
  const s = document.createElement('style');
  s.id = 'sl-styles';
  s.textContent = `
    .sl-input::placeholder { color: var(--color-text-faint); opacity: 1; }
    .sl-input:focus { outline: none; }
    .sl-input { transition: width 0.12s ease; }
    .sl-sort-opt:hover { background: var(--color-bg-hover) !important; }
  `;
  document.head.appendChild(s);
}

// ─── Paper Card ───────────────────────────────────────────────────────────────
const PaperCard = memo(function PaperCard({ doc, group, onOpen, isDark }) {
  const cardRef  = useRef(null);
  const nameRef  = useRef(null);
  const textRef  = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const tiltX  = useMotionValue(0);
  const tiltY  = useMotionValue(0);
  const textX  = useMotionValue(0);
  const springX = useSpring(tiltX, SPRING);
  const springY = useSpring(tiltY, SPRING);

  useEffect(() => {
    if (!nameRef.current || !textRef.current) return;
    const overflow = textRef.current.scrollWidth - nameRef.current.offsetWidth;
    if (isHovered && overflow > 2) {
      const tid = setTimeout(() => {
        animate(textX, -overflow, { duration: overflow / 32, ease: 'linear' });
      }, 550);
      return () => clearTimeout(tid);
    } else {
      animate(textX, 0, { type: 'spring', stiffness: 400, damping: 36 });
    }
  }, [isHovered]);

  const staticTilt = getTilt(doc.id);
  const lines = useMemo(() => getDocLines(doc.content), [doc.content]);

  const paperBg    = isDark ? '#2a2a2a' : '#ffffff';
  const shadowRest = isDark
    ? '0 1px 3px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.32)'
    : '0 1px 2px rgba(0,0,0,0.09), 0 3px 10px rgba(0,0,0,0.07)';
  const shadowHover = isDark
    ? '0 6px 20px rgba(0,0,0,0.65), 0 18px 36px rgba(0,0,0,0.44)'
    : '0 6px 20px rgba(0,0,0,0.16), 0 18px 36px rgba(0,0,0,0.10)';

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const dx = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
    const dy = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
    tiltX.set(dy * -13);
    tiltY.set(dx *  17);
  }, [tiltX, tiltY]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    tiltX.set(0);
    tiltY.set(0);
  }, [tiltX, tiltY]);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onOpen(doc.id)}
      style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <div style={{
        width: '100%', padding: '8px 8px 6px', borderRadius: 12,
        backgroundColor: isHovered
          ? (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)')
          : 'transparent',
        transition: 'background-color 0.13s',
        display: 'flex', justifyContent: 'center',
      }}>
        <motion.div
          animate={{ y: isHovered ? -8 : 0, boxShadow: isHovered ? shadowHover : shadowRest }}
          transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            width: 112, height: 150,
            borderRadius: 3,
            rotate: staticTilt,
            rotateX: springX,
            rotateY: springY,
            transformPerspective: 800,
            backgroundColor: paperBg,
            overflow: 'hidden',
            flexShrink: 0,
            willChange: 'transform, box-shadow',
          }}
        >
          {lines.length > 0 && (
            <div style={{ padding: '10px 9px 0', height: '100%', boxSizing: 'border-box' }}>
              {lines.map((line, i) => {
                const isH    = ['h1','h2','h3','h4'].includes(line.tag);
                const isList = line.tag === 'li';
                return (
                  <div key={i} style={{
                    fontSize: isH ? 6.5 : 5,
                    lineHeight: isH ? '10px' : '8px',
                    marginTop: i === 0 ? 0 : isH ? 7 : 2,
                    fontWeight: isH ? 700 : 400,
                    color: isDark
                      ? (isH ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.60)')
                      : (isH ? 'rgba(55,53,47,0.92)' : 'rgba(55,53,47,0.60)'),
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    paddingLeft: isList ? 6 : 0,
                  }}>
                    {isList && <span style={{ marginRight: 3, opacity: 0.5 }}>·</span>}
                    {line.text}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 3, paddingBottom: 2 }}>
        {doc.emoji
          ? <span style={{ fontSize: 12, lineHeight: 1, flexShrink: 0 }}>{doc.emoji}</span>
          : <DocPageIcon size={12} className="text-[var(--color-icon-muted)]" />
        }
        <div ref={nameRef} style={{ position: 'relative', overflow: 'hidden', maxWidth: 102, flex: '1 1 0', minWidth: 0 }}>
          <motion.span
            ref={textRef}
            style={{
              fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)',
              whiteSpace: 'nowrap', display: 'block', letterSpacing: -0.1,
              x: textX,
            }}
          >
            {doc.title || 'Untitled'}
          </motion.span>
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 20,
            background: isDark
              ? 'linear-gradient(to right, transparent, var(--color-bg-secondary))'
              : 'linear-gradient(to right, transparent, var(--color-bg-secondary))',
            pointerEvents: 'none',
          }} />
        </div>
        {group?.icon && (
          <FolderIcon name={group.icon} size={9} color={group.color || 'var(--color-icon-muted)'} style={{ flexShrink: 0 }} />
        )}
        {group && !group.icon && group.color && (
          <span className="rounded-[2px]" style={{ display: 'inline-block', width: 6, height: 6, backgroundColor: group.color, flexShrink: 0 }} />
        )}
      </div>
    </div>
  );
});

// ─── Scroll-aware fade overlay ────────────────────────────────────────────────
function FadeEdge({ position, visible, height = 52, bgColor = 'var(--color-bg-secondary)' }) {
  const isTop = position === 'top';
  return (
    <div style={{
      position: 'absolute',
      [isTop ? 'top' : 'bottom']: 0,
      left: 0, right: 0, height,
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.22s ease',
      pointerEvents: 'none', zIndex: 3,
    }}>
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: `linear-gradient(to ${isTop ? 'bottom' : 'top'}, ${bgColor} ${isTop ? '15%' : '25%'}, transparent 100%)`,
      }} />
      <GradualBlur position={position} height={`${height}px`} strength={0.44} divCount={7} zIndex={0} />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SpotlightSearch({ isOpen, onClose, docs, groups, activeDocId, onOpenDoc, isDark }) {
  const [query,        setQuery]        = useState('');
  const [sortBy,       setSortBy]       = useState('name');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [hasScrollAbove, setHasScrollAbove] = useState(false);
  const [hasScrollBelow, setHasScrollBelow] = useState(false);

  const inputRef       = useRef(null);
  const mirrorRef      = useRef(null);
  const sortRef        = useRef(null);
  const scrollRef      = useRef(null);
  const filteredDocRef = useRef([]);
  const shellRef       = useRef(null);

  useLayoutEffect(() => {
    if (!mirrorRef.current || !inputRef.current) return;
    inputRef.current.style.width = query
      ? `${mirrorRef.current.offsetWidth + 4}px`
      : '100%';
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSortMenuOpen(false);
      setHasScrollAbove(false);
      setHasScrollBelow(false);
      const t = setTimeout(() => inputRef.current?.focus(), 70);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (sortMenuOpen) setSortMenuOpen(false); else onClose();
      }
      if (e.key === 'Enter' && filteredDocRef.current.length > 0) {
        e.preventDefault();
        handleOpen(filteredDocRef.current[0].id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, sortMenuOpen]);

  useEffect(() => {
    if (!sortMenuOpen) return;
    const onDown = (e) => { if (!sortRef.current?.contains(e.target)) setSortMenuOpen(false); };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [sortMenuOpen]);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setHasScrollAbove(el.scrollTop > 8);
    setHasScrollBelow(el.scrollTop < el.scrollHeight - el.clientHeight - 8);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !isOpen) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    return () => el.removeEventListener('scroll', checkScroll);
  }, [checkScroll, isOpen]);

  const groupMap = useMemo(() => {
    const m = {};
    (groups || []).forEach((g) => { m[g.id] = g; });
    return m;
  }, [groups]);

  const docTextMap = useMemo(() => {
    const m = new Map();
    (docs || []).forEach(d => m.set(d.id, stripHtml(d.content || '').toLowerCase()));
    return m;
  }, [docs]);

  const filteredDocs = useMemo(() => {
    const q = query.toLowerCase().trim();
    let result = (docs || []).filter((d) => {
      if (!q) return true;
      if ((d.title || '').toLowerCase().includes(q)) return true;
      return (docTextMap.get(d.id) || '').includes(q);
    });
    if (sortBy === 'name') {
      result = [...result].sort((a, b) => (a.title || 'Untitled').localeCompare(b.title || 'Untitled'));
    } else if (sortBy === 'created') {
      result = [...result].sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });
    }
    filteredDocRef.current = result;
    return result;
  }, [docs, query, sortBy, docTextMap]);

  useEffect(() => {
    requestAnimationFrame(checkScroll);
  }, [filteredDocs, checkScroll]);

  // Apply squircle to spotlight shell manually so it's stable regardless of
  // Framer Motion's layoutId transform state or browser zoom.
  useEffect(() => {
    const el = shellRef.current;
    if (!el || !isOpen) return;

    const applySquircle = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w > 0 && h > 0) {
        el.style.clipPath = generateClipPath(w, h, { radius: 18, smoothing: 0.6 });
      }
    };

    // Apply after the layoutId spring animation settles (~350ms for stiffness:440)
    const timer = setTimeout(applySquircle, 380);

    // Recompute on resize (e.g. browser zoom changes 80vh height)
    let rafId;
    const obs = new ResizeObserver(() => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(applySquircle);
    });
    obs.observe(el);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafId);
      obs.disconnect();
      if (el) el.style.clipPath = '';
    };
  }, [isOpen]);

  const handleOpen  = useCallback((id) => { onOpenDoc(id); onClose(); }, [onOpenDoc, onClose]);
  const topDoc      = filteredDocs[0] || null;
  const currentSort = SORT_OPTIONS.find((o) => o.id === sortBy);

  return (
    <>

      <span ref={mirrorRef} aria-hidden="true" style={{
        position: 'fixed', top: -9999, left: -9999,
        fontSize: 17, fontFamily: 'inherit', whiteSpace: 'pre',
        visibility: 'hidden', pointerEvents: 'none',
      }}>
        {query}
      </span>

      <AnimatePresence>
        {isOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9990, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>

            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={onClose}
              style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.24)' }}
            />

            {/* Shadow wrapper: drop-shadow here so it renders around the squircle shell below, avoiding any clip-path recalc artifacts on zoom */}
            <div style={{
              position: 'relative', width: '100%', maxWidth: 740,
              filter: isDark
                ? 'drop-shadow(0 10px 36px rgba(0,0,0,0.58)) drop-shadow(0 2px 8px rgba(0,0,0,0.32))'
                : 'drop-shadow(0 10px 36px rgba(0,0,0,0.13)) drop-shadow(0 2px 8px rgba(0,0,0,0.07))',
            }}>
            {/* Shell: pure layoutId morph from button — no layout prop to avoid conflicts */}
            <motion.div
              ref={shellRef}
              layoutId="spotlight-shell"
              exit={{ transition: { duration: 0.001 } }}
              transition={{ layout: { type: 'spring', stiffness: 440, damping: 34, mass: 0.85 } }}
              style={{
                width: '100%', maxHeight: '80vh',
                borderRadius: 18,
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border-primary)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
              }}
            >
                {/* ── Search row ── */}
                <div
                  onClick={() => inputRef.current?.focus()}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px', flexShrink: 0, cursor: 'text', position: 'relative', zIndex: 2 }}
                >
                  {/* Persistent icon — shared layoutId keeps it visible through the morph */}
                  <motion.span
                    layoutId="spotlight-icon"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--color-text-muted)' }}
                    transition={{ layout: { type: 'spring', stiffness: 480, damping: 42, mass: 0.85 } }}
                  >
                    <Search size={18} />
                  </motion.span>

                  {/* Input + controls — blur-reveal after shell expands */}
                  <motion.div
                    initial={{ opacity: 0, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, filter: 'blur(8px)' }}
                    transition={{ duration: 0.2, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                    style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}
                  >
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                      <input
                        ref={inputRef}
                        className="sl-input"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search documents…"
                        style={{
                          background: 'transparent', border: 'none', fontSize: 17,
                          color: 'var(--color-text-primary)',
                          flex: '0 0 auto', minWidth: 40,
                        }}
                      />
                      <span style={{
                        fontSize: 13, color: 'var(--color-text-faint)',
                        opacity: (query && topDoc) ? 1 : 0,
                        transition: 'opacity 0.13s',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        maxWidth: 200, flexShrink: 1, marginLeft: 3,
                        pointerEvents: 'none',
                      }}>
                        {topDoc ? `— ${topDoc.title || 'Untitled'}` : ''}
                      </span>
                    </div>

                    <AnimatePresence>
                      {query && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.1 }}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                          className="rounded-md"
                          style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg-hover-strong)', border: 'none', cursor: 'pointer', padding: '3px 4px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                        >
                          <X size={12} />
                        </motion.button>
                      )}
                    </AnimatePresence>

                    <div ref={sortRef} style={{ position: 'relative', flexShrink: 0 }}>
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => { e.stopPropagation(); setSortMenuOpen((v) => !v); }}
                        title={`Sort: ${currentSort?.label}`}
                        className={`p-1 rounded-md transition-colors ${sortMenuOpen || sortBy !== 'name' ? 'bg-[var(--color-bg-hover-strong)] text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover-strong)] hover:text-[var(--color-text-primary)]'}`}
                        style={{ border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <ListFilter size={16} />
                      </button>

                      <AnimatePresence>
                        {sortMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.94, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.94, y: -4 }}
                            transition={{ duration: 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
                            style={{
                              position: 'absolute', right: 0, top: 'calc(100% + 10px)',
                              zIndex: 9999,
                              filter: isDark ? 'drop-shadow(0 4px 20px rgba(0,0,0,0.50))' : 'drop-shadow(0 4px 20px rgba(0,0,0,0.12))',
                            }}
                          >
                            <div
                              className="rounded-[10px]"
                              style={{
                                position: 'relative',
                                backgroundColor: 'var(--color-bg-primary)',
                                border: '1px solid var(--color-border-primary)',
                                padding: 4, minWidth: 158,
                              }}
                            >
                            <div style={{ position: 'absolute', bottom: '100%', right: 9, width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderBottom: `7px solid var(--color-border-primary)` }} />
                            <div style={{ position: 'absolute', bottom: 'calc(100% - 1px)', right: 10, width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: `6px solid var(--color-bg-primary)` }} />
                            {SORT_OPTIONS.map((opt) => (
                              <button
                                key={opt.id}
                                className="sl-sort-opt rounded-md"
                                onClick={() => { setSortBy(opt.id); setSortMenuOpen(false); }}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  width: '100%', padding: '7px 10px', border: 'none',
                                  backgroundColor: sortBy === opt.id ? 'var(--color-bg-hover)' : 'transparent',
                                  cursor: 'pointer', fontSize: 13, color: 'var(--color-text-primary)', textAlign: 'left',
                                }}
                              >
                                {opt.label}
                                {sortBy === opt.id && <Check size={12} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />}
                              </button>
                            ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </div>

                {/* ── Scrollable grid — blur-reveals after shell expands ── */}
                <motion.div
                  initial={{ opacity: 0, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, filter: 'blur(8px)' }}
                  transition={{ duration: 0.22, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
                >
                  <div
                    ref={scrollRef}
                    style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '4px 14px 60px' }}
                  >
                    {filteredDocs.length === 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--color-text-muted)', fontSize: 13, gap: 8 }}>
                        <Search size={24} style={{ opacity: 0.3 }} />
                        <span>No documents found</span>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '14px 8px' }}>
                        <AnimatePresence initial={false}>
                          {filteredDocs.map((doc) => (
                            <motion.div
                              key={doc.id}
                              initial={{ opacity: 0, scale: 0.88 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.88 }}
                              transition={{ duration: 0.16, ease: [0.25, 0.46, 0.45, 0.94] }}
                            >
                              <PaperCard
                                doc={doc}
                                group={doc.groupId ? groupMap[doc.groupId] : null}
                                onOpen={handleOpen}
                                isDark={isDark}
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  <FadeEdge position="top"    visible={hasScrollAbove} height={52} />
                  <FadeEdge position="bottom" visible={hasScrollBelow} height={60} />
                </motion.div>
            </motion.div>
            </div>{/* end shadow wrapper */}
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
