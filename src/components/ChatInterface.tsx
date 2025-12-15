import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, Send, Mic, MicOff } from "lucide-react";
import { Button } from "./ui/button";
import { Language } from "./LanguageSelector";

interface ChatInterfaceProps {
  language: Language;
  onBack: () => void;
  context?: "general" | "observer";
  initialPrompt?: string;
}

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tunza-chat`;

const initialMessages: Record<Language, Message[]> = {
  en: [
    {
      id: "welcome",
      role: "assistant",
      content: "Hi. I'm here to listen. You can share as much or as little as you want. There's no rush.",
    },
  ],
  sw: [
    {
      id: "welcome",
      role: "assistant",
      content: "Habari. Niko hapa kusikiliza. Unaweza kushiriki mengi au kidogo unavyotaka. Hakuna haraka.",
    },
  ],
  sheng: [
    {
      id: "welcome",
      role: "assistant",
      content: "Niaje. Niko hapa kuskia. Unaweza share mengi au kidogo unavyotaka. Hakuna pressure.",
    },
  ],
};

const quickReplies: Record<Language, string[]> = {
  en: ["Something feels off", "I'm worried about someone", "I don't know where to start", "I'd rather not answer"],
  sw: ["Kuna kitu hakiko sawa", "Nina wasiwasi kuhusu mtu", "Sijui kuanzia wapi", "Sipendelei kujibu"],
  sheng: ["Kuna kitu kiko off", "Niko worried kuhusu mtu", "Sijui kuanzia wapi", "Sitaki kujibu"],
};

const ChatInterface = ({ language, onBack, context = "general", initialPrompt }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages[language]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    // Reset messages when language changes
    setMessages(initialMessages[language]);
    setShowQuickReplies(true);
  }, [language]);

  useEffect(() => {
    // If there's an initial prompt, send it
    if (initialPrompt) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  const streamChat = async (userMessages: Message[]) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: userMessages.map((m) => ({ role: m.role, content: m.content })),
        language,
        context,
      }),
    });

    if (!resp.ok) {
      const error = await resp.json();
      throw new Error(error.error || "Failed to get response");
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";

    const assistantId = Date.now().toString();
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: assistantContent } : m
              )
            );
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");
    setIsTyping(true);
    setShowQuickReplies(false);

    try {
      await streamChat(newMessages.filter((m) => m.id !== "welcome"));
    } catch (error) {
      console.error("Chat error:", error);
      // Show error message
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            language === "en"
              ? "I'm sorry, I had trouble responding. Please try again."
              : language === "sw"
              ? "Samahani, nilikuwa na shida kujibu. Tafadhali jaribu tena."
              : "Pole, nilikuwa na shida ku-respond. Jaribu tena.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickReply = (reply: string) => {
    handleSend(reply);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(inputValue);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        <div className="text-sm font-medium text-foreground">
          {language === "en" && "Safe Chat"}
          {language === "sw" && "Chat Salama"}
          {language === "sheng" && "Chat Safe"}
        </div>
        <div className="w-10" />
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            } animate-fade-in-up`}
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-card border border-border rounded-bl-md"
              }`}
            >
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Quick replies */}
      {showQuickReplies && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {quickReplies[language].map((reply) => (
              <Button
                key={reply}
                variant="quick"
                size="sm"
                onClick={() => handleQuickReply(reply)}
              >
                {reply}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-border bg-card/80 backdrop-blur-sm"
      >
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(inputValue);
                }
              }}
              placeholder={
                language === "en"
                  ? "Type your message..."
                  : language === "sw"
                  ? "Andika ujumbe wako..."
                  : "Andika message yako..."
              }
              rows={1}
              className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-[15px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              style={{ minHeight: "48px", maxHeight: "120px" }}
            />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim() || isTyping}
            className="rounded-xl flex-shrink-0"
          >
            <Send className="h-5 w-5" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
