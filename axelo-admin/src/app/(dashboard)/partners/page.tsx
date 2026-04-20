"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Search, RefreshCw, CheckCircle2, XCircle, 
  Trash2, Edit2, Globe, Mail, User, Shield, 
  Plus, ExternalLink, Key, AlertTriangle, Filter, Headphones, TrendingUp,
  Briefcase, Activity, ShieldCheck, Zap, ArrowUpRight, ChevronRight,
  Target, Award, Network
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Partner } from "@/types";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { approvePartnerAction } from "@/lib/actions/partners";

export default function PartnersPage() {
  const supabase = createClient();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState<Partner | null>(null);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("partners")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Failed to load partners");
    } else {
      setPartners(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleApprove = async (partner: Partner) => {
    setIsSaving(true);
    try {
      const result = await approvePartnerAction(partner.id, { 
        tier: partner.tier,
        api_key: partner.api_key || `axp_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`
      });
      if (result.success) {
        toast.success("Partner approved and notification sent!");
        fetchPartners();
        setEditingPartner(null);
      }
    } catch (error) {
      toast.error("Approval failed. Check permissions.");
    }
    setIsSaving(false);
  };

  const updatePartner = async (id: string, updates: Partial<Partner>) => {
    setIsSaving(true);
    const { error } = await supabase
      .from("partners")
      .update(updates)
      .eq("id", id);
    
    if (error) {
      toast.error("Update failed");
    } else {
      toast.success("Partner updated successfully");
      fetchPartners();
      setEditingPartner(null);
    }
    setIsSaving(false);
  };

  const deletePartner = async (id: string) => {
    const { error } = await supabase
      .from("partners")
      .delete()
      .eq("id", id);
    
    if (error) {
      toast.error("Check if partner has active quotes before deleting");
    } else {
      toast.success("Partner removed");
      fetchPartners();
    }
    setDeleteConfirmOpen(false);
  };

  const generateApiKey = async (partner: Partner) => {
    const newKey = `axp_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    await updatePartner(partner.id, { api_key: newKey });
  };

  const filtered = partners.filter(p => {
    const matchesSearch = p.company_name.toLowerCase().includes(search.toLowerCase()) || 
                          p.contact_name.toLowerCase().includes(search.toLowerCase()) ||
                          p.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterStatus === "all" || p.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "platinum": return { label: "Platinum Elite", class: "bg-indigo-600 text-white shadow-indigo-100", icon: Award };
      case "gold": return { label: "Gold Global", class: "bg-amber-500 text-white shadow-amber-100", icon: Target };
      case "silver": return { label: "Silver Node", class: "bg-slate-900 text-white shadow-slate-100", icon: Network };
      default: return { label: "Generic Unit", class: "bg-gray-400 text-white shadow-gray-100", icon: Briefcase };
    }
  };

  return (
    <div className="p-8 space-y-10 bg-[#fafafa] min-h-screen">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-indigo-600/10 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <Network className="w-3 h-3" />
              Global Partner Network Manifest
            </div>
          </div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter leading-none mb-4 uppercase">
            Affiliate <span className="text-indigo-600 italic">Network</span>
          </h1>
          <p className="text-gray-500 font-medium max-w-xl text-lg leading-relaxed italic">
            Synchronizing B2B relationships, multi-tier commission protocols, and high-velocity API access nodes across the Axelo ecosystem.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4">
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Network Integrity</span>
                <span className="text-sm font-black text-emerald-600 flex items-center gap-2 tracking-tighter">
                  <ShieldCheck className="w-4 h-4" />
                  Verified Access Only
                </span>
             </div>
             <div className="w-px h-8 bg-gray-100 mx-2" />
             <Button onClick={fetchPartners} className="w-12 h-12 bg-gray-900 hover:bg-black text-white rounded-2xl shadow-xl shadow-gray-200 transition-all flex items-center justify-center p-0">
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
             </Button>
          </div>
        </div>
      </div>

      {/* Strategic KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Active Nodes", value: String(partners.filter(p => p.status === 'approved').length), icon: Network, color: "indigo", trend: "Mainframe Link" },
          { label: "Queue Volume", value: String(partners.filter(p => p.status === 'pending').length), icon: Activity, color: "amber", trend: "Neural Review" },
          { label: "Platinum Tier", value: String(partners.filter(p => p.tier === 'platinum').length), icon: Award, color: "fuchsia", trend: "VVIP Logistics" },
          { label: "Network Growth", value: "+12.4%", icon: TrendingUp, color: "emerald", trend: "Q2 Momentum" },
        ].map(({ label, value, icon: Icon, color, trend }) => (
          <div key={label} className="group bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-50/50 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-150 transition-transform duration-700`} />
            
            <div className="flex items-start justify-between mb-8 relative z-10">
              <div className={`w-14 h-14 rounded-2xl bg-${color}-50 flex items-center justify-center text-${color}-600 shadow-sm group-hover:scale-110 transition-all duration-500`}>
                <Icon className="w-7 h-7" />
              </div>
              <div className="bg-gray-50 px-3 py-1 rounded-full text-[9px] font-black text-gray-400 group-hover:bg-white group-hover:shadow-sm transition-all uppercase tracking-widest leading-none">
                {trend}
              </div>
            </div>

            <div className="relative z-10">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 leading-none">{label}</p>
              <h3 className="text-4xl font-black text-gray-900 tracking-tighter">
                {value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Manifest registry */}
      <div className="space-y-6">
          <div className="flex items-center justify-between gap-6 flex-wrap">
              <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
                  <button onClick={() => setFilterStatus("all")} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === "all" ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>Global Manifest</button>
                  <button onClick={() => setFilterStatus("pending")} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === "pending" ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>Neural Queue</button>
                  <button onClick={() => setFilterStatus("approved")} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === "approved" ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>Verified Nodes</button>
              </div>

              <div className="flex-1 max-w-md relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input 
                  value={search} onChange={e => setSearch(e.target.value)} 
                  placeholder="Identify partner unit..."
                  className="w-full pl-14 pr-6 h-14 border border-gray-100 rounded-[20px] text-sm bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold tracking-tight shadow-sm placeholder:text-gray-300" 
                />
              </div>

              <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                  <Activity className="w-3.5 h-3.5 text-indigo-500" />
                  {filtered.length} Affiliate Units Active
              </div>
          </div>

          <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden relative">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#fcfcfc] text-[10px] uppercase text-gray-400 font-bold tracking-[0.2em] border-b border-gray-100">
                  <tr>
                    <th className="px-10 py-7">Partner Identity</th>
                    <th className="px-8 py-7">Geo-Location</th>
                    <th className="px-8 py-7">Capacity (PAX)</th>
                    <th className="px-8 py-7">Tier Protocol</th>
                    <th className="px-8 py-7 text-right">Operational Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading && partners.length === 0 ? (
                    <tr><td colSpan={5} className="px-8 py-32 text-center"><RefreshCw className="w-12 h-12 animate-spin text-indigo-600 mx-auto opacity-10" /></td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={5} className="px-8 py-40 text-center text-gray-300 font-black uppercase text-[11px] tracking-[0.4em] italic opacity-50">Zero Partnership Signals Detected.</td></tr>
                  ) : filtered.map(partner => (
                    <tr key={partner.id} className="group hover:bg-[#fafafa] transition-all duration-300">
                      <td className="px-10 py-7">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-[24px] bg-gray-900 border-4 border-white flex items-center justify-center font-black text-white text-2xl shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 italic">
                                {partner.company_name[0]}
                            </div>
                            <div>
                                <span className="font-black text-gray-900 tracking-tighter text-xl uppercase italic block underline decoration-gray-100">{partner.company_name}</span>
                                <div className="flex items-center gap-3 mt-1.5">
                                   <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                      {partner.email}
                                   </div>
                                </div>
                            </div>
                        </div>
                      </td>
                      <td className="px-8 py-7">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1.5">Region</span>
                            <div className="flex items-center gap-2 font-black text-gray-800 tracking-tighter text-sm uppercase">
                               <Globe className="w-3.5 h-3.5 text-indigo-500" />
                               {partner.country || "Global Link"}
                            </div>
                        </div>
                      </td>
                      <td className="px-8 py-7">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1.5">Annual Signal</span>
                            <div className="flex items-center gap-2 font-black text-indigo-600 tracking-tighter text-sm">
                               <TrendingUp className="w-3.5 h-3.5" />
                               {partner.annual_pax ? `${partner.annual_pax.toLocaleString()} Units` : "Volume N/A"}
                            </div>
                        </div>
                      </td>
                      <td className="px-8 py-7">
                        {(() => {
                           const tier = getTierBadge(partner.tier);
                           const Icon = tier.icon;
                           return (
                             <div className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-[20px] text-[10px] font-black uppercase tracking-widest ${tier.class}`}>
                                <Icon className="w-4 h-4" />
                                {tier.label}
                             </div>
                           );
                        })()}
                      </td>
                      <td className="px-10 py-7 text-right">
                        <div className="flex items-center justify-end gap-3">
                            <span className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border shadow-sm transition-all ${
                              partner.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              partner.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' :
                              'bg-rose-50 text-rose-600 border-rose-100'
                            }`}>
                              {partner.status === 'approved' ? <ShieldCheck className="w-3.5 h-3.5" /> : partner.status === 'pending' ? <Activity className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                              {partner.status}
                            </span>
                            
                            <button 
                                onClick={() => setEditingPartner(partner)}
                                className="p-3 bg-white hover:bg-gray-900 border border-gray-100 hover:border-gray-900 text-gray-400 hover:text-white rounded-2xl shadow-sm transition-all duration-300 group/btn"
                            >
                                <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      </div>

      {/* Edit Partner Modal Overhaul */}
      <Dialog open={!!editingPartner} onOpenChange={() => setEditingPartner(null)}>
        <DialogContent className="max-w-xl rounded-[48px] p-0 border-none shadow-3xl overflow-hidden bg-gray-50">
          <div className="p-10 bg-white border-b border-gray-100">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                   <div className="w-16 h-16 bg-indigo-600 flex items-center justify-center font-black text-white text-2xl rounded-[24px] shadow-2xl shadow-indigo-100 italic">
                    {editingPartner?.company_name[0]}
                   </div>
                   <div>
                      <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">{editingPartner?.company_name}</h2>
                      <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">{editingPartner?.email}</p>
                   </div>
                </div>
                <button onClick={() => setEditingPartner(null)} className="p-3 hover:bg-gray-50 rounded-full transition-colors">
                  <XCircle className="w-6 h-6 text-gray-300" />
                </button>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100">
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">Partner Tier Protocol</span>
                   <select 
                      className="w-full bg-transparent font-black text-gray-900 text-lg tracking-tighter outline-none cursor-pointer"
                      value={editingPartner?.tier}
                      onChange={e => editingPartner && setEditingPartner({...editingPartner, tier: e.target.value as any})}
                    >
                      <option value="silver">Silver Node (Base)</option>
                      <option value="gold">Gold Global (Mid)</option>
                      <option value="platinum">Platinum Elite (High)</option>
                    </select>
                </div>
                <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100">
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">Integrity Status</span>
                   <select 
                      className="w-full bg-transparent font-black text-gray-900 text-lg tracking-tighter outline-none cursor-pointer"
                      value={editingPartner?.status}
                      onChange={e => editingPartner && setEditingPartner({...editingPartner, status: e.target.value as any})}
                    >
                      <option value="pending">Neural Review</option>
                      <option value="approved">Verified Unit</option>
                      <option value="rejected">Blacklisted</option>
                    </select>
                </div>
             </div>
          </div>
          
          <div className="p-10 space-y-8">
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 block">Neural API Key Authorization</label>
              <div className="flex gap-3 bg-white p-2 rounded-[24px] border border-gray-100 shadow-inner">
                <input 
                  readOnly
                  className="flex-1 px-4 text-xs font-mono text-gray-400 outline-none bg-transparent"
                  value={editingPartner?.api_key || "UNASSIGNED_LOGISTICS_TOKEN"}
                />
                <Button 
                   onClick={() => editingPartner && generateApiKey(editingPartner)}
                   className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-6 h-12 shadow-lg shadow-indigo-100 transition-all font-black uppercase text-[10px] tracking-widest"
                >
                   <RefreshCw className={`w-4 h-4 mr-2 ${isSaving ? 'animate-spin' : ''}`} />
                   Regenerate
                </Button>
              </div>
              <p className="text-[9px] text-gray-400 mt-3 italic">Authorized nodes gain programmatic access to high-fidelity rate sheets.</p>
            </div>

            <div className="flex flex-col gap-4">
               <Button 
                  className="w-full h-16 rounded-[24px] bg-gray-900 text-white font-black uppercase text-[11px] tracking-[0.2em] hover:bg-black shadow-2xl shadow-gray-200 transition-all"
                  onClick={() => editingPartner && updatePartner(editingPartner.id, { 
                    tier: editingPartner.tier, 
                    status: editingPartner.status,
                    api_key: editingPartner.api_key
                  })}
                  disabled={isSaving}
                >
                  {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Commit Calibration changes"}
                </Button>

                <div className="flex items-center gap-4">
                   {editingPartner?.status === 'pending' && (
                     <Button 
                        className="flex-1 h-14 rounded-[20px] bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-100"
                        onClick={() => editingPartner && handleApprove(editingPartner)}
                     >
                        Finalize Verification
                     </Button>
                   )}
                   <Button 
                      className="flex-1 h-14 rounded-[20px] bg-rose-50 text-rose-600 hover:bg-rose-100 font-black uppercase text-[10px] tracking-widest border border-rose-100"
                      onClick={() => {
                         setPartnerToDelete(editingPartner);
                         setDeleteConfirmOpen(true);
                       }}
                    >
                      Decommission Node
                   </Button>
                </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Overhaul */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md rounded-[48px] border-none shadow-3xl p-10 bg-white">
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-rose-100 rounded-[32px] flex items-center justify-center mb-8 shadow-xl shadow-rose-50">
              <AlertTriangle className="w-10 h-10 text-rose-600" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter mb-4 uppercase">Irreversible <span className="text-rose-600 italic">Dismissal</span></h2>
            <p className="text-gray-500 font-medium leading-relaxed italic">
              You are about to decomission the affiliate node <span className="font-black text-gray-900">"{partnerToDelete?.company_name}"</span>. 
              This action will sever all API links and revoke ecosystem privileges.
            </p>
            
            <div className="flex w-full gap-4 mt-10">
              <Button 
                variant="ghost"
                onClick={() => setDeleteConfirmOpen(false)}
                className="flex-1 h-14 rounded-[20px] font-black uppercase text-[10px] tracking-widest text-gray-400 hover:bg-gray-50 border border-gray-100"
              >
                Abort
              </Button>
              <Button 
                onClick={() => partnerToDelete && deletePartner(partnerToDelete.id)}
                className="flex-1 h-14 rounded-[20px] bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-100"
              >
                Execute dismissal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
