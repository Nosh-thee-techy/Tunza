import { useState } from "react";
import { ArrowLeft, Key, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Language } from "./LanguageSelector";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReturnFlowProps {
  language: Language;
  onBack: () => void;
  onCaseLoaded: (messages: Array<{ role: string; content: string }>, language: Language, context: string) => void;
}

const content = {
  en: {
    title: "Return to Conversation",
    subtitle: "Enter your code to continue where you left off.",
    codeLabel: "Your return code",
    codePlaceholder: "Enter 6-character code",
    pinLabel: "Your PIN",
    pinPlaceholder: "Enter 4-digit PIN",
    loading: "Loading...",
    continue: "Continue",
    notFound: "Code not found. Please check and try again.",
    wrongPin: "Incorrect PIN. Please try again.",
    error: "Something went wrong. Please try again.",
  },
  sw: {
    title: "Rudi kwenye Mazungumzo",
    subtitle: "Ingiza msimbo wako kuendelea ulipoacha.",
    codeLabel: "Msimbo wako wa kurudi",
    codePlaceholder: "Ingiza msimbo wa herufi 6",
    pinLabel: "PIN yako",
    pinPlaceholder: "Ingiza PIN ya tarakimu 4",
    loading: "Inapakia...",
    continue: "Endelea",
    notFound: "Msimbo haujapatikana. Tafadhali angalia na jaribu tena.",
    wrongPin: "PIN isiyo sahihi. Tafadhali jaribu tena.",
    error: "Kuna kitu hakiko sawa. Tafadhali jaribu tena.",
  },
  sheng: {
    title: "Rudi kwa Convo",
    subtitle: "Ingiza code yako ku-continue ulipoisha.",
    codeLabel: "Code yako ya kurudi",
    codePlaceholder: "Enter code ya characters 6",
    pinLabel: "PIN yako",
    pinPlaceholder: "Enter PIN ya digits 4",
    loading: "Inaload...",
    continue: "Continue",
    notFound: "Code haijapatikana. Check na ujaribu tena.",
    wrongPin: "PIN wrong. Jaribu tena.",
    error: "Kitu kiko off. Jaribu tena.",
  },
};

const ReturnFlow = ({ language, onBack, onCaseLoaded }: ReturnFlowProps) => {
  const [caseId, setCaseId] = useState("");
  const [pin, setPin] = useState("");
  const [requiresPin, setRequiresPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const t = content[language];

  const handleLoad = async () => {
    if (caseId.length !== 6) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("case-manager", {
        body: {
          action: "load",
          caseId: caseId.toUpperCase(),
          pin: pin || undefined,
        },
      });

      if (invokeError) throw invokeError;

      if (data.error) {
        if (data.requiresPin) {
          setRequiresPin(true);
          setError(null);
        } else if (data.error === "Case not found") {
          setError(t.notFound);
        } else if (data.error === "Invalid PIN") {
          setError(t.wrongPin);
        } else {
          setError(t.error);
        }
        return;
      }

      if (data.success) {
        // Successfully loaded
        toast({
          title: language === "en" ? "Welcome back" : language === "sw" ? "Karibu tena" : "Welcome back",
          description: language === "en" ? "Your conversation has been restored." : "Mazungumzo yako yamerejeshwa.",
        });
        onCaseLoaded(data.messages, data.language, data.context);
      }
    } catch (err) {
      console.error("Error loading case:", err);
      setError(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-medium text-foreground">{t.title}</div>
        <div className="w-10" />
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-tunza-sage-light mx-auto flex items-center justify-center mb-4">
              <Key className="h-7 w-7 text-primary" />
            </div>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>

          {/* Case ID input */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                {t.codeLabel}
              </label>
              <input
                type="text"
                maxLength={6}
                value={caseId}
                onChange={(e) => setCaseId(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                placeholder={t.codePlaceholder}
                className="w-full text-center text-2xl font-mono tracking-[0.3em] bg-card border border-border rounded-xl py-4 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* PIN input (shown when required) */}
            {requiresPin && (
              <div className="animate-fade-in">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {t.pinLabel}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder={t.pinPlaceholder}
                  className="w-full text-center text-2xl tracking-[0.5em] bg-card border border-border rounded-xl py-4 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            {/* Error message */}
            {error && (
              <p className="text-destructive text-sm text-center animate-fade-in">
                {error}
              </p>
            )}

            <Button
              onClick={handleLoad}
              disabled={caseId.length !== 6 || isLoading || (requiresPin && pin.length !== 4)}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t.loading}
                </>
              ) : (
                t.continue
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReturnFlow;
