import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { VirtualKeyboard } from "@/components/ui/VirtualKeyboard";
import AnimationContainer from "@/components/ui/AnimationContainer";
import {
  Play,
  Pause,
  RotateCcw,
  Timer,
  Target,
  Zap,
  TrendingUp,
  FileText,
  Sparkles,
  Loader2,
} from "lucide-react";
import { StatInline } from "@/components/ui/StatInline";
import { MinimalCard } from "@/components/ui/MinimalCard";

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

const ParagraphTyping = () => {
  const [isTyping, setIsTyping] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
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

  const generateParagraph = useCallback(() => {
    return paragraphs[Math.floor(Math.random() * paragraphs.length)];
  }, []);

  const [lastFetchFailed, setLastFetchFailed] = useState(false);

  useEffect(() => {
    setCurrentText(generateParagraph());
  }, [generateParagraph]);

  const generateAIText = async () => {
    setIsGenerating(true);
    setLastFetchFailed(false);
    try {
      const { data, error } = await supabase.functions.invoke("generate-code", {
        body: {
          language: "simple",
          topic: "Generate a typing practice paragraph of 50-80 words. Use natural, flowing English prose on any interesting topic. No special characters or formatting — just plain text with proper punctuation and capitalization.",
        },
      });
      if (error || !data?.code) throw new Error("Fetch failed");
      setCurrentText(data.code.trim());
    } catch {
      setLastFetchFailed(true);
      toast({ title: "AI Generation Offline", description: "Using built-in paragraph database.", variant: "default" });
      setCurrentText(generateParagraph());
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTyping && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsTyping(false);
      setTestCompleted(true);
    }
    return () => clearInterval(interval);
  }, [isTyping, timeLeft]);

  const handleStart = () => setIsTyping(true);
  const handlePause = () => setIsTyping(false);
  const handleReset = () => {
    setIsTyping(false);
    setTimeLeft(120);
    setTypedText("");
    setWpm(0);
    setAccuracy(100);
    setTestCompleted(false);
    setTestSubmitted(false);
    setKeyErrors({});
    setCurrentText(generateParagraph());
  };

  const handleSubmitTest = async () => {
    if (!user) {
      toast({ title: "Authentication Required", description: "Please log in to save results.", variant: "destructive" });
      return;
    }
    try {
      const testDuration = 120 - timeLeft;
      const characterCount = typedText.length;
      const correctCharacters = Math.round((accuracy / 100) * characterCount);
      const errors = characterCount - correctCharacters;

      const { error } = await supabase.from("typing_tests").insert({
        user_id: user.id, wpm, accuracy, test_duration: testDuration, language: "paragraph",
        character_count: characterCount, correct_characters: correctCharacters, errors, key_errors: keyErrors,
      });

      if (error) {
        toast({ title: "Error", description: "Failed to save test result.", variant: "destructive" });
      } else {
        setTestSubmitted(true);
        toast({ title: "Test Submitted!", description: `${wpm} WPM with ${accuracy}% accuracy.` });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save test result.", variant: "destructive" });
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isTyping) return;
    const newText = e.target.value;
    if (newText.length > typedText.length) {
      const newIndex = newText.length - 1;
      if (newText[newIndex] !== currentText[newIndex]) {
        setKeyErrors((prev) => ({ ...prev, [newText[newIndex].toLowerCase()]: (prev[newText[newIndex].toLowerCase()] || 0) + 1 }));
      }
    }
    setTypedText(newText);
    const wordsTyped = newText.split(" ").length;
    const timeElapsed = (120 - timeLeft) / 60;
    setWpm(timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0);
    let correct = 0;
    for (let i = 0; i < newText.length; i++) if (newText[i] === currentText[i]) correct++;
    setAccuracy(newText.length > 0 ? Math.round((correct / newText.length) * 100) : 100);
  };

  const getCharacterClass = (index: number) => {
    if (index >= typedText.length) return "text-muted-foreground";
    if (typedText[index] === currentText[index]) return "text-foreground bg-primary/10 rounded-sm px-[1px]";
    return "text-destructive bg-destructive/10 rounded-sm px-[1px]";
  };

  const progress = currentText.length > 0 ? (typedText.length / currentText.length) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Stats */}
      <MinimalCard className="flex flex-col gap-6 p-6 px-8 bg-surface/50 border-border/30">
        {/* Primary Metrics Layer */}
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-8 sm:gap-14">
            <StatInline
              label="Efficiency"
              value={wpm}
              subValue={`${Math.max(0, wpm - 5)} avg`}
              className="text-xl"
            />
            <StatInline
              label="Precision"
              value={accuracy}
              subValue="%"
              className="text-xl"
            />
            <StatInline
              label="Focus"
              value={timeLeft}
              subValue="sec"
              className="text-xl"
            />
            <StatInline
              label="Score"
              value={Math.round(wpm * (accuracy / 100) * 10)}
              className="text-xl hidden md:flex"
            />
          </div>

          <div className="flex items-center gap-3">
            {!isTyping ? (
              <Button onClick={handleStart} size="sm" className="rounded-full px-6"><Play className="w-4 h-4 mr-2" />Start</Button>
            ) : (
              <Button onClick={handlePause} variant="secondary" size="sm" className="rounded-full px-6"><Pause className="w-4 h-4 mr-2" />Pause</Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleReset} className="h-9 w-9 p-0 rounded-full">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Analytic Metadata Layer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-border/20">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
              <span>Calibration Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 w-full bg-muted/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">Accuracy Streak</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className={`h-1.5 w-6 rounded-full transition-colors ${accuracy > 95 ? 'bg-green-500/50' : 'bg-muted/30'}`} />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">Sync Status</span>
              <span className="text-[11px] font-mono text-foreground/80 lowercase">{isTyping ? 'Synchronized' : 'Standby'}</span>
            </div>
          </div>
        </div>
      </MinimalCard>

      {/* Typing Area */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Paragraph Typing
            </span>
            <div className="flex space-x-2">
              {!isTyping ? (
                <Button onClick={handleStart} size="sm"><Play className="w-4 h-4 mr-2" />Start</Button>
              ) : (
                <Button onClick={handlePause} variant="secondary" size="sm"><Pause className="w-4 h-4 mr-2" />Pause</Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={generateAIText}
                disabled={isTyping || isGenerating}
                className="border-primary/50 text-primary hover:bg-primary/10"
              >
                {isGenerating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" />Generative Text</>
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative border border-border/50 rounded-xl bg-surface/50 backdrop-blur-md overflow-hidden min-h-[200px] flex shadow-[inset_0_4px_30px_rgba(0,0,0,0.1)]">
            {/* Index Column */}
            <div className="w-12 bg-muted/20 border-r border-border/20 flex flex-col items-end pt-8 pr-3 gap-6 select-none text-[10px] font-mono text-muted-foreground/30 leading-none">
              {[1, 2, 3, 4, 5].map(n => <div key={n}>{n.toString().padStart(2, '0')}</div>)}
            </div>

            <div className="flex-1 p-8 overflow-auto relative">
              <p className="text-xl leading-[2] whitespace-pre-wrap w-full font-mono tracking-tight text-left relative z-10">
                {currentText.split("").map((char, index) => (
                  <span key={index} className="relative">
                    {index === typedText.length && isTyping && (
                      <motion.span
                        layoutId="paragraph-caret"
                        className="absolute left-0 top-[10%] bottom-[10%] w-[2px] bg-primary shadow-[0_0_10px_hsl(var(--primary))] rounded-full"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                    <span className={`${getCharacterClass(index)} transition-all duration-150`}>
                      {char}
                    </span>
                  </span>
                ))}
              </p>

              {/* Background watermark for precision feel */}
              <div className="absolute top-0 right-0 p-4 opacity-[0.02] pointer-events-none select-none">
                <FileText className="w-32 h-32" />
              </div>
            </div>
          </div>
          <textarea
            value={typedText}
            onChange={handleTextChange}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                if (!isTyping) return;
                const target = e.target as HTMLTextAreaElement;
                const start = target.selectionStart;
                const spaces = "    ";
                const newText = typedText.slice(0, start) + spaces + typedText.slice(start);
                const syntheticEvent = { target: { value: newText } } as React.ChangeEvent<HTMLTextAreaElement>;
                handleTextChange(syntheticEvent);
                setTimeout(() => { target.selectionStart = target.selectionEnd = start + 4; }, 0);
              }
            }}
            placeholder={isTyping ? "Start typing the paragraph..." : "Click Start to begin"}
            disabled={!isTyping}
            onPaste={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            className="w-full h-32 p-4 bg-surface border border-border/50 rounded-lg resize-none focus:border-primary focus:outline-none text-sm disabled:opacity-50"
          />

          {/* Real-time Feedback Engine */}
          <AnimationContainer delay={0.2}>
            <VirtualKeyboard keyErrors={keyErrors} />
          </AnimationContainer>


          {testCompleted && !testSubmitted && (
            <div className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-primary/10 to-secondary-glow/10 rounded-lg border border-primary/20">
              <h3 className="font-semibold text-lg">Test Complete!</h3>
              <Button onClick={handleSubmitTest} size="lg"><Target className="w-4 h-4 mr-2" />Submit Test Results</Button>
            </div>
          )}
          {testSubmitted && (
            <div className="flex items-center justify-center gap-2 p-4 bg-primary/10 rounded-lg border border-primary/20">
              <Target className="w-5 h-5 text-primary" />
              <span className="font-medium text-primary">Test submitted successfully!</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ParagraphTyping;
