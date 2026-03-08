import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import KeyboardHeatmap from "@/components/KeyboardHeatmap";
import { PerformanceOverTimeChart } from "@/components/charts/PerformanceOverTimeChart";
import { ErrorAnalysisByKeyChart } from "@/components/charts/ErrorAnalysisByKeyChart";
import { PerformanceComparisonChart } from "@/components/charts/PerformanceComparisonChart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import {
  TrendingUp, Target, Zap, Clock, Calendar, Trophy,
  Activity, Flame, Brain, AlertCircle, Award, Loader2, RotateCw
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { PageContainer, SectionHeader } from "@/components/layout/PageContainer";
import { MinimalCard } from "@/components/ui/MinimalCard";
import { StatInline } from "@/components/ui/StatInline";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  key_errors?: any;
}

const Dashboard = () => {
  const { user } = useAuth();
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

  // Handle auto-generation of AI reports
  useEffect(() => {
    if (recentTests.length > 0) {
      // Refresh analysis whenever tests change to provide latest biometric insights
      fetchAIAnalysis();
      fetchPerformanceAnalysis();
    }
  }, [recentTests.length]); // Specifically track the volume of tests for refresh trigger

  const fetchTypingTests = async () => {
    if (!user) return;
    try {
      const { data: allTestsData, error: allTestsError } = await supabase
        .from('typing_tests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (allTestsError) throw allTestsError;
      setAllTests(allTestsData || []);

      const { data: tests, error } = await supabase
        .from('typing_tests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const uniqueTests = tests?.reduce((acc: TypingTest[], test) => {
        const isDuplicate = acc.some(t =>
          t.wpm === test.wpm &&
          t.accuracy === test.accuracy &&
          t.test_duration === test.test_duration &&
          t.language === test.language &&
          Math.abs(new Date(t.created_at).getTime() - new Date(test.created_at).getTime()) < 60000
        );
        if (!isDuplicate) acc.push(test);
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
      setStats({ avgWpm: 0, bestWpm: 0, accuracy: 0, testsCompleted: 0, streak: 0, weeklyPracticeMinutes: 0, totalErrors: 0, totalCharacters: 0, bestAccuracy: 0, avgAccuracy: 0 });
      return;
    }
    const avgWpm = Math.round(tests.reduce((sum, test) => sum + test.wpm, 0) / tests.length);
    const bestWpm = Math.max(...tests.map(test => test.wpm));
    const avgAccuracy = Math.round(tests.reduce((sum, test) => sum + test.accuracy, 0) / tests.length);
    const bestAccuracy = Math.max(...tests.map(test => test.accuracy));
    const totalErrors = tests.reduce((sum, test) => sum + test.errors, 0);
    const totalCharacters = tests.reduce((sum, test) => sum + test.character_count, 0);
    const weeklyPracticeMinutes = calculateWeeklyPractice(tests);

    setStats({ avgWpm, bestWpm, accuracy: avgAccuracy, testsCompleted: tests.length, streak: calculateStreak(tests), weeklyPracticeMinutes, totalErrors, totalCharacters, bestAccuracy, avgAccuracy });
  };

  const calculateStreak = (tests: TypingTest[]) => {
    const today = new Date();
    let streak = 0;
    const testDates = new Set(tests.map(test => new Date(test.created_at).toDateString()));
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      if (testDates.has(checkDate.toDateString())) streak++;
      else if (i > 0) break;
    }
    return streak;
  };

  const calculateWeeklyPractice = (tests: TypingTest[]) => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(today.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    const weeklyTests = tests.filter(test => new Date(test.created_at) >= weekStart);
    const totalSeconds = weeklyTests.reduce((sum, test) => sum + test.test_duration, 0);
    return Math.round(totalSeconds / 60);
  };

  const fetchAIAnalysis = async () => {
    setAnalysisLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Please log in"); return; }
      const { data, error } = await supabase.functions.invoke('analyze-typing-errors', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data.error) { toast.error(data.error); return; }
      setAiAnalysis(data.analysis);
    } catch (error: unknown) {
      toast.error("Failed to generate AI analysis");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const fetchPerformanceAnalysis = async () => {
    setPerformanceLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Please log in"); return; }
      const { data, error } = await supabase.functions.invoke('analyze-performance', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data.error) { toast.error(data.error); return; }
      setPerformanceAnalysis(data.analysis);
    } catch (error: unknown) {
      toast.error("Failed to generate performance analysis");
    } finally {
      setPerformanceLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;
    const channel = supabase
      .channel('typing_tests_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'typing_tests', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newTest = payload.new as TypingTest;
          setRecentTests(prev => {
            const updatedTests = [newTest, ...prev.slice(0, 9)];
            calculateStats(updatedTests);
            return updatedTests;
          });
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    else if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    else {
      const diffTime = Math.abs(today.getTime() - date.getTime());
      return `${Math.ceil(diffTime / (1000 * 60 * 60 * 24))} days ago`;
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <PageContainer className="py-8">
      <SectionHeader
        title="Performance Dashboard"
        subtitle="Track your typing evolution and biometric patterns"
        className="mb-8"
      />

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <MinimalCard key={i} className="p-5 h-[104px]">
              <Skeleton className="w-12 h-4 rounded-md bg-muted mb-3" />
              <Skeleton className="w-24 h-8 rounded-md bg-muted" />
            </MinimalCard>
          ))}
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <motion.div variants={itemVariants}>
            <MinimalCard animateHover className="p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-neutral-400">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider">Avg Speed</span>
              </div>
              <StatInline label="" value={stats.avgWpm} subValue="WPM" />
            </MinimalCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <MinimalCard animateHover className="p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-neutral-400">
                <Trophy className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold uppercase tracking-wider">Top Speed</span>
              </div>
              <StatInline label="" value={stats.bestWpm} subValue="WPM" />
            </MinimalCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <MinimalCard animateHover className="p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-neutral-400">
                <Target className="w-4 h-4 text-green-400" />
                <span className="text-xs font-semibold uppercase tracking-wider">Accuracy</span>
              </div>
              <StatInline label="" value={`${stats.accuracy}%`} />
            </MinimalCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <MinimalCard animateHover className="p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-neutral-400">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-semibold uppercase tracking-wider">Streak</span>
              </div>
              <StatInline label="" value={stats.streak} subValue="Days" />
            </MinimalCard>
          </motion.div>
        </motion.div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full max-w-sm grid-cols-2 bg-muted/60 p-1 border border-border/50 rounded-full mb-6">
          <TabsTrigger value="overview" className="rounded-full data-[state=active]:bg-primary/10 data-[state=active]:text-foreground text-muted-foreground">Overview</TabsTrigger>
          <TabsTrigger value="analysis" className="rounded-full data-[state=active]:bg-primary/10 data-[state=active]:text-foreground text-muted-foreground">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="space-y-6">
            <MinimalCard className="p-4"><PerformanceOverTimeChart tests={allTests} /></MinimalCard>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MinimalCard className="p-4"><ErrorAnalysisByKeyChart tests={allTests} /></MinimalCard>
              <MinimalCard className="p-4"><PerformanceComparisonChart tests={allTests} /></MinimalCard>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MinimalCard className="p-6 bg-card/40 border-border/40 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">Recent Tests</h3>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full bg-muted/40 rounded-lg" />)}
                </div>
              ) : recentTests.length > 0 ? (
                <div className="space-y-3">
                  {recentTests.map((test) => (
                    <div key={test.id} className="flex items-center justify-between p-3 bg-muted/30 border border-border/40 rounded-lg transition-colors hover:bg-muted/50 shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">{formatDate(test.created_at)}</span>
                        <span className="text-xs text-foreground bg-muted/60 px-2 py-0.5 rounded-full">{test.language}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-foreground font-mono font-medium">{test.wpm} WPM</span>
                        <span className="text-muted-foreground font-mono">{Math.round(test.accuracy)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No recent typing tests.</p>
              )}
            </MinimalCard>

            <MinimalCard className="p-6 bg-card/40 border-border/40 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">Weekly Goals</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2 text-muted-foreground">
                    <span>Speed Goal (100 WPM)</span>
                    <span className="text-foreground">{stats.avgWpm}/100</span>
                  </div>
                  <Progress value={(stats.avgWpm / 100) * 100} className="h-2 bg-muted/50" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2 text-muted-foreground">
                    <span>Accuracy (100%)</span>
                    <span className="text-foreground">{stats.accuracy}%</span>
                  </div>
                  <Progress value={(stats.accuracy / 100) * 100} className="h-2 bg-muted/50" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2 text-muted-foreground">
                    <span>Practice (180 min)</span>
                    <span className="text-foreground">{stats.weeklyPracticeMinutes}/180</span>
                  </div>
                  <Progress value={(stats.weeklyPracticeMinutes / 180) * 100} className="h-2 bg-muted/50" />
                </div>
              </div>
            </MinimalCard>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MinimalCard className="p-6 relative overflow-hidden min-h-[400px] bg-card/40 border-border/40 shadow-sm">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500/50 via-purple-500 to-transparent" />
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Brain className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground tracking-tight text-sm">Neural Error Analysis</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Real-time Biometric Audit</p>
                  </div>
                </div>
                {aiAnalysis && !analysisLoading && (
                  <Button variant="ghost" size="icon" onClick={fetchAIAnalysis} className="h-8 w-8 text-muted-foreground hover:text-primary">
                    <RotateCw className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              {analysisLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-[90%] bg-muted/40" />
                  <Skeleton className="h-4 w-[75%] bg-muted/40" />
                  <Skeleton className="h-4 w-[85%] bg-muted/40" />
                  <Skeleton className="h-4 w-[60%] bg-muted/40" />
                </div>
              ) : recentTests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="w-8 h-8 text-muted-foreground/20 mb-3" />
                  <p className="text-xs text-muted-foreground max-w-[200px]">Complete a test to unlock neural error analysis.</p>
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none scrollbar-hide overflow-y-auto max-h-[500px] pr-2">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="text-[11px] leading-relaxed text-muted-foreground font-medium mb-4">{children}</p>,
                      li: ({ children }) => <li className="text-[11px] leading-relaxed text-foreground font-medium mb-2">{children}</li>,
                      ul: ({ children }) => <ul className="list-disc space-y-2 mb-6 pl-5 marker:text-primary">{children}</ul>,
                      h3: ({ children }) => <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 mt-8 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        {children}
                      </h4>,
                      h2: ({ children }) => <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 mt-8 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        {children}
                      </h4>,
                      h1: () => null,
                    }}
                  >
                    {aiAnalysis}
                  </ReactMarkdown>
                </div>
              )}
            </MinimalCard>

            <MinimalCard className="p-8 relative overflow-hidden min-h-[450px] bg-card/40 border-border/40 shadow-sm">
              <div className="absolute inset-0 bg-background/50 pointer-events-none" />
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/30 via-blue-500/50 to-transparent" />
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-foreground tracking-widest text-[11px] uppercase">Performance Strategy</h3>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-black">Architectural Optimization</p>
                  </div>
                </div>
                {performanceAnalysis && !performanceLoading && (
                  <Button variant="ghost" size="icon" onClick={fetchPerformanceAnalysis} className="h-8 w-8 text-muted-foreground hover:text-blue-400 hover:bg-blue-400/10 rounded-lg">
                    <RotateCw className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              {performanceLoading ? (
                <div className="space-y-4 relative z-10">
                  <Skeleton className="h-3 w-[90%] bg-muted/40" />
                  <Skeleton className="h-3 w-[75%] bg-muted/40" />
                  <Skeleton className="h-3 w-[85%] bg-muted/40" />
                  <Skeleton className="h-3 w-[60%] bg-muted/40" />
                </div>
              ) : recentTests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center relative z-10">
                  <AlertCircle className="w-10 h-10 text-muted-foreground/40 mb-4" />
                  <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground max-w-[200px]">Strategic insights will unlock after your first performance upload.</p>
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none relative z-10 scrollbar-hide overflow-y-auto max-h-[500px] pr-2">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="text-[11px] leading-relaxed text-muted-foreground font-medium mb-4">{children}</p>,
                      li: ({ children }) => <li className="text-[11px] leading-relaxed text-foreground font-medium mb-2">{children}</li>,
                      ul: ({ children }) => <ul className="list-disc space-y-2 mb-6 pl-5 marker:text-blue-500">{children}</ul>,
                      strong: ({ children }) => <strong className="text-blue-400 font-black uppercase tracking-tight">{children}</strong>,
                      h3: ({ children }) => <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-4 mt-8 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        {children}
                      </h4>,
                      h2: ({ children }) => <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-4 mt-8 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        {children}
                      </h4>,
                      h1: () => null,
                    }}
                  >
                    {performanceAnalysis}
                  </ReactMarkdown>
                </div>
              )}
            </MinimalCard>
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default Dashboard;