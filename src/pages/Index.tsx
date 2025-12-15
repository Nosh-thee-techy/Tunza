import { useState } from "react";
import EntryScreen from "@/components/EntryScreen";
import VoiceInterface from "@/components/VoiceInterface";
import ChatInterface from "@/components/ChatInterface";
import ResourcesScreen from "@/components/ResourcesScreen";
import ConcernedObserverFlow from "@/components/ConcernedObserverFlow";
import QuickExitButton from "@/components/QuickExitButton";
import { Language } from "@/components/LanguageSelector";

type Screen = "entry" | "voice" | "chat" | "resources" | "observer";

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>("entry");
  const [language, setLanguage] = useState<Language>("en");
  const [chatContext, setChatContext] = useState<"general" | "observer">("general");

  const handleSelectOption = (option: string) => {
    switch (option) {
      case "voice":
        setCurrentScreen("voice");
        break;
      case "chat":
        setChatContext("general");
        setCurrentScreen("chat");
        break;
      case "noticed":
        setCurrentScreen("observer");
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

  const handleSwitchToChat = () => {
    setChatContext("general");
    setCurrentScreen("chat");
  };

  const handleObserverToChat = () => {
    setChatContext("observer");
    setCurrentScreen("chat");
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
        <VoiceInterface
          language={language}
          onLanguageChange={setLanguage}
          onBack={handleBack}
          onSwitchToChat={handleSwitchToChat}
        />
      )}

      {currentScreen === "chat" && (
        <ChatInterface
          language={language}
          onBack={handleBack}
          context={chatContext}
        />
      )}

      {currentScreen === "resources" && (
        <ResourcesScreen language={language} onBack={handleBack} />
      )}

      {currentScreen === "observer" && (
        <ConcernedObserverFlow
          language={language}
          onBack={handleBack}
          onGoToChat={handleObserverToChat}
          onGoToResources={() => setCurrentScreen("resources")}
        />
      )}
    </>
  );
};

export default Index;
