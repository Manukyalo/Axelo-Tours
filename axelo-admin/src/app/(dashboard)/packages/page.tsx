"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Search, 
  X, Upload, RefreshCw, AlertTriangle, FileText, ChevronRight,
  Globe, Clock, DollarSign, Users, Award, MapPin, Zap, Save, ImagePlus,
  Database, Activity, Sparkles
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/formatters";
import { SafariPackage } from "@/types";
import { z } from "zod";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  OperationalHeader, 
  AssetBadge, 
  MonoSection, 
  TacticalButton, 
  MissionCard, 
  ManifestSequence 
} from "@/components/OperationalComponents";
import { cn } from "@/lib/utils";

const USD_KES = 130;

type FormData = {
  name: string; slug: string; destination: string;
  duration_days: number; price_usd: number; price_kes: number;
  category: string; difficulty: string; group_size_min: number; group_size_max: number;
  highlights: string[]; inclusions: string[]; exclusions: string[];
  best_season: string[]; available: boolean; images: string[];
};

const PackageSchema = z.object({
  name: z.string().min(5, "Package name must be at least 5 characters"),
  slug: z.string().min(3, "URL slug is required"),
  destination: z.string().min(3, "Destination is required"),
  duration_days: z.number().min(1, "Minimum duration is 1 day"),
  price_usd: z.number().min(1, "Price must be greater than 0"),
  price_kes: z.number().min(1),
  category: z.string().min(1),
  difficulty: z.string().min(1),
  group_size_min: z.number().min(1),
  group_size_max: z.number().min(1, "Maximum group size is required"),
  highlights: z.array(z.string().min(1)).min(1, "At least one highlight is required"),
  inclusions: z.array(z.string().min(1)).min(1, "Package inclusions are required"),
  exclusions: z.array(z.string()),
  best_season: z.array(z.string()).min(1, "At least one month must be selected"),
  available: z.boolean(),
  images: z.array(z.string()).min(1, "At least one image is required"),
});

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ManifestSequence now handles array fields with higher fidelity

export default function PackagesPage() {
  const supabase = createClient();
  const empty: FormData = {
    name: "", slug: "", destination: "", duration_days: 3,
    price_usd: 0, price_kes: 0, category: "luxury", difficulty: "easy",
    group_size_min: 1, group_size_max: 12,
    highlights: [""], inclusions: [""], exclusions: [""],
    best_season: [], available: true, images: [],
  };

  const [packages, setPackages] = useState<SafariPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SafariPackage | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
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
    setErrors({});
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
    setErrors({});
    const payload = {
      ...form,
      highlights: form.highlights.filter(Boolean),
      inclusions: form.inclusions.filter(Boolean),
      exclusions: form.exclusions.filter(Boolean),
    };

    const validation = PackageSchema.safeParse(payload);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((err: z.ZodIssue) => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      toast.error("Validation Error: Please check all required fields.");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await supabase.from("packages").update(payload).eq("id", editing.id);
        toast.success("Package updated successfully.");
      } else {
        await supabase.from("packages").insert(payload);
        toast.success("New package created successfully.");
      }
      setModalOpen(false);
      fetchPackages();
    } catch (error) {
      toast.error("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
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
    <div className="p-8 space-y-10 bg-background min-h-screen">
      <OperationalHeader 
        title="Asset Portfolio" 
        subtitle="Operational Manifests & Inventory"
        icon={Database}
        actions={
          <TacticalButton onClick={openNew} icon={Plus}>
            Create New Asset
          </TacticalButton>
        }
      />

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative group flex-grow max-w-md">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-primary transition-colors" />
                <input 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    placeholder="Search packages..."
                    className="w-full h-14 pl-16 pr-6 bg-white border border-gray-100 rounded-[24px] text-sm font-bold tracking-tight shadow-sm focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none" 
                />
            </div>
            
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                {packages.length} Packages Active
            </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-[40px] border border-gray-50 shadow-sm flex flex-col items-center justify-center py-32 gap-6">
             <div className="relative">
                 <RefreshCw className="w-12 h-12 animate-spin text-primary/20" />
             </div>
             <p className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">Loading Packages...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm flex flex-col items-center justify-center py-32 gap-8">
            <div className="w-24 h-24 rounded-[36px] bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-200">
               <Database className="w-12 h-12" />
             </div>
            <div className="text-center space-y-2">
                <p className="text-lg font-bold text-gray-900 uppercase tracking-tight">No Packages Found</p>
                <p className="text-sm font-medium text-gray-400 max-w-[250px] mx-auto">No packages matching your search were found in the database.</p>
            </div>
            <Button onClick={openNew} variant="outline" className="rounded-2xl border-gray-100 font-bold px-8 h-12">Add Initial Package</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {filtered.map((pkg, idx) => (
                <MissionCard 
                  key={pkg.id} 
                  label={pkg.destination}
                  status={pkg.available ? "active" : "draft"}
                  className="cursor-default"
                >
                  <div className="relative aspect-[16/10] -mx-6 -mt-6 mb-6 overflow-hidden border-b border-border">
                    {pkg.images?.[0] ? (
                      <Image src={pkg.images[0]} alt={pkg.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground/20">
                        <ImagePlus className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 z-20">
                        <button 
                            onClick={(e) => { e.stopPropagation(); toggleAvailable(pkg); }}
                            className={cn(
                              "p-2 rounded-xl backdrop-blur-md transition-all border",
                              pkg.available ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20" : "bg-slate-900/80 border-slate-700 text-slate-400"
                            )}
                        >
                            {pkg.available ? <Zap className="w-4 h-4 fill-current" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <AssetBadge label={pkg.category} variant="info" dot={false} />
                        <AssetBadge label={pkg.difficulty} variant="warning" dot={false} />
                      </div>
                    </div>

                    <h3 className="text-xl font-display font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
                      {pkg.name}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <MonoSection label="Base Price" value={formatCurrency(pkg.price_usd, "USD")} />
                      <MonoSection label="Duration" value={`${pkg.duration_days} DAYS`} />
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/40">
                        <div className="flex items-center -space-x-1.5">
                             {pkg.highlights?.slice(0, 3).map((h, i) => (
                                <div key={i} className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center shadow-sm" title={h}>
                                    <Sparkles className="w-3 h-3 text-primary/40" />
                                </div>
                             ))}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button 
                                onClick={() => openEdit(pkg)}
                                className="p-2.5 bg-muted/50 hover:bg-primary hover:text-white rounded-xl transition-all duration-300 border border-border/40"
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                                onClick={() => {
                                  setPackageToDelete(pkg.id);
                                  setDeleteConfirmOpen(true);
                                }}
                                className="p-2.5 bg-muted/50 hover:bg-rose-500 hover:text-white rounded-xl transition-all duration-300 border border-border/40"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                  </div>
                </MissionCard>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden bg-gray-50 border-0 shadow-2xl rounded-[32px]">
            <div className="flex flex-col h-full">
                {/* Elite Header */}
                 <div className="px-12 py-8 bg-brand-dark flex items-center justify-between shadow-md z-10">
                    <div>
                        <div className="flex items-center gap-3 text-primary font-bold uppercase tracking-wider text-[10px] mb-2">
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            Package Configuration
                        </div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">
                            {editing ? "Edit Safari Package" : "Create New Package"}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                         <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
                            <p className="text-[8px] font-bold text-white/50 uppercase tracking-widest leading-none mb-1">Status</p>
                            <p className="text-xs font-bold text-emerald-400 tracking-wider leading-none uppercase">{form.available ? "Active" : "Draft"}</p>
                         </div>
                         <Button 
                            onClick={save} 
                            disabled={saving}
                            className="h-14 px-8 bg-primary hover:bg-primary/90 text-white font-bold tracking-wider text-[11px] rounded-2xl transition-all shadow-xl shadow-primary/30 uppercase"
                        >
                            {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Package
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-12">
                    {/* Identity Matrix */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                         <div className="lg:col-span-2 space-y-8 bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm">
                            <div className="space-y-3">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-primary ml-1 block">Package Title</label>
                                <input 
                                    className="w-full bg-gray-50 border border-gray-200 p-6 rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-2xl font-bold text-gray-900 placeholder:text-gray-300 outline-none shadow-inner"
                                    value={form.name}
                                    onChange={e => set("name", e.target.value)}
                                    placeholder="Enter package name..."
                                />
                                {errors.name && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-2">{errors.name}</p>}
                            </div>

                             <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 ml-1 block">Destination</label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                        <input 
                                            className="w-full bg-gray-50 border border-gray-200 pl-14 pr-6 py-4 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-gray-800 outline-none shadow-inner placeholder:text-gray-300"
                                            value={form.destination}
                                            onChange={e => set("destination", e.target.value)}
                                            placeholder="e.g. Serengeti, Maasai Mara..."
                                        />
                                    </div>
                                    {errors.destination && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.destination}</p>}
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 ml-1 block">URL Slug</label>
                                    <div className="relative group">
                                        <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                        <input 
                                            className="w-full bg-gray-50 border border-gray-200 pl-14 pr-6 py-4 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-mono text-sm text-gray-600 outline-none shadow-inner placeholder:text-gray-300"
                                            value={form.slug}
                                            onChange={e => set("slug", e.target.value)}
                                            placeholder="maasai-mara-safari"
                                        />
                                    </div>
                                    {errors.slug && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.slug}</p>}
                                </div>
                            </div>
                        </div>

                             <div className="space-y-4">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-primary block">Fiscal Intelligence</label>
                                <div className="p-6 bg-slate-900 rounded-[2rem] border border-slate-800 shadow-xl">
                                    <div className="space-y-6">
                                        <div className="relative group shadow-inner rounded-2xl bg-black/40 border border-white/5 overflow-hidden focus-within:border-primary/50 transition-all">
                                            <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-500" />
                                            <input 
                                                type="number"
                                                className="w-full bg-transparent pl-16 pr-8 py-5 text-2xl font-mono font-bold text-white outline-none placeholder:text-gray-700 tabular-nums"
                                                value={form.price_usd}
                                                onChange={e => set("price_usd", Number(e.target.value))}
                                                placeholder="0.00"
                                            />
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/20 uppercase tracking-widest">USD UNIT</div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Local Equivalency</p>
                                                <p className="text-lg font-mono font-bold text-emerald-400 tabular-nums">{formatCurrency(form.price_kes, "KES")}</p>
                                            </div>
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Exchange Vector</p>
                                                <p className="text-lg font-mono font-bold text-primary/60 tabular-nums">130.00 <span className="text-[10px] text-white/20">KES/USD</span></p>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-white/5">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Projected Margin</span>
                                                <span className="text-[10px] font-mono font-bold text-emerald-500">64.5%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: "64.5%" }}
                                                    className="h-full bg-gradient-to-r from-primary to-emerald-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {errors.price_usd && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-2">{errors.price_usd}</p>}
                            </div>

                             <div className="pt-6 border-t border-gray-100 grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-gray-500 font-bold uppercase tracking-widest text-[10px]"><Clock className="w-3.5 h-3.5" /> Duration</div>
                                    <div className="relative rounded-xl border border-gray-200 bg-gray-50 shadow-inner focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all overflow-hidden flex items-center">
                                        <input type="number" value={form.duration_days} onChange={e => set("duration_days", Number(e.target.value))} className="w-full bg-transparent p-4 text-gray-900 text-xl font-bold outline-none tabular-nums" placeholder="0" />
                                        <span className="pr-4 text-[10px] font-bold text-gray-400 select-none">DAYS</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-gray-500 font-bold uppercase tracking-widest text-[10px]"><Users className="w-3.5 h-3.5" /> Max Group</div>
                                    <div className="relative rounded-xl border border-gray-200 bg-gray-50 shadow-inner focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all overflow-hidden flex items-center">
                                        <input type="number" value={form.group_size_max} onChange={e => set("group_size_max", Number(e.target.value))} className="w-full bg-transparent p-4 text-gray-900 text-xl font-bold outline-none tabular-nums" placeholder="0" />
                                        <span className="pr-4 text-[10px] font-bold text-gray-400 select-none">PAX</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Operational Manifests */}
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-6 bg-white p-10 rounded-[2.5rem] border border-border shadow-sm">
                            <ManifestSequence 
                              label="Core Highlights" 
                              items={form.highlights} 
                              onChange={v => set("highlights", v)} 
                              icon={Zap}
                            />
                        </div>
                        <div className="space-y-6 bg-white p-10 rounded-[2.5rem] border border-border shadow-sm">
                            <ManifestSequence 
                              label="Package Inclusions" 
                              items={form.inclusions} 
                              onChange={v => set("inclusions", v)} 
                              icon={Award}
                              color="emerald-500"
                            />
                        </div>
                    </div>

                    {/* Seasonal Mapping */}
                     <div className="space-y-8 p-10 bg-gray-900 rounded-[3rem] text-white">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold tracking-tight flex items-center gap-4">
                                <Globe className="w-6 h-6 text-amber-400" />
                                BEST TIME TO VISIT
                            </h3>
                            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/10">SELECT MONTHS</div>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                            {MONTHS.map(m => (
                                <button key={m} onClick={() => toggleSeason(m)}
                                    className={`py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest border transition-all duration-500 ${form.best_season.includes(m) ? "bg-white text-gray-900 border-white shadow-xl scale-105" : "bg-black/40 border-white/10 text-white/40 hover:border-white/40 hover:text-white"}`}>
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Visual Assets */}
                     <div className="space-y-8 pb-32">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-4 uppercase">
                                <ImagePlus className="w-6 h-6 text-primary" />
                                Package Gallery
                            </h3>
                            <div className="flex flex-col items-end">
                                <div className="px-5 py-2 bg-gray-50 border border-gray-100 rounded-full text-[10px] font-bold text-gray-400 tracking-widest uppercase">Capacity: {form.images.length}/10</div>
                                {errors.images && <p className="text-red-500 text-[9px] font-bold uppercase mt-2">{errors.images}</p>}
                            </div>
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
                                    <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl text-[8px] font-bold text-white uppercase tracking-wider border border-white/20">IMAGE {i+1}</div>
                                </div>
                            ))}
                            {form.images.length < 10 && (
                                <label className="aspect-[4/3] rounded-[2rem] border-4 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all text-gray-400 hover:text-primary active:scale-98 group bg-gray-50/50">
                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center group-hover:shadow-xl transition-all mb-3 text-gray-300 group-hover:text-primary border border-gray-100">
                                        {uploading ? <RefreshCw className="w-7 h-7 animate-spin" /> : <Upload className="w-7 h-7" />}
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{uploading ? "Uploading..." : "Add Image"}</span>
                                    <input type="file" className="hidden" multiple accept="image/*" onChange={handleImageUpload} />
                                </label>
                            )}
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
