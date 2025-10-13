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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle simple text (English paragraphs) differently from code
    const isSimpleText = language === 'simple';
    
    let prompt: string;
    let systemMessage: string;
    
    if (isSimpleText) {
      systemMessage = 'You are a text generator that creates well-written English paragraphs for typing practice. Return ONLY the text without any formatting, explanations, or special characters. The text should be 8-12 sentences long, forming 2-3 coherent paragraphs.';
      prompt = topic 
        ? `Write an informative and engaging text about "${topic}". Make it suitable for typing practice with proper grammar and punctuation.`
        : `Write an informative and engaging text about a random interesting topic. Make it suitable for typing practice with proper grammar and punctuation.`;
    } else {
      systemMessage = 'You are a code generator that creates clean, well-formatted code snippets for typing practice. Return ONLY the code without any markdown formatting, explanations, or backticks. The code should be between 10-15 lines.';
      prompt = topic 
        ? `Generate a ${language} code snippet about "${topic}". The code should be 10-15 lines long, well-structured, and include comments. Make it suitable for typing practice with good programming patterns.`
        : `Generate a ${language} code snippet. The code should be 10-15 lines long, well-structured, and include comments. Make it suitable for typing practice with good programming patterns.`;
    }

    console.log('Generating content with prompt:', prompt);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: systemMessage
          },
          {
            role: 'user',
            content: prompt
          }
        ],
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

    const data = await response.json();
    const generatedCode = data.choices[0]?.message?.content || '';

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