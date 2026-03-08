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
        const { language, dna, length, options = [] } = await req.json();

        if (!language) {
            return new Response(
                JSON.stringify({ error: 'Language is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Determine the weakest keys from DNA
        let targetKeys = "";
        if (dna) {
            const weakKeys = Object.entries(dna)
                .sort((a: any, b: any) => {
                    const scoreA = (a[1].avgLatency * 0.5) + (a[1].errors * 500);
                    const scoreB = (b[1].avgLatency * 0.5) + (b[1].errors * 500);
                    return scoreB - scoreA;
                })
                .slice(0, 3)
                .map(k => k[0]);
            targetKeys = weakKeys.join(', ');
        }

        const isSimple = language.toLowerCase() === 'simple';

        // Build character constraints based on options
        let constraints = "";
        if (options && options.length > 0) {
            constraints = "MUST ONLY use characters from these categories: " + options.join(', ') + ". ";
            if (options.includes('mixedCase')) {
                constraints += "Use both UPPERCASE and lowercase letters randomly. ";
            } else if (options.includes('alphabets')) {
                constraints += "Use only lowercase letters. ";
            }
        }

        let systemMessage = "";
        if (isSimple) {
            systemMessage = `You are a typing test generator.
Generate a short, natural English sentence or sequence of words.
Target length: approximately ${length || 35} characters.
${constraints}
${targetKeys ? `Heavily prioritize words containing these friction keys: [ ${targetKeys} ].` : ""}
Return ONLY the plain text. ABSOLUTELY NO leading or trailing spaces. No quotes. No metadata.`;
        } else {
            systemMessage = `You are a coding expert and typing test generator.
Generate a single line of realistic, syntactically correct ${language} code.
Target length: approximately ${length || 35} characters.
${constraints}
${targetKeys ? `Heavily prioritize using variables, functions, or patterns containing these friction keys: [ ${targetKeys} ].` : ""}
Return ONLY the raw code line. ABSOLUTELY NO leading or trailing spaces. No backticks. No comments. No metadata.`;
        }

        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

        let snippet = "";

        if (GEMINI_API_KEY) {
            console.log(`Calling Gemini for ${language} with keys: ${targetKeys}`);
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `${systemMessage}\n\nSeed for variety: ${Math.random().toString(36).substring(7)}\nLanguage: ${language}\nFriction Keys: ${targetKeys}`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.9,
                        maxOutputTokens: 100,
                    }
                }),
            });

            if (response.ok) {
                const data = await response.json();
                snippet = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
                console.log(`Generated snippet: ${snippet}`);
            } else {
                const errorText = await response.text();
                console.error(`Gemini API Error (${response.status}): ${errorText}`);
            }
        } else {
            console.error("GEMINI_API_KEY not found in environment");
        }

        // If AI fails or key is missing, return an error to trigger frontend fallback
        if (!snippet) {
            throw new Error("Failed to generate AI snippet (missing key or API error)");
        }

        // Clean up common AI artifacts
        snippet = snippet.replace(/^`+|`+$/g, '').trim();

        return new Response(
            JSON.stringify({ snippet }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error in generate-adaptive-snippet function:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
