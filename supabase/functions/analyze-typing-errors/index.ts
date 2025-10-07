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
          analysis: "No typing tests found. Complete some tests to get AI-powered analysis of your mistakes and improvement recommendations.",
          hasData: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare data summary for AI
    const totalTests = tests.length;
    const avgWpm = tests.reduce((sum, t) => sum + t.wpm, 0) / totalTests;
    const avgAccuracy = tests.reduce((sum, t) => sum + Number(t.accuracy), 0) / totalTests;
    const totalErrors = tests.reduce((sum, t) => sum + t.errors, 0);
    const avgErrors = totalErrors / totalTests;

    // Recent performance
    const recentTests = tests.slice(0, Math.min(5, totalTests));
    const recentWpm = recentTests.reduce((sum, t) => sum + t.wpm, 0) / recentTests.length;
    const recentAccuracy = recentTests.reduce((sum, t) => sum + Number(t.accuracy), 0) / recentTests.length;

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = `Analyze this typing test data and provide specific, actionable insights:

Total Tests: ${totalTests}
Average WPM: ${avgWpm.toFixed(1)}
Average Accuracy: ${avgAccuracy.toFixed(1)}%
Total Errors: ${totalErrors}
Average Errors per Test: ${avgErrors.toFixed(1)}

Recent Performance (last 5 tests):
- Recent WPM: ${recentWpm.toFixed(1)}
- Recent Accuracy: ${recentAccuracy.toFixed(1)}%

Test History (most recent first):
${tests.slice(0, 10).map((t, i) => `${i + 1}. WPM: ${t.wpm}, Accuracy: ${Number(t.accuracy).toFixed(1)}%, Errors: ${t.errors}, Duration: ${t.test_duration}s`).join('\n')}

Provide a detailed analysis covering:
1. **Error Patterns**: What specific mistakes are they making based on error frequency and accuracy?
2. **Performance Trends**: Is their speed improving? Is accuracy consistent?
3. **Problem Areas**: Identify 3-4 specific weaknesses (e.g., "rushing through tests", "inconsistent accuracy", "high error rate on longer tests")
4. **Actionable Solutions**: For each problem area, provide 2-3 specific practice techniques or exercises
5. **Progression Strategy**: Create a clear improvement plan with measurable goals

Format the response in markdown with clear sections and bullet points. Be specific and actionable.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert typing coach analyzing performance data. Provide detailed, specific, and actionable feedback to help users improve their typing skills.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service requires payment. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error('AI analysis failed');
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.choices[0].message.content;

    return new Response(
      JSON.stringify({ 
        analysis,
        hasData: true,
        stats: {
          totalTests,
          avgWpm: avgWpm.toFixed(1),
          avgAccuracy: avgAccuracy.toFixed(1),
          totalErrors,
          avgErrors: avgErrors.toFixed(1)
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-typing-errors:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
