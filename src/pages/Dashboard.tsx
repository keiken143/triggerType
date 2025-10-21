import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Target, 
  Zap, 
  Clock, 
  Calendar,
  Trophy,
  Activity,
  Flame,
  Brain,
  AlertCircle,
  Award
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface TypingTest {
  id: string;
  wpm: number;
  accuracy: number;
  test_duration: number;
  language: string;
  created_at: string;
  errors: number;
  correct_characters: number;
  character_count: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [recentTests, setRecentTests] = useState<TypingTest[]>([]);
  const [stats, setStats] = useState({
    avgWpm: 0,
    bestWpm: 0,
    accuracy: 0,
    testsCompleted: 0,
    streak: 0,
    weeklyPracticeMinutes: 0,
    totalErrors: 0,
    totalCharacters: 0,
    bestAccuracy: 0,
    avgAccuracy: 0
  });
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [performanceAnalysis, setPerformanceAnalysis] = useState<string>("");
  const [performanceLoading, setPerformanceLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTypingTests();
      setupRealtimeSubscription();
    }
  }, [user]);

  const fetchTypingTests = async () => {
    if (!user) return;

    try {
      const { data: tests, error } = await supabase
        .from('typing_tests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching typing tests:', error);
        return;
      }

      // Remove duplicates based on key properties
      const uniqueTests = tests?.reduce((acc: TypingTest[], test) => {
        const isDuplicate = acc.some(t => 
          t.wpm === test.wpm &&
          t.accuracy === test.accuracy &&
          t.test_duration === test.test_duration &&
          t.language === test.language &&
          Math.abs(new Date(t.created_at).getTime() - new Date(test.created_at).getTime()) < 60000 // Within 1 minute
        );
        
        if (!isDuplicate) {
          acc.push(test);
        }
        return acc;
      }, []) || [];

      setRecentTests(uniqueTests);
      calculateStats(uniqueTests);
    } catch (error) {
      console.error('Error fetching typing tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (tests: TypingTest[]) => {
    if (tests.length === 0) {
      setStats({
        avgWpm: 0,
        bestWpm: 0,
        accuracy: 0,
        testsCompleted: 0,
        streak: 0,
        weeklyPracticeMinutes: 0,
        totalErrors: 0,
        totalCharacters: 0,
        bestAccuracy: 0,
        avgAccuracy: 0
      });
      return;
    }

    const avgWpm = Math.round(tests.reduce((sum, test) => sum + test.wpm, 0) / tests.length);
    const bestWpm = Math.max(...tests.map(test => test.wpm));
    const avgAccuracy = Math.round(tests.reduce((sum, test) => sum + test.accuracy, 0) / tests.length);
    const bestAccuracy = Math.max(...tests.map(test => test.accuracy));
    const totalErrors = tests.reduce((sum, test) => sum + test.errors, 0);
    const totalCharacters = tests.reduce((sum, test) => sum + test.character_count, 0);
    
    // Calculate weekly practice time
    const weeklyPracticeMinutes = calculateWeeklyPractice(tests);
    
    setStats({
      avgWpm,
      bestWpm,
      accuracy: avgAccuracy,
      testsCompleted: tests.length,
      streak: calculateStreak(tests),
      weeklyPracticeMinutes,
      totalErrors,
      totalCharacters,
      bestAccuracy,
      avgAccuracy
    });
  };

  const calculateStreak = (tests: TypingTest[]) => {
    // Simple streak calculation - count consecutive days with tests
    const today = new Date();
    let streak = 0;
    const testDates = new Set(tests.map(test => new Date(test.created_at).toDateString()));
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      if (testDates.has(checkDate.toDateString())) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return streak;
  };

  const calculateWeeklyPractice = (tests: TypingTest[]) => {
    // Get start of current week (Monday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
    const weekStart = new Date(today.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    
    // Filter tests from this week and sum their durations
    const weeklyTests = tests.filter(test => {
      const testDate = new Date(test.created_at);
      return testDate >= weekStart;
    });
    
    const totalSeconds = weeklyTests.reduce((sum, test) => sum + test.test_duration, 0);
    return Math.round(totalSeconds / 60); // Convert to minutes
  };

  const fetchAIAnalysis = async () => {
    setAnalysisLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to view AI analysis");
        return;
      }

      const { data, error } = await supabase.functions.invoke('analyze-typing-errors', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.error) {
        if (data.error.includes('Rate limit')) {
          toast.error("Rate limit exceeded. Please try again later.");
        } else if (data.error.includes('payment')) {
          toast.error("AI service requires payment. Please add credits.");
        } else {
          toast.error(data.error);
        }
        return;
      }

      setAiAnalysis(data.analysis);
    } catch (error: any) {
      console.error('Error fetching AI analysis:', error);
      toast.error("Failed to generate AI analysis");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const fetchPerformanceAnalysis = async () => {
    setPerformanceLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to view performance analysis");
        return;
      }

      const { data, error } = await supabase.functions.invoke('analyze-performance', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.error) {
        if (data.error.includes('Rate limit')) {
          toast.error("Rate limit exceeded. Please try again later.");
        } else if (data.error.includes('payment')) {
          toast.error("AI service requires payment. Please add credits.");
        } else {
          toast.error(data.error);
        }
        return;
      }

      setPerformanceAnalysis(data.analysis);
    } catch (error: any) {
      console.error('Error fetching performance analysis:', error);
      toast.error("Failed to generate performance analysis");
    } finally {
      setPerformanceLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;

    const channel = supabase
      .channel('typing_tests_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'typing_tests',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newTest = payload.new as TypingTest;
          setRecentTests(prev => {
            const updatedTests = [newTest, ...prev.slice(0, 9)];
            calculateStats(updatedTests);
            return updatedTests;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      const diffTime = Math.abs(today.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} days ago`;
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  const weakKeys = [
    { key: "Q", accuracy: 78, frequency: 245 },
    { key: "Z", accuracy: 82, frequency: 156 },
    { key: "X", accuracy: 85, frequency: 189 },
    { key: "P", accuracy: 87, frequency: 298 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-background">
      <div 
        className="fixed inset-0 opacity-5"
        style={{ backgroundImage: "var(--pattern-grid)" }}
      />
      
      <Navbar />
      
      <div className="container mx-auto px-6 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Progress Dashboard</h1>
          <p className="text-muted-foreground">Track your typing evolution and biometric patterns</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average WPM</p>
                  <p className="text-2xl font-bold">{stats.avgWpm}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Best WPM</p>
                  <p className="text-2xl font-bold">{stats.bestWpm}</p>
                </div>
                <div className="p-3 bg-secondary-glow/10 rounded-lg">
                  <Trophy className="w-6 h-6 text-secondary-glow" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Accuracy</p>
                  <p className="text-2xl font-bold">{stats.accuracy}%</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Target className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Streak</p>
                  <p className="text-2xl font-bold">{stats.streak} days</p>
                </div>
                <div className="p-3 bg-secondary-glow/10 rounded-lg">
                  <Flame className="w-6 h-6 text-secondary-glow" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-surface/50 backdrop-blur-sm p-1">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="analysis"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
            >
              Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Tests */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Recent Tests</span>
                  </CardTitle>
                  <CardDescription>Your latest typing test results</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(4)].map((_, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-surface rounded-lg animate-pulse">
                          <div className="h-4 bg-muted rounded w-20"></div>
                          <div className="flex space-x-4">
                            <div className="h-4 bg-muted rounded w-16"></div>
                            <div className="h-4 bg-muted rounded w-12"></div>
                            <div className="h-4 bg-muted rounded w-12"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : recentTests.length > 0 ? (
                    <div className="space-y-4">
                      {recentTests.map((test) => (
                        <div key={test.id} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{formatDate(test.created_at)}</span>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                              {test.language}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-primary font-medium">{test.wpm} WPM</span>
                            <span className="text-muted-foreground">{Math.round(test.accuracy)}%</span>
                            <span className="text-muted-foreground">{formatDuration(test.test_duration)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No typing tests completed yet.</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Complete a typing test to see your results here!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Learning Goals */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Weekly Goals</span>
                  </CardTitle>
                  <CardDescription>Track your weekly typing goals</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Speed Goal (100 WPM)</span>
                      <span>{stats.avgWpm}/100</span>
                    </div>
                    <Progress value={(stats.avgWpm / 100) * 100} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Accuracy Goal (100%)</span>
                      <span>{stats.accuracy}/100</span>
                    </div>
                    <Progress value={(stats.accuracy / 100) * 100} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Weekly Practice (180 min)</span>
                      <span>{stats.weeklyPracticeMinutes}/180 min</span>
                    </div>
                    <Progress value={(stats.weeklyPracticeMinutes / 180) * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>


          <TabsContent value="analysis" className="space-y-6">
            {/* AI Error Analysis */}
            <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  AI Error Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!aiAnalysis && !analysisLoading && (
                  <Button 
                    onClick={fetchAIAnalysis}
                    className="w-full"
                    disabled={recentTests.length === 0}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Generate AI Analysis
                  </Button>
                )}
                
                {analysisLoading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}

                {aiAnalysis && (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                    <Button 
                      onClick={fetchAIAnalysis}
                      variant="outline"
                      className="mt-4"
                    >
                      Regenerate Analysis
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Performance Analysis */}
            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  AI Performance Analysis & Tailored Suggestions
                </CardTitle>
                <CardDescription>Get personalized recommendations based on your typing data</CardDescription>
              </CardHeader>
              <CardContent>
                {!performanceAnalysis && !performanceLoading && (
                  <Button 
                    onClick={fetchPerformanceAnalysis}
                    className="w-full"
                    disabled={recentTests.length === 0}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Generate Performance Analysis
                  </Button>
                )}
                
                {performanceLoading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}

                {performanceAnalysis && (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{performanceAnalysis}</ReactMarkdown>
                    <Button 
                      onClick={fetchPerformanceAnalysis}
                      variant="outline"
                      className="mt-4"
                    >
                      Regenerate Analysis
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Error Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Error Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Errors</p>
                    <p className="text-2xl font-bold">{stats.totalErrors}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Error Rate</p>
                    <p className="text-2xl font-bold">{((stats.totalErrors / stats.totalCharacters) * 100).toFixed(1)}%</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Accuracy Patterns</h3>
                  <p className="text-sm text-muted-foreground">
                    {stats.bestAccuracy > 95 ? 
                      "You're capable of very high accuracy. Focus on maintaining this in all tests." :
                      "Practice focusing on accuracy first, then gradually increase speed."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Common Mistakes */}
            <Card>
              <CardHeader>
                <CardTitle>Common Mistakes Identified</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {recentTests.length > 3 && stats.avgWpm > stats.bestWpm * 0.7 && (
                    <li className="flex gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Rushing Through Tests</p>
                        <p className="text-sm text-muted-foreground">Your speed varies significantly. Focus on maintaining consistent pace.</p>
                      </div>
                    </li>
                  )}
                  {recentTests.length > 5 && Math.abs(recentTests[0].accuracy - recentTests[recentTests.length - 1].accuracy) > 10 && (
                    <li className="flex gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Inconsistent Accuracy</p>
                        <p className="text-sm text-muted-foreground">Your accuracy fluctuates between tests. Practice at a comfortable pace first.</p>
                      </div>
                    </li>
                  )}
                  {stats.avgAccuracy < 85 && (
                    <li className="flex gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Low Overall Accuracy</p>
                        <p className="text-sm text-muted-foreground">Slow down and focus on hitting the right keys. Speed will come with practice.</p>
                      </div>
                    </li>
                  )}
                  {recentTests.length > 3 && 
                   recentTests.slice(0, 3).reduce((sum, t) => sum + t.errors, 0) > 
                   recentTests.slice(-3).reduce((sum, t) => sum + t.errors, 0) && (
                    <li className="flex gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Improving Error Rate</p>
                        <p className="text-sm text-muted-foreground">Great progress! Your recent tests show fewer errors.</p>
                      </div>
                    </li>
                  )}
                  {recentTests.length < 5 && (
                    <li className="flex gap-2">
                      <Zap className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Need More Data</p>
                        <p className="text-sm text-muted-foreground">Complete more tests to get detailed insights about your typing patterns.</p>
                      </div>
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>

            {/* Solutions & Practice Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Solutions & Practice Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      For Better Accuracy
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                      <li>Start with slower, deliberate typing to build muscle memory</li>
                      <li>Focus on one word at a time instead of rushing ahead</li>
                      <li>Practice difficult letter combinations separately</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      For Increased Speed
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                      <li>Maintain consistent practice schedule (15-20 mins daily)</li>
                      <li>Gradually increase difficulty once you maintain 95%+ accuracy</li>
                      <li>Use proper finger positioning on home row</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      For Consistency
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                      <li>Warm up with easy texts before challenging yourself</li>
                      <li>Take breaks between tests to avoid fatigue errors</li>
                      <li>Track your progress and celebrate small improvements</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      For Excellence
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                      <li>Learn to touch type without looking at the keyboard</li>
                      <li>Practice with varied text types (code, prose, numbers)</li>
                      <li>Set specific goals (e.g., 60 WPM at 95% accuracy)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;