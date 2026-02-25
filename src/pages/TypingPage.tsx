import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
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
  Code,
  Sparkles,
  Brain
} from "lucide-react";

const languageTypes = ["simple", "javascript", "typescript", "python", "java", "csharp", "cpp", "rust"] as const;
type LanguageType = typeof languageTypes[number];

const TypingPage = () => {
  const [isTyping, setIsTyping] = useState(false);
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
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Auto-generate text when language changes or on initial load
  useEffect(() => {
    if (!currentText) {
      generateTextForLanguage(selectedLanguage);
    }
  }, []);

  // Fetch test count for progress display
  useEffect(() => {
    const fetchTestCount = async () => {
      if (!user) return;
      const { count } = await supabase
        .from('typing_tests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      setTestCount(count || 0);
    };
    fetchTestCount();
  }, [user]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTyping && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTyping(false);
      setTestCompleted(true);
    }
    return () => clearInterval(interval);
  }, [isTyping, timeLeft]);

  const handleSubmitTest = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save your test results.",
        variant: "destructive",
      });
      return;
    }

    try {
      const testDuration = 60 - timeLeft;
      const characterCount = typedText.length;
      const correctCharacters = Math.round((accuracy / 100) * characterCount);
      const errors = characterCount - correctCharacters;

      const { error } = await supabase
        .from('typing_tests')
        .insert({
          user_id: user.id,
          wpm: wpm,
          accuracy: accuracy,
          test_duration: testDuration,
          language: selectedLanguage,
          character_count: characterCount,
          correct_characters: correctCharacters,
          errors: errors,
          key_errors: keyErrors
        });

      if (error) {
        console.error('Error saving test result:', error);
        toast({
          title: "Error",
          description: "Failed to save test result. Please try again.",
          variant: "destructive",
        });
      } else {
        setTestSubmitted(true);
        setTestCount(prev => prev + 1);
        toast({
          title: "Test Submitted Successfully!",
          description: `${wpm} WPM with ${accuracy}% accuracy. Result saved to your progress.`,
        });
      }
    } catch (error) {
      console.error('Error saving test result:', error);
      toast({
        title: "Error",
        description: "Failed to save test result. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStart = () => {
    setIsTyping(true);
  };

  const handlePause = () => {
    setIsTyping(false);
  };

  const handleReset = () => {
    setIsTyping(false);
    setTimeLeft(60);
    setTypedText("");
    setWpm(0);
    setAccuracy(100);
    setTestCompleted(false);
    setTestSubmitted(false);
    setKeyErrors({});
  };

  const generateTextForLanguage = async (language: LanguageType) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-code', {
        body: { 
          language: language,
          topic: customTopic.trim() || undefined
        }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setCurrentText(data.code);
    } catch (error) {
      console.error('Error generating text:', error);
      toast({
        title: "Error",
        description: "Failed to generate typing text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLanguageChange = (language: LanguageType) => {
    if (isTyping) return; // Don't allow language change during typing
    setSelectedLanguage(language);
    setTypedText("");
    setWpm(0);
    setAccuracy(100);
    setTestCompleted(false);
    setTestSubmitted(false);
    setKeyErrors({});
    generateTextForLanguage(language);
  };

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-code', {
        body: { 
          language: selectedLanguage,
          topic: customTopic.trim() || undefined
        }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setCurrentText(data.code);
      setTypedText("");
      setWpm(0);
      setAccuracy(100);
      setTestCompleted(false);
      setTestSubmitted(false);
      setKeyErrors({});
      setIsAdaptiveMode(false);
      
      toast({
        title: "Text Generated!",
        description: "AI has generated new typing content for you to practice.",
      });
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Error",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAdaptivePractice = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to use adaptive practice mode.",
        variant: "destructive",
      });
      return;
    }

    if (testCount < 5) {
      toast({
        title: "More Practice Needed",
        description: `Complete ${5 - testCount} more test${5 - testCount === 1 ? '' : 's'} to unlock adaptive practice mode.`,
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setIsAdaptiveMode(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to use adaptive practice.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-adaptive-practice', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.error) {
        if (data.error.includes('Rate limit')) {
          toast({
            title: "Rate Limit Exceeded",
            description: "Please try again later.",
            variant: "destructive",
          });
        } else if (data.error.includes('payment')) {
          toast({
            title: "Payment Required",
            description: "Please add credits to your workspace.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: data.error,
            variant: "destructive",
          });
        }
        setIsAdaptiveMode(false);
        return;
      }

      setCurrentText(data.text);
      setAdaptiveDifficulty(data.difficultyDescription);
      setAdaptiveMetrics(data.metrics);
      setTypedText("");
      setWpm(0);
      setAccuracy(100);
      setTestCompleted(false);
      setTestSubmitted(false);
      setKeyErrors({});
      
      toast({
        title: "Adaptive Practice Ready!",
        description: `Generated ${data.difficultyDescription} practice text based on your performance.`,
      });
    } catch (error) {
      console.error('Error generating adaptive practice:', error);
      toast({
        title: "Error",
        description: "Failed to generate adaptive practice. Please try again.",
        variant: "destructive",
      });
      setIsAdaptiveMode(false);
    } finally {
      setIsGenerating(false);
    }
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
      
      // Set cursor position after the inserted tab
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }, 0);
      
      // Calculate WPM and accuracy for the new text
      const wordsTyped = newText.split(' ').length;
      const timeElapsed = (60 - timeLeft) / 60;
      const currentWpm = timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0;
      setWpm(currentWpm);
      
      let correct = 0;
      for (let i = 0; i < newText.length; i++) {
        if (newText[i] === currentText[i]) correct++;
      }
      const currentAccuracy = newText.length > 0 ? Math.round((correct / newText.length) * 100) : 100;
      setAccuracy(currentAccuracy);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isTyping) return;
    
    const newText = e.target.value;
    
    // Track key errors - check if a new character was added incorrectly
    if (newText.length > typedText.length) {
      const newIndex = newText.length - 1;
      const typedChar = newText[newIndex];
      const expectedChar = currentText[newIndex];
      
      if (typedChar !== expectedChar) {
        setKeyErrors(prev => ({
          ...prev,
          [typedChar.toLowerCase()]: (prev[typedChar.toLowerCase()] || 0) + 1
        }));
      }
    }
    
    setTypedText(newText);
    
    // Calculate WPM
    const wordsTyped = newText.split(' ').length;
    const timeElapsed = (60 - timeLeft) / 60;
    const currentWpm = timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0;
    setWpm(currentWpm);
    
    // Calculate accuracy
    let correct = 0;
    for (let i = 0; i < newText.length; i++) {
      if (newText[i] === currentText[i]) correct++;
    }
    const currentAccuracy = newText.length > 0 ? Math.round((correct / newText.length) * 100) : 100;
    setAccuracy(currentAccuracy);
  };

  const getCharacterClass = (index: number) => {
    if (index >= typedText.length) return "text-muted-foreground";
    if (typedText[index] === currentText[index]) return "text-primary bg-primary/10";
    return "text-destructive bg-destructive/10";
  };

  const progress = currentText.length > 0 ? (typedText.length / currentText.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-background">
      <div 
        className="fixed inset-0 opacity-5"
        style={{ backgroundImage: "var(--pattern-grid)" }}
      />
      
      <Navbar />
      
      <div className="container mx-auto px-6 pt-24 pb-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Timer className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time Left</p>
                <p className="text-2xl font-bold">{timeLeft}s</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 bg-secondary-glow/10 rounded-lg">
                <Zap className="w-6 h-6 text-secondary-glow" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">WPM</p>
                <p className="text-2xl font-bold">{wpm}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Accuracy</p>
                <p className="text-2xl font-bold">{accuracy}%</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 bg-secondary-glow/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-secondary-glow" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold">{Math.round(progress)}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Adaptive Practice Section */}
        {user && testCount >= 5 && (
          <Card className="mb-8 bg-gradient-to-br from-primary/10 via-secondary-glow/10 to-primary/10 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-primary" />
                <span>Adaptive Practice Mode</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                AI-powered practice sessions tailored to your performance. Difficulty automatically adjusts as you improve.
              </p>
              
              {isAdaptiveMode && adaptiveDifficulty && (
                <div className="p-3 bg-card/50 rounded-lg border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Current Difficulty</span>
                    <span className="text-sm text-primary">{adaptiveDifficulty}</span>
                  </div>
                  {adaptiveMetrics && (
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <div>Avg WPM: {adaptiveMetrics.avgWpm}</div>
                      <div>Accuracy: {adaptiveMetrics.avgAccuracy}%</div>
                      <div>Focus Areas: {adaptiveMetrics.problemKeys.length}</div>
                    </div>
                  )}
                </div>
              )}
              
              <Button
                onClick={handleAdaptivePractice}
                disabled={isTyping || isGenerating}
                className="w-full"
                variant={isAdaptiveMode ? "secondary" : "default"}
              >
                <Brain className="w-4 h-4 mr-2" />
                {isGenerating ? 'Generating...' : isAdaptiveMode ? 'Generate New Adaptive Session' : 'Start Adaptive Practice'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Heatmap Progress for users with less than 5 tests */}
        {user && testCount < 5 && (
          <Card className="mb-8 bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 space-y-3">
                  <h3 className="font-semibold">Unlock Adaptive Practice</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete {5 - testCount} more typing {5 - testCount === 1 ? 'test' : 'tests'} to unlock AI-powered adaptive practice mode and your personalized keyboard heatmap.
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{testCount}/5 tests</span>
                    </div>
                    <Progress value={(testCount / 5) * 100} className="h-2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Language Selection */}
        <Card className="mb-8 bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Code className="w-5 h-5" />
              <span>Select Typing Mode</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Select 
                value={selectedLanguage} 
                onValueChange={handleLanguageChange}
                disabled={isTyping}
              >
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="Choose typing mode" />
                </SelectTrigger>
                <SelectContent>
                  
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="csharp">C#</SelectItem>
                  <SelectItem value="cpp">C++</SelectItem>
                  <SelectItem value="rust">Rust</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="font-medium text-sm">AI Content Generator</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Generate custom code snippets using AI for typing practice
              </p>
              <div className="flex flex-col md:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Optional: Enter a topic (e.g., 'sorting algorithm')"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  disabled={isTyping || isGenerating}
                  className="flex-1 px-3 py-2 bg-surface border border-border rounded-md text-sm focus:border-primary focus:outline-none disabled:opacity-50"
                />
                <Button
                  onClick={handleGenerateCode}
                  disabled={isTyping || isGenerating}
                  variant="default"
                  size="sm"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isGenerating ? 'Generating...' : 'Generate New'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typing Area */}
        <Card className="mb-8 bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                {isAdaptiveMode ? (
                  <>
                    <Brain className="inline w-5 h-5 mr-2 text-primary" />
                    Adaptive Practice - {adaptiveDifficulty}
                  </>
                ) : (
                  `Typing Test - ${selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)}`
                )}
              </span>
              <div className="flex space-x-2">
                {!isTyping ? (
                  <Button onClick={handleStart} variant="default" size="sm" disabled={!currentText || isGenerating}>
                    <Play className="w-4 h-4 mr-2" />
                    Start
                  </Button>
                ) : (
                  <Button onClick={handlePause} variant="secondary" size="sm">
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                )}
                <Button onClick={handleReset} variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Text to type */}
            <div className="p-6 bg-surface rounded-lg border border-border/50 overflow-auto min-h-[200px] flex items-center justify-center">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                  <Sparkles className="w-8 h-8 animate-pulse text-primary" />
                  <p className="text-sm">Generating typing content...</p>
                </div>
              ) : !currentText ? (
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                  <Code className="w-8 h-8" />
                  <p className="text-sm">Select a language above to generate typing content</p>
                </div>
              ) : (
                <pre className="text-sm leading-relaxed whitespace-pre-wrap w-full font-mono">
                  {currentText.split('').map((char, index) => (
                    <span
                      key={index}
                      className={`${getCharacterClass(index)} transition-all duration-150`}
                    >
                      {char}
                    </span>
                  ))}
                </pre>
              )}
            </div>

            {/* Input area */}
            <textarea
              value={typedText}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder={isGenerating ? 'Generating content...' : isTyping ? 'Start typing the code...' : !currentText ? 'Select a language to begin' : `Click Start to begin typing ${selectedLanguage} code`}
              disabled={!isTyping || isGenerating}
              onPaste={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              onCopy={(e) => e.preventDefault()}
              onDrop={(e) => e.preventDefault()}
              onDragOver={(e) => e.preventDefault()}
              className="w-full h-40 p-4 bg-surface border border-border/50 rounded-lg resize-none focus:border-primary focus:outline-none text-sm disabled:opacity-50 font-mono"
            />

            {/* Submit Test Button */}
            {testCompleted && !testSubmitted && (
              <div className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-primary/10 to-secondary-glow/10 rounded-lg border border-primary/20">
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-lg">Test Complete!</h3>
                  <p className="text-sm text-muted-foreground">
                    Click below to submit your results and save them to your progress.
                  </p>
                </div>
                <Button 
                  onClick={handleSubmitTest}
                  size="lg"
                  className="w-full md:w-auto min-w-[200px]"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Submit Test Results
                </Button>
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

        {/* Instructions */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Choose a Programming Language typing mode</li>
              <li>• Click "Start" to begin the typing test</li>
              <li>• Type the text exactly as shown above, including all punctuation and syntax</li>
              <li>• Correct characters will be highlighted in blue</li>
              <li>• Incorrect characters will be highlighted in red</li>
              <li>• Your WPM and accuracy will be calculated in real-time</li>
              <li>• The test lasts for 60 seconds</li>
              <li>• You cannot change the mode during an active test</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TypingPage;