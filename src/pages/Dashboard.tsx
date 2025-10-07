import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
  Flame
} from "lucide-react";

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
    weeklyPracticeMinutes: 0
  });
  const [loading, setLoading] = useState(true);

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

      setRecentTests(tests || []);
      calculateStats(tests || []);
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
        weeklyPracticeMinutes: 0
      });
      return;
    }

    const avgWpm = Math.round(tests.reduce((sum, test) => sum + test.wpm, 0) / tests.length);
    const bestWpm = Math.max(...tests.map(test => test.wpm));
    const avgAccuracy = Math.round(tests.reduce((sum, test) => sum + test.accuracy, 0) / tests.length);
    
    // Calculate weekly practice time
    const weeklyPracticeMinutes = calculateWeeklyPractice(tests);
    
    setStats({
      avgWpm,
      bestWpm,
      accuracy: avgAccuracy,
      testsCompleted: tests.length,
      streak: calculateStreak(tests),
      weeklyPracticeMinutes
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
                      <span>Accuracy Goal (98%)</span>
                      <span>{stats.accuracy}/98</span>
                    </div>
                    <Progress value={(stats.accuracy / 98) * 100} className="h-2" />
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
            <div className="grid grid-cols-1 gap-6">
              {/* Performance Trends */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle>Performance Analysis</CardTitle>
                  <CardDescription>How you perform in typing tests</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentTests.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-surface rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Speed Trend</p>
                          <p className="text-2xl font-bold">
                            {(() => {
                              if (recentTests.length < 2) return "N/A";
                              const recent = recentTests.slice(0, Math.min(3, recentTests.length));
                              const older = recentTests.slice(Math.min(3, recentTests.length), Math.min(6, recentTests.length));
                              if (older.length === 0) return "New";
                              const recentAvg = recent.reduce((sum, t) => sum + t.wpm, 0) / recent.length;
                              const olderAvg = older.reduce((sum, t) => sum + t.wpm, 0) / older.length;
                              const changeNum = ((recentAvg - olderAvg) / olderAvg * 100);
                              const change = changeNum.toFixed(1);
                              return `${changeNum > 0 ? '+' : ''}${change}%`;
                            })()}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Last 3 vs previous 3 tests</p>
                        </div>

                        <div className="p-4 bg-surface rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Consistency</p>
                          <p className="text-2xl font-bold">
                            {(() => {
                              if (recentTests.length < 2) return "N/A";
                              const wpms = recentTests.map(t => t.wpm);
                              const avg = wpms.reduce((a, b) => a + b, 0) / wpms.length;
                              const variance = wpms.reduce((sum, wpm) => sum + Math.pow(wpm - avg, 2), 0) / wpms.length;
                              const stdDev = Math.sqrt(variance);
                              const cv = (stdDev / avg * 100).toFixed(1);
                              return parseFloat(cv) < 10 ? "High" : parseFloat(cv) < 20 ? "Medium" : "Low";
                            })()}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Speed variation across tests</p>
                        </div>

                        <div className="p-4 bg-surface rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Best Time of Day</p>
                          <p className="text-2xl font-bold">
                            {(() => {
                              const hours = recentTests.map(t => new Date(t.created_at).getHours());
                              const bestHour = hours.reduce((acc, hour, idx) => {
                                if (!acc[hour]) acc[hour] = [];
                                acc[hour].push(recentTests[idx].wpm);
                                return acc;
                              }, {} as Record<number, number[]>);
                              
                              let maxAvg = 0;
                              let bestTime = "N/A";
                              Object.entries(bestHour).forEach(([hour, wpms]) => {
                                const avg = wpms.reduce((a, b) => a + b, 0) / wpms.length;
                                if (avg > maxAvg) {
                                  maxAvg = avg;
                                  const h = parseInt(hour);
                                  bestTime = h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h-12} PM`;
                                }
                              });
                              return bestTime;
                            })()}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Peak performance hour</p>
                        </div>
                      </div>

                      <div className="space-y-3 mt-6">
                        <h4 className="font-medium">Performance Insights</h4>
                        
                        {/* Speed Analysis */}
                        <div className="p-4 bg-primary/10 rounded-lg">
                          <h5 className="font-medium text-primary mb-2 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Speed Pattern
                          </h5>
                          <p className="text-sm text-muted-foreground">
                            {(() => {
                              if (recentTests.length < 3) return "Complete more tests to see detailed speed analysis.";
                              const avgWpm = stats.avgWpm;
                              const bestWpm = stats.bestWpm;
                              const gap = bestWpm - avgWpm;
                              
                              if (gap < 5) {
                                return `Excellent consistency! Your average (${avgWpm} WPM) is very close to your best (${bestWpm} WPM), showing reliable performance.`;
                              } else if (gap < 15) {
                                return `Good performance! Your average is ${avgWpm} WPM with a best of ${bestWpm} WPM. You're ${gap} WPM away from your peak - keep practicing to maintain top speed consistently.`;
                              } else {
                                return `Variable performance detected. Your best is ${bestWpm} WPM but average is ${avgWpm} WPM (${gap} WPM difference). Focus on consistency by practicing at a comfortable pace.`;
                              }
                            })()}
                          </p>
                        </div>

                        {/* Language Analysis */}
                        {(() => {
                          const languages = recentTests.reduce((acc, test) => {
                            if (!acc[test.language]) acc[test.language] = { count: 0, totalWpm: 0, totalAcc: 0 };
                            acc[test.language].count++;
                            acc[test.language].totalWpm += test.wpm;
                            acc[test.language].totalAcc += test.accuracy;
                            return acc;
                          }, {} as Record<string, { count: number; totalWpm: number; totalAcc: number }>);

                          if (Object.keys(languages).length > 1) {
                            const langStats = Object.entries(languages).map(([lang, stats]) => ({
                              lang,
                              avgWpm: Math.round(stats.totalWpm / stats.count),
                              avgAcc: Math.round(stats.totalAcc / stats.count),
                              count: stats.count
                            })).sort((a, b) => b.avgWpm - a.avgWpm);

                            return (
                              <div className="p-4 bg-secondary-glow/10 rounded-lg">
                                <h5 className="font-medium text-secondary-glow mb-2 flex items-center gap-2">
                                  <Zap className="w-4 h-4" />
                                  Language Performance
                                </h5>
                                <p className="text-sm text-muted-foreground">
                                  You perform best in <span className="font-medium">{langStats[0].lang}</span> ({langStats[0].avgWpm} WPM avg).
                                  {langStats.length > 1 && ` Your ${langStats[langStats.length-1].lang} speed is ${langStats[0].avgWpm - langStats[langStats.length-1].avgWpm} WPM lower - consider more practice in that mode.`}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Complete typing tests to see performance analysis.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Error Analysis */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle>Error Analysis</CardTitle>
                  <CardDescription>Understanding your typing mistakes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentTests.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-surface rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Total Errors</p>
                          <p className="text-2xl font-bold">
                            {recentTests.reduce((sum, test) => sum + (test.errors || 0), 0)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Across all recent tests</p>
                        </div>

                        <div className="p-4 bg-surface rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Error Rate</p>
                          <p className="text-2xl font-bold">
                            {(() => {
                              const totalChars = recentTests.reduce((sum, test) => sum + (test.character_count || 0), 0);
                              const totalErrors = recentTests.reduce((sum, test) => sum + (test.errors || 0), 0);
                              return totalChars > 0 ? `${((totalErrors / totalChars) * 100).toFixed(1)}%` : "0%";
                            })()}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Errors per character typed</p>
                        </div>

                        <div className="p-4 bg-surface rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Error Trend</p>
                          <p className="text-2xl font-bold">
                            {(() => {
                              if (recentTests.length < 2) return "N/A";
                              const recent = recentTests.slice(0, Math.min(3, recentTests.length));
                              const older = recentTests.slice(Math.min(3, recentTests.length), Math.min(6, recentTests.length));
                              if (older.length === 0) return "New";
                              
                              const recentErrors = recent.reduce((sum, t) => sum + (t.errors || 0), 0) / recent.length;
                              const olderErrors = older.reduce((sum, t) => sum + (t.errors || 0), 0) / older.length;
                              const change = olderErrors - recentErrors;
                              
                              return change > 0 ? "↓ Improving" : change < 0 ? "↑ Increasing" : "→ Stable";
                            })()}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Recent vs previous tests</p>
                        </div>
                      </div>

                      <div className="space-y-3 mt-6">
                        <h4 className="font-medium">Error Insights</h4>
                        
                        {/* Error Pattern Analysis */}
                        <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                          <h5 className="font-medium text-destructive mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Accuracy Pattern
                          </h5>
                          <p className="text-sm text-muted-foreground">
                            {(() => {
                              const avgAccuracy = stats.accuracy;
                              const totalErrors = recentTests.reduce((sum, test) => sum + (test.errors || 0), 0);
                              const avgErrorsPerTest = totalErrors / recentTests.length;
                              
                              if (avgAccuracy >= 95) {
                                return `Excellent accuracy at ${avgAccuracy}%! You make an average of ${avgErrorsPerTest.toFixed(1)} errors per test. Keep maintaining this high standard.`;
                              } else if (avgAccuracy >= 90) {
                                return `Good accuracy at ${avgAccuracy}%. You average ${avgErrorsPerTest.toFixed(1)} errors per test. Slow down slightly when you notice mistakes appearing to push past 95%.`;
                              } else if (avgAccuracy >= 85) {
                                return `Your accuracy is ${avgAccuracy}% with ${avgErrorsPerTest.toFixed(1)} errors per test on average. Focus on accuracy over speed - try reducing your typing speed by 10-15% to build better habits.`;
                              } else {
                                return `Accuracy needs attention at ${avgAccuracy}%. You're averaging ${avgErrorsPerTest.toFixed(1)} errors per test. Practice slowly with a focus on correct keystrokes rather than speed.`;
                              }
                            })()}
                          </p>
                        </div>

                        {/* Speed vs Accuracy Trade-off */}
                        <div className="p-4 bg-surface rounded-lg border border-border">
                          <h5 className="font-medium mb-2 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Speed vs Accuracy Balance
                          </h5>
                          <p className="text-sm text-muted-foreground">
                            {(() => {
                              const avgWpm = stats.avgWpm;
                              const avgAccuracy = stats.accuracy;
                              
                              if (avgAccuracy >= 95 && avgWpm >= 60) {
                                return "Perfect balance! You're maintaining high accuracy while typing fast. Continue challenging yourself with harder texts.";
                              } else if (avgAccuracy >= 95) {
                                return `Your accuracy (${avgAccuracy}%) is excellent, but speed can improve. Gradually increase your typing pace while maintaining accuracy.`;
                              } else if (avgWpm >= 60) {
                                return `You're fast at ${avgWpm} WPM, but accuracy is ${avgAccuracy}%. Slow down 10-20% and focus on precision - speed will naturally follow.`;
                              } else {
                                return `You're building foundations. Focus on accuracy first (aim for 95%+), then gradually increase speed. Quality over speed at this stage.`;
                              }
                            })()}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Complete typing tests to see error analysis.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Detailed Mistakes & Solutions */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle>Mistakes Found & Solutions</CardTitle>
                  <CardDescription>Specific problems identified and how to fix them</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentTests.length > 0 ? (
                    <>
                      {/* Common Mistakes Identified */}
                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <Target className="w-5 h-5 text-destructive" />
                          Common Mistakes Identified
                        </h4>
                        
                        <div className="grid grid-cols-1 gap-3">
                          {/* Mistake 1: Speed rushing */}
                          {stats.accuracy < 90 && stats.avgWpm > 50 && (
                            <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-destructive/10 rounded">
                                  <Zap className="w-4 h-4 text-destructive" />
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-medium text-destructive mb-1">Rushing Through Text</h5>
                                  <p className="text-sm text-muted-foreground">
                                    You're typing at {stats.avgWpm} WPM but accuracy is {stats.accuracy}%. 
                                    This indicates you're prioritizing speed over precision, leading to frequent errors.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Mistake 2: Inconsistent performance */}
                          {(() => {
                            if (recentTests.length < 3) return null;
                            const gap = stats.bestWpm - stats.avgWpm;
                            if (gap > 15) {
                              return (
                                <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                                  <div className="flex items-start gap-3">
                                    <div className="p-2 bg-destructive/10 rounded">
                                      <Activity className="w-4 h-4 text-destructive" />
                                    </div>
                                    <div className="flex-1">
                                      <h5 className="font-medium text-destructive mb-1">Inconsistent Performance</h5>
                                      <p className="text-sm text-muted-foreground">
                                        Your performance varies significantly (Best: {stats.bestWpm} WPM, Avg: {stats.avgWpm} WPM, Gap: {gap} WPM). 
                                        This suggests irregular practice habits or improper typing posture.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()}

                          {/* Mistake 3: Low accuracy */}
                          {stats.accuracy < 85 && (
                            <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-destructive/10 rounded">
                                  <Target className="w-4 h-4 text-destructive" />
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-medium text-destructive mb-1">Low Accuracy Rate</h5>
                                  <p className="text-sm text-muted-foreground">
                                    Your accuracy is {stats.accuracy}%, which is below the recommended 90% threshold. 
                                    This indicates fundamental issues with finger placement or unfamiliarity with key positions.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Mistake 4: Increasing errors */}
                          {(() => {
                            if (recentTests.length < 4) return null;
                            const recent = recentTests.slice(0, 2);
                            const older = recentTests.slice(2, 4);
                            const recentErrors = recent.reduce((sum, t) => sum + (t.errors || 0), 0) / recent.length;
                            const olderErrors = older.reduce((sum, t) => sum + (t.errors || 0), 0) / older.length;
                            
                            if (recentErrors > olderErrors + 2) {
                              return (
                                <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                                  <div className="flex items-start gap-3">
                                    <div className="p-2 bg-destructive/10 rounded">
                                      <TrendingUp className="w-4 h-4 text-destructive" />
                                    </div>
                                    <div className="flex-1">
                                      <h5 className="font-medium text-destructive mb-1">Error Rate Increasing</h5>
                                      <p className="text-sm text-muted-foreground">
                                        Your recent tests show {recentErrors.toFixed(1)} errors on average compared to {olderErrors.toFixed(1)} in previous tests. 
                                        This suggests fatigue or developing bad habits.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()}

                          {/* Mistake 5: Low practice frequency */}
                          {stats.streak < 2 && (
                            <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-destructive/10 rounded">
                                  <Calendar className="w-4 h-4 text-destructive" />
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-medium text-destructive mb-1">Irregular Practice Schedule</h5>
                                  <p className="text-sm text-muted-foreground">
                                    Your practice streak is only {stats.streak} day(s). 
                                    Irregular practice prevents muscle memory development and limits improvement.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* All good message */}
                          {stats.accuracy >= 90 && stats.avgWpm > 40 && (stats.bestWpm - stats.avgWpm) <= 15 && stats.streak >= 2 && (
                            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary/10 rounded">
                                  <Trophy className="w-4 h-4 text-primary" />
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-medium text-primary mb-1">Great Performance!</h5>
                                  <p className="text-sm text-muted-foreground">
                                    No major issues detected. You're maintaining good accuracy ({stats.accuracy}%), 
                                    consistent speed ({stats.avgWpm} WPM), and regular practice. Keep it up!
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Solutions & Practice Tips */}
                      <div className="space-y-3 mt-6">
                        <h4 className="font-medium flex items-center gap-2">
                          <Zap className="w-5 h-5 text-primary" />
                          Solutions & Practice Tips
                        </h4>

                        <div className="grid grid-cols-1 gap-3">
                          {/* Solution 1: For low accuracy */}
                          {stats.accuracy < 90 && (
                            <div className="p-4 bg-primary/10 rounded-lg">
                              <h5 className="font-medium text-primary mb-2">🎯 Improve Accuracy</h5>
                              <ul className="text-sm text-muted-foreground space-y-2">
                                <li className="flex items-start gap-2">
                                  <span className="text-primary mt-1">•</span>
                                  <span><strong>Slow Down:</strong> Reduce your typing speed by 25-30% and focus on hitting the correct keys</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-primary mt-1">•</span>
                                  <span><strong>Practice Proper Form:</strong> Keep your fingers on home row (ASDF JKL;) and use the correct finger for each key</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-primary mt-1">•</span>
                                  <span><strong>Drill Problem Keys:</strong> Identify keys you frequently miss and practice them individually for 5 minutes daily</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-primary mt-1">•</span>
                                  <span><strong>Don't Look at Keyboard:</strong> Train yourself to touch type without looking down - this builds proper muscle memory</span>
                                </li>
                              </ul>
                            </div>
                          )}

                          {/* Solution 2: For speed improvement */}
                          {stats.accuracy >= 95 && stats.avgWpm < 60 && (
                            <div className="p-4 bg-primary/10 rounded-lg">
                              <h5 className="font-medium text-primary mb-2">⚡ Increase Speed</h5>
                              <ul className="text-sm text-muted-foreground space-y-2">
                                <li className="flex items-start gap-2">
                                  <span className="text-primary mt-1">•</span>
                                  <span><strong>Progressive Overload:</strong> Try to type 5% faster each week while maintaining 95%+ accuracy</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-primary mt-1">•</span>
                                  <span><strong>Rhythm Practice:</strong> Use a metronome or music to develop consistent typing rhythm</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-primary mt-1">•</span>
                                  <span><strong>Word Chunks:</strong> Focus on typing common word patterns as single units rather than individual letters</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-primary mt-1">•</span>
                                  <span><strong>Challenge Yourself:</strong> Practice with more complex texts that include numbers and punctuation</span>
                                </li>
                              </ul>
                            </div>
                          )}

                          {/* Solution 3: For consistency */}
                          {(() => {
                            if (recentTests.length < 3) return null;
                            const gap = stats.bestWpm - stats.avgWpm;
                            if (gap > 15) {
                              return (
                                <div className="p-4 bg-primary/10 rounded-lg">
                                  <h5 className="font-medium text-primary mb-2">📊 Build Consistency</h5>
                                  <ul className="text-sm text-muted-foreground space-y-2">
                                    <li className="flex items-start gap-2">
                                      <span className="text-primary mt-1">•</span>
                                      <span><strong>Daily Practice:</strong> Practice at the same time each day for 15-20 minutes to build routine</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <span className="text-primary mt-1">•</span>
                                      <span><strong>Proper Ergonomics:</strong> Ensure your chair height, desk position, and monitor angle are optimal</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <span className="text-primary mt-1">•</span>
                                      <span><strong>Warm Up:</strong> Start each session with 2-3 minutes of easy text before attempting full-speed tests</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <span className="text-primary mt-1">•</span>
                                      <span><strong>Avoid Fatigue:</strong> Take 5-minute breaks between intense practice sessions</span>
                                    </li>
                                  </ul>
                                </div>
                              );
                            }
                            return null;
                          })()}

                          {/* Solution 4: General improvement tips */}
                          <div className="p-4 bg-secondary-glow/10 rounded-lg">
                            <h5 className="font-medium text-secondary-glow mb-2">💡 General Tips for Excellence</h5>
                            <ul className="text-sm text-muted-foreground space-y-2">
                              <li className="flex items-start gap-2">
                                <span className="text-secondary-glow mt-1">•</span>
                                <span><strong>Set Realistic Goals:</strong> Aim for gradual improvement - 5 WPM increase per month is excellent progress</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-secondary-glow mt-1">•</span>
                                <span><strong>Track Your Progress:</strong> Review this dashboard weekly to identify trends and adjust your practice</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-secondary-glow mt-1">•</span>
                                <span><strong>Vary Your Practice:</strong> Switch between different text types (quotes, stories, code) to build versatility</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-secondary-glow mt-1">•</span>
                                <span><strong>Stay Motivated:</strong> Celebrate small wins and remember that muscle memory takes time to develop</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-secondary-glow mt-1">•</span>
                                <span><strong>Practice Mindfully:</strong> Focus on quality practice rather than mindless repetition - be aware of your mistakes</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Complete typing tests to see detailed mistake analysis and solutions.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;