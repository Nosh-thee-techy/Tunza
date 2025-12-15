import { useState } from "react";
import { ArrowLeft, Save, Key, Copy, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Language } from "./LanguageSelector";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SaveCaseDialogProps {
  language: Language;
  messages: Array<{ role: string; content: string }>;
  context: string;
  onClose: () => void;
  onSaved: (caseId: string, pin?: string) => void;
}

const content = {
  en: {
    title: "Save for Later",
    subtitle: "You can return to this conversation anytime.",
    pinLabel: "Add a PIN (optional)",
    pinHint: "A PIN adds extra privacy. 4 digits.",
    saving: "Saving...",
    save: "Save",
    yourCode: "Your return code",
    codeHint: "Write this down somewhere safe. You'll need it to return.",
    copied: "Copied!",
    copy: "Copy",
    done: "Done",
    withPin: "Protected with your PIN",
    noPin: "No PIN set",
  },
  sw: {
    title: "Hifadhi kwa Baadaye",
    subtitle: "Unaweza kurudi kwenye mazungumzo haya wakati wowote.",
    pinLabel: "Ongeza PIN (si lazima)",
    pinHint: "PIN inaongeza faragha. Tarakimu 4.",
    saving: "Inahifadhi...",
    save: "Hifadhi",
    yourCode: "Msimbo wako wa kurudi",
    codeHint: "Andika hii mahali salama. Utaihitaji kurudi.",
    copied: "Imenakiliwa!",
    copy: "Nakili",
    done: "Imekwisha",
    withPin: "Imelindwa na PIN yako",
    noPin: "Hakuna PIN",
  },
  sheng: {
    title: "Save for Later",
    subtitle: "Unaweza rudi kwa hii convo anytime.",
    pinLabel: "Add PIN (optional)",
    pinHint: "PIN ina-add privacy. Digits 4.",
    saving: "Inasave...",
    save: "Save",
    yourCode: "Code yako ya kurudi",
    codeHint: "Andika hii mahali safe. Utaihitaji kurudi.",
    copied: "Imecopy!",
    copy: "Copy",
    done: "Done",
    withPin: "Imelindwa na PIN yako",
    noPin: "Hakuna PIN",
  },
};

const SaveCaseDialog = ({ language, messages, context, onClose, onSaved }: SaveCaseDialogProps) => {
  const [pin, setPin] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedCaseId, setSavedCaseId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const t = content[language];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("case-manager", {
        body: {
          action: "create",
          pin: pin.length === 4 ? pin : undefined,
          messages,
          language,
          context,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setSavedCaseId(data.caseId);
      onSaved(data.caseId, pin.length === 4 ? pin : undefined);
    } catch (error) {
      console.error("Error saving case:", error);
      toast({
        title: language === "en" ? "Error" : "Kosa",
        description: language === "en" ? "Could not save. Please try again." : "Haiwezi kuhifadhi. Jaribu tena.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async () => {
    if (savedCaseId) {
      await navigator.clipboard.writeText(savedCaseId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-medium text-foreground">{t.title}</div>
        <div className="w-10" />
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        {!savedCaseId ? (
          // Save form
          <div className="w-full max-w-sm animate-fade-in-up">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-tunza-sage-light mx-auto flex items-center justify-center mb-4">
                <Save className="h-7 w-7 text-primary" />
              </div>
              <p className="text-muted-foreground">{t.subtitle}</p>
            </div>

            {/* PIN input */}
            <div className="bg-card border border-border rounded-2xl p-5 mb-6">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                <Key className="h-4 w-4 text-muted-foreground" />
                {t.pinLabel}
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="• • • •"
                className="w-full text-center text-2xl tracking-[0.5em] bg-secondary rounded-xl py-4 border-0 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-3 text-center">{t.pinHint}</p>
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full"
              size="lg"
            >
              {isSaving ? t.saving : t.save}
            </Button>
          </div>
        ) : (
          // Success - show case ID
          <div className="w-full max-w-sm animate-fade-in-up text-center">
            <div className="w-16 h-16 rounded-full bg-tunza-sage-light mx-auto flex items-center justify-center mb-6">
              <Check className="h-8 w-8 text-primary" />
            </div>

            <h2 className="text-lg font-medium text-foreground mb-2">{t.yourCode}</h2>
            <p className="text-sm text-muted-foreground mb-6">{t.codeHint}</p>

            {/* Case ID display */}
            <div className="bg-card border-2 border-primary/30 rounded-2xl p-6 mb-4">
              <div className="text-4xl font-mono font-bold tracking-[0.3em] text-foreground mb-2">
                {savedCaseId}
              </div>
              <p className="text-xs text-muted-foreground">
                {pin.length === 4 ? t.withPin : t.noPin}
              </p>
            </div>

            <Button
              variant="outline"
              onClick={handleCopy}
              className="gap-2 mb-6"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? t.copied : t.copy}
            </Button>

            <Button onClick={onClose} className="w-full" size="lg">
              {t.done}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default SaveCaseDialog;
