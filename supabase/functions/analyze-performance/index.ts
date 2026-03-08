import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Fetch user's typing tests
    const { data: tests, error: testsError } = await supabase
      .from('typing_tests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (testsError) {
      console.error('Error fetching tests:', testsError);
      throw testsError;
    }

    if (!tests || tests.length === 0) {
      return new Response(
        JSON.stringify({
          analysis: "Complete some typing tests first to receive personalized performance analysis and tailored practice suggestions!",
          hasData: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate comprehensive statistics
    const totalTests = tests.length;
    const avgWpm = tests.reduce((sum, t) => sum + t.wpm, 0) / totalTests;
    const bestWpm = Math.max(...tests.map(t => t.wpm));
    const worstWpm = Math.min(...tests.map(t => t.wpm));
    const avgAccuracy = tests.reduce((sum, t) => sum + Number(t.accuracy), 0) / totalTests;
    const bestAccuracy = Math.max(...tests.map(t => Number(t.accuracy)));
    const worstAccuracy = Math.min(...tests.map(t => Number(t.accuracy)));
    const totalErrors = tests.reduce((sum, t) => sum + t.errors, 0);
    const totalCharacters = tests.reduce((sum, t) => sum + t.character_count, 0);
    const errorRate = (totalErrors / totalCharacters * 100).toFixed(2);

    // Recent vs historical comparison
    const recentTests = tests.slice(0, Math.min(5, totalTests));
    const olderTests = tests.slice(5);
    const recentWpm = recentTests.reduce((sum, t) => sum + t.wpm, 0) / recentTests.length;
    const recentAccuracy = recentTests.reduce((sum, t) => sum + Number(t.accuracy), 0) / recentTests.length;
    const olderWpm = olderTests.length > 0 ? olderTests.reduce((sum, t) => sum + t.wpm, 0) / olderTests.length : 0;
    const olderAccuracy = olderTests.length > 0 ? olderTests.reduce((sum, t) => sum + Number(t.accuracy), 0) / olderTests.length : 0;

    // Consistency metrics
    const wpmVariance = Math.abs(bestWpm - worstWpm);
    const accuracyVariance = Math.abs(bestAccuracy - worstAccuracy);

    // Practice patterns
    const languages = [...new Set(tests.map(t => t.language))];
    const avgDuration = tests.reduce((sum, t) => sum + t.test_duration, 0) / totalTests;

    // Time-based patterns
    const testDates = tests.map(t => new Date(t.created_at));
    const daysSinceFirst = Math.ceil((Date.now() - testDates[testDates.length - 1].getTime()) / (1000 * 60 * 60 * 24));
    const testsPerDay = totalTests / Math.max(daysSinceFirst, 1);

    // Call Groq for personalized analysis
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    const systemPrompt = `You are a world-class typing coach. Analyze performance data and provide EXTREMELY CONCISE, ACTIONABLE insights.
RULES:
1. USE ONLY SMALL BULLET POINTS (max 10 words per point).
2. NO LONG PARAGRAPHS.
3. BE BLUNT AND ARCHITECTURAL.
4. USE MARKDOWN BULLETS (-).
5. STRUCTURE: ## Assessment, ## Strengths, ## Weaknesses, ## Strategy.`;

    const improvementCount = olderTests.length > 0 ? ((recentWpm - olderWpm) / olderWpm * 100).toFixed(1) : "0.0";

    // Prepare the prompt data
    const prompt = `
    - Total Tests: ${totalTests}
    - Historical Avg WPM: ${avgWpm.toFixed(1)}
    - Recent Avg WPM (last 5): ${recentWpm.toFixed(1)}
    - Best WPM: ${bestWpm}
    - Worst WPM: ${worstWpm}
    - Historical Avg Accuracy: ${avgAccuracy.toFixed(1)}%
    - Recent Avg Accuracy: ${recentAccuracy.toFixed(1)}%
    - Error Rate: ${errorRate}%
    - Languages Practiced: ${languages.join(', ')}
    - Consistency (WPM/Acc Variance): ${wpmVariance.toFixed(1)}/${accuracyVariance.toFixed(1)}
    - Tests Per Day: ${testsPerDay.toFixed(2)}
    - Improvement Trend: ${improvementCount}%
    `;

    const aiResponse = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `DATA:\n${prompt}` }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Groq error:', aiResponse.status, errorText);
      throw new Error('Groq analysis failed');
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.choices?.[0]?.message?.content || "Analysis unavailable.";

    return new Response(
      JSON.stringify({
        analysis,
        hasData: true,
        stats: {
          totalTests,
          avgWpm: avgWpm.toFixed(1),
          bestWpm,
          avgAccuracy: avgAccuracy.toFixed(1),
          improvement: improvementCount
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-performance:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
