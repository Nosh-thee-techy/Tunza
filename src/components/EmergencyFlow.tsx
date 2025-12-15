import { useState } from "react";
import { ArrowLeft, Phone, MessageCircle, Shield, Heart, X } from "lucide-react";
import { Button } from "./ui/button";
import { Language } from "./LanguageSelector";

interface EmergencyFlowProps {
  language: Language;
  onBack: () => void;
  onDecline: () => void;
  riskLevel: "medium" | "high";
}

const content = {
  en: {
    title: "You're not alone",
    subtitle: "We noticed this might be urgent. Here are some options if you'd like support right now.",
    declineText: "I'm okay for now",
    continueChat: "Continue talking with me",
    callHelpline: "Call a helpline",
    helplineDesc: "Speak with a trained counselor",
    textHelpline: "Text a helpline",
    textDesc: "Message if you can't talk",
    safetyTips: "Safety tips",
    safetyDesc: "Things you can do right now",
    responder: "Talk to someone now",
    responderDesc: "Connect with a live responder",
    reassurance: "Whatever you choose, we're here for you.",
    privacy: "This is your choice. No pressure.",
    emergencyNumbers: {
      title: "Emergency contacts",
      police: "Police: 999 / 112",
      genderDesk: "Gender Violence: 1195",
      childline: "Childline: 116",
    },
    helplines: [
      { name: "FIDA Kenya", number: "0800 723 253", desc: "Free legal aid & support" },
      { name: "Healthcare Assistance", number: "0800 723 253", desc: "Medical support" },
      { name: "Befrienders Kenya", number: "+254 722 178 177", desc: "Emotional support" },
    ],
    safetyTipsList: [
      "If you can, go to a room with a door that locks",
      "Keep your phone charged and nearby",
      "Think of a safe place you could go if needed",
      "Trust your instincts about what feels safe",
    ],
  },
  sw: {
    title: "Huko peke yako",
    subtitle: "Tumeona hii inaweza kuwa ya haraka. Hapa kuna chaguzi ikiwa ungependa msaada sasa hivi.",
    declineText: "Niko sawa kwa sasa",
    continueChat: "Endelea kuongea nami",
    callHelpline: "Piga simu msaada",
    helplineDesc: "Ongea na mshauri aliyefunzwa",
    textHelpline: "Tuma ujumbe kwa msaada",
    textDesc: "Ujumbe ikiwa huwezi kuongea",
    safetyTips: "Vidokezo vya usalama",
    safetyDesc: "Mambo unayoweza kufanya sasa",
    responder: "Ongea na mtu sasa",
    responderDesc: "Unganisha na mtu wa kusaidia",
    reassurance: "Chochote unachochagua, tuko hapa kwa ajili yako.",
    privacy: "Hii ni chaguo lako. Hakuna shinikizo.",
    emergencyNumbers: {
      title: "Nambari za dharura",
      police: "Polisi: 999 / 112",
      genderDesk: "Ukatili wa Kijinsia: 1195",
      childline: "Childline: 116",
    },
    helplines: [
      { name: "FIDA Kenya", number: "0800 723 253", desc: "Msaada wa kisheria bure" },
      { name: "Msaada wa Afya", number: "0800 723 253", desc: "Msaada wa kimatibabu" },
      { name: "Befrienders Kenya", number: "+254 722 178 177", desc: "Msaada wa kihisia" },
    ],
    safetyTipsList: [
      "Ikiwa unaweza, nenda kwenye chumba chenye mlango unaofunga",
      "Weka simu yako imechajiwa na karibu nawe",
      "Fikiria mahali salama unaweza kwenda ikiwa inahitajika",
      "Amini hisia zako kuhusu kile kinachoonekana salama",
    ],
  },
  sheng: {
    title: "Huko solo",
    subtitle: "Tumeona hii inaweza kuwa urgent. Hapa kuna options kama unataka support sasa.",
    declineText: "Niko sawa kwa sasa",
    continueChat: "Endelea kuongea na mi",
    callHelpline: "Piga simu helpline",
    helplineDesc: "Ongea na counselor",
    textHelpline: "Text helpline",
    textDesc: "Message kama huwezi ongea",
    safetyTips: "Safety tips",
    safetyDesc: "Vitu unaweza do sasa",
    responder: "Ongea na mtu sasa",
    responderDesc: "Connect na mtu wa kusaidia",
    reassurance: "Chochote unachochagua, tuko hapa for you.",
    privacy: "Hii ni choice yako. Hakuna pressure.",
    emergencyNumbers: {
      title: "Emergency contacts",
      police: "Polisi: 999 / 112",
      genderDesk: "Gender Violence: 1195",
      childline: "Childline: 116",
    },
    helplines: [
      { name: "FIDA Kenya", number: "0800 723 253", desc: "Free legal aid & support" },
      { name: "Healthcare Assistance", number: "0800 723 253", desc: "Medical support" },
      { name: "Befrienders Kenya", number: "+254 722 178 177", desc: "Emotional support" },
    ],
    safetyTipsList: [
      "Kama unaweza, enda room iko na door inafunga",
      "Keep simu yako charged na karibu",
      "Think of mahali safe unaweza enda kama inahitajika",
      "Trust instincts zako kuhusu chenye kinafeel safe",
    ],
  },
};

const EmergencyFlow = ({ language, onBack, onDecline, riskLevel }: EmergencyFlowProps) => {
  const [showHelplines, setShowHelplines] = useState(false);
  const [showSafetyTips, setShowSafetyTips] = useState(false);
  const [showEmergencyNumbers, setShowEmergencyNumbers] = useState(false);
  const t = content[language];

  const handleCall = (number: string) => {
    window.location.href = `tel:${number.replace(/\s/g, "")}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="w-10" />
      </header>

      {/* Main content */}
      <main className="flex-1 px-6 pb-8 max-w-lg mx-auto w-full">
        {/* Title section */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="w-16 h-16 rounded-full bg-sage-light mx-auto flex items-center justify-center mb-5">
            <Heart className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-headline font-medium text-foreground mb-3">
            {t.title}
          </h1>
          <p className="text-body text-muted-foreground leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-8">
          {/* Continue chatting */}
          <button
            onClick={onDecline}
            className="w-full bg-card border border-border rounded-2xl p-5 text-left hover:border-primary/30 hover:shadow-gentle transition-all duration-300 animate-fade-in-up"
            style={{ animationDelay: "60ms" }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-sage-light flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-medium text-foreground">{t.continueChat}</div>
                <div className="text-small text-muted-foreground mt-0.5">{t.reassurance}</div>
              </div>
            </div>
          </button>

          {/* Call helpline */}
          <button
            onClick={() => setShowHelplines(!showHelplines)}
            className="w-full bg-card border border-border rounded-2xl p-5 text-left hover:border-primary/30 hover:shadow-gentle transition-all duration-300 animate-fade-in-up"
            style={{ animationDelay: "120ms" }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-sky-light flex items-center justify-center flex-shrink-0">
                <Phone className="h-5 w-5 text-accent" />
              </div>
              <div>
                <div className="font-medium text-foreground">{t.callHelpline}</div>
                <div className="text-small text-muted-foreground mt-0.5">{t.helplineDesc}</div>
              </div>
            </div>
          </button>

          {/* Helplines expanded */}
          {showHelplines && (
            <div className="bg-secondary/50 rounded-2xl p-4 space-y-3 animate-fade-in">
              {t.helplines.map((helpline, i) => (
                <button
                  key={i}
                  onClick={() => handleCall(helpline.number)}
                  className="w-full bg-card border border-border rounded-xl p-4 text-left hover:border-primary/30 transition-all"
                >
                  <div className="font-medium text-foreground">{helpline.name}</div>
                  <div className="text-small text-primary mt-1">{helpline.number}</div>
                  <div className="text-small text-muted-foreground">{helpline.desc}</div>
                </button>
              ))}
            </div>
          )}

          {/* Safety tips */}
          <button
            onClick={() => setShowSafetyTips(!showSafetyTips)}
            className="w-full bg-card border border-border rounded-2xl p-5 text-left hover:border-primary/30 hover:shadow-gentle transition-all duration-300 animate-fade-in-up"
            style={{ animationDelay: "180ms" }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-light flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-amber" />
              </div>
              <div>
                <div className="font-medium text-foreground">{t.safetyTips}</div>
                <div className="text-small text-muted-foreground mt-0.5">{t.safetyDesc}</div>
              </div>
            </div>
          </button>

          {/* Safety tips expanded */}
          {showSafetyTips && (
            <div className="bg-secondary/50 rounded-2xl p-5 space-y-3 animate-fade-in">
              {t.safetyTipsList.map((tip, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p className="text-body text-foreground">{tip}</p>
                </div>
              ))}
            </div>
          )}

          {/* Emergency numbers (collapsed by default, only for high risk) */}
          {riskLevel === "high" && (
            <>
              <button
                onClick={() => setShowEmergencyNumbers(!showEmergencyNumbers)}
                className="w-full bg-amber-light border border-amber/20 rounded-2xl p-5 text-left hover:border-amber/40 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: "240ms" }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber/20 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-amber" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{t.emergencyNumbers.title}</div>
                    <div className="text-small text-muted-foreground mt-0.5">{t.privacy}</div>
                  </div>
                </div>
              </button>

              {showEmergencyNumbers && (
                <div className="bg-amber-light/50 rounded-2xl p-4 space-y-3 animate-fade-in">
                  <button
                    onClick={() => handleCall("999")}
                    className="w-full bg-card border border-border rounded-xl p-4 text-left hover:border-amber/30 transition-all"
                  >
                    <div className="font-medium text-foreground">{t.emergencyNumbers.police}</div>
                  </button>
                  <button
                    onClick={() => handleCall("1195")}
                    className="w-full bg-card border border-border rounded-xl p-4 text-left hover:border-amber/30 transition-all"
                  >
                    <div className="font-medium text-foreground">{t.emergencyNumbers.genderDesk}</div>
                  </button>
                  <button
                    onClick={() => handleCall("116")}
                    className="w-full bg-card border border-border rounded-xl p-4 text-left hover:border-amber/30 transition-all"
                  >
                    <div className="font-medium text-foreground">{t.emergencyNumbers.childline}</div>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Decline option */}
        <div className="text-center animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <button
            onClick={onDecline}
            className="inline-flex items-center gap-2 text-body text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
            {t.declineText}
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

export default EmergencyFlow;
