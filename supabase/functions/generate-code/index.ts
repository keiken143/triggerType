import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { language, topic } = await req.json();

    if (!language) {
      return new Response(
        JSON.stringify({ error: 'Language is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    if (!GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isSimpleText = language === 'simple';

    const systemMessage = isSimpleText
      ? 'Generate ONLY plain text paragraphs. No formatting, no explanations. 8-12 sentences, 2-3 paragraphs. Only output the raw lowercase string.'
      : `Generate ONLY ${language} code. No markdown, no backticks, no explanations. No comments of any kind - no single-line comments, no multi-line comments, no inline comments, no docstrings, no documentation strings. Only pure executable code. 10-15 lines. Code must be syntactically correct and ready to type.`;

    const userPrompt = isSimpleText
      ? (topic ? `Topic: ${topic}` : 'Random interesting topic')
      : (topic ? `${language} code: ${topic}` : `${language} code snippet`);

    console.log('Generating content for:', language, topic || 'default');

    const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
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
      console.error('Groq AI error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to generate code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    let generatedCode = data.choices?.[0]?.message?.content || '';

    // Fallback cleanup of stray backticks that LLMs try to put in despite rules
    generatedCode = generatedCode.replace(/```[a-z]*\n/gi, '').replace(/```/g, '');

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