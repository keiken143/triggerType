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
        const { dna } = await req.json();

        if (!dna) {
            return new Response(
                JSON.stringify({ error: 'User DNA is required to generate a curriculum' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Determine the weakest keys
        const weakKeys = Object.entries(dna)
            .sort((a: any, b: any) => {
                const scoreA = (a[1].avgLatency * 0.5) + (a[1].errors * 500);
                const scoreB = (b[1].avgLatency * 0.5) + (b[1].errors * 500);
                return scoreB - scoreA;
            })
            .slice(0, 5);

        const keyList = weakKeys.map(k => k[0]).join(', ');

        const systemMessage = `You are a strict, elite typing coach building a 'Neural Social Engine'. 
Your user has provided their lowest performing keystrokes (highest latency and errors).
Generate a tiny, actionable training plan limit to 3 short sentences.
Format as simple text. Suggest 1 specific finger exercise or pattern they should focus on.`;

        const userPrompt = `My weakest keys right now are: [ ${keyList} ]. What is my daily curriculum?`;

        // Connect to Google Gemini natively
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

        let generatedPlan = "";

        if (GEMINI_API_KEY) {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    system_instruction: {
                        parts: { text: systemMessage }
                    },
                    contents: [{
                        parts: [{ text: userPrompt }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 300,
                    }
                }),
            });

            if (response.ok) {
                const data = await response.json();
                generatedPlan = data.candidates?.[0]?.content?.parts?.[0]?.text || "Focus on building rhythm today.";
            } else {
                generatedPlan = `Data indicates friction on [ ${keyList} ]. Focus on drills utilizing these characters exclusively today.`;
            }
        } else {
            // Fallback if no keys are wired yet so the UI doesn't crash
            generatedPlan = `Telemetry confirms high friction on [ ${keyList} ]. Provide an API Key to activate the Architect.`;
        }

        return new Response(
            JSON.stringify({ plan: generatedPlan, weakKeys: weakKeys.map(k => k[0]) }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error in generate-curriculum function:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
