import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Language } from "./LanguageSelector";

interface ExportCaseDialogProps {
  language: Language;
  messages: Array<{ role: string; content: string }>;
  caseId?: string;
}

const content = {
  en: {
    title: "Export Conversation",
    description: "Download your conversation history. You can save it for your records.",
    caseIdLabel: "Case ID (optional)",
    caseIdPlaceholder: "Enter case ID to export saved conversation",
    pinLabel: "PIN (if set)",
    pinPlaceholder: "Enter PIN",
    exportCurrent: "Export Current Chat",
    exportSaved: "Export Saved Case",
    exporting: "Exporting...",
    success: "Conversation exported successfully",
    error: "Failed to export conversation",
    noMessages: "No messages to export",
    downloadReady: "Your download is ready",
  },
  sw: {
    title: "Hamisha Mazungumzo",
    description: "Pakua historia yako ya mazungumzo. Unaweza kuihifadhi kwa rekodi zako.",
    caseIdLabel: "Kitambulisho cha kesi (hiari)",
    caseIdPlaceholder: "Ingiza kitambulisho cha kesi kuhamisha mazungumzo yaliyohifadhiwa",
    pinLabel: "PIN (ikiwekwa)",
    pinPlaceholder: "Ingiza PIN",
    exportCurrent: "Hamisha Mazungumzo ya Sasa",
    exportSaved: "Hamisha Kesi Iliyohifadhiwa",
    exporting: "Inahamisha...",
    success: "Mazungumzo yamehamishwa kwa ufanisi",
    error: "Imeshindwa kuhamisha mazungumzo",
    noMessages: "Hakuna ujumbe wa kuhamisha",
    downloadReady: "Upakuaji wako uko tayari",
  },
  sheng: {
    title: "Export Convo",
    description: "Download history ya convo yako. Unaweza save kwa records zako.",
    caseIdLabel: "Case ID (optional)",
    caseIdPlaceholder: "Ingiza case ID kuexport convo iliyosaved",
    pinLabel: "PIN (kama ilikuwa imeset)",
    pinPlaceholder: "Ingiza PIN",
    exportCurrent: "Export Current Chat",
    exportSaved: "Export Saved Case",
    exporting: "Inaexport...",
    success: "Convo imeexport sawa",
    error: "Export imefail",
    noMessages: "Hakuna messages za kuexport",
    downloadReady: "Download yako iko ready",
  },
};

const ExportCaseDialog = ({ language, messages, caseId: currentCaseId }: ExportCaseDialogProps) => {
  const [open, setOpen] = useState(false);
  const [caseId, setCaseId] = useState(currentCaseId || "");
  const [pin, setPin] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const t = content[language];

  const formatMessages = (msgs: Array<{ role: string; content: string }>) => {
    const header = `Tunza Conversation Export
Date: ${new Date().toLocaleString()}
Language: ${language === "en" ? "English" : language === "sw" ? "Kiswahili" : "Sheng"}
${"=".repeat(50)}

`;

    const formatted = msgs.map((msg) => {
      const speaker = msg.role === "user" ? "You" : "Tunza";
      return `[${speaker}]\n${msg.content}\n`;
    }).join("\n");

    const footer = `
${"=".repeat(50)}
This is a private export from Tunza.
Keep it safe and secure.
`;

    return header + formatted + footer;
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCurrent = () => {
    if (messages.length === 0) {
      toast({
        title: t.noMessages,
        variant: "destructive",
      });
      return;
    }

    const formatted = formatMessages(messages);
    const filename = `tunza-conversation-${new Date().toISOString().split("T")[0]}.txt`;
    downloadFile(formatted, filename);

    toast({
      title: t.success,
      description: t.downloadReady,
    });
    setOpen(false);
  };

  const handleExportSaved = async () => {
    if (!caseId.trim()) {
      toast({
        title: language === "en" ? "Case ID required" : "Kitambulisho kinahitajika",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      const { data, error } = await supabase.functions.invoke("case-manager", {
        body: {
          action: "export",
          caseId: caseId.trim(),
          pin: pin || undefined,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || "Export failed");
      }

      const formatted = formatMessages(data.messages || []);
      const filename = `tunza-case-${caseId.trim()}-${new Date().toISOString().split("T")[0]}.txt`;
      downloadFile(formatted, filename);

      toast({
        title: t.success,
        description: t.downloadReady,
      });
      setOpen(false);
      setCaseId("");
      setPin("");
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: t.error,
        description: error instanceof Error ? error.message : t.error,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <Download className="h-4 w-4" />
          {language === "en" ? "Export" : language === "sw" ? "Hamisha" : "Export"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FileText className="h-5 w-5 text-primary" />
            {t.title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Export current conversation */}
          {messages.length > 0 && (
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleExportCurrent}
              >
                <Download className="h-4 w-4" />
                {t.exportCurrent}
              </Button>
            </div>
          )}

          {/* Divider */}
          {messages.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-small text-muted-foreground">
                {language === "en" ? "or" : language === "sw" ? "au" : "ama"}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
          )}

          {/* Export saved case */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="export-case-id" className="text-foreground">
                {t.caseIdLabel}
              </Label>
              <Input
                id="export-case-id"
                placeholder={t.caseIdPlaceholder}
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="export-pin" className="text-foreground">
                {t.pinLabel}
              </Label>
              <Input
                id="export-pin"
                type="password"
                placeholder={t.pinPlaceholder}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={6}
                className="bg-background border-border"
              />
            </div>

            <Button
              variant="default"
              className="w-full gap-2"
              onClick={handleExportSaved}
              disabled={isExporting || !caseId.trim()}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.exporting}
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  {t.exportSaved}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportCaseDialog;
