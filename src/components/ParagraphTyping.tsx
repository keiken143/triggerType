import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Play,
  Pause,
  RotateCcw,
  Timer,
  Target,
  Zap,
  TrendingUp,
  FileText,
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
  const { user } = useAuth();
  const { toast } = useToast();

  const generateParagraph = useCallback(() => {
    return paragraphs[Math.floor(Math.random() * paragraphs.length)];
  }, []);

  useEffect(() => {
    setCurrentText(generateParagraph());
  }, [generateParagraph]);

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
    if (typedText[index] === currentText[index]) return "text-primary bg-primary/10";
    return "text-destructive bg-destructive/10";
  };

  const progress = currentText.length > 0 ? (typedText.length / currentText.length) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Timer, label: "Time Left", value: `${timeLeft}s`, color: "text-primary", bg: "bg-primary/10" },
          { icon: Zap, label: "WPM", value: wpm, color: "text-secondary-glow", bg: "bg-secondary-glow/10" },
          { icon: Target, label: "Accuracy", value: `${accuracy}%`, color: "text-primary", bg: "bg-primary/10" },
          { icon: TrendingUp, label: "Progress", value: `${Math.round(progress)}%`, color: "text-secondary-glow", bg: "bg-secondary-glow/10" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <Card key={label} className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4 flex items-center space-x-3">
              <div className={`p-2 ${bg} rounded-lg`}><Icon className={`w-5 h-5 ${color}`} /></div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
              <Button onClick={handleReset} variant="outline" size="sm"><RotateCcw className="w-4 h-4 mr-2" />Reset</Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 bg-surface rounded-lg border border-border/50 overflow-auto min-h-[150px] flex items-center justify-center">
            <p className="text-base leading-relaxed whitespace-pre-wrap w-full">
              {currentText.split("").map((char, index) => (
                <span key={index} className={`${getCharacterClass(index)} transition-all duration-150`}>{char}</span>
              ))}
            </p>
          </div>
          <textarea
            value={typedText}
            onChange={handleTextChange}
            placeholder={isTyping ? "Start typing the paragraph..." : "Click Start to begin"}
            disabled={!isTyping}
            onPaste={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            className="w-full h-32 p-4 bg-surface border border-border/50 rounded-lg resize-none focus:border-primary focus:outline-none text-sm disabled:opacity-50"
          />

          <div className="flex items-center justify-between">
            <Button onClick={handleReset} variant="ghost" size="sm" disabled={isTyping}>
              <RotateCcw className="w-4 h-4 mr-2" />New Paragraph
            </Button>
          </div>

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
