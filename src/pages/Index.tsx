import { useState } from "react";
import EntryScreen from "@/components/EntryScreen";
import VoiceInterface from "@/components/VoiceInterface";
import ChatInterface from "@/components/ChatInterface";
import ResourcesScreen from "@/components/ResourcesScreen";
import ConcernedObserverFlow from "@/components/ConcernedObserverFlow";
import ReturnFlow from "@/components/ReturnFlow";
import QuickExitButton from "@/components/QuickExitButton";
import { InstallPrompt } from "@/components/InstallPrompt";
import { Language } from "@/components/LanguageSelector";

type Screen = "entry" | "voice" | "chat" | "resources" | "observer" | "return";

interface LoadedCase {
  messages: Array<{ id: string; role: "assistant" | "user"; content: string }>;
  language: Language;
  context: "general" | "observer";
}

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>("entry");
  const [language, setLanguage] = useState<Language>("en");
  const [chatContext, setChatContext] = useState<"general" | "observer">("general");
  const [loadedCase, setLoadedCase] = useState<LoadedCase | null>(null);

  const handleSelectOption = (option: string) => {
    setLoadedCase(null); // Clear any loaded case
    
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
      case "return":
        setCurrentScreen("return");
        break;
      default:
        setCurrentScreen("entry");
    }
  };

  const handleBack = () => {
    setLoadedCase(null);
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

  const handleCaseLoaded = (
    messages: Array<{ role: string; content: string }>,
    caseLanguage: string,
    context: string
  ) => {
    // Convert messages to the format expected by ChatInterface
    const formattedMessages = messages.map((m, i) => ({
      id: `loaded-${i}`,
      role: m.role as "assistant" | "user",
      content: m.content,
    }));

    setLoadedCase({
      messages: formattedMessages,
      language: caseLanguage as Language,
      context: context as "general" | "observer",
    });
    
    setLanguage(caseLanguage as Language);
    setChatContext(context as "general" | "observer");
    setCurrentScreen("chat");
  };

  return (
    <>
      {/* Quick exit button - always visible */}
      <QuickExitButton />
      
      {/* Discreet install prompt */}
      <InstallPrompt />

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
          initialMessages={loadedCase?.messages}
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

      {currentScreen === "return" && (
        <ReturnFlow
          language={language}
          onBack={handleBack}
          onCaseLoaded={handleCaseLoaded}
        />
      )}
    </>
  );
};

export default Index;
