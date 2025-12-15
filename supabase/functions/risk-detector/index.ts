import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * RISK SIGNAL DETECTION (Silent)
 * Detects risk signals in messages without triggering action.
 * Only adjusts what options are offered to the user.
 * 
 * Output: risk_level: low | medium | high
 * This NEVER triggers action on its own.
 */

interface RiskAssessment {
  risk_level: "low" | "medium" | "high";
  signals: string[];
  recommend_safety_check: boolean;
  recommend_resources: boolean;
}

// Risk indicator patterns (case-insensitive)
const HIGH_RISK_PATTERNS = [
  // Immediate danger
  /\b(going to kill|will kill|wants to kill)\b/i,
  /\b(hurt(ing)? me|hitting me|beat(ing)? me)\b/i,
  /\b(locked in|can't leave|trapped)\b/i,
  /\b(weapon|gun|knife|panga)\b/i,
  /\b(right now|happening now|as we speak)\b/i,
  // Threats
  /\b(threatened to|he said he will|she said she will)\b/i,
  /\b(scared for my life|fear for my life)\b/i,
  // Swahili/Sheng high risk
  /\b(ananiua|ataniua|amenipiga|ananipiga)\b/i,
  /\b(nimefungwa|siwezi toka)\b/i,
];

const MEDIUM_RISK_PATTERNS = [
  // Control indicators
  /\b(controls me|won't let me|doesn't allow)\b/i,
  /\b(takes my money|hides my phone)\b/i,
  /\b(isolate|no friends|can't see family)\b/i,
  // Fear patterns
  /\b(afraid|scared|terrified|frightened)\b/i,
  /\b(what if he|what if she|worried he will)\b/i,
  // Past incidents
  /\b(happened before|not the first time|again)\b/i,
  /\b(bruises|marks|injuries)\b/i,
  // Swahili/Sheng medium risk
  /\b(naogopa|ninaogopa|nimesikia hofu)\b/i,
  /\b(ananidhibiti|haniniruhusu)\b/i,
  /\b(ilifanyika tena|si mara ya kwanza)\b/i,
];

const LOW_RISK_INDICATORS = [
  // General concern
  /\b(confused|unsure|don't know what to do)\b/i,
  /\b(worried about|concerned about)\b/i,
  /\b(something wrong|not right)\b/i,
  // Information seeking
  /\b(what should I|how do I|where can I)\b/i,
  /\b(need advice|need help understanding)\b/i,
];

function assessRisk(content: string): RiskAssessment {
  const signals: string[] = [];
  let highCount = 0;
  let mediumCount = 0;

  // Check high risk patterns
  for (const pattern of HIGH_RISK_PATTERNS) {
    if (pattern.test(content)) {
      signals.push("immediate_danger_indicator");
      highCount++;
    }
  }

  // Check medium risk patterns
  for (const pattern of MEDIUM_RISK_PATTERNS) {
    if (pattern.test(content)) {
      signals.push("control_or_fear_indicator");
      mediumCount++;
    }
  }

  // Check low risk patterns
  for (const pattern of LOW_RISK_INDICATORS) {
    if (pattern.test(content)) {
      signals.push("concern_indicator");
    }
  }

  // Determine overall risk level
  let risk_level: "low" | "medium" | "high" = "low";
  if (highCount > 0) {
    risk_level = "high";
  } else if (mediumCount >= 2) {
    risk_level = "high";
  } else if (mediumCount > 0) {
    risk_level = "medium";
  }

  return {
    risk_level,
    signals: [...new Set(signals)], // Remove duplicates
    recommend_safety_check: risk_level !== "low",
    recommend_resources: risk_level === "high",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, messages = [] } = await req.json();

    if (!content && messages.length === 0) {
      return new Response(
        JSON.stringify({ 
          risk_level: "low", 
          signals: [], 
          recommend_safety_check: false,
          recommend_resources: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Assess current message
    let assessment = assessRisk(content || "");

    // Also check recent message history for patterns
    if (messages.length > 0) {
      const recentMessages = messages.slice(-5);
      let cumulativeHighSignals = 0;
      let cumulativeMediumSignals = 0;

      for (const msg of recentMessages) {
        if (msg.role === "user") {
          const msgAssessment = assessRisk(msg.content);
          if (msgAssessment.risk_level === "high") cumulativeHighSignals++;
          if (msgAssessment.risk_level === "medium") cumulativeMediumSignals++;
        }
      }

      // Escalate if repeated patterns
      if (cumulativeHighSignals >= 2 && assessment.risk_level !== "high") {
        assessment.risk_level = "high";
        assessment.signals.push("repeated_high_risk_patterns");
        assessment.recommend_resources = true;
      } else if (cumulativeMediumSignals >= 3 && assessment.risk_level === "low") {
        assessment.risk_level = "medium";
        assessment.signals.push("repeated_concern_patterns");
        assessment.recommend_safety_check = true;
      }
    }

    // Log assessment (non-identifying - no content logged)
    console.log(`Risk assessment: ${assessment.risk_level}, signals: ${assessment.signals.length}`);

    return new Response(
      JSON.stringify(assessment),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Risk detection error:", errorMessage);
    
    // Return safe default on error
    return new Response(
      JSON.stringify({ 
        risk_level: "low", 
        signals: [], 
        recommend_safety_check: false,
        recommend_resources: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
