import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Timer, 
  Target, 
  Zap,
  TrendingUp 
} from "lucide-react";

const TypingPage = () => {
  const [isTyping, setIsTyping] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentText] = useState(
    "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet and is commonly used for typing practice. Programming requires precise typing skills to write clean, efficient code."
  );
  const [typedText, setTypedText] = useState("");
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTyping && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTyping(false);
    }
    return () => clearInterval(interval);
  }, [isTyping, timeLeft]);

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
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isTyping) return;
    
    const newText = e.target.value;
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

  const progress = ((60 - timeLeft) / 60) * 100;

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

        {/* Progress Bar */}
        <Card className="mb-8 bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-6">
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Typing Area */}
        <Card className="mb-8 bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Typing Test</span>
              <div className="flex space-x-2">
                {!isTyping ? (
                  <Button onClick={handleStart} variant="default" size="sm">
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
            <div className="p-6 bg-surface rounded-lg border border-border/50">
              <p className="text-lg leading-relaxed font-mono">
                {currentText.split('').map((char, index) => (
                  <span
                    key={index}
                    className={`${getCharacterClass(index)} transition-all duration-150`}
                  >
                    {char}
                  </span>
                ))}
              </p>
            </div>

            {/* Input area */}
            <textarea
              value={typedText}
              onChange={handleTextChange}
              placeholder={isTyping ? "Start typing..." : "Click Start to begin typing test"}
              disabled={!isTyping}
              className="w-full h-32 p-4 bg-surface border border-border/50 rounded-lg resize-none focus:border-primary focus:outline-none font-mono text-lg disabled:opacity-50"
            />
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Click "Start" to begin the typing test</li>
              <li>• Type the text exactly as shown above</li>
              <li>• Correct characters will be highlighted in blue</li>
              <li>• Incorrect characters will be highlighted in red</li>
              <li>• Your WPM and accuracy will be calculated in real-time</li>
              <li>• The test lasts for 60 seconds</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TypingPage;