import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Play, Pause, Timer, Target, Zap, TrendingUp,
  Keyboard, Sparkles, Loader2, CheckCircle2,
} from "lucide-react";

const touchTypingLessons = [
  { name: "Home Row", keys: "asdf jkl;", words: ["sad", "lad", "flask", "jaffa", "salad", "falls", "ask", "all", "shall", "lass", "dads", "fads", "adds", "skald"] },
  { name: "Top Row", keys: "qwer uiop", words: ["wire", "pour", "quip", "ripe", "wipe", "rope", "pier", "quire", "power", "tower", "opaque", "require"] },
  { name: "Bottom Row", keys: "zxcv bnm,", words: ["zinc", "bomb", "vex", "calm", "climb", "crumb", "mix", "box", "next", "convex", "maxim"] },
  { name: "Numbers", keys: "1234567890", words: ["123", "456", "789", "1024", "2048", "3690", "5050", "9876", "1357", "2468"] },
  { name: "Mixed", keys: "all keys", words: ["the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "sphinx", "of", "black", "quartz", "judge", "my", "vow", "pack", "box", "with", "five", "dozen", "liquor", "jugs"] },
];

const TIME_OPTIONS = [
  { label: "1m", value: 60 },
  { label: "3m", value: 180 },
  { label: "5m", value: 300 },
  { label: "10m", value: 600 },
];

const TouchTyping = () => {
  const [selectedLesson, setSelectedLesson] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentText, setCurrentText] = useState("");
  const [typedText, setTypedText] = useState("");
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [testCompleted, setTestCompleted] = useState(false);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [keyErrors, setKeyErrors] = useState<Record<string, number>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const textDisplayRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);

  const generateLessonText = useCallback((lessonIndex: number) => {
    const lesson = touchTypingLessons[lessonIndex];
    const words: string[] = [];
    for (let i = 0; i < 40; i++) words.push(lesson.words[Math.floor(Math.random() * lesson.words.length)]);
    return words.join(" ");
  }, []);

  const generateAIText = async () => {
    const lesson = touchTypingLessons[selectedLesson];
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-code", {
        body: { language: "simple", topic: `Generate a typing practice paragraph using ONLY words that can be formed from these keys: ${lesson.keys}. The text should be 40-60 words long, lowercase, no punctuation except spaces. Focus on real English words using only those letters. Do NOT include any other characters.` },
      });
      if (error) throw error;
      if (data?.code) setCurrentText(data.code.trim());
      else throw new Error("No text generated");
    } catch {
      toast({ title: "Generation failed", description: "Using preset words instead.", variant: "destructive" });
      setCurrentText(generateLessonText(selectedLesson));
    } finally { setIsGenerating(false); }
  };

  useEffect(() => { setCurrentText(generateLessonText(selectedLesson)); }, [selectedLesson, generateLessonText]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTyping && timeLeft > 0) interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    else if (timeLeft === 0) { setIsTyping(false); setTestCompleted(true); }
    return () => clearInterval(interval);
  }, [isTyping, timeLeft]);

  useEffect(() => {
    if (cursorRef.current) cursorRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [typedText]);

  const handleStart = () => { setIsTyping(true); setTimeout(() => textDisplayRef.current?.focus(), 50); };
  const handlePause = () => setIsTyping(false);

  const handleSubmitTest = async () => {
    if (!user) { toast({ title: "Authentication Required", description: "Please log in to save your test results.", variant: "destructive" }); return; }
    try {
      const testDuration = selectedDuration - timeLeft;
      const characterCount = typedText.length;
      const correctCharacters = Math.round((accuracy / 100) * characterCount);
      const errors = characterCount - correctCharacters;
      const { error } = await supabase.from("typing_tests").insert({
        user_id: user.id, wpm, accuracy, test_duration: testDuration, language: "touch-typing",
        character_count: characterCount, correct_characters: correctCharacters, errors, key_errors: keyErrors,
      });
      if (error) toast({ title: "Error", description: "Failed to save test result.", variant: "destructive" });
      else { setTestSubmitted(true); toast({ title: "Test Submitted!", description: `${wpm} WPM with ${accuracy}% accuracy.` }); }
    } catch { toast({ title: "Error", description: "Failed to save test result.", variant: "destructive" }); }
  };

  const updateStats = (newText: string) => {
    const wordsTyped = newText.split(" ").length;
    const timeElapsed = (selectedDuration - timeLeft) / 60;
    setWpm(timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0);
    let correct = 0;
    for (let i = 0; i < newText.length; i++) if (newText[i] === currentText[i]) correct++;
    setAccuracy(newText.length > 0 ? Math.round((correct / newText.length) * 100) : 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isTyping) return;

    if (e.key === 'Tab') {
      e.preventDefault();
      const newText = typedText + '    ';
      setTypedText(newText);
      updateStats(newText);
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      if (typedText.length > 0) {
        const newText = typedText.slice(0, -1);
        setTypedText(newText);
        updateStats(newText);
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      return;
    }

    if (e.key.length > 1 || e.ctrlKey || e.metaKey || e.altKey) return;

    e.preventDefault();
    const newText = typedText + e.key;
    if (e.key !== currentText[typedText.length]) {
      setKeyErrors(prev => ({ ...prev, [e.key.toLowerCase()]: (prev[e.key.toLowerCase()] || 0) + 1 }));
    }
    setTypedText(newText);
    updateStats(newText);
  };

  const getCharacterClass = (index: number) => {
    if (index >= typedText.length) return "text-muted-foreground/60";
    if (typedText[index] === currentText[index]) return "text-primary";
    return "text-destructive bg-destructive/10 rounded-sm";
  };

  const progress = currentText.length > 0 ? (typedText.length / currentText.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Inline Stats Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-muted-foreground" />
            <span className="text-lg font-bold tabular-nums">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-lg font-bold tabular-nums">{wpm} <span className="text-xs font-normal text-muted-foreground">WPM</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-secondary-glow" />
            <span className="text-lg font-bold tabular-nums">{accuracy}%</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm tabular-nums text-muted-foreground">{Math.round(progress)}%</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {TIME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              disabled={isTyping}
              onClick={() => { setSelectedDuration(opt.value); setTimeLeft(opt.value); }}
              className={`px-2.5 py-1 text-xs rounded-md transition-all ${
                selectedDuration === opt.value
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              } disabled:opacity-50`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lesson Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {touchTypingLessons.map((lesson, index) => (
          <button
            key={lesson.name}
            onClick={() => { if (!isTyping) setSelectedLesson(index); }}
            disabled={isTyping}
            className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
              selectedLesson === index
                ? 'bg-primary/15 border-primary/40 text-primary font-medium'
                : 'border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground'
            } disabled:opacity-50`}
          >
            {lesson.name}
          </button>
        ))}
        <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">
          Keys: <code className="text-primary font-mono">{touchTypingLessons[selectedLesson].keys}</code>
        </span>
        <div className="ml-auto flex gap-2">
          <Button
            variant="ghost" size="sm"
            onClick={generateAIText}
            disabled={isTyping || isGenerating}
            className="text-xs h-7 text-primary hover:bg-primary/10"
          >
            {isGenerating ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
            {isGenerating ? 'Generating...' : 'AI Text'}
          </Button>
        </div>
      </div>

      {/* Typing Area */}
      <Card className="border-border/30 bg-card/40 overflow-hidden">
        <CardContent className="p-0">
          {/* Controls bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/20 bg-card/60">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Keyboard className="w-4 h-4" />
              {touchTypingLessons[selectedLesson].name}
            </span>
            <div className="flex items-center gap-2">
              {!isTyping ? (
                <Button onClick={handleStart} size="sm" className="h-8 px-4 text-xs">
                  <Play className="w-3.5 h-3.5 mr-1.5" />Start
                </Button>
              ) : (
                <Button onClick={handlePause} variant="secondary" size="sm" className="h-8 px-4 text-xs">
                  <Pause className="w-3.5 h-3.5 mr-1.5" />Pause
                </Button>
              )}
            </div>
          </div>

          {/* Text display - inline keystroke capture */}
          <div
            ref={textDisplayRef}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onPaste={(e) => e.preventDefault()}
            className={`p-6 min-h-[180px] max-h-[350px] overflow-y-auto outline-none cursor-text ${
              isTyping ? 'focus:ring-1 focus:ring-primary/30 focus:ring-inset' : ''
            }`}
            onClick={() => { if (isTyping) textDisplayRef.current?.focus(); }}
          >
            <p className="text-base leading-[2] whitespace-pre-wrap w-full font-mono tracking-wide">
              {currentText.split("").map((char, index) => (
                <span key={index} className={`${getCharacterClass(index)} transition-colors duration-100 relative`}>
                  {index === typedText.length && isTyping && (
                    <span
                      ref={cursorRef}
                      className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary animate-pulse rounded-full"
                      style={{ transform: 'translateX(-1px)' }}
                    />
                  )}
                  {char === "\t" ? "    " : char}
                </span>
              ))}
              {typedText.length === currentText.length && isTyping && (
                <span className="inline-block w-[2px] h-[1.2em] bg-primary animate-pulse rounded-full align-middle" />
              )}
            </p>
          </div>

          {isTyping && (
            <div className="px-5 pb-3 text-center">
              <p className="text-xs text-muted-foreground/60">Click the text area above and start typing</p>
            </div>
          )}

          {/* Results */}
          {testCompleted && !testSubmitted && (
            <div className="mx-5 mb-5 p-5 bg-gradient-to-r from-primary/10 to-secondary-glow/10 rounded-xl border border-primary/20 text-center">
              <p className="font-semibold mb-3">Test Complete!</p>
              <div className="flex justify-center gap-8 mb-4 text-sm">
                <span><strong className="text-primary">{wpm}</strong> WPM</span>
                <span><strong className="text-secondary-glow">{accuracy}%</strong> Accuracy</span>
              </div>
              <Button onClick={handleSubmitTest} size="sm"><Target className="w-4 h-4 mr-2" />Submit Results</Button>
            </div>
          )}
          {testSubmitted && (
            <div className="mx-5 mb-5 flex items-center justify-center gap-2 p-4 bg-primary/10 rounded-xl border border-primary/20">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Submitted successfully!</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TouchTyping;
