"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Search, 
  X, Upload, RefreshCw, AlertTriangle, FileText, ChevronRight,
  Globe, Clock, DollarSign, Users, Award, MapPin, Zap, Save, ImagePlus
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/formatters";
import { SafariPackage } from "@/types";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const USD_KES = 130;

type FormData = {
  name: string; slug: string; destination: string;
  duration_days: number; price_usd: number; price_kes: number;
  category: string; difficulty: string; group_size_min: number; group_size_max: number;
  highlights: string[]; inclusions: string[]; exclusions: string[];
  best_season: string[]; available: boolean; images: string[];
};

const empty: FormData = {
  name: "", slug: "", destination: "", duration_days: 3,
  price_usd: 0, price_kes: 0, category: "luxury", difficulty: "easy",
  group_size_min: 1, group_size_max: 12,
  highlights: [""], inclusions: [""], exclusions: [""],
  best_season: [], available: true, images: [],
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function ArrayField({ label, items, onChange }: { label: string; items: string[]; onChange: (v: string[]) => void }) {
  const add = () => onChange([...items, ""]);
  const update = (i: number, v: string) => { const a = [...items]; a[i] = v; onChange(a); };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={item} onChange={e => update(i, e.target.value)}
            className="flex-grow px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <button onClick={() => remove(i)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button onClick={add} className="text-xs font-bold text-primary hover:underline flex items-center gap-1 mt-1">
        <Plus className="w-3.5 h-3.5" /> Add {label}
      </button>
    </div>
  );
}

export default function PackagesPage() {
  const supabase = createClient();
  const [packages, setPackages] = useState<SafariPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SafariPackage | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<string | null>(null);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("packages").select("*").order("created_at", { ascending: false });
    setPackages((data as SafariPackage[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPackages(); }, [fetchPackages]);

  const openNew = () => { setEditing(null); setForm(empty); setModalOpen(true); };
  const openEdit = (pkg: SafariPackage) => {
    setEditing(pkg);
    setForm({
      name: pkg.name || "", 
      slug: pkg.slug || "", 
      destination: pkg.destination || "",
      duration_days: pkg.duration_days || 1, 
      price_usd: pkg.price_usd || 0, 
      price_kes: pkg.price_kes || 0,
      category: pkg.category || "standard", 
      difficulty: pkg.difficulty || "moderate",
      group_size_min: pkg.group_size_min || 1, 
      group_size_max: pkg.group_size_max || 12,
      highlights: (pkg.highlights || []).length ? pkg.highlights : [""],
      inclusions: (pkg.inclusions || []).length ? pkg.inclusions : [""],
      exclusions: (pkg.exclusions || []).length ? pkg.exclusions : [""],
      best_season: pkg.best_season || [], 
      available: pkg.available ?? true, 
      images: pkg.images || [],
    });
    setModalOpen(true);
  };

  const set = (key: keyof FormData, val: any) => {
    setForm(f => {
      const next = { ...f, [key]: val };
      if (key === "name") next.slug = slugify(String(val));
      if (key === "price_usd") next.price_kes = Math.round(Number(val) * USD_KES);
      return next;
    });
  };

  const toggleSeason = (m: string) => {
    setForm(f => ({
      ...f,
      best_season: f.best_season.includes(m) ? f.best_season.filter(s => s !== m) : [...f.best_season, m],
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of Array.from(e.target.files)) {
      const path = `packages/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("safari-images").upload(path, file, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from("safari-images").getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
    }
    setForm(f => ({ ...f, images: [...f.images, ...uploaded] }));
    setUploading(false);
  };

  const save = async () => {
    setSaving(true);
    const payload = {
      ...form,
      highlights: form.highlights.filter(Boolean),
      inclusions: form.inclusions.filter(Boolean),
      exclusions: form.exclusions.filter(Boolean),
    };
    if (editing) {
      await supabase.from("packages").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("packages").insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    fetchPackages();
  };

  const toggleAvailable = async (pkg: SafariPackage) => {
    await supabase.from("packages").update({ available: !pkg.available }).eq("id", pkg.id);
    fetchPackages();
  };

  const deletePackage = async (id: string) => {
    setDeleteConfirmOpen(false);
    const { error } = await supabase.from("packages").delete().eq("id", id);
    if (error) {
      alert("Cannot delete package. It may be linked to existing bookings or cost sheets.");
    }
    fetchPackages();
  };

  const filtered = packages.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.destination.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tighter">
            <div className="w-2 h-10 bg-gradient-to-b from-primary to-indigo-600 rounded-full hidden md:block" />
            Safari Asset Collections
          </h1>
          <p className="text-gray-500 mt-2 font-bold italic">
            Manage your high-yield safari offerings and destination IP.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-6 px-6 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm mr-4">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Assets</p>
              <p className="text-xl font-black text-gray-900 tracking-tighter leading-none">{packages.length}</p>
            </div>
            <div className="w-[1px] h-8 bg-gray-100" />
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Active Node</p>
              <p className="text-xl font-black text-emerald-600 tracking-tighter leading-none">{packages.filter(p => p.available).length}</p>
            </div>
          </div>
          <Button 
            onClick={openNew} 
            className="gap-2 bg-gray-900 hover:bg-black text-white font-black uppercase tracking-[0.2em] text-xs h-14 px-8 rounded-2xl transition-all shadow-2xl shadow-gray-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-5 h-5 stroke-[3px]" />
            Provision Asset
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden flex flex-col mb-12">
          <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex flex-wrap items-center justify-between gap-6">
               <div className="relative w-full max-w-md">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 stroke-[3px]" />
                    <input 
                        value={search} onChange={e => setSearch(e.target.value)} 
                        placeholder="Search assets by name or destination..."
                        className="w-full h-14 pl-14 pr-6 bg-white border border-gray-100 rounded-2xl text-sm font-bold tracking-tight shadow-inner focus:ring-4 focus:ring-primary/5 transition-all outline-none" 
                    />
               </div>
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-full border border-gray-100 shadow-sm text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
                    Last Sync: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
               </div>
          </div>

          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-white border-b border-gray-100">
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Asset Identity</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Locus / Target</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Duration Node</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Ledger Value</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Class Node</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Operational</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Sequencing</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {loading ? (
                        <tr><td colSpan={7} className="p-20 text-center"><RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto opacity-20"/></td></tr>
                    ) : filtered.length === 0 ? (
                        <tr><td colSpan={7} className="p-20 text-center text-gray-400 font-black uppercase tracking-[0.2em] italic">Null assets found in registry.</td></tr>
                    ) : filtered.map(pkg => (
                        <tr key={pkg.id} className="hover:bg-gray-50/50 transition-all group cursor-default border-b border-gray-50">
                            <td className="px-8 py-6">
                                <div className="flex items-center gap-6">
                                    {pkg.images[0] ? (
                                        <div className="relative w-24 h-16 rounded-[20px] overflow-hidden shadow-sm group-hover:shadow-xl transition-all duration-500 ring-2 ring-transparent group-hover:ring-primary/20">
                                            <Image src={pkg.images[0]} alt={pkg.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                                        </div>
                                    ) : (
                                        <div className="w-24 h-16 rounded-[20px] bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                    )}
                                    <div className="max-w-[280px]">
                                        <div className="font-black text-gray-900 truncate tracking-tighter text-[16px] leading-tight uppercase italic">
                                            {pkg.name || "Untitled_Asset"}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1.5 font-mono text-[9px] uppercase tracking-widest text-gray-400">
                                          <div className="w-1 h-1 rounded-full bg-gray-200" />
                                          {pkg.slug || "NULL_SLUG"}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-8 py-6">
                                <div className="flex items-center gap-3 font-black text-gray-900 text-[13px] tracking-tight uppercase">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    {pkg.destination}
                                </div>
                            </td>
                            <td className="px-8 py-6">
                                <div className="flex items-center gap-2 text-gray-500 font-black text-[11px] uppercase tracking-tight bg-gray-100/50 px-3 py-1.5 rounded-full border border-gray-100 w-fit">
                                    <Clock className="w-3 h-3" />
                                    {pkg.duration_days}D / {pkg.duration_days - 1}N
                                </div>
                            </td>
                            <td className="px-8 py-6">
                                <div className="space-y-0.5">
                                    <div className="font-black text-emerald-600 text-base tracking-tighter">{formatCurrency(pkg.price_usd, "USD")}</div>
                                    <div className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{formatCurrency(pkg.price_kes, "KES")} REF</div>
                                </div>
                            </td>
                            <td className="px-8 py-6">
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border shadow-sm ${
                                    pkg.category === 'luxury' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                                    pkg.category === 'budget' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                    'bg-gray-50 text-gray-500 border-gray-100'
                                }`}>
                                    {pkg.category} Node
                                </span>
                            </td>
                            <td className="px-8 py-6">
                                <button onClick={() => toggleAvailable(pkg)} className="transition-all hover:scale-105 active:scale-95 text-left">
                                    {pkg.available
                                        ? <div className="flex items-center gap-2.5 text-emerald-600 font-black text-[9px] uppercase tracking-[0.2em] bg-emerald-50/50 px-4 py-2 rounded-full border border-emerald-100 shadow-inner">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                            Active_Sync
                                          </div>
                                        : <div className="flex items-center gap-2.5 text-gray-400 font-black text-[9px] uppercase tracking-[0.2em] bg-gray-50 px-4 py-2 rounded-full border border-gray-100 shadow-inner">
                                            <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                                            Archived_Node
                                          </div>
                                    }
                                </button>
                            </td>
                            <td className="px-8 py-6 text-right space-x-2">
                                 <button onClick={() => openEdit(pkg)} className="w-10 h-10 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-all shadow-sm">
                                    <Edit2 className="w-4 h-4 mx-auto" />
                                 </button>
                                 <button 
                                    onClick={() => {
                                      setPackageToDelete(pkg.id);
                                      setDeleteConfirmOpen(true);
                                    }} 
                                    className="w-10 h-10 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all shadow-sm"
                                 >
                                    <Trash2 className="w-4 h-4 mx-auto" />
                                 </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
             </table>
          </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden bg-white border-0 shadow-2xl rounded-[40px]">
            <div className="flex flex-col h-full">
                {/* Elite Header */}
                <div className="px-12 py-10 bg-gray-900 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-2">
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            Asset Provisioning Terminal
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tighter">
                            {editing ? "Edit_Master_Asset" : "Provision_New_Asset"}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                         <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Status</p>
                            <p className="text-xs font-black text-emerald-400 tracking-widest leading-none uppercase">{form.available ? "LIVE_NODE" : "DRAFT_NODE"}</p>
                         </div>
                         <Button 
                            onClick={save} 
                            disabled={saving}
                            className="h-14 px-10 bg-white hover:bg-gray-100 text-gray-900 font-black uppercase tracking-[0.2em] text-xs rounded-2xl transition-all shadow-xl"
                        >
                            {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Execute Commit
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-16">
                    {/* Identity Matrix */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2 space-y-10">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1 block">Asset Identity</label>
                                <input 
                                    className="w-full bg-white border border-gray-100 p-8 rounded-[2rem] focus:ring-4 focus:ring-primary/10 transition-all text-3xl font-black text-gray-900 placeholder:text-gray-200 outline-none shadow-sm"
                                    value={form.name}
                                    onChange={e => set("name", e.target.value)}
                                    placeholder="Enter destination name..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1 block">Locus / Target Region</label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-primary transition-colors" />
                                        <input 
                                            className="w-full bg-gray-50/50 border border-gray-100 pl-16 pr-8 py-5 rounded-2xl focus:ring-4 focus:ring-primary/10 bg-white transition-all font-black text-gray-700 outline-none"
                                            value={form.destination}
                                            onChange={e => set("destination", e.target.value)}
                                            placeholder="e.g. Serengeti, Mara..."
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1 block">System Slug Node</label>
                                    <div className="relative group">
                                        <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-primary transition-colors" />
                                        <input 
                                            className="w-full border border-gray-100 pl-16 pr-8 py-5 rounded-2xl focus:ring-4 focus:ring-primary/10 bg-white transition-all font-mono text-xs text-gray-400"
                                            value={form.slug}
                                            onChange={e => set("slug", e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 bg-gray-50/50 p-10 rounded-[3rem] border border-gray-100 shadow-inner self-start">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary block">Ledger Value (USD)</label>
                                <div className="relative group">
                                    <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-500 group-focus-within:text-primary transition-colors" />
                                    <input 
                                        type="number"
                                        className="w-full bg-white border border-gray-100 pl-16 pr-8 py-6 rounded-[2rem] focus:ring-4 focus:ring-primary/10 transition-all font-black text-3xl text-gray-900 outline-none shadow-sm"
                                        value={form.price_usd}
                                        onChange={e => set("price_usd", Number(e.target.value))}
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest text-right pr-2">REF KES: {formatCurrency(form.price_kes, "KES")}</p>
                            </div>

                            <div className="pt-8 border-t border-gray-100 grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-gray-400 font-black uppercase tracking-widest text-[9px]"><Clock className="w-3.5 h-3.5" /> Duration</div>
                                    <div className="relative">
                                        <input type="number" value={form.duration_days} onChange={e => set("duration_days", Number(e.target.value))} className="w-full bg-white border border-gray-100 p-4 rounded-xl text-gray-900 text-lg font-black outline-none focus:ring-2 focus:ring-primary/10 transition-all pr-12" />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300">DAYS</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-gray-400 font-black uppercase tracking-widest text-[9px]"><Users className="w-3.5 h-3.5" /> Max Group</div>
                                    <div className="relative">
                                        <input type="number" value={form.group_size_max} onChange={e => set("group_size_max", Number(e.target.value))} className="w-full bg-white border border-gray-100 p-4 rounded-xl text-gray-900 text-lg font-black outline-none focus:ring-2 focus:ring-primary/10 transition-all pr-12" />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300">PAX</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Operational Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                        <div className="space-y-8 p-10 bg-white rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/20" />
                            <h3 className="text-xl font-black text-gray-900 tracking-tighter flex items-center gap-4">
                                <Award className="w-6 h-6 text-indigo-500 fill-indigo-500/10" />
                                EXPERIENCE_NODES
                            </h3>
                            <ArrayField label="Key Experiences" items={form.highlights} onChange={v => set("highlights", v)} />
                        </div>
                        <div className="space-y-8 p-10 bg-white rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/20" />
                            <h3 className="text-xl font-black text-gray-900 tracking-tighter flex items-center gap-4">
                                <Award className="w-6 h-6 text-emerald-500 fill-emerald-500/10" />
                                INCLUSION_LOGISTICS
                            </h3>
                            <ArrayField label="Inclusions" items={form.inclusions} onChange={v => set("inclusions", v)} />
                        </div>
                    </div>

                    {/* Seasonal Mapping */}
                    <div className="space-y-8 p-10 bg-gray-900 rounded-[3rem] text-white">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black tracking-tighter flex items-center gap-4">
                                <Globe className="w-6 h-6 text-amber-400" />
                                SEASONAL_OPERATIONAL_MATRIX
                            </h3>
                            <div className="text-[10px] font-black text-white/40 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/10">SELECT_OPTIMAL_MONTHS</div>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                            {MONTHS.map(m => (
                                <button key={m} onClick={() => toggleSeason(m)}
                                    className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all duration-500 ${form.best_season.includes(m) ? "bg-white text-gray-900 border-white shadow-xl scale-105" : "bg-black/40 border-white/10 text-white/40 hover:border-white/40 hover:text-white"}`}>
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Visual Assets */}
                    <div className="space-y-8 pb-32">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-black text-gray-900 tracking-tighter flex items-center gap-4 uppercase italic">
                                <ImagePlus className="w-6 h-6 text-primary" />
                                Visual_Asset_Vault
                            </h3>
                            <div className="px-5 py-2 bg-gray-50 border border-gray-100 rounded-full text-[10px] font-black text-gray-400 font-mono tracking-widest uppercase">Capacity: {form.images.length}/10</div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {form.images.map((img, i) => (
                                <div key={i} className="relative aspect-[4/3] rounded-[2rem] overflow-hidden group shadow-md border-4 border-white">
                                    <Image src={img} alt="" fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-sm">
                                        <button onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))} className="w-12 h-12 bg-red-500 rounded-2xl text-white hover:scale-110 active:scale-95 transition-all shadow-2xl flex items-center justify-center">
                                            <Trash2 className="w-6 h-6" />
                                        </button>
                                    </div>
                                    <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl text-[8px] font-black text-white uppercase tracking-[0.2em] border border-white/20">ASSET_0{i+1}</div>
                                </div>
                            ))}
                            {form.images.length < 10 && (
                                <label className="aspect-[4/3] rounded-[2rem] border-4 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all text-gray-400 hover:text-primary active:scale-98 group bg-gray-50/50">
                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center group-hover:shadow-xl transition-all mb-3 text-gray-300 group-hover:text-primary border border-gray-100">
                                        {uploading ? <RefreshCw className="w-7 h-7 animate-spin" /> : <Upload className="w-7 h-7" />}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">{uploading ? "ACQUIRING..." : "ADD_ASSET"}</span>
                                    <input type="file" className="hidden" multiple accept="image/*" onChange={handleImageUpload} />
                                </label>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="rounded-3xl border-0 shadow-2xl p-6">
          <DialogHeader>
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900 border-0">Are you absolutely sure?</DialogTitle>
            <DialogDescription className="text-gray-500 mt-2">
              This will permanently delete the package <span className="font-bold text-gray-900">"{packages.find(p => p.id === packageToDelete)?.name || "this package"}"</span>. 
              This action cannot be undone and will remove it from all public sections of the website.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-6 justify-end">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} className="rounded-xl border-gray-200">
              Cancel
            </Button>
            <Button 
              onClick={() => packageToDelete && deletePackage(packageToDelete)}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 font-bold"
            >
              Delete Permanently
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
