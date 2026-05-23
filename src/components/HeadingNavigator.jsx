import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, animate as fmAnimate } from "framer-motion";

// ── sizes ─────────────────────────────────────────────────────────────────────
const PILL_H     = 26;
const PILL_PX    = 12;
const PILL_FONT  = 12;
const DOT_SZ     = [5, 4, 3];   // h1 / h2 / h3
const PILL_MAX_W = 180;

// ── dock ─────────────────────────────────────────────────────────────────────
const DOCK_RANGE     = 100;     // tighter range = steeper falloff = more drama
const MAX_SCALE_DOT  = 5.2;
const MAX_SCALE_PILL = 1.1;

// ── springs ───────────────────────────────────────────────────────────────────
// ratio ≈ 0.96 → just under critical — fastest settle without visible overshoot
const EXPAND_SP = { stiffness: 600, damping: 44, mass: 0.82 };
// dock: faster + snappier follow
const DOCK_SP   = { stiffness: 380, damping: 36, mass: 0.4 };

// ─────────────────────────────────────────────────────────────────────────────
function PillItem({ heading, isHovering, isActive, mouseYMV, onScrollTo }) {
  const pillRef   = useRef(null);
  const textRef   = useRef(null);
  const centerRef = useRef(0);
  const sz        = DOT_SZ[heading.level - 1] ?? 3;
  const [overflows, setOverflows] = useState(false);

  // 0 = dot, 1 = pill
  const expandTarget = useMotionValue(0);
  const expanded     = useSpring(expandTarget, EXPAND_SP);
  useEffect(() => { expandTarget.set(isHovering ? 1 : 0); }, [isHovering, expandTarget]);

  // text carousel — scrolls long text into view after expansion settles
  const textX = useMotionValue(0);
  useEffect(() => {
    let cancelled = false;
    const timers  = [];
    let anim1 = null;
    let anim2 = null;

    const stop = () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      anim1?.stop();
      anim2?.stop();
    };

    if (!isHovering) {
      setOverflows(false);
      anim1 = fmAnimate(textX, 0, { duration: 0.4, ease: "easeOut" });
      return stop;
    }

    // wait for expand spring to settle before measuring
    timers.push(setTimeout(() => {
      if (cancelled) return;
      const el = textRef.current;
      if (!el) return;
      const overflow = el.scrollWidth - el.clientWidth;
      setOverflows(overflow > 2);
      if (overflow <= 2) return;

      timers.push(setTimeout(() => {
        if (cancelled) return;
        anim1 = fmAnimate(textX, -(overflow + 8), {
          duration: Math.max(1.6, overflow / 50),
          ease:     "easeInOut",
        });
        anim1.then(() => {
          if (cancelled) return;
          timers.push(setTimeout(() => {
            if (cancelled) return;
            anim2 = fmAnimate(textX, 0, { duration: 0.9, ease: "easeOut" });
          }, 700));
        });
      }, 1100));
    }, 520));

    return stop;
  }, [isHovering, heading.text, textX]);

  // keep center-Y fresh for dock calc
  useLayoutEffect(() => {
    const el = pillRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      centerRef.current = r.top + r.height / 2;
    }
  });

  const rawDock = useTransform(mouseYMV, (y) => {
    if (y < 0) return 0;
    const t = Math.max(0, 1 - Math.abs(y - centerRef.current) / DOCK_RANGE);
    // squared falloff: hovered item pops, neighbors drop off much faster
    return t * t;
  });
  const dock = useSpring(rawDock, DOCK_SP);

  // height: dot → pill, no dock contribution (prevents stretching)
  const height = useTransform(expanded, (exp) => sz + (PILL_H - sz) * exp);

  // scale: dramatic in dot mode, subtle in pill mode
  const scale = useTransform([expanded, dock], ([exp, d]) => {
    const dotS  = 1 + (MAX_SCALE_DOT  - 1) * d;
    const pillS = 1 + (MAX_SCALE_PILL - 1) * d;
    return dotS + (pillS - dotS) * exp;
  });

  // text reveal — opacity/blur driven by expanded
  const maxWidth    = useTransform(expanded, [0, 1], [0, PILL_MAX_W]);
  const padX        = useTransform(expanded, [0, 1], [0, PILL_PX]);
  const textOpacity = useTransform(expanded, [0, 0.45, 1], [0, 0, 1]);
  const rawBlur     = useTransform(expanded, [0, 0.6, 1], [6, 3, 0]);
  const textFilter  = useTransform(rawBlur, (b) => `blur(${b}px)`);

  return (
    <motion.div
      ref={pillRef}
      style={{
        height,
        scale,
        minWidth:     sz,
        width:        "fit-content",
        borderRadius: "999px",
        overflow:     "hidden",
        display:      "inline-flex",
        alignItems:   "center",
        cursor:       "pointer",
        flexShrink:   0,
      }}
      animate={{
        opacity: isHovering
          ? (isActive ? 1 : 0.9)
          : (isActive ? 0.85 : 0.28),
        backgroundColor: isHovering
          ? isActive
            ? "var(--color-text-primary)"
            : "var(--color-bg-hover-strong)"
          : isActive
            ? "var(--color-text-primary)"
            : "var(--color-text-faint)",
      }}
      transition={{
        opacity:         { duration: 0.22, ease: "easeOut" },
        backgroundColor: { duration: 0.22, ease: "easeOut" },
      }}
      onClick={() => onScrollTo(heading)}
    >
      {/* gradient-fade wrapper — clips overflow and soft-fades right edge */}
      <motion.div
        style={{
          maxWidth,
          paddingLeft:        padX,
          paddingRight:       padX,
          opacity:            textOpacity,
          filter:             textFilter,
          overflow:           "hidden",
          maskImage:          overflows ? "linear-gradient(to right, black 0%, black 70%, transparent 100%)" : "none",
          WebkitMaskImage:    overflows ? "linear-gradient(to right, black 0%, black 70%, transparent 100%)" : "none",
          // extra vertical room so descenders (g, y, p) never clip
          paddingTop:         2,
          paddingBottom:      2,
        }}
      >
        <motion.span
          ref={textRef}
          style={{
            x:             textX,
            fontSize:      PILL_FONT,
            fontWeight:    500,
            letterSpacing: "-0.01em",
            lineHeight:    "1.35",
            whiteSpace:    "nowrap",
            display:       "block",
            userSelect:    "none",
            color:         isActive ? "var(--color-bg-primary)" : "var(--color-text-primary)",
          }}
        >
          {heading.text}
        </motion.span>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function HeadingNavigator({ editorRef, scrollRef, activeDocId, visible }) {
  const [headings,      setHeadings]      = useState([]);
  const [isHovering,    setIsHovering]    = useState(false);
  const [activeIndex,   setActiveIndex]   = useState(-1);
  const [isDocSwitching, setIsDocSwitching] = useState(false);

  const mouseYMV   = useMotionValue(-999);
  const headingIds = useRef(new WeakMap());
  const idCounter  = useRef(0);

  // ── scan headings — h1 only ────────────────────────────────────────────────
  const scanHeadings = useCallback(() => {
    if (!editorRef.current) return;
    setHeadings(
      Array.from(editorRef.current.querySelectorAll("h1"))
        .map((el) => {
          if (!headingIds.current.has(el)) {
            headingIds.current.set(el, idCounter.current++);
          }
          return {
            el,
            id:    headingIds.current.get(el),
            text:  (el.innerText || el.textContent || "").trim(),
            level: 1,
          };
        })
        .filter((h) => h.text.length > 0)
    );
  }, [editorRef]);

  // ── doc switch: suppress all animations by hiding the list momentarily ─────
  useEffect(() => {
    setActiveIndex(-1);
    setIsDocSwitching(true);
    const t = setTimeout(() => {
      scanHeadings();
      setIsDocSwitching(false);
    }, 80);
    return () => clearTimeout(t);
  }, [activeDocId, scanHeadings]);

  // ── within-doc mutations: animate adds/removes normally ───────────────────
  useEffect(() => {
    if (!editorRef.current) return;
    const obs = new MutationObserver(scanHeadings);
    obs.observe(editorRef.current, { childList: true, subtree: true, characterData: true });
    return () => obs.disconnect();
  }, [editorRef, activeDocId, scanHeadings]);

  // ── active heading — also handles "can't scroll past last heading" case ────
  useEffect(() => {
    const scrollEl = scrollRef?.current;
    if (!scrollEl || headings.length === 0) return;
    const onScroll = () => {
      const limit    = scrollEl.getBoundingClientRect().top + 110;
      const atBottom = scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 5;
      let next = -1;
      headings.forEach((h, i) => {
        if (h.el.getBoundingClientRect().top <= limit) next = i;
      });
      // when the page can't scroll far enough to surface the last heading, mark it active
      if (atBottom && headings.length > 0) next = headings.length - 1;
      setActiveIndex(next);
    };
    scrollEl.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => scrollEl.removeEventListener("scroll", onScroll);
  }, [headings, scrollRef]);

  // ── scroll-to ──────────────────────────────────────────────────────────────
  const scrollToHeading = useCallback((heading) => {
    const scrollEl = scrollRef?.current;
    if (!scrollEl) { heading.el.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    const top =
      heading.el.getBoundingClientRect().top -
      scrollEl.getBoundingClientRect().top +
      scrollEl.scrollTop - 88;
    scrollEl.scrollTo({ top, behavior: "smooth" });
  }, [scrollRef]);

  // ── mouse — motion value only, zero React re-render cost ──────────────────
  const handleMouseMove  = useCallback((e) => { mouseYMV.set(e.clientY); }, [mouseYMV]);
  const handleMouseEnter = useCallback(() => setIsHovering(true),  []);
  const handleMouseLeave = useCallback(() => {
    mouseYMV.set(-999);
    setIsHovering(false);
  }, [mouseYMV]);

  if (!visible || headings.length === 0 || isDocSwitching) return null;

  // Stable keys based on heading text+level so AnimatePresence only fires when
  // headings are actually added or removed — not when switching documents.
  // Duplicate texts at the same level get a -2, -3 … suffix.
  const headingKeys = (() => {
    const seen = new Map();
    return headings.map(h => {
      const base = `${h.level}-${h.text}`;
      const n = (seen.get(base) || 0) + 1;
      seen.set(base, n);
      return n > 1 ? `${base}-${n}` : base;
    });
  })();

  return (
    <div
      className="fixed right-0 top-0 bottom-0 z-[25] flex items-center print:hidden"
      style={{ pointerEvents: "none" }}
    >
      <div
        className="flex flex-col items-end"
        style={{
          gap:           10,
          pointerEvents: "auto",
          paddingLeft:   24,
          paddingRight:  12,
          paddingTop:    48,
          paddingBottom: 48,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <AnimatePresence initial={false}>
          {headings.map((heading, i) => (
            <motion.div
              key={headingKeys[i]}
              layout
              initial={{ opacity: 0, scale: 0.35, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1,    filter: "blur(0px)" }}
              exit={{    opacity: 0, scale: 0.35, filter: "blur(8px)" }}
              transition={{
                opacity: { duration: 0.28, ease: "easeOut" },
                scale:   { type: "spring", stiffness: 420, damping: 36, mass: 0.7 },
                filter:  { duration: 0.3,  ease: "easeOut" },
                layout:  { type: "spring", stiffness: 380, damping: 38, mass: 0.6 },
              }}
              style={{ display: "flex", justifyContent: "flex-end" }}
            >
              <PillItem
                heading={heading}
                isHovering={isHovering}
                isActive={i === activeIndex}
                mouseYMV={mouseYMV}
                onScrollTo={scrollToHeading}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
