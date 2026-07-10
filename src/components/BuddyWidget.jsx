import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Loader2, ArrowRight, File, Check, MicOff, AudioLines, SpellCheck, Lightbulb } from "lucide-react";
import { generateAIResponse } from "../utils/gemini";
import { buddyPresetPrompt, buddyPresetLabel } from "../utils/buddyPresets";

export default function BuddyWidget({ isOpen, position, onClose, onApplyText, selectedText, selectedHtml, isCollapsedSelection, fullDocumentText, onGlobalClick, docs = [], activeDocId, onLongPress, onStartLive, suppressed = false, isDumpActive = false, micError = null, onDismissMicError = null }) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [previewText, setPreviewText] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);

  // 'menu' = the choice list Buddy opens with; 'ask' = the classic prompt box
  const [phase, setPhase] = useState("menu");
  const [menuIndex, setMenuIndex] = useState(0);
  // While a one-click action runs, this replaces the input with a shimmering status line
  const [autoLabel, setAutoLabel] = useState(null);
  // After an auto-applied change, the input row becomes a slim "✓ Changed it"
  // line; typing brings the refine input back
  const [refineMode, setRefineMode] = useState(false);
  
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
  
  const [isOpeningTransition, setIsOpeningTransition] = useState(false);
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

  useEffect(() => {
    if (!isHovered || isOpen) {
      rawMagnetX.set(0);
      rawMagnetY.set(0);
    }
  }, [isHovered, isOpen]);

  const isMounted = useRef(false);
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

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    setIsOpeningTransition(true);
    const t = setTimeout(() => setIsOpeningTransition(false), 200);
    return () => clearTimeout(t);
  }, [isOpen]);

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
      setPhase("menu");
      setMenuIndex(1);
      setAutoLabel(null);
      setRefineMode(false);
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
      setExpression("idle");
    } else {
      // Safely flush heavy DOM rendering block state 400ms after closing animation begins.
      // This guarantees Buddy's internal height resets without interrupting the Framer Motion popLayout,
      // and permanently solves old text heights 'bleeding' open when you re-initiate him later!
      t = setTimeout(() => {
        setPhase("menu");
        setMenuIndex(1);
        setAutoLabel(null);
        setRefineMode(false);
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
    if (e.key === 'Escape') {
      // Empty prompt box that came from the menu? Step gently back to the menu.
      if (!input.trim() && !isReviewing && !isLoading) {
        setPhase("menu");
        setMenuIndex(0);
        inputRef.current?.blur();
      } else {
        onClose();
      }
    }
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

  // The prompt bar, split into four opaque segments (whiteboard concept):
  // [Live] [Buddy · Ask…] [Clean] [Suggest]. Ask expands into the classic bar.
  const menuOptions = [
    { id: "live", icon: AudioLines, label: "Live", desc: "Talk it out — Buddy writes it up", enabled: true },
    { id: "ask", label: "Ask", desc: "Tell Buddy anything", enabled: true },
    { id: "clean", icon: SpellCheck, label: "Clean", desc: hasSelection ? "Polish the selected text" : "Polish spelling, grammar & flow", enabled: docHasWords },
    { id: "suggest", icon: Lightbulb, label: "Suggest", desc: hasSelection ? "Ideas for this selection" : "Ideas to make this better", enabled: docHasWords },
  ];

  const runMenuOption = (opt) => {
    if (!opt || opt.enabled === false) return;
    if (opt.id === "live") {
      onClose();
      setTimeout(() => onStartLive?.(), 200);
      return;
    }
    if (opt.id === "ask") {
      setPhase("ask");
      setTimeout(() => inputRef.current?.focus(), 180);
      return;
    }
    // One-click actions: Buddy just does it
    setPhase("ask");
    setAutoLabel(buddyPresetLabel(opt.id));
    handleGenerate(null, opt);
  };

  // Step left/right through the segments, skipping disabled ones
  const stepSegment = (from, dir) => {
    let i = from;
    for (let n = 0; n < menuOptions.length; n++) {
      i = (i + dir + menuOptions.length) % menuOptions.length;
      if (menuOptions[i].enabled) return i;
    }
    return from;
  };

  // Keyboard-first navigation while the segments are showing — no clicking needed
  useEffect(() => {
    if (!isOpen || phase !== "menu" || autoLabel) return;
    const onKey = (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey)) {
        e.preventDefault(); e.stopPropagation();
        setMenuIndex((i) => stepSegment(i, 1));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)) {
        e.preventDefault(); e.stopPropagation();
        setMenuIndex((i) => stepSegment(i, -1));
      } else if (e.key === "Enter") {
        e.preventDefault(); e.stopPropagation();
        runMenuOption(menuOptions[menuIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault(); e.stopPropagation();
        onClose();
      } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // Just start typing — Ask expands with your letter already in it
        e.preventDefault(); e.stopPropagation();
        setPhase("ask");
        setInput(e.key);
        setTimeout(() => inputRef.current?.focus(), 120);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, phase, autoLabel, menuIndex, menuOptions.length, docHasWords]);

  // After an applied change, the row is just "✓ Changed it" — typing brings
  // the refine input back; Enter or Escape wraps up
  useEffect(() => {
    if (!isOpen || phase !== "ask" || autoLabel || isLoading || refineMode || !isChangesApplied) return;
    const onKey = (e) => {
      if (e.key === "Enter" || e.key === "Escape") {
        e.preventDefault(); e.stopPropagation();
        onClose();
        return;
      }
      if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault(); e.stopPropagation();
        setRefineMode(true);
        setInput(e.key);
        setTimeout(() => inputRef.current?.focus(), 80);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [isOpen, phase, autoLabel, isLoading, refineMode, isChangesApplied, onClose]);

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
          setRefineMode(false);
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
  const SEG_H = 46;
  const menuWidth = 46 * 3 + 116 + 8 * 3; // three squares + the Ask segment + gaps
  const isMenuMode = isOpen && phase === "menu" && !autoLabel;
  const openWidth = isMenuMode ? menuWidth : activeWidth;
  // Buddy smiles at you while you choose (with his usual blinks)
  const menuFace = blinkState === "blink" ? "smileblink" : "smile";

  const safeX = Math.min(Math.max(position?.x || windowSize.width / 2, 8), windowSize.width - activeWidth - 8);
  const safeY = Math.min(position?.y || 100, windowSize.height - 220); 

  const isGlobal = selectedText === "GLOBAL_CHAT";

  const widgetRef = useRef(null);

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
          }}
          onMouseLeave={() => {
            clearTimeout(longPressTimerRef.current);
            rawMagnetX.set(0);
            rawMagnetY.set(0);
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
        layout="position"
        initial={{ y: 150, width: restingWidth, height: restingWidth }}
        animate={{
          y: 0,
          width: isOpen ? openWidth : restingWidth,
          height: isOpen ? "auto" : restingWidth,
          filter: isOpeningTransition ? "blur(3px)" : "blur(0px)",
        }}
        transition={{
          type: "spring", stiffness: 350, damping: 25, mass: 0.5,
        }}
        className={`fixed z-[100] transition-colors duration-200 print:hidden border-shape-squircle ${
          isOpen && !isMenuMode ? 'shadow-2xl bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] overflow-hidden pointer-events-auto flex flex-col' : isOpen ? 'bg-transparent overflow-visible pointer-events-auto' : 'bg-transparent overflow-visible pointer-events-none'
        }`}
        style={{
          '--r': isOpen ? '12px' : '24px',
          // While the segments are out, the outer is a transparent shell — a
          // lisse clip-path here would crop the floating caption above the bar
          '--lisse-skip': isMenuMode ? '1' : '0',
          maxHeight: isOpen ? "600px" : "auto",
          x: magnetX,
          y: magnetY,
          ...((!isOpen || isGlobal)
             ? { bottom: isOpen ? 20 : (isHovered ? 15 : -20), right: isOpen ? 20 : 30 }
             : { top: safeY, left: safeX })
        }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {suppressed ? null : !isOpen && !isDumpActive ? (
            <motion.div
              layout
              key="resting-icon"
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                x: isShaking ? [-9, 9, -7, 7, -4, 4, 0] : 0,
                y: micError
                  ? -40
                  : (!isShaking && isHovered && !isClicked ? [0, -4, 0] : 0),
              }}
              exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
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

              <motion.img
                layoutId="buddy-face"
                src={getUrl(activeExpression)}
                alt="Buddy"
                animate={{
                  scale: isClicked ? 1.25 : (micError ? 1.2 : isHovered ? 1.4 : 1),
                  opacity: isOpen ? 1 : (micError || isHovered ? 1 : 0.45)
                }}
                transition={{
                  scale: { type: "spring", stiffness: 400, damping: 20 },
                  opacity: { type: "spring", stiffness: 400, damping: 20 },
                  layout: { type: "tween", duration: 0.55, ease: [0.22, 1, 0.36, 1] },
                }}
                style={{ originY: 1 }}
                className="w-full h-full object-contain select-none"
                draggable="false"
              />
            </motion.div>
          ) : (
            <motion.div
              key="active-ui"
              initial={{ opacity: 0, filter: "blur(8px)", y: 10 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className={`flex flex-col h-auto ${isMenuMode ? "overflow-visible" : "overflow-hidden"}`}
              style={{ width: openWidth }}
            >

              <AnimatePresence mode="popLayout" initial={false}>
              {isMenuMode ? (
                <motion.div
                  key="buddy-menu"
                  initial={{ opacity: 0, filter: "blur(4px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: 0.12 } }}
                  transition={{ duration: 0.16 }}
                  className="relative flex items-center justify-end gap-2"
                  style={{ width: menuWidth, height: SEG_H }}
                >
                  {menuOptions.map((opt, i) => {
                    const Icon = opt.icon;
                    const isActive = i === menuIndex;
                    return (
                      <motion.button
                        key={opt.id}
                        type="button"
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{
                          opacity: opt.enabled ? 1 : 0.4,
                          y: 0,
                          scale: isActive && opt.enabled ? 1.04 : 1,
                        }}
                        transition={{ delay: 0.05 + i * 0.045, type: "spring", stiffness: 480, damping: 30 }}
                        onMouseEnter={() => opt.enabled && setMenuIndex(i)}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => runMenuOption(opt)}
                        title={opt.enabled ? opt.label : `${opt.label} — write something first`}
                        className={`border-shape-squircle pointer-events-auto flex items-center justify-center gap-2 border shadow-lg transition-colors duration-150 outline-none ${
                          isActive && opt.enabled
                            ? "bg-[var(--color-bg-hover)] border-[var(--color-border-hover)]"
                            : "bg-[var(--color-bg-primary)] border-[var(--color-border-primary)]"
                        } ${opt.enabled ? "" : "cursor-default"}`}
                        style={{ "--r": "14px", height: SEG_H, width: opt.id === "ask" ? 116 : SEG_H }}
                      >
                        {opt.id === "ask" ? (
                          <>
                            <motion.img
                              layoutId="buddy-face"
                              src={getUrl(micError ? "error" : menuFace)}
                              alt="Buddy"
                              transition={{ layout: { type: "tween", duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
                              className="w-[19px] h-[19px] object-contain select-none drop-shadow-sm"
                              draggable="false"
                            />
                            <span className={`text-[13px] font-medium select-none transition-colors duration-150 ${isActive ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-faint)]"}`}>
                              Ask…
                            </span>
                          </>
                        ) : (
                          <Icon
                            size={17}
                            strokeWidth={2}
                            className={`transition-colors duration-150 ${isActive && opt.enabled ? "text-[var(--color-accent)]" : "text-[var(--color-icon-muted)]"}`}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </motion.div>
              ) : (
              <motion.div
                key="buddy-io"
                initial={{ opacity: 0, filter: "blur(4px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: 0.12 } }}
                transition={{ duration: 0.16 }}
                className="flex flex-col"
                style={{ width: activeWidth }}
              >

                {isReviewing && (
                  <div className="flex flex-col w-full">
                    {/* The response — floating on the glass, no boxed panel */}
                    {(!isChangesApplied || isViewingChanges) && (
                      <div className={`px-4 pt-3.5 pb-3 ${hasValidHtml ? 'max-h-[60vh]' : 'max-h-[35vh]'} min-h-[46px] overflow-y-auto no-scrollbar border-b border-[var(--color-border-primary)]/50`}>
                        {renderDiffPreview()}

                        {/* Chat replies get quiet inline actions right under the words */}
                        {!isChangesApplied && (
                          <div className="flex items-center gap-3.5 mt-3">
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
                  </div>
                )}

                {autoLabel ? (
                  <div className="flex items-center p-2.5 gap-2.5">
                    <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                      <motion.img
                        layoutId="buddy-face"
                        src={getUrl(activeExpression)}
                        alt="Buddy"
                        transition={{ layout: { type: "tween", duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
                        className="w-5 h-5 opacity-90 object-contain drop-shadow-sm"
                        draggable="false"
                      />
                    </div>
                    <span className="buddy-shimmer-text flex-1 text-[13.5px] font-medium select-none">{autoLabel}</span>
                    <Loader2 size={16} className="text-orange-500 animate-spin flex-shrink-0" />
                  </div>
                ) : isChangesApplied && !refineMode ? (
                  /* Slim confirmation: Buddy + a checkmark, nothing shouting */
                  <div className="flex items-center p-2.5 gap-2.5" style={{ minHeight: 41 }}>
                    <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                      <motion.img
                        layoutId="buddy-face"
                        src={getUrl(activeExpression)}
                        alt="Buddy"
                        transition={{ layout: { type: "tween", duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
                        className="w-5 h-5 opacity-90 object-contain drop-shadow-sm"
                        draggable="false"
                      />
                    </div>
                    <span className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-text-primary)] select-none">
                      <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 500, damping: 18, delay: 0.05 }}>
                        <Check size={13.5} className="text-green-500" strokeWidth={2.5} />
                      </motion.span>
                      Changed it
                    </span>
                    <span className="flex-1" />
                    <div className="flex items-center gap-2.5 pr-1">
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
                    </div>
                  </div>
                ) : (
                <form onSubmit={handleGenerate} className="flex relative items-center p-2.5 gap-2.5">
                  <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                    <motion.img
                      layoutId="buddy-face"
                      src={getUrl(activeExpression)}
                      alt="Buddy"
                      transition={{ layout: { type: "tween", duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
                      className="w-5 h-5 opacity-90 object-contain drop-shadow-sm"
                      draggable="false"
                    />
                  </div>
                  
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
                      placeholder={isReviewing ? "Tell Buddy what to change..." : (selectedText === "GLOBAL_CHAT" ? "Ask Buddy anything..." : isCollapsedSelection ? "Ask for a hand with your writing..." : "Ask Buddy about this...")}
                      className="w-full h-full bg-transparent text-[14px] outline-none placeholder:text-[var(--color-text-faint)] relative z-10"
                      style={{ 
                        color: mentionedDocs.length > 0 ? "transparent" : "var(--color-text-primary)", 
                        caretColor: "var(--color-text-primary)",
                      }}
                      onKeyDown={handleInputKeyDown}
                    />
                  </div>
                  
                  {isLoading ? (
                    <Loader2 size={16} className="text-orange-500 animate-spin flex-shrink-0" />
                  ) : (
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

                  {/* Mention Dropdown UI */}
                  <AnimatePresence>
                    {mentionQuery !== null && filteredDocs.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10, transition: { duration: 0.1 } }}
                        className="absolute bottom-[calc(100%+8px)] left-0 w-64 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] shadow-xl rounded-lg overflow-hidden z-[110]"
                      >
                        <div className="max-h-[200px] overflow-y-auto py-1 no-scrollbar">
                          {filteredDocs.map((doc, idx) => (
                            <button
                              key={doc.id}
                              type="button"
                              onClick={() => insertMention(doc)}
                              className={`w-full text-left px-3 py-2 text-[13px] transition-colors ${idx === mentionIndex ? 'bg-[var(--color-bg-hover)]' : 'hover:bg-[var(--color-hover)]'}`}
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
                </form>
                )}

              </motion.div>
              )}
              </AnimatePresence>

            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
