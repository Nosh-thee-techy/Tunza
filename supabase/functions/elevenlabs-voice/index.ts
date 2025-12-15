import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * ELEVENLABS VOICE SERVICE
 * Provides conversation tokens for ElevenLabs Conversational AI
 * and text-to-speech functionality.
 */

// ElevenLabs Agent ID - you'll need to create this in the ElevenLabs dashboard
const ELEVENLABS_AGENT_ID = Deno.env.get("ELEVENLABS_AGENT_ID");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    
    if (!ELEVENLABS_API_KEY) {
      console.error("ELEVENLABS_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Voice service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, text, language = "en" } = await req.json();
    console.log(`ElevenLabs action: ${action}, language: ${language}`);

    switch (action) {
      case "get_token": {
        // Get a conversation token for WebRTC connection
        // Note: This requires an ElevenLabs Agent to be set up
        if (!ELEVENLABS_AGENT_ID) {
          // If no agent is configured, we'll use TTS mode instead
          return new Response(
            JSON.stringify({ 
              mode: "tts",
              message: "Using text-to-speech mode"
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const response = await fetch(
          `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${ELEVENLABS_AGENT_ID}`,
          {
            headers: {
              "xi-api-key": ELEVENLABS_API_KEY,
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("ElevenLabs token error:", response.status, errorText);
          return new Response(
            JSON.stringify({ error: "Failed to get conversation token" }),
            { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { token } = await response.json();
        return new Response(
          JSON.stringify({ token, mode: "conversation" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "tts": {
        // Text-to-speech for AI responses
        if (!text) {
          return new Response(
            JSON.stringify({ error: "Text is required for TTS" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Select voice based on language
        // Using warm, calm voices that match the Tunza persona
        const voiceMap: Record<string, string> = {
          en: "EXAVITQu4vr4xnSDxMaL", // Sarah - warm and calm
          sw: "EXAVITQu4vr4xnSDxMaL", // Sarah - works well with Swahili
          sheng: "EXAVITQu4vr4xnSDxMaL", // Sarah
        };

        const voiceId = voiceMap[language] || voiceMap.en;

        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
          {
            method: "POST",
            headers: {
              "xi-api-key": ELEVENLABS_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text,
              model_id: "eleven_multilingual_v2",
              output_format: "mp3_44100_128",
              voice_settings: {
                stability: 0.6, // Warm and consistent
                similarity_boost: 0.75,
                style: 0.3, // Gentle style
                use_speaker_boost: true,
                speed: 0.95, // Slightly slower for calm delivery
              },
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("ElevenLabs TTS error:", response.status, errorText);
          return new Response(
            JSON.stringify({ error: "Failed to generate speech" }),
            { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const audioBuffer = await response.arrayBuffer();
        
        return new Response(audioBuffer, {
          headers: {
            ...corsHeaders,
            "Content-Type": "audio/mpeg",
          },
        });
      }

      case "stt_token": {
        // Get token for speech-to-text
        const response = await fetch(
          "https://api.elevenlabs.io/v1/single-use-token/realtime_scribe",
          {
            method: "POST",
            headers: {
              "xi-api-key": ELEVENLABS_API_KEY,
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("ElevenLabs STT token error:", response.status, errorText);
          return new Response(
            JSON.stringify({ error: "Failed to get STT token" }),
            { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { token } = await response.json();
        return new Response(
          JSON.stringify({ token }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("ElevenLabs service error:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Voice service error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
