import { useState, useRef, useEffect, useCallback } from "react";
import { Phone, PhoneOff, ArrowLeft, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Language } from "./LanguageSelector";
import LanguageSelector from "./LanguageSelector";
import { RealtimeVoiceChat, RealtimeChatEvent } from "@/utils/RealtimeVoice";
import { useToast } from "@/hooks/use-toast";

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
    connecting: "Connecting...",
    connected: "Connected",
    listening: "I'm listening...",
    speaking: "Speaking...",
    end: "End Conversation",
    switchToChat: "Switch to chat",
    reassurance: "Take your time. There's no rush.",
    privacy: "This conversation is private.",
    languageLabel: "Speaking:",
    error: "Connection failed. Please try again.",
    micPermission: "Please allow microphone access to continue.",
  },
  sw: {
    ready: "Unaweza kuongea kwa uhuru",
    subtitle: "Unaweza kusimama wakati wowote.",
    start: "Anza Kuongea",
    connecting: "Inaunganisha...",
    connected: "Imeunganishwa",
    listening: "Nasikiliza...",
    speaking: "Inaongea...",
    end: "Maliza Mazungumzo",
    switchToChat: "Badilisha kwa chat",
    reassurance: "Chukua wakati wako. Hakuna haraka.",
    privacy: "Mazungumzo haya ni ya faragha.",
    languageLabel: "Inaongea:",
    error: "Muunganisho umeshindikana. Tafadhali jaribu tena.",
    micPermission: "Tafadhali ruhusu ufikiaji wa maikrofoni ili kuendelea.",
  },
  sheng: {
    ready: "Unaweza ongea free",
    subtitle: "Unaweza stop anytime.",
    start: "Anza Kuongea",
    connecting: "Inconnect...",
    connected: "Ime-connect",
    listening: "Nakuskia...",
    speaking: "Inaongea...",
    end: "End Conversation",
    switchToChat: "Switch kwa chat",
    reassurance: "Chukua time yako. Hakuna pressure.",
    privacy: "Hii convo ni private.",
    languageLabel: "Tunaongea:",
    error: "Connection imefail. Jaribu tena.",
    micPermission: "Ruhusu mic access ili tuendelee.",
  },
};

type ConnectionState = "idle" | "connecting" | "connected" | "error";

const VoiceInterface = ({ language, onLanguageChange, onBack, onSwitchToChat }: VoiceInterfaceProps) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const voiceChatRef = useRef<RealtimeVoiceChat | null>(null);
  const { toast } = useToast();
  const t = content[language];

  const handleMessage = useCallback((event: RealtimeChatEvent) => {
    console.log("Voice event:", event.type);
    
    switch (event.type) {
      case "response.audio.delta":
        setIsSpeaking(true);
        break;
      case "response.audio.done":
        setIsSpeaking(false);
        break;
      case "response.audio_transcript.delta":
        // AI is responding with text
        if (typeof event.delta === "string") {
          setTranscript((prev) => prev + event.delta);
        }
        break;
      case "response.audio_transcript.done":
        // Response complete
        setTimeout(() => setTranscript(""), 3000);
        break;
      case "input_audio_buffer.speech_started":
        // User started speaking
        setTranscript("");
        break;
      case "conversation.item.input_audio_transcription.completed":
        // User's speech was transcribed
        console.log("User said:", event.transcript);
        break;
      case "error":
        console.error("Voice error:", event);
        toast({
          title: language === "en" ? "Error" : language === "sw" ? "Kosa" : "Error",
          description: t.error,
          variant: "destructive",
        });
        break;
    }
  }, [language, t.error, toast]);

  const handleConnectionChange = useCallback((connected: boolean) => {
    console.log("Connection state changed:", connected);
    if (connected) {
      setConnectionState("connected");
    } else if (connectionState === "connecting") {
      setConnectionState("error");
    } else {
      setConnectionState("idle");
    }
  }, [connectionState]);

  const startConversation = async () => {
    try {
      setConnectionState("connecting");
      setTranscript("");
      
      // Check microphone permission first
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        toast({
          title: language === "en" ? "Microphone Access" : "Maikrofoni",
          description: t.micPermission,
          variant: "destructive",
        });
        setConnectionState("idle");
        return;
      }

      voiceChatRef.current = new RealtimeVoiceChat(
        handleMessage,
        handleConnectionChange,
        language
      );
      
      await voiceChatRef.current.init();
      
    } catch (error) {
      console.error("Error starting conversation:", error);
      setConnectionState("error");
      toast({
        title: language === "en" ? "Connection Error" : "Kosa",
        description: t.error,
        variant: "destructive",
      });
    }
  };

  const endConversation = () => {
    voiceChatRef.current?.disconnect();
    voiceChatRef.current = null;
    setConnectionState("idle");
    setIsSpeaking(false);
    setTranscript("");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      voiceChatRef.current?.disconnect();
    };
  }, []);

  const isActive = connectionState === "connected";

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
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
          {connectionState === "idle" || connectionState === "error" ? (
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
                  onClick={startConversation}
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
              {connectionState === "error" && (
                <p className="text-destructive text-sm mt-4">{t.error}</p>
              )}
            </div>
          ) : connectionState === "connecting" ? (
            // Connecting state
            <div className="text-center animate-fade-in">
              <div className="mb-8">
                <div className="w-32 h-32 rounded-full bg-tunza-sage-light mx-auto flex items-center justify-center">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                </div>
              </div>
              <h2 className="text-2xl font-medium text-foreground mb-3">
                {t.connecting}
              </h2>
              <p className="text-muted-foreground">
                {t.reassurance}
              </p>
            </div>
          ) : (
            // Connected/Active state
            <div className="text-center animate-fade-in">
              {/* Sound wave visualization */}
              <div className="mb-8">
                <div className="w-40 h-40 rounded-full bg-tunza-sage-light mx-auto flex items-center justify-center relative">
                  {isSpeaking ? (
                    // AI is speaking - show animated waves
                    <div className="flex items-center justify-center gap-1 h-12">
                      {[...Array(7)].map((_, i) => (
                        <div
                          key={i}
                          className="wave-bar"
                          style={{ animationPlayState: "running" }}
                        />
                      ))}
                    </div>
                  ) : (
                    // Listening - show subtle pulse
                    <div className="w-16 h-16 rounded-full bg-primary/20 animate-pulse-gentle flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-primary/40" />
                    </div>
                  )}
                  
                  {/* Pulsing ring when active */}
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse-gentle" />
                </div>
              </div>

              <h2 className="text-2xl font-medium text-foreground mb-3">
                {isSpeaking ? t.speaking : t.listening}
              </h2>
              
              {/* Transcript display */}
              {transcript && (
                <div className="bg-card border border-border rounded-xl p-4 mb-6 max-w-xs mx-auto">
                  <p className="text-sm text-foreground">{transcript}</p>
                </div>
              )}
              
              <p className="text-muted-foreground mb-8">
                {t.reassurance}
              </p>

              {/* End button */}
              <Button
                variant="outline"
                size="lg"
                onClick={endConversation}
                className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <PhoneOff className="h-5 w-5" />
                {t.end}
              </Button>
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
