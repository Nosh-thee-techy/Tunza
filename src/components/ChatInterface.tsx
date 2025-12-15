import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "./ui/button";
import { Language } from "./LanguageSelector";

interface ChatInterfaceProps {
  language: Language;
  onBack: () => void;
}

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
}

const initialMessages: Record<Language, Message[]> = {
  en: [
    {
      id: "1",
      role: "assistant",
      content: "Hello. I'm here to listen. Take your time — there's no rush.",
    },
    {
      id: "2",
      role: "assistant",
      content: "How are you feeling right now?",
    },
  ],
  sw: [
    {
      id: "1",
      role: "assistant",
      content: "Habari. Niko hapa kusikiliza. Chukua wakati wako — hakuna haraka.",
    },
    {
      id: "2",
      role: "assistant",
      content: "Unajisikiaje sasa hivi?",
    },
  ],
  sheng: [
    {
      id: "1",
      role: "assistant",
      content: "Niaje. Niko hapa kuskia. Chukua time yako — hakuna pressure.",
    },
    {
      id: "2",
      role: "assistant",
      content: "Unajiskia aje saa hii?",
    },
  ],
};

const quickReplies: Record<Language, string[]> = {
  en: ["I'm not sure", "I'd rather not answer", "Let's talk later", "I feel scared"],
  sw: ["Sijui", "Sipendelei kujibu", "Tuongee baadaye", "Naogopa"],
  sheng: ["Sijui", "Sitaki kujibu", "Tuongee later", "Naogopa kidogo"],
};

const ChatInterface = ({ language, onBack }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages[language]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Reset messages when language changes
    setMessages(initialMessages[language]);
  }, [language]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses: Record<Language, string[]> = {
        en: [
          "Thank you for sharing that with me.",
          "I hear you. That sounds difficult.",
          "You're doing the right thing by reaching out.",
        ],
        sw: [
          "Asante kwa kunishirikisha hilo.",
          "Nakusikia. Inaonekana ngumu.",
          "Unafanya jambo sahihi kwa kuwasiliana.",
        ],
        sheng: [
          "Asante kwa kunishirikisha.",
          "Nakuskia. Inaonekana tough.",
          "Umefanya poa ku-reach out.",
        ],
      };

      const randomResponse =
        responses[language][Math.floor(Math.random() * responses[language].length)];

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: randomResponse,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
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
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-card border border-border rounded-bl-md"
              }`}
            >
              <p className="text-[15px] leading-relaxed">{message.content}</p>
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

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-border bg-card/80 backdrop-blur-sm"
      >
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
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
            disabled={!inputValue.trim()}
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
