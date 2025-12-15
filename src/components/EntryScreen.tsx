import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import LanguageSelector, { Language } from "./LanguageSelector";

type EntryOption = "noticed" | "voice" | "chat" | "info" | "return";

interface EntryScreenProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onSelectOption: (option: EntryOption) => void;
}

const content = {
  en: {
    tagline: "This is a safe place to talk about something that doesn't feel right.",
    options: {
      voice: {
        title: "Talk now",
        description: "Have a voice conversation",
        icon: "🎙️",
      },
      chat: {
        title: "Chat instead",
        description: "Text with someone who listens",
        icon: "💬",
      },
      noticed: {
        title: "I noticed something concerning",
        description: "About someone else",
        icon: "👁️",
      },
      info: {
        title: "Just looking for information",
        description: "Learn about support available",
        icon: "ℹ️",
      },
    },
    return: "Return to a saved conversation",
    privacy: "Your privacy is protected. No login required.",
  },
  sw: {
    tagline: "Hapa ni mahali salama kuongea kuhusu jambo linaloonekana haliko sawa.",
    options: {
      voice: {
        title: "Ongea sasa",
        description: "Mazungumzo ya sauti",
        icon: "🎙️",
      },
      chat: {
        title: "Chat badala yake",
        description: "Andika na mtu anayesikiliza",
        icon: "💬",
      },
      noticed: {
        title: "Nimeona jambo la kusumbua",
        description: "Kuhusu mtu mwingine",
        icon: "👁️",
      },
      info: {
        title: "Natafuta habari tu",
        description: "Jifunze kuhusu msaada unaopatikana",
        icon: "ℹ️",
      },
    },
    return: "Rudi kwenye mazungumzo yaliyohifadhiwa",
    privacy: "Faragha yako inalindwa. Hakuna usajili unaohitajika.",
  },
  sheng: {
    tagline: "Hapa ni mahali safe kuongea kuhusu kitu kinachoonekana si poa.",
    options: {
      voice: {
        title: "Ongea sasa",
        description: "Voice conversation",
        icon: "🎙️",
      },
      chat: {
        title: "Chat badala",
        description: "Text na mtu anaskia",
        icon: "💬",
      },
      noticed: {
        title: "Nime-notice kitu weird",
        description: "Kuhusu mtu mwingine",
        icon: "👁️",
      },
      info: {
        title: "Natafuta info tu",
        description: "Pata habari kuhusu msaada",
        icon: "ℹ️",
      },
    },
    return: "Rudi kwa saved convo",
    privacy: "Privacy yako iko safe. Hakuna login needed.",
  },
};

const EntryScreen = ({ language, onLanguageChange, onSelectOption }: EntryScreenProps) => {
  const t = content[language];
  const options: Array<"voice" | "chat" | "noticed" | "info"> = ["voice", "chat", "noticed", "info"];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-4">
        <div className="w-10" />
        <LanguageSelector
          currentLanguage={language}
          onLanguageChange={onLanguageChange}
        />
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col justify-center px-6 pb-6 max-w-lg mx-auto w-full">
        {/* Calming tagline */}
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="w-16 h-16 rounded-full bg-sage-light mx-auto flex items-center justify-center mb-6">
            <div className="w-7 h-7 rounded-full bg-primary/30 animate-breathe" />
          </div>
          <p className="text-subhead text-foreground leading-relaxed text-balance max-w-sm mx-auto">
            {t.tagline}
          </p>
        </div>

        {/* Entry options - soft card layout */}
        <div className="space-y-3">
          {options.map((option, index) => {
            const optionContent = t.options[option];
            
            return (
              <Button
                key={option}
                variant="entry"
                className="w-full animate-fade-in-up"
                style={{ animationDelay: `${(index + 1) * 60}ms` }}
                onClick={() => onSelectOption(option)}
              >
                <div className="flex items-center gap-4 w-full">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-lg ${
                    option === "voice" ? "bg-sage-light" :
                    option === "chat" ? "bg-sky-light" :
                    option === "noticed" ? "bg-amber-light" :
                    "bg-secondary"
                  }`}>
                    {optionContent.icon}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-foreground">
                      {optionContent.title}
                    </div>
                    <div className="text-small text-muted-foreground mt-0.5">
                      {optionContent.description}
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>

        {/* Return link */}
        <div className="mt-8 text-center animate-fade-in-up" style={{ animationDelay: "350ms" }}>
          <button
            onClick={() => onSelectOption("return")}
            className="inline-flex items-center gap-2 text-small text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            {t.return}
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="text-small text-muted-foreground">
          {t.privacy}
        </p>
      </footer>
    </div>
  );
};

export default EntryScreen;
