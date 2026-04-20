"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { 
  Mail, Send, TrendingUp, CheckCircle, XCircle, Search, 
  RefreshCw, Users, Target, Activity, MapPin, 
  FileEdit, PlayCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

export default function OutreachCRM() {
  const [activeTab, setActiveTab] = useState<"drafts" | "sent" | "crm" | "analytics">("drafts");
  const [agencies, setAgencies] = useState<any[]>([]);
  const [outreach, setOutreach] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [researching, setResearching] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [agenciesRes, outreachRes] = await Promise.all([
        supabase.from("b2b_agencies").select("*").order("created_at", { ascending: false }),
        supabase.from("b2b_outreach").select("*, b2b_agencies(*)").order("created_at", { ascending: false })
    ]);
    
    setAgencies(agenciesRes.data || []);
    setOutreach(outreachRes.data || []);
    setLoading(false);
  }

  const findAgencies = async () => {
      setResearching(true);
      toast.loading("Claude is searching for target B2B agencies...", { id: "res" });
      try {
          // Hardcoded for demo/simplicity, you can add an input for region
          const res = await fetch("/api/outreach/research", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ target_region: "USA/UK", count: 5 })
          });
          const data = await res.json();
          if(data.success) {
              toast.success(`Found ${data.count} new luxury agencies!`, { id: "res" });
              fetchData();
          } else throw new Error(data.error);
      } catch (err) {
          toast.error("Research failed.", { id: "res" });
      }
      setResearching(false);
  };

  const generateAllDrafts = async () => {
      // Find agencies that don't have drafts yet
      const agenciesWithDrafts = outreach.map(o => o.agency_id);
      const pendingAgencies = agencies.filter(a => !agenciesWithDrafts.includes(a.id));
      
      if(pendingAgencies.length === 0) {
          toast.success("All agencies already have drafts!");
          return;
      }
      
      setGenerating(true);
      let count = 0;
      toast.loading(`Drafting ${pendingAgencies.length} personalized emails...`, { id: "gen" });
      
      for (const agency of pendingAgencies) {
          try {
             await fetch("/api/outreach/generate-email", {
                 method: "POST",
                 headers: { "Content-Type": "application/json" },
                 body: JSON.stringify({ agency_id: agency.id })
             });
             count++;
          } catch(e) {}
      }
      
      toast.success(`Drafted ${count} new personalized emails!`, { id: "gen" });
      fetchData();
      setGenerating(false);
  };

  const sendEmail = async (outreach_id: string) => {
      toast.loading("Dispatching email via Resend...", { id: "send" });
      try {
          const res = await fetch("/api/outreach/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ outreach_id })
          });
          if (!res.ok) throw new Error("Failed to send");
          toast.success("Email dispatched!", { id: "send" });
          fetchData();
      } catch (err) {
          toast.error("Dispatch Failed.", { id: "send" });
      }
  };

  const rejectDraft = async (id: string) => {
      if(!confirm("Delete this draft?")) return;
      await supabase.from("b2b_outreach").delete().eq("id", id);
      fetchData();
  };

  // derived data
  const drafts = outreach.filter(o => o.status === 'draft');
  const sent = outreach.filter(o => o.status === 'sent');

  return (
    <div className="p-8 pb-32 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tighter">
            <span className="w-2 h-8 bg-primary rounded-full hidden md:block" />
            B2B Intelligence Hub
          </h1>
          <p className="text-gray-500 mt-2 font-bold italic">
            AI-powered agency prospecting and neural personalized pitch generation.
          </p>
        </div>
        <div className="flex items-center gap-3">
            <Button onClick={findAgencies} disabled={researching} variant="outline" className="gap-2 bg-white border-gray-200 text-gray-600 hover:bg-gray-50 font-black uppercase tracking-widest text-[10px] h-12 px-6 rounded-2xl transition-all shadow-sm">
                {researching ? <RefreshCw className="w-4 h-4 animate-spin text-primary" /> : <Search className="w-4 h-4 text-primary stroke-[3px]" />}
                Hunt Prospects
            </Button>
            <Button onClick={generateAllDrafts} disabled={generating} className="gap-2 bg-gradient-to-r from-primary to-emerald-600 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-emerald-100 text-white font-black uppercase tracking-widest text-[10px] h-12 px-6 rounded-2xl">
                {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                Batch Neural Draft
            </Button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex flex-wrap gap-2 mb-10 bg-gray-100/80 p-1.5 rounded-[22px] max-w-fit border border-gray-100">
          {[
              { id: 'drafts', label: 'Neural Drafts', count: drafts.length, icon: FileEdit, color: 'primary' },
              { id: 'sent', label: 'Dispatch Log', count: sent.length, icon: Send, color: 'blue' },
              { id: 'crm', label: 'Identity Registry', count: agencies.length, icon: Users, color: 'indigo' },
              { id: 'analytics', label: 'Performance', count: null, icon: TrendingUp, color: 'emerald' }
          ].map(tab => (
              <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-xl shadow-gray-200/50 scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
              >
                  <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? `text-${tab.color === 'primary' ? 'emerald' : tab.color}-600` : ''} stroke-[3px]`} />
                  {tab.label}
                  {tab.count !== null && <span className={`ml-1.5 bg-${tab.color === 'primary' ? 'emerald' : tab.color}-50 text-${tab.color === 'primary' ? 'emerald' : tab.color}-600 py-0.5 px-2 rounded-full text-[9px] font-black`}>{tab.count}</span>}
              </button>
          ))}
      </div>

      {/* Dynamic Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "drafts" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                {loading ? <div className="text-center p-12 text-gray-400">Loading drafts...</div> : drafts.length === 0 ? <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
                    <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900">No Pending Drafts</h3>
                    <p className="text-gray-500 mt-2">Click "Batch Generate Pitches" to have Zara draft personalized emails for your prospects.</p>
                </div> : drafts.map(draft => (
                    <div key={draft.id} className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 transition-all hover:shadow-xl hover:shadow-gray-100">
                        <div className="flex flex-col md:flex-row gap-8">
                            <div className="md:w-1/3 border-r border-gray-100 pr-8">
                                <div className="flex items-center justify-between mb-6">
                                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-100">Neural Calibration Required</span>
                                    <span className="text-[10px] font-black text-gray-400">ID: {draft.id.slice(0,8).toUpperCase()}</span>
                                </div>
                                <h3 className="font-black text-gray-900 text-2xl tracking-tighter mb-1 uppercase italic">{draft.b2b_agencies?.name || 'Unknown Operator'}</h3>
                                <p className="text-xs font-bold text-indigo-600 mb-4 bg-indigo-50 px-3 py-1 rounded-full inline-block tracking-tight">{draft.b2b_agencies?.website}</p>
                                
                                <div className="space-y-4 mt-8">
                                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
                                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><MapPin className="w-3 h-3 text-emerald-600" /> Strategic Gap Inferred</p>
                                        <p className="text-xs font-bold text-gray-700 leading-relaxed tracking-tight">{draft.b2b_agencies?.kenya_gap}</p>
                                    </div>
                                    <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-50">
                                        <p className="text-[9px] text-emerald-600/60 font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Activity className="w-3 h-3" /> Personalized Hook</p>
                                        <p className="text-xs font-bold text-gray-800 leading-relaxed tracking-tight italic">"{draft.b2b_agencies?.personalization_hook}"</p>
                                    </div>
                                </div>
                            </div>
                            <div className="md:w-2/3 flex flex-col pt-2">
                                <div className="mb-6 bg-gray-900 text-white/90 flex items-center gap-3 p-4 rounded-2xl border border-gray-800 shadow-lg">
                                    <span className="font-black text-emerald-500 text-[10px] uppercase tracking-widest w-[100px] border-r border-white/10">Neural Subject</span>
                                    <span className="font-bold text-sm tracking-tight">{draft.email_subject}</span>
                                </div>
                                <div className="bg-white p-8 rounded-2xl border border-gray-100 text-sm md:text-base text-gray-600 font-medium leading-relaxed prose prose-sm prose-p:my-3 min-h-[200px] overflow-y-auto shadow-inner" dangerouslySetInnerHTML={{ __html: draft.email_body }}>
                                </div>
                                
                                <div className="flex gap-3 mt-8 pt-6 border-t border-gray-50">
                                    <Button onClick={() => sendEmail(draft.id)} className="h-12 flex-grow gap-2 bg-gradient-to-r from-emerald-600 to-primary text-white rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] shadow-lg shadow-emerald-100 hover:scale-[1.01] transition-all">
                                        <CheckCircle className="w-4 h-4 stroke-[3px]" /> Deploy Signal via Resend
                                    </Button>
                                    <Button variant="outline" className="h-12 w-12 flex items-center justify-center border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50 rounded-2xl transition-all">
                                        <FileEdit className="w-5 h-5" />
                                    </Button>
                                    <Button onClick={() => rejectDraft(draft.id)} variant="outline" className="h-12 w-12 flex items-center justify-center border-red-100 bg-red-50 text-red-400 hover:text-red-700 hover:bg-red-100 rounded-2xl transition-all">
                                        <XCircle className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </motion.div>
        )}
        
        {activeTab === "crm" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Prospect Ledger</h2>
                    <h3 className="text-xl font-black text-gray-900 tracking-tighter">Identity Core Repository</h3>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-white text-[10px] uppercase text-gray-400 font-black tracking-widest border-b border-gray-100">
                        <tr>
                            {["Operator Identity", "Territory", "Specialization Node", "System Status"].map(h => (
                                <th key={h} className="px-8 py-4 font-bold tracking-widest uppercase">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-600">
                        {agencies.map(agency => (
                            <tr key={agency.id} className="group hover:bg-gray-50/50 transition-all">
                                <td className="px-8 py-6">
                                    <div className="flex flex-col">
                                       <span className="font-black text-gray-900 text-[14px] tracking-tighter group-hover:text-primary transition-colors uppercase italic">{agency.name}</span>
                                       <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{agency.website}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 flex items-center gap-2 font-bold text-gray-500 text-[11px] uppercase whitespace-nowrap">
                                    <MapPin className="w-3.5 h-3.5 text-gray-300" />
                                    {agency.country}
                                </td>
                                <td className="px-8 py-6">
                                    <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full border border-indigo-100 uppercase tracking-widest">
                                        {agency.specialties || "Generalist"}
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                     <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-purple-50 text-purple-600 border border-purple-100">
                                         <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                         Neural Prospect
                                     </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </motion.div>
        )}

        {(activeTab === "sent" || activeTab === "analytics") && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Tab Under Construction</h3>
                <p className="text-gray-500">Sent history and Analytics dashboards will populate as you send emails.</p>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
