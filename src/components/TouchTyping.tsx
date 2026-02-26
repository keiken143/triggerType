import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
  Keyboard,
  Sparkles,
  Loader2,
} from "lucide-react";

const touchTypingLessons = [
  { name: "Home Row", keys: "asdf jkl;", words: ["sad", "lad", "flask", "jaffa", "salad", "falls", "ask", "all", "shall", "lass", "dads", "fads", "adds", "skald"] },
  { name: "Top Row", keys: "qwer uiop", words: ["wire", "pour", "quip", "ripe", "wipe", "rope", "pier", "quire", "power", "tower", "opaque", "require"] },
  { name: "Bottom Row", keys: "zxcv bnm,", words: ["zinc", "bomb", "vex", "calm", "climb", "crumb", "ван", "mix", "box", "next", "convex", "maxim"] },
  { name: "Numbers", keys: "1234567890", words: ["123", "456", "789", "1024", "2048", "3690", "5050", "9876", "1357", "2468"] },
  { name: "Mixed Practice", keys: "all keys", words: ["the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "sphinx", "of", "black", "quartz", "judge", "my", "vow", "pack", "box", "with", "five", "dozen", "liquor", "jugs"] },
];

const TouchTyping = () => {
  const [selectedLesson, setSelectedLesson] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
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

  const generateLessonText = useCallback((lessonIndex: number) => {
    const lesson = touchTypingLessons[lessonIndex];
    const words: string[] = [];
    for (let i = 0; i < 40; i++) {
      words.push(lesson.words[Math.floor(Math.random() * lesson.words.length)]);
    }
    return words.join(" ");
  }, []);

  const generateAIText = async () => {
    const lesson = touchTypingLessons[selectedLesson];
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-code", {
        body: {
          language: "simple",
          topic: `Generate a typing practice paragraph using ONLY words that can be formed from these keys: ${lesson.keys}. The text should be 40-60 words long, lowercase, no punctuation except spaces. Focus on real English words using only those letters. Do NOT include any other characters.`,
        },
      });
      if (error) throw error;
      if (data?.code) {
        setCurrentText(data.code.trim());
      } else {
        throw new Error("No text generated");
      }
    } catch {
      toast({ title: "Generation failed", description: "Using preset words instead.", variant: "destructive" });
      setCurrentText(generateLessonText(selectedLesson));
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    setCurrentText(generateLessonText(selectedLesson));
  }, [selectedLesson, generateLessonText]);

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
    setTimeLeft(60);
    setTypedText("");
    setWpm(0);
    setAccuracy(100);
    setTestCompleted(false);
    setTestSubmitted(false);
    setKeyErrors({});
    setCurrentText(generateLessonText(selectedLesson));
  };

  const handleSubmitTest = async () => {
    if (!user) {
      toast({ title: "Authentication Required", description: "Please log in to save your test results.", variant: "destructive" });
      return;
    }
    try {
      const testDuration = 60 - timeLeft;
      const characterCount = typedText.length;
      const correctCharacters = Math.round((accuracy / 100) * characterCount);
      const errors = characterCount - correctCharacters;

      const { error } = await supabase.from("typing_tests").insert({
        user_id: user.id, wpm, accuracy, test_duration: testDuration, language: "touch-typing",
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
    const timeElapsed = (60 - timeLeft) / 60;
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

      {/* Lesson Selection */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Keyboard className="w-5 h-5" />
            <span>Touch Typing Lessons</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {touchTypingLessons.map((lesson, index) => (
              <Button
                key={lesson.name}
                variant={selectedLesson === index ? "default" : "outline"}
                size="sm"
                onClick={() => { if (!isTyping) setSelectedLesson(index); }}
                disabled={isTyping}
              >
                {lesson.name}
              </Button>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-sm text-muted-foreground">
              Focus keys: <span className="font-mono text-primary">{touchTypingLessons[selectedLesson].keys}</span>
            </p>
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
        </CardContent>
      </Card>

      {/* Typing Area */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Touch Typing - {touchTypingLessons[selectedLesson].name}</span>
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
            <p className="text-lg leading-relaxed whitespace-pre-wrap w-full">
              {currentText.split("").map((char, index) => (
                <span key={index} className={`${getCharacterClass(index)} transition-all duration-150`}>{char}</span>
              ))}
            </p>
          </div>
          <textarea
            value={typedText}
            onChange={handleTextChange}
            placeholder={isTyping ? "Start typing..." : "Click Start to begin"}
            disabled={!isTyping}
            onPaste={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            className="w-full h-32 p-4 bg-surface border border-border/50 rounded-lg resize-none focus:border-primary focus:outline-none text-sm disabled:opacity-50"
          />

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

export default TouchTyping;
