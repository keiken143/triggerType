import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface TypingTest {
  created_at: string;
  wpm: number;
  accuracy: number;
}

interface PerformanceOverTimeChartProps {
  tests: TypingTest[];
}

export const PerformanceOverTimeChart = ({ tests }: PerformanceOverTimeChartProps) => {
  // Sort tests by date and format data for chart
  const chartData = tests
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((test, index) => ({
      test: index + 1,
      date: new Date(test.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      wpm: test.wpm,
      accuracy: Math.round(test.accuracy),
    }));

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle>Performance Over Time</CardTitle>
        <CardDescription>Track your WPM and accuracy progress</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="date" 
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
            <Line 
              type="monotone" 
              dataKey="wpm" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
              name="WPM"
            />
            <Line 
              type="monotone" 
              dataKey="accuracy" 
              stroke="hsl(var(--secondary-glow))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--secondary-glow))', r: 4 }}
              name="Accuracy %"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
