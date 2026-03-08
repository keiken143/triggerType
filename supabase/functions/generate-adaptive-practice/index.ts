import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

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
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch recent typing tests to analyze performance
    const { data: recentTests, error: testsError } = await supabase
      .from('typing_tests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (testsError) {
      console.error('Error fetching tests:', testsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch typing history' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!recentTests || recentTests.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Complete at least one typing test to use adaptive practice' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate performance metrics
    const avgWpm = recentTests.reduce((sum, t) => sum + t.wpm, 0) / recentTests.length;
    const avgAccuracy = recentTests.reduce((sum, t) => sum + t.accuracy, 0) / recentTests.length;
    const totalErrors = recentTests.reduce((sum, t) => sum + t.errors, 0);

    // Aggregate key errors from recent tests
    const keyErrors: Record<string, number> = {};
    recentTests.forEach(test => {
      if (test.key_errors) {
        Object.entries(test.key_errors as Record<string, number>).forEach(([key, count]) => {
          keyErrors[key] = (keyErrors[key] || 0) + count;
        });
      }
    });

    // Identify top 5 problem keys
    const problemKeys = Object.entries(keyErrors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key]) => key);

    // Determine difficulty level based on performance
    let difficultyLevel: string;
    let difficultyDescription: string;
    
    if (avgWpm < 40 || avgAccuracy < 85) {
      difficultyLevel = 'beginner';
      difficultyDescription = 'Building fundamentals';
    } else if (avgWpm < 70 || avgAccuracy < 92) {
      difficultyLevel = 'intermediate';
      difficultyDescription = 'Developing fluency';
    } else {
      difficultyLevel = 'advanced';
      difficultyDescription = 'Mastering precision';
    }

    // Create AI prompt based on user's performance
    const systemPrompt = `You are an adaptive typing coach. Generate personalized typing practice text based on the user's performance data.

Difficulty Level: ${difficultyLevel}
Average WPM: ${Math.round(avgWpm)}
Average Accuracy: ${Math.round(avgAccuracy)}%
Problem Keys: ${problemKeys.length > 0 ? problemKeys.join(', ') : 'none identified yet'}

Guidelines:
- For BEGINNER: Use simple sentences with common words, minimal punctuation, focus on frequently used letters
- For INTERMEDIATE: Include varied sentence structures, moderate punctuation, some less common words
- For ADVANCED: Use complex sentences, heavy punctuation, technical terms, uncommon letter combinations

${problemKeys.length > 0 ? `IMPORTANT: Include words that naturally contain these problem keys: ${problemKeys.join(', ')}. Spread them throughout the text.` : ''}

Generate exactly 150-200 words of practice text. Make it engaging, coherent, and appropriately challenging.`;

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Lovable AI to generate adaptive practice text
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate adaptive typing practice text now.' }
        ],
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
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

      return new Response(
        JSON.stringify({ error: 'Failed to generate adaptive practice text' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const generatedText = aiData.choices[0].message.content;

    return new Response(
      JSON.stringify({
        text: generatedText,
        difficulty: difficultyLevel,
        difficultyDescription,
        metrics: {
          avgWpm: Math.round(avgWpm),
          avgAccuracy: Math.round(avgAccuracy),
          problemKeys: problemKeys.length > 0 ? problemKeys : [],
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-adaptive-practice:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
