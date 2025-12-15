import { useState } from "react";
import { Download, FileText, Loader2, Sparkles, RefreshCw, Edit3 } from "lucide-react";
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
import { Textarea } from "./ui/textarea";
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
    generateSummary: "Generate AI Summary",
    generating: "Generating summary...",
    summaryTitle: "Conversation Summary",
    summaryDescription: "Review and edit the AI-generated summary before exporting.",
    editSummary: "Edit summary",
    regenerate: "Regenerate",
    includeSummary: "Include summary in export",
    confirmExport: "Export with Summary",
    skipSummary: "Export without Summary",
    back: "Back",
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
    generateSummary: "Tengeneza Muhtasari wa AI",
    generating: "Inatengeneza muhtasari...",
    summaryTitle: "Muhtasari wa Mazungumzo",
    summaryDescription: "Kagua na ubadilishe muhtasari kabla ya kuhamisha.",
    editSummary: "Hariri muhtasari",
    regenerate: "Tengeneza upya",
    includeSummary: "Jumuisha muhtasari",
    confirmExport: "Hamisha na Muhtasari",
    skipSummary: "Hamisha bila Muhtasari",
    back: "Rudi",
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
    generateSummary: "Generate AI Summary",
    generating: "Inatengeneza summary...",
    summaryTitle: "Convo Summary",
    summaryDescription: "Check na edit AI summary kabla ya export.",
    editSummary: "Edit summary",
    regenerate: "Regenerate",
    includeSummary: "Include summary",
    confirmExport: "Export na Summary",
    skipSummary: "Export bila Summary",
    back: "Back",
  },
};

type ExportStep = "initial" | "summary" | "editing";

const ExportCaseDialog = ({ language, messages, caseId: currentCaseId }: ExportCaseDialogProps) => {
  const [open, setOpen] = useState(false);
  const [caseId, setCaseId] = useState(currentCaseId || "");
  const [pin, setPin] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState("");
  const [editedSummary, setEditedSummary] = useState("");
  const [step, setStep] = useState<ExportStep>("initial");
  const [messagesToExport, setMessagesToExport] = useState<Array<{ role: string; content: string }>>([]);
  const { toast } = useToast();
  const t = content[language];

  const resetState = () => {
    setStep("initial");
    setSummary("");
    setEditedSummary("");
    setMessagesToExport([]);
  };

  const generateSummary = async (msgs: Array<{ role: string; content: string }>) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-summary", {
        body: { messages: msgs, language },
      });

      if (error) {
        throw new Error(error.message || "Failed to generate summary");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const generatedSummary = data?.summary || "";
      setSummary(generatedSummary);
      setEditedSummary(generatedSummary);
      setMessagesToExport(msgs);
      setStep("summary");
    } catch (error) {
      console.error("Summary generation error:", error);
      toast({
        title: language === "en" ? "Couldn't generate summary" : "Muhtasari haujatengenezwa",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const formatMessages = (msgs: Array<{ role: string; content: string }>, includeSummary?: string) => {
    const header = `Tunza Conversation Export
Date: ${new Date().toLocaleString()}
Language: ${language === "en" ? "English" : language === "sw" ? "Kiswahili" : "Sheng"}
${"=".repeat(50)}

`;

    let summarySection = "";
    if (includeSummary) {
      summarySection = `📋 SUMMARY
${"-".repeat(30)}
${includeSummary}
${"-".repeat(30)}

`;
    }

    const formatted = msgs.map((msg) => {
      const speaker = msg.role === "user" ? "You" : "Tunza";
      return `[${speaker}]\n${msg.content}\n`;
    }).join("\n");

    const footer = `
${"=".repeat(50)}
This is a private export from Tunza.
Keep it safe and secure.
`;

    return header + summarySection + formatted + footer;
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

  const handleExportWithSummary = () => {
    const formatted = formatMessages(messagesToExport, editedSummary);
    const filename = `tunza-conversation-${new Date().toISOString().split("T")[0]}.txt`;
    downloadFile(formatted, filename);

    toast({
      title: t.success,
      description: t.downloadReady,
    });
    setOpen(false);
    resetState();
  };

  const handleExportWithoutSummary = () => {
    const formatted = formatMessages(messagesToExport);
    const filename = `tunza-conversation-${new Date().toISOString().split("T")[0]}.txt`;
    downloadFile(formatted, filename);

    toast({
      title: t.success,
      description: t.downloadReady,
    });
    setOpen(false);
    resetState();
  };

  const handleGenerateForCurrent = async () => {
    if (messages.length === 0) {
      toast({
        title: t.noMessages,
        variant: "destructive",
      });
      return;
    }
    await generateSummary(messages);
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

      // Generate summary for saved case
      await generateSummary(data.messages || []);
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

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetState();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <Download className="h-4 w-4" />
          {language === "en" ? "Export" : language === "sw" ? "Hamisha" : "Export"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        {step === "initial" && (
          <>
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
              {/* Export current conversation with AI summary */}
              {messages.length > 0 && (
                <div className="space-y-3">
                  <Button
                    variant="default"
                    className="w-full gap-2"
                    onClick={handleGenerateForCurrent}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t.generating}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        {t.generateSummary}
                      </>
                    )}
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
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleExportSaved}
                  disabled={isExporting || isGenerating || !caseId.trim()}
                >
                  {isExporting || isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isGenerating ? t.generating : t.exporting}
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
          </>
        )}

        {step === "summary" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <Sparkles className="h-5 w-5 text-primary" />
                {t.summaryTitle}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {t.summaryDescription}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              {/* Summary display/edit */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-foreground">{t.summaryTitle}</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStep("editing")}
                      className="h-8 gap-1 text-xs"
                    >
                      <Edit3 className="h-3 w-3" />
                      {t.editSummary}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => generateSummary(messagesToExport)}
                      disabled={isGenerating}
                      className="h-8 gap-1 text-xs"
                    >
                      <RefreshCw className={`h-3 w-3 ${isGenerating ? "animate-spin" : ""}`} />
                      {t.regenerate}
                    </Button>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{editedSummary}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                <Button
                  variant="default"
                  className="w-full gap-2"
                  onClick={handleExportWithSummary}
                >
                  <Download className="h-4 w-4" />
                  {t.confirmExport}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={handleExportWithoutSummary}
                >
                  {t.skipSummary}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={() => setStep("initial")}
                >
                  {t.back}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "editing" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <Edit3 className="h-5 w-5 text-primary" />
                {t.editSummary}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <Textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                className="min-h-[150px] bg-background border-border"
                placeholder={language === "en" ? "Edit your summary..." : "Hariri muhtasari wako..."}
              />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("summary")}
                >
                  {t.back}
                </Button>
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => setStep("summary")}
                >
                  {language === "en" ? "Save" : language === "sw" ? "Hifadhi" : "Save"}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ExportCaseDialog;
