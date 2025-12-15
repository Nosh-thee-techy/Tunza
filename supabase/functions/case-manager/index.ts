import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple hash function for PIN (not cryptographically secure, but sufficient for this use case)
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + "tunza-salt-2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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

    const { action, caseId, pin, messages, language, context } = await req.json();
    console.log("Case action:", action, "caseId:", caseId);

    switch (action) {
      case "create": {
        // Generate unique case ID
        let newCaseId: string;
        let attempts = 0;
        
        while (attempts < 10) {
          const { data: generated } = await supabase.rpc("generate_case_id");
          newCaseId = generated;
          
          // Check if it exists
          const { data: existing } = await supabase
            .from("cases")
            .select("case_id")
            .eq("case_id", newCaseId)
            .single();
          
          if (!existing) break;
          attempts++;
        }

        // Hash PIN if provided
        const pinHash = pin ? await hashPin(pin) : null;

        // Create case
        const { data, error } = await supabase
          .from("cases")
          .insert({
            case_id: newCaseId!,
            pin_hash: pinHash,
            messages: messages || [],
            language: language || "en",
            context: context || "general",
          })
          .select("case_id")
          .single();

        if (error) {
          console.error("Error creating case:", error);
          throw error;
        }

        console.log("Case created:", data.case_id);
        return new Response(
          JSON.stringify({ success: true, caseId: data.case_id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "load": {
        if (!caseId) {
          return new Response(
            JSON.stringify({ error: "Case ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Find case
        const { data: caseData, error } = await supabase
          .from("cases")
          .select("*")
          .eq("case_id", caseId.toUpperCase())
          .single();

        if (error || !caseData) {
          console.log("Case not found:", caseId);
          return new Response(
            JSON.stringify({ error: "Case not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify PIN if set
        if (caseData.pin_hash) {
          if (!pin) {
            return new Response(
              JSON.stringify({ error: "PIN required", requiresPin: true }),
              { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          const providedHash = await hashPin(pin);
          if (providedHash !== caseData.pin_hash) {
            return new Response(
              JSON.stringify({ error: "Invalid PIN" }),
              { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        // Update last accessed
        await supabase
          .from("cases")
          .update({ last_accessed_at: new Date().toISOString() })
          .eq("case_id", caseId.toUpperCase());

        console.log("Case loaded:", caseId);
        return new Response(
          JSON.stringify({
            success: true,
            messages: caseData.messages,
            language: caseData.language,
            context: caseData.context,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update": {
        if (!caseId) {
          return new Response(
            JSON.stringify({ error: "Case ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify case exists and PIN matches
        const { data: caseData } = await supabase
          .from("cases")
          .select("pin_hash")
          .eq("case_id", caseId.toUpperCase())
          .single();

        if (!caseData) {
          return new Response(
            JSON.stringify({ error: "Case not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (caseData.pin_hash) {
          if (!pin) {
            return new Response(
              JSON.stringify({ error: "PIN required" }),
              { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          const providedHash = await hashPin(pin);
          if (providedHash !== caseData.pin_hash) {
            return new Response(
              JSON.stringify({ error: "Invalid PIN" }),
              { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        // Update messages
        const { error } = await supabase
          .from("cases")
          .update({ messages, language, context })
          .eq("case_id", caseId.toUpperCase());

        if (error) {
          console.error("Error updating case:", error);
          throw error;
        }

        console.log("Case updated:", caseId);
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete": {
        // User-controlled case deletion
        if (!caseId) {
          return new Response(
            JSON.stringify({ error: "Case ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify case exists and PIN matches (if set)
        const { data: caseToDelete } = await supabase
          .from("cases")
          .select("pin_hash")
          .eq("case_id", caseId.toUpperCase())
          .single();

        if (!caseToDelete) {
          return new Response(
            JSON.stringify({ error: "Case not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (caseToDelete.pin_hash) {
          if (!pin) {
            return new Response(
              JSON.stringify({ error: "PIN required", requiresPin: true }),
              { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          const providedHash = await hashPin(pin);
          if (providedHash !== caseToDelete.pin_hash) {
            return new Response(
              JSON.stringify({ error: "Invalid PIN" }),
              { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        // Delete the case permanently
        const { error } = await supabase
          .from("cases")
          .delete()
          .eq("case_id", caseId.toUpperCase());

        if (error) {
          console.error("Error deleting case:", error);
          throw error;
        }

        console.log("Case deleted:", caseId);
        return new Response(
          JSON.stringify({ success: true, message: "Case deleted permanently" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "export": {
        // Export case summary before deletion
        if (!caseId) {
          return new Response(
            JSON.stringify({ error: "Case ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Find and verify case
        const { data: caseExport, error: fetchError } = await supabase
          .from("cases")
          .select("*")
          .eq("case_id", caseId.toUpperCase())
          .single();

        if (fetchError || !caseExport) {
          return new Response(
            JSON.stringify({ error: "Case not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify PIN if set
        if (caseExport.pin_hash) {
          if (!pin) {
            return new Response(
              JSON.stringify({ error: "PIN required", requiresPin: true }),
              { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          const providedHash = await hashPin(pin);
          if (providedHash !== caseExport.pin_hash) {
            return new Response(
              JSON.stringify({ error: "Invalid PIN" }),
              { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        // Generate exportable summary (without sensitive metadata)
        const summary = {
          case_id: caseExport.case_id,
          created_at: caseExport.created_at,
          language: caseExport.language,
          context: caseExport.context,
          message_count: Array.isArray(caseExport.messages) ? caseExport.messages.length : 0,
          messages: caseExport.messages,
        };

        console.log("Case exported:", caseId);
        return new Response(
          JSON.stringify({ success: true, summary }),
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
    console.error("Case management error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
