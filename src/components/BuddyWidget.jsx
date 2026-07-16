import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Loader2, ArrowRight, File, Check, MicOff, Mic, BrushCleaning, Lightbulb, Plus, Paintbrush, EyeOff, Eye, Trash2 } from "lucide-react";
import { generateAIResponse } from "../utils/gemini";
import { buddyPresetPrompt, buddyPresetLabel } from "../utils/buddyPresets";
import { getEmojiForTitle } from "../utils/emojiMap";
import EmojiPickerPanel from "./EmojiPicker";

// Skill chips wear emoji, same as pages — auto-picked from the name unless
// the user chooses one from the native picker
const FALLBACK_SKILL_EMOJI = "✨";

// Customize (hats) is parked until the real hat art arrives
const SHOW_CUSTOMIZE = false;

// The house menu tail — the same curved swoosh the ... options menu wears.
// Drawn AFTER the card at z-10 so its fill covers the card's border where
// they meet: tail and menu read as one shape.
function MenuTail({ direction = "up", side = "right", offset = 14 }) {
  const flip = direction === "down";
  return (
    <svg
      className="absolute z-10 pointer-events-none"
      style={{ [flip ? "bottom" : "top"]: -9, [side]: offset }}
      width="20" height="10" viewBox="0 0 20 10" fill="none"
    >
      <path
        d={flip ? "M0,0 C4,0 7,10 10,10 C13,10 16,0 20,0 Z" : "M0,10 C4,10 7,0 10,0 C13,0 16,10 20,10 Z"}
        fill="var(--color-bg-primary)"
      />
      <path
        d={flip ? "M0,0 C4,0 7,10 10,10 C13,10 16,0 20,0" : "M0,10 C4,10 7,0 10,0 C13,0 16,10 20,10"}
        fill="none" stroke="var(--color-border-primary)" strokeWidth="1"
      />
    </svg>
  );
}

// Placeholder hat shapes — stand-ins until Julian's PNGs arrive
const BUDDY_HATS = [
  { id: "party", label: "Party" },
  { id: "top", label: "Top hat" },
  { id: "beanie", label: "Beanie" },
  { id: "bow", label: "Bow" },
];

function BuddyHat({ hat, size = 22 }) {
  const ink = "var(--color-text-primary)";
  const accent = "var(--color-accent)";
  if (hat === "party") {
    return (
      <svg width={size} height={size * 0.9} viewBox="0 0 24 22">
        <polygon points="12,3 19,21 5,21" fill={accent} />
        <circle cx="12" cy="3" r="2.6" fill={ink} />
      </svg>
    );
  }
  if (hat === "top") {
    return (
      <svg width={size} height={size * 0.82} viewBox="0 0 24 20">
        <rect x="6.5" y="1" width="11" height="14" rx="1.5" fill={ink} />
        <rect x="2" y="14.5" width="20" height="3.5" rx="1.75" fill={ink} />
      </svg>
    );
  }
  if (hat === "beanie") {
    return (
      <svg width={size} height={size * 0.82} viewBox="0 0 24 20">
        <circle cx="12" cy="3.4" r="2.4" fill={ink} />
        <path d="M3 17 A 9 8.4 0 0 1 21 17 Z" fill={accent} />
        <rect x="3" y="15.4" width="18" height="3.4" rx="1.7" fill={ink} />
      </svg>
    );
  }
  if (hat === "bow") {
    return (
      <svg width={size} height={size * 0.66} viewBox="0 0 24 16">
        <polygon points="2,2 10.5,8 2,14" fill={accent} />
        <polygon points="22,2 13.5,8 22,14" fill={accent} />
        <circle cx="12" cy="8" r="2.6" fill={ink} />
      </svg>
    );
  }
  return null;
}

export default function BuddyWidget({ isOpen, position, onClose, onApplyText, selectedText, selectedHtml, isCollapsedSelection, fullDocumentText, onGlobalClick, docs = [], activeDocId, onLongPress, onStartLive, suppressed = false, isDumpActive = false, micError = null, onDismissMicError = null, customSkills = [], buddyHat = null, buddyHidden = false, onUpdateBuddyPrefs = null }) {
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
  // Depth cue for the scrolling chip row: chips nearing the container edge
  // fade and shrink, like the /buddy rolling list. id → 0..1 (1 = fully in)
  const [chipDepth, setChipDepth] = useState({});
  const chipDepthRef = useRef({});
  const chipElsRef = useRef({});

  const measureChipDepth = () => {
    const cont = pillsRef.current;
    if (!cont) return;
    const cr = cont.getBoundingClientRect();
    const next = {};
    for (const [id, el] of Object.entries(chipElsRef.current)) {
      if (!el || !el.isConnected) continue;
      const r = el.getBoundingClientRect();
      // Asymmetric depth: chips exit LEFT as you scroll right through the row
      // (scrolled-past — they should dissolve away completely, matching the
      // house "gone, not clipped" illusion) while chips are still arriving on
      // the RIGHT (not yet scrolled to — a partial fade there is a "there's
      // more, keep scrolling" affordance, so they never go fully invisible).
      // The 48px padding runway gives room for both curves to resolve.
      const leftGap = r.left - cr.left;
      const rightGap = cr.right - r.right;
      const leftDepth = Math.max(0, Math.min(1, (leftGap - 16) / 32));
      const RIGHT_FLOOR = 0.4;
      const rightDepth = RIGHT_FLOOR + (1 - RIGHT_FLOOR) * Math.max(0, Math.min(1, rightGap / 40));
      next[id] = Math.min(leftDepth, rightDepth);
    }
    const prev = chipDepthRef.current;
    const ids = Object.keys(next);
    const changed = ids.length !== Object.keys(prev).length || ids.some((k) => Math.abs((prev[k] ?? -1) - next[k]) > 0.01);
    if (changed) {
      chipDepthRef.current = next;
      setChipDepth(next);
    }
  };
  
  const [expression, setExpression] = useState("idle");
  const [isHovered, setIsHovered] = useState(false);
  const [isHoverSequenceComplete, setIsHoverSequenceComplete] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionedDocs, setMentionedDocs] = useState([]);

  const inputRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const isLongPressRef = useRef(false);
  const micErrorDismissReadyRef = useRef(false);

  // Right-click menu under resting Buddy: 'menu' | 'customize' | 'unhide'
  const [ctxMenu, setCtxMenu] = useState(null);
  const ctxMenuRef = useRef(null);
  // Right-click menu on a custom chip: { skillId, x, y }
  const [chipMenu, setChipMenu] = useState(null);
  const chipMenuRef = useRef(null);
  // "New Skill" creation form state
  const [isCreatingSkill, setIsCreatingSkill] = useState(false);
  const [skillName, setSkillName] = useState("");
  const [skillPrompt, setSkillPrompt] = useState("");
  // null = auto-picked from the name; set = user chose one in the picker
  const [skillCustomEmoji, setSkillCustomEmoji] = useState(null);
  const [skillPickerOpen, setSkillPickerOpen] = useState(false);
  const skillPickerWrapRef = useRef(null);
  const skillNameRef = useRef(null);
  const pendingCreateSkillRef = useRef(false);
  // Hide Buddy: hovering the red row makes him sad and trembly; clicking it
  // dissolves him (blur + shrink + fade) before the pref flips
  const [hideHovered, setHideHovered] = useState(false);
  const [isHiding, setIsHiding] = useState(false);

  const skillEmoji = skillCustomEmoji || getEmojiForTitle(skillName) || FALLBACK_SKILL_EMOJI;
  
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

  const shouldBackgroundBlink = isOpen || (isHovered && isHoverSequenceComplete) || ctxMenu === "menu" || ctxMenu === "customize";

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
    const expressions = ["", "blink", "smile", "smilebetween", "smileblink", "click", "error", "sad"];
    expressions.forEach(key => {
      const img = new Image();
      img.src = `/buddy expressions/buddy${isDark ? 'dark' : 'light'}${key}.png`;
    });
  }, [isDark]);

  useEffect(() => {
    let t;
    if (isOpen) {
      setMenuIndex(-1);
      setAutoLabel(null);
      setShowRefine(false);
      setInput("");
      setCtxMenu(null);
      if (pendingCreateSkillRef.current) {
        // "New Skill" chosen from the right-click menu — open straight into the form
        pendingCreateSkillRef.current = false;
        setIsCreatingSkill(true);
        setTimeout(() => skillNameRef.current?.focus(), 350);
      } else {
        setIsCreatingSkill(false);
      }
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

  // Hovering above his right-click menu, Buddy smiles. In the hats menu he
  // wears his normal face — a fitting-room mirror, not a grin.
  if (!hasError && !micError && !isOpen && ctxMenu === "menu") {
     activeExpression = blinkState === "blink" ? "smileblink" : "smile";
  }
  if (!hasError && !micError && !isOpen && ctxMenu === "customize") {
     activeExpression = blinkState === "blink" ? "blink" : "idle";
  }

  // ...unless the cursor is on Hide Buddy — then he's sad (and stays sad
  // while he dissolves)
  if (!hasError && !micError && !isOpen && ((ctxMenu === "menu" && hideHovered) || isHiding)) {
     activeExpression = "sad";
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

  // Quick-action pills that float above the bar: the built-in three, the
  // user's own skills, then the + chip that mints a new one
  const menuOptions = [
    { id: "live", icon: Mic, label: "Live", enabled: true },
    { id: "clean", icon: BrushCleaning, label: "Clean", enabled: docHasWords },
    { id: "suggest", icon: Lightbulb, label: "Suggest", enabled: docHasWords },
    ...(customSkills || []).map((s) => ({
      id: `skill:${s.id}`,
      skillId: s.id,
      emoji: s.icon || FALLBACK_SKILL_EMOJI,
      label: s.name,
      prompt: s.prompt,
      enabled: docHasWords,
      custom: true,
    })),
    { id: "add", icon: Plus, label: "", enabled: true, isAdd: true },
  ];

  const runMenuOption = (opt) => {
    if (!opt || opt.enabled === false) return;
    if (opt.id === "live") {
      onClose();
      setTimeout(() => onStartLive?.(), 200);
      return;
    }
    if (opt.id === "add") {
      setIsCreatingSkill(true);
      setTimeout(() => skillNameRef.current?.focus(), 250);
      return;
    }
    // One-click actions: Buddy just does it
    setAutoLabel(opt.custom ? `${opt.label}…` : buddyPresetLabel(opt.id));
    handleGenerate(null, opt);
  };

  // Buddy applies his own suggestions to the document instead of pasting
  // the reply text in
  const applySuggestions = () => {
    setAutoLabel(buddyPresetLabel("apply"));
    handleGenerate(null, { id: "apply" });
  };

  const createSkill = () => {
    const name = skillName.trim();
    const prompt = skillPrompt.trim();
    if (!name || !prompt || !onUpdateBuddyPrefs) return;
    onUpdateBuddyPrefs({
      skills: [...(customSkills || []), { id: Math.random().toString(36).slice(2, 9), name, prompt, icon: skillEmoji }],
    });
    setIsCreatingSkill(false);
    setSkillName("");
    setSkillPrompt("");
    setSkillCustomEmoji(null);
    setSkillPickerOpen(false);
    setTimeout(() => inputRef.current?.focus(), 250);
  };

  const cancelSkill = () => {
    setIsCreatingSkill(false);
    setSkillName("");
    setSkillPrompt("");
    setSkillCustomEmoji(null);
    setSkillPickerOpen(false);
    setTimeout(() => inputRef.current?.focus(), 250);
  };

  const hideBuddy = () => {
    setCtxMenu(null);
    setHideHovered(false);
    setIsHiding(true);
    setTimeout(() => {
      setIsHiding(false);
      onUpdateBuddyPrefs?.({ hidden: true });
    }, 480);
  };

  const deleteSkill = (skillId) => {
    if (!onUpdateBuddyPrefs) return;
    onUpdateBuddyPrefs({ skills: (customSkills || []).filter((s) => s.id !== skillId) });
    setChipMenu(null);
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
        if (skillPickerOpen) { setSkillPickerOpen(false); }
        else if (isCreatingSkill) { cancelSkill(); }
        else { onClose(); }
        return;
      }
      if (isCreatingSkill) return; // the form's inputs own the rest of the keys
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
  }, [isOpen, autoLabel, isLoading, isReviewing, isCreatingSkill, skillPickerOpen, input, menuIndex, mentionQuery, menuOptions.length, docHasWords]);

  // Re-measure chip depth whenever the row (re)appears or the set changes;
  // the second pass runs after the entrance animation has settled
  useEffect(() => {
    if (!isOpen || isReviewing || autoLabel || isLoading || isCreatingSkill || input.trim()) return;
    const t1 = setTimeout(measureChipDepth, 60);
    const t2 = setTimeout(measureChipDepth, 800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isOpen, isReviewing, autoLabel, isLoading, isCreatingSkill, input, customSkills.length]);

  // The skill emoji picker closes on any click outside it
  useEffect(() => {
    if (!skillPickerOpen) return;
    const onDown = (e) => {
      if (e.target.closest?.("[data-skill-icon-btn]")) return; // the button toggles itself
      if (skillPickerWrapRef.current && !skillPickerWrapRef.current.contains(e.target)) {
        setSkillPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [skillPickerOpen]);

  const handleGenerate = async (e, preset = null) => {
    e?.preventDefault();
    const promptToUse = preset ? (preset.prompt || buddyPresetPrompt(preset.id, hasSelection)) : input;
    if (!promptToUse?.trim() || isLoading) return;

    setIsLoading(true);

    try {
      let context = "";

      if (preset?.id === "apply") {
          const prevReply = typeof previewText === 'object'
              ? (previewText?.conversational_reply || "")
              : (previewText || "");
          context = `You previously reviewed the user's document and replied with these suggestions:\n\n"${prevReply}"\n\nThe full document HTML is:\n\n"${fullDocumentText}"\n\nApply those suggestions to the document now. Use replace_document and return the complete updated document HTML.`;
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

  const hasValidHtml = typeof previewText === 'object' && previewText !== null &&
    typeof previewText?.generated_html === 'string' &&
    previewText.generated_html.replace(/<[^>]+>/g, '').trim() !== "";

  // Replies may carry light structure (<h3> section headings, lists) — render
  // them as HTML; plain text still gets wrapped line by line
  const renderReplyHtml = (text) => {
    const t = (text || "").trim();
    if (/<\/?(h[1-6]|p|ul|ol|li|blockquote)\b/i.test(t)) return { html: t.replace(/>\s*\n+\s*</g, "><"), isHtml: true };
    return { html: t.split('\n').filter(line => line.trim() !== "").map(line => `<p class="mb-2 last:mb-0">${line}</p>`).join(''), isHtml: false };
  };

  const renderDiffPreview = () => {
    if (typeof previewText === 'object' && previewText !== null) {
       const reply = renderReplyHtml(previewText.conversational_reply);
       return (
         <div className="flex flex-col gap-3">
           {previewText.conversational_reply && (
             <div className="flex gap-3 items-start p-1">
               <div
                 className={`editor-content buddy-reply !pb-0 w-full min-w-0 overflow-hidden text-[13.5px] leading-relaxed text-[var(--color-text-primary)] break-words relative [&_p]:!my-0 [&_ul]:!my-0 [&_ol]:!my-0 ${reply.isHtml ? "" : "whitespace-pre-wrap"}`}
                 dangerouslySetInnerHTML={{ __html: reply.html }}
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


  const widgetRef = useRef(null);
  const pillsRef = useRef(null);
  const contentRef = useRef(null);
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
      // The pills live OUTSIDE widgetRef (fixed sibling layer) — clicking one
      // must not read as an outside click, or the chip dismisses Buddy before
      // its action ever runs
      if (pillsRef.current && pillsRef.current.contains(e.target)) return;
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

  // Right-click menus close on outside click or Escape
  useEffect(() => {
    if (!ctxMenu && !chipMenu) return;
    const onDown = (e) => {
      if (ctxMenuRef.current && ctxMenuRef.current.contains(e.target)) return;
      if (chipMenuRef.current && chipMenuRef.current.contains(e.target)) return;
      setCtxMenu(null);
      setChipMenu(null);
    };
    const onKey = (e) => {
      if (e.key === "Escape") { setCtxMenu(null); setChipMenu(null); }
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [ctxMenu, chipMenu]);

  // While hidden, a right-click in Buddy's old corner brings up "Show Buddy"
  useEffect(() => {
    if (!buddyHidden) return;
    const onCtx = (e) => {
      if (window.innerWidth - e.clientX < 150 && window.innerHeight - e.clientY < 150) {
        e.preventDefault();
        setCtxMenu("unhide");
      }
    };
    document.addEventListener("contextmenu", onCtx);
    return () => document.removeEventListener("contextmenu", onCtx);
  }, [buddyHidden]);

  // House menu item — same dress code as the slash & context menus
  const ctxItemCls = "w-full text-left px-2.5 py-1.5 rounded flex items-center gap-2.5 text-[13px] text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-hover)] select-none";

  // Hidden: nothing renders except the corner's "Show Buddy" right-click menu
  if (buddyHidden) {
    return (
      <AnimatePresence>
        {ctxMenu === "unhide" && (
          <motion.div
            key="buddy-unhide-menu"
            ref={ctxMenuRef}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="fixed z-[130] print:hidden"
            style={{ right: 20, bottom: 34 }}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="relative">
              <div className="relative bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg shadow-xl py-1 px-1 w-44">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setCtxMenu(null);
                    onUpdateBuddyPrefs?.({ hidden: false });
                  }}
                  className={ctxItemCls}
                >
                  <Eye size={14} className="text-[var(--color-icon-muted)]" />
                  Show Buddy
                </button>
              </div>
              {/* Tail — pointing down at Buddy's old resting spot */}
              <MenuTail direction="down" side="right" offset={14} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <>

      {/* Invisible fixed hitbox block */}
      {!isOpen && !suppressed && !isHiding && (
        <div
          className="fixed z-[99] cursor-pointer print:hidden"
          style={{
            width: restingWidth + 40,
            height: restingWidth + 40,
            bottom: 0,
            right: 15,
            pointerEvents: ctxMenu ? "none" : undefined,
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            if (micError) return;
            clearTimeout(longPressTimerRef.current);
            setIsClicked(false);
            setIsHovered(false);
            rawMagnetX.set(0);
            rawMagnetY.set(0);
            rawTiltX.set(0);
            rawTiltY.set(0);
            setCtxMenu("menu");
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
        initial={{ y: 150, width: restingWidth, height: restingWidth, bottom: -20, right: 30 }}
        animate={{
          y: 0,
          width: isOpen ? activeWidth : restingWidth,
          height: isOpen ? (contentH ? contentH + 2 : "auto") : restingWidth,
          // While his right-click menu is up, Buddy rises and hovers above it;
          // he dissolves in place if Hide Buddy is chosen
          bottom: isOpen ? 20 : (ctxMenu === "customize" ? 175 : (ctxMenu === "menu" || isHiding) ? (SHOW_CUSTOMIZE ? 150 : 122) : (isHovered ? 15 : -20)),
          right: isOpen ? 20 : 30,
        }}
        transition={{
          type: "spring", stiffness: 350, damping: 25, mass: 0.5,
        }}
        className={`fixed z-[100] print:hidden ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        style={{
          maxHeight: isOpen ? "600px" : "auto",
          x: magnetX,
          y: magnetY,
        }}
      >
        {/* drop-shadow follows the lisse clip-path, unlike box-shadow which it would crop */}
        <div
          className="w-full h-full"
          style={{
            filter: isOpen ? 'drop-shadow(0 8px 20px rgba(0,0,0,0.13)) drop-shadow(0 2px 6px rgba(0,0,0,0.08))' : 'none',
            transition: 'filter 0.35s ease',
          }}
        >
        <div
          className={`w-full h-full border-shape-squircle transition-colors duration-200 ${
            isOpen ? 'bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] overflow-hidden flex flex-col justify-end' : 'bg-transparent overflow-visible'
          }`}
          style={{ '--r': isOpen ? '14px' : '24px' }}
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
                opacity: isHiding ? 0 : 1,
                scale: isHiding ? 0.3 : 1,
                filter: isHiding ? "blur(10px)" : "blur(0px)",
                x: isShaking ? [-9, 9, -7, 7, -4, 4, 0] : 0,
                // Scared of Hide Buddy: iOS-icon wiggle — a quick rotation
                // oscillation, not a positional shake
                rotate: hideHovered && ctxMenu === "menu" ? [-2.2, 2.2] : 0,
                y: micError
                  ? -40
                  : (!isShaking && isHovered && !isClicked ? [0, -4, 0] : 0),
              }}
              exit="out"
              transition={{
                opacity: isHiding ? { duration: 0.4, ease: "easeIn" } : { duration: 0.15, delay: 0.15 },
                scale: isHiding ? { duration: 0.45, ease: [0.4, 0, 1, 1] } : { type: "spring", stiffness: 300, damping: 20 },
                filter: { duration: 0.4, ease: "easeIn" },
                x: isShaking
                  ? { duration: 0.5, ease: "easeInOut" }
                  : { type: "spring", stiffness: 300, damping: 20 },
                rotate: hideHovered && ctxMenu === "menu"
                  ? { repeat: Infinity, repeatType: "mirror", duration: 0.13, ease: "easeInOut" }
                  : { type: "spring", stiffness: 300, damping: 20 },
                y: micError
                  ? { type: "spring", stiffness: 260, damping: 22 }
                  : (!isShaking && isHovered && !isClicked
                    ? { repeat: Infinity, duration: 2.2, ease: "easeInOut" }
                    : { type: "spring", stiffness: 300, damping: 20 }),
              }}
              className="w-[48px] h-[48px] flex m-auto items-end justify-center origin-bottom relative"
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
                    <MenuTail direction="down" side="right" offset={12} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Hat — placeholder shapes riding Buddy's tilt and bounce */}
              <AnimatePresence>
                {buddyHat && (
                  <motion.div
                    key={`hat-${buddyHat}`}
                    className="absolute pointer-events-none z-10"
                    style={{ top: 0, left: "50%" }}
                    initial={{ opacity: 0, x: "-50%", y: -4, rotate: -8, scale: 0.6 }}
                    animate={{
                      opacity: isOpen ? 1 : (micError || isHovered || ctxMenu ? 1 : 0.45),
                      x: "-50%",
                      y: (isHovered && !isClicked) || ctxMenu === "customize" ? -30 : -13,
                      rotate: -8,
                      scale: isHovered || ctxMenu === "customize" ? 1.15 : 1,
                    }}
                    exit={{ opacity: 0, y: -20, scale: 0.6, transition: { duration: 0.15 } }}
                    transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  >
                    <BuddyHat hat={buddyHat} />
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
                  width: isClicked ? 60 : (micError ? 58 : (isHovered || ctxMenu === "customize") ? 68 : 48),
                  height: isClicked ? 60 : (micError ? 58 : (isHovered || ctxMenu === "customize") ? 68 : 48),
                  opacity: isOpen ? 1 : (micError || isHovered || ctxMenu ? 1 : 0.45)
                }}
                transition={{
                  width: { type: "spring", stiffness: 400, damping: 20 },
                  height: { type: "spring", stiffness: 400, damping: 20 },
                  opacity: { type: "spring", stiffness: 400, damping: 20 },
                  layout: { type: "tween", duration: 0.55, ease: [0.22, 1, 0.36, 1] },
                }}
                style={{ width: 48, height: 48, maxWidth: "none" }}
                className="object-contain select-none flex-shrink-0"
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
              ref={contentRef}
              className="flex flex-col h-auto flex-shrink-0 overflow-hidden"
              style={{ width: activeWidth }}
            >

              <AnimatePresence mode="popLayout" initial={false}>
                {isCreatingSkill && (
                  <motion.div
                    key="skill-form"
                    initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(3px)", transition: { duration: 0.12 } }}
                    transition={{ y: { type: "spring", stiffness: 440, damping: 32, mass: 0.85 }, opacity: { duration: 0.2 }, filter: { duration: 0.22 } }}
                    className="flex flex-col gap-2 px-3.5 pt-3 pb-3 w-full"
                  >
                    {/* Icon + name, like a page: the emoji auto-picks from the
                        name; clicking it opens the native picker to override */}
                    <div className="flex items-center gap-1.5">
                      <motion.button
                        key={skillEmoji}
                        type="button"
                        initial={{ scale: 0.7, opacity: 0.5 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 24 }}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setSkillPickerOpen((v) => !v)}
                        data-skill-icon-btn
                        title="Change icon"
                        className={`w-9 h-9 rounded-md flex items-center justify-center text-[20px] leading-none flex-shrink-0 transition-colors select-none ${skillPickerOpen ? "bg-[var(--color-bg-hover)]" : "hover:bg-[var(--color-bg-hover)]"}`}
                      >
                        {skillEmoji}
                      </motion.button>
                      <input
                        ref={skillNameRef}
                        type="text"
                        value={skillName}
                        onChange={(e) => setSkillName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.target.closest(".flex-col").querySelector("textarea")?.focus(); } }}
                        placeholder="Skill name"
                        maxLength={24}
                        className="flex-1 min-w-0 bg-transparent outline-none text-[15px] font-semibold text-[var(--color-text-primary)] placeholder:text-[var(--color-text-faint)] placeholder:font-medium"
                      />
                    </div>
                    <textarea
                      value={skillPrompt}
                      onChange={(e) => setSkillPrompt(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); createSkill(); } }}
                      rows={3}
                      placeholder="What should Buddy do? e.g. Make my writing warmer and more direct."
                      className="w-full bg-[var(--color-bg-hover)] rounded-md px-2.5 py-1.5 text-[13px] leading-relaxed text-[var(--color-text-primary)] placeholder:text-[var(--color-text-faint)] outline-none border border-transparent focus:border-[var(--color-border-primary)] transition-colors resize-none no-scrollbar"
                    />

                    <div className="flex items-center justify-end gap-3 mt-0.5">
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={cancelSkill}
                        className="text-[11.5px] font-medium text-[var(--color-text-faint)] hover:text-[var(--color-text-primary)] transition-colors select-none"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={createSkill}
                        disabled={!skillName.trim() || !skillPrompt.trim()}
                        className={`px-3 h-7 rounded-md text-[12px] font-medium transition-all duration-150 select-none ${
                          skillName.trim() && skillPrompt.trim()
                            ? "btn-tactile-accent text-white"
                            : "bg-[var(--color-bg-hover)] text-[var(--color-text-faint)] cursor-default"
                        }`}
                      >
                        Create Skill
                      </button>
                    </div>
                  </motion.div>
                )}

                {!isCreatingSkill && isReviewing && (!isChangesApplied || isViewingChanges) && (
                  <motion.div
                    key="panel-results"
                    initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(3px)", transition: { duration: 0.12 } }}
                    transition={{ y: { type: "spring", stiffness: 440, damping: 32, mass: 0.85 }, opacity: { duration: 0.2 }, filter: { duration: 0.22 } }}
                    className="flex flex-col w-full"
                  >
                    {(!isChangesApplied || isViewingChanges) && (
                      <div className={`px-3.5 pt-3 pb-3 ${hasValidHtml ? 'max-h-[55vh]' : 'max-h-[35vh]'} min-h-[40px] overflow-y-auto no-scrollbar`}>
                        {renderDiffPreview()}

                        {/* Chat replies get quiet inline actions right under the words */}
                        {!isChangesApplied && (
                          <div className="flex items-center justify-end gap-4 mt-2.5">
                            {docHasWords && !hasError && ((typeof previewText === 'object' && previewText?.conversational_reply) || (typeof previewText === 'string' && previewText)) && (
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={applySuggestions}
                                className="text-[11.5px] font-medium text-[var(--color-accent)] hover:opacity-75 transition-opacity select-none"
                              >
                                Apply changes
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
              {/* min-h keeps the bar's height steady when the send button or
                  loader swaps out — without it the bar shrinks a few px */}
              {!isCreatingSkill && (
              <form onSubmit={handleGenerate} className={`flex relative items-center gap-2.5 p-2.5 min-h-[48px] ${isReviewing ? "border-t border-[var(--color-border-primary)]/60" : ""}`}>
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
              )}

            </motion.div>
          )}
        </AnimatePresence>
        </div>
        </div>

        {/* Skill icon picker — the app's native emoji picker, floated above
            the widget card (the card clips its own overflow) */}
        <AnimatePresence>
          {isCreatingSkill && skillPickerOpen && (
            <motion.div
              key="skill-emoji-picker"
              ref={skillPickerWrapRef}
              initial={{ opacity: 0, scale: 0.95, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 6 }}
              transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-[calc(100%+10px)] left-3 z-[140]"
              style={{ transformOrigin: "bottom left" }}
            >
              <EmojiPickerPanel
                hasEmoji={!!skillCustomEmoji}
                onSelect={(emoji) => {
                  setSkillCustomEmoji(emoji);
                  setSkillPickerOpen(false);
                }}
                onRemove={() => {
                  setSkillCustomEmoji(null);
                  setSkillPickerOpen(false);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mention Dropdown UI — same dress code as the slash & context menus */}
        <AnimatePresence>
          {mentionQuery !== null && filteredDocs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10, transition: { duration: 0.1 } }}
              className="absolute bottom-[calc(100%+10px)] left-3 z-[110]"
            >
              <div className="relative">
                <div className="relative bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg shadow-xl py-1 px-1 w-56 max-h-72 overflow-y-auto no-scrollbar">
                  {filteredDocs.map((doc, idx) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => insertMention(doc)}
                      onMouseEnter={() => setMentionIndex(idx)}
                      className={`w-full text-left px-2.5 py-1.5 rounded flex items-center gap-2.5 text-[13px] text-[var(--color-text-primary)] transition-colors ${idx === mentionIndex ? "bg-[var(--color-bg-hover)]" : "hover:bg-[var(--color-bg-hover)]"}`}
                    >
                      <span className="flex items-center justify-center w-4 text-[13px] opacity-90 flex-shrink-0">
                        {doc.emoji || <File size={14} className="text-[var(--color-icon-muted)]" />}
                      </span>
                      <span className="font-medium leading-tight truncate">{doc.title}</span>
                    </button>
                  ))}
                </div>
                <MenuTail direction="down" side="left" offset={14} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Quick-action pills — lisse capsules floating above the bar. When a
          chip is clicked (autoLabel/loading) the pills duck down behind the
          bar like they do on typing — Buddy is working, not dismissing */}
      <AnimatePresence custom={(input.trim() || autoLabel || isLoading || isReviewing || isCreatingSkill) ? "typing" : "close"}>
        {isOpen && !isReviewing && !autoLabel && !isLoading && !isCreatingSkill && !input.trim() && (
          <motion.div
            key="buddy-pills"
            ref={pillsRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.16 } }}
            onAnimationComplete={(definition) => {
              // exits complete too — only the entrance (opacity: 1) counts
              if (definition && definition.opacity === 1) pillsShownRef.current = true;
            }}
            onScroll={() => requestAnimationFrame(measureChipDepth)}
            className="fixed z-[99] flex items-center justify-start gap-1.5 print:hidden no-scrollbar"
            style={{
              // One row that scrolls sideways — chips never stack. 48px of
              // side padding is the fade runway: scrolled chips reach full
              // transparency before the clip edge, so they dissolve instead
              // of getting sliced. Position compensates so the chips' rest
              // slots line up with the bar exactly as before; 10px above and
              // below keeps drop-shadows inside the scroll box.
              right: -28, bottom: 65, width: activeWidth + 96,
              overflowX: "auto", overflowY: "hidden", padding: "10px 48px",
            }}
          >
            {menuOptions.map((opt, i) => {
              const Icon = opt.icon;
              const isActive = i === menuIndex && opt.enabled;
              const fromSide = !pillsShownRef.current;
              const depth = chipDepth[opt.id] ?? 1;
              return (
                <motion.div
                  key={opt.id}
                  ref={(el) => { chipElsRef.current[opt.id] = el; }}
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
                  className="flex-shrink-0"
                >
                <div
                  style={{
                    filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.10)) drop-shadow(0 1px 3px rgba(0,0,0,0.06))",
                    // Depth: chips receding past the container edge fade to
                    // nothing and shrink — the /buddy rolling-list treatment
                    opacity: depth,
                    transform: `scale(${0.75 + 0.25 * depth})`,
                    transition: "opacity 0.12s linear, transform 0.12s linear",
                  }}
                >
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => opt.enabled && setMenuIndex(i)}
                    onMouseLeave={() => setMenuIndex(-1)}
                    onClick={() => runMenuOption(opt)}
                    onContextMenu={(e) => {
                      if (!opt.custom) return;
                      e.preventDefault();
                      setChipMenu({ skillId: opt.skillId, x: e.clientX, y: e.clientY });
                    }}
                    className={`border-shape-squircle flex items-center h-[30px] border text-[12px] font-medium whitespace-nowrap transition-colors duration-150 select-none outline-none ${
                      opt.isAdd ? "w-[30px] justify-center p-0" : "gap-1.5 pl-2.5 pr-3"
                    } ${
                      isActive
                        ? "bg-[var(--color-bg-hover)] border-[var(--color-border-primary)] text-[var(--color-text-primary)]"
                        : "bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] text-[var(--color-text-muted)]"
                    } ${opt.enabled ? "" : "cursor-default"}`}
                    style={{ "--r": "9999px", "--lisse-capsule": "1" }}
                  >
                    {opt.emoji ? (
                      <span className="text-[13px] leading-none select-none">{opt.emoji}</span>
                    ) : (
                      <Icon size={13} strokeWidth={2} className={`transition-colors duration-150 ${isActive ? "text-[var(--color-text-primary)]" : "text-[var(--color-icon-muted)]"}`} />
                    )}
                    {opt.label}
                  </button>
                </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right-click menu — Buddy rises and hovers above it, tail pointing up at him */}
      <AnimatePresence>
        {(ctxMenu === "menu" || ctxMenu === "customize") && !isOpen && (
          <motion.div
            key="buddy-ctx-menu"
            ref={ctxMenuRef}
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98, transition: { duration: 0.12 } }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="fixed z-[130] print:hidden"
            style={{ right: 20, bottom: 16 }}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="relative">
              <div className="relative bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg shadow-xl py-1 px-1 w-44">
                {ctxMenu === "menu" ? (
                  <>
                    {/* Customize (hats) is parked for now — flip SHOW_CUSTOMIZE
                        when the real hat art lands */}
                    {SHOW_CUSTOMIZE && (
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setCtxMenu("customize")}
                        className={ctxItemCls}
                      >
                        <Paintbrush size={14} className="text-[var(--color-icon-muted)]" />
                        Customize
                      </button>
                    )}
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setCtxMenu(null);
                        pendingCreateSkillRef.current = true;
                        onGlobalClick?.();
                      }}
                      className={ctxItemCls}
                    >
                      <Plus size={14} className="text-[var(--color-icon-muted)]" />
                      New Skill
                    </button>
                    <div className="h-px bg-[var(--color-border-primary)] my-1.5 mx-1" />
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setHideHovered(true)}
                      onMouseLeave={() => setHideHovered(false)}
                      onClick={hideBuddy}
                      className="w-full text-left px-2.5 py-1.5 rounded flex items-center gap-2.5 text-[13px] text-red-500 transition-colors hover:bg-[var(--color-bg-hover)] select-none"
                    >
                      <EyeOff size={14} />
                      Hide Buddy
                    </button>
                  </>
                ) : (
                  <div className="px-1 pt-1 pb-1.5">
                    <div className="flex items-center justify-between px-1 pb-1.5">
                      <span className="text-[11px] font-semibold text-[var(--color-text-faint)] uppercase tracking-wide select-none">Hats</span>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setCtxMenu("menu")}
                        className="text-[11px] font-medium text-[var(--color-text-faint)] hover:text-[var(--color-text-primary)] transition-colors select-none"
                      >
                        Back
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => onUpdateBuddyPrefs?.({ hat: null })}
                        className={`h-9 rounded-md flex items-center justify-center border transition-colors ${
                          !buddyHat ? "bg-[var(--color-bg-hover)] border-[var(--color-border-primary)]" : "border-transparent hover:bg-[var(--color-bg-hover)]"
                        }`}
                      >
                        <span className="text-[10px] font-medium text-[var(--color-text-faint)] select-none">None</span>
                      </button>
                      {BUDDY_HATS.map((h) => (
                        <button
                          key={h.id}
                          type="button"
                          title={h.label}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => onUpdateBuddyPrefs?.({ hat: h.id })}
                          className={`h-9 rounded-md flex items-center justify-center border transition-colors ${
                            buddyHat === h.id ? "bg-[var(--color-bg-hover)] border-[var(--color-border-primary)]" : "border-transparent hover:bg-[var(--color-bg-hover)]"
                          }`}
                        >
                          <BuddyHat hat={h.id} size={20} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <MenuTail direction="up" side="right" offset={14} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right-click on a custom chip — delete it */}
      <AnimatePresence>
        {chipMenu && (
          <motion.div
            key="chip-menu"
            ref={chipMenuRef}
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 3, scale: 0.98, transition: { duration: 0.1 } }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="fixed z-[130] print:hidden"
            style={{
              left: Math.min(chipMenu.x, window.innerWidth - 170),
              bottom: window.innerHeight - chipMenu.y + 8,
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg shadow-xl py-1 px-1 w-40">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => deleteSkill(chipMenu.skillId)}
                className={ctxItemCls}
              >
                <Trash2 size={14} className="text-[var(--color-icon-muted)]" />
                Delete Skill
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
