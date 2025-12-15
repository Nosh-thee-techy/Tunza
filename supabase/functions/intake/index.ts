import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * CHANNEL INTAKE LAYER
 * Normalizes all user interactions into a single internal format.
 * Supports: PWA (voice + text), SMS, USSD, Voice calls, WhatsApp
 */

interface NormalizedInput {
  channel: "pwa_text" | "pwa_voice" | "sms" | "ussd" | "voice_call" | "whatsapp";
  language: "en" | "sw" | "sheng";
  content: string;
  timestamp: string;
  case_id: string | null;
  consent_state: ConsentState;
  metadata?: Record<string, unknown>;
}

interface ConsentState {
  store_conversation: boolean;
  share_summary: boolean;
  allow_escalation: boolean;
  emergency_contact: boolean;
}

const DEFAULT_CONSENT: ConsentState = {
  store_conversation: false,
  share_summary: false,
  allow_escalation: false,
  emergency_contact: false,
};

// Detect language from content
function detectLanguage(content: string): "en" | "sw" | "sheng" {
  const shengIndicators = ["sawa", "poa", "maze", "buda", "dem", "niaje", "mambo", "fiti", "mbaya", "uko"];
  const swahiliIndicators = ["habari", "asante", "tafadhali", "ndio", "hapana", "karibu", "kwaheri", "ndiyo", "vipi", "je"];
  
  const lowerContent = content.toLowerCase();
  
  // Check for Sheng first (it's a mix)
  const shengCount = shengIndicators.filter(w => lowerContent.includes(w)).length;
  if (shengCount >= 2) return "sheng";
  
  // Check for Swahili
  const swahiliCount = swahiliIndicators.filter(w => lowerContent.includes(w)).length;
  if (swahiliCount >= 2) return "sw";
  
  return "en";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const {
      channel = "pwa_text",
      content,
      language,
      case_id,
      consent = DEFAULT_CONSENT,
      metadata = {},
    } = body;

    console.log(`Intake received from channel: ${channel}`);

    // Normalize the input
    const normalizedInput: NormalizedInput = {
      channel,
      language: language || detectLanguage(content),
      content: content?.trim() || "",
      timestamp: new Date().toISOString(),
      case_id: case_id || null,
      consent_state: {
        store_conversation: consent.store_conversation ?? false,
        share_summary: consent.share_summary ?? false,
        allow_escalation: consent.allow_escalation ?? false,
        emergency_contact: consent.emergency_contact ?? false,
      },
      metadata,
    };

    // Validate content
    if (!normalizedInput.content) {
      return new Response(
        JSON.stringify({ error: "Content is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the intake (non-identifying)
    console.log(`Intake processed: channel=${channel}, language=${normalizedInput.language}, has_case=${!!case_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        normalized: normalizedInput,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Intake error:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Processing error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
