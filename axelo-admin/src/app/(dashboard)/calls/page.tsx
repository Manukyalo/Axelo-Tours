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
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <PhoneCall className="h-8 w-8 text-primary" />
            Call Intelligence
          </h1>
          <p className="text-gray-500 mt-2">
            AI-driven phone reception powered by Zara. Review transcripts, booking intent, and automated follow-ups.
          </p>
        </div>
        <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Zara Agent: Online</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
            <PhoneCall className="w-24 h-24 text-primary" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <PhoneCall className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Calls Today</h3>
          </div>
          <p className="text-4xl font-bold text-gray-900">{todayCalls}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-24 h-24 text-amber-500" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Avg Intent Score</h3>
          </div>
          <p className="text-4xl font-bold text-gray-900">{avgIntent}<span className="text-sm font-medium text-gray-400 ml-1">/ 10</span></p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
            <Zap className="w-24 h-24 text-green-500" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Leads Generated</h3>
          </div>
          <p className="text-4xl font-bold text-gray-900">{leadsGenerated}</p>
          <p className="text-sm text-gray-500 mt-2">Automated SMS dispatched</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900">Call Log Directory</h2>
          
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500">Min Intent:</span>
            <select 
              value={filterScore} 
              onChange={(e) => setFilterScore(Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value={0}>All Calls</option>
              <option value={5}>Medium+ (5+)</option>
              <option value={8}>High Intent (8+)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/50 text-xs uppercase text-gray-500 font-semibold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Date / Time</th>
                <th className="px-6 py-4">Caller</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Intent</th>
                <th className="px-6 py-4">Package Interest</th>
                <th className="px-6 py-4 text-center">SMS Sent</th>
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
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{new Date(log.created_at).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-400">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        {log.caller_name}
                      </div>
                      <div className="text-xs text-gray-500">{log.caller_phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap flex items-center gap-1.5 mt-2">
                       <Clock className="w-3.5 h-3.5 text-gray-400" />
                       {formatDuration(log.duration_seconds)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getIntentBadge(log.booking_intent_score)}`}>
                        {log.booking_intent_score} / 10
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {log.interested_package || <span className="text-gray-400 font-normal">None detected</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {log.sms_sent ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-gray-300 mx-auto block"></span>
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
