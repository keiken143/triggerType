import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Calendar, ArrowLeft, Activity } from "lucide-react";

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

const AllTests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tests, setTests] = useState<TypingTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      const { data, error } = await supabase
        .from("typing_tests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error) setTests(data || []);
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    const diffDays = Math.ceil(Math.abs(today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    return `${diffDays} days ago`;
  };

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const rem = seconds % 60;
    return rem > 0 ? `${minutes}m ${rem}s` : `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-background">
      <div className="fixed inset-0 opacity-5" style={{ backgroundImage: "var(--pattern-grid)" }} />
      <Navbar />
      <div className="container mx-auto px-6 pt-24 pb-12">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => navigate("/progressboard")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">All Tests</h1>
            <p className="text-muted-foreground">{tests.length} total typing tests</p>
          </div>
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Test History</span>
            </CardTitle>
            <CardDescription>Complete history of all your typing tests</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-surface rounded-lg animate-pulse">
                    <div className="h-4 bg-muted rounded w-20" />
                    <div className="flex space-x-4">
                      <div className="h-4 bg-muted rounded w-16" />
                      <div className="h-4 bg-muted rounded w-12" />
                      <div className="h-4 bg-muted rounded w-12" />
                    </div>
                  </div>
                ))}
              </div>
            ) : tests.length > 0 ? (
              <div className="space-y-3">
                {tests.map((test) => (
                  <div key={test.id} className="flex items-center justify-between p-3 bg-surface rounded-lg hover:bg-surface/80 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
                        <span className="text-sm">{formatDate(test.created_at)}</span>
                        <span className="text-xs text-muted-foreground hidden sm:inline">{formatFullDate(test.created_at)}</span>
                      </div>
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
              <div className="text-center py-12">
                <p className="text-muted-foreground">No typing tests completed yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AllTests;
