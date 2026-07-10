import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Loader2, ArrowRight, CornerDownLeft, X, File, Check, MicOff, AudioLines, SpellCheck, Lightbulb, MessageCircle, PenLine } from "lucide-react";
import { generateAIResponse } from "../utils/gemini";

export default function BuddyWidget({ isOpen, position, onClose, onApplyText, selectedText, selectedHtml, isCollapsedSelection, fullDocumentText, onGlobalClick, docs = [], activeDocId, onLongPress, onStartLive, origin = "corner", cursorBeforeText = "", cursorAfterText = "", isDumpActive = false, micError = null, onDismissMicError = null }) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [previewText, setPreviewText] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);

  // 'menu' = the choice list Buddy opens with; 'ask' = the classic prompt box
  const [phase, setPhase] = useState("menu");
  const [menuIndex, setMenuIndex] = useState(0);
  // While a one-click action runs, this replaces the input with a shimmering status line
  const [autoLabel, setAutoLabel] = useState(null);
  
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
      setMenuIndex(0);
      setAutoLabel(null);
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
        setMenuIndex(0);
        setAutoLabel(null);
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

  const menuOptions = origin === "slash"
    ? [
        docHasWords && { id: "finish", icon: PenLine, title: "Finish thought", desc: "Buddy writes the next line or two", label: "Finishing your thought…" },
        docHasWords && { id: "suggest", icon: Lightbulb, title: "Suggest", desc: "Ideas to make this better", label: "Reading your words…" },
        { id: "ask", icon: MessageCircle, title: "Ask", desc: "Tell Buddy what you need" },
      ].filter(Boolean)
    : [
        { id: "live", icon: AudioLines, title: "Live", desc: "Talk it out — Buddy writes it up" },
        docHasWords && { id: "clean", icon: SpellCheck, title: "Clean", desc: hasSelection ? "Polish the selected text" : "Polish spelling, grammar & flow", label: "Tidying up your words…" },
        docHasWords && { id: "suggest", icon: Lightbulb, title: "Suggest", desc: hasSelection ? "Ideas for this selection" : "Ideas to make this better", label: "Reading your words…" },
        { id: "ask", icon: MessageCircle, title: "Ask", desc: "Tell Buddy anything" },
      ].filter(Boolean);

  const PRESET_PROMPTS = {
    finish: "Continue writing from exactly where my cursor is. Write the natural next sentence or two in my voice, tone, and style, continuing my train of thought. Output only the continuation — nothing else.",
    suggest: "Read this and give me 2-3 short, specific suggestions that would make the writing better. Just ideas, warmly and concretely — don't rewrite it for me.",
    clean: hasSelection
      ? "Clean up this text: fix spelling, grammar, punctuation, and awkward phrasing. Keep my meaning, tone, and formatting exactly as they are."
      : "Clean up my document: fix spelling, grammar, punctuation, and awkward phrasing throughout. Keep my meaning, tone, structure, and formatting — don't add or remove ideas.",
  };

  const runMenuOption = (opt) => {
    if (!opt) return;
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
    setAutoLabel(opt.label);
    handleGenerate(null, opt);
  };

  // Keyboard-first navigation while the menu is showing — no clicking needed
  useEffect(() => {
    if (!isOpen || phase !== "menu" || autoLabel) return;
    const onKey = (e) => {
      if (e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey)) {
        e.preventDefault(); e.stopPropagation();
        setMenuIndex((i) => (i + 1) % menuOptions.length);
      } else if (e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)) {
        e.preventDefault(); e.stopPropagation();
        setMenuIndex((i) => (i - 1 + menuOptions.length) % menuOptions.length);
      } else if (e.key === "Enter") {
        e.preventDefault(); e.stopPropagation();
        runMenuOption(menuOptions[menuIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault(); e.stopPropagation();
        onClose();
      } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // Just start typing — Buddy slides straight into Ask with your letter
        e.preventDefault(); e.stopPropagation();
        setPhase("ask");
        setInput(e.key);
        setTimeout(() => inputRef.current?.focus(), 120);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, phase, autoLabel, menuIndex, menuOptions.length, origin]);

  const handleGenerate = async (e, preset = null) => {
    e?.preventDefault();
    const promptToUse = preset ? PRESET_PROMPTS[preset.id] : input;
    if (!promptToUse?.trim() || isLoading) return;

    setIsLoading(true);

    try {
      let context = "";

      if (preset?.id === "finish") {
         context = `The user has a collapsed cursor and wants you to continue their writing from that exact point.${cursorBeforeText ? `\n\nText immediately BEFORE the cursor:\n"${cursorBeforeText}"` : ""}${cursorAfterText ? `\n\nText immediately AFTER the cursor:\n"${cursorAfterText}"` : ""}\n\nUse insert_at_cursor.`;
      } else if (preset?.id === "suggest" && origin === "slash") {
         context = `The user is working on their document and wants feedback. The full document HTML is:\n\n"${fullDocumentText}"`;
      } else if (isReviewing && previewText) {
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
                 className="editor-content w-full min-w-0 overflow-hidden text-[13.5px] leading-relaxed text-[var(--color-text-primary)] break-words whitespace-pre-wrap relative [&_p]:!my-0 [&_ul]:!my-0 [&_ol]:!my-0"
                 dangerouslySetInnerHTML={{ __html: previewText.conversational_reply.split('\n').filter(line => line.trim() !== "").map(line => `<p class="mb-2 last:mb-0">${line}</p>`).join('') }}
               />
             </div>
           )}
           
           {previewText.generated_html && (
             <div className="flex flex-col gap-2 mt-2 w-full min-w-0">
                 <div className="editor-content w-full min-w-0 overflow-hidden break-words whitespace-pre-wrap text-[13.5px] leading-relaxed relative [&_p]:!my-0 [&_ul]:!my-0 [&_ol]:!my-0">
                   {selectedText === "GLOBAL_CHAT" ? (
                     <div className="text-[11px] text-orange-500 opacity-80 font-semibold uppercase tracking-wider mb-1">
                       [ Document Rewrite ]
                     </div>
                   ) : (selectedHtml || selectedText) ? (
                     <div className="text-red-500/70 dark:text-red-400/70 line-through decoration-red-500/40 mb-1" dangerouslySetInnerHTML={{ __html: selectedHtml || selectedText }} />
                   ) : null}
                   
                   <div className="text-green-600 dark:text-green-400" dangerouslySetInnerHTML={{ __html: previewText.generated_html }} />
                 </div>
             </div>
           )}
         </div>
       );
    }
    
    // Legacy generic string injection
    return (
      <div className="flex gap-3 items-start p-1">
        <div 
          className="editor-content w-full min-w-0 overflow-hidden break-words whitespace-pre-wrap text-[13.5px] leading-relaxed text-[var(--color-text-primary)] relative [&_p]:!my-0 [&_ul]:!my-0 [&_ol]:!my-0"
          dangerouslySetInnerHTML={{ __html: (previewText || "").split('\n').filter(line => line.trim() !== "").map(line => `<p class="mb-2 last:mb-0">${line}</p>`).join('') }}
        />
      </div>
    );
  };

  const activeWidth = 380;
  const restingWidth = 48;
  const menuWidth = 252;
  const isMenuMode = isOpen && phase === "menu" && !autoLabel;
  const openWidth = isMenuMode ? menuWidth : activeWidth;
  // Buddy smiles at you while you choose (with his usual blinks)
  const menuFace = blinkState === "blink" ? "smileblink" : "smile";
  const menuGreeting = origin === "slash"
    ? "What should happen here?"
    : hasSelection ? "About that selection…" : "Hey — what are we doing?";

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
      {!isOpen && (
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
          isOpen ? 'shadow-2xl bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] overflow-hidden pointer-events-auto flex flex-col' : 'bg-transparent overflow-visible pointer-events-none'
        }`}
        style={{
          '--r': isOpen ? '12px' : '24px',
          maxHeight: isOpen ? "600px" : "auto",
          x: magnetX,
          y: magnetY,
          ...((!isOpen || isGlobal)
             ? { bottom: isOpen ? 20 : (isHovered ? 15 : -20), right: isOpen ? 20 : 30 }
             : { top: safeY, left: safeX })
        }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {!isOpen && !isDumpActive ? (
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
              className="flex flex-col h-auto overflow-hidden"
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
                  className="flex flex-col p-1.5"
                  style={{ width: menuWidth }}
                >
                  <div className="flex items-center gap-2.5 px-2.5 pt-2 pb-2.5">
                    <motion.img
                      layoutId="buddy-face"
                      src={getUrl(micError ? "error" : menuFace)}
                      alt="Buddy"
                      transition={{ layout: { type: "tween", duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
                      className="w-6 h-6 object-contain select-none drop-shadow-sm"
                      draggable="false"
                    />
                    <span className="text-[12.5px] font-medium text-[var(--color-text-muted)] select-none">
                      {menuGreeting}
                    </span>
                  </div>

                  {menuOptions.map((opt, i) => {
                    const Icon = opt.icon;
                    const isActive = i === menuIndex;
                    return (
                      <motion.button
                        key={opt.id}
                        type="button"
                        initial={{ opacity: 0, y: 7, filter: "blur(2px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ delay: 0.06 + i * 0.045, type: "spring", stiffness: 480, damping: 32 }}
                        onMouseEnter={() => setMenuIndex(i)}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => runMenuOption(opt)}
                        className="relative w-full text-left px-2.5 py-2 flex items-center gap-2.5 rounded-lg outline-none"
                      >
                        {isActive && (
                          <motion.div
                            layoutId="buddy-menu-glow"
                            className="absolute inset-0 rounded-lg bg-[var(--color-bg-hover)]"
                            transition={{ type: "spring", stiffness: 520, damping: 36 }}
                          />
                        )}
                        <Icon size={15} strokeWidth={2} className={`relative z-10 flex-shrink-0 transition-colors duration-150 ${isActive ? "text-[var(--color-accent)]" : "text-[var(--color-icon-muted)]"}`} />
                        <div className="relative z-10 flex flex-col min-w-0">
                          <span className="text-[13px] font-medium leading-tight text-[var(--color-text-primary)]">{opt.title}</span>
                          <span className="text-[11px] leading-tight text-[var(--color-text-faint)] truncate">{opt.desc}</span>
                        </div>
                        <AnimatePresence>
                          {isActive && (
                            <motion.span
                              initial={{ opacity: 0, x: -4 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -4 }}
                              transition={{ duration: 0.12 }}
                              className="relative z-10 ml-auto text-[var(--color-text-faint)]"
                            >
                              <CornerDownLeft size={12} />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    );
                  })}

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.25 }}
                    className="flex items-center justify-center gap-1.5 pt-2 pb-1 text-[10.5px] text-[var(--color-text-faint)] select-none"
                  >
                    <span>↑↓ choose</span>
                    <span className="opacity-40">·</span>
                    <span>↵ go</span>
                    <span className="opacity-40">·</span>
                    <span>or just type</span>
                  </motion.div>
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
                    {/* Render Diff if NOT Auto-Applied or if specifically Viewing Changes */}
                    {(!isChangesApplied || isViewingChanges) && (
                      <div className={`p-4 ${hasValidHtml ? 'max-h-[60vh]' : 'max-h-[35vh]'} min-h-[50px] overflow-y-auto border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]`}>
                        {renderDiffPreview()}
                      </div>
                    )}

                    <div className="flex items-center justify-between p-2 bg-[var(--color-bg-primary)] border-b border-[var(--color-border-primary)]">

                       {/* If Changes were Applied */}
                       {isChangesApplied ? (
                         <div className="flex items-center w-full justify-between">
                           <span className="text-[12.5px] font-medium text-[var(--color-text-primary)] flex items-center gap-1.5 pl-2 select-none"><Check size={14} className="text-green-500" /> Automatically changed</span>
                           <div className="flex gap-1.5">
                             <button 
                               type="button"
                               onMouseDown={(e) => e.preventDefault()}
                               onClick={() => setIsViewingChanges(!isViewingChanges)}
                               className="px-2.5 py-1.5 rounded-md text-[var(--color-text-faint)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] text-[12px] font-medium transition-colors"
                             >
                               {isViewingChanges ? "Hide changes" : "View changes"}
                             </button>
                             <button 
                               type="button"
                               onMouseDown={(e) => e.preventDefault()}
                               onClick={onClose}
                               className="px-2.5 py-1.5 rounded-md bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-primary)] text-[12px] font-medium transition-colors border border-[var(--color-border-primary)]"
                             >
                               Done
                             </button>
                           </div>
                         </div>
                       ) : (
                         /* Changes NOT Applied (e.g. conversational reply, or fallback/error) */
                         <div className="flex items-center w-full justify-between px-1">
                           <div className="flex gap-1.5">
                              {((typeof previewText === 'object' && previewText?.conversational_reply) || (typeof previewText === 'string' && !hasError && previewText)) && (
                                <button 
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => handleApply("append", { generated_html: `<p>${typeof previewText === 'object' ? previewText.conversational_reply : previewText}</p>` })}
                                  className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[#3b82f6] hover:bg-blue-50 dark:hover:bg-blue-900/20 text-[12px] font-medium transition-colors"
                                >
                                  <CornerDownLeft size={13} /> Insert
                                </button>
                              )}
                           </div>
                           <button 
                             type="button"
                             onMouseDown={(e) => e.preventDefault()}
                             onClick={onClose}
                             className="w-[26px] h-[26px] flex items-center justify-center rounded-md text-[var(--color-icon-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                             title="Dismiss"
                           >
                             <X size={15} />
                           </button>
                         </div>
                       )}
                    </div>
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
                      placeholder={isReviewing ? "Tell Buddy what to change..." : (selectedText === "GLOBAL_CHAT" ? "Ask Buddy anything..." : isCollapsedSelection ? "Ask Buddy to write..." : "Ask Buddy to edit this...")}
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
