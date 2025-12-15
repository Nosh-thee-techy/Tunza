import { RotateCcw, Mic, MessageCircle, Eye, Info } from "lucide-react";
import { Button } from "./ui/button";
import LanguageSelector, { Language } from "./LanguageSelector";
import tunzaLogo from "@/assets/tunza-logo.png";

type EntryOption = "noticed" | "voice" | "chat" | "info" | "return";

interface EntryScreenProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onSelectOption: (option: EntryOption) => void;
}

const content = {
  en: {
    tagline: "This is a safe place to talk about something that doesn't feel right.",
    subtitle: "We're here to listen, support, and walk with you.",
    options: {
      voice: {
        title: "Talk now",
        description: "Have a voice conversation",
      },
      chat: {
        title: "Chat instead",
        description: "Text with someone who listens",
      },
      noticed: {
        title: "I noticed something concerning",
        description: "About someone else",
      },
      info: {
        title: "Just looking for information",
        description: "Learn about support available",
      },
    },
    quickActions: "Quick actions",
    return: "Return to a saved conversation",
    privacy: "Your privacy is protected. No login required.",
  },
  sw: {
    tagline: "Hapa ni mahali salama kuongea kuhusu jambo linaloonekana haliko sawa.",
    subtitle: "Tuko hapa kusikiliza, kusaidia, na kutembea nawe.",
    options: {
      voice: {
        title: "Ongea sasa",
        description: "Mazungumzo ya sauti",
      },
      chat: {
        title: "Chat badala yake",
        description: "Andika na mtu anayesikiliza",
      },
      noticed: {
        title: "Nimeona jambo la kusumbua",
        description: "Kuhusu mtu mwingine",
      },
      info: {
        title: "Natafuta habari tu",
        description: "Jifunze kuhusu msaada unaopatikana",
      },
    },
    quickActions: "Vitendo vya haraka",
    return: "Rudi kwenye mazungumzo yaliyohifadhiwa",
    privacy: "Faragha yako inalindwa. Hakuna usajili unaohitajika.",
  },
  sheng: {
    tagline: "Hapa ni mahali safe kuongea kuhusu kitu kinachoonekana si poa.",
    subtitle: "Tuko hapa kuskia, kusupport, na kutembea na wewe.",
    options: {
      voice: {
        title: "Ongea sasa",
        description: "Voice conversation",
      },
      chat: {
        title: "Chat badala",
        description: "Text na mtu anaskia",
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
    quickActions: "Quick actions",
    return: "Rudi kwa saved convo",
    privacy: "Privacy yako iko safe. Hakuna login needed.",
  },
};

const optionIcons = {
  voice: Mic,
  chat: MessageCircle,
  noticed: Eye,
  info: Info,
};

const optionColors = {
  voice: "bg-sage-light text-primary",
  chat: "bg-peach-light text-accent",
  noticed: "bg-copper-light text-accent",
  info: "bg-secondary text-secondary-foreground",
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
        {/* Logo and tagline */}
        <div className="text-center mb-8 animate-fade-in-up">
          <img 
            src={tunzaLogo} 
            alt="Tunza" 
            className="w-28 h-28 mx-auto mb-4 object-contain"
          />
          <p className="text-subhead text-foreground leading-relaxed text-balance max-w-sm mx-auto mb-2">
            {t.tagline}
          </p>
          <p className="text-small text-muted-foreground">
            {t.subtitle}
          </p>
        </div>

        {/* Quick Actions Label */}
        <div className="mb-3 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <span className="text-small font-medium text-muted-foreground uppercase tracking-wide">
            {t.quickActions}
          </span>
        </div>

        {/* Entry options - Quick action buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {options.slice(0, 2).map((option, index) => {
            const optionContent = t.options[option];
            const Icon = optionIcons[option];
            
            return (
              <Button
                key={option}
                variant="entry"
                className="w-full h-auto py-5 flex-col gap-2 animate-fade-in-up"
                style={{ animationDelay: `${(index + 1) * 60}ms` }}
                onClick={() => onSelectOption(option)}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${optionColors[option]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <div className="font-medium text-foreground text-sm">
                    {optionContent.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {optionContent.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>

        {/* Secondary options */}
        <div className="space-y-2">
          {options.slice(2).map((option, index) => {
            const optionContent = t.options[option];
            const Icon = optionIcons[option];
            
            return (
              <Button
                key={option}
                variant="entry"
                className="w-full animate-fade-in-up"
                style={{ animationDelay: `${(index + 3) * 60}ms` }}
                onClick={() => onSelectOption(option)}
              >
                <div className="flex items-center gap-4 w-full">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${optionColors[option]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-foreground text-sm">
                      {optionContent.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {optionContent.description}
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>

        {/* Return link */}
        <div className="mt-6 text-center animate-fade-in-up" style={{ animationDelay: "350ms" }}>
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
