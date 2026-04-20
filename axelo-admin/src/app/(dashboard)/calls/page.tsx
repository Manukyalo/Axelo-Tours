"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PhoneCall, 
  Clock, 
  BarChart3, 
  TrendingUp, 
  X, 
  MessageSquare, 
  Search, 
  Calendar,
  Zap,
  CheckCircle2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface CallLog {
  id: string;
  caller_phone: string;
  caller_name: string;
  duration_seconds: number;
  transcript: {
    raw: string;
    summary?: string;
  };
  summary: string;
  booking_intent_score: number;
  interested_package: string;
  sms_sent: boolean;
  created_at: string;
}

export default function CallsDashboard() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);
  const [filterScore, setFilterScore] = useState<number>(0);
  const supabase = createClient();

  useEffect(() => {
    fetchCallLogs();
  }, []);

  async function fetchCallLogs() {
    setLoading(true);
    const { data: callLogs, error } = await supabase
      .from("call_logs")
      .select("*")
      .order("created_at", { ascending: false });
      
    if (!error && callLogs) {
      setLogs(callLogs);
    }
    setLoading(false);
  }

  // Derived Stats
  const todayCalls = logs.filter(
    (l) => new Date(l.created_at).toDateString() === new Date().toDateString()
  ).length;
  const avgIntent = logs.length
    ? Math.round(
        logs.reduce((acc, l) => acc + (l.booking_intent_score || 0), 0) / logs.length
      )
    : 0;
  const leadsGenerated = logs.filter((l) => l.sms_sent).length;

  const filteredLogs = logs.filter((l) => (l.booking_intent_score || 0) >= filterScore);

  const getIntentBadge = (score: number) => {
    if (score >= 8) return "bg-green-500/10 text-green-500 border-green-500/20";
    if (score >= 5) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    return "bg-red-500/10 text-red-500 border-red-500/20";
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining.toString().padStart(2, "0")}`;
  };

  return (
    <div className="p-8 pb-32 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tighter">
            <span className="w-2 h-8 bg-indigo-600 rounded-full hidden md:block" />
            Voice Intelligence Manifest
          </h1>
          <p className="text-gray-500 mt-2 font-bold italic">
            AI-driven reception audit powered by Zara Agent. Review neural transcripts and intent scoring.
          </p>
        </div>
        <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Agent Status</span>
               <span className="text-sm font-black text-emerald-600 flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> 
                 Zara: Active Sync
               </span>
            </div>
            <button onClick={fetchCallLogs} className="w-12 h-12 flex items-center justify-center rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 transition-all shadow-sm">
                <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { label: "Transmission Volume", value: String(todayCalls), icon: PhoneCall, color: "indigo", sub: "Daily Hits", trend: "Normal Load" },
          { label: "Booking Intent Score", value: `${avgIntent}/10`, icon: TrendingUp, color: "amber", sub: "Neural Accuracy", trend: "High Lead Potential" },
          { label: "Dispatch Velocity", value: String(leadsGenerated), icon: Zap, color: "emerald", sub: "Automated Follow-ups", trend: "SMS Pipeline Active" },
        ].map(({ label, value, icon: Icon, color, sub, trend }) => (
          <div key={label} className="group bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-100 transition-all hover:-translate-y-1">
             <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-${color}-50 flex items-center justify-center text-${color}-600 group-hover:scale-110 transition-all shadow-sm`}>
                   <Icon className="w-6 h-6" />
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
                   <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full bg-${color}-50 text-${color}-600`}>
                      {trend}
                   </span>
                </div>
             </div>
             <p className="text-3xl font-black text-gray-900 tracking-tighter">
                {value}
             </p>
             <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden mb-12">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Communication Queue</h2>
              <h3 className="text-xl font-black text-gray-900 tracking-tighter">Transmission Registry</h3>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex bg-white p-1 rounded-xl border border-gray-200">
                <button onClick={() => setFilterScore(0)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterScore === 0 ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>All Signals</button>
                <button onClick={() => setFilterScore(5)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterScore === 5 ? 'bg-amber-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>Qualified</button>
                <button onClick={() => setFilterScore(8)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterScore === 8 ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>High Velocity</button>
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-white text-[10px] uppercase text-gray-400 font-black tracking-widest border-b border-gray-100">
              <tr>
                {["Neural Timestamp", "Caller Identity", "Duration", "Intent Match", "Interest Node", "Automated Dispatch"].map(h => (
                  <th key={h} className="px-8 py-4 font-bold tracking-widest uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading call intelligence...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No calls found matching criteria.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr 
                    key={log.id} 
                    onClick={() => setSelectedCall(log)}
                    className="group hover:bg-gray-50/50 transition-all cursor-pointer"
                  >
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-gray-900 text-[11px] tracking-tighter uppercase">{new Date(log.created_at).toLocaleDateString()}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-gray-900 text-[13px] tracking-tighter group-hover:text-indigo-600 transition-colors uppercase">{log.caller_name || "Unknown Identity"}</span>
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">{log.caller_phone}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className="flex items-center gap-1.5 font-bold text-gray-500 text-[11px] uppercase tracking-tight">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDuration(log.duration_seconds)}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${
                        log.booking_intent_score >= 8 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        log.booking_intent_score >= 5 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          log.booking_intent_score >= 8 ? 'bg-emerald-500' :
                          log.booking_intent_score >= 5 ? 'bg-amber-500' :
                          'bg-red-500'
                        }`} />
                        Intent: {log.booking_intent_score}/10
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[11px] font-black text-gray-800 uppercase tracking-tighter">
                        {log.interested_package || <span className="text-gray-300">Generic Query</span>}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      {log.sms_sent ? (
                        <div className="flex items-center gap-2 text-emerald-600">
                           <CheckCircle2 className="w-5 h-5 stroke-[3px]" />
                           <span className="text-[9px] font-black uppercase tracking-[0.1em]">Dispatch Success</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-300">
                           <div className="w-2 h-2 rounded-full bg-gray-200" />
                           <span className="text-[9px] font-black uppercase tracking-[0.1em]">No Action Taken</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transcript Slideover */}
      <AnimatePresence>
        {selectedCall && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCall(null)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: "100%" }} 
              animate={{ x: 0 }} 
              exit={{ x: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed top-0 right-0 h-full w-[500px] bg-white shadow-2xl z-50 border-l border-gray-100 flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedCall.caller_name}</h2>
                  <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                    {selectedCall.caller_phone} • {formatDuration(selectedCall.duration_seconds)}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedCall(null)}
                  className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 border-b border-gray-100 bg-white">
                 <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">AI Evaluation</h3>
                 <div className="flex gap-3 mb-4">
                    <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="text-xs text-gray-500 mb-1">Booking Intent</div>
                        <div className="font-bold text-lg">{selectedCall.booking_intent_score}/10</div>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="text-xs text-gray-500 mb-1">Follow-up Status</div>
                        <div className="font-bold text-sm truncate flex items-center gap-1.5">
                            {selectedCall.sms_sent ? <><CheckCircle2 className="w-4 h-4 text-green-500"/> SMS Sent</> : "No Action Done"}
                        </div>
                    </div>
                 </div>
                 <div className="text-sm text-gray-700 bg-primary/5 p-4 rounded-xl border border-primary/10">
                    <span className="font-semibold text-primary block mb-1">Summary:</span>
                    {selectedCall.summary || "No summary generated."}
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4 sticky top-0 bg-white/80 p-2 backdrop-blur-md rounded-lg">Raw Transcript</h3>
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed space-y-4">
                  {selectedCall.transcript?.raw ? (
                    selectedCall.transcript.raw.split("Zara:").map((part, i) => {
                      if (i === 0) return part; // Initial user stuff if any
                      const splitAgain = part.split("User:");
                      return (
                        <div key={i} className="space-y-4">
                           <div className="bg-primary/5 border border-primary/10 p-3 rounded-tr-2xl rounded-bl-2xl rounded-br-2xl max-w-[85%]">
                              <span className="font-semibold text-primary block text-xs mb-1">Zara</span>
                              {splitAgain[0].trim()}
                           </div>
                           {splitAgain[1] && (
                               <div className="ml-auto bg-white border border-gray-200 p-3 rounded-tl-2xl rounded-br-2xl rounded-bl-2xl max-w-[85%] shadow-sm">
                                  <span className="font-semibold text-gray-800 block text-xs mb-1">Client</span>
                                  {splitAgain[1].trim()}
                               </div>
                           )}
                        </div>
                      )
                    })
                  ) : (
                    <span className="text-gray-400 italic">No transcript recorded for this call session.</span>
                  )}
                </div>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
