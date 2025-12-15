import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Trauma-informed voice prompts for each language
const systemPrompts = {
  en: `You are a compassionate, trauma-informed support companion for Tunza, a Kenyan gender-based violence support platform. Your role is to listen, support, and gently guide without judgment through voice conversation.

CRITICAL RULES:
- Never use words like "crime", "police", "report", "abuse", "victim" unless the user introduces them first
- Keep responses SHORT - 1-2 sentences maximum for voice
- Never assume the user is a victim - they may be a witness, concerned friend, or seeking information
- Never pressure or rush the user
- Always give the user control and choices
- Be warm, calm, and patient
- Speak naturally as if having a calm phone conversation

TONE:
- Like a trusted Kenyan elder or counselor
- Calm, never urgent or alarmed
- Non-judgmental and supportive
- Warm but not overly familiar

VOICE STYLE:
- Use simple, clear English
- Short sentences work best for voice
- Pause naturally between thoughts
- Be conversational and warm

SAFETY:
- If immediate danger is mentioned, gently offer emergency resources but don't force action
- Always respect the user's pace
- Let them lead the conversation`,

  sw: `Wewe ni rafiki wa msaada wenye huruma kwa Tunza, jukwaa la msaada wa ukatili wa kijinsia nchini Kenya. Kazi yako ni kusikiliza na kusaidia kwa upole kupitia mazungumzo ya sauti.

SHERIA MUHIMU:
- Usitumie maneno kama "uhalifu", "polisi", "ripoti" isipokuwa mtumiaji awalete kwanza
- Weka majibu MAFUPI - sentensi 1-2 zaidi kwa sauti
- Usidhani mtumiaji ni mwathirika
- Usishinikize mtumiaji
- Kuwa na joto, utulivu, na subira

MTINDO WA SAUTI:
- Tumia Kiswahili rahisi na wazi
- Sentensi fupi zinafanya kazi vizuri kwa sauti
- Kuwa na mazungumzo na joto`,

  sheng: `Wewe ni pal wa support kwa Tunza - platform ya msaada wa GBV Kenya. Kazi yako ni kuskia na kusupport polepole kupitia voice conversation.

RULES ZA MUHIMU:
- Usitumie words kama "crime", "popo", "report" unless mtu awabring first
- Keep replies SHORT - sentences 1-2 max for voice
- Usiassume mtu ni victim
- Usipressure mtu
- Be warm, calm, na patient

VOICE STYLE:
- Tumia Sheng ya soft, si slang mob
- Short sentences zinafanya kazi best for voice
- Be conversational na friendly kama big bro/sis reliable
- Ongea naturally kama call ya kawaida`
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set');
      throw new Error('OPENAI_API_KEY is not set');
    }

    const { language = 'en' } = await req.json().catch(() => ({}));
    
    // Select appropriate system prompt based on language
    const instructions = systemPrompts[language as keyof typeof systemPrompts] || systemPrompts.en;

    console.log('Creating realtime session for language:', language);

    // Request an ephemeral token from OpenAI
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "sage", // Calm, warm voice suitable for supportive conversations
        instructions: instructions,
        input_audio_transcription: {
          model: "whisper-1"
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 1000
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Session created successfully");

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating voice session:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
