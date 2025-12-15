import { useState } from "react";
import { Phone, PhoneOff, Pause, Play, ArrowLeft, MessageCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Language } from "./LanguageSelector";
import LanguageSelector from "./LanguageSelector";

interface VoiceInterfaceProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onBack: () => void;
  onSwitchToChat: () => void;
}

const content = {
  en: {
    ready: "You can speak freely",
    subtitle: "You can stop anytime.",
    start: "Start Talking",
    listening: "I'm listening...",
    pause: "Paused",
    resume: "Resume",
    end: "End",
    switchToChat: "Switch to chat",
    reassurance: "Take your time. There's no rush.",
    privacy: "This conversation is private and encrypted.",
    languageLabel: "Speaking:",
  },
  sw: {
    ready: "Unaweza kuongea kwa uhuru",
    subtitle: "Unaweza kusimama wakati wowote.",
    start: "Anza Kuongea",
    listening: "Nasikiliza...",
    pause: "Imesimamishwa",
    resume: "Endelea",
    end: "Maliza",
    switchToChat: "Badilisha kwa chat",
    reassurance: "Chukua wakati wako. Hakuna haraka.",
    privacy: "Mazungumzo haya ni ya faragha na yamesimbwa.",
    languageLabel: "Inaongea:",
  },
  sheng: {
    ready: "Unaweza ongea free",
    subtitle: "Unaweza stop anytime.",
    start: "Anza Kuongea",
    listening: "Nakuskia...",
    pause: "Ime-pause",
    resume: "Endelea",
    end: "Maliza",
    switchToChat: "Switch kwa chat",
    reassurance: "Chukua time yako. Hakuna pressure.",
    privacy: "Hii convo ni private na encrypted.",
    languageLabel: "Tunaongea:",
  },
};

const languageNames: Record<Language, string> = {
  en: "English",
  sw: "Kiswahili",
  sheng: "Sheng",
};

type CallState = "idle" | "active" | "paused";

const VoiceInterface = ({ language, onLanguageChange, onBack, onSwitchToChat }: VoiceInterfaceProps) => {
  const [callState, setCallState] = useState<CallState>("idle");
  const t = content[language];

  const handleStartCall = () => {
    setCallState("active");
    // TODO: Implement actual voice recording and streaming
  };

  const handlePauseResume = () => {
    setCallState(callState === "active" ? "paused" : "active");
  };

  const handleEndCall = () => {
    setCallState("idle");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t.languageLabel}</span>
          <LanguageSelector
            currentLanguage={language}
            onLanguageChange={onLanguageChange}
          />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        {/* Voice visualization area */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
          {callState === "idle" ? (
            // Idle state - Ready to start
            <div className="text-center animate-fade-in">
              <div className="mb-8">
                <div className="w-32 h-32 rounded-full bg-tunza-sage-light mx-auto flex items-center justify-center animate-breathe">
                  <Phone className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h2 className="text-2xl font-medium text-foreground mb-2">
                {t.ready}
              </h2>
              <p className="text-muted-foreground mb-8">
                {t.subtitle}
              </p>
              <div className="space-y-3">
                <Button
                  variant="voice"
                  size="xl"
                  onClick={handleStartCall}
                  className="gap-3 w-full max-w-xs"
                >
                  <Phone className="h-6 w-6" />
                  {t.start}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onSwitchToChat}
                  className="gap-2 w-full max-w-xs"
                >
                  <MessageCircle className="h-5 w-5" />
                  {t.switchToChat}
                </Button>
              </div>
            </div>
          ) : (
            // Active or paused state
            <div className="text-center animate-fade-in">
              {/* Sound wave visualization */}
              <div className="mb-8">
                <div className="w-40 h-40 rounded-full bg-tunza-sage-light mx-auto flex items-center justify-center relative">
                  {callState === "active" ? (
                    // Active - show sound waves
                    <div className="flex items-center justify-center gap-1 h-12">
                      {[...Array(7)].map((_, i) => (
                        <div
                          key={i}
                          className="wave-bar"
                          style={{
                            height: "8px",
                            animationPlayState: "running",
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    // Paused
                    <Pause className="h-12 w-12 text-primary" />
                  )}
                  
                  {/* Pulsing ring when active */}
                  {callState === "active" && (
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse-gentle" />
                  )}
                </div>
              </div>

              <h2 className="text-2xl font-medium text-foreground mb-3">
                {callState === "active" ? t.listening : t.pause}
              </h2>
              <p className="text-muted-foreground mb-10">
                {t.reassurance}
              </p>

              {/* Control buttons */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="secondary"
                  size="icon-lg"
                  onClick={handlePauseResume}
                  className="rounded-full"
                >
                  {callState === "active" ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon-lg"
                  onClick={handleEndCall}
                  className="rounded-full border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer reassurance */}
      <footer className="p-6 text-center">
        <p className="text-xs text-muted-foreground">
          {t.privacy}
        </p>
      </footer>
    </div>
  );
};

export default VoiceInterface;
