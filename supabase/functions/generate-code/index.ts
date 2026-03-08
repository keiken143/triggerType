import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_LANGUAGES = ['simple', 'javascript', 'typescript', 'python', 'java', 'csharp', 'cpp', 'rust', 'go', 'ruby', 'swift', 'kotlin'];
const MAX_TOPIC_LENGTH = 500;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !data?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { language, topic } = await req.json();

    // Validate language
    if (!language || typeof language !== 'string' || !ALLOWED_LANGUAGES.includes(language.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: `Invalid language. Allowed: ${ALLOWED_LANGUAGES.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate topic
    if (topic !== undefined && (typeof topic !== 'string' || topic.length > MAX_TOPIC_LENGTH)) {
      return new Response(
        JSON.stringify({ error: `Topic must be a string of max ${MAX_TOPIC_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sanitizedTopic = topic ? topic.trim().slice(0, MAX_TOPIC_LENGTH) : undefined;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isSimpleText = language === 'simple';
    
    const systemMessage = isSimpleText
      ? 'Generate ONLY plain text paragraphs. No formatting, no explanations. 8-12 sentences, 2-3 paragraphs.'
      : `Generate ONLY ${language} code. No markdown, no backticks, no explanations. No comments of any kind - no single-line comments, no multi-line comments, no inline comments, no docstrings, no documentation strings. Only pure executable code. 10-15 lines. Code must be syntactically correct and ready to type.`;
    
    const userPrompt = isSimpleText
      ? (sanitizedTopic ? `Topic: ${sanitizedTopic}` : 'Random interesting topic')
      : (sanitizedTopic ? `${language} code: ${sanitizedTopic}` : `${language} code snippet`);

    console.log('Generating content for:', language, sanitizedTopic || 'default');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to generate code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await response.json();
    const generatedCode = aiData.choices[0]?.message?.content || '';

    console.log('Generated code successfully');

    return new Response(
      JSON.stringify({ code: generatedCode.trim() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-code function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
