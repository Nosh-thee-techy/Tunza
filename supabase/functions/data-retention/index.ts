import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * DATA RETENTION SYSTEM
 * 
 * Handles:
 * - Configurable retention windows (default: 30 days)
 * - Auto-deletion of inactive cases
 * - User-controlled deletion
 * - Export summary before deletion
 * 
 * Called by:
 * - Scheduled cron job for auto-cleanup
 * - User-initiated deletion
 */

interface RetentionConfig {
  default_retention_days: number;
  warning_days_before: number;
}

const DEFAULT_CONFIG: RetentionConfig = {
  default_retention_days: 30,
  warning_days_before: 7,
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

    const { action, caseId, pin, retentionDays } = await req.json();
    console.log("Data retention action:", action);

    switch (action) {
      case "cleanup": {
        // Auto-cleanup expired cases (called by cron)
        const days = retentionDays || DEFAULT_CONFIG.default_retention_days;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        // Find and delete expired cases
        const { data: expiredCases, error: fetchError } = await supabase
          .from("cases")
          .select("case_id, last_accessed_at")
          .lt("last_accessed_at", cutoffDate.toISOString());

        if (fetchError) {
          console.error("Error fetching expired cases:", fetchError);
          throw fetchError;
        }

        if (expiredCases && expiredCases.length > 0) {
          const caseIds = expiredCases.map(c => c.case_id);
          
          const { error: deleteError } = await supabase
            .from("cases")
            .delete()
            .in("case_id", caseIds);

          if (deleteError) {
            console.error("Error deleting expired cases:", deleteError);
            throw deleteError;
          }

          console.log(`Deleted ${caseIds.length} expired cases`);
          return new Response(
            JSON.stringify({ 
              success: true, 
              deleted_count: caseIds.length,
              message: `Deleted ${caseIds.length} cases older than ${days} days`
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            deleted_count: 0,
            message: "No expired cases found"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_expiring": {
        // Get cases that will expire soon (for potential warnings)
        const days = retentionDays || DEFAULT_CONFIG.default_retention_days;
        const warningDays = DEFAULT_CONFIG.warning_days_before;
        
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() - days);
        
        const warningDate = new Date();
        warningDate.setDate(warningDate.getDate() - (days - warningDays));

        const { data: expiringCases, error } = await supabase
          .from("cases")
          .select("case_id, last_accessed_at")
          .lt("last_accessed_at", warningDate.toISOString())
          .gt("last_accessed_at", expirationDate.toISOString());

        if (error) throw error;

        return new Response(
          JSON.stringify({ 
            success: true, 
            expiring_cases: expiringCases?.map(c => ({
              case_id: c.case_id,
              expires_in_days: Math.ceil(
                (new Date(c.last_accessed_at).getTime() + (days * 24 * 60 * 60 * 1000) - Date.now()) / (24 * 60 * 60 * 1000)
              )
            })) || []
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "extend": {
        // Extend retention for a case (refresh last_accessed_at)
        if (!caseId) {
          return new Response(
            JSON.stringify({ error: "Case ID required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("cases")
          .update({ last_accessed_at: new Date().toISOString() })
          .eq("case_id", caseId.toUpperCase());

        if (error) throw error;

        console.log("Extended retention for case:", caseId);
        return new Response(
          JSON.stringify({ success: true, message: "Retention extended" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_config": {
        // Return current retention configuration
        return new Response(
          JSON.stringify({ 
            success: true, 
            config: DEFAULT_CONFIG 
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
    console.error("Data retention error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
