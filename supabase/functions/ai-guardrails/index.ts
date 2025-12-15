import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * AI GUARDRAILS
 * Before any AI response is sent, it passes safety checks.
 * If unsafe → fallback to safe template.
 * 
 * Checks for:
 * - No legal advice
 * - No medical advice
 * - No victim-blaming
 * - No urgency unless consented
 */

interface GuardrailResult {
  safe: boolean;
  violations: string[];
  fallback_response: string | null;
  modified_response: string | null;
}

// Patterns that indicate potential violations
const LEGAL_ADVICE_PATTERNS = [
  /\b(you should sue|file a lawsuit|press charges|take legal action)\b/i,
  /\b(legally you can|the law says|according to law)\b/i,
  /\b(get a lawyer|hire an attorney|legal rights)\b/i,
  /\b(court order|restraining order|you should report to police)\b/i,
];

const MEDICAL_ADVICE_PATTERNS = [
  /\b(you should take|take this medication|stop taking)\b/i,
  /\b(diagnosis|diagnose|you have [a-z]+ disorder)\b/i,
  /\b(treatment plan|medical treatment|go to the doctor)\b/i,
  /\b(symptoms indicate|based on symptoms)\b/i,
];

const VICTIM_BLAMING_PATTERNS = [
  /\b(why did you|why didn't you|you should have)\b/i,
  /\b(your fault|you caused|you let)\b/i,
  /\b(you shouldn't have|you made him|you made her)\b/i,
  /\b(what were you wearing|what did you do to)\b/i,
];

const URGENCY_PATTERNS = [
  /\b(you must|you have to|you need to immediately)\b/i,
  /\b(right now|immediately|don't wait|urgent)\b/i,
  /\b(call now|go now|leave now)\b/i,
];

// Safe fallback responses by language
const SAFE_FALLBACKS = {
  en: {
    legal: "I hear that you're thinking about your options. For specific legal guidance, speaking with a professional would give you the clearest picture. Would you like to know about free legal resources available?",
    medical: "I understand you're concerned about your health. A healthcare professional would be the best person to guide you on this. Would you like information about where to find support?",
    victim_blaming: "What happened is not your fault. Many people have been through similar experiences. How are you feeling right now?",
    urgency: "Take your time. There's no pressure to make any decisions right now. I'm here to listen whenever you're ready.",
    general: "I want to make sure I'm being helpful. Could you tell me more about what you're experiencing?",
  },
  sw: {
    legal: "Nasikia unafikiria kuhusu chaguzi zako. Kwa ushauri wa kisheria, kuzungumza na mtaalamu kungesaidia. Ungependa kujua kuhusu rasilimali za kisheria zilizo bure?",
    medical: "Naelewa una wasiwasi kuhusu afya yako. Mtaalamu wa afya angekuwa mtu bora kukuongoza. Ungependa habari kuhusu wapi kupata msaada?",
    victim_blaming: "Kilichotokea si kosa lako. Watu wengi wamepitia uzoefu kama huu. Unajisikiaje sasa?",
    urgency: "Chukua wakati wako. Hakuna shinikizo la kufanya maamuzi sasa hivi. Niko hapa kusikiliza wakati wowote uko tayari.",
    general: "Nataka kuhakikisha ninasaidia. Je, unaweza kunielezea zaidi unachopitia?",
  },
  sheng: {
    legal: "Nasikia una-think kuhusu options zako. Kwa legal advice, ku-talk na professional itakusaidia. Ungependa kujua about free legal resources?",
    medical: "Na-understand una concern kuhusu health yako. Healthcare professional angekuwa best person kukuguide. Ungependa info kuhusu where kupata support?",
    victim_blaming: "Chenye kilitokea si fault yako. Watu wengi wamepitia similar experiences. Unajiskia aje saa hii?",
    urgency: "Chukua time yako. Hakuna pressure ya ku-decide saa hii. Niko hapa kuskia wakati wowote uko ready.",
    general: "Nataka ku-make sure nina-help. Unaweza nielezea more kuhusu chenye unapitia?",
  },
};

function checkGuardrails(response: string, language: string = "en", hasUrgencyConsent: boolean = false): GuardrailResult {
  const violations: string[] = [];
  const fallbacks = SAFE_FALLBACKS[language as keyof typeof SAFE_FALLBACKS] || SAFE_FALLBACKS.en;

  // Check for legal advice
  for (const pattern of LEGAL_ADVICE_PATTERNS) {
    if (pattern.test(response)) {
      violations.push("legal_advice");
      break;
    }
  }

  // Check for medical advice
  for (const pattern of MEDICAL_ADVICE_PATTERNS) {
    if (pattern.test(response)) {
      violations.push("medical_advice");
      break;
    }
  }

  // Check for victim blaming
  for (const pattern of VICTIM_BLAMING_PATTERNS) {
    if (pattern.test(response)) {
      violations.push("victim_blaming");
      break;
    }
  }

  // Check for urgency (unless consented)
  if (!hasUrgencyConsent) {
    for (const pattern of URGENCY_PATTERNS) {
      if (pattern.test(response)) {
        violations.push("urgency");
        break;
      }
    }
  }

  if (violations.length === 0) {
    return {
      safe: true,
      violations: [],
      fallback_response: null,
      modified_response: null,
    };
  }

  // Determine which fallback to use
  let fallback_response = fallbacks.general;
  if (violations.includes("victim_blaming")) {
    fallback_response = fallbacks.victim_blaming;
  } else if (violations.includes("legal_advice")) {
    fallback_response = fallbacks.legal;
  } else if (violations.includes("medical_advice")) {
    fallback_response = fallbacks.medical;
  } else if (violations.includes("urgency")) {
    fallback_response = fallbacks.urgency;
  }

  return {
    safe: false,
    violations,
    fallback_response,
    modified_response: null,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { response, language = "en", has_urgency_consent = false } = await req.json();

    if (!response) {
      return new Response(
        JSON.stringify({ error: "Response is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = checkGuardrails(response, language, has_urgency_consent);

    // Log violations (non-identifying)
    if (!result.safe) {
      console.log(`Guardrail violations detected: ${result.violations.join(", ")}`);
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Guardrails error:", errorMessage);
    return new Response(
      JSON.stringify({ 
        safe: true, 
        violations: [], 
        fallback_response: null,
        modified_response: null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
