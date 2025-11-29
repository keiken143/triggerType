import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface TypingTest {
  wpm: number;
  accuracy: number;
  errors: number;
  test_duration: number;
}

interface PerformanceComparisonChartProps {
  tests: TypingTest[];
}

export const PerformanceComparisonChart = ({ tests }: PerformanceComparisonChartProps) => {
  if (tests.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle>Performance Comparison</CardTitle>
          <CardDescription>Compare your best, average, and latest performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No test data available yet
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate statistics
  const avgWpm = Math.round(tests.reduce((sum, t) => sum + t.wpm, 0) / tests.length);
  const avgAccuracy = Math.round(tests.reduce((sum, t) => sum + t.accuracy, 0) / tests.length);
  const avgErrors = Math.round(tests.reduce((sum, t) => sum + t.errors, 0) / tests.length);

  const bestWpm = Math.max(...tests.map(t => t.wpm));
  const bestAccuracy = Math.max(...tests.map(t => t.accuracy));
  const bestTest = tests.find(t => t.wpm === bestWpm);
  const minErrors = Math.min(...tests.map(t => t.errors));

  const latestTest = tests[tests.length - 1];
  const latestWpm = latestTest.wpm;
  const latestAccuracy = Math.round(latestTest.accuracy);
  const latestErrors = latestTest.errors;

  const chartData = [
    {
      metric: 'WPM',
      Best: bestWpm,
      Average: avgWpm,
      Latest: latestWpm,
    },
    {
      metric: 'Accuracy',
      Best: Math.round(bestAccuracy),
      Average: avgAccuracy,
      Latest: latestAccuracy,
    },
    {
      metric: 'Errors',
      Best: minErrors,
      Average: avgErrors,
      Latest: latestErrors,
    },
  ];

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle>Performance Comparison</CardTitle>
        <CardDescription>Compare your best, average, and latest performance</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="metric" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))'
              }}
            />
            <Legend 
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '14px'
              }}
            />
            <Bar 
              dataKey="Best" 
              fill="hsl(var(--secondary-glow))" 
              radius={[8, 8, 0, 0]}
            />
            <Bar 
              dataKey="Average" 
              fill="hsl(var(--primary))" 
              radius={[8, 8, 0, 0]}
            />
            <Bar 
              dataKey="Latest" 
              fill="hsl(var(--accent))" 
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
