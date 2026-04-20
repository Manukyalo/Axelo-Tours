"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Search, RefreshCw, CheckCircle2, XCircle, 
  Trash2, Edit2, Globe, Mail, User, Shield, 
  Plus, ExternalLink, Key, AlertTriangle, Filter, Headphones, TrendingUp
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

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "platinum": return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "gold": return "bg-amber-100 text-amber-700 border-amber-200";
      case "silver": return "bg-slate-100 text-slate-700 border-slate-200";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-emerald-100 text-emerald-700";
      case "rejected": return "bg-red-100 text-red-700";
      case "pending": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Enterprise Partners
          </h1>
          <p className="text-gray-500 mt-2">
            Manage B2B relationships, approval workflows, and API access.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
          <button 
            onClick={() => setFilterStatus("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === "all" ? "bg-gray-900 text-white shadow-lg" : "text-gray-500 hover:bg-gray-50"}`}
          >All</button>
          <button 
            onClick={() => setFilterStatus("pending")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === "pending" ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:bg-gray-50"}`}
          >Pending</button>
          <button 
            onClick={() => setFilterStatus("approved")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === "approved" ? "bg-emerald-600 text-white shadow-lg" : "text-gray-500 hover:bg-gray-50"}`}
          >Approved</button>
        </div>
      </div>

      {/* Main Grid/Table */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              value={search} onChange={e => setSearch(e.target.value)} 
              placeholder="Search by company, contact or email..."
              className="w-full pl-12 pr-4 h-12 border border-gray-100 rounded-2xl text-sm bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm" 
            />
          </div>
          <button 
            onClick={fetchPartners}
            className="p-3 text-gray-400 hover:text-primary transition-colors bg-white border border-gray-100 rounded-xl"
            title="Refresh list"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin text-primary" : ""}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white border-b border-gray-50">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Partner Details</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Location & Pax</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Type & Tier</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && partners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-gray-400">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 opacity-20" />
                    <p className="font-medium">Loading partners...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-gray-400 font-medium">
                    No partners found matching your criteria.
                  </td>
                </tr>
              ) : filtered.map(partner => (
                <tr key={partner.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center font-black text-primary text-xl shadow-inner">
                        {partner.company_name[0]}
                      </div>
                      <div>
                        <h3 className="font-black text-gray-900 group-hover:text-primary transition-colors">{partner.company_name}</h3>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-[10px] font-medium text-gray-500">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-gray-400" /> {partner.email}</span>
                          {partner.phone && <span className="flex items-center gap-1"><Headphones className="w-3 h-3 text-gray-400" /> {partner.phone}</span>}
                          {partner.website && (
                             <a href={partner.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                                <Globe className="w-3 h-3 text-gray-400" /> Website
                             </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                        <Globe className="w-3 h-3 text-gray-400" />
                        {partner.country || "Not specified"}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500">
                        <TrendingUp className="w-3 h-3" />
                        {partner.annual_pax ? `${partner.annual_pax.toLocaleString()} pax/year` : "Volume N/A"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="space-y-1.5 text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 uppercase tracking-tighter w-12 underline decoration-gray-100">Type</span>
                        <span className="text-gray-900 capitalize">{partner.partner_type?.replace("_", " ") || "n/a"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 uppercase tracking-tighter w-12 underline decoration-gray-100">Tier</span>
                        <span className={`px-2 py-0.5 rounded-md border ${getTierColor(partner.tier)} uppercase text-[9px] tracking-widest`}>
                          {partner.tier}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${getStatusColor(partner.status)}`}>
                      {partner.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {partner.status === "pending" && (
                        <>
                          <button 
                            onClick={() => updatePartner(partner.id, { status: "approved" })}
                            className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors shadow-sm"
                            title="Approve Partner"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => updatePartner(partner.id, { status: "rejected" })}
                            className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors shadow-sm"
                            title="Reject Partner"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => setEditingPartner(partner)}
                        className="p-2.5 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-primary hover:border-primary/20 transition-all shadow-sm"
                        title="Edit Settings"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => {
                          setPartnerToDelete(partner);
                          setDeleteConfirmOpen(true);
                        }}
                        className="p-2.5 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-100 transition-all shadow-sm ml-2"
                        title="Remove Partner"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Partner Modal */}
      <Dialog open={!!editingPartner} onOpenChange={() => setEditingPartner(null)}>
        <DialogContent className="max-w-xl rounded-[32px] p-8 border-0 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-4">
               <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
               </div>
               <div>
                  <DialogTitle className="text-xl font-black">Partner Configuration</DialogTitle>
                  <p className="text-xs text-gray-500">Managing {editingPartner?.company_name}</p>
               </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Assigned Tier</label>
                <select 
                  className="w-full h-12 px-4 rounded-xl border border-gray-100 bg-gray-50 font-bold focus:ring-4 focus:ring-primary/10 outline-none"
                  value={editingPartner?.tier}
                  onChange={e => editingPartner && setEditingPartner({...editingPartner, tier: e.target.value as any})}
                >
                  <option value="silver">Silver Tier (Base)</option>
                  <option value="gold">Gold Tier (Preferred)</option>
                  <option value="platinum">Platinum Tier (VVIP)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Verification Status</label>
                <select 
                  className="w-full h-12 px-4 rounded-xl border border-gray-100 bg-gray-50 font-bold focus:ring-4 focus:ring-primary/10 outline-none"
                  value={editingPartner?.status}
                  onChange={e => editingPartner && setEditingPartner({...editingPartner, status: e.target.value as any})}
                >
                  <option value="pending">Pending Review</option>
                  <option value="approved">Approved / Active</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">System API Key</label>
              <div className="flex gap-2">
                <input 
                  readOnly
                  className="flex-1 h-12 px-4 rounded-xl border border-gray-100 bg-gray-100 text-xs font-mono text-gray-500 outline-none"
                  value={editingPartner?.api_key || "No key generated yet"}
                />
                <Button 
                   onClick={() => editingPartner && generateApiKey(editingPartner)}
                   variant="outline" className="h-12 rounded-xl px-4 border-gray-100 hover:bg-gray-50"
                >
                   <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[9px] text-gray-400 mt-2">API keys provide programmatic access to B2B net rates and bookings.</p>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              {editingPartner?.status === 'pending' && (
                <Button 
                  className="w-full h-12 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                  onClick={() => editingPartner && handleApprove(editingPartner)}
                  disabled={isSaving}
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Approve & Send Welcome Email
                    </>
                  )}
                </Button>
              )}
              
              <div className="flex gap-3">
                <Button 
                  className="flex-1 h-12 rounded-2xl bg-gray-900 text-white font-bold hover:bg-gray-800"
                  onClick={() => editingPartner && updatePartner(editingPartner.id, { 
                    tier: editingPartner.tier, 
                    status: editingPartner.status,
                    api_key: editingPartner.api_key
                  })}
                  disabled={isSaving}
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </Button>
                <Button 
                  variant="ghost" className="h-12 rounded-2xl flex-1"
                  onClick={() => setEditingPartner(null)}
                >Cancel</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="rounded-[32px] border-0 shadow-2xl p-8">
          <DialogHeader>
            <div className="w-16 h-16 bg-red-100 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <DialogTitle className="text-2xl font-black text-gray-900">Confirm Partner Deletion</DialogTitle>
            <DialogDescription className="text-gray-500 mt-2">
              Are you sure you want to remove <span className="font-black text-gray-900">"{partnerToDelete?.company_name}"</span>? 
              This will revoke their API access and remove them from the partnership registry. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 mt-8">
            <Button 
              variant="ghost"
              onClick={() => setDeleteConfirmOpen(false)}
              className="flex-1 h-12 rounded-2xl border border-gray-100 font-bold hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => partnerToDelete && deletePartner(partnerToDelete.id)}
              className="flex-1 h-12 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-200"
            >
              Confirm Dismissal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
