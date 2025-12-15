import { Eye, Phone, MessageCircle, Info } from "lucide-react";
import { Button } from "./ui/button";
import LanguageSelector, { Language } from "./LanguageSelector";

type EntryOption = "noticed" | "voice" | "chat" | "info";

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
      },
      chat: {
        title: "Chat instead",
        description: "Text with someone who understands",
      },
      noticed: {
        title: "I noticed something concerning",
        description: "About someone else",
      },
      info: {
        title: "Just looking for information",
        description: "Learn about support and resources",
      },
    },
    privacy: "Your privacy is protected. No login required.",
  },
  sw: {
    tagline: "Hapa ni mahali salama kuongea kuhusu jambo linaloonekana haliko sawa.",
    options: {
      voice: {
        title: "Ongea sasa",
        description: "Mazungumzo ya sauti",
      },
      chat: {
        title: "Chat badala yake",
        description: "Andika na mtu anayeelewa",
      },
      noticed: {
        title: "Nimeona jambo la kusumbua",
        description: "Kuhusu mtu mwingine",
      },
      info: {
        title: "Natafuta habari tu",
        description: "Jifunze kuhusu msaada na rasilimali",
      },
    },
    privacy: "Faragha yako inalindwa. Hakuna usajili unaohitajika.",
  },
  sheng: {
    tagline: "Hapa ni mahali safe kuongea kuhusu kitu kinachoonekana si poa.",
    options: {
      voice: {
        title: "Ongea sasa",
        description: "Voice conversation, moja kwa moja",
      },
      chat: {
        title: "Chat badala",
        description: "Text na mtu anakuelewa",
      },
      noticed: {
        title: "Nime-notice kitu weird",
        description: "Kuhusu mtu mwingine",
      },
      info: {
        title: "Natafuta info tu",
        description: "Pata habari kuhusu msaada",
      },
    },
    privacy: "Privacy yako iko safe. Hakuna login needed.",
  },
};

const icons = {
  voice: Phone,
  chat: MessageCircle,
  noticed: Eye,
  info: Info,
};

const EntryScreen = ({ language, onLanguageChange, onSelectOption }: EntryScreenProps) => {
  const t = content[language];

  // Order of options matches the workflow
  const options: EntryOption[] = ["voice", "chat", "noticed", "info"];

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
      <main className="flex-1 flex flex-col justify-center px-6 pb-8 max-w-lg mx-auto w-full">
        {/* Calming tagline */}
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="w-16 h-16 rounded-full bg-tunza-sage-light mx-auto flex items-center justify-center mb-6">
            <div className="w-8 h-8 rounded-full bg-primary/30 animate-breathe" />
          </div>
          <p className="text-lg text-foreground leading-relaxed text-balance max-w-sm mx-auto">
            {t.tagline}
          </p>
        </div>

        {/* Entry options - equal weight, large buttons */}
        <div className="space-y-4">
          {options.map((option, index) => {
            const Icon = icons[option];
            const optionContent = t.options[option];
            
            return (
              <Button
                key={option}
                variant="entry"
                className="w-full animate-fade-in-up"
                style={{ animationDelay: `${(index + 1) * 80}ms` }}
                onClick={() => onSelectOption(option)}
              >
                <div className="flex items-center gap-4 w-full">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                    option === "voice" ? "bg-tunza-sage-light" :
                    option === "chat" ? "bg-tunza-sky-light" :
                    option === "noticed" ? "bg-tunza-earth-light" :
                    "bg-secondary"
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      option === "voice" ? "text-primary" :
                      option === "chat" ? "text-tunza-sky" :
                      option === "noticed" ? "text-tunza-earth" :
                      "text-muted-foreground"
                    }`} />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-foreground">
                      {optionContent.title}
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {optionContent.description}
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="text-xs text-muted-foreground">
          {t.privacy}
        </p>
      </footer>
    </div>
  );
};

export default EntryScreen;
