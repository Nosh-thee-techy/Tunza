import { useState } from "react";
import { Globe } from "lucide-react";
import { Button } from "./ui/button";

export type Language = "en" | "sw" | "sheng";

interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

const languageLabels: Record<Language, string> = {
  en: "English",
  sw: "Kiswahili",
  sheng: "Sheng",
};

const LanguageSelector = ({ currentLanguage, onLanguageChange }: LanguageSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const languages: Language[] = ["en", "sw", "sheng"];

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <Globe className="h-4 w-4" />
        <span>{languageLabels[currentLanguage]}</span>
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute top-full right-0 mt-2 bg-card border border-border rounded-xl shadow-card z-50 overflow-hidden min-w-[140px] animate-fade-in">
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  onLanguageChange(lang);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-secondary ${
                  currentLanguage === lang
                    ? "bg-tunza-sage-light text-primary font-medium"
                    : "text-foreground"
                }`}
              >
                {languageLabels[lang]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;
