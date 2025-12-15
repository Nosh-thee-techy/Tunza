import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * PARTNER HANDOFF SYSTEM
 * 
 * When handoff is triggered (only when user explicitly chooses and consent is set):
 * - Short, AI-generated summary
 * - Language preference
 * - Urgency level (low/medium/high)
 * 
 * NOT shared:
 * - Full transcripts
 * - Voice recordings
 * - Metadata unless needed
 */

interface HandoffData {
  summary: string;
  language: string;
  urgency: "low" | "medium" | "high";
  case_reference: string; // Anonymized reference
  handoff_method: "secure_api" | "encrypted_link" | "call_token";
}

// Generate a short summary using AI
async function generateSummary(messages: Array<{role: string; content: string}>, language: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY || messages.length === 0) {
    return "User seeking support. Details to be shared directly with counselor.";
  }

  const summaryPrompts = {
    en: "Create a brief, 2-3 sentence summary for a counselor. Focus on the main concern without identifying details. Be compassionate and professional.",
    sw: "Tengeneza muhtasari mfupi wa sentensi 2-3 kwa mshauri. Zingatia wasiwasi mkuu bila maelezo ya utambulisho.",
    sheng: "Create a brief summary for a counselor. Focus on main concern without identifying info.",
  };

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: summaryPrompts[language as keyof typeof summaryPrompts] || summaryPrompts.en 
          },
          { 
            role: "user", 
            content: `Summarize this conversation for handoff:\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}`
          },
        ],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "User seeking support.";
    }
  } catch (error) {
    console.error("Summary generation error:", error);
  }

  return "User seeking support. Please engage with care.";
}

// Generate a one-time encrypted reference
function generateHandoffReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "HO-";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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

    const { action, case_id, partner_id, urgency = "medium" } = await req.json();
    console.log(`Partner handoff action: ${action}`);

    switch (action) {
      case "initiate": {
        if (!case_id) {
          return new Response(
            JSON.stringify({ error: "Case ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check consent
        const { data: caseData } = await supabase
          .from("cases")
          .select("*")
          .eq("case_id", case_id)
          .single();

        if (!caseData) {
          return new Response(
            JSON.stringify({ error: "Case not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const context = caseData.context ? JSON.parse(caseData.context) : {};
        const consent = context.consent || {};

        // Check for handoff consent
        if (!consent.allow_escalation && !consent.partner_handoff) {
          return new Response(
            JSON.stringify({ 
              error: "Consent required for handoff",
              requires_consent: ["allow_escalation", "partner_handoff"]
            }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Generate summary from messages
        const messages = caseData.messages || [];
        const summary = await generateSummary(messages, caseData.language);

        // Create handoff data
        const handoffData: HandoffData = {
          summary,
          language: caseData.language,
          urgency: urgency as "low" | "medium" | "high",
          case_reference: generateHandoffReference(),
          handoff_method: "secure_api",
        };

        // Log audit entry (non-identifying)
        console.log(`Handoff initiated: ref=${handoffData.case_reference}, urgency=${urgency}`);

        // Update case context with handoff info
        const updatedContext = {
          ...context,
          handoff_history: [
            ...(context.handoff_history || []),
            {
              reference: handoffData.case_reference,
              initiated_at: new Date().toISOString(),
              urgency,
              status: "pending",
            },
          ],
        };

        await supabase
          .from("cases")
          .update({ context: JSON.stringify(updatedContext) })
          .eq("case_id", case_id);

        return new Response(
          JSON.stringify({ 
            success: true, 
            handoff: handoffData,
            message: "Handoff prepared. Partner will receive summary only.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "list_partners": {
        // Return available support partners
        // In production, this would come from a database
        const partners = [
          {
            id: "healthcare_kenya",
            name: "Healthcare Assistance Kenya",
            type: "healthcare",
            available: true,
          },
          {
            id: "legal_aid_kenya", 
            name: "Federation of Women Lawyers Kenya",
            type: "legal",
            available: true,
          },
          {
            id: "counseling_kenya",
            name: "Kenya Red Cross Counseling",
            type: "counseling",
            available: true,
          },
        ];

        return new Response(
          JSON.stringify({ partners }),
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
    console.error("Partner handoff error:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Handoff error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
