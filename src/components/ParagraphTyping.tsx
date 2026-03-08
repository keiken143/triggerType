import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Play, Pause, Timer, Target, Zap, TrendingUp,
  FileText, Sparkles, Loader2, CheckCircle2,
} from "lucide-react";

const paragraphs = [
  "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet and has been used for typing practice for over a century. It remains one of the most popular pangrams in the English language.",
  "Technology has transformed the way we communicate, work, and live. From smartphones to artificial intelligence, innovation continues to reshape our daily experiences. The pace of change shows no signs of slowing down as we move further into the digital age.",
  "The ocean covers more than seventy percent of the Earth's surface. Its depths remain largely unexplored, holding mysteries that scientists are only beginning to uncover. Marine ecosystems support countless species and play a crucial role in regulating our climate.",
  "Reading is one of the most powerful ways to expand your knowledge and imagination. Books transport us to different worlds, introduce us to new ideas, and help us understand perspectives different from our own. The habit of daily reading can transform your life.",
  "Mountains have always captivated the human spirit. Their towering peaks challenge climbers, their slopes shelter diverse wildlife, and their beauty inspires artists and poets. From the Himalayas to the Andes, these geological wonders shape cultures and landscapes across the globe.",
  "Music is a universal language that transcends borders and cultures. Whether it is the rhythmic beats of drums in Africa, the delicate melodies of a Japanese koto, or the powerful harmonies of a symphony orchestra, music has the ability to evoke deep emotions and bring people together.",
  "Space exploration represents one of humanity's greatest achievements. From the first satellite launched into orbit to landing astronauts on the Moon, each milestone has expanded our understanding of the universe. Future missions to Mars and beyond promise even more remarkable discoveries.",
  "Cooking is both an art and a science. The careful combination of ingredients, temperatures, and techniques can transform simple raw materials into extraordinary dishes. Great chefs understand that patience, creativity, and attention to detail are the foundations of culinary excellence.",
];

const TIME_OPTIONS = [
  { label: "1m", value: 60 },
  { label: "3m", value: 180 },
  { label: "5m", value: 300 },
  { label: "10m", value: 600 },
];

const ParagraphTyping = () => {
  const [isTyping, setIsTyping] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(180);
  const [timeLeft, setTimeLeft] = useState(180);
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

  const generateParagraph = useCallback(() => paragraphs[Math.floor(Math.random() * paragraphs.length)], []);

  useEffect(() => { setCurrentText(generateParagraph()); }, [generateParagraph]);

  const generateAIText = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-code", {
        body: { language: "simple", topic: "Generate a typing practice paragraph of 50-80 words. Use natural, flowing English prose on any interesting topic. No special characters or formatting — just plain text with proper punctuation and capitalization." },
      });
      if (error) throw error;
      if (data?.code) setCurrentText(data.code.trim());
      else throw new Error("No text generated");
    } catch {
      toast({ title: "Generation failed", description: "Using preset paragraph instead.", variant: "destructive" });
      setCurrentText(generateParagraph());
    } finally { setIsGenerating(false); }
  };

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
    if (!user) { toast({ title: "Authentication Required", description: "Please log in to save results.", variant: "destructive" }); return; }
    try {
      const testDuration = selectedDuration - timeLeft;
      const characterCount = typedText.length;
      const correctCharacters = Math.round((accuracy / 100) * characterCount);
      const errors = characterCount - correctCharacters;
      const { error } = await supabase.from("typing_tests").insert({
        user_id: user.id, wpm, accuracy, test_duration: testDuration, language: "paragraph",
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

      {/* Typing Area */}
      <Card className="border-border/30 bg-card/40 overflow-hidden">
        <CardContent className="p-0">
          {/* Controls bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/20 bg-card/60">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Paragraph Practice
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost" size="sm"
                onClick={generateAIText}
                disabled={isTyping || isGenerating}
                className="text-xs h-8 text-primary hover:bg-primary/10"
              >
                {isGenerating ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
                {isGenerating ? 'Generating...' : 'AI Text'}
              </Button>
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
            <p className="text-base leading-[2] whitespace-pre-wrap w-full tracking-wide">
              {currentText.split("").map((char, index) => (
                <span key={index} className={`${getCharacterClass(index)} transition-colors duration-100 relative`}>
                  {index === typedText.length && isTyping && (
                    <span
                      ref={cursorRef}
                      className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary animate-pulse rounded-full"
                      style={{ transform: 'translateX(-1px)' }}
                    />
                  )}
                  {char}
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

export default ParagraphTyping;
