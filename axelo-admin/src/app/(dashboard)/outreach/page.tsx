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
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Target className="h-8 w-8 text-primary" />
            Global B2B Outreach Agent
          </h1>
          <p className="text-gray-500 mt-2">
            AI-powered agency prospecting, automated personalized emails, and partnership CRM.
          </p>
        </div>
        <div className="flex items-center gap-3">
            <Button onClick={findAgencies} disabled={researching} variant="outline" className="gap-2 bg-white rounded-xl h-12 shadow-sm border-gray-200">
                {researching ? <RefreshCw className="w-4 h-4 animate-spin text-primary" /> : <Search className="w-4 h-4 text-primary" />}
                Find Agencies
            </Button>
            <Button onClick={generateAllDrafts} disabled={generating} className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl h-12 shadow-lg shadow-primary/20">
                {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                Batch Generate Pitches
            </Button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex flex-wrap gap-2 mb-8 bg-gray-100 p-1.5 rounded-2xl max-w-fit">
          {[
              { id: 'drafts', label: 'AI Drafts', count: drafts.length, icon: FileEdit },
              { id: 'sent', label: 'Outbox', count: sent.length, icon: Send },
              { id: 'crm', label: 'Agents Pipeline', count: agencies.length, icon: Users },
              { id: 'analytics', label: 'Analytics', count: null, icon: TrendingUp }
          ].map(tab => (
              <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                  <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary' : ''}`} />
                  {tab.label}
                  {tab.count !== null && <span className="ml-1 bg-gray-100/50 text-gray-500 py-0.5 px-2 rounded-full text-xs">{tab.count}</span>}
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
                    <div key={draft.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="md:w-1/3 border-r border-gray-100 pr-6">
                                <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-1 rounded-full mb-4 inline-block">Review Required</span>
                                <h3 className="font-bold text-gray-900 text-lg mb-1">{draft.b2b_agencies?.name || 'Unknown Agency'}</h3>
                                <p className="text-sm text-gray-500 mb-4 truncate">{draft.b2b_agencies?.website}</p>
                                
                                <div className="space-y-3 mt-6">
                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <p className="text-xs text-gray-400 font-bold uppercase mb-1 flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Target Gap</p>
                                        <p className="text-sm text-gray-700">{draft.b2b_agencies?.kenya_gap}</p>
                                    </div>
                                    <div className="bg-primary/5 p-3 rounded-xl border border-primary/10">
                                        <p className="text-xs text-primary/60 font-bold uppercase mb-1 flex items-center gap-1.5"><Activity className="w-3 h-3" /> Icebreaker</p>
                                        <p className="text-sm text-gray-800">{draft.b2b_agencies?.personalization_hook}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="md:w-2/3 flex flex-col">
                                <div className="mb-4 bg-gray-50 flex items-center gap-2 p-3 rounded-xl border border-gray-100 text-sm">
                                    <span className="font-bold text-gray-500 w-16">Subject:</span>
                                    <span className="font-medium text-gray-900 truncate">{draft.email_subject}</span>
                                </div>
                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 text-sm text-gray-700 font-medium leading-relaxed prose prose-sm prose-p:my-2 min-h-[150px] overflow-y-auto" dangerouslySetInnerHTML={{ __html: draft.email_body }}>
                                </div>
                                
                                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100">
                                    <Button onClick={() => sendEmail(draft.id)} className="gap-2 bg-green-500 hover:bg-green-600 text-white rounded-xl flex-grow shadow-lg shadow-green-500/20">
                                        <CheckCircle className="w-4 h-4" /> Approve & Send via Resend
                                    </Button>
                                    <Button variant="outline" className="gap-2 bg-white text-gray-700 hover:text-gray-900 rounded-xl">
                                        <FileEdit className="w-4 h-4 text-blue-500" /> Edit Copy
                                    </Button>
                                    <Button onClick={() => rejectDraft(draft.id)} variant="outline" className="gap-2 bg-red-50 text-red-600 hover:bg-red-100 border-red-100 hover:text-red-700 rounded-xl">
                                        <XCircle className="w-4 h-4" /> Reject
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </motion.div>
        )}
        
        {activeTab === "crm" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-400 font-bold border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4">Agency / Prospect</th>
                            <th className="px-6 py-4">Location</th>
                            <th className="px-6 py-4">Specialties</th>
                            <th className="px-6 py-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-600">
                        {agencies.map(agency => (
                            <tr key={agency.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900 truncate">{agency.name}</div>
                                    <div className="text-xs text-gray-400 truncate mt-1">{agency.website}</div>
                                </td>
                                <td className="px-6 py-4 text-gray-500">{agency.country}</td>
                                <td className="px-6 py-4">
                                    <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded inline-block truncate max-w-[200px]">{agency.specialties}</div>
                                </td>
                                <td className="px-6 py-4">
                                     <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700">
                                         PROSPECT
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
