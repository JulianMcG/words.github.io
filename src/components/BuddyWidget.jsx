import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, CornerDownLeft, X, FileText, Check } from "lucide-react";
import { generateAIResponse } from "../utils/gemini";

export default function BuddyWidget({ isOpen, position, onClose, onApplyText, selectedText, selectedHtml, isCollapsedSelection, fullDocumentText, onGlobalClick, docs = [], activeDocId }) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [previewText, setPreviewText] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  
  const [expression, setExpression] = useState("idle");
  const [isHovered, setIsHovered] = useState(false);
  const [isHoverSequenceComplete, setIsHoverSequenceComplete] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionedDocs, setMentionedDocs] = useState([]);

  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const inputRef = useRef(null);
  
  const [isOpeningTransition, setIsOpeningTransition] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isChangesApplied, setIsChangesApplied] = useState(false);
  const [isViewingChanges, setIsViewingChanges] = useState(false);

  const [blinkState, setBlinkState] = useState("");

  const isMounted = useRef(false);

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
    timeoutId = setTimeout(triggerBlink, Math.random() * 3500 + 2500);
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
      setTimeout(() => inputRef.current?.focus(), 300);
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
        setIsHoverSequenceComplete(false);
        return;
    }
    
    if (isHovered) {
      setIsHoverSequenceComplete(false);
      let t1 = setTimeout(() => setExpression("smilebetween"), 0);
      let t2 = setTimeout(() => setExpression("smileblink"), 50);  // first quick blink (50ms gap)
      let t3 = setTimeout(() => setExpression("smile"), 130);      // 80ms blink length
      let t4 = setTimeout(() => setExpression("smileblink"), 200); // 70ms separation gap
      let t5 = setTimeout(() => {
         setExpression("smile");
         setIsHoverSequenceComplete(true);
      }, 280);     // 80ms blink length
      
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); setIsHoverSequenceComplete(false); };
    } else {
      setExpression("idle");
      setIsHoverSequenceComplete(false);
    }
  }, [isHovered, isOpen, isClicked]);

  // Click Sequence Engine
  useEffect(() => {
    if (isOpen) return;

    if (isClicked) {
      setExpression("click");
    } else if (isHovered) {
      setExpression("smile");
    } else {
      setExpression("idle");
    }
  }, [isClicked, isOpen, isHovered]);

  let activeExpression = hasError ? "error" : expression;
  
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

  const handleGenerate = async (e) => {
    e?.preventDefault();
    const promptToUse = input;
    if (!promptToUse.trim() || isLoading) return;

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
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => { setIsHovered(false); setIsClicked(false); }}
          onMouseDown={(e) => {
             e.preventDefault();
             setIsClicked(true);
          }}
          onMouseUp={(e) => {
             e.preventDefault();
             setIsClicked(false);
             if (onGlobalClick) {
                 onGlobalClick();
                 setIsHovered(false);
             }
          }}
        />
      )}

      {/* Visually animated physics layer */}
      <motion.div
        ref={widgetRef}
        layout="position"
        initial={{ y: 150, opacity: 0, width: restingWidth, height: restingWidth }}
        animate={{
          y: 0,
          opacity: 1,
          width: isOpen ? activeWidth : restingWidth,
          height: isOpen ? "auto" : restingWidth,
          filter: isOpeningTransition ? "blur(3px)" : "blur(0px)",
        }}
        transition={{ 
          type: "spring", stiffness: 350, damping: 25, mass: 0.5,
          y: { type: "spring", stiffness: 150, damping: 20, mass: 0.8 },
          opacity: { duration: 0.4, ease: "easeOut" }
        }}
        className={`fixed z-[100] transition-colors duration-200 print:hidden border-shape-squircle ${
          isOpen ? 'bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] shadow-2xl overflow-hidden pointer-events-auto flex flex-col' : 'bg-transparent overflow-visible pointer-events-none'
        }`}
        style={{
          '--r': isOpen ? '12px' : '24px',
          maxHeight: isOpen ? "600px" : "auto",
          ...((!isOpen || isGlobal)
             ? { bottom: isOpen ? 20 : (isHovered ? 15 : -20), right: isOpen ? 20 : 30 }
             : { top: safeY, left: safeX })
        }}
      >
        <AnimatePresence mode="popLayout">
          {!isOpen ? (
            <motion.div
              layout
              key="resting-icon"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: 1, 
                y: isHovered && !isClicked ? [0, -4, 0] : 0 
              }}
              exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
              transition={{ 
                opacity: { duration: 0.15, delay: 0.15 },
                ...(isHovered && !isClicked ? { y: { repeat: Infinity, duration: 2.2, ease: "easeInOut" } } : { y: { type: "spring", stiffness: 300, damping: 20 } })
              }}
              className="w-[48px] h-[48px] flex m-auto items-center justify-center origin-bottom"
            >
              <motion.img 
                src={getUrl(activeExpression)} 
                alt="Buddy" 
                animate={{ 
                  scale: isClicked ? 1.25 : (isHovered ? 1.4 : 1),
                  opacity: isOpen ? 1 : (isHovered ? 1 : 0.45)
                }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="w-full h-full object-contain select-none origin-bottom" 
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
              className="flex flex-col w-[380px] h-auto overflow-hidden"
            >
              
              <div className="flex flex-col w-full">
                
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

                <form onSubmit={handleGenerate} className="flex relative items-center p-2.5 gap-2.5">
                  <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                    <img 
                      src={getUrl(activeExpression)} 
                      alt="Buddy" 
                      className="w-5 h-5 opacity-90 object-contain drop-shadow-sm transition-transform duration-75"
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
                  
                  {isLoading && <Loader2 size={16} className="text-orange-500 animate-spin flex-shrink-0 ml-1" />}
                  
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
                                <span className="opacity-90 flex items-center justify-center w-4 text-[13px]">{doc.emoji || <FileText size={13} className="text-[var(--color-icon-muted)]" />}</span> 
                                {doc.title}
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>

              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
