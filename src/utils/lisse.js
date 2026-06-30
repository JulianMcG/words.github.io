// Cross-platform Figma squircles for the whole app.
//
// Lisse (https://corne.rs) renders smooth corners as a CSS `clip-path`, so it
// works in every browser — unlike the Chromium-only `corner-shape` property.
// This module is the global glue: it finds every element flagged as a squircle
// (any Tailwind `rounded*` utility, or the `.border-shape-squircle` marker) and
// keeps a lisse clip-path in sync with its size via a shared ResizeObserver,
// driven by one MutationObserver instead of a hook per component.
//
// It is deliberately non-destructive: it only sets `clip-path`, and never on an
// element whose look depends on an outer box-shadow (cards, tactile buttons) —
// a clip-path would crop that shadow to the squircle and break it. Those keep
// their native border-radius. Scroll containers and fully-round pills are
// skipped too.

import { generateClipPath, getLayoutSize, observeResize } from '@lisse/core';

// Figma's default corner smoothing — what corne.rs ships as the "squircle".
const SMOOTHING = 0.6;

const SKIP_OVERFLOW = new Set(['auto', 'scroll', 'overlay']);

const MARKER_SELECTOR =
  '[class*="rounded"]:not([class*="rounded-full"]),.border-shape-squircle';

const states = new WeakMap(); // el -> { savedClipPath, clipped, unobserve }
let mutationObserver = null;
let initialized = false;

function cornerRadius(cs) {
  return parseFloat(cs.borderTopLeftRadius) || 0;
}

// True when the element carries a non-inset (outer) drop shadow. clip-path
// crops to the element box, so it would eat such a shadow — leave those alone.
function hasOuterShadow(cs) {
  const s = cs.boxShadow;
  if (!s || s === 'none') return false;
  // Split on top-level commas (not the ones inside rgb()/rgba()).
  return s.split(/,(?![^()]*\))/).some((layer) => !layer.includes('inset'));
}

function shouldSkip(el, cs, width, height) {
  if (cs.getPropertyValue('--lisse-skip').trim() === '1') return true;
  if (SKIP_OVERFLOW.has(cs.overflowX) || SKIP_OVERFLOW.has(cs.overflowY)) return true;
  if (hasOuterShadow(cs)) return true;
  const r = cornerRadius(cs);
  if (r <= 0) return true;
  // Fully round (pill/circle): native border-radius already nails it.
  if (r * 2 >= Math.min(width, height) - 0.5) return true;
  return false;
}

function sync(s) {
  const el = s.el;
  const cs = getComputedStyle(el);
  const { width, height } = getLayoutSize(el);
  if (width <= 0 || height <= 0) return;

  if (shouldSkip(el, cs, width, height)) {
    if (s.clipped) {
      el.style.clipPath = s.savedClipPath;
      el.removeAttribute('data-state');
      s.clipped = false;
    }
    return;
  }

  el.style.clipPath = generateClipPath(width, height, {
    radius: cornerRadius(cs),
    smoothing: SMOOTHING,
  });
  el.setAttribute('data-state', 'ready');
  s.clipped = true;
}

function attach(el) {
  if (states.has(el)) return;
  const s = { el, savedClipPath: el.style.clipPath, clipped: false, unobserve: null };
  states.set(el, s);
  el.setAttribute('data-slot', 'smooth-corners');
  s.unobserve = observeResize(el, () => sync(s));
  sync(s);
}

function detach(el) {
  const s = states.get(el);
  if (!s) return;
  states.delete(el);
  s.unobserve?.();
  el.style.clipPath = s.savedClipPath;
  el.removeAttribute('data-slot');
  el.removeAttribute('data-state');
}

function scan(node) {
  if (node.nodeType !== 1) return;
  if (node.matches?.(MARKER_SELECTOR)) attach(node);
  node.querySelectorAll?.(MARKER_SELECTOR).forEach(attach);
}

export function initLisse() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  const start = () => {
    scan(document.body);
    mutationObserver = new MutationObserver((records) => {
      for (const rec of records) {
        // A class change can flip an element's box-shadow on/off (e.g. a pinned
        // tab toggling `pin-active`), so re-evaluate whether it should be
        // clipped. Watching `class` only — not `style` — keeps our own
        // clip-path writes from re-triggering this and avoids transform thrash.
        if (rec.type === 'attributes') {
          const el = rec.target;
          if (states.has(el)) sync(states.get(el));
          else if (el.nodeType === 1 && el.matches?.(MARKER_SELECTOR)) attach(el);
          continue;
        }
        rec.removedNodes.forEach((n) => {
          if (n.nodeType !== 1) return;
          if (states.has(n)) detach(n);
          n.querySelectorAll?.(MARKER_SELECTOR).forEach((e) => states.has(e) && detach(e));
        });
        rec.addedNodes.forEach(scan);
      }
    });
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
}
