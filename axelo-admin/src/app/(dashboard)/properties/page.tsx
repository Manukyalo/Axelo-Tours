"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  Building2, FileText, Calculator, Upload, ChevronDown,
  ExternalLink, RefreshCw, AlertTriangle, Clock, CheckCircle2,
  DollarSign, TrendingUp, Users, Search, Plus, X, Edit3,
  Package, Mail, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

type Tab = "properties" | "calculator" | "contracts";
type Season = "low" | "shoulder" | "high" | "peak";

const SEASONS: Season[] = ["low", "shoulder", "high", "peak"];
const SEASON_COLORS: Record<Season, string> = {
  low:      "bg-indigo-50 text-indigo-600 border-indigo-100",
  shoulder: "bg-amber-50 text-amber-600 border-amber-100",
  high:     "bg-emerald-50 text-emerald-600 border-emerald-100",
  peak:     "bg-rose-50 text-rose-600 border-rose-100",
};
const USD_KES = 129; // approximate

export default function PropertiesPage() {
  const [tab, setTab] = useState<Tab>("properties");
  const [properties, setProperties] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [rates, setRates] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [prospecting, setProspecting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Calculator state
  const [calcProp, setCalcProp] = useState("");
  const [calcRoom, setCalcRoom] = useState("");
  const [calcSeason, setCalcSeason] = useState<Season>("high");
  const [calcNights, setCalcNights] = useState(3);
  const [calcGuests, setCalcGuests] = useState(2);
  const [calcMarkup, setCalcMarkup] = useState(30);

  const supabase = createClient();

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const [propRes, conRes, rateRes] = await Promise.all([
      supabase.from("properties").select("*").order("name"),
      supabase.from("contracts").select("*, properties(name, contact_email)").order("end_date"),
      supabase.from("net_rates").select("*"),
    ]);
    setProperties(propRes.data || []);
    setContracts(conRes.data || []);
    setRates(rateRes.data || []);
    setLoading(false);
  }

  // ----- Helpers -----
  function contractForProperty(pid: string) {
    return contracts.find(c => c.property_id === pid);
  }

  function ratesForProperty(pid: string) {
    return rates.filter(r => r.property_id === pid);
  }

  function contractBadge(c: any) {
    if (!c) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-400">NO CONTRACT</span>;
    const days = Math.ceil((new Date(c.end_date).getTime() - Date.now()) / 86400000);
    if (days < 0)  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">EXPIRED</span>;
    if (days < 30) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600 animate-pulse">EXPIRING {days}d</span>;
    if (days < 60) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700">EXPIRING {days}d</span>;
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">ACTIVE</span>;
  }

  async function uploadContract(file: File, contractId: string) {
    if (!contractId) { toast.error("No contract record to attach document to."); return; }
    setUploading(true);
    const path = `contracts/${contractId}/${file.name}`;
    const { error: upErr } = await supabase.storage.from("documents").upload(path, file, { upsert: true });
    if (upErr) { toast.error("Upload failed: " + upErr.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("documents").getPublicUrl(path);
    await supabase.from("contracts").update({ document_url: publicUrl }).eq("id", contractId);
    toast.success("Contract document uploaded!");
    fetchData();
    setUploading(false);
  }

  async function sendRenewalEmail(contract: any) {
    toast.loading("Sending renewal request...", { id: "renew" });
    const res = await fetch("/api/properties/renew", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contract_id: contract.id })
    });
    if (res.ok) toast.success("Renewal email sent!", { id: "renew" });
    else toast.error("Failed to send renewal.", { id: "renew" });
  }

  async function findProspects() {
    const dest = prompt("Enter destination to prospect (e.g. Amboseli, Zanzibar):");
    if (!dest) return;
    setProspecting(true);
    toast.loading(`Searching for premium lodges in ${dest}...`, { id: "prospect" });
    try {
      const res = await fetch("/api/properties/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination: dest, count: 5 })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Found ${data.count} new property leads!`, { id: "prospect" });
        fetchData();
      } else throw new Error(data.error);
    } catch (e: any) {
      toast.error(e.message, { id: "prospect" });
    }
    setProspecting(false);
  }

  // ----- Calculator Logic -----
  const calcPropData = properties.find(p => p.id === calcProp);
  const calcRateMatch = rates.find(r => r.property_id === calcProp && r.room_type === calcRoom && r.season === calcSeason);
  const netPerNight = calcRateMatch?.net_rate_usd ?? 0;
  const netTotal = netPerNight * calcNights * calcGuests;
  const sellTotal = netTotal * (1 + calcMarkup / 100);
  const marginUSD = sellTotal - netTotal;
  const marginKES = marginUSD * USD_KES;
  const roomTypes = [...new Set(rates.filter(r => r.property_id === calcProp).map(r => r.room_type))];

  return (
    <div className="p-8 pb-32 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tighter">
            <span className="w-2 h-8 bg-primary rounded-full hidden md:block" />
            Asset Logistics Hub
          </h1>
          <p className="text-gray-500 mt-2 font-bold italic">Manage lodge contracts, neural net rates, and margin calibrations.</p>
        </div>
        <Button onClick={findProspects} disabled={prospecting} variant="outline" className="gap-2 bg-white border-gray-200 text-gray-600 hover:bg-gray-50 font-black uppercase tracking-widest text-[10px] h-12 px-6 rounded-2xl transition-all shadow-sm">
          {prospecting ? <RefreshCw className="w-4 h-4 animate-spin text-primary" /> : <Search className="w-4 h-4 text-primary stroke-[3px]" />}
          Scan Prospects
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-gray-50 p-1.5 rounded-[22px] max-w-fit border border-gray-100 shadow-sm">
        {([
          { id: "properties", label: "Registry", icon: Building2 },
          { id: "calculator", label: "Margin Calibration", icon: Calculator },
          { id: "contracts", label: "Legal Manifest", icon: FileText },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${tab === t.id ? "bg-white text-gray-900 shadow-md border border-gray-100" : "text-gray-400 hover:text-gray-600"}`}>
            <t.icon className={`w-3.5 h-3.5 ${tab === t.id ? "text-primary stroke-[3px]" : "stroke-[2.5px]"}`} />
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ─── PROPERTIES TAB ─── */}
        {tab === "properties" && (
          <motion.div key="properties" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* Left: Property List */}
            <div className="lg:col-span-2 space-y-3">
              {loading ? (
                <div className="text-center py-20 text-gray-400 font-black uppercase tracking-widest text-xs">Calibrating Registry...</div>
              ) : properties.length === 0 ? (
                <div className="bg-white rounded-[32px] border border-gray-100 p-10 text-center shadow-sm">
                  <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 font-bold uppercase tracking-tighter italic">No properties indexed. Initiate Scan.</p>
                </div>
              ) : properties.map(p => {
                const contract = contractForProperty(p.id);
                const isSelected = selectedProperty?.id === p.id;
                return (
                  <button key={p.id} onClick={() => setSelectedProperty(p)}
                    className={`w-full text-left bg-white rounded-2xl border p-5 shadow-sm transition-all hover:shadow-xl hover:shadow-gray-100 group ${isSelected ? "border-primary ring-4 ring-primary/5" : "border-gray-50"}`}>
                    <div className="flex justify-between items-start mb-1.5">
                      <h3 className={`font-black text-[15px] tracking-tighter uppercase italic transition-colors ${isSelected ? "text-primary" : "text-gray-900 group-hover:text-primary"}`}>{p.name}</h3>
                      {contractBadge(contract)}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        <MapPin className="h-3 w-3" />
                        {p.destination} · {p.category}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right: Detail Panel */}
            <div className="lg:col-span-3">
              {!selectedProperty ? (
                <div className="bg-white rounded-[32px] border border-gray-100 p-16 text-center shadow-xl shadow-gray-100 h-full flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <Building2 className="w-10 h-10 text-gray-200" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase italic">Select Asset</h3>
                  <p className="text-sm font-bold text-gray-400 mt-2 max-w-[280px]">Select a lodge from the manifest to view neural net rates and legal contracts.</p>
                </div>
              ) : (
                <PropertyDetail
                  property={selectedProperty}
                  contract={contractForProperty(selectedProperty.id)}
                  rates={ratesForProperty(selectedProperty.id)}
                  onUpload={uploadContract}
                  onRenew={sendRenewalEmail}
                  uploading={uploading}
                  contractBadge={contractBadge}
                  calcMarkup={calcMarkup}
                  setCalcMarkup={setCalcMarkup}
                />
              )}
            </div>
          </motion.div>
        )}

        {/* ─── CALCULATOR TAB ─── */}
        {tab === "calculator" && (
          <motion.div key="calculator" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Left: Inputs */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
              <h2 className="font-bold text-gray-900 text-lg">Margin Calculator</h2>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Property</label>
                <select value={calcProp} onChange={e => { setCalcProp(e.target.value); setCalcRoom(""); }}
                  className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="">Select lodge…</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Room Type</label>
                  <select value={calcRoom} onChange={e => setCalcRoom(e.target.value)}
                    className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20" disabled={!calcProp}>
                    <option value="">Choose type…</option>
                    {roomTypes.map(rt => <option key={rt} value={rt}>{rt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Season</label>
                  <select value={calcSeason} onChange={e => setCalcSeason(e.target.value as Season)}
                    className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20">
                    {SEASONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nights</label>
                  <input type="number" min={1} value={calcNights} onChange={e => setCalcNights(Number(e.target.value))}
                    className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Guests</label>
                  <input type="number" min={1} value={calcGuests} onChange={e => setCalcGuests(Number(e.target.value))}
                    className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Markup: {calcMarkup}%</label>
                <input type="range" min={5} max={80} value={calcMarkup} onChange={e => setCalcMarkup(Number(e.target.value))}
                  className="w-full accent-primary" />
              </div>
            </div>

            {/* Right: Result */}
            <div className="space-y-4">
              {!calcRateMatch ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400 h-full flex flex-col items-center justify-center">
                  <Calculator className="w-10 h-10 text-gray-200 mb-3" />
                  <p className="text-sm">Select a property, room type, and season to see margins.</p>
                </div>
              ) : (
                <>
                  <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-white shadow-xl shadow-primary/20">
                    <p className="text-white/70 text-sm font-medium mb-1">Selling Price (Total)</p>
                    <p className="text-5xl font-black">${sellTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-white/50 text-xs mt-1">KES {(sellTotal * USD_KES).toLocaleString()}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <StatCard label="Net Cost" value={`$${netTotal.toFixed(2)}`} sub={`@ $${netPerNight}/night`} color="bg-gray-50" textColor="text-gray-900" />
                    <StatCard label="Your Margin" value={`$${marginUSD.toFixed(2)}`} sub={`KES ${marginKES.toLocaleString()}`} color="bg-green-50" textColor="text-green-700" />
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-sm text-gray-600 space-y-2">
                    <p className="flex justify-between"><span className="text-gray-400">Property</span><span className="font-bold text-gray-800">{calcPropData?.name}</span></p>
                    <p className="flex justify-between"><span className="text-gray-400">Room</span><span className="font-bold">{calcRoom}</span></p>
                    <p className="flex justify-between"><span className="text-gray-400">Season</span><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${SEASON_COLORS[calcSeason]}`}>{calcSeason.toUpperCase()}</span></p>
                    <p className="flex justify-between"><span className="text-gray-400">{calcNights} nights × {calcGuests} guests</span><span className="font-bold">{calcNights * calcGuests} pax-nights</span></p>
                    <p className="flex justify-between"><span className="text-gray-400">Markup applied</span><span className="font-bold text-primary">{calcMarkup}%</span></p>
                  </div>

                  <Button className="w-full h-12 gap-2 bg-primary rounded-xl text-white shadow-lg shadow-primary/20">
                    <Package className="w-4 h-4" /> Use in Package Builder
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* ─── CONTRACTS TAB ─── */}
        {tab === "contracts" && (
          <motion.div key="contracts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-400 font-bold border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Property</th>
                  <th className="px-6 py-4">Start Date</th>
                  <th className="px-6 py-4">Expiry</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Document</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {contracts.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-16 text-center text-gray-400">No contracts found.</td></tr>
                ) : contracts.map(c => {
                  const days = Math.ceil((new Date(c.end_date).getTime() - Date.now()) / 86400000);
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{c.properties?.name}</td>
                      <td className="px-6 py-4 text-gray-500">{new Date(c.start_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-gray-500 font-medium">{new Date(c.end_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">{contractBadge(c)}</td>
                      <td className="px-6 py-4">
                        {c.document_url
                          ? <a href={c.document_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary text-xs font-bold hover:underline"><ExternalLink className="w-3 h-3" />View</a>
                          : <span className="text-xs text-gray-400">— no file —</span>}
                      </td>
                      <td className="px-6 py-4">
                        {(days < 60) && (
                          <Button onClick={() => sendRenewalEmail(c)} size="sm" className="gap-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs h-8">
                            <Mail className="w-3 h-3" /> Renew
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color, textColor }: any) {
  return (
    <div className={`${color} rounded-[24px] p-6 border border-gray-100 shadow-sm`}>
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-2xl font-black tracking-tighter italic ${textColor}`}>{value}</p>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-0.5">{sub}</p>
    </div>
  );
}

function PropertyDetail({ property, contract, rates, onUpload, onRenew, uploading, contractBadge, calcMarkup, setCalcMarkup }: any) {
  const fileRef = useRef<HTMLInputElement>(null);

  // Group rates by room_type
  const roomGroups: Record<string, any[]> = {};
  rates.forEach((r: any) => {
    if (!roomGroups[r.room_type]) roomGroups[r.room_type] = [];
    roomGroups[r.room_type].push(r);
  });

  return (
    <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-100 p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className="font-black text-gray-900 text-2xl tracking-[ -0.05em] uppercase italic">{property.name}</h2>
          <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <MapPin className="h-3 w-3" /> {property.destination} · {property.category}
          </div>
          {property.website && (
            <a href={property.website} target="_blank" rel="noreferrer"
              className="text-[10px] text-primary flex items-center gap-1.5 font-black uppercase tracking-wider hover:opacity-70 transition-all">
              <ExternalLink className="w-3 h-3 stroke-[3px]" /> Asset Intelligence Portal
            </a>
          )}
        </div>
        {contractBadge(contract)}
      </div>

      {/* Contact */}
      <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 text-sm grid grid-cols-2 gap-6 shadow-inner">
        <div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <User className="w-3 h-3" /> Liasion Node
          </p>
          <p className="text-gray-900 font-black text-xs uppercase tracking-tight">{property.contact_name || "NOT ASSIGNED"}</p>
        </div>
        <div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <Mail className="w-3 h-3" /> Encrypted Channel
          </p>
          <p className="text-gray-900 font-black text-xs uppercase tracking-tight truncate lowercase">{property.contact_email || "PENDING_HANDSHAKE"}</p>
        </div>
      </div>

      {/* Rate Card */}
      <div>
        <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2 mb-4">
          <DollarSign className="w-3.5 h-3.5 text-primary stroke-[3px]" /> Neural Net Rate Card (USD)
        </h3>
        {Object.keys(roomGroups).length === 0 ? (
          <div className="p-8 text-center bg-gray-50 border border-gray-100 rounded-[24px]">
             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Inventory nodes offline. Sync Rates.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[24px] border border-gray-100 shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Asset Spec</th>
                  {["low", "shoulder", "high", "peak"].map(s => (
                    <th key={s} className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {Object.entries(roomGroups).map(([room, rts]) => (
                  <tr key={room} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-5 font-black text-gray-900 text-[12px] tracking-tight uppercase italic">{room}</td>
                    {(["low", "shoulder", "high", "peak"] as Season[]).map(s => {
                      const rate = rts.find((r: any) => r.season === s);
                      const net = rate?.net_rate_usd;
                      const sell = net ? net * (1 + calcMarkup / 100) : null;
                      return (
                        <td key={s} className="px-6 py-5">
                          {net ? (
                            <div className="space-y-0.5">
                              <p className="text-gray-300 font-bold text-[9px] uppercase tracking-tighter italic">NET: ${net}</p>
                              <p className="font-black text-gray-900 text-[13px] tracking-tighter italic">${sell!.toFixed(0)}</p>
                            </div>
                          ) : <span className="text-gray-200 font-black">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Markup Slider */}
        <div className="mt-5 bg-indigo-50/30 rounded-[20px] p-5 border border-indigo-100 flex items-center gap-6 group">
          <div className="flex items-center gap-2 shrink-0">
             <TrendingUp className="w-4 h-4 text-indigo-600 stroke-[3px]" />
             <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Yield Optimization</span>
          </div>
          <input type="range" min={5} max={80} value={calcMarkup}
            onChange={e => setCalcMarkup(Number(e.target.value))} className="flex-1 accent-indigo-600 cursor-pointer h-1.5" />
          <div className="w-16 h-10 bg-white border border-indigo-100 rounded-xl flex items-center justify-center font-black text-indigo-600 italic tracking-tighter shadow-sm text-sm">
            {calcMarkup}%
          </div>
        </div>
      </div>

      {/* Contract Upload */}
      <div>
        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-primary" /> Contract Document
        </h3>
        <div className="flex items-center gap-3">
          {contract?.document_url ? (
            <a href={contract.document_url} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-sm text-primary font-bold hover:underline">
              <FileText className="w-4 h-4" />View Contract PDF
            </a>
          ) : <span className="text-sm text-gray-400">No document attached.</span>}
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
            onChange={e => { if (e.target.files?.[0] && contract) onUpload(e.target.files[0], contract.id); }} />
          <Button onClick={() => fileRef.current?.click()} disabled={uploading || !contract} variant="outline" size="sm" className="gap-1 rounded-lg text-xs">
            {uploading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            {uploading ? "Uploading..." : "Upload"}
          </Button>
          {contract && <Button onClick={() => onRenew(contract)} variant="outline" size="sm" className="gap-1 rounded-lg text-xs text-amber-600 border-amber-200 hover:bg-amber-50">
            <Mail className="w-3 h-3" /> Request Renewal
          </Button>}
        </div>
      </div>

      {/* Notes */}
      <div>
        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 mb-2">
          <Edit3 className="w-4 h-4 text-primary" /> Notes
        </h3>
        <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-4 min-h-[60px]">
          {property.notes || "No notes on this property yet."}
        </p>
      </div>
    </div>
  );
}
