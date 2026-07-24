import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, Download, Check, ChevronDown } from 'lucide-react';

// ─── Paper metrics (CSS px @ 96dpi) ──────────────────────────────────────────
const PAPERS = {
  letter: { w: 816, h: 1056, label: 'Letter', css: 'letter' },
  a4: { w: 794, h: 1123, label: 'A4', css: 'A4' },
};
export const MARGINS = { narrow: 45, normal: 68, wide: 91 }; // 1.2 / 1.8 / 2.4 cm
export const MARGIN_CM = { narrow: '1.2cm', normal: '1.8cm', wide: '2.4cm' };
export const TEXT_ZOOM = { sm: 0.85, md: 1, lg: 1.18 };
// Print-safe px dims (rounded down so a sheet never spills onto a blank page).
export const PRINT_PAPER = { letter: { w: 816, h: 1056 }, a4: { w: 793, h: 1122 } };
export const FONT_STACKS = {
  sans: 'var(--font-sans)',
  serif: "'Lora', Georgia, serif",
  mono: "ui-monospace, 'SF Mono', Menlo, monospace",
};

const FILE_TYPES = [
  { id: 'pdf', label: 'PDF', short: 'PDF', ext: 'pdf', note: 'via system dialog' },
  { id: 'md', label: 'Markdown', short: 'MD', ext: 'md' },
  { id: 'html', label: 'HTML', short: 'HTML', ext: 'html' },
  { id: 'txt', label: 'Plain Text', short: 'TXT', ext: 'txt' },
];

// ─── Static styles (injected once, like SpotlightSearch) ─────────────────────
if (typeof document !== 'undefined' && !document.getElementById('pxm-styles')) {
  const s = document.createElement('style');
  s.id = 'pxm-styles';
  s.textContent = `
    .pxm-page {
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.14), 0 8px 24px rgba(0,0,0,0.10);
      border-radius: 2px;
      /* Ink-on-paper regardless of app theme */
      --color-text-primary: #1a1a1a; --color-text-muted: #555555;
      --color-text-faint: #888888; --color-icon-muted: #888888;
      --color-bg-primary: #ffffff; --color-bg-secondary: #f4f4f2;
      --color-bg-tertiary: #f4f4f2; --color-bg-hover: #f0f0ee;
      --color-bg-hover-strong: #ebebe9; --color-border-primary: #dcdcdc;
      --color-border-hover: #cccccc; --color-highlight: #fdf1a6;
      color: #1a1a1a;
    }
    .pxm-head { display: flex; align-items: center; gap: 10px; margin: 0 0 14px; }
    .pxm-emoji { font-size: 34px; line-height: 1; }
    .pxm-footer { position: absolute; left: 0; right: 0; text-align: center; font-family: 'Inter', sans-serif; font-size: 11.3px; color: #1a1a1a; line-height: 1; }
    .pxm-footer .pxf-do { opacity: 0.5; }
    .pxm-footer .pxf-num { position: absolute; bottom: 0; }
    .pxm-title { margin: 0; font-size: 31px; font-weight: 700; line-height: 1.15; letter-spacing: -0.01em; }
    /* 1rem body = 16px = 12pt — same as the actual print output, so the
       preview's default text size is true-to-paper. */
    .pxm-body { padding-bottom: 0 !important; min-height: 0 !important; font-size: 1rem; line-height: 1.55; }
    .pxm-page-solo { box-shadow: 0 2px 6px rgba(0,0,0,0.12), 0 16px 38px rgba(0,0,0,0.18); }
    .pxm-body::after { content: none !important; }
    .pxm-body > :first-child { margin-top: 0 !important; }
    .pxm-body img { max-width: 100% !important; height: auto !important; }
    .pxm-body a { color: #1a1a1a; text-decoration: underline; }
    .pxm-seg { display: flex; align-items: center; background: var(--color-bg-secondary); border-radius: 6px; padding: 2px; }
    .pxm-seg button { border-radius: 5px; transition: color 0.12s, background 0.12s, box-shadow 0.12s; }
  `;
  document.head.appendChild(s);
}

// ─── Converters (native text, no rasterizing) ────────────────────────────────
const escHtml = (t = '') => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Recursive HTML → Markdown / plain-text serializer. `plain` drops the syntax.
export function htmlToMarkdown(rootEl, { plain = false } = {}) {
  const inline = (node) => {
    let out = '';
    node.childNodes.forEach((c) => { out += walk(c, 0); });
    return out;
  };
  const walk = (node, depth) => {
    if (node.nodeType === 3) return node.nodeValue.replace(/\s+/g, ' ');
    if (node.nodeType !== 1) return '';
    const tag = node.tagName.toLowerCase();
    const blockPad = '\n\n';
    switch (tag) {
      case 'br': return plain ? '\n' : '  \n';
      case 'hr': return plain ? '\n' : '\n---\n';
      case 'b': case 'strong': { const t = inline(node); return plain ? t : (t.trim() ? `**${t}**` : t); }
      case 'i': case 'em': { const t = inline(node); return plain ? t : (t.trim() ? `*${t}*` : t); }
      case 's': case 'strike': case 'del': { const t = inline(node); return plain ? t : `~~${t}~~`; }
      case 'code': { const t = inline(node); return plain ? t : `\`${t}\``; }
      case 'a': { const t = inline(node); return plain ? t : `[${t}](${node.getAttribute('href') || ''})`; }
      case 'img': return plain ? '' : `![${node.alt || ''}](${node.src || ''})`;
      case 'h1': case 'h2': case 'h3': case 'h4': {
        const n = +tag[1];
        const t = inline(node).trim();
        if (!t) return '';
        return blockPad + (plain ? t : `${'#'.repeat(n)} ${t}`) + blockPad;
      }
      case 'blockquote': {
        const t = inline(node).trim();
        if (!t) return '';
        return blockPad + t.split('\n').map((l) => (plain ? l : `> ${l}`)).join('\n') + blockPad;
      }
      case 'pre': {
        const t = node.textContent.replace(/\n$/, '');
        return blockPad + (plain ? t : `\`\`\`\n${t}\n\`\`\``) + blockPad;
      }
      case 'ul': case 'ol': {
        const isCheck = node.classList.contains('checklist');
        const pad = '  '.repeat(depth);
        let i = 0, out = '\n';
        node.childNodes.forEach((li) => {
          if (li.nodeType !== 1 || li.tagName !== 'LI') return;
          i += 1;
          // Serialize the li's own inline content, recursing into nested lists separately
          let text = '', nested = '';
          li.childNodes.forEach((c) => {
            if (c.nodeType === 1 && (c.tagName === 'UL' || c.tagName === 'OL')) nested += walk(c, depth + 1);
            else text += walk(c, depth);
          });
          text = text.trim();
          const checked = li.classList.contains('checked');
          const marker = plain
            ? (isCheck ? (checked ? '☑ ' : '☐ ') : tag === 'ol' ? `${i}. ` : '• ')
            : (isCheck ? (checked ? '- [x] ' : '- [ ] ') : tag === 'ol' ? `${i}. ` : '- ');
          if (text) out += `${pad}${marker}${text}\n`;
          out += nested;
        });
        return out + (depth === 0 ? '\n' : '');
      }
      case 'table': {
        const rows = [...node.querySelectorAll('tr')].map((tr) =>
          [...tr.children].map((td) => inline(td).trim().replace(/\|/g, '\\|')));
        if (!rows.length) return '';
        if (plain) return blockPad + rows.map((r) => r.join('  ·  ')).join('\n') + blockPad;
        let out = blockPad + `| ${rows[0].join(' | ')} |\n| ${rows[0].map(() => '---').join(' | ')} |\n`;
        rows.slice(1).forEach((r) => { out += `| ${r.join(' | ')} |\n`; });
        return out + '\n';
      }
      case 'p': case 'div': case 'section': case 'article': {
        const t = inline(node).trim();
        return t ? blockPad + t + blockPad : '';
      }
      default: return inline(node);
    }
  };
  return walk(rootEl, 0).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

export function buildStandaloneHTML({ title, emoji, bodyHTML, docFont, showEmoji, showTitle }) {
  const font = docFont === 'serif' ? "Lora, Georgia, serif"
    : docFont === 'mono' ? "ui-monospace, 'SF Mono', Menlo, monospace"
    : "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escHtml(title || 'Untitled')}</title>
<style>
  body { max-width: 44rem; margin: 3rem auto; padding: 0 1.5rem; font-family: ${font}; color: #1a1a1a; line-height: 1.6; }
  .doc-emoji { font-size: 2.6rem; margin-bottom: 0.4rem; }
  h1.doc-title { font-size: 2.1rem; margin: 0 0 1.2rem; letter-spacing: -0.01em; }
  h1 { font-size: 1.875rem; } h2 { font-size: 1.5rem; } h3 { font-size: 1.25rem; }
  blockquote { border-left: 3px solid #ddd; margin-left: 0; padding-left: 1em; color: #555; }
  ul.checklist { list-style: none; padding-left: 0.2em; }
  ul.checklist li::before { content: "☐ "; } ul.checklist li.checked::before { content: "☑ "; }
  ul.checklist li.checked { text-decoration: line-through; color: #888; }
  img { max-width: 100%; height: auto; } a { color: #E8572A; }
  pre, code { font-family: ui-monospace, Menlo, monospace; background: #f4f4f2; border-radius: 4px; }
  pre { padding: 0.8em; overflow-x: auto; } code { padding: 0.1em 0.35em; }
</style></head><body>
${showEmoji && emoji ? `<div class="doc-emoji">${escHtml(emoji)}</div>` : ''}
${showTitle ? `<h1 class="doc-title">${escHtml(title || 'Untitled')}</h1>` : ''}
${bodyHTML}
</body></html>`;
}

const downloadFile = (filename, mime, text) => {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

const safeFilename = (title, ext) =>
  `${(title || 'Untitled').replace(/[/\\:*?"<>|]/g, '').trim().slice(0, 80) || 'Untitled'}.${ext}`;

// ─── Small controls ──────────────────────────────────────────────────────────
const Switch = ({ checked, onChange, disabled }) => (
  <button
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={onChange}
    className={`relative w-8 h-[18px] rounded-full flex-shrink-0 transition-colors duration-150 ${disabled ? 'opacity-40 cursor-default' : ''} ${checked && !disabled ? 'bg-[#E8572A]' : 'bg-[var(--color-border-hover)]'}`}
  >
    <span
      className="absolute top-[2px] left-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform duration-150"
      style={{ transform: checked && !disabled ? 'translateX(14px)' : 'translateX(0)' }}
    />
  </button>
);

const Row = ({ label, children, disabled }) => (
  <div className={`flex items-center justify-between pl-2 pr-1 h-8 ${disabled ? 'opacity-50' : ''}`}>
    <span className="text-[12px] text-[var(--color-text-primary)] select-none">{label}</span>
    {children}
  </div>
);

const Seg = ({ options, value, onChange }) => (
  <div className="pxm-seg">
    {options.map((o) => (
      <button
        key={o.id}
        title={o.title || o.label}
        onClick={() => onChange(o.id)}
        className={`h-[22px] min-w-[26px] px-1.5 flex items-center justify-center text-[10.5px] font-medium ${value === o.id ? 'bg-[var(--color-bg-primary)] shadow-sm text-[var(--color-text-primary)]' : 'text-[var(--color-text-faint)] hover:text-[var(--color-text-primary)]'}`}
        style={o.style}
      >
        {o.label}
      </button>
    ))}
  </div>
);

// ─── Modal ───────────────────────────────────────────────────────────────────
export default function PrintExportModal({ open, onClose, onPrint }) {
  const mode = open?.mode;
  const isPrint = mode === 'print';

  // Settings persist across opens within a session
  const [paper, setPaper] = useState('letter');
  const [margins, setMargins] = useState('normal');
  const [textSize, setTextSize] = useState('md');
  const [showTitle, setShowTitle] = useState(true);
  const [showEmoji, setShowEmoji] = useState(true);
  const [fileType, setFileType] = useState('pdf');
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);

  const canvasRef = useRef(null);
  const measureRef = useRef(null);
  const [canvasW, setCanvasW] = useState(0);
  const [contentH, setContentH] = useState(0);
  // The paper preview is heavy (full doc flow × pages + a measurer). Mounting
  // it during the layoutId morph makes the spring stutter, so hold it back
  // until the shell has settled — same trick as Spotlight's delayed reveal.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!open) { setReady(false); return; }
    const t = setTimeout(() => setReady(true), 230);
    return () => clearTimeout(t);
  }, [open]);

  const P = PAPERS[paper];
  const M = MARGINS[margins];
  const windowH = P.h - 2 * M;
  const pageCount = Math.max(1, Math.ceil(contentH / windowH));
  const scale = canvasW ? Math.min((canvasW - 56) / P.w, 0.92) : 0.5;

  // Track canvas width for fit-to-width paper scaling — only once the shell
  // has settled, so observer callbacks never re-render mid-morph.
  useLayoutEffect(() => {
    if (!open || !ready || !canvasRef.current) return;
    const el = canvasRef.current;
    const obs = new ResizeObserver(() => setCanvasW(el.clientWidth));
    obs.observe(el);
    setCanvasW(el.clientWidth);
    return () => obs.disconnect();
  }, [open, ready]);

  // Track content height (fonts/images load async) for pagination
  useLayoutEffect(() => {
    if (!open || !ready || !measureRef.current) return;
    const el = measureRef.current;
    const update = () => setContentH(el.scrollHeight);
    const obs = new ResizeObserver(update);
    obs.observe(el);
    update();
    const t = setTimeout(update, 350);
    return () => { obs.disconnect(); clearTimeout(t); };
  }, [open, ready, paper, margins, textSize, showTitle, showEmoji]);

  // Escape closes (capture so the app's global handlers don't race us)
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); setTypeMenuOpen(false); onClose(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  useEffect(() => { if (!open) setTypeMenuOpen(false); }, [open]);

  // Hiding the title hides the icon with it — a floating emoji above headless
  // body text reads as a mistake on paper.
  const emojiOn = showEmoji && showTitle && !!open?.emoji;
  const settings = { paper, margins, textSize, showTitle, showEmoji: emojiOn };

  const handleExport = useCallback(() => {
    if (!open) return;
    const { title, bodyHTML, emoji, docFont } = open;
    if (fileType === 'pdf') { onPrint(settings); return; }
    const holder = document.createElement('div');
    holder.innerHTML = bodyHTML;
    const parts = [];
    if (emojiOn) parts.push(emoji);
    if (showTitle) parts.push(title || 'Untitled');
    if (fileType === 'md') {
      const head = showTitle ? `# ${parts.join(' ')}\n\n` : '';
      downloadFile(safeFilename(title, 'md'), 'text/markdown', head + htmlToMarkdown(holder));
    } else if (fileType === 'txt') {
      const head = parts.length ? parts.join(' ') + '\n\n' : '';
      downloadFile(safeFilename(title, 'txt'), 'text/plain', head + htmlToMarkdown(holder, { plain: true }));
    } else if (fileType === 'html') {
      downloadFile(safeFilename(title, 'html'), 'text/html',
        buildStandaloneHTML({ title, emoji, bodyHTML, docFont, showEmoji: emojiOn, showTitle }));
    }
    onClose();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fileType, paper, margins, textSize, showTitle, showEmoji, onPrint, onClose]);

  const currentType = FILE_TYPES.find((t) => t.id === fileType) || FILE_TYPES[0];
  const shellId = isPrint ? 'printx-shell' : 'exportx-shell';

  // The document flow — identical markup feeds the measurer and every page
  const Flow = open ? (
    <div style={{ zoom: TEXT_ZOOM[textSize], fontFamily: FONT_STACKS[open.docFont] || FONT_STACKS.sans, textAlign: open.textAlign || 'left' }}>
      {showTitle && (
        <div className="pxm-head">
          {emojiOn && <div className="pxm-emoji">{open.emoji}</div>}
          <h1 className="pxm-title">{open.title || 'Untitled'}</h1>
        </div>
      )}
      <div
        className={`editor-content pxm-body ${open.lineSpacing === '1.0' ? 'leading-none' : open.lineSpacing === '2.0' ? 'leading-loose' : 'leading-relaxed'}`}
        dangerouslySetInnerHTML={{ __html: open.bodyHTML }}
      />
    </div>
  ) : null;

  return (
    <AnimatePresence>
      {open && (
        /* words-context-menu keeps the app's global outside-click handler from
           closing the options menu underneath — it stays put while the modal is
           up, and the shell reverse-morphs back into its row on close. */
        <div className="words-context-menu" style={{ position: 'fixed', inset: 0, zIndex: 9990, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.24)' }}
          />

          {/* Shadow wrapper — shadow lives outside the shell, like Spotlight */}
          <div style={{
            position: 'relative', width: '100%', maxWidth: 880,
            filter: 'drop-shadow(0 10px 36px rgba(0,0,0,0.16)) drop-shadow(0 2px 8px rgba(0,0,0,0.08))',
          }}>
            {/* Shell: pure layoutId morph from the menu row */}
            <motion.div
              layoutId={shellId}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              transition={{ layout: { type: 'spring', stiffness: 440, damping: 32, mass: 0.85 } }}
              style={{
                width: '100%', height: 'min(78vh, 640px)',
                borderRadius: 18,
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border-primary)',
                display: 'flex', overflow: 'hidden',
              }}
            >
              {/* ── Left: live paper preview — mounts only after the morph
                    settles, then fades in (opacity only: blurring a pane this
                    large is what made the reveal chug) ── */}
              <div
                ref={canvasRef}
                className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden"
                style={{ background: 'color-mix(in srgb, var(--color-bg-primary) 85%, #808080)', padding: '26px 0 28px' }}
              >
                {ready && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col items-center"
                  style={{ gap: 18, minHeight: '100%', justifyContent: pageCount === 1 ? 'center' : 'flex-start' }}
                >
                  {Array.from({ length: pageCount }).map((_, i) => {
                    const page = (
                      <div
                        className={`pxm-page ${pageCount === 1 ? 'pxm-page-solo' : ''}`}
                        style={{
                          position: 'absolute', top: 0, left: 0,
                          width: P.w, height: P.h, padding: M,
                          transform: `scale(${scale})`, transformOrigin: 'top left',
                        }}
                      >
                        <div style={{ height: windowH, overflow: 'hidden' }}>
                          <div style={{ transform: `translateY(-${i * windowH}px)` }}>{Flow}</div>
                        </div>
                        {/* Same footer the real print output renders */}
                        <div className="pxm-footer" style={{ bottom: Math.max(10, Math.round((M - 12) / 2)) }}>
                          <span>words<span className="pxf-do">.do</span></span>
                          <span className="pxf-num" style={{ right: M }}>{i + 1}</span>
                        </div>
                      </div>
                    );
                    return (
                      <div key={i} style={{ width: P.w * scale, height: P.h * scale, position: 'relative', flexShrink: 0 }}>
                        {page}
                      </div>
                    );
                  })}
                  <span className="text-[11px] select-none" style={{ color: 'var(--color-text-faint)', flexShrink: 0 }}>
                    {pageCount} {pageCount === 1 ? 'page' : 'pages'} · {P.label}
                  </span>
                </motion.div>
                )}

                {/* Hidden measurer — same flow at print width, used for pagination */}
                {ready && (
                  <div
                    aria-hidden="true"
                    style={{ position: 'absolute', top: 0, left: -99999, width: P.w - 2 * M, visibility: 'hidden', pointerEvents: 'none' }}
                  >
                    <div ref={measureRef}>{Flow}</div>
                  </div>
                )}
              </div>

              {/* ── Right: options ── */}
              <div className="flex flex-col" style={{ width: 252, flexShrink: 0 }}>
                {/* Header */}
                <motion.div
                  className="flex items-center gap-2.5"
                  style={{ padding: '14px 14px 8px', flexShrink: 0 }}
                  initial={{ opacity: 0, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--color-text-muted)' }}>
                    {isPrint ? <Printer size={16} /> : <Download size={16} />}
                  </span>
                  <span className="text-[14px] font-semibold text-[var(--color-text-primary)] select-none">
                    {isPrint ? 'Print' : 'Export'}
                  </span>
                </motion.div>

                {/* Options — blur-reveal after the shell settles */}
                <motion.div
                  initial={{ opacity: 0, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="flex-1 overflow-y-auto px-2 py-1"
                >
                  <div className="px-2 pt-1.5 pb-0.5 text-[10.5px] font-semibold uppercase tracking-wide select-none" style={{ color: 'var(--color-text-faint)' }}>Layout</div>
                  <Row label="Paper">
                    <Seg
                      options={[{ id: 'letter', label: 'Letter' }, { id: 'a4', label: 'A4' }]}
                      value={paper} onChange={setPaper}
                    />
                  </Row>
                  <Row label="Margins">
                    <Seg
                      options={[
                        { id: 'narrow', label: 'S', title: 'Narrow' },
                        { id: 'normal', label: 'M', title: 'Normal' },
                        { id: 'wide', label: 'L', title: 'Wide' },
                      ]}
                      value={margins} onChange={setMargins}
                    />
                  </Row>
                  <Row label="Text size">
                    <Seg
                      options={[
                        { id: 'sm', label: 'A', title: 'Small', style: { fontSize: 9.5 } },
                        { id: 'md', label: 'A', title: 'Normal', style: { fontSize: 11.5 } },
                        { id: 'lg', label: 'A', title: 'Large', style: { fontSize: 13.5 } },
                      ]}
                      value={textSize} onChange={setTextSize}
                    />
                  </Row>

                  <div className="px-2 pt-4 pb-0.5 text-[10.5px] font-semibold uppercase tracking-wide select-none" style={{ color: 'var(--color-text-faint)' }}>Content</div>
                  <Row label="Title">
                    <Switch checked={showTitle} onChange={() => setShowTitle((v) => !v)} />
                  </Row>
                  <Row label="Icon" disabled={!open.emoji || !showTitle}>
                    <Switch checked={emojiOn} disabled={!open.emoji || !showTitle} onChange={() => setShowEmoji((v) => !v)} />
                  </Row>
                </motion.div>

                {/* Footer */}
                <motion.div
                  initial={{ opacity: 0, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center justify-end gap-2 relative"
                  style={{ padding: '12px 14px', flexShrink: 0, whiteSpace: 'nowrap' }}
                >
                  <button
                    onClick={onClose}
                    className="px-3 py-1.5 rounded-lg text-[12.5px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover-strong)] transition-colors"
                  >
                    Cancel
                  </button>

                  {isPrint ? (
                    <button
                      onClick={() => onPrint(settings)}
                      className="btn-tactile-accent px-4 py-1.5 rounded-lg text-[12.5px] font-semibold text-white"
                    >
                      Print
                    </button>
                  ) : (
                    <div className="btn-tactile-accent rounded-lg flex items-stretch overflow-hidden" style={{ padding: 0 }}>
                      <button
                        onClick={handleExport}
                        className="pl-3.5 pr-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                      >
                        Export as {currentType.short || currentType.label}
                      </button>
                      <div style={{ width: 1, background: 'rgba(255,255,255,0.28)' }} />
                      <button
                        onClick={() => setTypeMenuOpen((v) => !v)}
                        className="px-1.5 flex items-center text-white hover:bg-white/10 transition-colors"
                        title="Change file type"
                      >
                        <ChevronDown size={14} strokeWidth={2.5} className={`transition-transform duration-150 ${typeMenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  )}

                  {/* File-type picker */}
                  <AnimatePresence>
                    {typeMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 4 }}
                        transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute bottom-[52px] right-3 w-44 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg shadow-xl py-1 px-1 z-10"
                        style={{ transformOrigin: 'bottom right' }}
                      >
                        {FILE_TYPES.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => { setFileType(t.id); setTypeMenuOpen(false); }}
                            className="w-full text-left px-2 py-1 rounded flex items-center justify-between text-[13px] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                          >
                            <span className="flex items-baseline gap-1.5">
                              {t.label}
                              {t.note && <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>{t.note}</span>}
                            </span>
                            {fileType === t.id && <Check size={13} className="text-[#E8572A]" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
