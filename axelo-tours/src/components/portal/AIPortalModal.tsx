"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, Bot, User, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AIPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: "assistant" | "user";
  content: string;
}

export function AIPortalModal({ isOpen, onClose }: AIPortalModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Jambo! I'm Zara, your Axelo AI concierge. I'm here to help you manage your safari or find your next adventure. What's on your mind today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize session
  useEffect(() => {
    let token = localStorage.getItem("axelo_chat_session");
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem("axelo_chat_session", token);
    }
    setSessionToken(token);
  }, []);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          session_token: sessionToken,
        }),
      });

      if (!response.ok) throw new Error("Chat service unavailable");

      // Setup streaming
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);
      let accumulatedResponse = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const text = decoder.decode(value);
          accumulatedResponse += text;
          
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1].content = accumulatedResponse;
            return updated;
          });
        }
      }
    } catch (error) {
      console.error("AI Chat Error:", error);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I'm sorry, I'm having a bit of trouble connecting right now. Please try again in a moment or contact our support team directly. 🦁" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-[650px] bg-brand-dark/95 border border-white/20 rounded-[2.5rem] shadow-2xl z-[101] overflow-hidden backdrop-blur-xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Zara — AI Concierge</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Live Context Enabled</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div 
              ref={scrollRef}
              className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth"
            >
              {messages.map((m, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i}
                  className={cn(
                    "flex items-start space-x-3 max-w-[85%]",
                    m.role === 'user' ? "ml-auto flex-row-reverse space-x-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                    m.role === 'assistant' ? "bg-primary/20 border-primary/30" : "bg-accent/20 border-accent/30"
                  )}>
                    {m.role === 'assistant' ? <Bot className="w-4 h-4 text-primary" /> : <User className="w-4 h-4 text-accent" />}
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl text-sm leading-relaxed",
                    m.role === 'assistant' ? "bg-white/5 text-white/90 border border-white/10" : "bg-primary text-white shadow-lg"
                  )}>
                    {m.content}
                    {m.role === 'assistant' && m.content === "" && (
                      <Loader2 className="w-4 h-4 animate-spin opacity-50" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-6 bg-white/5 border-t border-white/10">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  disabled={isLoading}
                  placeholder="Tell me about Maasai Mara or check your itinerary..."
                  className="w-full bg-white/10 border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
                />
                <button 
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 top-2 w-10 h-10 bg-primary hover:bg-primary/90 disabled:bg-gray-600 disabled:opacity-50 rounded-xl flex items-center justify-center transition-all active:scale-95"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
