"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, Globe, Target, Zap, AlertCircle, ChevronDown, 
  ChevronUp, ExternalLink, RefreshCw, Plus, ArrowUpRight, 
  Search, MessageSquare, Sparkles, BarChart3, CheckCircle2, 
  MoreHorizontal, Activity, Radio, Shield, Fingerprint, 
  Layers, Map, Radar as RadarIcon, Eye, Briefcase
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
  , AreaChart, Area
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { INTEL_ACTION_BADGES, IntelActionType } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface CompetitorReport {
  id: string;
  report_date: string;
  data: any[];
  search_trends: any;
  keyword_gaps: any;
  opportunities: any[];
  insights: string;
}

export default function MarketIntelPage() {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<CompetitorReport | null>(null);
  const [expandedCompetitor, setExpandedCompetitor] = useState<string | null>(null);
  const [scanVisible, setScanVisible] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    fetchLatestReport();
    const timer = setTimeout(() => setScanVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  async function fetchLatestReport() {
    setLoading(true);
    const { data } = await supabase
      .from("competitor_reports")
      .select("*")
      .order("report_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) setReport(data);
    setLoading(false);
  }

  async function handleRunAnalysis() {
    setAnalyzing(true);
    const toastId = toast.loading("Initiating Global Market Scan...", {
        icon: <Radio className="w-5 h-5 animate-pulse text-indigo-500" />,
        style: { borderRadius: '20px', background: '#fff', color: '#111', fontWeight: 'bold' }
    });
    try {
      const res = await fetch("/api/competitor-analysis", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("Intelligence calibration complete.", { id: toastId });
        setReport(data.report);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Signal interruption detected.", { id: toastId });
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-6">
      <div className="relative">
        <RefreshCw className="w-16 h-16 text-indigo-600 animate-spin opacity-20" />
        <div className="absolute inset-0 flex items-center justify-center">
            <Radio className="w-6 h-6 text-indigo-600 animate-pulse" />
        </div>
      </div>
      <p className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-300 italic">Synchronizing Signals...</p>
    </div>
  );

  return (
    <div className="p-10 pb-32 space-y-12 bg-[#fafafa] min-h-screen">
      {/* Strategic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-indigo-600/10 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 border border-indigo-100 shadow-sm">
              <Shield className="w-3.5 h-3.5" />
              Strategic Intelligence Hub
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Feed Active
            </div>
          </div>
          <h1 className="text-6xl font-black text-gray-900 tracking-tighter leading-none mb-6 uppercase italic">
            Global <span className="text-indigo-600">Market</span> Signals
          </h1>
          <p className="text-gray-500 font-medium max-w-2xl text-xl leading-snug italic">
            Monitoring planetary demand patterns and competitor maneuvers. Real-time tactical signals powered by Axelo neural processors.
          </p>
        </div>

        <div className="flex items-center gap-4">
            <Button 
                onClick={handleRunAnalysis}
                disabled={analyzing}
                className="gap-3 bg-gray-900 hover:bg-black text-white font-black uppercase tracking-widest text-[11px] h-16 px-10 rounded-[28px] shadow-2xl shadow-gray-300 transition-all border-none relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-fuchsia-600 opacity-0 group-hover:opacity-10 transition-opacity" />
                {analyzing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RadarIcon className="w-5 h-5 text-indigo-400 group-hover:animate-ping" />}
                {analyzing ? "Syncing Logic..." : "Calibrate Market Signal"}
            </Button>
        </div>
      </div>

      {!report ? (
        <EmptyIntelligence onRun={handleRunAnalysis} analyzing={analyzing} />
      ) : (
        <div className="grid grid-cols-12 gap-10">
          
          {/* Main Visual Intelligence Corridor */}
          <div className="col-span-12 xl:col-span-8 space-y-10">
            
            {/* Spectral Demand Analysis */}
            <div className="bg-white rounded-[48px] p-12 border border-gray-100 shadow-xl shadow-gray-100/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                
                <div className="flex items-center justify-between mb-12 relative z-10">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-3xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-100">
                           <Globe className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic leading-none mb-2">Demand Spectral Radar</h2>
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Real-time Global Keyword Velocity</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                           <button className="px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest bg-white shadow-sm text-indigo-600">Volume</button>
                           <button className="px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest text-gray-400">Velocity</button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10">
                    <div className="space-y-8">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={report.search_trends?.trending_terms || []}>
                                    <defs>
                                        <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="term" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '20px' }}
                                        labelStyle={{ fontWeight: '900', color: '#111', textTransform: 'uppercase', marginBottom: '8px' }}
                                    />
                                    <Area type="monotone" dataKey="growth" stroke="#4f46e5" strokeWidth={5} fillOpacity={1} fill="url(#colorGrowth)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex items-center justify-between p-6 bg-amber-50 rounded-3xl border border-amber-100 shadow-inner">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
                                    <AlertCircle className="w-6 h-6 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-black text-amber-900 uppercase tracking-widest mb-1 italic">Migration Peak Warning</p>
                                    <p className="text-xs text-amber-700/80 font-bold leading-tight">Demand surge detected in Nordic regions for "Winter Safari Exclusive".</p>
                                </div>
                            </div>
                            <Button variant="ghost" className="text-[9px] font-black uppercase text-amber-700 hover:bg-amber-100 px-6 rounded-xl">Details</Button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-2">
                             <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Critical Search Signals</h3>
                             <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {(report.search_trends?.trending_terms || []).map((term: any, i: number) => (
                                <motion.div 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    key={i} 
                                    className="flex items-center justify-between p-5 bg-gray-50/50 hover:bg-white hover:shadow-xl hover:shadow-gray-100 border border-gray-100/50 rounded-2xl transition-all group/item"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 shadow-sm group-hover/item:text-indigo-600 group-hover/item:scale-110 transition-all">
                                            <Search className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="font-black text-gray-900 text-sm tracking-tight uppercase italic">{term.term}</span>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{term.source || 'Global Aggregate'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-5">
                                        <div className="flex flex-col items-end">
                                            <span className={`text-sm font-black italic ${term.growth > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                {term.growth > 0 ? '+' : ''}{term.growth}%
                                            </span>
                                            <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                                <div className={`h-full bg-emerald-500 transition-all duration-1000`} style={{ width: `${Math.min(100, Math.abs(term.growth) * 2)}%` }} />
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover/item:translate-x-1 group-hover/item:text-indigo-600 transition-all" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tactical Asset Surveillance (Competitors) */}
            <div className="space-y-8">
              <div className="flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <Target className="w-6 h-6 text-rose-500" />
                    <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">
                        Tactical Asset Surveillance
                    </h2>
                </div>
                <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-2xl border border-gray-100 shadow-sm">
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Scanning</span>
                    <span className="text-[10px] font-black text-gray-900 uppercase italic">{report.data?.length || 0} Entities</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {(report.data || []).map((comp: any, i: number) => (
                  <CompetitorNode 
                    key={comp.name}
                    data={comp} 
                    index={i}
                    isExpanded={expandedCompetitor === comp.name}
                    onToggle={() => setExpandedCompetitor(expandedCompetitor === comp.name ? null : comp.name)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Lateral Intelligence Feed (Right Column) */}
          <div className="col-span-12 xl:col-span-4 space-y-10">
            
            {/* Neural Executive Brief */}
            <div className="bg-gray-900 rounded-[48px] p-10 text-white relative overflow-hidden shadow-3xl shadow-gray-300 group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full -mr-40 -mt-40 blur-[100px] group-hover:scale-150 transition-transform duration-1000" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-fuchsia-500/10 rounded-full -ml-20 -mb-20 blur-[80px]" />

                <div className="flex items-center justify-between mb-10 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/10">
                            <Sparkles className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 block">Neural Analysis</span>
                            <span className="text-lg font-black uppercase italic tracking-tight">Executive Brief</span>
                        </div>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                        <Fingerprint className="w-4 h-4 text-white/20" />
                    </div>
                </div>

                <div className="relative z-10">
                    <p className="text-xl font-medium leading-relaxed italic text-white/90 mb-10">
                        "{report.insights}"
                    </p>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">Strategic Directives</h4>
                        {[
                          { label: "Launch Photography Tier", priority: "CRITICAL", color: "rose" },
                          { label: "Optimize Budget Funnel", priority: "OPTIMAL", color: "indigo" },
                          { label: "Increase DACH PPC spend", priority: "STRATEGIC", color: "emerald" }
                        ].map((rec, i) => (
                          <div key={i} className="group/rec flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-[20px] border border-white/5 hover:border-white/20 transition-all cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className={`w-2 h-2 rounded-full bg-${rec.color}-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]`} />
                                <span className="text-xs font-bold text-white/80 group-hover/rec:text-white transition-colors">{rec.label}</span>
                            </div>
                            <span className={`text-[9px] font-black px-3 py-1 rounded-full border border-white/10 group-hover/rec:bg-white group-hover/rec:text-black transition-all uppercase tracking-widest`}>
                              {rec.priority}
                            </span>
                          </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Infiltration Map (Keyword Gaps) */}
            <div className="bg-white rounded-[48px] p-10 border border-gray-100 shadow-xl shadow-gray-100/30 overflow-hidden relative group">
                <div className="absolute top-10 right-10 flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" />
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce delay-100" />
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce delay-200" />
                </div>
                
                <div className="flex items-center gap-5 mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase italic leading-none mb-1">Market Lacuna Map</h3>
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Identified Infiltration Points</span>
                    </div>
                </div>

                <div className="space-y-5">
                    {(report.keyword_gaps?.gaps || [
                      { keyword: "eco-friendly safari kenya", volume: "1.2k", competitor: "Sarova", action: "blog" },
                      { keyword: "low season deals mara", volume: "850", competitor: "Bonfire", action: "landing" },
                      { keyword: "honeymoon kenya beach & bush", volume: "2.5k", competitor: "Scenic", action: "optimize" }
                    ]).map((gap: any, i: number) => (
                      <div key={i} className="p-6 bg-gray-50/50 hover:bg-white border border-gray-100 rounded-[32px] hover:shadow-2xl hover:shadow-gray-200/50 transition-all group/gap cursor-pointer">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex flex-col">
                             <span className="font-black text-gray-900 text-[15px] uppercase italic tracking-tight group-hover/gap:text-indigo-600 transition-colors">{gap.keyword}</span>
                             <span className="text-[10px] font-bold text-gray-400 mt-0.5 tracking-widest">{gap.volume} SEARCHES / MO</span>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-300 shadow-sm group-hover/gap:rotate-12 transition-all">
                             <TrendingUp className="w-5 h-5" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100/50">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-lg bg-gray-900 text-white flex items-center justify-center text-[9px] font-black italic">
                                {gap.competitor[0]}
                            </div>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{gap.competitor}</span>
                          </div>
                          <span className={`text-[9px] font-black px-4 py-1.5 rounded-full shadow-sm uppercase tracking-widest border transition-all ${INTEL_ACTION_BADGES[gap.action as IntelActionType]?.color} group-hover/gap:scale-105`}>
                            {INTEL_ACTION_BADGES[gap.action as IntelActionType]?.label}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
            </div>

            {/* Neural Opportunity Node */}
            <div className="bg-indigo-600 rounded-[48px] p-10 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Zap className="w-40 h-40 rotate-12" />
                </div>
                
                <div className="flex items-center gap-4 mb-10 relative z-10">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center">
                        <Activity className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-black uppercase italic tracking-tight">Active Opportunities</span>
                </div>

                <div className="space-y-4 relative z-10">
                    {(report.opportunities || []).slice(0, 3).map((opp: any, i: number) => (
                      <div key={i} className="p-6 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-[32px] border border-white/5 transition-all cursor-pointer group/opp">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-black uppercase italic tracking-tight text-white">{opp.niche || opp}</h4>
                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-black shadow-lg">
                                +{opp.traffic || '22'}%
                            </div>
                        </div>
                        <p className="text-[11px] font-bold text-white/50 leading-relaxed italic mb-4">{opp.why || "High yield niche with zero competitor signal detected in top 10 SERP."}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 italic">Infiltration Tier 1</span>
                            <button className="text-[10px] font-black text-white flex items-center gap-2 hover:translate-x-1 transition-transform">
                                Execute Deployment <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                      </div>
                    ))}
                </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

function CompetitorNode({ data, index, isExpanded, onToggle }: { data: any; index: number; isExpanded: boolean; onToggle: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-white border rounded-[48px] overflow-hidden transition-all duration-500 hover:shadow-3xl hover:shadow-gray-200/50 ${isExpanded ? 'border-indigo-600 ring-8 ring-indigo-50 shadow-2xl shadow-indigo-100' : 'border-gray-100'}`}
    >
      <div className="p-10">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-gray-900 rounded-[28px] flex items-center justify-center text-3xl font-black text-white italic shadow-xl">
              {data.name[0]}
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">{data.name}</h3>
              <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 uppercase tracking-widest">{data.prices}</span>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Surveillance Target</p>
              </div>
            </div>
          </div>
          <button 
            onClick={onToggle}
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${isExpanded ? 'bg-indigo-600 border-indigo-600 text-white rotate-180' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-indigo-600 hover:text-indigo-600'}`}
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          {data.gaps?.slice(0, 2).map((gap: string, i: number) => (
            <span key={i} className="text-[10px] font-black px-4 py-2 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 flex items-center gap-2 uppercase tracking-tight shadow-sm hover:scale-105 transition-transform cursor-default">
              <Zap className="w-3.5 h-3.5" /> Vulnerability: {gap}
            </span>
          ))}
          <span className="text-[10px] font-black px-4 py-2 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shadow-sm flex items-center gap-2 uppercase tracking-tight">
            <CheckCircle2 className="w-3.5 h-3.5" /> Signal Active
          </span>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-10 pt-10 border-t-4 border-dashed border-gray-50 flex flex-col gap-10"
            >
              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <MessageSquare className="w-4 h-4 text-rose-400" />
                        <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest italic">Client Signal Weakness</h4>
                    </div>
                    <ul className="space-y-4">
                      {data.complaints?.map((c: string, i: number) => (
                        <li key={i} className="text-[13px] font-bold text-gray-600 border-l-4 border-rose-100 pl-4 py-1 leading-snug">
                          {c}
                        </li>
                      ))}
                    </ul>
                </div>
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest italic">Recent Hostile Launches</h4>
                    </div>
                    <ul className="space-y-4">
                      {data.recent_launches?.map((l: string, i: number) => (
                        <li key={i} className="text-[13px] font-bold text-gray-600 border-l-4 border-emerald-100 pl-4 py-1 leading-snug">
                          {l}
                        </li>
                      ))}
                    </ul>
                </div>
              </div>

              <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                      <Briefcase className="w-5 h-5 text-indigo-600" />
                      <span className="text-xs font-black uppercase text-gray-900 tracking-tight italic">Tactical Counter-Measure Ready</span>
                  </div>
                  <Button className="bg-indigo-600 hover:bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest h-10 px-6 pulse">Deploy Response</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function EmptyIntelligence({ onRun, analyzing }: { onRun: () => void; analyzing: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center p-32 bg-white rounded-[64px] border-4 border-dashed border-gray-100 text-center shadow-inner group">
      <div className="w-24 h-24 bg-gray-50 rounded-[40px] shadow-2xl flex items-center justify-center mb-10 relative border border-gray-100 group-hover:rotate-12 transition-transform duration-700">
        <Globe className="w-12 h-12 text-indigo-600" />
        <div className="absolute -top-3 -right-3 w-10 h-10 bg-gray-900 rounded-2xl flex items-center justify-center shadow-xl shadow-gray-300">
          <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
        </div>
      </div>
      <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter uppercase italic leading-none">Initialize Neural Intel</h2>
      <p className="text-gray-400 max-w-sm mb-12 font-bold text-lg leading-snug italic">Establish secondary satellite link to scan global competitor signals and keyword lacunas.</p>
      <Button 
        onClick={onRun}
        disabled={analyzing}
        className="h-20 px-16 bg-indigo-600 hover:bg-black text-white text-sm font-black uppercase tracking-[0.2em] rounded-[32px] shadow-3xl shadow-indigo-200 transition-all border-none relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        {analyzing ? <RefreshCw className="w-6 h-6 animate-spin mr-3" /> : <RadarIcon className="w-6 h-6 mr-3" />}
        {analyzing ? "Scanning Market Space..." : "Initiate Critical Analysis"}
      </Button>
    </div>
  );
}

function ChevronRight(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
