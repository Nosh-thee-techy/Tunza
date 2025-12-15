import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RiskAssessment {
  risk_level: "low" | "medium" | "high";
  signals: string[];
  recommend_safety_check: boolean;
  recommend_resources: boolean;
}

interface UseRiskDetectionProps {
  onHighRisk?: (assessment: RiskAssessment) => void;
  onMediumRisk?: (assessment: RiskAssessment) => void;
}

export function useRiskDetection({ onHighRisk, onMediumRisk }: UseRiskDetectionProps = {}) {
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high">("low");
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const hasTriggeredEmergency = useRef(false);

  const assessMessage = useCallback(async (
    content: string,
    messageHistory: Array<{ role: string; content: string }> = []
  ): Promise<RiskAssessment> => {
    try {
      const { data, error } = await supabase.functions.invoke("risk-detector", {
        body: { 
          content, 
          messages: messageHistory 
        },
      });

      if (error) {
        console.error("Risk detection error:", error);
        return { 
          risk_level: "low", 
          signals: [], 
          recommend_safety_check: false,
          recommend_resources: false 
        };
      }

      const result = data as RiskAssessment;
      setAssessment(result);
      setRiskLevel(result.risk_level);

      // Trigger callbacks for elevated risk - but only trigger emergency once
      if (result.risk_level === "high" && !hasTriggeredEmergency.current) {
        hasTriggeredEmergency.current = true;
        onHighRisk?.(result);
      } else if (result.risk_level === "medium") {
        onMediumRisk?.(result);
      }

      return result;
    } catch (error) {
      console.error("Risk assessment failed:", error);
      return { 
        risk_level: "low", 
        signals: [], 
        recommend_safety_check: false,
        recommend_resources: false 
      };
    }
  }, [onHighRisk, onMediumRisk]);

  const resetEmergencyTrigger = useCallback(() => {
    hasTriggeredEmergency.current = false;
  }, []);

  return {
    riskLevel,
    assessment,
    assessMessage,
    resetEmergencyTrigger,
  };
}
