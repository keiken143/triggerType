"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  HelpCircle,
  RotateCw,
  Maximize,
  Undo2,
  Target,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { VirtualKeyboard } from "@/components/ui/VirtualKeyboard";
import { useTypingTelemetry } from "@/hooks/useTypingTelemetry";
import { useGhostRecorder } from "@/hooks/useGhostRecorder";
import { useGhostPlayer } from "@/hooks/useGhostPlayer";
import { generateAdaptiveSnippet } from "@/lib/AdaptiveEngine";
import { cn } from "@/lib/utils";

const languageTypes = ["simple", "javascript", "typescript", "python", "java", "csharp", "cpp", "rust", "go", "php", "ruby"] as const;
type LanguageType = typeof languageTypes[number];

const TypingPage = () => {
  const [isTyping, setIsTyping] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageType>("simple");
  const [timeSlotOption, setTimeSlotOption] = useState<number>(60); // Default 1 min in seconds
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [currentText, setCurrentText] = useState("");
  const [typedText, setTypedText] = useState("");
  const [totalCharsTyped, setTotalCharsTyped] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [testCompleted, setTestCompleted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [keyErrors, setKeyErrors] = useState<Record<string, number>>({});
  const [accuracyStreak, setAccuracyStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [finalWpm, setFinalWpm] = useState(0);
  const [finalAccuracy, setFinalAccuracy] = useState(100);
  const [isFocused, setIsFocused] = useState(true);
  const [practiceOptions, setPracticeOptions] = useState<string[]>(['alphabets']);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const bufferRef = useRef<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const ghostId = searchParams.get('ghost');

  const { difficultyMap, recordKeystroke, resetTelemetry, syncDnaToSupabase } = useTypingTelemetry(selectedLanguage);
  const { recordGhostPoint, saveGhostRace, resetGhost } = useGhostRecorder();
  const { currentGhostIndex, ghostName, ghostTrajectory, resetGhostPlayer } = useGhostPlayer(ghostId, isTyping);

  const fallbacks: Record<string, string> = {
    simple: "eerie nine linen earlier rear lean rare rear inner lie nine inner\nline rare near lie nine arena inner linen lean alien lean",
  };

  const handleReset = () => {
    setIsTyping(false);
    setStartTime(null);
    setTypedText("");
    setTotalCharsTyped(0);
    setWpm(0);
    setAccuracy(100);
    setTestCompleted(false);
    setFinalWpm(0);
    setFinalAccuracy(100);
    setKeyErrors({});
    setAccuracyStreak(0);
    setMaxStreak(0);
    setTimeLeft(timeSlotOption);
    resetTelemetry();
    resetGhost();
    resetGhostPlayer();
    generateText();
    // Re-focus the textarea after reset
    setTimeout(() => textAreaRef.current?.focus(), 200);
  };

  const fetchAiSnippet = async () => {
    try {
      console.log(`%c[TypingEngine] Requesting AI Snippet for ${selectedLanguage}...`, "color: #7c3aed; font-weight: bold;");
      const { data, error } = await supabase.functions.invoke('generate-adaptive-snippet', {
        body: {
          language: selectedLanguage,
          dna: difficultyMap,
          length: 35,
          options: practiceOptions,
          seed: Math.random().toString(36).substring(7)
        }
      });
      if (error || !data?.snippet) throw error || new Error("No snippet returned");
      // If edge function returned the hardcoded fallback because it lacks Gemini Key,
      // force error so we catch it and use the local adaptive engine instead.
      if (data.snippet === "The swift movement of fingers creates mastery." ||
        data.snippet.includes("Snippet = () => { return true; };")) {
        throw new Error("Edge function returned static fallback - forcing local engine");
      }

      // Only lowercase for simple prose, keep original case for code languages
      const finalSnippet = selectedLanguage === 'simple' ? data.snippet.toLowerCase() : data.snippet;
      return `${finalSnippet} `;
    } catch (e) {
      console.warn("AI Snippet failed, using local engine:", e);
      const localSnippet = generateAdaptiveSnippet(selectedLanguage, difficultyMap, 35);
      const finalLocalSnippet = selectedLanguage === 'simple' ? localSnippet.toLowerCase() : localSnippet;
      return `${finalLocalSnippet} `;
    }
  };

  const fillBuffer = async () => {
    if (bufferRef.current.length >= 4) return;
    try {
      const newLine = await fetchAiSnippet();
      bufferRef.current.push(newLine);
      if (bufferRef.current.length < 4) fillBuffer();
    } catch (e) {
      console.error(e);
    }
  };

  const generateText = async () => {
    setIsGenerating(true);
    bufferRef.current = []; // clear buffer
    const [line1, line2] = await Promise.all([fetchAiSnippet(), fetchAiSnippet()]);
    setCurrentText(`${line1}\n${line2}`);
    setIsGenerating(false);
    fillBuffer();
  };

  // Reset text whenever language or practice options change to ensure new constraints are applied
  useEffect(() => {
    setCurrentText("");
  }, [selectedLanguage, practiceOptions]);

  useEffect(() => {
    if (!currentText && !isGenerating) {
      generateText();
    }
  }, [currentText, isGenerating]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTyping && startTime) {
      interval = setInterval(() => {
        const elapsedMillis = Date.now() - startTime;
        const elapsedMinutes = elapsedMillis / 60000;
        const currentWpm = elapsedMinutes > 0 ? Math.round(((totalCharsTyped + typedText.length) / 5) / elapsedMinutes) : 0;
        setWpm(currentWpm);

        const remaining = Math.max(0, timeSlotOption - Math.floor(elapsedMillis / 1000));
        setTimeLeft(remaining);

        if (remaining === 0) {
          setIsTyping(false);
          setTestCompleted(true);
          // Snapshot final stats before any state drift
          setFinalWpm(currentWpm);
          setFinalAccuracy(accuracy);
        }
      }, 500); // 500ms intervals for smoother countdown
    }
    return () => clearInterval(interval);
  }, [isTyping, startTime, typedText, timeSlotOption]);

  // Auto-save when test completes
  useEffect(() => {
    if (testCompleted && startTime) {
      const autoSave = async () => {
        try {
          const testDuration = Math.round((Date.now() - startTime) / 1000);
          const charCount = totalCharsTyped + typedText.length;
          const correctChars = Math.round((accuracy / 100) * charCount);
          const errors = charCount - correctChars;
          await supabase.from('typing_tests').insert({
            user_id: user.id, wpm, accuracy, test_duration: testDuration, language: selectedLanguage,
            character_count: charCount, correct_characters: correctChars, errors, key_errors: keyErrors
          });
          await syncDnaToSupabase();
          await saveGhostRace(selectedLanguage, wpm, accuracy, charCount);
          toast({ title: "✓ Saved", description: `${wpm} WPM · ${accuracy}% accuracy logged.` });
        } catch (e) { console.error(e) }
      };
      autoSave();
      // Blur the textarea
      textAreaRef.current?.blur();
    }
  }, [testCompleted]);

  // Spacebar to restart when test is completed
  useEffect(() => {
    const handleSpaceRestart = (e: KeyboardEvent) => {
      if ((testCompleted || (isTyping && !isFocused)) && e.code === 'Space') {
        e.preventDefault();
        handleReset();
        setIsFocused(true);
        // Note: focus() is called inside handleReset via generateText/setTimeout
      }
    };
    window.addEventListener('keydown', handleSpaceRestart);
    return () => window.removeEventListener('keydown', handleSpaceRestart);
  }, [testCompleted, isTyping, isFocused, timeSlotOption]);

  // Periodic Telemetry Sync (Every 2 minutes to keep DB fresh without overloading)
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (isTyping) {
        syncDnaToSupabase();
      }
    }, 120000);
    return () => clearInterval(syncInterval);
  }, [isTyping, syncDnaToSupabase]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (testCompleted) return; // Prevent typing after test is done
    if (!isTyping) {
      setIsTyping(true);
      setStartTime(Date.now());
    }
    const input = e.target.value;
    const targetChar = line1[typedText.length];
    const inputChar = input[input.length - 1];

    if (input.length > typedText.length) {
      const isError = inputChar !== targetChar;
      recordKeystroke(targetChar || '', inputChar || '', isError);

      // For ghost data, we track their forward absolute index relative to total chars typed
      if (!isError) {
        recordGhostPoint(totalCharsTyped + input.length);
      }

      if (isError) {
        setKeyErrors(p => ({ ...p, [targetChar?.toLowerCase() || '']: (p[targetChar?.toLowerCase() || ''] || 0) + 1 }));
        setAccuracyStreak(0);
      } else {
        const newStreak = accuracyStreak + 1;
        setAccuracyStreak(newStreak);
        if (newStreak > maxStreak) setMaxStreak(newStreak);
      }
    }
    setTypedText(input);

    if (input.length >= line1.length && line1.length > 0) {
      setTotalCharsTyped(prev => prev + line1.length);

      // Move to next line immediately using the buffer
      const nextVisibleLine = line2 !== '...' ? line2 : "Loading...";
      setTypedText("");

      if (bufferRef.current.length > 0) {
        const nextNextLine = bufferRef.current.shift()!;
        setCurrentText(`${nextVisibleLine}\n${nextNextLine}`);
        fillBuffer(); // replenish buffer
      } else {
        setCurrentText(`${nextVisibleLine}\n...`);
        fetchAiSnippet().then(newPendingLine => {
          setCurrentText(prev => {
            const [l1] = prev.split('\n');
            return `${l1}\n${newPendingLine}`;
          });
          fillBuffer(); // start replenishing buffer
        });
      }
    }

    const elapsedMinutes = startTime ? (Date.now() - startTime) / 60000 : 0;
    const calculatedWpm = elapsedMinutes > 0 ? Math.round(((totalCharsTyped + input.length) / 5) / elapsedMinutes) : 0;
    setWpm(calculatedWpm);

    let correct = 0;
    for (let i = 0; i < input.length; i++) if (input[i] === line1[i]) correct++;
    setAccuracy(input.length > 0 ? Math.round((correct / input.length) * 100) : 100);
  };

  const lines = currentText.split('\n');
  const line1 = lines[0] || "";
  const line2 = lines[1] || "";
  const currentKey = line1[typedText.length] || '—';

  return (
    <div className="h-screen bg-background text-foreground flex flex-col items-center justify-center gap-16 pb-8 pt-12 px-6 overflow-hidden">
      <div className="w-full max-w-6xl flex flex-col items-center">

        {/* TOP INTERFACE: METRICS | TABS | CONTROLS */}
        <div className="flex justify-between items-start w-full relative">
          {/* LEFT: Target-Aligned Analytics */}
          <div className="flex flex-col gap-1.5 font-mono text-[11px] leading-tight text-foreground/40 uppercase font-bold tracking-tight">
            <div className="flex gap-4">
              <span className="opacity-40 min-w-[70px]">Metrics:</span>
              <span className="text-foreground/80">Speed: <span className="text-primary">{wpm}.0wpm</span></span>
              <span className="text-foreground/80">Accuracy: <span className="text-primary">{accuracy}%</span></span>
              <span className="text-foreground/20">|</span>
              <span className="font-black text-foreground">
                Time Left: <span className={cn(timeLeft <= 10 && timeLeft > 0 ? "text-destructive animate-pulse" : "text-primary")}>
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </span>
              </span>
              {ghostTrajectory.length > 0 && (
                <>
                  <span className="text-foreground/20">|</span>
                  <span className="text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Target className="w-3 h-3" /> vs {ghostName}
                  </span>
                </>
              )}
            </div>
            <div className="flex gap-4">
              <span className="opacity-40 min-w-[70px]">All keys:</span>
              <div className="flex flex-wrap gap-1.5 max-w-2xl">
                {(() => {
                  let keys = "";
                  if (practiceOptions.includes('alphabets')) keys += "abcdefghijklmnopqrstuvwxyz";
                  if (practiceOptions.includes('mixedCase')) keys += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                  if (practiceOptions.includes('numbers')) keys += "0123456789";
                  if (practiceOptions.includes('symbols')) keys += "!@#$%^&*()_+{}|:\"<>?";
                  if (practiceOptions.includes('punctuation')) keys += ",./;'[]\\-=";

                  // If none selected, default to alphabets to avoid empty UI
                  if (!keys) keys = "abcdefghijklmnopqrstuvwxyz";

                  return keys.toUpperCase().split('').filter((v, i, a) => a.indexOf(v) === i).map((k, i) => (
                    <span key={i} className={cn("px-0.5 border border-border/10 rounded-[2px] transition-colors", keyErrors[k.toLowerCase()] > 0 ? "text-destructive line-through opacity-20" : "opacity-80")}>{k}</span>
                  ));
                })()}
              </div>
            </div>
            <div className="flex gap-4">
              <span className="opacity-40 min-w-[70px]">Current key:</span>
              <span className="text-primary border border-primary/20 px-2 py-0.5 rounded-[2px] bg-primary/10 mb-[-2px]">{currentKey}</span>
              <span className="opacity-30 lowercase font-medium">Character Target.</span>
            </div>
            <div className="flex gap-4">
              <span className="opacity-40 min-w-[70px]">Accuracy:</span>
              <span className={cn("transition-all duration-300", accuracyStreak > 0 ? "text-primary font-black" : "opacity-30")}>
                {accuracyStreak > 0 ? `${accuracyStreak} streak!` : "no accuracy streaks."}
              </span>
              {maxStreak > 0 && <span className="opacity-20 lowercase">(best: {maxStreak})</span>}
            </div>
            <div className="flex items-center gap-4 mt-1">
              <span className="opacity-40 min-w-[70px]">Daily goal:</span>
              <span className="opacity-60 lowercase font-medium">12%/30 minutes</span>
              <div className="w-64 h-[2px] bg-foreground/5 rounded-full overflow-hidden inline-block border border-border/10">
                <motion.div className="h-full bg-primary/40" animate={{ width: `12%` }} />
              </div>
            </div>
          </div>

          {/* RIGHT: Functional Controls & Modes */}
          <div className="flex flex-col items-end gap-4">
            <div className="flex items-center gap-5 text-muted-foreground/30 pr-2">
              <Maximize className="w-5 h-5 cursor-pointer hover:text-foreground transition-all" />
            </div>

            {/* INTEGRATED MODE & TIME SELECTION */}
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                {/* TIME SLOTS */}
                <div className="flex items-center bg-muted/5 border border-border/10 rounded-full p-1 gap-1">
                  {[60, 300, 900, 1800].map((slot) => (
                    <div
                      key={slot}
                      className={cn("px-3 py-1.5 rounded-full text-[9px] font-black tracking-widest cursor-pointer transition-all", timeSlotOption === slot ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground")}
                      onClick={() => { setTimeSlotOption(slot); setTimeLeft(slot); setCurrentText(""); }}
                    >
                      {slot >= 60 ? `${Math.floor(slot / 60)}M` : `${slot}S`}
                    </div>
                  ))}
                </div>

                {/* SEPARATOR */}
                <div className="w-[1px] h-6 bg-border/20 mx-1"></div>

                {/* LANGUAGE MODE */}
                <div className="flex items-center bg-muted/5 border border-border/10 rounded-full p-1 gap-1">
                  <div
                    className={cn("px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all", selectedLanguage === 'simple' ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
                    onClick={() => { setSelectedLanguage('simple'); setCurrentText(""); }}
                  >
                    General Prose
                  </div>
                  <div
                    className={cn("px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all", selectedLanguage !== 'simple' ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
                    onClick={() => { if (selectedLanguage === 'simple') setSelectedLanguage('javascript'); setCurrentText(""); }}
                  >
                    Developer
                  </div>
                </div>
              </div>

              {/* LANGUAGE PICKER (Only visible in Developer mode) */}
              <AnimatePresence>
                {selectedLanguage !== 'simple' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-1.5 px-2 py-1 bg-muted/5 border border-border/5 rounded-lg overflow-x-auto max-w-[300px] no-scrollbar"
                  >
                    {languageTypes.filter(l => l !== 'simple').map((lang) => (
                      <div
                        key={lang}
                        className={cn(
                          "px-2 py-1 rounded-[4px] text-[8px] font-bold uppercase tracking-tight cursor-pointer transition-all whitespace-nowrap border",
                          selectedLanguage === lang
                            ? "bg-primary/20 border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10"
                        )}
                        onClick={() => { setSelectedLanguage(lang); setCurrentText(""); }}
                      >
                        {lang.replace('javascript', 'js').replace('typescript', 'ts').replace('csharp', 'c#').replace('cpp', 'c++')}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* PRACTICE OPTIONS (Neural Matrix Configuration) */}
            <div className="flex flex-wrap justify-end gap-1.5 mt-2 max-w-[400px]">
              {[
                { id: 'alphabets', label: 'abc' },
                { id: 'mixedCase', label: 'AaBb' },
                { id: 'numbers', label: '123' },
                { id: 'symbols', label: '!@#' },
                { id: 'punctuation', label: '.,;' }
              ].map((opt) => (
                <div
                  key={opt.id}
                  className={cn(
                    "px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest cursor-pointer transition-all border",
                    practiceOptions.includes(opt.id)
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-muted/5 border-border/10 text-muted-foreground/40 hover:text-muted-foreground hover:border-border/40"
                  )}
                  onClick={() => {
                    setPracticeOptions(prev =>
                      prev.includes(opt.id)
                        ? (prev.length > 1 ? prev.filter(x => x !== opt.id) : prev)
                        : [...prev, opt.id]
                    );
                    setCurrentText(""); // Force regeneration
                  }}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TYPING STREAM: 2-LINE ENGINE */}
        <div className={cn("w-full flex flex-col justify-center min-h-[220px] relative py-8 cursor-text group transition-all duration-500", (testCompleted || (isTyping && !isFocused)) && "opacity-30 blur-[4px] pointer-events-none")} onClick={() => !testCompleted && textAreaRef.current?.focus()}>
          <textarea
            ref={textAreaRef}
            value={typedText}
            onChange={handleTextChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={testCompleted}
            className="absolute inset-0 w-full h-full opacity-0 z-50 cursor-text pointer-events-auto"
            autoFocus
          />

          <div className="flex flex-col gap-10 font-mono text-[1.5rem] md:text-[1.75rem] tracking-tight leading-none text-center select-none relative z-10 w-full max-w-5xl mx-auto overflow-hidden">
            {/* ACTIVE LINE - STATIONARY FOCUS */}
            <div className="relative flex items-center justify-center min-h-[4rem] px-4 overflow-hidden">
              <div className="flex">
                {line1.split('').map((char, i) => (
                  <span key={i} className="relative inline-flex items-center justify-center w-[1.05rem]">
                    {/* User Caret */}
                    {i === typedText.length && !testCompleted && (
                      <motion.div
                        layoutId="caret"
                        transition={{ type: "spring", stiffness: 800, damping: 40 }}
                        className="absolute -left-[1.5px] h-full w-[3px] bg-primary rounded-full shadow-[0_0_20px_hsl(var(--primary))] z-20"
                      />
                    )}
                    {/* Ghost Caret */}
                    {ghostTrajectory.length > 0 && (totalCharsTyped + i) === currentGhostIndex && (
                      <motion.div
                        layoutId="ghost-caret"
                        transition={{ type: "spring", stiffness: 800, damping: 40 }}
                        className="absolute -left-[1.5px] h-full w-[3px] bg-purple-500/60 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)] z-10"
                      />
                    )}
                    <span className={cn(
                      "transition-all duration-150",
                      i < typedText.length
                        ? (typedText[i] === char ? "text-foreground opacity-100 font-bold" : "text-destructive underline decoration-2 underline-offset-8 opacity-100")
                        : "text-foreground/20"
                    )}>
                      {char === ' ' ? '·' : char}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {/* PENDING LINE - STATIONARY BALANCE */}
            <div className="relative flex items-center justify-center whitespace-nowrap overflow-hidden px-4 opacity-70">
              <div className="flex">
                {line2.split('').map((c, i) => (
                  <span key={i} className="w-[1.05rem] inline-flex justify-center flex-shrink-0 opacity-80">
                    {c === ' ' ? '·' : c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="font-mono text-[9px] animate-pulse opacity-40 uppercase tracking-[0.5em] text-primary">Synchronizing Buffer...</span>
            </div>
          )}
        </div>

        {/* POST-TEST INLINE RESULTS / PAUSE SCREEN */}
        <AnimatePresence>
          {(testCompleted || (isTyping && !isFocused)) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex flex-col items-center gap-4 -mt-8 mb-4 min-h-[80px] justify-center"
            >
              {!testCompleted && isTyping && !isFocused ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-primary animate-pulse uppercase tracking-[0.4em] text-[11px] font-black py-2 bg-primary/5 px-6 border border-primary/20 rounded-full">
                    Neural_Link_Lost // System_Suspended
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-8 font-mono text-sm bg-card/40 border border-border/40 py-4 px-10 rounded-[2rem] backdrop-blur-md">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-muted-foreground uppercase tracking-widest text-[9px] font-black">Velocity</span>
                    <span className="text-foreground font-black text-2xl tracking-tighter">{finalWpm} <span className="text-[10px] text-muted-foreground uppercase">WPM</span></span>
                  </div>
                  <div className="w-px h-10 bg-border/20" />
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-muted-foreground uppercase tracking-widest text-[9px] font-black">Precision</span>
                    <span className="text-primary font-black text-2xl tracking-tighter">{finalAccuracy}<span className="text-[10px] text-primary/50 uppercase">%</span></span>
                  </div>
                  {ghostTrajectory.length > 0 && (
                    <>
                      <div className="w-px h-10 bg-border/20" />
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-purple-400/60 uppercase tracking-widest text-[9px] font-black">VS_OPERATIVE</span>
                        <span className="text-purple-400 font-black text-sm uppercase tracking-tighter">{ghostName}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="flex items-center gap-3 mt-2"
              >
                <div className="w-8 h-[1px] bg-primary/30" />
                <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-primary font-black">
                  {testCompleted ? 'Press Space to Re-Initialize' : 'Press Space to Resync Neural Link'}
                </span>
                <div className="w-8 h-[1px] bg-primary/30" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FEEDBACK MATRIX */}
        {!testCompleted && (
          <div className="shrink-0 flex justify-center scale-[0.75] origin-top animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="bg-card/20 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-border/40 shadow-2xl">
              <VirtualKeyboard keyErrors={keyErrors} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TypingPage;
