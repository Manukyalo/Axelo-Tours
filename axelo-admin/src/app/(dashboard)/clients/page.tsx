"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, X, RefreshCw, ChevronRight, User, Mail, 
  Phone, Globe, FileText, Activity, Shield, Hash,
  Clock, MapPin, Zap, ExternalLink, Filter, ListFilter
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Client, Booking } from "@/types";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/formatters";

const STATUS_BG: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  completed: "bg-indigo-100 text-indigo-700 border-indigo-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

export default function ClientsPage() {
  const supabase = createClient();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Client | null>(null);
  const [clientBookings, setClientBookings] = useState<(Booking & { packages?: any })[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    async function fetchClients() {
      const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
      setClients((data as Client[]) || []);
      setLoading(false);
    }
    fetchClients();
  }, [supabase]);

  const selectClient = useCallback(async (client: Client) => {
    setSelected(client);
    setLoadingBookings(true);
    const { data } = await supabase
      .from("bookings")
      .select("*, packages(name, destination)")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false });
    setClientBookings((data as any[]) || []);
    setLoadingBookings(false);
  }, [supabase]);

  const filtered = clients.filter(c =>
    !search ||
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.nationality || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-10 bg-[#fafafa] min-h-screen">
      {/* Registry Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600/10 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border border-indigo-600/20">
              <Shield className="w-3 h-3" />
              Secure Entity Registry
            </div>
          </div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter leading-none">
            Entity Intelligence <span className="text-indigo-600 italic">Registry</span>
          </h1>
          <p className="text-gray-500 font-medium max-w-xl text-lg leading-relaxed">
            Monitor global client identities, historical engagement vectors, and operational loyalty metrics.
          </p>
        </div>
        
        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm">
            <span className="flex items-center gap-2">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> 
                {clients.length} Registered Identities
            </span>
        </div>
      </div>

      <div className="flex gap-8 h-[calc(100vh-280px)]">
        {/* Navigation Blade */}
        <div className="w-[450px] shrink-0 flex flex-col gap-6">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-indigo-600 transition-colors stroke-[3px]" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Query Identity Database..."
              className="w-full h-16 pl-16 pr-6 bg-white border border-gray-100 rounded-[28px] text-sm font-bold tracking-tight shadow-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all outline-none" 
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex gap-2">
                <kbd className="px-2 py-1 bg-gray-50 border border-gray-100 rounded text-[9px] font-black text-gray-400 tracking-tighter shadow-sm">CMD</kbd>
                <kbd className="px-2 py-1 bg-gray-50 border border-gray-100 rounded text-[9px] font-black text-gray-400 tracking-tighter shadow-sm">K</kbd>
            </div>
          </div>

          <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden flex-grow flex flex-col">
            <div className="p-6 border-b border-gray-50 bg-[#fcfcfc] flex items-center justify-between">
               <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] pl-2 flex items-center gap-2">
                  <ListFilter className="w-3 h-3" /> Master Registry
               </span>
               <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline transition-all">Export XLS</button>
            </div>
            <div className="overflow-y-auto flex-grow p-4 space-y-2 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-600/30" />
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Decrypting Records...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-6">
                   <div className="w-20 h-20 rounded-[32px] bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-200 shadow-inner">
                      <Search className="w-10 h-10" />
                   </div>
                   <div className="space-y-2">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Zero Matches Found</p>
                      <p className="text-[10px] font-medium text-gray-300 leading-relaxed max-w-[200px]">The identity unit you are querying does not exist in the current jurisdiction.</p>
                   </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map(c => (
                    <button 
                      key={c.id} 
                      onClick={() => selectClient(c)}
                      className={`w-full flex items-center gap-5 p-5 text-left rounded-[32px] transition-all duration-500 group relative overflow-hidden ${
                        selected?.id === c.id 
                          ? "bg-indigo-600 text-white shadow-2xl shadow-indigo-100 -translate-y-1" 
                          : "hover:bg-gray-50 text-gray-900 border border-transparent hover:border-gray-100"
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center shrink-0 transition-all duration-700 ${
                        selected?.id === c.id 
                          ? "bg-white/20 text-white rotate-6" 
                          : "bg-indigo-50 text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-100"
                      }`}>
                        <span className="font-black text-xl italic">{c.full_name.charAt(0)}</span>
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <p className={`font-black truncate tracking-tighter text-[16px] uppercase italic ${selected?.id === c.id ? "text-white" : "text-gray-900"}`}>
                                {c.full_name}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <p className={`text-[11px] truncate font-bold tracking-tight opacity-70 ${selected?.id === c.id ? "text-white" : "text-gray-400"}`}>
                                {c.email}
                            </p>
                            <span className={`w-1 h-1 rounded-full ${selected?.id === c.id ? "bg-white/40" : "bg-gray-200"}`} />
                            <p className={`text-[10px] font-black uppercase tracking-widest ${selected?.id === c.id ? "text-white/60" : "text-gray-300"}`}>
                                {c.nationality || "UNK"}
                            </p>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 transition-transform duration-500 ${selected?.id === c.id ? "text-white translate-x-2" : "text-gray-200"}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Intelligence Detail View */}
        <div className="flex-grow bg-white rounded-[40px] border border-gray-100 shadow-2xl shadow-gray-200/50 overflow-hidden flex flex-col relative">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-20 gap-10">
               <div className="relative">
                   <div className="w-32 h-32 rounded-[48px] bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-200 shadow-inner group-hover:scale-105 transition-transform duration-700">
                      <User className="w-16 h-16 opacity-30" />
                   </div>
                   <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-gray-50">
                       <Zap className="w-5 h-5 text-indigo-400" />
                   </div>
               </div>
               <div className="space-y-4 max-w-sm">
                   <h3 className="text-3xl font-black text-gray-900 tracking-tighter leading-none">Initialize Asset <span className="text-indigo-600">ID Hub</span></h3>
                   <p className="text-gray-400 font-medium leading-relaxed">Select a registered entity from the registry to decrypt logistical history and communication nodes.</p>
               </div>
            </div>
          ) : (
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col h-full"
            >
              {/* Header Profile Section */}
              <div className="p-12 border-b border-gray-50 bg-gradient-to-br from-white to-gray-50/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                    <Shield className="w-64 h-64 text-indigo-600" />
                </div>
                
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-10">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-[48px] bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-200 ring-[12px] ring-indigo-50 border-8 border-white overflow-hidden text-white group">
                            <span className="text-5xl font-black italic group-hover:scale-110 transition-transform duration-700">{selected.full_name.charAt(0)}</span>
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white border-4 border-white shadow-lg">
                            <Shield className="w-4 h-4 fill-current text-white" />
                        </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex flex-col">
                          <span className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-1 italic">Verified Entity_Active</span>
                          <h2 className="text-5xl font-black text-gray-900 tracking-tighter leading-none italic uppercase">{selected.full_name}</h2>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-widest shadow-sm">
                          <Hash className="w-3 h-3 text-indigo-600" />
                          {selected.id.split("-")[0].toUpperCase()}
                        </div>
                        <p className="text-gray-400 text-[11px] font-black uppercase tracking-widest">
                          Deployed {format(new Date(selected.created_at), "MMMM yyyy")}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                      <button className="px-6 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-gray-200 hover:scale-[1.05] active:scale-[0.98] transition-all">Execute Outreach</button>
                      <button className="p-3 bg-white border border-gray-100 text-gray-400 hover:text-gray-900 rounded-2xl shadow-sm transition-all"><ExternalLink className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>

              <div className="flex-grow overflow-y-auto p-12 space-y-16 custom-scrollbar">
                {/* Data Matrix */}
                <div className="grid grid-cols-3 gap-8">
                   {[
                     { label: "Comm Node Primary", val: selected.email, icon: Mail, color: "indigo" },
                     { label: "Secure Signal Line", val: selected.phone || "STDN_NULL", icon: Phone, color: "emerald" },
                     { label: "Jurisdiction Node", val: selected.nationality || "INTL_TERRITORY", icon: Globe, color: "amber" }
                   ].map((node, i) => (
                     <div key={i} className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-100 transition-all duration-500 group relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-1 bg-${node.color}-500/20 group-hover:h-full transition-all duration-700 pointer-events-none opacity-[0.05]`} />
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`w-10 h-10 rounded-xl bg-${node.color}-50 flex items-center justify-center text-${node.color}-600 group-hover:scale-110 transition-transform duration-500`}>
                                <node.icon className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{node.label}</span>
                        </div>
                        <p className="font-black text-gray-900 text-[16px] tracking-tight truncate">{node.val}</p>
                     </div>
                   ))}
                </div>

                {/* Logistics Flow */}
                <div className="space-y-8 pb-32">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                                <Activity className="w-6 h-6 stroke-[3px]" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">Deployment Manifests</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Historical Mission Logs</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 border border-gray-100 px-5 py-2.5 rounded-full">
                            <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">{clientBookings.length} Missions Verified</span>
                        </div>
                    </div>

                    {loadingBookings ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-6">
                            <RefreshCw className="w-12 h-12 animate-spin text-indigo-600 opacity-20" />
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Querying Settlement Hub...</p>
                        </div>
                    ) : clientBookings.length === 0 ? (
                        <div className="bg-gray-50/50 rounded-[48px] border border-dashed border-gray-200 py-32 text-center flex flex-col items-center gap-8 group">
                            <div className="w-20 h-20 rounded-[32px] bg-white border border-gray-100 flex items-center justify-center text-gray-100 group-hover:text-indigo-400 transition-colors duration-700">
                                <Shield className="w-10 h-10 opacity-20" />
                            </div>
                            <div className="space-y-4">
                                <p className="text-gray-400 font-black uppercase text-[11px] tracking-[0.4em]">Zero engagement metrics detected</p>
                                <button className="text-indigo-600 text-[10px] font-black uppercase tracking-widest border-b border-indigo-600/30 pb-1 hover:border-indigo-600 transition-all">Manual Provisioning?</button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {clientBookings.map((b, i) => (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    key={b.id} 
                                    className="group bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 flex items-center justify-between relative overflow-hidden"
                                >
                                    <div className="flex items-center gap-10 relative z-10">
                                        <div className="relative">
                                            <div className="w-20 h-20 rounded-[32px] bg-gray-900 border-4 border-white shadow-xl flex items-center justify-center text-white font-black text-xs group-hover:bg-indigo-600 group-hover:scale-105 transition-all duration-500 italic">
                                                #{b.id.split("-")[0].toUpperCase()}
                                            </div>
                                            <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-xl border-4 border-white shadow-lg flex items-center justify-center ${
                                                b.status === 'completed' ? 'bg-indigo-500' : 'bg-amber-500'
                                            }`}>
                                                <Shield className="w-3.5 h-3.5 text-white fill-current" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="font-black text-gray-900 tracking-tighter text-2xl italic leading-none">{b.packages?.name || "Custom Strategic Assignment"}</p>
                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {format(new Date(b.travel_date), "dd MMM yyyy")} Dispatch
                                                </div>
                                                <span className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
                                                <div className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest italic">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    {b.packages?.destination || "Unknown Sector"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-12 relative z-10">
                                        <div className="text-right space-y-1">
                                            <p className="font-black text-gray-900 text-2xl tracking-tighter leading-none">{formatCurrency(b.total_amount, b.currency)}</p>
                                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest flex items-center justify-end gap-2">
                                                Net_Settlement <Shield className="w-3 h-3" />
                                            </p>
                                        </div>
                                        <div className="h-12 w-[2px] bg-gray-50" />
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm transition-all duration-500 ${
                                                STATUS_BG[b.status as keyof typeof STATUS_BG] || "bg-gray-100 text-gray-500"
                                            }`}>
                                                {b.status} Profile
                                            </span>
                                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{b.payment_status} settlement</span>
                                        </div>
                                        <button className="p-4 bg-gray-50 hover:bg-white border border-gray-100 rounded-2xl text-gray-300 hover:text-gray-900 shadow-sm hover:shadow-xl transition-all duration-500">
                                            <ChevronRight className="w-6 h-6" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
