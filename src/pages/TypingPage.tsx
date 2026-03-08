import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import TouchTyping from "@/components/TouchTyping";
import ParagraphTyping from "@/components/ParagraphTyping";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { 
  Play, Pause, RotateCcw, Timer, Target, Zap, TrendingUp,
  Code, Sparkles, Brain, Keyboard, FileText, CheckCircle2,
} from "lucide-react";

const languageTypes = ["simple", "javascript", "typescript", "python", "java", "csharp", "cpp", "rust"] as const;
type LanguageType = typeof languageTypes[number];

const CODE_TIME_OPTIONS = [
  { label: "1m", value: 60 },
  { label: "3m", value: 180 },
  { label: "∞", value: 0 },
];

const LANGUAGE_LABELS: Record<string, string> = {
  simple: "Simple", javascript: "JavaScript", typescript: "TypeScript",
  python: "Python", java: "Java", csharp: "C#", cpp: "C++", rust: "Rust",
};

const TypingPage = () => {
  const [isTyping, setIsTyping] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageType>("javascript");
  const [currentText, setCurrentText] = useState("");
  const [typedText, setTypedText] = useState("");
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [testCompleted, setTestCompleted] = useState(false);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customTopic, setCustomTopic] = useState("");
  const [keyErrors, setKeyErrors] = useState<Record<string, number>>({});
  const [isAdaptiveMode, setIsAdaptiveMode] = useState(false);
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState("");
  const [adaptiveMetrics, setAdaptiveMetrics] = useState<any>(null);
  const [testCount, setTestCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef(0);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => { if (!currentText) generateTextForLanguage(selectedLanguage); }, []);

  useEffect(() => {
    const fetchTestCount = async () => {
      if (!user) return;
      const { count } = await supabase.from('typing_tests').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      setTestCount(count || 0);
    };
    fetchTestCount();
  }, [user]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTyping && selectedDuration > 0 && timeLeft > 0) interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    else if (selectedDuration > 0 && timeLeft === 0) { setIsTyping(false); setTestCompleted(true); }
    if (isTyping && selectedDuration === 0) interval = setInterval(() => setElapsedTime(Math.round((Date.now() - startTimeRef.current) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [isTyping, timeLeft, selectedDuration]);

  const handleSubmitTest = async () => {
    if (!user) { toast({ title: "Authentication Required", description: "Please log in to save your test results.", variant: "destructive" }); return; }
    try {
      const testDuration = selectedDuration > 0 ? selectedDuration - timeLeft : Math.round((Date.now() - startTimeRef.current) / 1000);
      const characterCount = typedText.length;
      const correctCharacters = Math.round((accuracy / 100) * characterCount);
      const errors = characterCount - correctCharacters;
      const { error } = await supabase.from('typing_tests').insert({
        user_id: user.id, wpm, accuracy, test_duration: testDuration, language: selectedLanguage,
        character_count: characterCount, correct_characters: correctCharacters, errors, key_errors: keyErrors
      });
      if (error) toast({ title: "Error", description: "Failed to save test result.", variant: "destructive" });
      else { setTestSubmitted(true); setTestCount(prev => prev + 1); toast({ title: "Test Submitted!", description: `${wpm} WPM with ${accuracy}% accuracy.` }); }
    } catch { toast({ title: "Error", description: "Failed to save test result.", variant: "destructive" }); }
  };

  const handleStart = () => { startTimeRef.current = Date.now(); setIsTyping(true); };
  const handlePause = () => setIsTyping(false);
  const handleReset = () => {
    setIsTyping(false); setTimeLeft(selectedDuration); setTypedText(""); setWpm(0); setAccuracy(100);
    setTestCompleted(false); setTestSubmitted(false); setKeyErrors({}); setElapsedTime(0);
  };

  const generateTextForLanguage = async (language: LanguageType) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-code', { body: { language, topic: customTopic.trim() || undefined } });
      if (error) throw error;
      if (data.error) { toast({ title: "Error", description: data.error, variant: "destructive" }); return; }
      setCurrentText(data.code);
    } catch { toast({ title: "Error", description: "Failed to generate typing text.", variant: "destructive" }); }
    finally { setIsGenerating(false); }
  };

  const handleLanguageChange = (language: LanguageType) => {
    if (isTyping) return;
    setSelectedLanguage(language); setTypedText(""); setWpm(0); setAccuracy(100);
    setTestCompleted(false); setTestSubmitted(false); setKeyErrors({});
    generateTextForLanguage(language);
  };

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-code', { body: { language: selectedLanguage, topic: customTopic.trim() || undefined } });
      if (error) throw error;
      if (data.error) { toast({ title: "Error", description: data.error, variant: "destructive" }); return; }
      setCurrentText(data.code); setTypedText(""); setWpm(0); setAccuracy(100);
      setTestCompleted(false); setTestSubmitted(false); setKeyErrors({}); setIsAdaptiveMode(false);
    } catch { toast({ title: "Error", description: "Failed to generate content.", variant: "destructive" }); }
    finally { setIsGenerating(false); }
  };

  const handleAdaptivePractice = async () => {
    if (!user) { toast({ title: "Authentication Required", description: "Please log in.", variant: "destructive" }); return; }
    if (testCount < 5) { toast({ title: "More Practice Needed", description: `Complete ${5 - testCount} more tests.`, variant: "destructive" }); return; }
    setIsGenerating(true); setIsAdaptiveMode(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data, error } = await supabase.functions.invoke('generate-adaptive-practice', {
        headers: { Authorization: `Bearer ${session.access_token}` }, body: { language: selectedLanguage },
      });
      if (error) throw error;
      if (data.error) { setIsAdaptiveMode(false); return; }
      setCurrentText(data.text); setAdaptiveDifficulty(data.difficultyDescription);
      setAdaptiveMetrics(data.metrics); setTypedText(""); setWpm(0); setAccuracy(100);
      setTestCompleted(false); setTestSubmitted(false); setKeyErrors({});
    } catch { setIsAdaptiveMode(false); }
    finally { setIsGenerating(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (!isTyping) return;
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = typedText.substring(0, start) + '\t' + typedText.substring(end);
      setTypedText(newText);
      setTimeout(() => { textarea.selectionStart = textarea.selectionEnd = start + 1; }, 0);
      const wordsTyped = newText.split(' ').length;
      const timeElapsed = selectedDuration > 0 ? (selectedDuration - timeLeft) / 60 : (Date.now() - startTimeRef.current) / 60000;
      setWpm(timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0);
      let correct = 0;
      for (let i = 0; i < newText.length; i++) if (newText[i] === currentText[i]) correct++;
      setAccuracy(newText.length > 0 ? Math.round((correct / newText.length) * 100) : 100);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isTyping) return;
    const newText = e.target.value;
    if (newText.length > typedText.length) {
      const newIndex = newText.length - 1;
      if (newText[newIndex] !== currentText[newIndex]) setKeyErrors(prev => ({ ...prev, [newText[newIndex].toLowerCase()]: (prev[newText[newIndex].toLowerCase()] || 0) + 1 }));
    }
    setTypedText(newText);
    const wordsTyped = newText.split(' ').length;
    const timeElapsed = selectedDuration > 0 ? (selectedDuration - timeLeft) / 60 : (Date.now() - startTimeRef.current) / 60000;
    setWpm(timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0);
    let correct = 0;
    for (let i = 0; i < newText.length; i++) if (newText[i] === currentText[i]) correct++;
    setAccuracy(newText.length > 0 ? Math.round((correct / newText.length) * 100) : 100);
  };

  const getCharacterClass = (index: number) => {
    if (index >= typedText.length) return "text-muted-foreground/60";
    if (typedText[index] === currentText[index]) return "text-primary";
    return "text-destructive bg-destructive/10 rounded-sm";
  };

  const progress = currentText.length > 0 ? (typedText.length / currentText.length) * 100 : 0;
  const timeDisplay = selectedDuration === 0
    ? `${Math.floor(elapsedTime / 60)}:${(elapsedTime % 60).toString().padStart(2, '0')}`
    : `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "var(--pattern-grid)" }} />
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 pt-24 pb-12 max-w-5xl">
        <Tabs defaultValue="typing" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 h-10 bg-card/60 border border-border/30 rounded-xl p-1">
            <TabsTrigger value="typing" className="rounded-lg text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
              <Keyboard className="w-3.5 h-3.5 mr-1.5" />Typing
            </TabsTrigger>
            <TabsTrigger value="code-typing" className="rounded-lg text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
              <Code className="w-3.5 h-3.5 mr-1.5" />Code Typing
            </TabsTrigger>
          </TabsList>

          {/* Typing Tab */}
          <TabsContent value="typing">
            <Tabs defaultValue="touch" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-card/40 border border-border/20 rounded-lg h-9 p-0.5">
                <TabsTrigger value="touch" className="rounded-md text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                  <Keyboard className="w-3.5 h-3.5 mr-1.5" />Touch Typing
                </TabsTrigger>
                <TabsTrigger value="paragraph" className="rounded-md text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                  <FileText className="w-3.5 h-3.5 mr-1.5" />Paragraph
                </TabsTrigger>
              </TabsList>
              <TabsContent value="touch"><TouchTyping /></TabsContent>
              <TabsContent value="paragraph"><ParagraphTyping /></TabsContent>
            </Tabs>
          </TabsContent>

          {/* Code Typing Tab */}
          <TabsContent value="code-typing">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
              
              {/* Stats Bar */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-muted-foreground" />
                    <span className="text-lg font-bold tabular-nums">{timeDisplay}</span>
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
                  {CODE_TIME_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      disabled={isTyping}
                      onClick={() => { setSelectedDuration(opt.value); setTimeLeft(opt.value); }}
                      className={`px-2.5 py-1 text-xs rounded-md transition-all ${
                        selectedDuration === opt.value ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      } disabled:opacity-50`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language & AI Generator Row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Select value={selectedLanguage} onValueChange={handleLanguageChange} disabled={isTyping}>
                  <SelectTrigger className="w-full sm:w-40 h-9 bg-card/60 border-border/30 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languageTypes.filter(l => l !== 'simple').map(l => (
                      <SelectItem key={l} value={l}>{LANGUAGE_LABELS[l]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex-1 flex gap-2 w-full">
                  <input
                    type="text"
                    placeholder="Topic (optional)"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    disabled={isTyping || isGenerating}
                    className="flex-1 h-9 px-3 bg-card/60 border border-border/30 rounded-lg text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 disabled:opacity-50 transition-all"
                  />
                  <Button onClick={handleGenerateCode} disabled={isTyping || isGenerating} size="sm" className="h-9 text-xs shrink-0">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </Button>
                </div>
              </div>

              {/* Adaptive Practice */}
              {user && testCount >= 5 && (
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/8 to-secondary-glow/8 rounded-xl border border-primary/15">
                  <Brain className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">Adaptive Mode</span>
                    {isAdaptiveMode && adaptiveDifficulty && (
                      <span className="text-xs text-primary ml-2">· {adaptiveDifficulty}</span>
                    )}
                  </div>
                  <Button onClick={handleAdaptivePractice} disabled={isTyping || isGenerating} size="sm" variant="ghost" className="h-8 text-xs text-primary hover:bg-primary/10 shrink-0">
                    <Brain className="w-3.5 h-3.5 mr-1" />
                    {isAdaptiveMode ? 'Regenerate' : 'Activate'}
                  </Button>
                </div>
              )}

              {user && testCount < 5 && (
                <div className="flex items-center gap-3 p-3 bg-card/40 rounded-xl border border-border/20">
                  <Brain className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <span className="text-xs text-muted-foreground">Adaptive Practice unlocks after {5 - testCount} more tests</span>
                  </div>
                  <Progress value={(testCount / 5) * 100} className="w-20 h-1.5" />
                </div>
              )}

              {/* Code Typing Area */}
              <Card className={`border-border/30 bg-card/40 overflow-hidden transition-all duration-300 ${
                isTyping ? 'sticky top-16 z-40 shadow-lg shadow-background/50' : ''
              }`}>
                <CardContent className="p-0">
                  {/* Controls bar */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border/20 bg-card/60">
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Code className="w-4 h-4" />
                      {isAdaptiveMode ? `Adaptive · ${adaptiveDifficulty}` : LANGUAGE_LABELS[selectedLanguage]}
                    </span>
                    <div className="flex items-center gap-2">
                      {!isTyping ? (
                        <Button onClick={handleStart} size="sm" className="h-8 px-4 text-xs" disabled={!currentText || isGenerating}>
                          <Play className="w-3.5 h-3.5 mr-1.5" />Start
                        </Button>
                      ) : (
                        <Button onClick={handlePause} variant="secondary" size="sm" className="h-8 px-4 text-xs">
                          <Pause className="w-3.5 h-3.5 mr-1.5" />Pause
                        </Button>
                      )}
                      {selectedDuration === 0 && isTyping && (
                        <Button onClick={() => { setIsTyping(false); setTestCompleted(true); }} size="sm" className="h-8 px-3 text-xs">
                          <Target className="w-3.5 h-3.5 mr-1" />Finish
                        </Button>
                      )}
                      <Button onClick={handleReset} variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Code display */}
                  <div className="p-6 min-h-[220px] flex items-center justify-center">
                    {isGenerating ? (
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <Sparkles className="w-6 h-6 animate-pulse text-primary" />
                        <p className="text-sm">Generating code...</p>
                      </div>
                    ) : !currentText ? (
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <Code className="w-6 h-6" />
                        <p className="text-sm">Select a language to generate code</p>
                      </div>
                    ) : (
                      <pre className="text-sm leading-[2] whitespace-pre-wrap w-full font-mono tracking-wide">
                        {currentText.split('').map((char, index) => (
                          <span key={index} className={`${getCharacterClass(index)} transition-colors duration-100`}>{char}</span>
                        ))}
                      </pre>
                    )}
                  </div>

                  {/* Input */}
                  <div className="px-5 pb-5">
                    <textarea
                      value={typedText}
                      onChange={handleTextChange}
                      onKeyDown={handleKeyDown}
                      placeholder={isGenerating ? 'Generating...' : isTyping ? 'Type the code here...' : 'Click Start to begin'}
                      disabled={!isTyping || isGenerating}
                      onPaste={(e) => e.preventDefault()}
                      onCut={(e) => e.preventDefault()}
                      onCopy={(e) => e.preventDefault()}
                      onDrop={(e) => e.preventDefault()}
                      onDragOver={(e) => e.preventDefault()}
                      className="w-full h-36 p-4 bg-surface/50 border border-border/30 rounded-xl resize-none focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 text-sm disabled:opacity-40 font-mono whitespace-pre leading-[2] tracking-wide transition-all"
                    />
                  </div>

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

              {/* Instructions - compact */}
              <div className="px-1 text-xs text-muted-foreground space-y-1">
                <p>• Select a language and click <strong>Start</strong> to begin • Characters highlight as you type — <span className="text-primary">correct</span> / <span className="text-destructive">incorrect</span></p>
                <p>• Use <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Tab</kbd> for indentation • WPM and accuracy update in real-time</p>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TypingPage;
