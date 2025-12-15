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
    greeting: "Karibu",
    subtitle: "You're in a safe space. How would you like to continue?",
    options: {
      noticed: {
        title: "I noticed something concerning",
        description: "Something doesn't feel right",
      },
      voice: {
        title: "I want to talk",
        description: "Have a voice conversation",
      },
      chat: {
        title: "I want to chat",
        description: "Text with someone who understands",
      },
      info: {
        title: "I just need information",
        description: "Learn about support and resources",
      },
    },
  },
  sw: {
    greeting: "Karibu",
    subtitle: "Uko mahali salama. Ungependa kuendelea vipi?",
    options: {
      noticed: {
        title: "Nimeona jambo la kusumbua",
        description: "Kuna kitu hakiko sawa",
      },
      voice: {
        title: "Nataka kuongea",
        description: "Mazungumzo ya sauti",
      },
      chat: {
        title: "Nataka kuchat",
        description: "Andika na mtu anayeelewa",
      },
      info: {
        title: "Nahitaji habari tu",
        description: "Jifunze kuhusu msaada na rasilimali",
      },
    },
  },
  sheng: {
    greeting: "Niaje",
    subtitle: "Uko safe hapa. Unataka tuendelee aje?",
    options: {
      noticed: {
        title: "Nimenotice kitu weird",
        description: "Kuna kitu haiko poa",
      },
      voice: {
        title: "Nataka tuongee",
        description: "Voice conversation, moja kwa moja",
      },
      chat: {
        title: "Nataka tuchat",
        description: "Text na mtu anakuelewa",
      },
      info: {
        title: "Nataka info tu",
        description: "Pata habari kuhusu msaada",
      },
    },
  },
};

const icons = {
  noticed: Eye,
  voice: Phone,
  chat: MessageCircle,
  info: Info,
};

const EntryScreen = ({ language, onLanguageChange, onSelectOption }: EntryScreenProps) => {
  const t = content[language];

  const options: EntryOption[] = ["noticed", "voice", "chat", "info"];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-4">
        <div className="w-10" /> {/* Spacer for balance */}
        <LanguageSelector
          currentLanguage={language}
          onLanguageChange={onLanguageChange}
        />
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col justify-center px-6 pb-8 max-w-lg mx-auto w-full">
        {/* Greeting */}
        <div className="text-center mb-10 animate-fade-in-up">
          <h1 className="text-4xl font-semibold text-foreground mb-3">
            {t.greeting}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed text-balance">
            {t.subtitle}
          </p>
        </div>

        {/* Entry options */}
        <div className="space-y-4">
          {options.map((option, index) => {
            const Icon = icons[option];
            const optionContent = t.options[option];
            
            return (
              <Button
                key={option}
                variant="entry"
                className="w-full animate-fade-in-up"
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
                onClick={() => onSelectOption(option)}
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="w-12 h-12 rounded-full bg-tunza-sage-light flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
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
          {language === "en" && "Your privacy is protected. No login required."}
          {language === "sw" && "Faragha yako inalindwa. Hakuna usajili unaohitajika."}
          {language === "sheng" && "Privacy yako iko safe. Hakuna login needed."}
        </p>
      </footer>
    </div>
  );
};

export default EntryScreen;
