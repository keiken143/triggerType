import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
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

const Dashboard = () => {
  // Mock data - in real app this would come from your backend
  const stats = {
    avgWpm: 85,
    bestWpm: 142,
    accuracy: 94,
    hoursTyped: 47,
    testsCompleted: 156,
    streak: 12
  };

  const recentTests = [
    { date: "Today", wpm: 89, accuracy: 96, duration: "1m" },
    { date: "Yesterday", wpm: 82, accuracy: 94, duration: "2m" },
    { date: "2 days ago", wpm: 87, accuracy: 95, duration: "1m" },
    { date: "3 days ago", wpm: 91, accuracy: 93, duration: "5m" },
  ];

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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="biometrics">Biometrics</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
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
                  <div className="space-y-4">
                    {recentTests.map((test, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{test.date}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-primary font-medium">{test.wpm} WPM</span>
                          <span className="text-muted-foreground">{test.accuracy}%</span>
                          <span className="text-muted-foreground">{test.duration}</span>
                        </div>
                      </div>
                    ))}
                  </div>
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
                      <span>Daily Practice (30 min)</span>
                      <span>22/30 min</span>
                    </div>
                    <Progress value={73} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="biometrics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Keystroke Dynamics */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle>Keystroke Dynamics</CardTitle>
                  <CardDescription>Your unique typing fingerprint</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg Hold Time</span>
                    <span className="text-sm font-mono">127ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg Transition Time</span>
                    <span className="text-sm font-mono">89ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Typing Rhythm</span>
                    <span className="text-sm font-mono">Consistent</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Hand Preference</span>
                    <span className="text-sm font-mono">Right: 52%</span>
                  </div>
                </CardContent>
              </Card>

              {/* Weak Keys */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle>Keys to Improve</CardTitle>
                  <CardDescription>Focus on these keys for better accuracy</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {weakKeys.map((key, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-destructive/20 rounded flex items-center justify-center text-sm font-mono">
                            {key.key}
                          </div>
                          <span className="text-sm">Accuracy: {key.accuracy}%</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{key.frequency} hits</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle>Progress Charts</CardTitle>
                <CardDescription>Visualize your typing improvement over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-surface rounded-lg border-2 border-dashed border-border">
                  <p className="text-muted-foreground">Progress charts will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle>Performance Analysis</CardTitle>
                  <CardDescription>AI-powered insights into your typing patterns</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <h4 className="font-medium text-primary mb-2">Strength</h4>
                    <p className="text-sm text-muted-foreground">
                      Your typing speed has improved 15% over the last month, particularly on common letter combinations.
                    </p>
                  </div>
                  <div className="p-4 bg-secondary-glow/10 rounded-lg">
                    <h4 className="font-medium text-secondary-glow mb-2">Opportunity</h4>
                    <p className="text-sm text-muted-foreground">
                      Focus on number row accuracy - practicing 2-3 minutes daily could improve overall accuracy by 3%.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                  <CardDescription>Personalized practice suggestions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-surface rounded-lg">
                    <Clock className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Daily Practice</p>
                      <p className="text-xs text-muted-foreground">Practice 15-20 minutes daily for optimal improvement</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-surface rounded-lg">
                    <Target className="w-5 h-5 text-secondary-glow mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Focus Areas</p>
                      <p className="text-xs text-muted-foreground">Work on Q, Z, X keys to improve overall accuracy</p>
                    </div>
                  </div>
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