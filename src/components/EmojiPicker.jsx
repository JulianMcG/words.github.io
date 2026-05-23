import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { EMOJI_CATEGORIES, EMOJI_DICTIONARY } from '../utils/emojiMap';

// Build keyword → emoji AND emoji → keywords from EMOJI_DICTIONARY
const buildKeywordMap = () => {
  const map = new Map(); // emoji -> Set<keyword>
  Object.entries(EMOJI_DICTIONARY).forEach(([kw, emoji]) => {
    if (!map.has(emoji)) map.set(emoji, new Set());
    map.get(emoji).add(kw);
  });
  return map;
};

const KEYWORD_MAP = buildKeywordMap();

// Deduplicate emojis across categories (first category wins)
const _globalSeen = new Set();
const DEDUPED_CATEGORIES = EMOJI_CATEGORIES.map(cat => ({
  ...cat,
  emojis: cat.emojis.filter(e => {
    if (_globalSeen.has(e)) return false;
    _globalSeen.add(e);
    return true;
  }),
}));

// Flat array of { emoji, categoryId, categoryName, keywords } for search
const SEARCH_INDEX = DEDUPED_CATEGORIES.flatMap(cat =>
  cat.emojis.map(emoji => ({
    emoji,
    categoryId: cat.id,
    categoryName: cat.name.toLowerCase(),
    keywords: Array.from(KEYWORD_MAP.get(emoji) || []),
  }))
);

export default function EmojiPicker({ onSelect, onRemove, hasEmoji }) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(DEDUPED_CATEGORIES[0].id);
  const scrollRef = useRef(null);
  const sectionRefs = useRef({});
  const searchInputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }, []);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    const seen = new Set();
    const exact = [];
    const startsWith = [];
    const contains = [];
    const categoryMatch = [];

    for (const { emoji, categoryName, keywords } of SEARCH_INDEX) {
      if (seen.has(emoji)) continue;

      const kwExact = keywords.some(k => k === q);
      const kwStarts = !kwExact && keywords.some(k => k.startsWith(q));
      const kwContains = !kwExact && !kwStarts && keywords.some(k => k.includes(q));
      const catMatch = !kwExact && !kwStarts && !kwContains && categoryName.includes(q);

      if (kwExact) { exact.push(emoji); seen.add(emoji); }
      else if (kwStarts) { startsWith.push(emoji); seen.add(emoji); }
      else if (kwContains) { contains.push(emoji); seen.add(emoji); }
      else if (catMatch) { categoryMatch.push(emoji); seen.add(emoji); }
    }

    return [...exact, ...startsWith, ...contains, ...categoryMatch];
  }, [query]);

  const scrollToCategory = useCallback((id) => {
    setActiveCategory(id);
    setQuery('');
    requestAnimationFrame(() => {
      const el = sectionRefs.current[id];
      if (el && scrollRef.current) {
        scrollRef.current.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
      }
    });
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || query) return;
    const scrollTop = scrollRef.current.scrollTop + 24;
    let current = DEDUPED_CATEGORIES[0].id;
    for (const cat of DEDUPED_CATEGORIES) {
      const el = sectionRefs.current[cat.id];
      if (el && el.offsetTop <= scrollTop) current = cat.id;
    }
    setActiveCategory(current);
  }, [query]);

  const EmojiButton = useCallback(({ emoji }) => (
    <button
      className="w-full aspect-square flex items-center justify-center rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
      style={{ fontSize: 22, lineHeight: 1 }}
      onClick={() => onSelect(emoji)}
    >
      {emoji}
    </button>
  ), [onSelect]);

  return (
    <div
      className="bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      style={{ width: 320, maxHeight: 420 }}
    >
      {/* Search */}
      <div className="p-2 pb-1.5">
        <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'var(--color-bg-secondary)' }}>
          <Search size={13} className="text-[var(--color-text-muted)] flex-shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search emoji"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-[var(--color-text-primary)]"
            style={{ fontSize: 13 }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      {!query && (
        <div className="flex items-center px-1.5 pb-1.5 border-b border-[var(--color-border-primary)]">
          {DEDUPED_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className="flex-1 h-8 flex items-center justify-center rounded-lg transition-all"
              style={{
                fontSize: 16,
                background: activeCategory === cat.id ? 'var(--color-bg-hover)' : 'transparent',
                opacity: activeCategory === cat.id ? 1 : 0.45,
              }}
              onClick={() => scrollToCategory(cat.id)}
              title={cat.name}
              onMouseEnter={e => { if (activeCategory !== cat.id) e.currentTarget.style.opacity = '0.75'; }}
              onMouseLeave={e => { if (activeCategory !== cat.id) e.currentTarget.style.opacity = '0.45'; }}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}

      {/* Emoji grid — no top padding so headers are flush with the top */}
      <div
        ref={scrollRef}
        className="overflow-y-auto flex-1 px-2 pb-2"
        onScroll={handleScroll}
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--color-border-primary) transparent' }}
      >
        {/* Remove emoji */}
        {hasEmoji && !query && (
          <div className="pt-1.5 mb-1">
            <button
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
              style={{ fontSize: 13 }}
              onClick={onRemove}
            >
              <X size={14} />
              Remove emoji
            </button>
          </div>
        )}

        {searchResults ? (
          searchResults.length > 0 ? (
            <div className="pt-2">
              <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}>
                {searchResults.map(emoji => <EmojiButton key={emoji} emoji={emoji} />)}
              </div>
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-10 text-[var(--color-text-muted)]"
              style={{ fontSize: 13 }}
            >
              <span style={{ fontSize: 32 }}>🔍</span>
              <span className="mt-2">No emoji found</span>
            </div>
          )
        ) : (
          DEDUPED_CATEGORIES.map(cat => (
            <div
              key={cat.id}
              ref={el => { sectionRefs.current[cat.id] = el; }}
            >
              {/* Sticky header — flush with scroll container top (no container pt) */}
              <p
                className="px-1 pb-1 font-semibold uppercase tracking-wider text-[var(--color-text-muted)] sticky top-0 pt-2"
                style={{ fontSize: 10, background: 'var(--color-bg-primary)' }}
              >
                {cat.name}
              </p>
              <div className="grid gap-0.5 mb-2" style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}>
                {cat.emojis.map(emoji => <EmojiButton key={emoji} emoji={emoji} />)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
