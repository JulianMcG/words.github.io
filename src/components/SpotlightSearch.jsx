import React, { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Check } from 'lucide-react';
import { FolderIcon } from '../utils/folderIcons';
import GradualBlur from './GradualBlur';

// ─── Doc page icon (matches App.jsx) ────────────────────────────────────────────
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

// ─── Funnel icon ─────────────────────────────────────────────────────────────────
function FilterIcon({ size = 15 }) {
  return (
    <svg width={size} height={Math.round(size * 0.84)} viewBox="0 0 15 12.5" fill="none">
      <line x1="0.75" y1="1.25" x2="14.25" y2="1.25" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
      <line x1="3"    y1="6.25" x2="12"    y2="6.25" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
      <line x1="5.5"  y1="11.25" x2="9.5"  y2="11.25" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────────
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
  const d = document.createElement('div');
  d.innerHTML = html;
  return d.textContent || '';
}
function getDocLines(content = '') {
  if (!content) return [];
  const d = document.createElement('div');
  d.innerHTML = content.slice(0, 3000);
  const items = [];
  const seen = new Set();
  d.querySelectorAll('h1,h2,h3,p,li,blockquote').forEach((el) => {
    const t = el.textContent.trim();
    if (!t || seen.has(t)) return;
    seen.add(t);
    items.push({ text: t, tag: el.tagName.toLowerCase() });
  });
  return items.slice(0, 24);
}

const SORT_OPTIONS = [
  { id: 'name',     label: 'Name' },
  { id: 'created',  label: 'Date Created' },
  { id: 'modified', label: 'Date Modified' },
];

// ─── Paper Card ──────────────────────────────────────────────────────────────────
const PaperCard = memo(function PaperCard({ doc, group, onOpen, isDark, isHovered, onHoverIn, onHoverOut }) {
  const tilt  = getTilt(doc.id);
  const lines = useMemo(() => getDocLines(doc.content), [doc.content]);
  const hasContent = !!(doc.content && stripHtml(doc.content).trim().length > 0);

  const paperBg     = isDark ? '#2a2a2a' : '#ffffff';
  const shadowRest  = isDark
    ? '0 1px 3px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.32)'
    : '0 1px 2px rgba(0,0,0,0.09), 0 3px 10px rgba(0,0,0,0.07)';
  const shadowHover = isDark
    ? '0 6px 18px rgba(0,0,0,0.62), 0 16px 32px rgba(0,0,0,0.42)'
    : '0 6px 18px rgba(0,0,0,0.15), 0 16px 32px rgba(0,0,0,0.09)';

  return (
    <div
      onMouseEnter={onHoverIn}
      onMouseLeave={onHoverOut}
      onClick={() => onOpen(doc.id)}
      style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      {/* Hover highlight tile */}
      <div style={{
        width: '100%',
        padding: '8px 8px 6px',
        borderRadius: 12,
        backgroundColor: isHovered
          ? (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)')
          : 'transparent',
        transition: 'background-color 0.13s',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <motion.div
          animate={{ y: isHovered ? -7 : 0, boxShadow: isHovered ? shadowHover : shadowRest }}
          transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            width: 112,
            height: 150,
            rotate: tilt,
            borderRadius: 3,
            backgroundColor: paperBg,
            overflow: 'hidden',
            transformOrigin: 'center bottom',
            flexShrink: 0,
          }}
        >
          <div style={{ padding: '10px 9px 0', height: '100%', boxSizing: 'border-box' }}>
            {lines.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, paddingTop: 4, opacity: 0.18 }}>
                {[38, 26, 33, 20].map((w, i) => (
                  <div key={i} style={{ width: w, height: 2, borderRadius: 1, backgroundColor: isDark ? '#fff' : '#37352f' }} />
                ))}
              </div>
            ) : lines.map((line, i) => {
              const isH = ['h1','h2','h3'].includes(line.tag);
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
                  paddingLeft: isList ? 6 : 0, flexShrink: 0,
                }}>
                  {isList && <span style={{ marginRight: 3, opacity: 0.5 }}>·</span>}
                  {line.text}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Name row: emoji/icon + title + folder indicator */}
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 3, paddingBottom: 2 }}>
        {/* Emoji or page icon */}
        {doc.emoji ? (
          <span style={{ fontSize: 12, lineHeight: 1, flexShrink: 0 }}>{doc.emoji}</span>
        ) : (
          <DocPageIcon size={12} className="text-[var(--color-icon-muted)]" style={{ flexShrink: 0 }} />
        )}
        <span style={{
          fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          maxWidth: 102, letterSpacing: -0.1,
        }}>
          {doc.title || 'Untitled'}
        </span>
        {group?.icon && (
          <FolderIcon name={group.icon} size={9} color={group.color || 'var(--color-icon-muted)'} style={{ flexShrink: 0 }} />
        )}
        {group && !group.icon && group.color && (
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 2, backgroundColor: group.color, flexShrink: 0 }} />
        )}
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
  const inputRef = useRef(null);
  const sortRef  = useRef(null);

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
      if (e.key === 'Escape') { e.preventDefault(); if (sortMenuOpen) setSortMenuOpen(false); else onClose(); }
      if (e.key === 'Enter' && filteredDocs.length > 0) { e.preventDefault(); handleOpen(filteredDocs[0].id); }
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

  const handleOpen  = useCallback((id) => { onOpenDoc(id); onClose(); }, [onOpenDoc, onClose]);
  const topDoc      = filteredDocs[0] || null;
  const currentSort = SORT_OPTIONS.find((o) => o.id === sortBy);

  return (
    <>
      <style>{`
        .sl-input::placeholder { color: var(--color-text-faint); opacity: 1; }
        .sl-input:focus { outline: none; }
        .sl-filter-btn { background: none; border: none; cursor: pointer; display: flex; align-items: center; padding: 4px; border-radius: 6px; color: var(--color-text-muted); transition: color 0.12s, background 0.12s; }
        .sl-filter-btn:hover { color: var(--color-text-primary); background: var(--color-bg-hover); }
        .sl-sort-opt:hover { background: var(--color-bg-hover) !important; }
      `}</style>

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

            {/* Shadow wrapper — explicit width so grid fills properly */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ type: 'spring', stiffness: 560, damping: 44, mass: 0.65 }}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 740,
                filter: isDark
                  ? 'drop-shadow(0 10px 36px rgba(0,0,0,0.58)) drop-shadow(0 2px 8px rgba(0,0,0,0.32))'
                  : 'drop-shadow(0 10px 36px rgba(0,0,0,0.13)) drop-shadow(0 2px 8px rgba(0,0,0,0.07))',
              }}
            >
              {/* Modal — rounded-2xl → lisse auto-applies squircle */}
              <div
                className="rounded-2xl"
                style={{
                  width: '100%',
                  maxHeight: '80vh',
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                {/* ── Search row ── */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '16px 16px',
                  flexShrink: 0,
                }}>
                  <Search size={19} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />

                  <input
                    ref={inputRef}
                    className="sl-input"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search documents…"
                    style={{ flex: 1, background: 'transparent', border: 'none', fontSize: 17, color: 'var(--color-text-primary)', minWidth: 0 }}
                  />

                  {/* Enter-to-open hint: "— Top Doc Name" */}
                  <AnimatePresence>
                    {query && topDoc && (
                      <motion.span
                        initial={{ opacity: 0, x: 4 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 4 }}
                        transition={{ duration: 0.14 }}
                        style={{
                          fontSize: 13, color: 'var(--color-text-faint)', whiteSpace: 'nowrap',
                          overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180, flexShrink: 1,
                          fontStyle: 'normal',
                        }}
                      >
                        — {topDoc.title || 'Untitled'}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Clear button */}
                  <AnimatePresence>
                    {query && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.1 }}
                        onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                        className="rounded-md"
                        style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg-hover-strong)', border: 'none', cursor: 'pointer', padding: '3px 4px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                      >
                        <X size={12} />
                      </motion.button>
                    )}
                  </AnimatePresence>

                  {/* Filter / sort icon — no container, sidebar-button style */}
                  <div ref={sortRef} style={{ position: 'relative', flexShrink: 0 }}>
                    <button
                      className="sl-filter-btn"
                      onClick={() => setSortMenuOpen((v) => !v)}
                      title={`Sort: ${currentSort?.label}`}
                      style={{ color: sortBy !== 'name' || sortMenuOpen ? 'var(--color-text-primary)' : undefined }}
                    >
                      <FilterIcon size={15} />
                    </button>

                    {/* Sort dropdown with tail */}
                    <AnimatePresence>
                      {sortMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.94, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.94, y: -4 }}
                          transition={{ duration: 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
                          className="rounded-[10px]"
                          style={{
                            position: 'absolute', right: 0, top: 'calc(100% + 10px)',
                            backgroundColor: 'var(--color-bg-primary)',
                            border: '1px solid var(--color-border-primary)',
                            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.50)' : '0 4px 20px rgba(0,0,0,0.12)',
                            padding: 4, minWidth: 158, zIndex: 10,
                          }}
                        >
                          {/* Tail — border part */}
                          <div style={{
                            position: 'absolute', bottom: '100%', right: 9,
                            width: 0, height: 0,
                            borderLeft: '7px solid transparent',
                            borderRight: '7px solid transparent',
                            borderBottom: `7px solid var(--color-border-primary)`,
                          }} />
                          {/* Tail — fill part (covers dropdown's top border) */}
                          <div style={{
                            position: 'absolute', bottom: 'calc(100% - 1px)', right: 10,
                            width: 0, height: 0,
                            borderLeft: '6px solid transparent',
                            borderRight: '6px solid transparent',
                            borderBottom: `6px solid var(--color-bg-primary)`,
                          }} />

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
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* ── Grid — scrollable with GradualBlur fades at top + bottom ── */}
                <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
                  <div style={{ height: '100%', overflowY: 'auto', padding: '4px 14px 52px' }}>
                    {filteredDocs.length === 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--color-text-muted)', fontSize: 13, gap: 8 }}>
                        <Search size={24} style={{ opacity: 0.3 }} />
                        <span>No documents found</span>
                      </div>
                    ) : (
                      <motion.div layout style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                        gap: '14px 8px',
                      }}>
                        <AnimatePresence mode="popLayout">
                          {filteredDocs.map((doc, i) => (
                            <motion.div
                              key={doc.id}
                              layout
                              initial={{ opacity: 0, scale: 0.88 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.84, transition: { duration: 0.12 } }}
                              transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94], delay: Math.min(i * 0.014, 0.14) }}
                            >
                              <PaperCard
                                doc={doc}
                                group={doc.groupId ? groupMap[doc.groupId] : null}
                                onOpen={handleOpen}
                                isDark={isDark}
                                isHovered={hoveredId === doc.id}
                                onHoverIn={() => setHoveredId(doc.id)}
                                onHoverOut={() => setHoveredId(null)}
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </div>

                  {/* Gradient + progressive blur fades — top and bottom */}
                  <GradualBlur position="top"    height="28px" strength={0.18} divCount={4} zIndex={2} />
                  <GradualBlur position="bottom" height="56px" strength={0.42} divCount={6} zIndex={2} />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
