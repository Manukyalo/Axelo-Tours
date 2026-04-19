"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, 
  X, 
  Send, 
  Sparkles, 
  Loader2, 
  ChevronRight,
  Headphones,
  Bot
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/types";
import Link from "next/link";

const SUGGESTIONS = [
  "What safaris do you offer?",
  "Best safari for families?",
  "What is included in the price?"
];

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionToken, setSessionToken] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize session
  useEffect(() => {
    let token = sessionStorage.getItem("zara_session_token");
    if (!token) {
      token = crypto.randomUUID();
      sessionStorage.setItem("zara_session_token", token);
    }
    setSessionToken(token);

    // Load history from session if needed (optional, depends on requirement)
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          session_token: sessionToken,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      
      // Add empty assistant message to start streaming into it
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);
      setIsTyping(false);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          assistantText += chunk;
          
          setMessages(prev => {
            const next = [...prev];
            next[next.length - 1].content = assistantText;
            return next;
          });
        }
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Sorry, I encountered an error. Please try again or contact support! 🦁" 
      }]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  // Helper to render message content with links
  const renderMessageContent = (content: string) => {
    const parts = content.split(/(\/book\/[a-zA-Z0-9-]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith("/book/")) {
        const id = part.replace("/book/", "");
        return (
          <Link 
            key={index} 
            href={`/safaris/${id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold my-2 hover:bg-primary/90 transition-all shadow-sm"
          >
            <Sparkles className="w-3 h-3" /> Book This Safari
            <ChevronRight className="w-3 h-3" />
          </Link>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-body">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[400px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-8rem)] bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col md:w-[400px] sm:w-[100vw] sm:h-[100vh] sm:max-h-none sm:m-0 sm:fixed sm:inset-0 sm:rounded-none"
          >
            {/* Header */}
            <div className="p-6 bg-primary text-white flex items-center justify-between shadow-lg relative overflow-hidden">
               {/* Pattern Overlay */}
              <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,_rgba(255,255,255,0.2)_0%,_transparent_50%)]" />
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-primary rounded-full animate-pulse shadow-sm" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg leading-tight">Zara</h3>
                  <p className="text-xs text-white/70 flex items-center gap-1 font-medium">
                    <span className="w-1 h-1 bg-green-200 rounded-full" />
                    AI Safari Assistant
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors relative z-10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Message Thread */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-gray-50/50"
            >
              {messages.length === 0 && (
                <div className="space-y-6 pt-4 text-center">
                   <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-primary" />
                   </div>
                   <div>
                    <p className="text-gray-900 font-bold text-xl px-4">Jambo! I'm Zara.</p>
                    <p className="text-gray-500 text-sm mt-2 px-8 leading-relaxed">
                      Your personal safari concierge. Experience the untamed beauty of East Africa. How can I assist you today?
                    </p>
                   </div>
                   <div className="flex flex-col gap-2 px-4 pt-4">
                    {SUGGESTIONS.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(s)}
                        className="w-full p-4 text-left text-sm bg-white border border-gray-100 rounded-2xl flex items-center justify-between hover:border-primary/30 hover:bg-primary/5 transition-all group shadow-sm"
                      >
                        <span className="font-medium text-gray-700 group-hover:text-primary">{s}</span>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-transform group-hover:translate-x-1" />
                      </button>
                    ))}
                   </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex w-full mb-4",
                    m.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[85%] p-4 text-sm shadow-sm",
                    m.role === "user" 
                      ? "bg-primary text-white rounded-2xl rounded-tr-none" 
                      : "bg-white text-gray-800 rounded-2xl rounded-tl-none border border-gray-100"
                  )}>
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {renderMessageContent(m.content)}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-white border-t border-gray-100">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(input);
                }}
                className="relative flex items-center"
              >
                <input 
                  autoFocus
                  placeholder="Ask Zara something..."
                  className="w-full bg-gray-100 border-none rounded-2xl pl-5 pr-14 py-3.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 p-2.5 bg-primary text-white rounded-xl disabled:opacity-30 transition-all hover:bg-primary/90 shadow-md active:scale-95"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </form>
              <p className="text-[10px] text-center text-gray-400 mt-3 font-medium">
                Zara uses AI to provide travel insights.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 overflow-hidden",
          isOpen ? "bg-white text-gray-800 rotate-90" : "bg-primary text-white"
        )}
      >
        {isOpen ? <X className="w-8 h-8" /> : (
          <>
            <Bot className="w-8 h-8 relative z-10" />
            {/* Glow effect */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_rgba(255,255,255,0.4)_0%,_transparent_70%)] animate-pulse" />
          </>
        )}
      </motion.button>
    </div>
  );
}
