"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, RefreshCw, ChevronRight, User, Mail, Phone, Globe, FileText } from "lucide-react";
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
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
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

              <div className="flex-grow overflow-y-auto p-10 space-y-12">
                {/* Visual Identity Hub */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { icon: Mail, label: "Channel Email", value: selected.email, color: "indigo" },
                    { icon: Phone, label: "Global Line", value: selected.phone || "No Connection", color: "blue" },
                    { icon: Globe, label: "Nationality", value: selected.nationality || "Unknown", color: "emerald" },
                    { icon: FileText, label: "Passport Code", value: selected.passport_no || "TBA", color: "amber" },
                  ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="group p-5 rounded-[24px] bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-100 transition-all hover:-translate-y-1">
                      <div className={`w-10 h-10 rounded-xl bg-${color}-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-all`}>
                        <Icon className={`w-4 h-4 text-${color}-600`} />
                      </div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-1">{label}</p>
                      <p className="text-sm font-black text-gray-900 tracking-tighter truncate leading-none">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Booking History Station */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-gray-900 tracking-tighter flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-primary rounded-full" />
                      Client Manifest History
                      <span className="text-sm font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{clientBookings.length} Logged Entries</span>
                    </h3>
                  </div>

                  {loadingBookings ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-[32px] border border-dashed border-gray-200">
                      <RefreshCw className="w-8 h-8 animate-spin text-indigo-200 mb-4" />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Accessing Secure Records...</p>
                    </div>
                  ) : clientBookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-[32px] border border-dashed border-gray-200">
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No Transaction History Logged</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {clientBookings.map(b => (
                        <div key={b.id} className="group flex items-center justify-between p-6 rounded-[24px] bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-gray-100 transition-all cursor-default">
                          <div className="flex items-center gap-5">
                             <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <Globe className="w-5 h-5" />
                             </div>
                             <div>
                                <p className="font-black text-gray-900 tracking-tight leading-tight">{b.packages?.name ?? "Custom Itinerary Deployment"}</p>
                                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                                   {format(new Date(b.travel_date), "dd MMM yyyy")} • {b.num_adults + b.num_children} Personnel
                                </p>
                             </div>
                          </div>
                          <div className="flex items-center gap-8">
                             <div className="text-right">
                                <p className="font-black text-gray-900 text-lg tracking-tighter leading-tight">{formatCurrency(b.total_amount, b.currency)}</p>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border mt-1 shadow-sm ${
                                  b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                  b.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                  'bg-indigo-50 text-indigo-600 border-indigo-100'
                                }`}>
                                   {b.status}
                                </span>
                             </div>
                             <div className="p-2 rounded-xl bg-gray-50 text-gray-300 transition-all">
                                <ChevronRight className="w-5 h-5" />
                             </div>
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
