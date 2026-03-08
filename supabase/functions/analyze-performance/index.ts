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

    // Call Lovable AI for personalized analysis
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = `As an expert typing coach, analyze this user's comprehensive performance data and provide highly personalized, actionable insights:

**Overall Statistics:**
- Total Tests Completed: ${totalTests}
- Average WPM: ${avgWpm.toFixed(1)} (Best: ${bestWpm}, Worst: ${worstWpm})
- Average Accuracy: ${avgAccuracy.toFixed(1)}% (Best: ${bestAccuracy.toFixed(1)}%, Worst: ${worstAccuracy.toFixed(1)}%)
- Overall Error Rate: ${errorRate}%
- WPM Variance: ${wpmVariance.toFixed(1)} (consistency indicator)
- Accuracy Variance: ${accuracyVariance.toFixed(1)}%

**Progress Trends:**
- Recent Performance (last 5 tests): ${recentWpm.toFixed(1)} WPM at ${recentAccuracy.toFixed(1)}% accuracy
${olderTests.length > 0 ? `- Historical Average: ${olderWpm.toFixed(1)} WPM at ${olderAccuracy.toFixed(1)}% accuracy` : '- Not enough historical data'}
- Improvement Rate: ${olderTests.length > 0 ? `${((recentWpm - olderWpm) / olderWpm * 100).toFixed(1)}% WPM change, ${((recentAccuracy - olderAccuracy) / olderAccuracy * 100).toFixed(1)}% accuracy change` : 'Building baseline'}

**Practice Patterns:**
- Days Active: ${daysSinceFirst}
- Tests Per Day: ${testsPerDay.toFixed(2)}
- Languages Practiced: ${languages.join(', ')}
- Average Test Duration: ${avgDuration.toFixed(0)} seconds

**Recent Test Details:**
${tests.slice(0, 8).map((t, i) => `${i + 1}. ${t.wpm} WPM, ${Number(t.accuracy).toFixed(1)}% accuracy, ${t.errors} errors, ${t.test_duration}s (${t.language})`).join('\n')}

Provide a comprehensive performance analysis with:

## 1. Performance Assessment
- Overall skill level evaluation (beginner/intermediate/advanced)
- Strongest areas and weakest areas
- Current trajectory (improving/plateauing/regressing)

## 2. Personalized Strengths & Weaknesses
- Identify 3 specific strengths with examples from their data
- Pinpoint 3-4 critical weaknesses that need attention
- Explain how these affect overall performance

## 3. Tailored Practice Recommendations
Based on their specific performance profile, provide:
- **Daily Practice Routine**: Specific exercises for their level (10-15 mins)
- **Weekly Focus Areas**: What to prioritize this week
- **Targeted Drills**: Specific exercises for their weaknesses
- **Progression Milestones**: Clear next goals to achieve

## 4. Custom Improvement Strategy
Create a personalized 4-week plan:
- Week 1-2 goals and focus areas
- Week 3-4 goals and advanced techniques
- Success metrics to track

## 5. Motivation & Insights
- Celebrate specific improvements from their data
- Realistic timeline for next achievement
- Encouraging words based on their actual progress

Be highly specific, reference their actual numbers, and make recommendations that directly address their unique situation. Format in clear markdown.`;

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
            content: 'You are a world-class typing coach with expertise in skill development and personalized training. Provide detailed, encouraging, and actionable guidance tailored to each individual user\'s performance data and goals.'
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
      throw new Error('AI performance analysis failed');
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
          bestWpm,
          avgAccuracy: avgAccuracy.toFixed(1),
          improvement: olderTests.length > 0 ? ((recentWpm - olderWpm) / olderWpm * 100).toFixed(1) : null
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
