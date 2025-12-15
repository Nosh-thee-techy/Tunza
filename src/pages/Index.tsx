import { useState } from "react";
import EntryScreen from "@/components/EntryScreen";
import VoiceInterface from "@/components/VoiceInterface";
import ChatInterface from "@/components/ChatInterface";
import ResourcesScreen from "@/components/ResourcesScreen";
import QuickExitButton from "@/components/QuickExitButton";
import { Language } from "@/components/LanguageSelector";

type Screen = "entry" | "voice" | "chat" | "resources" | "noticed";

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>("entry");
  const [language, setLanguage] = useState<Language>("en");

  const handleSelectOption = (option: string) => {
    switch (option) {
      case "voice":
        setCurrentScreen("voice");
        break;
      case "chat":
      case "noticed":
        setCurrentScreen("chat");
        break;
      case "info":
        setCurrentScreen("resources");
        break;
      default:
        setCurrentScreen("entry");
    }
  };

  const handleBack = () => {
    setCurrentScreen("entry");
  };

  return (
    <>
      {/* Quick exit button - always visible */}
      <QuickExitButton />

      {/* Screen router */}
      {currentScreen === "entry" && (
        <EntryScreen
          language={language}
          onLanguageChange={setLanguage}
          onSelectOption={handleSelectOption}
        />
      )}

      {currentScreen === "voice" && (
        <VoiceInterface language={language} onBack={handleBack} />
      )}

      {currentScreen === "chat" && (
        <ChatInterface language={language} onBack={handleBack} />
      )}

      {currentScreen === "resources" && (
        <ResourcesScreen language={language} onBack={handleBack} />
      )}
    </>
  );
};

export default Index;
