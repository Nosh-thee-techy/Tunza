import { ArrowLeft, Phone, MapPin, Shield, Heart } from "lucide-react";
import { Button } from "./ui/button";
import { Language } from "./LanguageSelector";

interface ResourcesScreenProps {
  language: Language;
  onBack: () => void;
}

const content = {
  en: {
    title: "Support & Resources",
    subtitle: "Help is available. You're not alone.",
    emergency: {
      title: "Emergency",
      description: "If you're in immediate danger",
      action: "Call 999",
    },
    helplines: {
      title: "Helplines",
      items: [
        { name: "Gender Violence Recovery Centre", number: "0800 720 990" },
        { name: "FIDA Kenya", number: "0800 720 501" },
        { name: "Childline Kenya", number: "116" },
      ],
    },
    safety: {
      title: "Safety Planning",
      description: "Tips to stay safe in difficult situations",
    },
    rights: {
      title: "Know Your Rights",
      description: "Understanding your legal protections",
    },
  },
  sw: {
    title: "Msaada & Rasilimali",
    subtitle: "Msaada unapatikana. Huko peke yako.",
    emergency: {
      title: "Dharura",
      description: "Ikiwa uko hatarini mara moja",
      action: "Piga 999",
    },
    helplines: {
      title: "Simu za Msaada",
      items: [
        { name: "Gender Violence Recovery Centre", number: "0800 720 990" },
        { name: "FIDA Kenya", number: "0800 720 501" },
        { name: "Childline Kenya", number: "116" },
      ],
    },
    safety: {
      title: "Mpango wa Usalama",
      description: "Vidokezo vya kubaki salama katika hali ngumu",
    },
    rights: {
      title: "Jua Haki Zako",
      description: "Kuelewa ulinzi wako wa kisheria",
    },
  },
  sheng: {
    title: "Msaada & Resources",
    subtitle: "Help ipo. Huko solo.",
    emergency: {
      title: "Emergency",
      description: "Kama uko danger saa hii",
      action: "Call 999",
    },
    helplines: {
      title: "Helplines",
      items: [
        { name: "Gender Violence Recovery Centre", number: "0800 720 990" },
        { name: "FIDA Kenya", number: "0800 720 501" },
        { name: "Childline Kenya", number: "116" },
      ],
    },
    safety: {
      title: "Safety Plan",
      description: "Tips za kustay safe kwa situations ngumu",
    },
    rights: {
      title: "Jua Rights Zako",
      description: "Elewa ulinzi wako wa kisheria",
    },
  },
};

const ResourcesScreen = ({ language, onBack }: ResourcesScreenProps) => {
  const t = content[language];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        <div className="text-sm font-medium text-foreground">{t.title}</div>
        <div className="w-10" />
      </header>

      <main className="p-6 max-w-lg mx-auto space-y-6">
        {/* Subtitle */}
        <p className="text-center text-muted-foreground animate-fade-in">
          {t.subtitle}
        </p>

        {/* Emergency card */}
        <div
          className="bg-tunza-earth-light border border-tunza-earth/30 rounded-2xl p-5 animate-fade-in-up"
          style={{ animationDelay: "100ms" }}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-tunza-earth/20 flex items-center justify-center flex-shrink-0">
              <Phone className="h-5 w-5 text-tunza-earth" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{t.emergency.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t.emergency.description}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-tunza-earth/40 text-tunza-earth hover:bg-tunza-earth/10"
                onClick={() => window.location.href = "tel:999"}
              >
                {t.emergency.action}
              </Button>
            </div>
          </div>
        </div>

        {/* Helplines */}
        <div
          className="bg-card border border-border rounded-2xl p-5 animate-fade-in-up"
          style={{ animationDelay: "200ms" }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-tunza-sage-light flex items-center justify-center">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">{t.helplines.title}</h3>
          </div>
          <div className="space-y-3">
            {t.helplines.items.map((item, index) => (
              <a
                key={index}
                href={`tel:${item.number.replace(/\s/g, "")}`}
                className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <span className="text-sm text-foreground">{item.name}</span>
                <span className="text-sm font-medium text-primary">{item.number}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Safety & Rights */}
        <div className="grid gap-4">
          <button
            className="bg-card border border-border rounded-2xl p-5 text-left hover:border-primary/40 transition-colors animate-fade-in-up"
            style={{ animationDelay: "300ms" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-tunza-sky-light flex items-center justify-center">
                <Shield className="h-4 w-4 text-tunza-sky" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">{t.safety.title}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t.safety.description}
                </p>
              </div>
            </div>
          </button>

          <button
            className="bg-card border border-border rounded-2xl p-5 text-left hover:border-primary/40 transition-colors animate-fade-in-up"
            style={{ animationDelay: "400ms" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-tunza-sage-light flex items-center justify-center">
                <Heart className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">{t.rights.title}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t.rights.description}
                </p>
              </div>
            </div>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="text-xs text-muted-foreground">
          {language === "en" && "All calls are confidential."}
          {language === "sw" && "Simu zote ni za siri."}
          {language === "sheng" && "Calls zote ni confidential."}
        </p>
      </footer>
    </div>
  );
};

export default ResourcesScreen;
