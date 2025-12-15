import { useState, useRef, useEffect, useCallback } from "react";
import { Phone, PhoneOff, ArrowLeft, MessageCircle, Loader2, Mic, Volume2 } from "lucide-react";
import { Button } from "./ui/button";
import { Language } from "./LanguageSelector";
import LanguageSelector from "./LanguageSelector";
import { useScribe } from "@elevenlabs/react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useRiskDetection } from "@/hooks/useRiskDetection";

interface VoiceInterfaceProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onBack: () => void;
  onSwitchToChat: () => void;
  onEmergencyTriggered?: () => void;
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
    processing: "Processing...",
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
    processing: "Inashughulikia...",
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
    processing: "Inaprocess...",
    end: "End Conversation",
    switchToChat: "Switch kwa chat",
    reassurance: "Chukua time yako. Hakuna pressure.",
    privacy: "Hii convo ni private.",
    languageLabel: "Tunaongea:",
    error: "Connection imefail. Jaribu tena.",
    micPermission: "Ruhusu mic access ili tuendelee.",
  },
};

type VoiceState = "idle" | "connecting" | "listening" | "processing" | "speaking" | "error";

const VoiceInterface = ({ language, onLanguageChange, onBack, onSwitchToChat, onEmergencyTriggered }: VoiceInterfaceProps) => {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [userTranscript, setUserTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string; content: string}>>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const t = content[language];

  // Risk detection hook
  const { assessMessage } = useRiskDetection({
    onHighRisk: () => {
      console.log("High risk detected in voice - triggering emergency flow");
      onEmergencyTriggered?.();
    },
  });

  // ElevenLabs Speech-to-Text hook
  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    onPartialTranscript: (data) => {
      setUserTranscript(data.text);
    },
    onCommittedTranscript: async (data) => {
      console.log("User said:", data.text);
      if (data.text.trim()) {
        await processUserSpeech(data.text);
      }
    },
  });

  const processUserSpeech = async (userText: string) => {
    setVoiceState("processing");
    setUserTranscript(userText);

    // Assess risk silently in background
    assessMessage(userText, conversationHistory);

    try {
      // Add user message to history
      const newHistory = [...conversationHistory, { role: "user", content: userText }];
      setConversationHistory(newHistory);

      // Get AI response via tunza-chat
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tunza-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: newHistory.map(m => ({ role: m.role, content: m.content })),
            language,
            context: "general",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      // Parse streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          
          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const parsed = JSON.parse(line.slice(6));
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullResponse += content;
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      if (fullResponse) {
        setAiResponse(fullResponse);
        setConversationHistory([...newHistory, { role: "assistant", content: fullResponse }]);
        
        // Convert to speech using ElevenLabs TTS
        await speakResponse(fullResponse);
      }
    } catch (error) {
      console.error("Processing error:", error);
      toast({
        title: language === "en" ? "Error" : "Kosa",
        description: t.error,
        variant: "destructive",
      });
      setVoiceState("listening");
    }
  };

  const speakResponse = async (text: string) => {
    setVoiceState("speaking");
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-voice`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            action: "tts",
            text,
            language,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("TTS failed");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          setVoiceState("listening");
          setAiResponse("");
          URL.revokeObjectURL(audioUrl);
        };
        await audioRef.current.play();
      }
    } catch (error) {
      console.error("TTS error:", error);
      setVoiceState("listening");
    }
  };

  const startConversation = async () => {
    try {
      setVoiceState("connecting");
      setUserTranscript("");
      setAiResponse("");
      
      // Check microphone permission
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        toast({
          title: language === "en" ? "Microphone Access" : "Maikrofoni",
          description: t.micPermission,
          variant: "destructive",
        });
        setVoiceState("idle");
        return;
      }

      // Get STT token from ElevenLabs
      const { data, error } = await supabase.functions.invoke("elevenlabs-voice", {
        body: { action: "stt_token", language },
      });

      if (error || !data?.token) {
        throw new Error("Failed to get voice token");
      }

      // Connect to ElevenLabs Scribe
      await scribe.connect({
        token: data.token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      setVoiceState("listening");

      // Play initial greeting
      const greetings = {
        en: "Hello. I'm here to listen. Take your time and share what's on your mind when you're ready.",
        sw: "Habari. Niko hapa kusikiliza. Chukua wakati wako na ushiriki unachofikiria unapokuwa tayari.",
        sheng: "Sasa. Niko hapa kuskia. Chukua time yako na share chenye kiko kwa mind yako ukiwa ready.",
      };

      await speakResponse(greetings[language]);
      setConversationHistory([{ role: "assistant", content: greetings[language] }]);

    } catch (error) {
      console.error("Error starting conversation:", error);
      setVoiceState("error");
      toast({
        title: language === "en" ? "Connection Error" : "Kosa",
        description: t.error,
        variant: "destructive",
      });
    }
  };

  const endConversation = () => {
    scribe.disconnect();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setVoiceState("idle");
    setUserTranscript("");
    setAiResponse("");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      scribe.disconnect();
    };
  }, []);

  const isActive = voiceState !== "idle" && voiceState !== "error";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hidden audio element for TTS playback */}
      <audio ref={audioRef} className="hidden" />

      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-small text-muted-foreground">{t.languageLabel}</span>
          <LanguageSelector
            currentLanguage={language}
            onLanguageChange={onLanguageChange}
          />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
          {voiceState === "idle" || voiceState === "error" ? (
            // Idle state - Ready to start
            <div className="text-center animate-fade-in">
              <div className="mb-8">
                <div className="w-36 h-36 rounded-full bg-sage-light mx-auto flex items-center justify-center animate-breathe">
                  <Phone className="h-14 w-14 text-primary" />
                </div>
              </div>
              <h2 className="text-headline font-medium text-foreground mb-3">
                {t.ready}
              </h2>
              <p className="text-body text-muted-foreground mb-8">
                {t.subtitle}
              </p>
              <div className="space-y-3">
                <Button
                  variant="default"
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
              {voiceState === "error" && (
                <p className="text-amber text-small mt-4">{t.error}</p>
              )}
            </div>
          ) : voiceState === "connecting" ? (
            // Connecting state
            <div className="text-center animate-fade-in">
              <div className="mb-8">
                <div className="w-36 h-36 rounded-full bg-sage-light mx-auto flex items-center justify-center">
                  <Loader2 className="h-14 w-14 text-primary animate-spin" />
                </div>
              </div>
              <h2 className="text-headline font-medium text-foreground mb-3">
                {t.connecting}
              </h2>
              <p className="text-body text-muted-foreground">
                {t.reassurance}
              </p>
            </div>
          ) : (
            // Active state (listening, processing, or speaking)
            <div className="text-center animate-fade-in">
              {/* Voice visualization - slow organic movement */}
              <div className="mb-8">
                <div className="w-44 h-44 rounded-full bg-sage-light mx-auto flex items-center justify-center relative">
                  {voiceState === "speaking" ? (
                    // AI is speaking - show slow animated waves
                    <div className="flex items-center justify-center gap-1.5 h-12">
                      {[...Array(7)].map((_, i) => (
                        <div
                          key={i}
                          className="wave-bar"
                          style={{ animationPlayState: "running" }}
                        />
                      ))}
                    </div>
                  ) : voiceState === "processing" ? (
                    // Processing - show gentle loader
                    <Loader2 className="h-14 w-14 text-primary animate-spin" />
                  ) : (
                    // Listening - show mic with gentle pulse
                    <div className="w-20 h-20 rounded-full bg-primary/20 animate-pulse-gentle flex items-center justify-center">
                      <Mic className="h-10 w-10 text-primary" />
                    </div>
                  )}
                  
                  {/* Gentle pulsing ring when active */}
                  <div className="absolute inset-0 rounded-full border-4 border-primary/15 animate-pulse-gentle" />
                </div>
              </div>

              <h2 className="text-headline font-medium text-foreground mb-3">
                {voiceState === "speaking" 
                  ? t.speaking 
                  : voiceState === "processing"
                  ? t.processing
                  : t.listening}
              </h2>
              
              {/* User transcript display */}
              {userTranscript && voiceState === "listening" && (
                <div className="bg-card border border-border rounded-2xl p-4 mb-4 max-w-xs mx-auto">
                  <div className="flex items-center gap-2 mb-1">
                    <Mic className="h-3 w-3 text-muted-foreground" />
                    <span className="text-small text-muted-foreground">You</span>
                  </div>
                  <p className="text-body text-foreground">{userTranscript}</p>
                </div>
              )}

              {/* AI response display */}
              {aiResponse && voiceState === "speaking" && (
                <div className="bg-sage-light border border-primary/20 rounded-2xl p-4 mb-4 max-w-xs mx-auto">
                  <div className="flex items-center gap-2 mb-1">
                    <Volume2 className="h-3 w-3 text-primary" />
                    <span className="text-small text-primary">Tunza</span>
                  </div>
                  <p className="text-body text-foreground">{aiResponse}</p>
                </div>
              )}
              
              <p className="text-body text-muted-foreground mb-8">
                {t.reassurance}
              </p>

              {/* End button - uses amber, not red */}
              <Button
                variant="outline"
                size="lg"
                onClick={endConversation}
                className="gap-2 border-amber/30 text-amber hover:bg-amber-light"
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
        <p className="text-small text-muted-foreground">
          {t.privacy}
        </p>
      </footer>
    </div>
  );
};

export default VoiceInterface;
