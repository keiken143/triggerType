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
    <Card className="p-3 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-semibold mb-2">Keyboard Heatmap</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
          Shows which keys you mistype most frequently (based on last 50 tests)
        </p>
        
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs">
          <span className="text-muted-foreground w-full sm:w-auto mb-1 sm:mb-0">Error Frequency:</span>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-6 h-4 sm:w-8 sm:h-6 bg-card border border-border rounded"></div>
            <span>None</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-6 h-4 sm:w-8 sm:h-6 bg-yellow-500/20 border border-yellow-500/40 rounded"></div>
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-6 h-4 sm:w-8 sm:h-6 bg-orange-500/40 border border-orange-500/60 rounded"></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-6 h-4 sm:w-8 sm:h-6 bg-red-500/60 border border-red-500/80 rounded"></div>
            <span>High</span>
          </div>
        </div>
      </div>

      {/* Keyboard Layout */}
      <div className="overflow-x-auto pb-2">
        <div className="flex flex-col items-center gap-1 sm:gap-2 min-w-max mx-auto scale-75 sm:scale-90 md:scale-100">
          {KEYBOARD_LAYOUT.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1 sm:gap-2" style={{ marginLeft: `${rowIndex * 8}px` }}>
              {row.map((key) => {
                const errorCount = getKeyErrorCount(key);
                return (
                  <div
                    key={key}
                    className={`
                      relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center 
                      rounded border-2 font-mono font-semibold text-[10px] sm:text-xs md:text-sm
                      transition-all duration-200 hover:scale-110 cursor-pointer
                      ${getKeyColor(key)}
                    `}
                    title={`${key}: ${errorCount} error${errorCount !== 1 ? 's' : ''}`}
                  >
                    {key.toUpperCase()}
                    {errorCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                        {errorCount}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          
          {/* Spacebar */}
          <div className="flex gap-1 sm:gap-2 mt-1 sm:mt-2">
            <div
              className={`
                relative w-64 sm:w-80 md:w-96 h-8 sm:h-10 md:h-12 flex items-center justify-center 
                rounded border-2 font-mono font-semibold text-[10px] sm:text-xs md:text-sm
                transition-all duration-200 hover:scale-105 cursor-pointer
                ${getKeyColor(' ')}
              `}
              title={`Space: ${getKeyErrorCount(' ')} error${getKeyErrorCount(' ') !== 1 ? 's' : ''}`}
            >
              SPACE
              {getKeyErrorCount(' ') > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex items-center justify-center">
                  {getKeyErrorCount(' ')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default KeyboardHeatmap;