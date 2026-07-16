import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, PenLine, Lightbulb } from "lucide-react";
import { generateAIResponse } from "../utils/gemini";
import { buddyPresetPrompt, buddyPresetLabel } from "../utils/buddyPresets";

// The /buddy experience: no box. Buddy floats at your caret; his face is the
// fixed anchor and the option column slides so the choice in line with him is
// the one you pick. Behind it all sits a soft-edged, 90%-opaque rounded
// rectangle of the page background — legible, no glass. Keyboard-first.

const ROW_H = 34;
const SPRING = { type: "spring", stiffness: 420, damping: 34, mass: 0.7 };
const FACE_W = 28;
const FACE_GAP = 24; // breathing room between Buddy and the options
const CONTENT_W = 190; // the "How can I help..." input, the widest thing on a row
const BACKDROP_W = 340; // fixed width: the shape never reacts to option changes
const BACKDROP_PAD = 46; // blur(18px) feathers inward — keep content in the solid core
// Centered on the whole UI (face + options), not hugging Buddy's edge
const BACKDROP_L = (CONTENT_W - FACE_W - FACE_GAP) / 2 - BACKDROP_W / 2;
const CONTENT_X = FACE_W + FACE_GAP; // where content starts, in line coords
// The backdrop is ONE persistent element that morphs between phase shapes —
// Dynamic Island style — instead of remounting (and snapping) per phase.
const BACKDROP_SPRING = { type: "spring", stiffness: 360, damping: 32, mass: 0.8 };

export default function BuddyCaret({
  isOpen,
  position,
  onClose,
  onApplyText,
  fullDocumentText = "",
  cursorBeforeText = "",
  cursorAfterText = "",
}) {
  const [phase, setPhase] = useState("menu"); // menu | ask | working | done | reply
  const [menuIndex, setMenuIndex] = useState(0);
  const [input, setInput] = useState("");
  const [workLabel, setWorkLabel] = useState("");
  const [lastResponse, setLastResponse] = useState(null);
  const [isError, setIsError] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [refining, setRefining] = useState(false);
  const [blink, setBlink] = useState(false);
  const [joy, setJoy] = useState(false);
  // Hovering the menu presents every option flat and fully readable
  const [menuHovered, setMenuHovered] = useState(false);

  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  // Measure the done/reply content so the backdrop always covers the whole
  // response area (fixed-size rects left long replies hanging off the edge)
  const contentElRef = useRef(null);
  const [contentBox, setContentBox] = useState({ w: CONTENT_W, h: ROW_H });

  const [isDark, setIsDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e) => setIsDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const getUrl = (key) => `/buddy expressions/buddy${isDark ? "dark" : "light"}${key === "idle" ? "" : key}.png`;

  useEffect(() => {
    const el = contentElRef.current;
    if (!el || (phase !== "done" && phase !== "reply")) return;
    const measure = () => setContentBox({ w: el.offsetWidth, h: el.offsetHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [phase]);

  const docHasWords = (fullDocumentText || "").replace(/<[^>]+>/g, "").trim().length > 0;
  const options = [
    { id: "ask", title: "How can I help..." },
    docHasWords && { id: "finish", icon: PenLine, title: "Finish thought" },
    docHasWords && { id: "suggest", icon: Lightbulb, title: "Suggest" },
  ].filter(Boolean);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setPhase("menu");
      setMenuIndex(0);
      setInput("");
      setLastResponse(null);
      setIsError(false);
      setShowDiff(false);
      setRefining(false);
      setJoy(false);
    }
  }, [isOpen]);

  // Gentle blinking whenever Buddy is out
  useEffect(() => {
    if (!isOpen) return;
    let t1, t2;
    const loop = () => {
      t1 = setTimeout(() => {
        setBlink(true);
        t2 = setTimeout(() => { setBlink(false); loop(); }, 150);
      }, Math.random() * 3200 + 2200);
    };
    loop();
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isOpen]);

  // Face expression per phase
  let face = "idle";
  if (phase === "menu" || joy) face = blink ? "smileblink" : "smile";
  else if (isError && phase === "reply") face = "error";
  else face = blink ? "blink" : "idle";

  const run = async (promptText, presetId = null) => {
    if (!promptText?.trim()) return;
    setPhase("working");
    setWorkLabel(presetId ? buddyPresetLabel(presetId) : "Thinking it over…");
    setIsError(false);
    try {
      let context;
      if (presetId === "apply") {
        const prev = lastResponse?.conversational_reply || "";
        context = `You previously reviewed the user's document and replied with these suggestions:\n\n"${prev}"\n\nThe full document HTML is:\n\n"${fullDocumentText}"\n\nApply those suggestions to the document now. Use replace_document and return the complete updated document HTML.`;
      } else if (refining && lastResponse) {
        const prev = lastResponse.generated_html || lastResponse.conversational_reply || "";
        context = `The user is refining your previous response. Here is your previous draft:\n\n"${prev}"`;
      } else if (presetId === "finish") {
        context = `The user has a collapsed cursor and wants you to continue their writing from that exact point.${cursorBeforeText ? `\n\nText immediately BEFORE the cursor:\n"${cursorBeforeText}"` : ""}${cursorAfterText ? `\n\nText immediately AFTER the cursor:\n"${cursorAfterText}"` : ""}\n\nUse insert_at_cursor.`;
      } else if (presetId === "suggest") {
        context = `The user is working on their document and wants feedback. The full document HTML is:\n\n"${fullDocumentText}"`;
      } else {
        context = `The user has a collapsed cursor (no text selected) inside their document.${cursorBeforeText ? `\n\nText before the cursor:\n"${cursorBeforeText.slice(-1000)}"` : "\n\nThe document is empty so far."}${cursorAfterText ? `\n\nText after the cursor:\n"${cursorAfterText}"` : ""}`;
      }
      const res = await generateAIResponse(promptText, context, []);
      setLastResponse(res);
      setRefining(true);
      const op = res?.operation;
      if ((op === "insert_at_cursor" || op === "replace_selection" || op === "replace_document") && res?.generated_html) {
        onApplyText(res, op);
        setShowDiff(false);
        setPhase("done");
        setJoy(true);
        setTimeout(() => setJoy(false), 2200);
      } else {
        setPhase("reply");
      }
    } catch (err) {
      console.error(err);
      setLastResponse({ conversational_reply: err?.message || "Something went wrong. Try again?" });
      setIsError(true);
      setPhase("reply");
      setTimeout(() => setIsError(false), 4000);
    }
  };

  const runOption = (opt) => {
    if (!opt) return;
    if (opt.id === "ask") {
      setMenuIndex(0);
      setTimeout(() => inputRef.current?.focus(), 60);
      return;
    }
    run(buddyPresetPrompt(opt.id), opt.id);
  };

  const submitInline = () => {
    if (!input.trim()) return;
    const q = input;
    setInput("");
    run(q);
  };

  const startTyping = (seed = "") => {
    setPhase("ask");
    setInput(seed);
    setTimeout(() => inputRef.current?.focus(), 120);
  };

  // menuIndex ref so the keydown closure always fires the aligned option
  const menuIndexRef = useRef(0);
  useEffect(() => { menuIndexRef.current = menuIndex; }, [menuIndex]);

  // The "How can I help..." line owns the keyboard while it's with Buddy
  useEffect(() => {
    if (!isOpen || phase !== "menu") return;
    if (menuIndex === 0) {
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
    inputRef.current?.blur();
  }, [isOpen, phase, menuIndex]);

  // Keyboard-first: everything works without the mouse
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      const p = phaseRef.current;
      if (p === "ask") return; // the input handles its own keys
      if (e.key === "Escape") {
        e.preventDefault(); e.stopPropagation();
        onClose();
        return;
      }
      if (p === "menu") {
        if (e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey)) {
          e.preventDefault(); e.stopPropagation();
          setMenuIndex((i) => Math.min(i + 1, options.length - 1));
        } else if (e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)) {
          e.preventDefault(); e.stopPropagation();
          setMenuIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
          e.preventDefault(); e.stopPropagation();
          if (menuIndexRef.current === 0) submitInline();
          else runOption(options[menuIndexRef.current]);
        } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          // On the "How can I help..." line, letters fall straight into it.
          // From any other option, roll home and start the thought there.
          if (menuIndexRef.current !== 0) {
            e.preventDefault(); e.stopPropagation();
            setMenuIndex(0);
            setInput(e.key);
            setTimeout(() => inputRef.current?.focus(), 60);
          }
        }
      } else if (p === "done" || p === "reply") {
        if (e.key === "Enter") {
          e.preventDefault(); e.stopPropagation();
          onClose();
        } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault(); e.stopPropagation();
          startTyping(e.key);
        }
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, options.length, onClose, input]);

  // Click anywhere off the content closes
  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [isOpen, onClose]);

  const submitAsk = (e) => {
    e?.preventDefault();
    if (!input.trim()) return;
    const q = input;
    setInput("");
    run(q);
  };

  const askKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault(); e.stopPropagation();
      if (!input.trim() && !refining) {
        setPhase("menu");
        inputRef.current?.blur();
      } else {
        onClose();
      }
    }
  };

  // Buddy applies his own suggestions to the document instead of pasting
  // the reply text in
  const applySuggestions = () => {
    run(buddyPresetPrompt("apply"), "apply");
  };

  // Geometry: face line pinned near the caret; rows slide behind the backdrop
  const PAD_Y = (options.length - 1) * ROW_H + 26;
  const width = 400;
  const lineTop = Math.min(Math.max((position?.y || 100) + 14, 60), window.innerHeight - 120);
  const left = Math.min(Math.max((position?.x || 100) - 54, 8), window.innerWidth - width - 8);

  // Replies may carry light structure (<h3> section headings, lists) — render
  // them as HTML; plain text still gets wrapped line by line
  const renderReplyHtml = (text) => {
    const t = (text || "").trim();
    if (/<\/?(h[1-6]|p|ul|ol|li|blockquote)\b/i.test(t)) return t.replace(/>\s*\n+\s*</g, "><");
    return t.split("\n").filter((l) => l.trim() !== "").map((l) => `<p class="mb-1.5 last:mb-0">${l}</p>`).join("");
  };

  // The one morphing backdrop: shaped per phase, sized to the measured
  // response when there is one. Coordinates are in line-container space.
  const backdropRect =
    phase === "menu"
      ? {
          top: -((options.length - 1) * ROW_H + BACKDROP_PAD),
          left: CONTENT_X + BACKDROP_L,
          width: BACKDROP_W,
          height: (2 * options.length - 1) * ROW_H + BACKDROP_PAD * 2,
        }
      : phase === "ask" || phase === "working"
      ? {
          top: -BACKDROP_PAD,
          left: CONTENT_X + BACKDROP_L,
          width: BACKDROP_W,
          height: ROW_H + BACKDROP_PAD * 2,
        }
      : {
          top: -BACKDROP_PAD,
          left: -BACKDROP_PAD,
          width: CONTENT_X + Math.max(contentBox.w, CONTENT_W) + BACKDROP_PAD * 2,
          height: Math.max(contentBox.h, ROW_H) + BACKDROP_PAD * 2,
        };

  const linkCls = "pointer-events-auto text-[11.5px] font-medium text-[var(--color-text-faint)] hover:text-[var(--color-text-primary)] transition-colors select-none";

  return (
    <motion.div
      ref={rootRef}
      initial={{ opacity: 0, scale: 0.97, filter: "blur(6px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.97, filter: "blur(5px)", transition: { duration: 0.16 } }}
      transition={{ opacity: { duration: 0.22 }, filter: { duration: 0.25 }, scale: SPRING }}
      className="fixed z-[100] pointer-events-none print:hidden"
      style={{ left, top: lineTop - PAD_Y, width, transformOrigin: "60px 50%" }}
    >
      <div className="relative" style={{ paddingTop: PAD_Y, paddingBottom: PAD_Y }}>
        {/* The line — Buddy's face is the anchor for everything */}
        <div className="relative flex items-center" style={{ minHeight: ROW_H, gap: FACE_GAP }}>
          {/* Stationary soft-edged opaque backdrop — one persistent shape that
              morphs between phases instead of remounting, so changes glide */}
          <motion.div
            className="buddy-backdrop"
            initial={false}
            animate={backdropRect}
            transition={BACKDROP_SPRING}
          />
          <motion.img
            layoutId="buddy-face"
            src={getUrl(face)}
            alt="Buddy"
            transition={{ layout: { type: "tween", duration: 0.55, ease: [0.22, 1, 0.36, 1] } }}
            className="relative z-10 object-contain select-none drop-shadow-sm flex-shrink-0 self-start"
            style={{ width: FACE_W, height: FACE_W, aspectRatio: "1 / 1", marginTop: (ROW_H - FACE_W) / 2 }}
            draggable="false"
          />

          <AnimatePresence mode="popLayout" initial={false}>
            {phase === "menu" && (
              <motion.div
                key="menu"
                initial={{ opacity: 0, filter: "blur(3px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(3px)", transition: { duration: 0.12 } }}
                className="relative"
                style={{ height: ROW_H }}
                onMouseEnter={() => setMenuHovered(true)}
                onMouseLeave={() => setMenuHovered(false)}
              >
                {/* Selection glow — fixed blurred orange square on Buddy's line */}
                <div
                  className="buddy-pill absolute pointer-events-none"
                  style={{ width: 176, height: ROW_H, top: 0, left: -14 }}
                />
                {/* The column of options slides so the chosen one meets Buddy */}
                <motion.div
                  animate={{ y: -menuIndex * ROW_H }}
                  transition={SPRING}
                  className="relative z-10"
                >
                  {options.map((opt, i) => {
                    const Icon = opt.icon;
                    const d = Math.abs(i - menuIndex);
                    const active = d === 0;
                    const rolled = menuHovered
                      ? { opacity: 1, scale: 1, x: 0 }
                      : { opacity: active ? 1 : d === 1 ? 0.5 : 0.26, scale: active ? 1 : 0.965, x: active ? 0 : 12 + (d - 1) * 5 };
                    if (opt.id === "ask") {
                      return (
                        <motion.div
                          key={opt.id}
                          animate={rolled}
                          transition={SPRING}
                          onClick={() => { setMenuIndex(i); setTimeout(() => inputRef.current?.focus(), 60); }}
                          className="pointer-events-auto flex items-center cursor-text"
                          style={{ height: ROW_H }}
                        >
                          <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="How can I help..."
                            className="bg-transparent outline-none border-none text-[14px] font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-faint)] w-[190px]"
                            style={{ caretColor: "var(--color-accent)" }}
                          />
                        </motion.div>
                      );
                    }
                    return (
                      <motion.button
                        key={opt.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { setMenuIndex(i); setTimeout(() => runOption(opt), i === menuIndex ? 0 : 180); }}
                        animate={rolled}
                        transition={SPRING}
                        className="pointer-events-auto flex items-center gap-2.5 text-left outline-none"
                        style={{ height: ROW_H }}
                      >
                        {Icon && <Icon size={15} strokeWidth={2} className={`flex-shrink-0 transition-colors duration-200 ${active ? "text-[var(--color-text-primary)]" : "text-[var(--color-icon-muted)]"}`} />}
                        <span className="text-[14px] font-medium text-[var(--color-text-primary)] whitespace-nowrap leading-none">
                          {opt.title}
                        </span>
                      </motion.button>
                    );
                  })}
                </motion.div>
              </motion.div>
            )}

            {phase === "ask" && (
              <motion.form
                key="ask"
                onSubmit={submitAsk}
                initial={{ opacity: 0, filter: "blur(3px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(3px)", transition: { duration: 0.12 } }}
                className="pointer-events-auto relative flex items-center"
                style={{ height: ROW_H, width: 300 }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={askKeyDown}
                  placeholder={refining ? "Tell Buddy what to change…" : "Ask for a hand with your writing…"}
                  className="relative z-10 w-full bg-transparent outline-none border-none text-[14px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-faint)]"
                  style={{ caretColor: "var(--color-accent)" }}
                />
              </motion.form>
            )}

            {phase === "working" && (
              <motion.div
                key="working"
                initial={{ opacity: 0, filter: "blur(3px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(3px)", transition: { duration: 0.12 } }}
                className="relative flex items-center"
                style={{ height: ROW_H }}
              >
                <span className="relative z-10 buddy-shimmer-text text-[13.5px] font-medium select-none whitespace-nowrap">{workLabel}</span>
              </motion.div>
            )}

            {phase === "done" && (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 4, filter: "blur(3px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(3px)", transition: { duration: 0.12 } }}
                transition={SPRING}
                ref={contentElRef}
                className="relative flex flex-col"
              >
                <div className="relative z-10 flex items-center gap-3" style={{ height: ROW_H }}>
                  <span className="flex items-center gap-1.5 text-[13.5px] font-medium text-[var(--color-text-primary)] whitespace-nowrap select-none">
                    <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 500, damping: 18, delay: 0.1 }}>
                      <Check size={14} className="text-green-500" strokeWidth={2.5} />
                    </motion.span>
                    Changed it
                  </span>
                  <span className="flex items-center gap-2.5">
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setShowDiff((v) => !v)} className={linkCls}>
                      {showDiff ? "Hide" : "View"}
                    </button>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onClose} className={linkCls}>
                      Done
                    </button>
                  </span>
                </div>

                {/* Expandable peek at what Buddy changed */}
                <AnimatePresence>
                  {showDiff && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, filter: "blur(3px)" }}
                      animate={{ opacity: 1, height: "auto", filter: "blur(0px)" }}
                      exit={{ opacity: 0, height: 0, filter: "blur(3px)" }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="relative z-10 pointer-events-auto overflow-hidden"
                      style={{ maxWidth: 300 }}
                    >
                      <div
                        className="editor-content !pb-0 mt-1.5 pl-3 border-l-2 border-[var(--color-accent)]/40 text-[13px] leading-relaxed text-[var(--color-text-muted)] max-h-[240px] overflow-y-auto no-scrollbar break-words [&_p]:!my-0 [&_ul]:!my-0 [&_ol]:!my-0"
                        dangerouslySetInnerHTML={{ __html: lastResponse?.generated_html || "" }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {phase === "reply" && (
              <motion.div
                key="reply"
                initial={{ opacity: 0, y: 5, filter: "blur(3px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(3px)", transition: { duration: 0.12 } }}
                transition={SPRING}
                ref={contentElRef}
                className="pointer-events-auto relative flex flex-col gap-2 py-1.5"
                style={{ maxWidth: 320 }}
              >
                <div
                  className="editor-content buddy-reply !pb-0 relative z-10 text-[13.5px] leading-relaxed text-[var(--color-text-primary)] max-h-[38vh] overflow-y-auto no-scrollbar break-words [&_p]:!my-0"
                  dangerouslySetInnerHTML={{ __html: renderReplyHtml(lastResponse?.conversational_reply) }}
                />
                <div className="relative z-10 flex items-center gap-3">
                  {!isError && docHasWords && lastResponse?.conversational_reply && (
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={applySuggestions} className="pointer-events-auto text-[11.5px] font-medium text-[var(--color-accent)] hover:opacity-75 transition-opacity select-none">
                      Apply changes
                    </button>
                  )}
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onClose} className={linkCls}>
                    Done
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
