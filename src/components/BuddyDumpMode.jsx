import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { X } from "lucide-react";
import { formatBrainDumpFromAudio, transcribeAudioBasic } from "../utils/gemini";

export default function BuddyDumpMode({ isActive, onClose, onInsert }) {
  const [phase, setPhase] = useState("recording"); // recording | processing | done
  const [hasSpeoken, setHasSpeoken] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [justResumed, setJustResumed] = useState(false);
  const resumeBounceTimer = useRef(null);
  const [elapsed, setElapsed] = useState(0);
  const [doneMsg, setDoneMsg] = useState(null); // null | { ok: true } | { ok: false, text: string, canRetry?: bool }
  const [expression, setExpression] = useState("idle");
  const [blinkState, setBlinkState] = useState("");
  const [buddySettled, setBuddySettled] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [processingMsg, setProcessingMsg] = useState("Formatting your notes...");
  const [isDark, setIsDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);

  const phaseRef = useRef("recording");
  const mrRef = useRef(null);
  const chunksRef = useRef([]);
  const mimeTypeRef = useRef("audio/webm");
  const silenceTimerRef = useRef(null);
  const levelIntervalRef = useRef(null);
  const hasSpokenRef = useRef(false);
  const manualPauseRef = useRef(false); // true = user paused manually, don't auto-resume
  const savedBlobRef = useRef(null);
  const recordedSecondsRef = useRef(0);
  const wakeLockRef = useRef(null);
  const speechRecRef = useRef(null);
  const liveTranscriptRef = useRef("");

  // MotionValues for audio-reactive gradient — no React re-renders
  const audioLevelMV = useMotionValue(0);
  const gradientOpacity = useSpring(
    useTransform(audioLevelMV, [0, 160], [0.35, 1.0]),
    { stiffness: 60, damping: 20 }
  );
  const gradientScaleY = useSpring(
    useTransform(audioLevelMV, [0, 160], [1.0, 1.75]),
    { stiffness: 50, damping: 18 }
  );

  const go = (p) => { phaseRef.current = p; setPhase(p); };

  const stopSpeechRec = () => {
    const rec = speechRecRef.current;
    if (!rec) return;
    speechRecRef.current = null; // null before stop so onend doesn't auto-restart
    try { rec.stop(); } catch (_) {}
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // Elapsed timer — stops when paused, resets when session ends
  useEffect(() => {
    if (!isActive || phase !== "recording") { setElapsed(0); return; }
    if (isPaused) return; // freeze counter while paused, don't reset
    const tid = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(tid);
  }, [isActive, phase, isPaused]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const h = (e) => setIsDark(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  // Prevent the screen/computer from sleeping while Buddy Live is open
  useEffect(() => {
    if (!isActive || !navigator.wakeLock) return;
    let released = false;
    navigator.wakeLock.request('screen').then(lock => {
      if (released) { lock.release(); return; }
      wakeLockRef.current = lock;
    }).catch(() => {});
    return () => {
      released = true;
      if (wakeLockRef.current) { wakeLockRef.current.release(); wakeLockRef.current = null; }
    };
  }, [isActive]);

  const getUrl = (k) =>
    `/buddy expressions/buddy${isDark ? "dark" : "light"}${k === "idle" ? "" : k}.png`;

  // Shake + error face whenever a retryable error fires (mirrors BuddyWidget mic-error behaviour)
  useEffect(() => {
    if (!doneMsg?.canRetry) return;
    setIsShaking(true);
    const t = setTimeout(() => setIsShaking(false), 600);
    return () => clearTimeout(t);
  }, [doneMsg?.canRetry, doneMsg]);

  const activeExpression =
    doneMsg?.canRetry || isShaking ? "error" :
    expression === "idle"  && blinkState === "blink" ? "blink" :
    expression === "smile" && blinkState === "blink" ? "smileblink" :
    expression;

  // Tab title: "Buddy" while live, restore handled by App.jsx on close
  useEffect(() => {
    if (!isActive) return;
    document.title = 'Buddy';
  }, [isActive]);

  // Favicon: sync with Buddy's expression while live.
  // Uses only raw state in deps (no computed consts) to avoid minifier TDZ issues.
  useEffect(() => {
    if (!isActive) return;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    const expr =
      (expression === "idle"  && blinkState === "blink") ? "blink" :
      (expression === "smile" && blinkState === "blink") ? "smileblink" :
      expression;
    link.href = `/buddy expressions/buddy${isDark ? "dark" : "light"}${expr === "idle" ? "" : expr}.png`;
  }, [isActive, expression, blinkState, isDark]);

  // Blink engine
  useEffect(() => {
    if (phase !== "recording") { setBlinkState(""); return; }
    let tid; let bts = [];
    const clear = () => { bts.forEach(clearTimeout); bts = []; };
    const blink = () => {
      clear(); setBlinkState("blink");
      if (Math.random() < 0.25) {
        bts.push(setTimeout(() => {
          setBlinkState("");
          bts.push(setTimeout(() => {
            setBlinkState("blink");
            bts.push(setTimeout(() => setBlinkState(""), 120));
          }, 100));
        }, 150));
      } else {
        bts.push(setTimeout(() => setBlinkState(""), 150));
      }
      tid = setTimeout(blink, Math.random() * 3500 + 2500);
    };
    tid = setTimeout(blink, Math.random() * 800 + 600);
    return () => { clearTimeout(tid); clear(); };
  }, [phase]);

  const submit = async (blob, isRetry = false) => {
    if (!isRetry && phaseRef.current !== "recording") return;

    // At 32 kbps + WebM container overhead, ~20 KB ≈ 3-4 seconds.
    // Anything shorter isn't worth sending — bail before calling Gemini.
    if (!blob || blob.size < 20000) {
      setExpression("idle");
      setDoneMsg({ ok: false, text: "Not enough audio — try recording for a bit longer." });
      go("done");
      setTimeout(onClose, 3500);
      return;
    }

    go("processing");
    setExpression("smilebetween");
    setTimeout(() => setExpression("smile"), 80);
    // Large files (>3 MB) upload directly to Gemini first — give the user an indication
    const FILE_API_THRESHOLD = 3 * 1024 * 1024;
    if (blob.size > FILE_API_THRESHOLD) {
      setProcessingMsg("Uploading your recording...");
      setTimeout(() => setProcessingMsg("Formatting your notes..."), 8000);
    } else {
      setProcessingMsg("Formatting your notes...");
    }

    try {
      let html = await formatBrainDumpFromAudio(blob);

      // If the model generated a plain <ul> immediately after a checklist-flavoured
      // heading (Action Items, To-do, Tasks, Checklist, etc.), promote it to a checklist.
      if (html) {
        html = html.replace(
          /(<h[123][^>]*>(?:action items?|to[\s-]?do|tasks?|checklist)[^<]*<\/h[123]>\s*)<ul(?![^>]*class=["']checklist["'])/gi,
          '$1<ul class="checklist"'
        );
      }

      const trimmed = html?.trim() ?? "";

      // Detect when Gemini returns its sentinel or hallucinates the system prompt
      // back as "transcribed" content (happens with empty/very short audio).
      const noAudio = !trimmed || trimmed === "NO_AUDIO" || trimmed.includes("NO_AUDIO");
      const stripped = trimmed.toLowerCase().replace(/<[^>]+>/g, " ");
      const leakPhrases = [
        "words editor", "allowed html", "voice recording",
        "richest, most useful", "allowed elements", "content type",
        "instructions for document", "transcribe the voice",
      ];
      const leakCount = leakPhrases.filter(p => stripped.includes(p)).length;
      const isSystemPromptLeak = leakCount >= 2;

      if (noAudio || isSystemPromptLeak) {
        setExpression("idle");
        setDoneMsg({ ok: false, text: "Not enough audio to work with — try speaking a bit longer." });
        go("done");
        setTimeout(onClose, 3500);
        return;
      }

      setExpression("smileblink");
      setTimeout(() => setExpression("smile"), 60);
      setTimeout(() => setExpression("smileblink"), 130);
      setTimeout(() => setExpression("smile"), 190);
      setDoneMsg({ ok: true });
      go("done");
      onInsert(html);
      setTimeout(onClose, 1000);
    } catch (err) {
      console.error("Brain dump error:", err);
      // canRetry: true keeps screen open + triggers shake/error-face
      setDoneMsg({ ok: false, text: "Couldn't reach Buddy — check your connection.", canRetry: true });
      go("done");
    }
  };

  const handleRetry = () => {
    if (!savedBlobRef.current) return;
    setProcessingMsg("Formatting your notes...");
    setDoneMsg(null);
    submit(savedBlobRef.current, true);
  };

  const handleCreateRecoveryDoc = async () => {
    setProcessingMsg("Transcribing...");
    go("processing");
    setExpression("smilebetween");
    setTimeout(() => setExpression("smile"), 80);

    const finish = (html) => {
      setExpression("smileblink");
      setTimeout(() => setExpression("smile"), 60);
      setTimeout(() => setExpression("smileblink"), 130);
      setTimeout(() => setExpression("smile"), 190);
      setDoneMsg({ ok: true });
      go("done");
      onInsert(`<h1>Voice Recording</h1>${html}`);
      setTimeout(onClose, 1000);
    };

    // First: use live transcript captured by Web Speech API during recording (no network needed)
    const liveText = liveTranscriptRef.current.trim();
    if (liveText) {
      const html = liveText.split(/\s{2,}|\n+/).filter(p => p.trim()).map(p => `<p>${p.trim()}</p>`).join('');
      finish(html);
      return;
    }

    // Second: fall back to lightweight transcription API
    const blob = savedBlobRef.current;
    if (!blob) { onClose(); return; }

    try {
      const html = await transcribeAudioBasic(blob);
      finish(html);
    } catch (err) {
      console.error("Transcription fallback failed:", err);
      setExpression("idle");
      setDoneMsg({ ok: false, text: "Couldn't reach Buddy — check your connection.", canRetry: true });
      go("done");
    }
  };

  const pauseRecording = (manual = false) => {
    if (phaseRef.current !== "recording") return;
    clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = null;
    manualPauseRef.current = manual;
    const mr = mrRef.current;
    if (mr && mr.state === "recording") { mr.pause(); setIsPaused(true); }
  };

  const triggerResumeBounce = () => {
    clearTimeout(resumeBounceTimer.current);
    setJustResumed(true);
    resumeBounceTimer.current = setTimeout(() => setJustResumed(false), 750);
    // Smile + double blink sequence
    setExpression("smilebetween");
    setTimeout(() => setExpression("smile"),       60);
    setTimeout(() => setExpression("smileblink"),  140);
    setTimeout(() => setExpression("smile"),       220);
    setTimeout(() => setExpression("smileblink"),  300);
    setTimeout(() => setExpression("smile"),       380);
    setTimeout(() => setExpression("smilebetween"),900);
    setTimeout(() => setExpression("idle"),        980);
  };

  const resumeRecording = () => {
    if (phaseRef.current !== "recording") return;
    manualPauseRef.current = false;
    const mr = mrRef.current;
    if (mr && mr.state === "paused") { mr.resume(); setIsPaused(false); triggerResumeBounce(); }
  };

  const stopRecording = () => {
    if (phaseRef.current !== "recording") return;
    recordedSecondsRef.current = elapsed;
    clearTimeout(silenceTimerRef.current);
    clearInterval(levelIntervalRef.current);
    audioLevelMV.set(0);
    setIsPaused(false);
    stopSpeechRec();
    const mr = mrRef.current;
    if (mr && mr.state !== "inactive") mr.stop();
  };

  // Recording lifecycle
  useEffect(() => {
    if (!isActive) {
      go("recording");
      setExpression("idle");
      setHasSpeoken(false);
      setIsPaused(false);
      setElapsed(0);
      setDoneMsg(null);
      setBuddySettled(false);
      audioLevelMV.set(0);
      hasSpokenRef.current = false;
      chunksRef.current = [];
      savedBlobRef.current = null;
      recordedSecondsRef.current = 0;
      liveTranscriptRef.current = "";
      clearTimeout(silenceTimerRef.current);
      clearInterval(levelIntervalRef.current);
      return;
    }

    go("recording");
    hasSpokenRef.current = false;
    chunksRef.current = [];

    let stream, audioCtx;
    let cancelled = false;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        if (!cancelled) onClose();
        return;
      }

      // Bail if the effect was cleaned up while getUserMedia was pending
      if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

      audioCtx = new AudioContext();
      // AudioContext starts suspended when created outside a direct user-gesture handler
      if (audioCtx.state === "suspended") await audioCtx.resume();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      audioCtx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      levelIntervalRef.current = setInterval(() => {
        if (phaseRef.current !== "recording") return;
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        audioLevelMV.set(avg);
        if (avg > 15) {
          // Auto-resume only if we were auto-paused (not manually paused)
          const mr = mrRef.current;
          if (mr && mr.state === "paused" && !manualPauseRef.current) { mr.resume(); setIsPaused(false); triggerResumeBounce(); }
          if (!hasSpokenRef.current) {
            hasSpokenRef.current = true;
            setHasSpeoken(true);
          }
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        } else if (hasSpokenRef.current && !silenceTimerRef.current && mrRef.current?.state !== "paused") {
          // Auto-pause after 8s of silence instead of stopping
          silenceTimerRef.current = setTimeout(() => pauseRecording(false), 8000);
        }
      }, 80);

      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg"]
        .find(t => MediaRecorder.isTypeSupported(t)) || "";
      mimeTypeRef.current = mimeType || "audio/webm";

      const mr = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 32000, // 32 kbps — handles multi-speaker rooms well, ~7 MB per 30 min (uses File API)
      });
      mrRef.current = mr;

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        if (audioCtx.state !== "closed") audioCtx.close();
        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
        savedBlobRef.current = blob;
        submit(blob);
      };

      mr.start(200);

      // Run Web Speech API in parallel to capture a live transcript as backup.
      // If Buddy fails, this transcript is used instantly with no network call needed.
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        liveTranscriptRef.current = "";
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = false;
        rec.lang = 'en-US';
        rec.onresult = (e) => {
          for (let i = e.resultIndex; i < e.results.length; i++) {
            if (e.results[i].isFinal) {
              liveTranscriptRef.current += e.results[i][0].transcript + ' ';
            }
          }
        };
        rec.onerror = () => {};
        // Auto-restart if it stops mid-session (browsers time out on silence)
        rec.onend = () => {
          if (phaseRef.current === 'recording' && speechRecRef.current === rec) {
            try { rec.start(); } catch (_) {}
          }
        };
        speechRecRef.current = rec;
        try { rec.start(); } catch (_) { speechRecRef.current = null; }
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(silenceTimerRef.current);
      clearInterval(levelIntervalRef.current);
      stopSpeechRec();
      const mr = mrRef.current;
      if (mr && mr.state !== "inactive") {
        mr.onstop = null;
        try { mr.stop(); } catch (_) {}
      }
      if (audioCtx && audioCtx.state !== "closed") try { audioCtx.close(); } catch (_) {}
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          key="buddy-dump"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center print:hidden select-none overflow-hidden"
          style={{ background: "var(--color-bg-primary)" }}
        >

          {/* ── Orange glow — half-buried below screen edge ── */}
          <motion.div
            className="absolute pointer-events-none"
            style={{
              bottom: "-25vh",
              left: "50%",
              translateX: "-50%",
              width: "130vw",
              height: "50vh",
              opacity: gradientOpacity,
              scaleY: gradientScaleY,
              transformOrigin: "bottom center",
              filter: "blur(55px)",
              background: isDark
                ? `radial-gradient(ellipse 80% 100% at 50% 100%,
                    rgba(232, 87, 42, 0.72) 0%,
                    rgba(232, 87, 42, 0.32) 38%,
                    rgba(232, 87, 42, 0.08) 65%,
                    transparent 82%)`
                : `radial-gradient(ellipse 80% 100% at 50% 100%,
                    rgba(232, 87, 42, 1.0)  0%,
                    rgba(232, 87, 42, 0.65) 38%,
                    rgba(232, 87, 42, 0.25) 65%,
                    transparent 82%)`,
            }}
          />

          {/* ── Buddy ── */}
          <motion.div
            style={{ position: "relative", zIndex: 1 }}
            animate={
              isShaking
                ? { x: [-9, 9, -7, 7, -4, 4, 0], y: 0 }
                : buddySettled && phase === "recording" && !isPaused && !justResumed
                  ? { x: 0, y: [0, -5, 0] }
                  : { x: 0, y: 0 }
            }
            transition={
              isShaking
                ? { x: { duration: 0.5, ease: "easeInOut" } }
                : { duration: 4.2, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }
            }
          >
            <motion.img
              layoutId="buddy-face"
              src={getUrl(activeExpression)}
              alt="Buddy"
              style={{ width: 140, height: 140, objectFit: "contain", display: "block" }}
              draggable="false"
              onLayoutAnimationComplete={() => setBuddySettled(true)}
              animate={
                isPaused
                  ? { scale: 0.78, opacity: 0.35 }
                  : justResumed
                    ? { scale: 1, opacity: 1 }
                    : buddySettled && phase === "recording"
                      ? { scale: [1, 1.022, 1], opacity: 1 }
                      : { scale: 1, opacity: 1 }
              }
              transition={{
                scale: isPaused
                  ? { type: "tween", duration: 0.45, ease: [0.22, 1, 0.36, 1] }
                  : justResumed
                    ? { type: "spring", stiffness: 260, damping: 12 }
                    : { duration: 3.8, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" },
                opacity: { type: "tween", duration: 0.35, ease: "easeOut" },
                layout: { type: "tween", duration: 0.55, ease: [0.22, 1, 0.36, 1] },
              }}
            />
          </motion.div>

          {/* ── Status + button ── */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, type: "spring", stiffness: 220, damping: 22 }}
            className="mt-9 flex flex-col items-center gap-4 z-[1] px-6"
          >
            {phase === "recording" && (
              <>
                {/* Timer + status */}
                <motion.div
                  className="flex items-center gap-2.5"
                  initial={{ opacity: 0, scale: 0.75, filter: "blur(14px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  transition={{ delay: 0.5, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  <motion.div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: "#E8572A" }}
                    animate={isPaused ? { opacity: 0.3 } : { opacity: [1, 0.15, 1], scale: [1, 0.7, 1] }}
                    transition={isPaused ? {} : { duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <span
                    className="text-[28px] font-semibold tabular-nums"
                    style={{ color: "var(--color-text-primary)", letterSpacing: "-0.5px", opacity: isPaused ? 0.4 : 1 }}
                  >
                    {formatTime(elapsed)}
                  </span>
                </motion.div>

                {/* Buttons */}
                <motion.div
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, scale: 0.8, filter: "blur(12px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  transition={{ delay: 0.72, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  <button
                    onClick={isPaused ? resumeRecording : () => pauseRecording(true)}
                    className="rounded-lg px-6 py-2.5 text-[14px] font-semibold bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:brightness-[0.94] active:brightness-[0.88] transition-all"
                    style={{ width: 104, boxSizing: "border-box" }}
                  >
                    {isPaused ? "Resume" : "Pause"}
                  </button>
                  <button
                    onClick={stopRecording}
                    className="btn-tactile-accent text-white rounded-lg px-6 py-2.5 text-[14px] font-semibold"
                  >
                    Done talking
                  </button>
                </motion.div>
              </>
            )}

            {phase === "processing" && (
              <motion.p
                animate={{ opacity: [1, 0.35, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                className="text-[13px] font-medium text-[var(--color-text-faint)] tracking-wide"
              >
                {processingMsg}
              </motion.p>
            )}

            {phase === "done" && doneMsg && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 280, damping: 20 }}
                className="flex flex-col items-center gap-3"
              >
                <p
                  className="text-[13px] font-semibold tracking-wide text-center max-w-[260px]"
                  style={{ color: doneMsg.ok ? "#E8572A" : "var(--color-text-faint)" }}
                >
                  {doneMsg.ok ? "Created your doc" : doneMsg.text}
                </p>
                {doneMsg.canRetry && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 280, damping: 22 }}
                    className="flex items-center gap-2.5"
                  >
                    <button
                      onClick={handleCreateRecoveryDoc}
                      className="rounded-lg px-5 py-2 text-[13px] font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg-hover)] hover:brightness-95 active:brightness-90 transition-all"
                    >
                      Transcribe to page
                    </button>
                    <button
                      onClick={handleRetry}
                      className="btn-tactile-dark text-white rounded-lg px-5 py-2 text-[13px] font-semibold"
                    >
                      Try again
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* ── Close ── */}
          <AnimatePresence>
            {phase === "recording" && (
              <motion.button
                key="close-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.7 }}
                onClick={() => {
                  clearTimeout(silenceTimerRef.current);
                  clearInterval(levelIntervalRef.current);
                  const mr = mrRef.current;
                  if (mr && mr.state !== "inactive") { mr.onstop = null; try { mr.stop(); } catch (_) {} }
                  onClose();
                }}
                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-text-faint)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                <X size={15} />
              </motion.button>
            )}
          </AnimatePresence>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
