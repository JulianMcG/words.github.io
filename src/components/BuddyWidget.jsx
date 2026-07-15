import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Loader2, ArrowRight, File, Check, MicOff, Mic, BrushCleaning, Lightbulb } from "lucide-react";
import { generateAIResponse } from "../utils/gemini";
import { buddyPresetPrompt, buddyPresetLabel } from "../utils/buddyPresets";

export default function BuddyWidget({ isOpen, position, onClose, onApplyText, selectedText, selectedHtml, isCollapsedSelection, fullDocumentText, onGlobalClick, docs = [], activeDocId, onLongPress, onStartLive, suppressed = false, isDumpActive = false, micError = null, onDismissMicError = null }) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [previewText, setPreviewText] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);

  // Which quick action is highlighted in the panel
  const [menuIndex, setMenuIndex] = useState(0);
  // While a one-click action runs, this shows as a shimmering status line
  const [autoLabel, setAutoLabel] = useState(null);
  // After an applied change the bar reads "✓ Changed it"; typing brings the input back
  const [showRefine, setShowRefine] = useState(false);
  // Pills ride in from the right only on open; returning after typing they rise straight up
  const pillsShownRef = useRef(false);
  
  const [expression, setExpression] = useState("idle");
  const [isHovered, setIsHovered] = useState(false);
  const [isHoverSequenceComplete, setIsHoverSequenceComplete] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionedDocs, setMentionedDocs] = useState([]);

  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const inputRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const isLongPressRef = useRef(false);
  const micErrorDismissReadyRef = useRef(false);
  
  const [hasError, setHasError] = useState(false);
  const [isChangesApplied, setIsChangesApplied] = useState(false);
  const [isViewingChanges, setIsViewingChanges] = useState(false);

  const [blinkState, setBlinkState] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (!micError) return;
    // Kill hover/magnet state immediately so they don't affect the animation
    setIsHovered(false);
    setIsClicked(false);
    rawMagnetX.set(0);
    rawMagnetY.set(0);
    rawTiltX.set(0);
    rawTiltY.set(0);
    // Require a fresh down+up after the error shows — the mouseUp that triggered
    // the long-press should not immediately dismiss
    micErrorDismissReadyRef.current = false;
    setIsShaking(true);
    const t = setTimeout(() => setIsShaking(false), 600);
    return () => clearTimeout(t);
  }, [micError]);

  const rawMagnetX = useMotionValue(0);
  const rawMagnetY = useMotionValue(0);
  const magnetX = useSpring(rawMagnetX, { stiffness: 180, damping: 22, mass: 0.5 });
  const magnetY = useSpring(rawMagnetY, { stiffness: 180, damping: 22, mass: 0.5 });
  // A slight 3D lean toward the cursor, like the membership card / Spotlight paper
  const rawTiltX = useMotionValue(0);
  const rawTiltY = useMotionValue(0);
  const tiltX = useSpring(rawTiltX, { stiffness: 320, damping: 26, mass: 0.55 });
  const tiltY = useSpring(rawTiltY, { stiffness: 320, damping: 26, mass: 0.55 });

  useEffect(() => {
    if (!isHovered || isOpen) {
      rawMagnetX.set(0);
      rawMagnetY.set(0);
      rawTiltX.set(0);
      rawTiltY.set(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHovered, isOpen]);

  const hoverSequenceStartedRef = useRef(false);

  const shouldBackgroundBlink = isOpen || (isHovered && isHoverSequenceComplete);

  useEffect(() => {
    if (!shouldBackgroundBlink) {
      setBlinkState("");
      return;
    }

    let timeoutId;
    let currentBlinkTimeouts = [];

    const clearBlinks = () => {
      currentBlinkTimeouts.forEach(clearTimeout);
      currentBlinkTimeouts = [];
    };

    const triggerBlink = () => {
      clearBlinks();
      setBlinkState("blink");
      
      const isDoubleBlink = Math.random() < 0.25;
      
      if (isDoubleBlink) {
        // Double-blink: 150ms blink -> 100ms pause -> 120ms blink
        currentBlinkTimeouts.push(setTimeout(() => {
          setBlinkState(""); // Pause starts
          currentBlinkTimeouts.push(setTimeout(() => {
            setBlinkState("blink"); // Second blink starts
            currentBlinkTimeouts.push(setTimeout(() => {
              setBlinkState(""); // Second blink ends
            }, 120));
          }, 100));
        }, 150));
      } else {
        // Standard Blink: 150ms
        currentBlinkTimeouts.push(setTimeout(() => {
          setBlinkState("");
        }, 150));
      }

      timeoutId = setTimeout(triggerBlink, Math.random() * 3500 + 2500);
    };
    // Short initial delay so blinks start soon after hover sequence / widget open
    timeoutId = setTimeout(triggerBlink, Math.random() * 600 + 600);
    return () => {
        clearTimeout(timeoutId);
        clearBlinks();
    };
  }, [shouldBackgroundBlink]);

  const [isDark, setIsDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setIsDark(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const getUrl = (key) => `/buddy expressions/buddy${isDark ? 'dark' : 'light'}${key === "idle" ? "" : key}.png`;

  useEffect(() => {
    // Preload image assets to prevent "single-blink" network cache glitch on first hover
    const expressions = ["", "blink", "smile", "smilebetween", "smileblink", "click", "error"];
    expressions.forEach(key => {
      const img = new Image();
      img.src = `/buddy expressions/buddy${isDark ? 'dark' : 'light'}${key}.png`;
    });
  }, [isDark]);

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let t;
    if (isOpen) {
      setMenuIndex(-1);
      setAutoLabel(null);
      setShowRefine(false);
      setInput("");
      setTimeout(() => inputRef.current?.focus(), 300);
      setPreviewText("");
      setIsReviewing(false);
      setIsChangesApplied(false);
      setIsViewingChanges(false);
      setIsLoading(false);
      setHasError(false);
      setMentionQuery(null);
      setMentionedDocs([]);
      setMentionIndex(0);
      setExpression("idle");
    } else {
      // Safely flush heavy DOM rendering block state 400ms after closing animation begins.
      // This guarantees Buddy's internal height resets without interrupting the Framer Motion popLayout,
      // and permanently solves old text heights 'bleeding' open when you re-initiate him later!
      pillsShownRef.current = false;
      t = setTimeout(() => {
        setMenuIndex(-1);
        setAutoLabel(null);
        setShowRefine(false);
        setInput("");
        setPreviewText("");
        setIsReviewing(false);
        setIsChangesApplied(false);
        setIsViewingChanges(false);
        setIsLoading(false);
        setHasError(false);
        setMentionQuery(null);
        setMentionedDocs([]);
        setMentionIndex(0);
      }, 400);
    }
    return () => clearTimeout(t);
  }, [isOpen, selectedText]);

  // Hover Sequence Engine
  useEffect(() => {
    if (isOpen || isClicked) {
        hoverSequenceStartedRef.current = false;
        setIsHoverSequenceComplete(false);
        return;
    }

    if (isHovered) {
      hoverSequenceStartedRef.current = true;
      setIsHoverSequenceComplete(false);
      let t1 = setTimeout(() => setExpression("smilebetween"), 0);
      let t2 = setTimeout(() => setExpression("smileblink"), 50);  // first quick blink (50ms gap)
      let t3 = setTimeout(() => setExpression("smile"), 130);      // 80ms blink length
      let t4 = setTimeout(() => setExpression("smileblink"), 200); // 70ms separation gap, mandatory second blink
      let t5 = setTimeout(() => {
         setExpression("smile");
         setIsHoverSequenceComplete(true);
      }, 280);     // 80ms blink length

      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); setIsHoverSequenceComplete(false); };
    } else {
      setIsHoverSequenceComplete(false);
      if (hoverSequenceStartedRef.current) {
        // Transition through smilebetween when leaving smile state
        hoverSequenceStartedRef.current = false;
        setExpression("smilebetween");
        const t = setTimeout(() => setExpression("idle"), 80);
        return () => clearTimeout(t);
      } else {
        setExpression("idle");
      }
    }
  }, [isHovered, isOpen, isClicked]);

  // Click Sequence Engine — only sets "click"; hover sequence handles returning to smile/idle
  useEffect(() => {
    if (isOpen) return;
    if (isClicked) {
      setExpression("click");
    }
  }, [isClicked, isOpen]);

  let activeExpression = hasError || micError ? "error" : expression;
  
  if (!hasError && (expression === "idle" || expression === "smile") && blinkState === "blink" && shouldBackgroundBlink) {
     activeExpression = expression === "idle" ? "blink" : "smileblink";
  }

  // Handle @ Mentions
  const filteredDocs = (docs || [])
    .filter(d => d.id !== activeDocId && d.title?.trim() !== "")
    .filter(d => mentionQuery === null || d.title.toLowerCase().includes(mentionQuery.toLowerCase()));

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPosition);
    
    const lastAtMatch = textBeforeCursor.match(/(?:^|\s)@([^\/@]*)$/);
    if (lastAtMatch) {
      setMentionQuery(lastAtMatch[1]);
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  };

  const handleInputKeyDown = (e) => {
    if (mentionQuery !== null && filteredDocs.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % filteredDocs.length);
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + filteredDocs.length) % filteredDocs.length);
        return;
      } else if (e.key === 'Enter') {
        e.preventDefault();
        insertMention(filteredDocs[mentionIndex]);
        return;
      } else if (e.key === 'Escape') {
        setMentionQuery(null);
        return; 
      }
    }
    if (e.key === 'Escape') onClose();
  };

  const insertMention = (doc) => {
    const cursorPosition = inputRef.current?.selectionStart || input.length;
    const textBeforeCursor = input.slice(0, cursorPosition);
    const textAfterCursor = input.slice(cursorPosition);
    
    const lastAtMatch = textBeforeCursor.match(/(?:^|\s)@([^\/@]*)$/);
    if (lastAtMatch) {
      const matchIndex = lastAtMatch.index;
      const isSpace = textBeforeCursor[matchIndex] === ' ' || textBeforeCursor[matchIndex] === '\n';
      const startIdx = isSpace ? matchIndex + 1 : matchIndex;
      
      const titleString = `@${doc.title}`;
      const newInput = input.slice(0, startIdx) + titleString + " " + textAfterCursor;
      setInput(newInput);
      setMentionQuery(null);
      
      if (!mentionedDocs.find(d => d.id === doc.id)) {
        setMentionedDocs(prev => [...prev, doc]);
      }
      
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const newCursorPos = startIdx + titleString.length + 1; 
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 10);
    }
  };

  const renderHighlightedText = () => {
    if (!input) return null;
    if (mentionedDocs.length === 0) return input;
    
    let parts = [];
    const sortedDocs = [...mentionedDocs].sort((a, b) => b.title.length - a.title.length);
    const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
    const pattern = new RegExp(`@(${sortedDocs.map(d => escapeRegExp(d.title)).join('|')})`, 'g');
    
    let lastIndex = 0;
    let match;
    while ((match = pattern.exec(input)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={`text-${lastIndex}`}>{input.slice(lastIndex, match.index)}</span>);
      }
      parts.push(<span key={`mention-${match.index}`} className="text-orange-500 font-medium">{match[0]}</span>);
      lastIndex = pattern.lastIndex;
    }
    if (lastIndex < input.length) {
      parts.push(<span key={`text-${lastIndex}`}>{input.slice(lastIndex)}</span>);
    }
    return parts;
  };

  // ── Choice menu ────────────────────────────────────────────────────────────
  const hasSelection = selectedText && selectedText !== "GLOBAL_CHAT" && !isCollapsedSelection;
  const docHasWords = (fullDocumentText || "").replace(/<[^>]+>/g, "").trim().length > 0;

  // Quick-action pills that float above the bar
  const menuOptions = [
    { id: "live", icon: Mic, label: "Live", enabled: true },
    { id: "clean", icon: BrushCleaning, label: "Clean", enabled: docHasWords },
    { id: "suggest", icon: Lightbulb, label: "Suggest", enabled: docHasWords },
  ];

  const runMenuOption = (opt) => {
    if (!opt || opt.enabled === false) return;
    if (opt.id === "live") {
      onClose();
      setTimeout(() => onStartLive?.(), 200);
      return;
    }
    // One-click actions: Buddy just does it
    setAutoLabel(buddyPresetLabel(opt.id));
    handleGenerate(null, opt);
  };

  // Step through the quick actions, skipping disabled ones
  const stepAction = (from, dir) => {
    let i = from < 0 ? (dir > 0 ? -1 : 0) : from;
    for (let n = 0; n < menuOptions.length; n++) {
      i = (i + dir + menuOptions.length) % menuOptions.length;
      if (menuOptions[i].enabled) return i;
    }
    return from;
  };

  // While the bar shows "✓ Changed it", typing brings the refine input back
  useEffect(() => {
    if (!isOpen || !isChangesApplied || showRefine || autoLabel || isLoading) return;
    const onKey = (e) => {
      if (e.key === "Enter") {
        e.preventDefault(); e.stopPropagation();
        onClose();
        return;
      }
      if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault(); e.stopPropagation();
        setShowRefine(true);
        setInput(e.key);
        setTimeout(() => inputRef.current?.focus(), 80);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [isOpen, isChangesApplied, showRefine, autoLabel, isLoading, onClose]);

  // Bar keyboard: type to ask (the input is focused). Arrow up lifts you onto
  // the pills, left/right walk them, down comes home, Enter runs the pill
  // when the prompt is empty. Escape closes.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (mentionQuery !== null) return; // the input's own handler owns the mention list
      if (e.key === "Escape") {
        e.preventDefault(); e.stopPropagation();
        onClose();
        return;
      }
      if (autoLabel || isLoading || isReviewing) return;
      if (e.key === "ArrowUp" || (e.key === "Tab" && !e.shiftKey)) {
        e.preventDefault(); e.stopPropagation();
        setMenuIndex((i) => stepAction(i, 1));
      } else if (e.key === "ArrowDown") {
        e.preventDefault(); e.stopPropagation();
        setMenuIndex(-1);
      } else if (e.key === "ArrowRight" && menuIndex >= 0) {
        e.preventDefault(); e.stopPropagation();
        setMenuIndex((i) => stepAction(i, 1));
      } else if ((e.key === "ArrowLeft" || (e.key === "Tab" && e.shiftKey)) && menuIndex >= 0) {
        e.preventDefault(); e.stopPropagation();
        setMenuIndex((i) => stepAction(i, -1));
      } else if (e.key === "Enter" && !input.trim() && menuIndex >= 0) {
        e.preventDefault(); e.stopPropagation();
        runMenuOption(menuOptions[menuIndex]);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, autoLabel, isLoading, isReviewing, input, menuIndex, mentionQuery, menuOptions.length, docHasWords]);

  const handleGenerate = async (e, preset = null) => {
    e?.preventDefault();
    const promptToUse = preset ? buddyPresetPrompt(preset.id, hasSelection) : input;
    if (!promptToUse?.trim() || isLoading) return;

    setIsLoading(true);

    try {
      let context = "";

      if (isReviewing && previewText) {
          const previousDraft = typeof previewText === 'object'
              ? (previewText.generated_html || previewText.conversational_reply || "")
              : previewText;
          context = `The user is refining your previous response. Here is your previous draft:\n\n"${previousDraft}"`;
      } else if (selectedText === "GLOBAL_CHAT") {
         context = `The user is working globally on their document. The full document HTML is:\n\n"${fullDocumentText}"`;
      } else if (isCollapsedSelection) {
         const surrounding = fullDocumentText ? fullDocumentText.slice(-200) : "";
         context = `The user has a collapsed cursor (no text selected) and wants to generate or insert content here.${surrounding ? `\n\nDocument context (last 200 chars before cursor):\n"${surrounding}"` : ""}`;
      } else {
         // Pass the HTML of the selection so the AI knows the full structure (e.g. if it's a <h2>, <strong>, etc.)
         context = `Here is the exact HTML the user has selected and wants to modify:\n\n${selectedHtml || `"${selectedText}"`}`;
      }

      const activeReferences = mentionedDocs.filter(d => input.includes(`@${d.title}`));
      const aiResponse = await generateAIResponse(promptToUse, context, activeReferences);

      // If the user asked for a checklist/todo, ensure the class is applied.
      // Models reliably generate <ul> but often drop class="checklist" — enforce it here.
      const checklistIntent = /\b(checklist|check\s*list|to[\s-]?do|todo|tasks?|action items?|check\s*off)\b/i.test(promptToUse);
      if (checklistIntent && aiResponse?.generated_html) {
        aiResponse.generated_html = aiResponse.generated_html.replace(
          /<ul(?![^>]*class=["']checklist["'])/g,
          '<ul class="checklist"'
        );
      }

      setPreviewText(aiResponse);
      
      // Joy Sequence: Match hover sequence cadence (60ms exact intervals)
      setExpression("smilebetween");
      setTimeout(() => setExpression("smile"), 80);
      setTimeout(() => setExpression("smileblink"), 1200);
      setTimeout(() => setExpression("smile"), 1260);
      setTimeout(() => setExpression("smileblink"), 1320);
      setTimeout(() => setExpression("smile"), 1380);
      setTimeout(() => setExpression("smilebetween"), 2400);
      setTimeout(() => setExpression("idle"), 2480);

      const op = aiResponse?.operation;

      if (op === "replace_selection" || op === "replace_document" || op === "insert_at_cursor") {
          onApplyText(aiResponse, op);
          setIsChangesApplied(true);
          setIsViewingChanges(false);
          setIsReviewing(true);
          setShowRefine(false);
      } else {
          // chat: show in panel, no document change
          setIsReviewing(true);
          setIsChangesApplied(false);
      }
      
      setInput("");
      setMentionedDocs([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (err) {
      console.error(err);
      setPreviewText(`Error: ${err.message || "Failed to query Buddy. Please try again."}`);
      setIsReviewing(true);
      setHasError(true);
      setTimeout(() => setHasError(false), 4000); // 4 second native error face
    } finally {
      setIsLoading(false);
      setAutoLabel(null);
    }
  };

  const handleApply = (mode, overrideText = null) => {
    onApplyText(overrideText || previewText, mode);
    onClose();
  };

  const hasValidHtml = typeof previewText === 'object' && previewText !== null && 
    typeof previewText?.generated_html === 'string' &&
    previewText.generated_html.replace(/<[^>]+>/g, '').trim() !== "";

  const renderDiffPreview = () => {
    if (typeof previewText === 'object' && previewText !== null) {
       return (
         <div className="flex flex-col gap-3">
           {previewText.conversational_reply && (
             <div className="flex gap-3 items-start p-1">
               <div 
                 className="editor-content !pb-0 w-full min-w-0 overflow-hidden text-[13.5px] leading-relaxed text-[var(--color-text-primary)] break-words whitespace-pre-wrap relative [&_p]:!my-0 [&_ul]:!my-0 [&_ol]:!my-0"
                 dangerouslySetInnerHTML={{ __html: previewText.conversational_reply.split('\n').filter(line => line.trim() !== "").map(line => `<p class="mb-2 last:mb-0">${line}</p>`).join('') }}
               />
             </div>
           )}
           
           {previewText.generated_html && (
             <div className="flex flex-col gap-1.5 mt-2 w-full min-w-0">
                 {selectedText === "GLOBAL_CHAT" ? (
                   <div className="text-[11px] text-[var(--color-text-faint)] font-medium mb-0.5 select-none">
                     Your document, now —
                   </div>
                 ) : (selectedHtml || selectedText) ? (
                   <div
                     className="editor-content !pb-0 w-full min-w-0 overflow-hidden break-words text-[12px] leading-relaxed text-[var(--color-text-faint)] line-through decoration-[var(--color-text-faint)]/50 opacity-70 [&_p]:!my-0 [&_ul]:!my-0 [&_ol]:!my-0"
                     dangerouslySetInnerHTML={{ __html: selectedHtml || selectedText }}
                   />
                 ) : null}

                 <div
                   className="editor-content !pb-0 w-full min-w-0 overflow-hidden break-words text-[13.5px] leading-relaxed text-[var(--color-text-primary)] pl-3 border-l-2 border-[var(--color-accent)]/40 [&_p]:!my-0 [&_ul]:!my-0 [&_ol]:!my-0"
                   dangerouslySetInnerHTML={{ __html: previewText.generated_html }}
                 />
             </div>
           )}
         </div>
       );
    }
    
    // Legacy generic string injection
    return (
      <div className="flex gap-3 items-start p-1">
        <div 
          className="editor-content !pb-0 w-full min-w-0 overflow-hidden break-words whitespace-pre-wrap text-[13.5px] leading-relaxed text-[var(--color-text-primary)] relative [&_p]:!my-0 [&_ul]:!my-0 [&_ol]:!my-0"
          dangerouslySetInnerHTML={{ __html: (previewText || "").split('\n').filter(line => line.trim() !== "").map(line => `<p class="mb-2 last:mb-0">${line}</p>`).join('') }}
        />
      </div>
    );
  };

  const activeWidth = 380;
  const restingWidth = 48;
  // The bar wears Buddy's original face — the full expression + blink engine
  const barFace = micError ? "error" : activeExpression;

  const safeX = Math.min(Math.max(position?.x || windowSize.width / 2, 8), windowSize.width - activeWidth - 8);
  const safeY = Math.min(position?.y || 100, windowSize.height - 220); 

  const isGlobal = selectedText === "GLOBAL_CHAT";

  const widgetRef = useRef(null);
  const contentRef = useRef(null);
  // Card chrome (bg, border, clip, shadow) lags the close by ~300ms so the
  // box visibly shrinks INTO Buddy instead of dissolving mid-air
  const [cardChrome, setCardChrome] = useState(false);
  useEffect(() => {
    if (isOpen) { setCardChrome(true); return; }
    const t = setTimeout(() => setCardChrome(false), 300);
    return () => clearTimeout(t);
  }, [isOpen]);
  const [contentH, setContentH] = useState(null);

  // Measure the open card's natural height so every state change is a real
  // morph (animating to "auto" only works once; contents change constantly)
  useEffect(() => {
    if (!isOpen) { setContentH(null); return; }
    let raf;
    const measure = () => { if (contentRef.current) setContentH(contentRef.current.offsetHeight); };
    const ro = new ResizeObserver(() => { raf = requestAnimationFrame(measure); });
    const t = setTimeout(() => {
      if (contentRef.current) { ro.observe(contentRef.current); measure(); }
    }, 30);
    return () => { clearTimeout(t); ro.disconnect(); cancelAnimationFrame(raf); };
  }, [isOpen]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (isOpen && widgetRef.current && !widgetRef.current.contains(e.target)) {
        // Only close if clicking outside the widget entirely
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen, onClose]);

  return (
    <>

      {/* Invisible fixed hitbox block */}
      {!isOpen && !suppressed && (
        <div 
          className="fixed z-[99] cursor-pointer print:hidden"
          style={{ 
            width: restingWidth + 40, 
            height: restingWidth + 40, 
            bottom: 0, 
            right: 15 
          }}
          onMouseEnter={() => { if (!micError) setIsHovered(true); }}
          onMouseMove={(e) => {
            if (micError) return;
            const hitboxSize = restingWidth + 40;
            const centerX = window.innerWidth - 15 - hitboxSize / 2;
            const centerY = window.innerHeight - hitboxSize / 2;
            const dx = e.clientX - centerX;
            const dy = e.clientY - centerY;
            const cap = 8;
            rawMagnetX.set(Math.max(-cap, Math.min(cap, dx * 0.22)));
            rawMagnetY.set(Math.max(-cap, Math.min(cap, dy * 0.22)));
            const nx = Math.max(-1, Math.min(1, dx / (hitboxSize / 2)));
            const ny = Math.max(-1, Math.min(1, dy / (hitboxSize / 2)));
            rawTiltY.set(nx * 8);
            rawTiltX.set(ny * -8);
          }}
          onMouseLeave={() => {
            clearTimeout(longPressTimerRef.current);
            rawMagnetX.set(0);
            rawMagnetY.set(0);
            rawTiltX.set(0);
            rawTiltY.set(0);
            if (micError) return;
            setIsHovered(false);
            setIsClicked(false);
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            if (micError) { micErrorDismissReadyRef.current = true; return; }
            setIsClicked(true);
            isLongPressRef.current = false;
            longPressTimerRef.current = setTimeout(() => {
              isLongPressRef.current = true;
              setIsClicked(false);
              setIsHovered(false);
              if (onLongPress) onLongPress();
            }, 600);
          }}
          onMouseUp={(e) => {
            e.preventDefault();
            clearTimeout(longPressTimerRef.current);
            if (micError) {
              if (micErrorDismissReadyRef.current) {
                micErrorDismissReadyRef.current = false;
                if (onDismissMicError) onDismissMicError();
              }
              return;
            }
            setIsClicked(false);
            if (!isLongPressRef.current && onGlobalClick) {
              onGlobalClick();
              setIsHovered(false);
            }
          }}
          onTouchStart={(e) => {
            if (micError) { micErrorDismissReadyRef.current = true; return; }
            isLongPressRef.current = false;
            longPressTimerRef.current = setTimeout(() => {
              isLongPressRef.current = true;
              if (onLongPress) onLongPress();
            }, 600);
          }}
          onTouchEnd={() => {
            clearTimeout(longPressTimerRef.current);
            if (micError) {
              if (micErrorDismissReadyRef.current) {
                micErrorDismissReadyRef.current = false;
                if (onDismissMicError) onDismissMicError();
              }
              return;
            }
            if (!isLongPressRef.current && onGlobalClick) {
              onGlobalClick();
            }
          }}
          onTouchCancel={() => clearTimeout(longPressTimerRef.current)}
        />
      )}

      {/* Visually animated physics layer */}
      <motion.div
        ref={widgetRef}
        initial={{ y: 150, width: restingWidth, height: restingWidth }}
        animate={{
          y: 0,
          width: isOpen ? activeWidth : restingWidth,
          height: isOpen ? (contentH ? contentH + 2 : "auto") : restingWidth,
        }}
        transition={{
          type: "spring", visualDuration: 0.42, bounce: 0.26,
        }}
        className={`fixed z-[100] print:hidden ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        style={{
          maxHeight: isOpen ? "600px" : "auto",
          x: magnetX,
          y: magnetY,
          ...((!isOpen || isGlobal)
             ? { bottom: isOpen ? 20 : (isHovered ? 15 : -20), right: isOpen ? 20 : 30 }
             : { top: safeY, left: safeX })
        }}
      >
        {/* drop-shadow follows the lisse clip-path, unlike box-shadow which it would crop */}
        <div
          className="w-full h-full"
          style={{
            filter: cardChrome ? 'drop-shadow(0 8px 20px rgba(0,0,0,0.13)) drop-shadow(0 2px 6px rgba(0,0,0,0.08))' : 'none',
            transition: 'filter 0.35s ease',
          }}
        >
        <div
          className={`w-full h-full border-shape-squircle transition-colors duration-200 ${
            cardChrome ? 'bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] overflow-hidden flex flex-col justify-end' : 'bg-transparent overflow-visible'
          }`}
          style={{ '--r': cardChrome ? '14px' : '24px' }}
        >
        <AnimatePresence mode="popLayout" initial={false} custom={suppressed ? "flight" : "normal"}>
          {suppressed ? null : !isOpen && !isDumpActive ? (
            <motion.div
              key="resting-icon"
              variants={{
                out: (reason) => reason === "flight"
                  ? { opacity: 0, transition: { duration: 0.35, ease: "easeOut" } }
                  : { opacity: 0, scale: 0.9, filter: "blur(4px)" },
              }}
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                x: isShaking ? [-9, 9, -7, 7, -4, 4, 0] : 0,
                y: micError
                  ? -40
                  : (!isShaking && isHovered && !isClicked ? [0, -4, 0] : 0),
              }}
              exit="out"
              transition={{
                opacity: { duration: 0.15, delay: 0.15 },
                x: isShaking
                  ? { duration: 0.5, ease: "easeInOut" }
                  : { type: "spring", stiffness: 300, damping: 20 },
                y: micError
                  ? { type: "spring", stiffness: 260, damping: 22 }
                  : (!isShaking && isHovered && !isClicked
                    ? { repeat: Infinity, duration: 2.2, ease: "easeInOut" }
                    : { type: "spring", stiffness: 300, damping: 20 }),
              }}
              className="w-[48px] h-[48px] flex m-auto items-center justify-center origin-bottom relative"
              style={{ rotateX: tiltX, rotateY: tiltY, transformPerspective: 320 }}
            >
              {/* Mic error popover */}
              <AnimatePresence>
                {micError && (
                  <motion.div
                    key="mic-error-bubble"
                    initial={{ opacity: 0, y: 6, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ type: "spring", stiffness: 320, damping: 24 }}
                    className="absolute bottom-[calc(100%+22px)] right-0 z-[110] pointer-events-none"
                    style={{ filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.13)) drop-shadow(0 2px 6px rgba(0,0,0,0.08))' }}
                  >
                    <div className="relative flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg whitespace-nowrap">
                      <MicOff size={12} className="text-[var(--color-text-faint)] flex-shrink-0" />
                      <span className="text-[12.5px] font-medium text-[var(--color-text-primary)]">
                        {micError === 'no-mic' ? 'No mic connected' :
                         micError === 'no-permission' ? 'Mic access denied' :
                         'Microphone unavailable'}
                      </span>
                    </div>
                    {/* Tail — rounded diamond pointing down at Buddy. Lives OUTSIDE
                        the rounded-lg bubble: the lisse squircle clip-path on that
                        element cuts off anything protruding past its border. */}
                    <div style={{
                      position: 'absolute',
                      bottom: -5,
                      right: 15,
                      width: 10,
                      height: 10,
                      background: 'var(--color-bg-primary)',
                      borderRight: '1px solid var(--color-border-primary)',
                      borderBottom: '1px solid var(--color-border-primary)',
                      borderRadius: 2,
                      transform: 'rotate(45deg)',
                    }} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Rendered oversized (48 x 1.4) and scaled DOWN at rest, so the
                  hover grow tops out at scale 1 — the raster is never upscaled
                  and Buddy stays crisp */}
              <motion.img
                layoutId="buddy-face"
                src={getUrl(activeExpression)}
                alt="Buddy"
                animate={{
                  scale: isClicked ? 0.893 : (micError ? 0.857 : isHovered ? 1 : 0.714),
                  opacity: isOpen ? 1 : (micError || isHovered ? 1 : 0.45)
                }}
                transition={{
                  scale: { type: "spring", stiffness: 400, damping: 20 },
                  opacity: { type: "spring", stiffness: 400, damping: 20 },
                  layout: { type: "tween", duration: 0.55, ease: [0.22, 1, 0.36, 1] },
                }}
                style={{ width: 68, height: 68, maxWidth: "none", bottom: 0, left: -10, originY: 1 }}
                className="absolute object-contain select-none"
                draggable="false"
              />
            </motion.div>
          ) : (
            <motion.div
              key="active-ui"
              initial={{ opacity: 0, filter: "blur(8px)", y: 10 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: 0.12 } }}
              transition={{ duration: 0.2, delay: 0.05 }}
              ref={contentRef}
              className="flex flex-col h-auto flex-shrink-0 overflow-hidden"
              style={{ width: activeWidth }}
            >

              <AnimatePresence mode="popLayout" initial={false}>
                {isReviewing && (!isChangesApplied || isViewingChanges) && (
                  <motion.div
                    key="panel-results"
                    initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(3px)", transition: { duration: 0.12 } }}
                    transition={{ y: { type: "spring", visualDuration: 0.4, bounce: 0.22 }, opacity: { duration: 0.2 }, filter: { duration: 0.22 } }}
                    className="flex flex-col w-full"
                  >
                    {(!isChangesApplied || isViewingChanges) && (
                      <div className={`px-3.5 pt-3 pb-3 ${hasValidHtml ? 'max-h-[55vh]' : 'max-h-[35vh]'} min-h-[40px] overflow-y-auto no-scrollbar`}>
                        {renderDiffPreview()}

                        {/* Chat replies get quiet inline actions right under the words */}
                        {!isChangesApplied && (
                          <div className="flex items-center justify-end gap-4 mt-2.5">
                            {((typeof previewText === 'object' && previewText?.conversational_reply) || (typeof previewText === 'string' && !hasError && previewText)) && (
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleApply("append", { generated_html: `<p>${typeof previewText === 'object' ? previewText.conversational_reply : previewText}</p>` })}
                                className="text-[11.5px] font-medium text-[var(--color-accent)] hover:opacity-75 transition-opacity select-none"
                              >
                                Insert
                              </button>
                            )}
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={onClose}
                              className="text-[11.5px] font-medium text-[var(--color-text-faint)] hover:text-[var(--color-text-primary)] transition-colors select-none"
                            >
                              Done
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                  </motion.div>
                )}
              </AnimatePresence>

              {/* The bar — Buddy's original prompt bar; results morph out of it */}
              <form onSubmit={handleGenerate} className={`flex relative items-center gap-2.5 p-2.5 ${isReviewing ? "border-t border-[var(--color-border-primary)]/60" : ""}`}>
                <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                  <img
                    src={getUrl(barFace)}
                    alt="Buddy"
                    className="w-5 h-5 opacity-90 object-contain select-none drop-shadow-sm"
                    draggable="false"
                  />
                </div>

                {autoLabel ? (
                  <span className="buddy-shimmer-text flex-1 text-[13.5px] font-medium select-none whitespace-nowrap overflow-hidden">{autoLabel}</span>
                ) : isChangesApplied && !showRefine ? (
                  <div className="flex-1 flex items-center gap-2 h-[20px] min-w-0">
                    <motion.span
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 18, delay: 0.1 }}
                      className="flex items-center flex-shrink-0"
                    >
                      <Check size={14} className="text-green-500" strokeWidth={2.5} />
                    </motion.span>
                    <span className="text-[13.5px] font-medium text-[var(--color-text-primary)] select-none whitespace-nowrap">Changed it</span>
                    <span className="flex-1" />
                    <span className="flex items-center gap-2.5 pr-1">
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setIsViewingChanges(!isViewingChanges)}
                        className="text-[11.5px] font-medium text-[var(--color-text-faint)] hover:text-[var(--color-text-primary)] transition-colors select-none"
                      >
                        {isViewingChanges ? "Hide" : "View"}
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={onClose}
                        className="text-[11.5px] font-medium text-[var(--color-text-faint)] hover:text-[var(--color-text-primary)] transition-colors select-none"
                      >
                        Done
                      </button>
                    </span>
                  </div>
                ) : (
                <div className="flex-1 relative h-[20px] flex items-center">
                  {/* Shadow DOM for highlighted text */}
                  <div
                    id="buddy-shadow-text"
                    className="absolute inset-0 pointer-events-none whitespace-pre text-[14px] text-[var(--color-text-primary)] overflow-hidden"
                    style={{ padding: 0, margin: 0, opacity: mentionedDocs.length > 0 ? 1 : 0 }}
                  >
                    {renderHighlightedText()}
                  </div>

                  {/* Real Input */}
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    onScroll={(e) => {
                      const shadow = document.getElementById('buddy-shadow-text');
                      if (shadow) shadow.scrollLeft = e.target.scrollLeft;
                    }}
                    placeholder={isChangesApplied ? "Tell Buddy what to change..." : isReviewing ? "Anything else?" : (selectedText === "GLOBAL_CHAT" ? "Ask Buddy anything..." : isCollapsedSelection ? "Ask for a hand with your writing..." : "Ask Buddy about this...")}
                    className="w-full h-full bg-transparent text-[14px] outline-none placeholder:text-[var(--color-text-faint)] relative z-10"
                    style={{
                      color: mentionedDocs.length > 0 ? "transparent" : "var(--color-text-primary)",
                      caretColor: "var(--color-text-primary)",
                    }}
                    onKeyDown={handleInputKeyDown}
                  />
                </div>
                )}

                {isLoading ? (
                  <Loader2 size={16} className="text-orange-500 animate-spin flex-shrink-0 mr-1" />
                ) : isChangesApplied && !showRefine && !autoLabel ? null : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 ${
                      input.trim()
                        ? 'btn-tactile-accent text-white'
                        : 'bg-[var(--color-bg-hover)] text-[var(--color-text-faint)] cursor-default'
                    }`}
                  >
                    <ArrowRight size={14} />
                  </button>
                )}

              </form>

            </motion.div>
          )}
        </AnimatePresence>
        </div>
        </div>

        {/* Mention Dropdown UI */}
        <AnimatePresence>
          {mentionQuery !== null && filteredDocs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10, transition: { duration: 0.1 } }}
              className="absolute bottom-[calc(100%+8px)] left-3 w-64 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg overflow-hidden z-[110]"
              style={{ filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.13)) drop-shadow(0 2px 6px rgba(0,0,0,0.08))" }}
            >
              <div className="max-h-[200px] overflow-y-auto py-1 no-scrollbar">
                {filteredDocs.map((doc, idx) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => insertMention(doc)}
                    className={`w-full text-left px-3 py-2 text-[13px] transition-colors ${idx === mentionIndex ? 'bg-[var(--color-bg-hover)]' : 'hover:bg-[var(--color-bg-hover)]'}`}
                  >
                    <div className="truncate font-medium text-[var(--color-text-primary)] flex items-center gap-1.5">
                      <span className="opacity-90 flex items-center justify-center w-4 text-[13px]">{doc.emoji || <File size={13} className="text-[var(--color-icon-muted)]" />}</span>
                      {doc.title}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Quick-action pills — lisse capsules floating above the bar */}
      <AnimatePresence custom={input.trim() ? "typing" : "close"}>
        {isOpen && !isReviewing && !autoLabel && !isLoading && !input.trim() && (
          <motion.div
            key="buddy-pills"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.16 } }}
            onAnimationComplete={() => { pillsShownRef.current = true; }}
            className="fixed z-[99] flex items-center justify-start gap-1.5 print:hidden"
            style={{ right: 20, bottom: 75, width: activeWidth }}
          >
            {menuOptions.map((opt, i) => {
              const Icon = opt.icon;
              const isActive = i === menuIndex && opt.enabled;
              const fromSide = !pillsShownRef.current;
              return (
                <motion.div
                  key={opt.id}
                  initial={fromSide
                    ? { opacity: 0, x: 36, y: 26, scale: 0.75, filter: "blur(4px)" }
                    : { opacity: 0, x: 0, y: 26, scale: 0.85, filter: "blur(4px)" }}
                  animate={{ opacity: opt.enabled ? 1 : 0.45, x: 0, y: 0, scale: 1, filter: "blur(0px)" }}
                  variants={{
                    // Typing: pills duck straight down behind the bar — the
                    // opening rise in reverse, no sideways drift
                    out: (reason) => reason === "typing"
                      ? { opacity: 0, y: 26, scale: 0.85, filter: "blur(3px)", transition: { duration: 0.16, ease: "easeIn", delay: i * 0.025 } }
                      : { opacity: 0, x: 24, y: 16, scale: 0.85, filter: "blur(3px)", transition: { duration: 0.15, delay: i * 0.03 } },
                  }}
                  exit="out"
                  transition={fromSide
                    ? { delay: 0.16 + (menuOptions.length - 1 - i) * 0.06, type: "spring", stiffness: 380, damping: 26, mass: 0.9 }
                    : { delay: i * 0.04, type: "spring", stiffness: 400, damping: 27, mass: 0.85 }}
                  whileTap={opt.enabled ? { scale: 0.95 } : undefined}
                >
                <div style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.10)) drop-shadow(0 1px 3px rgba(0,0,0,0.06))" }}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => opt.enabled && setMenuIndex(i)}
                    onMouseLeave={() => setMenuIndex(-1)}
                    onClick={() => runMenuOption(opt)}
                    className={`border-shape-squircle flex items-center gap-1.5 pl-2.5 pr-3 h-[30px] border text-[12px] font-medium transition-colors duration-150 select-none outline-none ${
                      isActive
                        ? "bg-[var(--color-bg-hover)] border-[var(--color-border-primary)] text-[var(--color-text-primary)]"
                        : "bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] text-[var(--color-text-muted)]"
                    } ${opt.enabled ? "" : "cursor-default"}`}
                    style={{ "--r": "9999px", "--lisse-capsule": "1" }}
                  >
                    <Icon size={13} strokeWidth={2} className={`transition-colors duration-150 ${isActive ? "text-[var(--color-text-primary)]" : "text-[var(--color-icon-muted)]"}`} />
                    {opt.label}
                  </button>
                </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
