import { useState } from "react";
import { ArrowLeft, ChevronRight, Heart, Users, AlertCircle, Phone } from "lucide-react";
import { Button } from "./ui/button";
import { Language } from "./LanguageSelector";

interface ConcernedObserverFlowProps {
  language: Language;
  onBack: () => void;
  onGoToChat: () => void;
  onGoToResources: () => void;
}

type Step = "intro" | "relationship" | "noticed" | "timing" | "guidance";

interface FlowState {
  relationship?: string;
  noticed?: string;
  timing?: string;
}

const content = {
  en: {
    header: "Someone You Care About",
    intro: {
      title: "Thank you for caring",
      message: "It takes courage to notice when something feels wrong. Let me help you understand the situation better.",
      continue: "Let's talk",
    },
    relationship: {
      question: "How do you know this person?",
      options: [
        { id: "family", label: "Family member" },
        { id: "friend", label: "Friend" },
        { id: "neighbor", label: "Neighbor" },
        { id: "colleague", label: "Colleague or classmate" },
        { id: "other", label: "Someone else" },
      ],
      skip: "I'd rather not say",
    },
    noticed: {
      question: "What have you noticed?",
      subtitle: "You don't need to share details — just what feels relevant.",
      options: [
        { id: "behavior", label: "Changes in behavior" },
        { id: "fear", label: "They seem afraid" },
        { id: "isolation", label: "Being isolated from others" },
        { id: "marks", label: "Unexplained injuries" },
        { id: "control", label: "Someone controlling them" },
        { id: "unsure", label: "I'm not sure, something just feels off" },
      ],
      skip: "I'd rather not say",
    },
    timing: {
      question: "How urgent does this feel?",
      options: [
        { id: "immediate", label: "They may be in danger right now" },
        { id: "ongoing", label: "It's been happening for a while" },
        { id: "uncertain", label: "I'm not sure yet" },
      ],
    },
    guidance: {
      immediate: {
        title: "Thank you for acting quickly",
        message: "If someone is in immediate danger, calling for help can save a life.",
        actions: [
          { label: "Call Emergency (999)", action: "call", primary: true },
          { label: "Talk to a counsellor", action: "chat" },
        ],
      },
      ongoing: {
        title: "Your concern matters",
        message: "Sometimes the best thing we can do is be a safe person for someone to talk to. Here are some ways you can help.",
        tips: [
          "Let them know you've noticed and you care",
          "Listen without judgment when they're ready",
          "Don't pressure them to leave or take action",
          "Learn about resources so you can share them",
        ],
        actions: [
          { label: "Learn about resources", action: "resources" },
          { label: "Talk to someone about this", action: "chat" },
        ],
      },
      uncertain: {
        title: "It's okay to be unsure",
        message: "Trusting your instincts is important. You don't need to have proof to care about someone.",
        tips: [
          "Keep checking in casually",
          "Be someone safe they can talk to",
          "Learn about the signs",
        ],
        actions: [
          { label: "Learn about the signs", action: "resources" },
          { label: "Talk to someone", action: "chat" },
        ],
      },
    },
  },
  sw: {
    header: "Mtu Unayemjali",
    intro: {
      title: "Asante kwa kujali",
      message: "Inahitaji ujasiri kuona wakati kitu hakiko sawa. Wacha nikuaidie kuelewa hali vizuri zaidi.",
      continue: "Tuongee",
    },
    relationship: {
      question: "Unamjuaje mtu huyu?",
      options: [
        { id: "family", label: "Mwanafamilia" },
        { id: "friend", label: "Rafiki" },
        { id: "neighbor", label: "Jirani" },
        { id: "colleague", label: "Mwenzetu kazini au shuleni" },
        { id: "other", label: "Mtu mwingine" },
      ],
      skip: "Sipendelei kusema",
    },
    noticed: {
      question: "Umeona nini?",
      subtitle: "Huhitaji kushiriki maelezo — tu kile kinachoonekana muhimu.",
      options: [
        { id: "behavior", label: "Mabadiliko ya tabia" },
        { id: "fear", label: "Anaonekana ana hofu" },
        { id: "isolation", label: "Anatengwa na wengine" },
        { id: "marks", label: "Majeraha yasiyoelezeka" },
        { id: "control", label: "Mtu anamkontrol" },
        { id: "unsure", label: "Sijui, kitu tu hakiko sawa" },
      ],
      skip: "Sipendelei kusema",
    },
    timing: {
      question: "Hali hii inaonekana ina dharura kiasi gani?",
      options: [
        { id: "immediate", label: "Anaweza kuwa hatarini sasa hivi" },
        { id: "ongoing", label: "Imekuwa ikitokea kwa muda" },
        { id: "uncertain", label: "Sijui bado" },
      ],
    },
    guidance: {
      immediate: {
        title: "Asante kwa kutenda haraka",
        message: "Ikiwa mtu yuko hatarini mara moja, kupiga simu kunaweza kuokoa maisha.",
        actions: [
          { label: "Piga Dharura (999)", action: "call", primary: true },
          { label: "Ongea na mshauri", action: "chat" },
        ],
      },
      ongoing: {
        title: "Wasiwasi wako una maana",
        message: "Wakati mwingine jambo bora tunaloweza kufanya ni kuwa mtu salama anayeweza kuongea naye. Hizi ni njia unazoweza kusaidia.",
        tips: [
          "Mwambie umemwona na unajali",
          "Sikiliza bila hukumu anapokuwa tayari",
          "Usimlazimu kuondoka au kuchukua hatua",
          "Jifunze kuhusu rasilimali ili uweze kushiriki",
        ],
        actions: [
          { label: "Jifunze kuhusu rasilimali", action: "resources" },
          { label: "Ongea na mtu kuhusu hii", action: "chat" },
        ],
      },
      uncertain: {
        title: "Ni sawa kutokuwa na uhakika",
        message: "Kuamini hisia zako ni muhimu. Huhitaji ushahidi kujali mtu.",
        tips: [
          "Endelea kuangalia kwa upole",
          "Kuwa mtu salama wanaweza kuongea naye",
          "Jifunze kuhusu ishara",
        ],
        actions: [
          { label: "Jifunze kuhusu ishara", action: "resources" },
          { label: "Ongea na mtu", action: "chat" },
        ],
      },
    },
  },
  sheng: {
    header: "Mtu Unamcare",
    intro: {
      title: "Asante kwa ku-care",
      message: "Inakuchukua courage ku-notice kitu kiko off. Wacha nikuhelp kuelewa situation vizuri.",
      continue: "Tuongee",
    },
    relationship: {
      question: "Unamjuaje huyu mtu?",
      options: [
        { id: "family", label: "Family" },
        { id: "friend", label: "Pal/Rafiki" },
        { id: "neighbor", label: "Neighbor" },
        { id: "colleague", label: "Workmate au classmate" },
        { id: "other", label: "Mtu mwingine" },
      ],
      skip: "Sitaki kusema",
    },
    noticed: {
      question: "Ume-notice nini?",
      subtitle: "Huhitaji ku-share details — tu chenye kinaonekana relevant.",
      options: [
        { id: "behavior", label: "Behavior imebadilika" },
        { id: "fear", label: "Anaonekana ana wasiwasi/fear" },
        { id: "isolation", label: "Anatengwa na watu" },
        { id: "marks", label: "Injuries hazieleweki" },
        { id: "control", label: "Mtu anamcontrol" },
        { id: "unsure", label: "Sijui, tu kitu kiko off" },
      ],
      skip: "Sitaki kusema",
    },
    timing: {
      question: "Hii situation ina urgency ngapi?",
      options: [
        { id: "immediate", label: "Anaweza kuwa danger saa hii" },
        { id: "ongoing", label: "Imekuwa ikiendelea for a while" },
        { id: "uncertain", label: "Sijui bado" },
      ],
    },
    guidance: {
      immediate: {
        title: "Asante kwa ku-act fast",
        message: "Kama mtu ako danger saa hii, ku-call help kunaweza save life.",
        actions: [
          { label: "Call Emergency (999)", action: "call", primary: true },
          { label: "Chat na counsellor", action: "chat" },
        ],
      },
      ongoing: {
        title: "Concern yako ina meaning",
        message: "Sometimes the best thing tunaweza do ni kuwa mtu safe anaweza ongea naye. Hizi ni ways unaweza help.",
        tips: [
          "Mwambie ume-notice na una-care",
          "Mskize bila ku-judge akiwa ready",
          "Usim-pressure a-leave au a-take action",
          "Learn resources ili uweze share",
        ],
        actions: [
          { label: "Learn kuhusu resources", action: "resources" },
          { label: "Ongea na mtu kuhusu hii", action: "chat" },
        ],
      },
      uncertain: {
        title: "Ni sawa ku-not be sure",
        message: "Ku-trust instincts zako ni important. Huhitaji proof ku-care about mtu.",
        tips: [
          "Endelea ku-check in casually",
          "Be someone safe wanaweza ongea naye",
          "Learn about the signs",
        ],
        actions: [
          { label: "Learn about signs", action: "resources" },
          { label: "Ongea na mtu", action: "chat" },
        ],
      },
    },
  },
};

const ConcernedObserverFlow = ({
  language,
  onBack,
  onGoToChat,
  onGoToResources,
}: ConcernedObserverFlowProps) => {
  const [step, setStep] = useState<Step>("intro");
  const [flowState, setFlowState] = useState<FlowState>({});
  const t = content[language];

  const handleAction = (action: string) => {
    switch (action) {
      case "call":
        window.location.href = "tel:999";
        break;
      case "chat":
        onGoToChat();
        break;
      case "resources":
        onGoToResources();
        break;
    }
  };

  const getGuidanceType = (): "immediate" | "ongoing" | "uncertain" => {
    return (flowState.timing as "immediate" | "ongoing" | "uncertain") || "uncertain";
  };

  const renderStep = () => {
    switch (step) {
      case "intro":
        return (
          <div className="text-center animate-fade-in-up">
            <div className="w-20 h-20 rounded-full bg-tunza-sage-light mx-auto flex items-center justify-center mb-6">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t.intro.title}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8 max-w-sm mx-auto">
              {t.intro.message}
            </p>
            <Button onClick={() => setStep("relationship")} className="gap-2">
              {t.intro.continue}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        );

      case "relationship":
        return (
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-tunza-sage-light flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-medium text-foreground">
                {t.relationship.question}
              </h2>
            </div>
            <div className="space-y-3">
              {t.relationship.options.map((option) => (
                <Button
                  key={option.id}
                  variant="entry"
                  className="w-full"
                  onClick={() => {
                    setFlowState({ ...flowState, relationship: option.id });
                    setStep("noticed");
                  }}
                >
                  {option.label}
                </Button>
              ))}
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => setStep("noticed")}
              >
                {t.relationship.skip}
              </Button>
            </div>
          </div>
        );

      case "noticed":
        return (
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-tunza-sky-light flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-tunza-sky" />
              </div>
              <h2 className="text-xl font-medium text-foreground">
                {t.noticed.question}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6 ml-[52px]">
              {t.noticed.subtitle}
            </p>
            <div className="space-y-3">
              {t.noticed.options.map((option) => (
                <Button
                  key={option.id}
                  variant="entry"
                  className="w-full"
                  onClick={() => {
                    setFlowState({ ...flowState, noticed: option.id });
                    setStep("timing");
                  }}
                >
                  {option.label}
                </Button>
              ))}
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => setStep("timing")}
              >
                {t.noticed.skip}
              </Button>
            </div>
          </div>
        );

      case "timing":
        return (
          <div className="animate-fade-in-up">
            <h2 className="text-xl font-medium text-foreground mb-6">
              {t.timing.question}
            </h2>
            <div className="space-y-3">
              {t.timing.options.map((option) => (
                <Button
                  key={option.id}
                  variant="entry"
                  className={`w-full ${
                    option.id === "immediate" ? "border-tunza-earth/40" : ""
                  }`}
                  onClick={() => {
                    setFlowState({ ...flowState, timing: option.id });
                    setStep("guidance");
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        );

      case "guidance":
        const guidanceType = getGuidanceType();
        const guidance = t.guidance[guidanceType];
        
        return (
          <div className="animate-fade-in-up">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-tunza-sage-light mx-auto flex items-center justify-center mb-4">
                {guidanceType === "immediate" ? (
                  <Phone className="h-6 w-6 text-primary" />
                ) : (
                  <Heart className="h-6 w-6 text-primary" />
                )}
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {guidance.title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {guidance.message}
              </p>
            </div>

            {/* Tips for ongoing/uncertain */}
            {"tips" in guidance && guidance.tips && (
              <div className="bg-card border border-border rounded-2xl p-5 mb-6">
                <ul className="space-y-3">
                  {guidance.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-sm text-foreground">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              {guidance.actions.map((action, index) => (
                <Button
                  key={index}
                  variant={"primary" in action && action.primary ? "default" : "outline"}
                  className="w-full"
                  onClick={() => handleAction(action.action)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (step === "intro") {
              onBack();
            } else if (step === "relationship") {
              setStep("intro");
            } else if (step === "noticed") {
              setStep("relationship");
            } else if (step === "timing") {
              setStep("noticed");
            } else if (step === "guidance") {
              setStep("timing");
            }
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        <div className="text-sm font-medium text-foreground">{t.header}</div>
        <div className="w-10" />
      </header>

      {/* Progress indicator */}
      <div className="px-6 pt-4">
        <div className="flex gap-2">
          {["intro", "relationship", "noticed", "timing", "guidance"].map(
            (s, index) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  ["intro", "relationship", "noticed", "timing", "guidance"].indexOf(
                    step
                  ) >= index
                    ? "bg-primary"
                    : "bg-border"
                }`}
              />
            )
          )}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col justify-center px-6 py-8 max-w-lg mx-auto w-full">
        {renderStep()}
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="text-xs text-muted-foreground">
          {language === "en" && "This conversation is private."}
          {language === "sw" && "Mazungumzo haya ni ya faragha."}
          {language === "sheng" && "Hii convo ni private."}
        </p>
      </footer>
    </div>
  );
};

export default ConcernedObserverFlow;
