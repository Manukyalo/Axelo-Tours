"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  Globe, 
  Target, 
  Zap, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  RefreshCw,
  Plus,
  ArrowUpRight,
  Search,
  MessageSquare,
  Sparkles,
  BarChart3,
  CheckCircle2,
  MoreHorizontal
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { INTEL_ACTION_BADGES, IntelActionType } from "@/lib/constants";
import toast from "react-hot-toast";

// Types for the intelligence data
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
  const supabase = createClient();

  useEffect(() => {
    fetchLatestReport();
  }, []);

  async function fetchLatestReport() {
    setLoading(true);
    const { data, error } = await supabase
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
    try {
      const res = await fetch("/api/competitor-analysis", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("Intelligence report generated!");
        setReport(data.report);
      } else {
        toast.error("Analysis failed: " + data.error);
      }
    } catch (err) {
      toast.error("Network error during analysis");
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-[70vh]">
      <RefreshCw className="w-8 h-8 text-primary animate-spin" />
    </div>
  );

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Market Intelligence</h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            Real-time competitor tracking and demand intelligence powered by Claude 3.5
          </p>
        </div>
        <button 
          onClick={handleRunAnalysis}
          disabled={analyzing}
          className="flex items-center gap-2 bg-brand-dark text-white px-5 py-2.5 rounded-xl font-bold hover:bg-black transition-all shadow-xl shadow-brand-dark/10 disabled:opacity-50"
        >
          {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {analyzing ? "Analyzing Markets..." : "Run New Analysis"}
        </button>
      </div>

      {!report ? (
        <EmptyState onRun={handleRunAnalysis} analyzing={analyzing} />
      ) : (
        <div className="grid grid-cols-12 gap-8">
          
          {/* SECTION 1 - DEMAND RADAR (Col 8) */}
          <div className="col-span-12 xl:col-span-8 space-y-8">
            <SectionCard title="Demand Radar" icon={Globe} badge="Real-time">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-[300px]">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Keyword Growth (%)</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.search_trends?.trending_terms || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="term" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        cursor={{ fill: '#f8fafc' }}
                      />
                      <Bar dataKey="growth" radius={[4, 4, 0, 0]}>
                        {(report.search_trends?.trending_terms || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.growth > 30 ? '#10b981' : entry.growth > 15 ? '#3b82f6' : '#94a3b8'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Trending Search Terms</h3>
                  <div className="space-y-3">
                    {(report.search_trends?.trending_terms || []).map((term: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Search className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold text-gray-700">{term.term}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-bold text-gray-400 px-2 py-0.5 border border-gray-200 rounded-full">{term.source || 'Global'}</span>
                          <span className={`text-sm font-bold ${term.growth > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {term.growth > 0 ? '+' : ''}{term.growth}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Seasonal Alert */}
              <div className="mt-8 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-800">Seasonal Peak Alert</p>
                  <p className="text-xs text-amber-700">Wildebeest Migration peak starts in 45 days. High demand detected in US/UK markets for "Private Luxury Safaris".</p>
                </div>
              </div>
            </SectionCard>

            {/* SECTION 2 - COMPETITOR BREAKDOWN */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" /> Competitor Breakdown
                </h2>
                <span className="text-xs font-bold text-gray-400">Total Tracked: {report.data?.length || 0}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(report.data || []).map((comp: any) => (
                  <CompetitorCard 
                    key={comp.name}
                    data={comp} 
                    isExpanded={expandedCompetitor === comp.name}
                    onToggle={() => setExpandedCompetitor(expandedCompetitor === comp.name ? null : comp.name)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (Col 4) */}
          <div className="col-span-12 xl:col-span-4 space-y-8">
            
            {/* SECTION 5 - WEEKLY BRIEF */}
            <SectionCard title="AI Weekly Brief" icon={Sparkles} className="bg-brand-dark text-white border-none shadow-brand-dark/20">
              <p className="text-white/80 text-sm leading-relaxed mb-6 italic">
                "{report.insights}"
              </p>
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Top Recommendations</h4>
                {[
                  { label: "Launch Family Photography Package", priority: "High" },
                  { label: "Optimize 'budget mara safari' landing page", priority: "Med" },
                  { label: "Increase PPC spend in German markets", priority: "Low" }
                ].map((rec, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-xs font-medium text-white/90">{rec.label}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      rec.priority === 'High' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {rec.priority}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* SECTION 3 - KEYWORD GAP MAP */}
            <SectionCard title="Keyword Gap Map" icon={BarChart3}>
              <div className="space-y-4">
                {(report.keyword_gaps?.gaps || [
                  { keyword: "eco-friendly safari kenya", volume: "1.2k", competitor: "Sarova", action: "blog" },
                  { keyword: "low season deals mara", volume: "850", competitor: "Bonfire", action: "landing" },
                  { keyword: "honeymoon kenya beach & bush", volume: "2.5k", competitor: "Scenic", action: "optimize" }
                ]).map((gap: any, i: number) => (
                  <div key={i} className="p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors group">
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-bold text-gray-900 group-hover:text-primary transition-colors">{gap.keyword}</span>
                      <span className="text-xs font-bold text-gray-400">{gap.volume}/mo</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">Dominant:</span>
                        <span className="text-[10px] font-bold text-gray-600">{gap.competitor}</span>
                      </div>
                      <button className={`text-[10px] font-bold px-2 py-1 rounded-lg ${INTEL_ACTION_BADGES[gap.action as IntelActionType]?.color}`}>
                        {INTEL_ACTION_BADGES[gap.action as IntelActionType]?.label}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* SECTION 4 - OPPORTUNITY RADAR */}
            <SectionCard title="Opportunity Radar" icon={Zap}>
              <div className="space-y-4">
                {(report.opportunities || []).slice(0, 3).map((opp: any, i: number) => (
                  <div key={i} className="relative overflow-hidden p-4 rounded-2xl border border-primary/10 bg-gradient-to-br from-white to-primary/5">
                    <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs ring-4 ring-white">
                      {10 - i}
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 mb-1">{opp.niche || opp}</h4>
                    <p className="text-xs text-gray-500 mb-3">{opp.why || "High growth niche with low competitor coverage."}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold bg-white px-2 py-1 rounded-full border border-gray-100 shadow-sm">
                        Est. +{opp.traffic || '15'}% traffic
                      </span>
                      <button className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline ml-auto">
                        Execute <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

          </div>
        </div>
      )}
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, className = "", badge }: { 
  title: string; icon: any; children: React.ReactNode; className?: string; badge?: string;
}) {
  return (
    <div className={`bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm relative ${className}`}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        </div>
        {badge && (
          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function CompetitorCard({ data, isExpanded, onToggle }: { data: any; isExpanded: boolean; onToggle: () => void }) {
  return (
    <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 transition-all">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center text-xl">
              {data.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">{data.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{data.prices}</p>
            </div>
          </div>
          <button 
            onClick={onToggle}
            className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {data.gaps?.slice(0, 2).map((gap: string, i: number) => (
            <span key={i} className="text-[10px] font-bold px-2 py-1 bg-red-50 text-red-600 rounded-lg flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" /> Missing: {gap}
            </span>
          ))}
          <span className="text-[10px] font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded-lg flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5" /> Active
          </span>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-6 pt-6 border-t border-gray-50 space-y-4"
            >
              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> Client Complaints (Last 6 Months)
                </h4>
                <ul className="space-y-1">
                  {data.complaints?.map((c: string, i: number) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" /> New Launches
                </h4>
                <ul className="space-y-1">
                  {data.recent_launches?.map((l: string, i: number) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      {l}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function EmptyState({ onRun, analyzing }: { onRun: () => void; analyzing: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center p-20 bg-gray-50 rounded-[48px] border-2 border-dashed border-gray-200 text-center">
      <div className="w-20 h-20 bg-white rounded-[32px] shadow-xl flex items-center justify-center mb-6 relative">
        <Globe className="w-10 h-10 text-primary" />
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-brand-dark rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Initialize Market Intelligence</h2>
      <p className="text-gray-500 max-w-sm mb-8">Run your first AI analysis to track competitors, discover keyword gaps, and find new safari opportunities.</p>
      <button 
        onClick={onRun}
        disabled={analyzing}
        className="flex items-center gap-3 bg-primary text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
      >
        {analyzing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
        {analyzing ? "Running Scrapers..." : "Begin Strategic Analysis"}
      </button>
    </div>
  );
}
