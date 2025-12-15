import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * CONSENT ENGINE
 * Manages consent state machine for each case.
 * Consent is NOT binary - each flag controls specific actions.
 * The system blocks actions unless the right consent flag is true.
 */

interface ConsentFlags {
  store_conversation: boolean;
  share_summary: boolean;
  allow_escalation: boolean;
  emergency_contact: boolean;
  partner_handoff: boolean;
}

interface ConsentAuditEntry {
  action: string;
  flag: keyof ConsentFlags;
  previous_value: boolean;
  new_value: boolean;
  timestamp: string;
}

const DEFAULT_CONSENT: ConsentFlags = {
  store_conversation: false,
  share_summary: false,
  allow_escalation: false,
  emergency_contact: false,
  partner_handoff: false,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { action, case_id, flag, value, required_action } = await req.json();
    console.log(`Consent action: ${action}, case: ${case_id}`);

    switch (action) {
      case "get": {
        // Get current consent state for a case
        if (!case_id) {
          return new Response(
            JSON.stringify({ consent: DEFAULT_CONSENT }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: caseData } = await supabase
          .from("cases")
          .select("context")
          .eq("case_id", case_id)
          .single();

        const consent = caseData?.context 
          ? JSON.parse(caseData.context)?.consent || DEFAULT_CONSENT
          : DEFAULT_CONSENT;

        return new Response(
          JSON.stringify({ consent }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update": {
        // Update a specific consent flag
        if (!case_id || !flag) {
          return new Response(
            JSON.stringify({ error: "case_id and flag are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: caseData } = await supabase
          .from("cases")
          .select("context")
          .eq("case_id", case_id)
          .single();

        if (!caseData) {
          return new Response(
            JSON.stringify({ error: "Case not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const currentContext = caseData.context ? JSON.parse(caseData.context) : {};
        const currentConsent = currentContext.consent || DEFAULT_CONSENT;
        const previousValue = currentConsent[flag] || false;

        // Create audit entry
        const auditEntry: ConsentAuditEntry = {
          action: "consent_update",
          flag,
          previous_value: previousValue,
          new_value: !!value,
          timestamp: new Date().toISOString(),
        };

        // Update consent
        const updatedConsent = { ...currentConsent, [flag]: !!value };
        const updatedContext = {
          ...currentContext,
          consent: updatedConsent,
          consent_audit: [...(currentContext.consent_audit || []), auditEntry],
        };

        await supabase
          .from("cases")
          .update({ context: JSON.stringify(updatedContext) })
          .eq("case_id", case_id);

        console.log(`Consent updated: ${flag}=${value} for case ${case_id}`);

        return new Response(
          JSON.stringify({ success: true, consent: updatedConsent }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "check": {
        // Check if a specific action is allowed based on consent
        if (!required_action) {
          return new Response(
            JSON.stringify({ error: "required_action is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        let consent = DEFAULT_CONSENT;
        if (case_id) {
          const { data: caseData } = await supabase
            .from("cases")
            .select("context")
            .eq("case_id", case_id)
            .single();

          if (caseData?.context) {
            consent = JSON.parse(caseData.context)?.consent || DEFAULT_CONSENT;
          }
        }

        // Map actions to required consent flags
        const actionConsentMap: Record<string, keyof ConsentFlags> = {
          save_conversation: "store_conversation",
          share_with_partner: "share_summary",
          escalate_to_counselor: "allow_escalation",
          provide_emergency_contact: "emergency_contact",
          handoff_to_partner: "partner_handoff",
        };

        const requiredFlag = actionConsentMap[required_action];
        const allowed = requiredFlag ? consent[requiredFlag] : false;

        return new Response(
          JSON.stringify({ 
            allowed, 
            required_flag: requiredFlag,
            current_value: requiredFlag ? consent[requiredFlag] : false,
          }),
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
    console.error("Consent engine error:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Processing error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
