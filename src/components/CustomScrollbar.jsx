import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PILL_W = 7;
const PILL_H = 100;
const FULL_W = 7;
const DOT_H = 22;
const PILL_OFFSET_TOP = 56; // distance from top of container

const EXPAND = { duration: 0.26, ease: [0.32, 0.72, 0, 1] };
const COLLAPSE = { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] };

export default function CustomScrollbar({ scrollRef, rightOffset = 4 }) {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [s, setS] = useState({ progress: 0, thumbH: 0, thumbTop: 0, trackTop: 0, trackH: 0, trackRight: 0 });
  const hideTimer = useRef(null);
  const isDragging = useRef(false);
  const dragStart = useRef({});

  const compute = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.scrollHeight <= el.clientHeight) return null;
    const rect = el.getBoundingClientRect();
    const progress = el.scrollTop / (el.scrollHeight - el.clientHeight);
    const trackH = el.clientHeight;
    const thumbH = Math.max(32, (el.clientHeight / el.scrollHeight) * trackH);
    const thumbTop = progress * (trackH - thumbH);
    return { progress, thumbH, thumbTop, trackTop: rect.top, trackH, trackRight: window.innerWidth - rect.right + rightOffset };
  }, [scrollRef, rightOffset]);

  const scheduleHide = useCallback(() => {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!isDragging.current) setVisible(false);
    }, 1400);
  }, []);

  const onScroll = useCallback(() => {
    const r = compute();
    if (!r) return;
    setS(r);
    setVisible(true);
    if (!isDragging.current) scheduleHide();
  }, [compute, scheduleHide]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      clearTimeout(hideTimer.current);
    };
  }, [scrollRef, onScroll]);

  const onMouseEnter = useCallback(() => {
    clearTimeout(hideTimer.current);
    const r = compute();
    if (r) setS(r);
    setVisible(true);
    setExpanded(true);
  }, [compute]);

  const onMouseLeave = useCallback(() => {
    if (!isDragging.current) {
      setExpanded(false);
      scheduleHide();
    }
  }, [scheduleHide]);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    const el = scrollRef.current;
    if (!el) return;
    isDragging.current = true;
    dragStart.current = { y: e.clientY, scrollTop: el.scrollTop, thumbH: s.thumbH, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight };
    const onMove = (mv) => {
      const { y, scrollTop, thumbH, scrollHeight, clientHeight } = dragStart.current;
      scrollRef.current.scrollTop = scrollTop + ((mv.clientY - y) / (clientHeight - thumbH)) * (scrollHeight - clientHeight);
    };
    const onUp = () => {
      isDragging.current = false;
      setExpanded(false);
      scheduleHide();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [scrollRef, s.thumbH, scheduleHide]);

  const pillTop = s.trackTop + PILL_OFFSET_TOP;
  const dotTop = pillTop + s.progress * (PILL_H - DOT_H);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="sb"
          initial={{ opacity: 0, filter: "blur(6px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, filter: "blur(6px)" }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          style={{ position: "fixed", zIndex: 9999, pointerEvents: "none" }}
        >
          {/* Hover zone — hugs pill when collapsed, full track when expanded */}
          <motion.div
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            animate={{
              top: expanded ? s.trackTop : pillTop,
              height: expanded ? s.trackH : PILL_H,
            }}
            transition={expanded ? EXPAND : COLLAPSE}
            style={{
              position: "fixed",
              right: s.trackRight - 10,
              width: FULL_W + 20,
              pointerEvents: "auto",
              background: "transparent",
            }}
          />

          {/* Track — full height, fades in on expand */}
          <motion.div
            animate={{
              top: expanded ? s.trackTop : pillTop,
              height: expanded ? s.trackH : PILL_H,
              opacity: expanded ? 0.12 : 0,
            }}
            transition={expanded ? EXPAND : COLLAPSE}
            style={{
              position: "fixed",
              right: s.trackRight,
              width: FULL_W,
              borderRadius: FULL_W / 2,
              background: "var(--color-border-hover)",
              pointerEvents: "none",
            }}
          />

          {/* Pill / thumb body */}
          <motion.div
            onMouseDown={expanded ? onMouseDown : undefined}
            animate={expanded ? {
              top: s.trackTop + s.thumbTop,
              height: s.thumbH,
              opacity: 0.6,
            } : {
              top: pillTop,
              height: PILL_H,
              opacity: 0.3,
            }}
            transition={expanded ? EXPAND : COLLAPSE}
            style={{
              position: "fixed",
              right: s.trackRight,
              width: FULL_W,
              borderRadius: FULL_W / 2,
              background: "var(--color-border-hover)",
              cursor: expanded ? "grab" : "default",
              pointerEvents: expanded ? "auto" : "none",
            }}
          />

          {/* Position dot — only visible when collapsed */}
          <AnimatePresence>
            {!expanded && (
              <motion.div
                key="dot"
                initial={{ opacity: 0, top: dotTop }}
                animate={{ opacity: 1, top: dotTop }}
                exit={{ opacity: 0, top: dotTop, transition: { duration: 0.08 } }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                style={{
                  position: "fixed",
                  right: s.trackRight,
                  width: FULL_W,
                  height: DOT_H,
                  borderRadius: FULL_W / 2,
                  background: "var(--color-text-muted)",
                  pointerEvents: "none",
                }}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
