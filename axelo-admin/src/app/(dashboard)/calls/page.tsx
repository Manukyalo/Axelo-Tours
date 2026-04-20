"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PhoneCall, Clock, BarChart3, TrendingUp, X, 
  MessageSquare, Search, Calendar, Zap, CheckCircle2,
  RefreshCw, Activity, ArrowUpRight, ShieldCheck,
  Signal, Headphones, Radio, Mic2, AlertTriangle,
  ChevronRight, Filter, Sparkles
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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

  const fetchCallLogs = useCallback(async () => {
    setLoading(true);
    const { data: callLogs, error } = await supabase
      .from("call_logs")
      .select("*")
      .order("created_at", { ascending: false });
      
    if (!error && callLogs) {
      setLogs(callLogs || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchCallLogs();
  }, [fetchCallLogs]);

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

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining.toString().padStart(2, "0")}`;
  };

  return (
    <div className="p-8 space-y-10 bg-[#fafafa] min-h-screen">
      {/* Elite Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <Signal className="w-3 h-3 animate-pulse" />
              Live Inbound Signal Monitor
            </div>
          </div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter leading-none mb-4">
            Voice Intelligence <span className="text-indigo-600 italic">Manifest</span>
          </h1>
          <p className="text-gray-500 font-medium max-w-xl text-lg leading-relaxed">
            Neural audit of secure communication lines. Zara AI evaluates intent, extracts logistics, and schedules follow-up payloads.
          </p>
        </div>

        <div className="flex items-center gap-4">
            <div className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4">
               <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Agent Status</span>
                  <span className="text-sm font-black text-emerald-600 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> 
                    Zara: Active Sync
                  </span>
               </div>
               <div className="w-px h-8 bg-gray-100" />
               <Button onClick={fetchCallLogs} className="w-12 h-12 bg-gray-900 hover:bg-black text-white rounded-2xl shadow-xl shadow-gray-200 transition-all flex items-center justify-center p-0">
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
               </Button>
            </div>
        </div>
      </div>

      {/* Stats Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Transmission Volume", value: String(todayCalls), icon: Radio, color: "indigo", sub: "Daily Encounters", trend: "Stable" },
          { label: "Neural Intent Store", value: `${avgIntent}/10`, icon: Brain, color: "amber", sub: "Global Average", trend: "High Value" },
          { label: "Success Signals", value: String(leadsGenerated), icon: ShieldCheck, color: "emerald", sub: "Follow-ups Dispatched", trend: "Active" },
        ].map(({ label, value, icon: Icon, color, sub, trend }) => (
          <div key={label} className="group bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-50/50 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-150 transition-transform duration-700`} />
            
            <div className="flex items-start justify-between mb-8 relative z-10">
              <div className={`w-14 h-14 rounded-2xl bg-${color}-50 flex items-center justify-center text-${color}-600 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                {label === "Neural Intent Store" ? <TrendingUp className="w-7 h-7" /> : <Icon className="w-7 h-7" />}
              </div>
              <div className="bg-gray-50 px-3 py-1 rounded-full text-[10px] font-black text-gray-400 group-hover:bg-white group-hover:shadow-sm transition-all uppercase tracking-widest">
                {trend}
              </div>
            </div>

            <div className="relative z-10">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{label}</p>
              <h3 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">
                {value}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold text-gray-500 italic">{sub}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Signal registry */}
      <div className="space-y-6">
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
                      <button onClick={() => setFilterScore(0)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterScore === 0 ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>All Signals</button>
                      <button onClick={() => setFilterScore(5)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterScore === 5 ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>Qualified</button>
                      <button onClick={() => setFilterScore(8)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterScore === 8 ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>High Velocity</button>
                  </div>
              </div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm flex items-center gap-2">
                  <Activity className="w-3 h-3 text-emerald-500" />
                  {filteredLogs.length} Neural Encounters Logged
              </div>
          </div>

          <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden relative">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#fcfcfc] text-[10px] uppercase text-gray-400 font-bold tracking-widest border-b border-gray-100">
                  <tr>
                    {["Signal Identity","Duration","Dispatch Unit","Neural Intent","Follow-up Dispatch","Audit"].map(h => (
                      <th key={h} className="px-8 py-6">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan={6} className="px-8 py-20 text-center"><RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto opacity-20" /></td></tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr><td colSpan={6} className="px-8 py-32 text-center text-gray-300 font-black uppercase text-[10px] tracking-[0.3em]">No signal signals detected.</td></tr>
                  ) : filteredLogs.map(l => (
                    <tr key={l.id} className="group hover:bg-[#fafafa] transition-all duration-300">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-[18px] bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-110 transition-all shadow-sm">
                                <Headphones className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="font-black text-gray-900 tracking-tighter text-lg">{l.caller_name || "Unknown Identity"}</span>
                                <p className="text-gray-400 font-mono text-[11px] tracking-tight">{l.caller_phone}</p>
                            </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 font-bold text-gray-600 tracking-tight">
                        <div className="flex items-center gap-2">
                           <Clock className="w-3.5 h-3.5 text-gray-300" />
                           {formatDuration(l.duration_seconds)}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Manifest Node</span>
                            <span className="font-bold text-gray-900 tracking-tighter">{l.interested_package || "General Inquiry"}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                           <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-[100px]">
                              <div 
                                className={`h-full rounded-full ${
                                    l.booking_intent_score >= 8 ? "bg-emerald-500" : 
                                    l.booking_intent_score >= 5 ? "bg-amber-500" : "bg-red-500"
                                }`}
                                style={{ width: `${l.booking_intent_score * 10}%` }}
                              />
                           </div>
                           <span className="font-black text-gray-900 text-xs">{l.booking_intent_score}/10</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border shadow-sm ${
                          l.sms_sent ? "bg-emerald-50 content-emerald-600 border-emerald-100 text-emerald-600" : "bg-gray-50 text-gray-400 border-gray-100"
                        }`}>
                          {l.sms_sent ? <Zap className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                          {l.sms_sent ? "Dispatched" : "Awaiting Audit"}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <button 
                            onClick={() => setSelectedCall(l)}
                            className="p-2.5 bg-gray-50 hover:bg-white text-gray-400 hover:text-gray-900 border border-gray-100 hover:shadow-xl rounded-xl transition-all duration-300 group/btn"
                        >
                            <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      </div>

      <Dialog open={!!selectedCall} onOpenChange={() => setSelectedCall(null)}>
        <DialogContent className="max-w-3xl rounded-[40px] p-0 border-none overflow-hidden bg-gray-50 shadow-2xl">
          {selectedCall && (
            <div className="flex flex-col max-h-[90vh]">
              <div className="p-10 bg-white border-b border-gray-100 flex items-start justify-between">
                <div>
                   <div className="flex items-center gap-3 mb-4">
                      <div className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-100">
                        Neural Transmission Audit
                      </div>
                      <span className="text-gray-300 text-xs font-bold">Signal ID: #{selectedCall.id.split("-")[0].toUpperCase()}</span>
                   </div>
                   <h2 className="text-4xl font-black text-gray-900 tracking-tighter mb-1">
                      {selectedCall.caller_name || "Unknown Identity"}
                   </h2>
                   <p className="text-gray-500 font-bold tracking-tight">{selectedCall.caller_phone}</p>
                </div>
                <button onClick={() => setSelectedCall(null)} className="p-3 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="p-10 overflow-y-auto space-y-10">
                <div className="grid grid-cols-2 gap-6">
                   <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Transmission Duration</p>
                      <div className="flex items-center gap-3 text-2xl font-black text-gray-900">
                         <Mic2 className="w-6 h-6 text-indigo-600" />
                         {formatDuration(selectedCall.duration_seconds)}
                      </div>
                   </div>
                   <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Neural Intent Score</p>
                      <div className="flex items-center gap-3 text-2xl font-black text-gray-900">
                         <div className={`w-3 h-3 rounded-full ${
                             selectedCall.booking_intent_score >= 8 ? "bg-emerald-500" : "bg-amber-500"
                         }`} />
                         {selectedCall.booking_intent_score} / 10
                      </div>
                   </div>
                </div>

                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden">
                   <Activity className="absolute bottom-0 right-0 w-32 h-32 text-white/5 -mb-10 -mr-10" />
                   <div className="flex items-center gap-2 mb-6">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Zara Neural Extract</span>
                   </div>
                   <p className="text-xl font-medium leading-relaxed italic text-gray-100">
                      "{selectedCall.summary || "Signal insufficient for neural summary."}"
                   </p>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <MessageSquare className="w-4 h-4 text-indigo-600" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Transmission Transcript</span>
                    </div>
                    <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-inner h-64 overflow-y-auto">
                        <p className="text-sm font-medium text-gray-600 leading-loose whitespace-pre-wrap">
                            {selectedCall.transcript?.raw || "No raw signal logs available."}
                        </p>
                    </div>
                </div>
              </div>

              <div className="p-8 bg-white border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${selectedCall.sms_sent ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Follow-up: {selectedCall.sms_sent ? "Dispatched" : "Protocol Awaiting"}</span>
                  </div>
                  <Button className="bg-gray-900 text-white font-black uppercase text-[10px] tracking-[0.2em] px-8 h-12 rounded-2xl">
                     Acknowledge Audit
                  </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Brain(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .52 8.105 4 4 0 0 0 8 0 4 4 0 0 0 0-8 3 3 0 0 0-3-3Z" />
      <path d="M9 13a4.5 4.5 0 0 0 3-4" />
      <path d="M6.003 5.125A3 3 0 1 0 12.001 5" />
      <path d="M15.001 8a4.5 4.5 0 0 1-3 4" />
    </svg>
  );
}
