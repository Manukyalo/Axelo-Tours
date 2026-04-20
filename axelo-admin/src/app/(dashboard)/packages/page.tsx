"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Search, X, Upload, RefreshCw, AlertTriangle } from "lucide-react";
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Packages</h1>
          <p className="text-gray-500 text-sm">{packages.length} safari packages</p>
        </div>
        <Button onClick={openNew} className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Package
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search packages..."
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {["Image","Name","Destination","Duration","Price USD","Price KES","Category","Available","Actions"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={9} className="py-12 text-center"><RefreshCw className="w-5 h-5 animate-spin text-primary mx-auto" /></td></tr>
              ) : filtered.map(pkg => (
                <tr key={pkg.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-5 py-4">
                    {pkg.images[0] ? (
                      <div className="relative w-14 h-10 rounded-xl overflow-hidden">
                        <Image src={pkg.images[0]} alt={pkg.name} fill className="object-cover" />
                      </div>
                    ) : <div className="w-14 h-10 rounded-xl bg-gray-100" />}
                  </td>
                  <td className="px-5 py-4 font-bold text-gray-900 max-w-[180px]">
                    <p className="truncate">{pkg.name || <span className="text-gray-300 italic">Unnamed Package</span>}</p>
                    <p className="text-xs text-gray-400 font-normal truncate">{pkg.slug || "no-slug"}</p>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{pkg.destination}</td>
                  <td className="px-5 py-4 text-gray-600">{pkg.duration_days}d</td>
                  <td className="px-5 py-4 font-bold">{formatCurrency(pkg.price_usd, "USD")}</td>
                  <td className="px-5 py-4 text-gray-600">{formatCurrency(pkg.price_kes, "KES")}</td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold capitalize">{pkg.category}</span>
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => toggleAvailable(pkg)} className="transition-colors">
                      {pkg.available
                        ? <ToggleRight className="w-8 h-8 text-emerald-500" />
                        : <ToggleLeft className="w-8 h-8 text-gray-300" />}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(pkg)} className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors flex items-center gap-2 font-medium">
                        <Edit2 className="w-4 h-4" />
                        <span className="hidden lg:inline text-xs">Edit</span>
                      </button>
                      <button 
                        onClick={() => {
                          setPackageToDelete(pkg.id);
                          setDeleteConfirmOpen(true);
                        }} 
                        className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors flex items-center gap-2 font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden lg:inline text-xs">Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Package Form Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-[100vw] sm:max-w-2xl w-full max-h-screen sm:max-h-[90vh] overflow-y-auto rounded-none sm:rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Package" : "New Package"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Name</label>
                <input value={form.name} onChange={e => set("name", e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              {/* Slug */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Slug</label>
                <input value={form.slug} onChange={e => set("slug", e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              {/* Destination */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Destination</label>
                <input value={form.destination} onChange={e => set("destination", e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              {/* Duration */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Duration (days)</label>
                <input type="number" value={form.duration_days} onChange={e => set("duration_days", Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              {/* Price USD */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Price USD</label>
                <input type="number" value={form.price_usd} onChange={e => set("price_usd", Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              {/* Price KES */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Price KES <span className="text-gray-300 font-normal">(auto @ ×{USD_KES})</span></label>
                <input type="number" value={form.price_kes} onChange={e => set("price_kes", Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              {/* Category */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Category</label>
                <select value={form.category} onChange={e => set("category", e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {["budget","standard","luxury","custom"].map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </div>
              {/* Difficulty */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Difficulty</label>
                <select value={form.difficulty} onChange={e => set("difficulty", e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {["easy","moderate","challenging"].map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
                </select>
              </div>
              {/* Group size */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Min Group Size</label>
                <input type="number" value={form.group_size_min} onChange={e => set("group_size_min", Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Max Group Size</label>
                <input type="number" value={form.group_size_max} onChange={e => set("group_size_max", Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>

            {/* Dynamic lists */}
            <ArrayField label="Highlights" items={form.highlights} onChange={v => set("highlights", v)} />
            <ArrayField label="Inclusions" items={form.inclusions} onChange={v => set("inclusions", v)} />
            <ArrayField label="Exclusions" items={form.exclusions} onChange={v => set("exclusions", v)} />

            {/* Best Season */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Best Season</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {MONTHS.map(m => (
                  <button key={m} onClick={() => toggleSeason(m)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${form.best_season.includes(m) ? "bg-primary text-white border-primary" : "border-gray-200 text-gray-500 hover:border-primary/40"}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Images */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Images</label>
              <div className="mt-2 flex flex-wrap gap-3">
                {form.images.map((img, i) => (
                  <div key={i} className="relative w-20 h-16 rounded-xl overflow-hidden group">
                    <Image src={img} alt="" fill className="object-cover" />
                    <button onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
                <label className="w-20 h-16 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 transition-colors">
                  {uploading ? <RefreshCw className="w-4 h-4 animate-spin text-gray-400" /> : <Upload className="w-4 h-4 text-gray-400" />}
                  <span className="text-[10px] text-gray-400 mt-1">{uploading ? "Uploading..." : "Upload"}</span>
                  <input type="file" className="hidden" multiple accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>
            </div>

            {/* Available toggle */}
            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <button onClick={() => set("available", !form.available)}
                className={`w-12 h-6 rounded-full relative transition-colors shrink-0 ${form.available ? "bg-primary" : "bg-gray-200"}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.available ? "left-6" : "left-0.5"}`} />
              </button>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-700">Package Available</span>
                <span className="text-[10px] text-gray-400">Toggle visibility on the public website</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 order-2 sm:order-1">
                <Button onClick={save} disabled={saving} className="bg-primary hover:bg-primary/90 gap-2 rounded-xl px-8 h-12 font-black shadow-lg shadow-primary/20 transition-all active:scale-95">
                  {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {editing ? "Save Masterpiece" : "Create Masterpiece"}
                </Button>
                <Button variant="ghost" onClick={() => setModalOpen(false)} className="rounded-xl px-6 h-12 text-gray-400 font-bold">Discard</Button>
              </div>
              {editing && (
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setPackageToDelete(editing.id);
                    setDeleteConfirmOpen(true);
                  }}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-2 font-bold order-1 sm:order-2 h-12"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="sm:hidden lg:inline">Delete Archive</span>
                </Button>
              )}
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
