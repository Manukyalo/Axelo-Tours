"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { 
  Mail, Send, TrendingUp, CheckCircle, XCircle, Search, 
  RefreshCw, Users, Target, Activity, MapPin, 
  FileEdit, PlayCircle, Shield, Radio, Zap, Globe,
  MoreVertical, ChevronRight, Fingerprint, Layout,
  Layers, Database, Sparkles, Wand2, ArrowUpRight
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
    const toastId = toast.loading("AI is scanning the market for potential partners...", {
        icon: <Radio className="w-5 h-5 animate-pulse text-indigo-500" />,
    });
    try {
        const res = await fetch("/api/outreach/research", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ target_region: "USA/UK", count: 5 })
        });
        const data = await res.json();
        if(data.success) {
            toast.success(`Identified ${data.count} new luxury travel prospects.`, { id: toastId });
            fetchData();
        } else throw new Error(data.error);
    } catch (err: any) {
        toast.error(err.message || "Prospecting search interrupted.", { id: toastId });
    }
    setResearching(false);
  };

  const generateAllDrafts = async () => {
      const agenciesWithDrafts = outreach.map(o => o.agency_id);
      const pendingAgencies = agencies.filter(a => !agenciesWithDrafts.includes(a.id));
      
      if(pendingAgencies.length === 0) {
          toast.success("All tactical manifests are currently calibrated.");
          return;
      }
      
      setGenerating(true);
      let count = 0;
      const toastId = toast.loading(`Generating personalized drafts for ${pendingAgencies.length} agencies...`, {
          icon: <Wand2 className="w-5 h-5 animate-spin text-indigo-500" />,
      });
      
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
      
      toast.success(`Successfully generated ${count} personalized drafts.`, { id: toastId });
      fetchData();
      setGenerating(false);
  };

  const sendEmail = async (outreach_id: string) => {
      const toastId = toast.loading("Sending personalized email via Resend...", {
          icon: <Send className="w-5 h-5 text-emerald-500 animate-bounce" />,
      });
      try {
          const res = await fetch("/api/outreach/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ outreach_id })
          });
          if (!res.ok) throw new Error("Email delivery failed");
          toast.success("Email sent successfully.", { id: toastId });
          fetchData();
      } catch (err: any) {
          toast.error(err.message || "Email delivery aborted.", { id: toastId });
      }
  };

  const rejectDraft = async (id: string) => {
      if(!confirm("Are you sure you want to delete this email draft?")) return;
      const { error } = await supabase.from("b2b_outreach").delete().eq("id", id);
      if (!error) {
          toast.success("Draft removed from queue.");
          fetchData();
      }
  };

  const drafts = outreach.filter(o => o.status === 'draft');
  const sent = outreach.filter(o => o.status === 'sent');

  return (
    <div className="p-10 pb-32 space-y-12 bg-[#fafafa] min-h-screen">
      {/* Strategic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-indigo-600/10 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 border border-indigo-100 shadow-sm">
              <Shield className="w-3.5 h-3.5" />
              Partnership Outreach
            </div>
          </div>
          <h1 className="text-6xl font-bold text-gray-900 tracking-tighter leading-none mb-6 uppercase">
            Outreach <span className="text-indigo-600">CRM</span>
          </h1>
          <p className="text-gray-500 font-medium max-w-2xl text-xl leading-snug italic">
            Automating the agency partnership pipeline. Identify luxury travel agencies and send personalized outreach campaigns.
          </p>
        </div>

        <div className="flex items-center gap-4">
             <Button 
                onClick={findAgencies} 
                disabled={researching} 
                variant="outline"
                className="gap-3 border-gray-200 text-gray-900 bg-white hover:bg-gray-50 font-bold uppercase tracking-widest text-[11px] h-16 px-10 rounded-[28px] shadow-sm transition-all"
            >
                {researching ? <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" /> : <Search className="w-5 h-5 text-indigo-600" />}
                Find Prospects
            </Button>
            <Button 
                onClick={generateAllDrafts} 
                disabled={generating}
                className="gap-3 bg-gray-900 hover:bg-black text-white font-bold uppercase tracking-widest text-[11px] h-16 px-10 rounded-[28px] shadow-2xl shadow-gray-200 transition-all border-none relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-emerald-500 opacity-20" />
                {generating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 text-emerald-400" />}
                Generate Drafts
            </Button>
        </div>
      </div>

      {/* Strategic Tabs */}
       <div className="flex flex-wrap gap-3 p-1.5 bg-gray-100/80 rounded-[32px] max-w-fit border border-gray-100 backdrop-blur-xl shrink-0">
          {[
              { id: 'drafts', label: 'Email Drafts', count: drafts.length, icon: FileEdit, color: 'indigo' },
              { id: 'sent', label: 'Sent History', count: sent.length, icon: Send, color: 'emerald' },
              { id: 'crm', label: 'Agency Directory', count: agencies.length, icon: Users, color: 'amber' },
              { id: 'analytics', label: 'Analytics', count: null, icon: TrendingUp, color: 'fuchsia' }
          ].map(tab => (
              <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-3 px-8 py-3 rounded-[24px] text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative overflow-hidden ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-2xl shadow-gray-200/50 scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
              >
                  <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? `text-${tab.color}-600` : ''} stroke-[2.5px]`} />
                  {tab.label}
                  {tab.count !== null && (
                    <span className={`ml-2 bg-${tab.color}-50 text-${tab.color}-600 py-1 px-3 rounded-full text-[10px] font-bold border border-${tab.color}-100 shadow-sm`}>
                        {tab.count}
                    </span>
                  )}
              </button>
          ))}
      </div>

      {/* Dynamic Command Surface */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
            {activeTab === "drafts" && (
                <motion.div 
                    key="drafts-tab"
                    initial={{ opacity: 0, scale: 0.98 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0.98 }} 
                    className="grid grid-cols-1 gap-10"
                >
                    {loading ? (
                       <div className="flex items-center justify-center py-40">
                           <RefreshCw className="w-16 h-16 text-indigo-600 animate-spin opacity-10" />
                       </div>
                    ) : drafts.length === 0 ? (
                        <div className="bg-white rounded-[48px] border-4 border-dashed border-gray-100 p-32 text-center shadow-inner group">
                             <div className="w-24 h-24 bg-gray-50 rounded-[40px] shadow-2xl flex items-center justify-center mx-auto mb-10 relative border border-gray-100 group-hover:rotate-12 transition-transform duration-700">
                                <Mail className="w-12 h-12 text-indigo-600" />
                                <div className="absolute -top-3 -right-3 w-10 h-10 bg-gray-900 rounded-2xl flex items-center justify-center shadow-xl">
                                    <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                                </div>
                            </div>
                            <h3 className="text-4xl font-bold text-gray-900 tracking-tighter uppercase italic mb-4">No Drafts Available</h3>
                            <p className="text-gray-400 max-w-sm mx-auto font-bold text-lg leading-snug italic mb-10">There are no pending outreach drafts in the queue. Search for agencies to begin prospecting.</p>
                            <Button onClick={findAgencies} className="h-16 px-12 bg-gray-900 hover:bg-black text-white rounded-[24px] font-bold uppercase text-[11px] tracking-widest shadow-2xl transition-all">Search for Prospects</Button>
                        </div>
                    ) : drafts.map((draft, i) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={draft.id} 
                            className="bg-white rounded-[48px] p-10 lg:p-12 shadow-xl shadow-gray-200/50 border border-gray-100 transition-all hover:shadow-2xl hover:shadow-gray-200 group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50/20 rounded-full -mr-40 -mt-40 blur-3xl group-hover:scale-125 transition-transform duration-1000" />
                            
                            <div className="flex flex-col lg:flex-row gap-16 relative z-10">
                                {/* Entity Intelligence Panel */}
                                <div className="lg:w-1/3 space-y-10 border-r border-gray-100 pr-12 lg:pr-16">
                                    <div>
                                        <div className="flex items-center justify-between mb-8">
                                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em] bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100 shadow-sm flex items-center gap-2">
                                                <Fingerprint className="w-3.5 h-3.5" />
                                                Agency Details
                                            </span>
                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 font-bold italic border border-gray-100 shadow-inner group-hover:rotate-6 transition-all duration-500">
                                                {draft.b2b_agencies?.name?.[0]}
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-4xl tracking-tighter mb-2 uppercase italic leading-none">{draft.b2b_agencies?.name || 'Unknown Agency'}</h3>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 bg-gray-50 px-4 py-1.5 rounded-xl border border-gray-100 uppercase tracking-tight">
                                                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                                                {draft.b2b_agencies?.website}
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 bg-gray-50 px-4 py-1.5 rounded-xl border border-gray-100 uppercase tracking-tight">
                                                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                                                {draft.b2b_agencies?.country}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-6">
                                         <div className="bg-gray-50/50 p-6 rounded-[32px] border border-gray-100 shadow-inner relative overflow-hidden group/box">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100/20 rounded-full -mr-12 -mt-12 blur-2xl group-hover/box:scale-150 transition-transform" />
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-3 relative z-10">
                                                <Layers className="w-4 h-4 text-indigo-600" /> 
                                                Market Analysis
                                            </p>
                                            <p className="text-sm font-bold text-gray-700 leading-relaxed tracking-tight relative z-10 italic">
                                                {draft.b2b_agencies?.kenya_gap || "Market analysis not available."}
                                            </p>
                                        </div>
                                        
                                        <div className="bg-emerald-50/30 p-6 rounded-[32px] border border-emerald-50 shadow-inner relative overflow-hidden group/box">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/20 rounded-full -mr-12 -mt-12 blur-2xl group-hover/box:scale-150 transition-transform" />
                                            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-3 relative z-10">
                                                <Zap className="w-4 h-4" /> 
                                                Strategy Notes
                                            </p>
                                            <p className="text-sm font-bold text-gray-800 leading-relaxed tracking-tight italic relative z-10">
                                                "{draft.b2b_agencies?.personalization_hook || "No specific notes available."}"
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Transmission Workshop */}
                                <div className="lg:w-2/3 flex flex-col pt-4">
                                     <div className="mb-10 bg-gray-900 rounded-[32px] p-6 text-white shadow-2xl shadow-gray-300 border border-gray-800 relative group/subject overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent translate-x-[-100%] group-hover/subject:translate-x-[100%] transition-transform duration-1000" />
                                        <div className="flex flex-col gap-3 relative z-10">
                                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-1">Subject Line</span>
                                            <h4 className="text-xl font-bold tracking-tight italic uppercase">{draft.email_subject}</h4>
                                        </div>
                                    </div>

                                    <div className="bg-white p-10 lg:p-12 rounded-[40px] border border-gray-100 text-lg text-gray-500 font-medium leading-relaxed prose prose-indigo max-w-none shadow-inner min-h-[350px] relative overflow-hidden group/body">
                                        <div className="absolute top-4 right-4 text-[9px] font-black text-gray-200 uppercase tracking-widest italic select-none">Holographic Projection Surface</div>
                                        <div className="relative z-10" dangerouslySetInnerHTML={{ __html: draft.email_body }} />
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-4 mt-12 pt-10 border-t-2 border-dashed border-gray-50">
                                         <Button 
                                            onClick={() => sendEmail(draft.id)} 
                                            className="h-16 flex-grow gap-4 bg-gray-900 hover:bg-black text-white rounded-[28px] font-bold uppercase tracking-[0.2em] text-[11px] shadow-2xl transition-all relative overflow-hidden group/btn"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-indigo-500 opacity-20 group-hover/btn:opacity-40 transition-opacity" />
                                            <Send className="w-5 h-5 transition-transform" /> 
                                            Send Outreach Email
                                        </Button>
                                        <Button variant="outline" className="h-16 w-16 flex items-center justify-center border-gray-200 text-gray-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50 rounded-[28px] shadow-sm transition-all group/edit">
                                            <FileEdit className="w-6 h-6 group-hover/edit:scale-110 transition-all" />
                                        </Button>
                                        <Button 
                                            onClick={() => rejectDraft(draft.id)} 
                                            variant="outline" 
                                            className="h-16 w-16 flex items-center justify-center border-rose-50 bg-rose-50/50 text-rose-400 hover:text-rose-600 hover:bg-rose-100 hover:border-rose-200 rounded-[28px] shadow-sm transition-all"
                                        >
                                            <XCircle className="w-6 h-6" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}
            
            {activeTab === "crm" && (
                <motion.div 
                    key="crm-tab"
                    initial={{ opacity: 0, y: 30 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -30 }} 
                    className="bg-white rounded-[64px] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden"
                >
                    <div className="p-10 lg:p-12 border-b border-gray-50 bg-[#fcfcfc] flex items-center justify-between">
                        <div>
                            <h3 className="text-3xl font-bold text-gray-900 tracking-tighter uppercase italic leading-none">Agency Directory</h3>
                            <p className="text-gray-400 font-bold text-sm tracking-tight mt-2 uppercase">Authenticated Travel Agency Database</p>
                        </div>
                        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm text-[10px] font-bold uppercase tracking-widest text-indigo-600">
                             <Database className="w-4 h-4" />
                             {agencies.length} Records Active
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[#fcfcfc] text-[10px] uppercase text-gray-300 font-bold tracking-[0.2em] border-b border-gray-50">
                                <tr>
                                    {["Agency Details", "Location", "Specialty", "Priority", ""].map(h => (
                                        <th key={h} className="px-10 py-6 font-bold">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-gray-600">
                                {agencies.map((agency, idx) => (
                                    <tr key={agency.id} className="group hover:bg-indigo-50/30 transition-all duration-300 cursor-default">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-lg font-bold text-gray-300 italic group-hover:bg-gray-900 group-hover:text-white transition-all">
                                                   {agency.name[0]}
                                               </div>
                                               <div className="flex flex-col">
                                                  <span className="font-bold text-gray-900 text-lg tracking-tighter group-hover:text-indigo-600 transition-colors uppercase italic leading-none">{agency.name}</span>
                                                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.1em] mt-2 italic flex items-center gap-2">
                                                      <Globe className="w-3 h-3" />
                                                      {agency.website}
                                                  </span>
                                               </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 font-black text-gray-500 text-xs uppercase tracking-widest">
                                            <div className="flex items-center gap-3">
                                                <MapPin className="w-4 h-4 text-indigo-400" />
                                                {agency.country}
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <span className="text-[10px] font-black bg-white text-indigo-600 px-4 py-2 rounded-xl border border-indigo-50 uppercase tracking-widest shadow-sm group-hover:border-indigo-200 transition-all">
                                                {agency.specialties || "Generalist Prospect"}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8">
                                             <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 w-fit group-hover:bg-white group-hover:border-indigo-100 transition-all">
                                                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                 <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 italic">High Probability</span>
                                             </div>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <button className="w-10 h-10 rounded-xl bg-gray-50 border border-transparent hover:border-indigo-100 hover:text-indigo-600 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {(activeTab === "sent" || activeTab === "analytics") && (
                <motion.div 
                    key="construct-tab"
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    className="bg-white rounded-[64px] border-4 border-dashed border-gray-100 p-40 text-center shadow-inner"
                >
                     <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 text-gray-200">
                        <Layout className="w-10 h-10" />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 tracking-tighter uppercase italic leading-none mb-4">Module Initializing</h3>
                    <p className="text-gray-400 max-w-sm mx-auto font-bold text-lg leading-snug italic">Sent history and analytics will be available once outreach campaigns are active.</p>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* Global Intelligence Stats Overlay */}
      <div className="fixed bottom-10 inset-x-10 z-50 pointer-events-none">
          <div className="max-w-7xl mx-auto flex justify-between items-end">
              <div className="bg-gray-900/90 backdrop-blur-3xl p-6 rounded-[32px] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.5)] flex gap-12 pointer-events-auto">
                    {[
                        { label: 'Outreach Efficiency', val: '84.2%', color: 'emerald' },
                        { label: 'Neural Precision', val: '98.9%', color: 'indigo' },
                        { label: 'Queue Load', val: '0.0ms', color: 'gray' }
                    ].map(stat => (
                        <div key={stat.label}>
                            <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] block mb-2">{stat.label}</span>
                            <div className="flex items-center gap-3">
                                <span className="text-xl font-black text-white italic">{stat.val}</span>
                                <div className={`w-1.5 h-6 bg-${stat.color}-500 rounded-full opacity-60 shadow-[0_0_10px_rgba(var(--${stat.color}-500),0.5)]`} />
                            </div>
                        </div>
                    ))}
              </div>

               <div className="bg-indigo-600 p-6 rounded-[32px] shadow-[0_40px_100px_rgba(79,70,229,0.4)] pointer-events-auto cursor-pointer hover:scale-110 active:scale-95 transition-all group">
                   <div className="flex items-center gap-4 text-white">
                        <div className="w-14 h-14 bg-white/20 rounded-[24px] flex items-center justify-center border border-white/20">
                            <Sparkles className="w-7 h-7 group-hover:rotate-12 transition-transform" />
                        </div>
                        <div className="pr-4">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 block">AI Concierge</span>
                            <span className="text-xl font-bold italic uppercase tracking-tight">Campaign Manager</span>
                        </div>
                   </div>
              </div>
          </div>
      </div>
    </div>
  );
}
