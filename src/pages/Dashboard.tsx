import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/Navbar";
import KeyboardHeatmap from "@/components/KeyboardHeatmap";
import { PerformanceOverTimeChart } from "@/components/charts/PerformanceOverTimeChart";
import { ErrorAnalysisByKeyChart } from "@/components/charts/ErrorAnalysisByKeyChart";
import { PerformanceComparisonChart } from "@/components/charts/PerformanceComparisonChart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  TrendingUp, Target, Zap, Clock, Calendar, Trophy,
  Activity, Flame, Brain, AlertCircle, Award, ChevronRight,
  BarChart3, Loader2,
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
  key_errors?: any;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentTests, setRecentTests] = useState<TypingTest[]>([]);
  const [allTests, setAllTests] = useState<TypingTest[]>([]);
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
      // Fetch all tests for charts
      const { data: allTestsData, error: allTestsError } = await supabase
        .from('typing_tests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (allTestsError) {
        console.error('Error fetching all typing tests:', allTestsError);
        return;
      }

      setAllTests(allTestsData || []);

      // Get recent tests (top 10)
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
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "var(--pattern-grid)" }} />
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 pt-24 pb-12 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold mb-1">Progress Dashboard</h1>
          <p className="text-sm text-muted-foreground">Track your typing evolution</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8"
        >
          {[
            { label: "Avg WPM", value: stats.avgWpm, icon: Zap, color: "text-primary", bg: "bg-primary/10" },
            { label: "Best WPM", value: stats.bestWpm, icon: Trophy, color: "text-secondary-glow", bg: "bg-secondary-glow/10" },
            { label: "Accuracy", value: `${stats.accuracy}%`, icon: Target, color: "text-primary", bg: "bg-primary/10" },
            { label: "Streak", value: `${stats.streak}d`, icon: Flame, color: "text-secondary-glow", bg: "bg-secondary-glow/10" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="bg-card/50 border-border/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${stat.bg}`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    <p className="text-xl font-bold tabular-nums">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-10 bg-card/50 border border-border/20 rounded-xl p-1">
            <TabsTrigger value="overview" className="rounded-lg text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
              <BarChart3 className="w-3.5 h-3.5 mr-1.5" />Overview
            </TabsTrigger>
            <TabsTrigger value="analysis" className="rounded-lg text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
              <Brain className="w-3.5 h-3.5 mr-1.5" />Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Charts */}
            <PerformanceOverTimeChart tests={allTests} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ErrorAnalysisByKeyChart tests={allTests} />
              <PerformanceComparisonChart tests={allTests} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Tests */}
              <Card className="bg-card/50 border-border/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="w-4 h-4" />Recent Tests
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="text-xs h-7 text-primary hover:bg-primary/10" onClick={() => navigate("/all-tests")}>
                      View All <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : recentTests.length > 0 ? (
                    <div className="space-y-2">
                      {recentTests.slice(0, 5).map((test) => (
                        <div key={test.id} className="flex items-center justify-between p-2.5 bg-surface/50 rounded-lg hover:bg-surface transition-colors">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs text-muted-foreground w-16">{formatDate(test.created_at)}</span>
                            <span className="text-[10px] text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded font-mono">{test.language}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-primary font-medium tabular-nums">{test.wpm} <span className="text-[10px] text-muted-foreground">WPM</span></span>
                            <span className="text-muted-foreground tabular-nums text-xs">{Math.round(test.accuracy)}%</span>
                            <span className="text-muted-foreground tabular-nums text-xs hidden sm:inline">{formatDuration(test.test_duration)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">No tests yet. Start typing to see results!</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Weekly Goals */}
              <Card className="bg-card/50 border-border/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="w-4 h-4" />Weekly Goals
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {[
                    { label: "Speed", target: "100 WPM", current: stats.avgWpm, max: 100, icon: Zap },
                    { label: "Accuracy", target: "100%", current: stats.accuracy, max: 100, icon: Target },
                    { label: "Practice", target: "180 min", current: stats.weeklyPracticeMinutes, max: 180, icon: Clock },
                  ].map((goal) => {
                    const Icon = goal.icon;
                    const pct = Math.min((goal.current / goal.max) * 100, 100);
                    return (
                      <div key={goal.label} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Icon className="w-3.5 h-3.5" />{goal.label}
                          </span>
                          <span className="tabular-nums text-xs">{goal.current}/{goal.target}</span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            {/* AI Analysis Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card/50 border-border/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Brain className="w-4 h-4 text-secondary-glow" />AI Error Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!aiAnalysis && !analysisLoading && (
                    <Button onClick={fetchAIAnalysis} className="w-full h-10 text-sm" disabled={recentTests.length === 0}>
                      <Brain className="w-4 h-4 mr-2" />Generate Analysis
                    </Button>
                  )}
                  {analysisLoading && (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                  )}
                  {aiAnalysis && (
                    <div className="space-y-3">
                      <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                        <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                      </div>
                      <Button onClick={fetchAIAnalysis} variant="ghost" size="sm" className="text-xs text-primary hover:bg-primary/10">
                        Regenerate
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />Performance Analysis
                  </CardTitle>
                  <CardDescription className="text-xs">Personalized recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  {!performanceAnalysis && !performanceLoading && (
                    <Button onClick={fetchPerformanceAnalysis} className="w-full h-10 text-sm" disabled={recentTests.length === 0}>
                      <TrendingUp className="w-4 h-4 mr-2" />Generate Analysis
                    </Button>
                  )}
                  {performanceLoading && (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                  )}
                  {performanceAnalysis && (
                    <div className="space-y-3">
                      <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                        <ReactMarkdown>{performanceAnalysis}</ReactMarkdown>
                      </div>
                      <Button onClick={fetchPerformanceAnalysis} variant="ghost" size="sm" className="text-xs text-primary hover:bg-primary/10">
                        Regenerate
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Keyboard Heatmap */}
            <KeyboardHeatmap />

            {/* Error Stats & Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card/50 border-border/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive" />Error Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-surface/50 rounded-xl text-center">
                      <p className="text-2xl font-bold tabular-nums">{stats.totalErrors}</p>
                      <p className="text-[11px] text-muted-foreground">Total Errors</p>
                    </div>
                    <div className="p-3 bg-surface/50 rounded-xl text-center">
                      <p className="text-2xl font-bold tabular-nums">{stats.totalCharacters > 0 ? ((stats.totalErrors / stats.totalCharacters) * 100).toFixed(1) : 0}%</p>
                      <p className="text-[11px] text-muted-foreground">Error Rate</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.bestAccuracy > 95
                      ? "You're capable of very high accuracy. Focus on maintaining this in all tests."
                      : "Practice focusing on accuracy first, then gradually increase speed."}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {recentTests.length > 3 && stats.avgWpm > stats.bestWpm * 0.7 && (
                      <li className="flex gap-2.5 items-start">
                        <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Rushing Through Tests</p>
                          <p className="text-xs text-muted-foreground">Maintain consistent pace for better results.</p>
                        </div>
                      </li>
                    )}
                    {recentTests.length > 5 && Math.abs(recentTests[0].accuracy - recentTests[recentTests.length - 1].accuracy) > 10 && (
                      <li className="flex gap-2.5 items-start">
                        <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Inconsistent Accuracy</p>
                          <p className="text-xs text-muted-foreground">Practice at a comfortable pace first.</p>
                        </div>
                      </li>
                    )}
                    {stats.avgAccuracy < 85 && (
                      <li className="flex gap-2.5 items-start">
                        <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Low Overall Accuracy</p>
                          <p className="text-xs text-muted-foreground">Slow down and focus on hitting the right keys.</p>
                        </div>
                      </li>
                    )}
                    {recentTests.length > 3 &&
                      recentTests.slice(0, 3).reduce((sum, t) => sum + t.errors, 0) >
                      recentTests.slice(-3).reduce((sum, t) => sum + t.errors, 0) && (
                      <li className="flex gap-2.5 items-start">
                        <TrendingUp className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Improving Error Rate</p>
                          <p className="text-xs text-muted-foreground">Great progress! Fewer errors in recent tests.</p>
                        </div>
                      </li>
                    )}
                    {recentTests.length < 5 && (
                      <li className="flex gap-2.5 items-start">
                        <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Need More Data</p>
                          <p className="text-xs text-muted-foreground">Complete more tests for detailed insights.</p>
                        </div>
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Practice Tips */}
            <Card className="bg-card/50 border-border/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Practice Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { icon: Target, title: "Accuracy", tips: ["Start slow to build muscle memory", "Focus on one word at a time", "Practice difficult combinations separately"] },
                    { icon: Zap, title: "Speed", tips: ["Practice 15-20 mins daily", "Increase difficulty at 95%+ accuracy", "Use proper home row positioning"] },
                    { icon: TrendingUp, title: "Consistency", tips: ["Warm up with easy texts first", "Take breaks to avoid fatigue", "Celebrate small improvements"] },
                    { icon: Award, title: "Excellence", tips: ["Learn to touch type", "Practice varied text types", "Set specific measurable goals"] },
                  ].map((section) => {
                    const Icon = section.icon;
                    return (
                      <div key={section.title} className="space-y-2.5">
                        <h3 className="text-sm font-medium flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5 text-primary" />{section.title}
                        </h3>
                        <ul className="space-y-1.5">
                          {section.tips.map((tip, i) => (
                            <li key={i} className="text-xs text-muted-foreground leading-relaxed">• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
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