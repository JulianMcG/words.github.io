import React, { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Check } from 'lucide-react';
import { FolderIcon } from '../utils/folderIcons';

// ─── Helpers ────────────────────────────────────────────────────────────────────

// Hash-based helpers: deterministic per doc id
function docHash(id = '') {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = (Math.imul(h | 0, 31) + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function getTilt(id) {
  const raw = ((docHash(id) % 71) - 35) / 10; // -3.5 … +3.5
  return raw > -0.7 && raw < 0.7 ? (raw < 0 ? -1.1 : 1.1) : raw;
}

// One of four 90° rotations, so texture stays visible but varies per card
function getTextureRot(id) {
  return [0, 90, 180, 270][docHash(id + 'tex') % 4];
}

function stripHtml(html = '') {
  const d = document.createElement('div');
  d.innerHTML = html;
  return d.textContent || '';
}

function getDocLines(content = '') {
  if (!content) return [];
  const d = document.createElement('div');
  d.innerHTML = content.slice(0, 2000);
  const items = [];
  const seen = new Set();
  d.querySelectorAll('h1,h2,h3,p,li,blockquote').forEach((el) => {
    const t = el.textContent.trim();
    if (!t || seen.has(t)) return;
    seen.add(t);
    items.push({ text: t, tag: el.tagName.toLowerCase() });
  });
  return items.slice(0, 16);
}

// ─── Custom filter icon: three decreasing-width lines (funnel) ─────────────────
function FilterIcon({ size = 13 }) {
  return (
    <svg width={size} height={Math.round(size * 0.85)} viewBox="0 0 13 11" fill="none">
      <line x1="0.5" y1="1"   x2="12.5" y2="1"   stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="2.5" y1="5.5" x2="10.5" y2="5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="5"   y1="10"  x2="8"    y2="10"   stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

const SORT_OPTIONS = [
  { id: 'name',     label: 'Name' },
  { id: 'created',  label: 'Date Created' },
  { id: 'modified', label: 'Date Modified' },
];

// ─── Paper Card ─────────────────────────────────────────────────────────────────

const PaperCard = memo(function PaperCard({ doc, group, onOpen, isDark, index, isHovered, onHoverIn, onHoverOut }) {
  const tilt      = getTilt(doc.id);
  const texRot    = getTextureRot(doc.id);
  const lines     = useMemo(() => getDocLines(doc.content), [doc.content]);
  const isEmpty   = lines.length === 0;

  // Paper shadows: sharp, intense, animated
  const shadowBase = isDark
    ? '0 1px 2px rgba(0,0,0,0.50), 0 3px 7px rgba(0,0,0,0.35)'
    : '0 1px 1px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.11), 0 1px 2px rgba(0,0,0,0.08)';
  const shadowHover = isDark
    ? '0 4px 8px rgba(0,0,0,0.60), 0 10px 20px rgba(0,0,0,0.45)'
    : '0 4px 7px rgba(0,0,0,0.22), 0 10px 18px rgba(0,0,0,0.15)';

  return (
    // Cell wrapper — the square hover-highlighted area
    <div
      onMouseEnter={onHoverIn}
      onMouseLeave={onHoverOut}
      onClick={() => onOpen(doc.id)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Hover highlight: rounded square */}
      <div
        style={{
          width: 112,
          height: 112,
          borderRadius: 10,
          backgroundColor: isHovered ? 'var(--color-bg-hover)' : 'transparent',
          transition: 'background-color 0.13s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Paper */}
        <motion.div
          animate={{
            y: isHovered ? -6 : 0,
            boxShadow: isHovered ? shadowHover : shadowBase,
          }}
          transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            width: 90,
            height: 90,
            rotate: tilt,
            borderRadius: 1,
            backgroundColor: isDark ? '#2c2c2c' : '#fafaf8',
            overflow: 'hidden',
            position: 'relative',
            transformOrigin: 'center bottom',
            flexShrink: 0,
          }}
        >
          {/* Paper texture */}
          <div style={{
            position: 'absolute',
            inset: '-30%',
            backgroundImage: 'url(/paper.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `rotate(${texRot}deg)`,
            transformOrigin: 'center center',
            opacity: isDark ? 0.04 : 0.09,
            pointerEvents: 'none',
          }} />

          {/* Content lines */}
          <div style={{ position: 'relative', zIndex: 1, padding: '7px 7px 5px', height: '100%', boxSizing: 'border-box' }}>
            {isEmpty ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 8, alignItems: 'flex-start', opacity: 0.2 }}>
                {[28, 22, 26, 18].map((w, i) => (
                  <div key={i} style={{ width: w, height: 1.5, borderRadius: 1, backgroundColor: isDark ? '#fff' : '#37352f' }} />
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {lines.map((line, i) => {
                  const isH = ['h1', 'h2', 'h3'].includes(line.tag);
                  const isList = line.tag === 'li';
                  const isQuote = line.tag === 'blockquote';
                  return (
                    <div key={i} style={{
                      fontSize: isH ? 5.5 : 4.2,
                      lineHeight: isH ? '8px' : '6.5px',
                      marginTop: i === 0 ? 0 : isH ? 5 : 1.5,
                      fontWeight: isH ? 700 : 400,
                      color: isDark
                        ? (isH ? 'rgba(255,255,255,0.88)' : isQuote ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.65)')
                        : (isH ? 'rgba(55,53,47,0.90)' : isQuote ? 'rgba(55,53,47,0.35)' : 'rgba(55,53,47,0.65)'),
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      paddingLeft: isList ? 5 : isQuote ? 4 : 0,
                      borderLeft: isQuote ? `1.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(55,53,47,0.12)'}` : 'none',
                      flexShrink: 0,
                    }}>
                      {isList && <span style={{ marginRight: 2, opacity: 0.4, fontSize: 3.5 }}>•</span>}
                      {line.text}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Name — prominent, below highlight */}
      <div style={{
        marginTop: 5,
        width: 112,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
      }}>
        {group?.icon && (
          <span style={{ flexShrink: 0, lineHeight: 1, display: 'flex', alignItems: 'center' }}>
            <FolderIcon name={group.icon} size={9} color={group.color || 'var(--color-text-muted)'} />
          </span>
        )}
        {group && !group.icon && group.color && (
          <span style={{
            display: 'inline-block', width: 6, height: 6,
            borderRadius: 2, backgroundColor: group.color, flexShrink: 0,
          }} />
        )}
        <span style={{
          fontSize: 11.5,
          fontWeight: 500,
          lineHeight: '14px',
          color: isHovered ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
          transition: 'color 0.13s ease',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: group ? 88 : 108,
          letterSpacing: -0.15,
        }}>
          {doc.title || 'Untitled'}
        </span>
      </div>
    </div>
  );
});

// ─── Main ────────────────────────────────────────────────────────────────────────

export default function SpotlightSearch({ isOpen, onClose, docs, groups, activeDocId, onOpenDoc, isDark }) {
  const [query,        setQuery]        = useState('');
  const [sortBy,       setSortBy]       = useState('name');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [hoveredId,    setHoveredId]    = useState(null);
  const inputRef   = useRef(null);
  const sortRef    = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSortMenuOpen(false);
      setHoveredId(null);
      const t = setTimeout(() => inputRef.current?.focus(), 70);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (sortMenuOpen) setSortMenuOpen(false);
        else onClose();
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

  const groupMap = useMemo(() => {
    const m = {};
    (groups || []).forEach((g) => { m[g.id] = g; });
    return m;
  }, [groups]);

  const filteredDocs = useMemo(() => {
    const q = query.toLowerCase().trim();
    let result = (docs || []).filter((d) => {
      if (!q) return true;
      return (d.title || '').toLowerCase().includes(q) || stripHtml(d.content || '').toLowerCase().includes(q);
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
    return result;
  }, [docs, query, sortBy]);

  const handleOpen = useCallback((id) => { onOpenDoc(id); onClose(); }, [onOpenDoc, onClose]);
  const currentSort = SORT_OPTIONS.find((o) => o.id === sortBy);

  return (
    <>
      <style>{`
        .spotlight-input::placeholder { color: var(--color-text-faint); opacity: 1; }
        .spotlight-input:focus { outline: none; }
        .spotlight-sort-opt:hover { background: var(--color-bg-hover) !important; }
      `}</style>

      <AnimatePresence>
        {isOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9990, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>

            {/* Backdrop — no blur, subtle darkening */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={onClose}
              style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.22)' }}
            />

            {/* Shadow wrapper — filter:drop-shadow so lisse can squircle the inner modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ type: 'spring', stiffness: 560, damping: 42, mass: 0.7 }}
              style={{
                position: 'relative',
                filter: isDark
                  ? 'drop-shadow(0 6px 28px rgba(0,0,0,0.55)) drop-shadow(0 2px 8px rgba(0,0,0,0.35))'
                  : 'drop-shadow(0 6px 28px rgba(0,0,0,0.14)) drop-shadow(0 2px 8px rgba(0,0,0,0.09))',
              }}
            >
              {/* Modal — rounded-[14px] so lisse auto-applies squircle clip-path */}
              <div
                className="rounded-[14px]"
                style={{
                  width: '100%',
                  maxWidth: 720,
                  maxHeight: '78vh',
                  backgroundColor: 'var(--color-bg-primary)',
                  border: '1px solid var(--color-border-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {/* Search bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '11px 13px',
                  borderBottom: '1px solid var(--color-border-primary)',
                  flexShrink: 0,
                }}>
                  <Search size={15} style={{ color: 'var(--color-text-faint)', flexShrink: 0 }} />
                  <input
                    ref={inputRef}
                    className="spotlight-input"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search documents…"
                    style={{
                      flex: 1, background: 'transparent', border: 'none',
                      fontSize: 14, color: 'var(--color-text-primary)', minWidth: 0,
                    }}
                  />
                  <AnimatePresence>
                    {query && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={{ duration: 0.1 }}
                        onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                        className="rounded-md"
                        style={{
                          color: 'var(--color-text-muted)', background: 'var(--color-bg-hover)',
                          border: 'none', cursor: 'pointer', padding: '3px 3px',
                          display: 'flex', alignItems: 'center', flexShrink: 0,
                        }}
                      >
                        <X size={12} />
                      </motion.button>
                    )}
                  </AnimatePresence>

                  {/* Sort dropdown */}
                  <div ref={sortRef} style={{ position: 'relative', flexShrink: 0 }}>
                    <button
                      onClick={() => setSortMenuOpen((v) => !v)}
                      className="rounded-md"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '4px 9px',
                        border: '1px solid var(--color-border-primary)',
                        backgroundColor: sortMenuOpen ? 'var(--color-bg-hover)' : 'transparent',
                        cursor: 'pointer', fontSize: 12,
                        color: 'var(--color-text-muted)', transition: 'background 0.12s',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <FilterIcon size={12} />
                      {currentSort?.label}
                    </button>
                    <AnimatePresence>
                      {sortMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          transition={{ duration: 0.11, ease: [0.25, 0.46, 0.45, 0.94] }}
                          className="rounded-[10px]"
                          style={{
                            position: 'absolute', right: 0, top: 'calc(100% + 5px)',
                            backgroundColor: 'var(--color-bg-primary)',
                            border: '1px solid var(--color-border-primary)',
                            boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.45)' : '0 4px 16px rgba(0,0,0,0.11)',
                            padding: 3, minWidth: 150, zIndex: 10,
                          }}
                        >
                          {SORT_OPTIONS.map((opt) => (
                            <button
                              key={opt.id}
                              className="spotlight-sort-opt rounded-md"
                              onClick={() => { setSortBy(opt.id); setSortMenuOpen(false); }}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                width: '100%', padding: '6px 9px', border: 'none',
                                backgroundColor: sortBy === opt.id ? 'var(--color-bg-hover)' : 'transparent',
                                cursor: 'pointer', fontSize: 12.5,
                                color: 'var(--color-text-primary)', textAlign: 'left',
                              }}
                            >
                              {opt.label}
                              {sortBy === opt.id && <Check size={11} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Result count */}
                {query && (
                  <div style={{ padding: '7px 15px 0', fontSize: 11, color: 'var(--color-text-faint)', flexShrink: 0 }}>
                    {filteredDocs.length} {filteredDocs.length === 1 ? 'document' : 'documents'}
                  </div>
                )}

                {/* Grid */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 22px' }}>
                  {filteredDocs.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        height: 180, color: 'var(--color-text-faint)', fontSize: 13, gap: 8,
                      }}
                    >
                      <Search size={26} style={{ opacity: 0.22 }} />
                      <span>No documents found</span>
                    </motion.div>
                  ) : (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, 112px)',
                      gap: '2px 2px',
                      justifyContent: 'start',
                    }}>
                      <AnimatePresence mode="popLayout">
                        {filteredDocs.map((doc, i) => (
                          <motion.div
                            key={doc.id}
                            layout
                            initial={{ opacity: 0, scale: 0.88 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.84, transition: { duration: 0.12 } }}
                            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94], delay: Math.min(i * 0.018, 0.18) }}
                          >
                            <PaperCard
                              doc={doc}
                              group={doc.groupId ? groupMap[doc.groupId] : null}
                              onOpen={handleOpen}
                              isDark={isDark}
                              index={i}
                              isHovered={hoveredId === doc.id}
                              onHoverIn={() => setHoveredId(doc.id)}
                              onHoverOut={() => setHoveredId(null)}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
