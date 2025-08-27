import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Timer, 
  Target, 
  Zap,
  TrendingUp,
  Code
} from "lucide-react";

const codeTexts = {
  javascript: `function calculateSum(arr) {
  return arr.reduce((sum, num) => sum + num, 0);
}

const users = [
  { id: 1, name: "John", active: true },
  { id: 2, name: "Jane", active: false }
];

const activeUsers = users.filter(user => user.active);
console.log(activeUsers);`,

  python: `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

class DataProcessor:
    def __init__(self, data):
        self.data = data
    
    def process(self):
        return [x * 2 for x in self.data if x > 0]

processor = DataProcessor([1, -2, 3, 4, -5])
result = processor.process()`,

  typescript: `interface User {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

class UserService {
  private users: User[] = [];
  
  addUser(user: User): void {
    this.users.push(user);
  }
  
  getActiveUsers(): User[] {
    return this.users.filter(user => user.isActive);
  }
}

const userService = new UserService();`,

  java: `public class BinarySearch {
    public static int search(int[] arr, int target) {
        int left = 0;
        int right = arr.length - 1;
        
        while (left <= right) {
            int mid = left + (right - left) / 2;
            
            if (arr[mid] == target) {
                return mid;
            } else if (arr[mid] < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        return -1;
    }
}`,

  csharp: `using System;
using System.Collections.Generic;
using System.Linq;

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; }
    public decimal Price { get; set; }
}

public class ProductService
{
    private List<Product> products = new List<Product>();
    
    public void AddProduct(Product product)
    {
        products.Add(product);
    }
    
    public IEnumerable<Product> GetExpensiveProducts(decimal minPrice)
    {
        return products.Where(p => p.Price >= minPrice);
    }
}`,

  cpp: `#include <iostream>
#include <vector>
#include <algorithm>

class QuickSort {
public:
    static void sort(std::vector<int>& arr, int low, int high) {
        if (low < high) {
            int pi = partition(arr, low, high);
            sort(arr, low, pi - 1);
            sort(arr, pi + 1, high);
        }
    }
private:
    static int partition(std::vector<int>& arr, int low, int high) {
        int pivot = arr[high];
        int i = (low - 1);
        return i + 1;
    }
};`,

  rust: `use std::collections::HashMap;

struct Person {
    name: String,
    age: u32,
}

impl Person {
    fn new(name: String, age: u32) -> Self {
        Person { name, age }
    }
    
    fn greet(&self) -> String {
        format!("Hello, I'm {} and I'm {} years old", self.name, self.age)
    }
}

fn main() {
    let mut people = HashMap::new();
    let person = Person::new("Alice".to_string(), 30);
    people.insert(1, person);
}`
};

const TypingPage = () => {
  const [isTyping, setIsTyping] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [selectedLanguage, setSelectedLanguage] = useState<keyof typeof codeTexts>("javascript");
  const [currentText, setCurrentText] = useState(codeTexts.javascript);
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

  const handleLanguageChange = (language: keyof typeof codeTexts) => {
    if (isTyping) return; // Don't allow language change during typing
    setSelectedLanguage(language);
    setCurrentText(codeTexts[language]);
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

        {/* Language Selection */}
        <Card className="mb-8 bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Code className="w-5 h-5" />
              <span>Select Programming Language</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={selectedLanguage} 
              onValueChange={handleLanguageChange}
              disabled={isTyping}
            >
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Choose a language" />
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
          </CardContent>
        </Card>

        {/* Typing Area */}
        <Card className="mb-8 bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Typing Test - {selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)}</span>
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
            <div className="p-6 bg-surface rounded-lg border border-border/50 overflow-auto">
              <pre className="text-sm leading-relaxed font-mono whitespace-pre-wrap">
                {currentText.split('').map((char, index) => (
                  <span
                    key={index}
                    className={`${getCharacterClass(index)} transition-all duration-150`}
                  >
                    {char}
                  </span>
                ))}
              </pre>
            </div>

            {/* Input area */}
            <textarea
              value={typedText}
              onChange={handleTextChange}
              placeholder={isTyping ? "Start typing the code..." : `Click Start to begin typing ${selectedLanguage} code`}
              disabled={!isTyping}
              className="w-full h-40 p-4 bg-surface border border-border/50 rounded-lg resize-none focus:border-primary focus:outline-none font-mono text-sm disabled:opacity-50"
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
              <li>• Select your preferred programming language from the dropdown</li>
              <li>• Click "Start" to begin the coding typing test</li>
              <li>• Type the code exactly as shown above, including all syntax</li>
              <li>• Correct characters will be highlighted in blue</li>
              <li>• Incorrect characters will be highlighted in red</li>
              <li>• Your WPM and accuracy will be calculated in real-time</li>
              <li>• The test lasts for 60 seconds</li>
              <li>• You cannot change the language during an active test</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TypingPage;