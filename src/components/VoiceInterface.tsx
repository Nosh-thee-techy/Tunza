import { useState } from "react";
import { Phone, PhoneOff, Pause, Play, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Language } from "./LanguageSelector";

interface VoiceInterfaceProps {
  language: Language;
  onBack: () => void;
}

const languageLabels: Record<Language, string> = {
  en: "Speaking: English",
  sw: "Inaongea: Kiswahili",
  sheng: "Tunaongea: Sheng",
};

const content = {
  en: {
    ready: "Ready when you are",
    start: "Start Talking",
    listening: "I'm listening...",
    pause: "Pause",
    resume: "Resume",
    end: "End",
    reassurance: "Take your time. There's no rush.",
  },
  sw: {
    ready: "Niko tayari ukiwa tayari",
    start: "Anza Kuongea",
    listening: "Nasikiliza...",
    pause: "Simamisha",
    resume: "Endelea",
    end: "Maliza",
    reassurance: "Chukua wakati wako. Hakuna haraka.",
  },
  sheng: {
    ready: "Niko ready ukiwa ready",
    start: "Anza Kuongea",
    listening: "Nakuskia...",
    pause: "Pause",
    resume: "Endelea",
    end: "Maliza",
    reassurance: "Pole pole, hakuna pressure.",
  },
};

type CallState = "idle" | "active" | "paused";

const VoiceInterface = ({ language, onBack }: VoiceInterfaceProps) => {
  const [callState, setCallState] = useState<CallState>("idle");
  const t = content[language];

  const handleStartCall = () => {
    setCallState("active");
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
        <div className="text-sm text-muted-foreground">
          {languageLabels[language]}
        </div>
        <div className="w-10" />
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
              <h2 className="text-2xl font-medium text-foreground mb-3">
                {t.ready}
              </h2>
              <p className="text-muted-foreground mb-10">
                {t.reassurance}
              </p>
              <Button
                variant="voice"
                size="xl"
                onClick={handleStartCall}
                className="gap-3"
              >
                <Phone className="h-6 w-6" />
                {t.start}
              </Button>
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
          {language === "en" && "This conversation is private and encrypted."}
          {language === "sw" && "Mazungumzo haya ni ya faragha na yamesimbwa."}
          {language === "sheng" && "Hii convo ni private na encrypted."}
        </p>
      </footer>
    </div>
  );
};

export default VoiceInterface;
