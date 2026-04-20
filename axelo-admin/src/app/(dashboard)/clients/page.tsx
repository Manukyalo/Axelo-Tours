"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, RefreshCw, ChevronRight, User, Mail, Phone, Globe, FileText, Activity } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Client, Booking } from "@/types";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/formatters";

const STATUS_BG: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
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
  }, []);

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
  }, []);

  const filtered = clients.filter(c =>
    !search ||
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.nationality || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-10 bg-[#fafafa] min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tighter">
            <span className="w-2 h-8 bg-indigo-600 rounded-full hidden md:block" />
            Client Intelligence
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            Manage global client identities, travel history, and communication logs.
          </p>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            <span className="flex items-center gap-1.5 bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> 
                {clients.length} Registered Identities
            </span>
        </div>
      </div>

      <div className="flex gap-6 h-[calc(100vh-160px)]">
        <div className="w-[400px] shrink-0 flex flex-col gap-5">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
            <input value={search} onChange={e => setSearch(e.target.value)} 
              placeholder="Search Identity Hub..."
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-[20px] text-sm bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all shadow-sm" />
          </div>

          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex-grow flex flex-col">
            <div className="p-4 border-b border-gray-50 bg-gray-50/30">
               <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-2">Master List</span>
            </div>
            <div className="overflow-y-auto flex-grow p-2">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                   <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4 text-gray-300">
                      <Search className="w-6 h-6" />
                   </div>
                   <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No Matches</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filtered.map(c => (
                    <button key={c.id} onClick={() => selectClient(c)}
                      className={`w-full flex items-center gap-4 px-4 py-3 text-left rounded-2xl transition-all group ${selected?.id === c.id ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100 translate-x-1" : "hover:bg-gray-50/80 text-gray-900"}`}>
                      <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 transition-all ${selected?.id === c.id ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-600 group-hover:scale-110"}`}>
                        <span className="font-black text-sm">{c.full_name.charAt(0)}</span>
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className={`font-bold truncate tracking-tight ${selected?.id === c.id ? "text-white" : "text-gray-900"}`}>{c.full_name}</p>
                        <p className={`text-[11px] truncate font-medium ${selected?.id === c.id ? "text-white/60" : "text-gray-400"}`}>{c.email}</p>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${selected?.id === c.id ? "text-white translate-x-1" : "text-gray-200"}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-grow bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-12">
               <div className="w-24 h-24 rounded-[32px] bg-gray-50 border border-gray-100 flex items-center justify-center mb-6 text-gray-200 shadow-inner">
                  <User className="w-10 h-10" />
               </div>
               <h3 className="text-lg font-black text-gray-900 tracking-tighter mb-2">Initialize Intelligence View</h3>
               <p className="text-sm text-gray-400 font-medium max-w-[280px]">Select a client profile from the list to view operational records and history.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Header Profile Section */}
              <div className="p-10 border-b border-gray-50 bg-gradient-to-br from-white to-gray-50/50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-8">
                    <div className="w-24 h-24 rounded-[32px] bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-200 ring-8 ring-indigo-50 border-4 border-white overflow-hidden text-white">
                      <span className="text-4xl font-black">{selected.full_name.charAt(0)}</span>
                    </div>
                    <div>
                      <h2 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">{selected.full_name}</h2>
                      <div className="flex items-center gap-4">
                        <span className="px-3 py-1 bg-white rounded-full border border-gray-200 text-[10px] font-black uppercase text-gray-500 tracking-widest shadow-sm">
                          ID Profile Activated
                        </span>
                        <p className="text-gray-400 text-sm font-bold">
                          Client since {format(new Date(selected.created_at), "MMM yyyy")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-10 overflow-y-auto flex-grow space-y-10">
                <div className="grid grid-cols-3 gap-6">
                   <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <Mail className="w-3 h-3" /> Communication Node
                      </p>
                      <p className="font-bold text-gray-900">{selected.email}</p>
                   </div>
                   <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <Phone className="w-3 h-3" /> Signal Line
                      </p>
                      <p className="font-bold text-gray-900">{selected.phone || "No signal established"}</p>
                   </div>
                   <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <Globe className="w-3 h-3" /> Origin / Jurisdiction
                      </p>
                      <p className="font-bold text-gray-900 font-mono text-xs uppercase tracking-tight">{selected.nationality || "Unknown Territory"}</p>
                   </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-gray-900 tracking-tighter flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-600" />
                            Operational Engagement Logs
                        </h3>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{clientBookings.length} Missions Logged</span>
                    </div>

                    {loadingBookings ? (
                        <div className="flex justify-center py-20"><RefreshCw className="w-6 h-6 animate-spin text-gray-200" /></div>
                    ) : clientBookings.length === 0 ? (
                        <div className="bg-gray-50/50 rounded-[32px] border border-dashed border-gray-200 py-16 text-center">
                            <p className="text-gray-400 font-bold uppercase text-[11px] tracking-[0.3em]">No deployment records found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {clientBookings.map(b => (
                                <div key={b.id} className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 rounded-[18px] bg-gray-50 flex items-center justify-center text-gray-400 font-black text-xs group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            #{b.id.split("-")[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900 tracking-tighter text-lg">{b.packages?.name || "Custom Mission"}</p>
                                            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">{format(new Date(b.travel_date), "dd MMM yyyy")} Dispatch</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <p className="font-black text-gray-900">{formatCurrency(b.total_amount, b.currency)}</p>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{b.payment_status}</p>
                                        </div>
                                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border ${STATUS_BG[b.status as keyof typeof STATUS_BG] || "bg-gray-100 text-gray-500 border-gray-200"}`}>
                                            {b.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
