import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface TypingTest {
  key_errors?: any;
}

interface ErrorAnalysisByKeyChartProps {
  tests: TypingTest[];
}

export const ErrorAnalysisByKeyChart = ({ tests }: ErrorAnalysisByKeyChartProps) => {
  // Aggregate error counts across all tests
  const errorCounts: { [key: string]: number } = {};
  
  tests.forEach(test => {
    if (test.key_errors && typeof test.key_errors === 'object') {
      Object.entries(test.key_errors).forEach(([key, count]) => {
        if (typeof count === 'number') {
          errorCounts[key] = (errorCounts[key] || 0) + count;
        }
      });
    }
  });

  // Convert to array and sort by error count
  const chartData = Object.entries(errorCounts)
    .map(([key, errors]) => ({
      key: key.toUpperCase(),
      errors,
    }))
    .sort((a, b) => b.errors - a.errors)
    .slice(0, 15); // Top 15 most error-prone keys

  if (chartData.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle>Error Analysis by Key</CardTitle>
          <CardDescription>Most frequently mistyped keys</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No error data available yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle>Error Analysis by Key</CardTitle>
        <CardDescription>Top 15 most frequently mistyped keys</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="key" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
              label={{ value: 'Error Count', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))' } }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))'
              }}
            />
            <Bar 
              dataKey="errors" 
              fill="hsl(var(--destructive))" 
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
