"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { 
  MessageSquare, 
  ChevronRight, 
  Clock, 
  User, 
  Bot,
  Search,
  Filter,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/types";

interface ChatSession {
  session_token: string;
  messages: ChatMessage[];
  message_count: number;
  last_message: string;
  created_at: string;
  updated_at: string;
}

export default function AdminChatsPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function fetchSessions() {
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) console.error("Error fetching sessions:", error);
      else setSessions((data as ChatSession[]) || []);
      setLoading(false);
    }
    fetchSessions();
  }, [supabase]);

  const filteredSessions = sessions.filter(s => 
    s.session_token.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.last_message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sessions List */}
      <div className={cn(
        "flex-1 flex flex-col h-screen transition-all duration-300",
        selectedSession ? "mr-[450px]" : ""
      )}>
        <header className="bg-white border-b border-gray-200 p-6 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Zara Chat Sessions</h1>
            <p className="text-sm text-gray-500 mt-1">Monitor real-time conversations with the AI Assistant.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                placeholder="Search sessions..." 
                className="pl-10 pr-4 py-2 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-gray-400 text-sm font-medium">Loading chat history...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-20 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-900 font-bold text-lg">No sessions found</p>
              <p className="text-gray-500 text-sm mt-1">Sessions will appear here once users start chatting with Zara.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredSessions.map((session) => (
                <button
                  key={session.session_token}
                  onClick={() => setSelectedSession(session)}
                  className={cn(
                    "w-full text-left bg-white p-5 rounded-3xl border transition-all hover:shadow-md group",
                    selectedSession?.session_token === session.session_token 
                      ? "border-primary ring-1 ring-primary" 
                      : "border-gray-200"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/5 rounded-2xl flex items-center justify-center text-primary">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Session Token</p>
                        <p className="text-sm font-mono font-bold text-gray-900 truncate max-w-[200px]">
                          {session.session_token}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Messages</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold">
                          {session.message_count}
                        </span>
                      </div>
                      <ChevronRight className={cn(
                        "w-5 h-5 text-gray-300 transition-transform group-hover:translate-x-1",
                        selectedSession?.session_token === session.session_token && "text-primary translate-x-1"
                      )} />
                    </div>
                  </div>
                  <div className="pl-[52px]">
                    <p className="text-sm text-gray-600 line-clamp-1 italic mb-3">
                      "{session.last_message || "No messages yet..."}"
                    </p>
                    <div className="flex items-center gap-3 py-2 border-t border-gray-50 mt-2">
                       <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                          <Clock className="w-3 h-3" />
                          Last Activity: {format(new Date(session.updated_at), "MMM d, h:mm a")}
                       </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Replay Side Panel */}
      <aside className={cn(
        "fixed top-0 right-0 w-[450px] h-screen bg-white border-l border-gray-200 shadow-2xl z-20 flex flex-col transition-transform duration-300 transform",
        selectedSession ? "translate-x-0" : "translate-x-full"
      )}>
        {selectedSession && (
          <>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedSession(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors md:hidden"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Conversation Replay</h2>
                  <p className="text-[10px] font-mono text-gray-400">{selectedSession.session_token}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedSession(null)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
              {selectedSession.messages.map((m, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex flex-col gap-2",
                    m.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1 px-1">
                    {m.role === "assistant" ? (
                      <>
                        <div className="w-5 h-5 bg-primary rounded-md flex items-center justify-center">
                          <Bot className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Zara API</span>
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Visitor</span>
                        <div className="w-5 h-5 bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
                          <User className="w-3 h-3" />
                        </div>
                      </>
                    )}
                  </div>
                  <div className={cn(
                    "max-w-[90%] p-4 text-sm shadow-sm",
                    m.role === "user" 
                      ? "bg-primary text-white rounded-2xl rounded-tr-none" 
                      : "bg-white text-gray-800 rounded-2xl rounded-tl-none border border-gray-100"
                  )}>
                    <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                <Clock className="w-4 h-4" />
                Session started on {format(new Date(selectedSession.created_at), "PPPP")} at {format(new Date(selectedSession.created_at), "p")}
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
