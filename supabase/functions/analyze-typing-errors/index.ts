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

    // Call Gemini
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert typing coach. Analyze biometric error patterns and provide HIGHLY CONCISE structural feedback. 
RULES:
1. USE ONLY SMALL BULLET POINTS (max 10 words per point).
2. NO LONG PARAGRAPHS.
3. BE DATA-DRIVEN AND DIRECT.
4. USE MARKDOWN BULLETS (-).
5. STRUCTURE: ## Error Patterns, ## Trends, ## Weaknesses, ## Solutions.`;

    const prompt = `
    - Total Tests: ${totalTests}
    - Avg Accuracy: ${avgAccuracy.toFixed(1)}%
    - Recent Accuracy (last 5): ${recentAccuracy.toFixed(1)}%
    - Avg Errors per Test: ${avgErrors.toFixed(1)}
    - Total Error Count: ${totalErrors}
    - Avg Performance WPM: ${avgWpm.toFixed(1)}
    - Recent Performance WPM: ${recentWpm.toFixed(1)}
    `;

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${systemPrompt}\n\nDATA:\n${prompt}` }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Gemini error:', aiResponse.status, errorText);
      throw new Error('Gemini analysis failed');
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "Error analysis unavailable.";

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
