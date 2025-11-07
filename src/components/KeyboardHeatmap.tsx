import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const KEYBOARD_LAYOUT = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/']
];

interface KeyErrors {
  [key: string]: number;
}

const KeyboardHeatmap = () => {
  const { user } = useAuth();
  const [keyErrors, setKeyErrors] = useState<KeyErrors>({});
  const [maxErrors, setMaxErrors] = useState(0);
  const [loading, setLoading] = useState(true);
  const [testCount, setTestCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchKeyErrors = async () => {
      // First, get total test count
      const { count } = await supabase
        .from('typing_tests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setTestCount(count || 0);

      // If less than 5 tests, don't fetch key errors yet
      if ((count || 0) < 5) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('typing_tests')
        .select('key_errors')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching key errors:', error);
        setLoading(false);
        return;
      }

      // Aggregate all key errors from recent tests
      const aggregated: KeyErrors = {};
      data?.forEach(test => {
        if (test.key_errors) {
          Object.entries(test.key_errors as KeyErrors).forEach(([key, count]) => {
            aggregated[key] = (aggregated[key] || 0) + count;
          });
        }
      });

      setKeyErrors(aggregated);
      setMaxErrors(Math.max(...Object.values(aggregated), 1));
      setLoading(false);
    };

    fetchKeyErrors();
  }, [user]);

  const getKeyColor = (key: string) => {
    const errorCount = keyErrors[key.toLowerCase()] || 0;
    if (errorCount === 0) return 'bg-card border-border';
    
    const intensity = Math.min(errorCount / maxErrors, 1);
    
    if (intensity < 0.2) return 'bg-yellow-500/20 border-yellow-500/40';
    if (intensity < 0.4) return 'bg-yellow-500/40 border-yellow-500/60';
    if (intensity < 0.6) return 'bg-orange-500/40 border-orange-500/60';
    if (intensity < 0.8) return 'bg-red-500/40 border-red-500/60';
    return 'bg-red-500/60 border-red-500/80';
  };

  const getKeyErrorCount = (key: string) => {
    return keyErrors[key.toLowerCase()] || 0;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Keyboard Heatmap</h3>
        <div className="text-muted-foreground">Loading your typing data...</div>
      </Card>
    );
  }

  // Show progress message if less than 5 tests
  if (testCount < 5) {
    const testsRemaining = 5 - testCount;
    return (
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Keyboard Heatmap</h3>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Complete {testsRemaining} more typing {testsRemaining === 1 ? 'test' : 'tests'} to unlock your personalized keyboard heatmap!
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{testCount}/5 tests</span>
            </div>
            <Progress value={(testCount / 5) * 100} className="h-2" />
          </div>
          <p className="text-xs text-muted-foreground">
            The heatmap will show which keys you mistype most frequently, helping you focus your practice.
          </p>
        </div>
      </Card>
    );
  }

  if (Object.keys(keyErrors).length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Keyboard Heatmap</h3>
        <div className="text-muted-foreground">
          No error data available yet. Keep practicing!
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Keyboard Heatmap</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Shows which keys you mistype most frequently (based on last 50 tests)
        </p>
        
        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <span className="text-muted-foreground">Error Frequency:</span>
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 bg-card border border-border rounded"></div>
            <span>None</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 bg-yellow-500/20 border border-yellow-500/40 rounded"></div>
            <span>Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 bg-orange-500/40 border border-orange-500/60 rounded"></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 bg-red-500/60 border border-red-500/80 rounded"></div>
            <span>High</span>
          </div>
        </div>
      </div>

      {/* Keyboard Layout */}
      <div className="flex flex-col items-center gap-2">
        {KEYBOARD_LAYOUT.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-2" style={{ marginLeft: rowIndex * 16 }}>
            {row.map((key) => {
              const errorCount = getKeyErrorCount(key);
              return (
                <div
                  key={key}
                  className={`
                    relative w-12 h-12 flex items-center justify-center 
                    rounded border-2 font-mono font-semibold text-sm
                    transition-all duration-200 hover:scale-110 cursor-pointer
                    ${getKeyColor(key)}
                  `}
                  title={`${key}: ${errorCount} error${errorCount !== 1 ? 's' : ''}`}
                >
                  {key.toUpperCase()}
                  {errorCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {errorCount}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        
        {/* Spacebar */}
        <div className="flex gap-2 mt-2">
          <div
            className={`
              relative w-96 h-12 flex items-center justify-center 
              rounded border-2 font-mono font-semibold text-sm
              transition-all duration-200 hover:scale-105 cursor-pointer
              ${getKeyColor(' ')}
            `}
            title={`Space: ${getKeyErrorCount(' ')} error${getKeyErrorCount(' ') !== 1 ? 's' : ''}`}
          >
            SPACE
            {getKeyErrorCount(' ') > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                {getKeyErrorCount(' ')}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default KeyboardHeatmap;