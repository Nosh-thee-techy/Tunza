import { useState } from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Language } from "./LanguageSelector";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DeleteCaseDialogProps {
  language: Language;
  caseId: string;
  hasPin: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

const content = {
  en: {
    title: "Delete this conversation?",
    description: "This will permanently remove all messages. This cannot be undone.",
    pinLabel: "Enter your PIN to confirm",
    pinPlaceholder: "Your PIN",
    deleteButton: "Delete permanently",
    cancelButton: "Keep it",
    deleting: "Deleting...",
    success: "Conversation deleted",
    errorPin: "Invalid PIN",
    errorGeneral: "Could not delete. Please try again.",
  },
  sw: {
    title: "Futa mazungumzo haya?",
    description: "Hii itaondoa ujumbe wote kabisa. Hii haiwezi kutenduliwa.",
    pinLabel: "Weka PIN yako kuthibitisha",
    pinPlaceholder: "PIN yako",
    deleteButton: "Futa kabisa",
    cancelButton: "Ihifadhi",
    deleting: "Inafuta...",
    success: "Mazungumzo yamefutwa",
    errorPin: "PIN si sahihi",
    errorGeneral: "Haikuweza kufuta. Tafadhali jaribu tena.",
  },
  sheng: {
    title: "Delete hii conversation?",
    description: "Hii ita-remove messages zote. Hii haiwezi ku-undo.",
    pinLabel: "Weka PIN yako ku-confirm",
    pinPlaceholder: "PIN yako",
    deleteButton: "Delete kabisa",
    cancelButton: "Keep it",
    deleting: "Inadelete...",
    success: "Conversation imedelete",
    errorPin: "PIN si poa",
    errorGeneral: "Haikuweza ku-delete. Jaribu tena.",
  },
};

const DeleteCaseDialog = ({ 
  language, 
  caseId, 
  hasPin, 
  onClose, 
  onDeleted 
}: DeleteCaseDialogProps) => {
  const [pin, setPin] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const t = content[language];

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const { data, error } = await supabase.functions.invoke("case-manager", {
        body: {
          action: "delete",
          caseId,
          pin: hasPin ? pin : undefined,
        },
      });

      if (error) throw error;

      if (!data.success) {
        if (data.error === "Invalid PIN") {
          toast({
            title: language === "en" ? "Error" : "Kosa",
            description: t.errorPin,
            variant: "destructive",
          });
        } else {
          throw new Error(data.error);
        }
        setIsDeleting(false);
        return;
      }

      toast({
        description: t.success,
      });
      
      onDeleted();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: language === "en" ? "Error" : "Kosa",
        description: t.errorGeneral,
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm shadow-card animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-amber-light flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-amber" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-subhead font-medium text-foreground text-center mb-2">
          {t.title}
        </h2>
        
        {/* Description */}
        <p className="text-body text-muted-foreground text-center mb-6">
          {t.description}
        </p>

        {/* PIN input if needed */}
        {hasPin && (
          <div className="mb-6">
            <label className="block text-small text-muted-foreground mb-2">
              {t.pinLabel}
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder={t.pinPlaceholder}
              className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-body text-center tracking-widest placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full gap-2 border-amber/30 text-amber hover:bg-amber-light"
            onClick={handleDelete}
            disabled={isDeleting || (hasPin && pin.length < 4)}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.deleting}
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                {t.deleteButton}
              </>
            )}
          </Button>
          
          <Button
            variant="ghost"
            className="w-full"
            onClick={onClose}
            disabled={isDeleting}
          >
            {t.cancelButton}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteCaseDialog;
