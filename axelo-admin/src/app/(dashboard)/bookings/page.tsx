"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Search, Filter, Download, Eye, ChevronRight, ChevronLeft,
  X, CheckCircle, XCircle, RefreshCw, Plus, Trash2, 
  Clock, Users, MapPin, DollarSign, Award, AlertTriangle, Activity,
  Shield, Zap, Globe, Briefcase, ChevronDown, MoreHorizontal,
  FileSearch, UserCheck, CreditCard, Calendar, Loader2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/formatters";
import { Booking } from "@/types";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PAGE_SIZE = 15;

const STATUS_CONFIG: Record<string, { label: string, color: string, bg: string, border: string, icon: any }> = {
  pending: { label: "Awaiting Clearance", color: "text-amber-600", bg: "bg-amber-50/50", border: "border-amber-100", icon: Clock },
  confirmed: { label: "Manifest Secured", color: "text-emerald-600", bg: "bg-emerald-50/50", border: "border-emerald-100", icon: Shield },
  completed: { label: "Deployment Finalized", color: "text-indigo-600", bg: "bg-indigo-50/50", border: "border-indigo-100", icon: CheckCircle },
  cancelled: { label: "Mission Aborted", color: "text-rose-600", bg: "bg-rose-50/50", border: "border-rose-100", icon: XCircle },
};

export default function BookingsPage() {
  const supabase = createClient();
  const [bookings, setBookings] = useState<(Booking & { clients?: any; packages?: any })[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<typeof bookings[0] | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("bookings")
      .select("*, clients(full_name, email, phone, nationality), packages(name, destination)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (paymentFilter !== "all") query = query.eq("payment_status", paymentFilter);
    if (search) query = query.or(`id.ilike.%${search}%, booking_ref.ilike.%${search}%`);

    const { data, count } = await query;
    setBookings((data as any[]) || []);
    setTotal(count || 0);
    setLoading(false);
  }, [page, statusFilter, paymentFilter, search, supabase]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) {
      toast.error("Security Override Failed: " + error.message);
    } else {
      toast.success(`Manifest state transitioned to ${status.toUpperCase()}`);
      fetchBookings();
      setSelectedBooking(null);
    }
    setUpdating(null);
  };

  const exportCSV = () => {
    const rows = [
      ["Manifest ID", "Guest Name", "Intel/Package", "Deployment", "Financials", "Status"],
      ...bookings.map(b => [
        b.booking_ref || b.id,
        b.clients?.full_name,
        b.packages?.name,
        b.travel_date,
        `${b.currency} ${b.total_amount}`,
        b.status
      ]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `AX-MANIFEST-${format(new Date(), "yyyyMMdd")}.csv`; a.click();
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-8 space-y-8 bg-[#fafafa] min-h-screen">
      {/* Intelligence Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-2">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-primary/70">Secure Operations Center</span>
          </div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tightest leading-none">
            Global Manifest
          </h1>
          <p className="text-gray-400 mt-4 font-bold max-w-xl text-lg leading-relaxed opacity-70 italic">
            Real-time synchronization of guest trajectories, financial settlements, and operational readiness.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={exportCSV} 
            className="h-12 px-6 flex items-center gap-2 font-black text-[11px] uppercase tracking-widest text-gray-500 hover:text-gray-900 border border-gray-200 rounded-2xl transition-all hover:bg-white hover:shadow-md"
          >
            <Download className="w-4 h-4" />
            Export Intel
          </button>
          <Link href="/bookings/new">
            <button className="h-12 px-8 flex items-center gap-2 font-black text-[11px] uppercase tracking-widest bg-gray-900 text-white rounded-2xl shadow-xl shadow-gray-200 hover:bg-black transition-all active:scale-95">
              <Plus className="w-5 h-5" />
              New Entry
            </button>
          </Link>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
         {[
           { label: "Active Deployments", value: total, icon: Globe, color: "text-indigo-600", bg: "bg-indigo-50" },
           { label: "Pending Clearance", value: bookings.filter(b => b.status === 'pending').length, icon: Shield, color: "text-amber-600", bg: "bg-amber-50" },
           { label: "Settled Manifests", value: bookings.filter(b => b.payment_status === 'paid').length, icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-50" },
           { label: "Operational Risk", value: bookings.filter(b => b.status === 'cancelled').length, icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50" },
         ].map((stat, i) => (
           <div key={i} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex items-center gap-6 hover:shadow-xl hover:shadow-gray-100 transition-all group">
             <div className={`w-16 h-16 rounded-[24px] ${stat.bg} flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform shadow-sm border border-current/5`}>
               <stat.icon className="w-7 h-7 stroke-[1.5px]" />
             </div>
             <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
               <p className="text-3xl font-black text-gray-900 tracking-tightest leading-none">{stat.value}</p>
             </div>
           </div>
         ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
        {/* Filters Bar */}
        <div className="p-6 border-b border-gray-50 flex items-center justify-between gap-6 bg-gray-50/20">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                value={search} onChange={e => setSearch(e.target.value)} 
                placeholder="Identify Client, Manifest ID or Reference..."
                className="w-full h-12 pl-12 pr-4 bg-white border border-gray-200 rounded-xl text-xs font-bold tracking-tight focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-gray-300" 
              />
            </div>
            <div className="flex gap-2">
              <div className="relative group">
                 <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                   className="h-12 pl-4 pr-10 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer">
                   <option value="all">Security State: All</option>
                   {["pending","confirmed","completed","cancelled"].map(s => (
                     <option key={s} value={s} className="capitalize">{s}</option>
                   ))}
                 </select>
                 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
              </div>
              <div className="relative group">
                 <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)}
                   className="h-12 pl-4 pr-10 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer">
                   <option value="all">Transfers: All</option>
                   {["unpaid","partial","paid","refunded"].map(s => (
                     <option key={s} value={s} className="capitalize">{s}</option>
                   ))}
                 </select>
                 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <button 
              onClick={() => fetchBookings()}
              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-primary transition-colors bg-white rounded-xl border border-gray-200 shadow-sm"
             >
               <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
             </button>
             <div className="h-10 px-4 bg-gray-900 rounded-xl flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
               <span className="text-[10px] font-black text-white uppercase tracking-widest">{total} Synchronized</span>
             </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/30 border-b border-gray-100 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black">
                <th className="px-8 py-5">Manifest Ref</th>
                <th className="px-8 py-5">Identity Profile</th>
                <th className="px-8 py-5">Strategic Vector</th>
                <th className="px-8 py-5">Dispatch Date</th>
                <th className="px-8 py-5 text-center">Security Status</th>
                <th className="px-8 py-5 text-right">Settlement</th>
                <th className="px-8 py-5 text-right w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Synchronizing Global Network...</p>
                  </div>
                </td></tr>
              ) : bookings.length === 0 ? (
                <tr><td colSpan={7} className="px-8 py-20 text-center flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                      <FileSearch className="w-8 h-8" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">No entries detected in operational sector.</p>
                </td></tr>
              ) : bookings.map(b => (
                <tr key={b.id} className="group hover:bg-gray-50/50 transition-all">
                  <td className="px-8 py-6">
                    <div className="font-mono text-[11px] font-black text-primary bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100/50 w-fit">
                      {b.booking_ref || b.id.split("-")[0].toUpperCase()}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-black text-gray-900 tracking-tighter text-sm mb-1 group-hover:text-primary transition-colors">
                        {b.clients?.full_name ?? "ANONYMOUS ENTITY"}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded tracking-widest">
                          {b.clients?.nationality || "INTL"}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">{b.clients?.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                          <MapPin className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-extrabold text-gray-700 tracking-tighter text-xs truncate max-w-[180px]">
                          {b.packages?.name ?? "Custom Strategic Plan"}
                        </span>
                        <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{b.packages?.destination || "Global"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                         <Calendar className="w-3 h-3 text-gray-400" />
                         <span className="font-bold text-gray-800 tracking-tighter text-xs">{format(new Date(b.travel_date), "dd MMM yyyy")}</span>
                      </div>
                      <span className="text-[9px] text-gray-400 font-black uppercase tracking-tighter mt-1 italic opacity-60">Manifest Entry</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className={`mx-auto w-fit flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      STATUS_CONFIG[b.status]?.bg || 'bg-gray-50'
                    } ${
                      STATUS_CONFIG[b.status]?.color || 'text-gray-400'
                    } ${
                      STATUS_CONFIG[b.status]?.border || 'border-gray-100'
                    }`}>
                      {b.status}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-black text-gray-900 text-sm tracking-tighter">{formatCurrency(b.total_amount, b.currency)}</span>
                      <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest mt-1 ${
                        b.payment_status === 'paid' ? 'text-emerald-500' :
                        b.payment_status === 'partial' ? 'text-amber-500' :
                        'text-rose-500'
                      }`}>
                        <div className={`w-1 h-1 rounded-full ${
                           b.payment_status === 'paid' ? 'bg-emerald-500' :
                           b.payment_status === 'partial' ? 'bg-amber-500' :
                           'bg-rose-500'
                        }`} />
                        {b.payment_status}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-1 transition-all">
                      <button 
                        onClick={() => setSelectedBooking(b)}
                        className="h-10 w-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-primary hover:text-white transition-all flex items-center justify-center border border-gray-100 active:scale-95 shadow-sm"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        className="h-10 w-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center border border-gray-100 active:scale-95 shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Intelligence Pagination */}
        {totalPages > 1 && (
          <div className="px-8 py-6 border-t border-gray-50 bg-gray-50/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <span className="w-1.5 h-1.5 rounded-full bg-primary" />
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                 Sector {page + 1} of {totalPages} <span className="mx-2 text-gray-200">|</span> 
                 Displaying {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} Intelligence Units
               </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="h-10 flex items-center gap-2 px-4 rounded-xl border border-gray-200 bg-white text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-primary hover:border-primary disabled:opacity-20 transition-all active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev Sector
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="h-10 flex items-center gap-2 px-4 rounded-xl border border-gray-200 bg-white text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-primary hover:border-primary disabled:opacity-20 transition-all active:scale-95"
              >
                Next Sector
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manifest Detail Overlay */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] rounded-[3rem] p-0 border-none shadow-2xl bg-white overflow-hidden flex flex-col">
          {selectedBooking && (
            <div className="flex flex-col h-full">
              {/* Header section with cover effect */}
              <div className="relative h-48 flex items-end">
                 <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-indigo-950" />
                 <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(#fff 0.5px, transparent 0.5px)", backgroundSize: "10px 10px" }} />
                 
                 <div className="relative w-full p-10 flex items-end justify-between overflow-hidden">
                    <div className="flex items-center gap-6">
                       <div className="w-20 h-20 rounded-[2rem] bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-2xl">
                          <Shield className="w-10 h-10" />
                       </div>
                       <div>
                          <div className="flex items-center gap-3 mb-2">
                             <span className="font-mono text-[10px] font-black text-primary bg-white px-3 py-1.5 rounded-full tracking-widest">
                               MANIFEST REF: #{selectedBooking.booking_ref || selectedBooking.id.split("-")[0].toUpperCase()}
                             </span>
                             <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/20 bg-white/10 text-white backdrop-blur-sm`}>
                                STATE: {selectedBooking.status}
                             </div>
                          </div>
                          <h2 className="text-4xl font-black text-white tracking-tighter leading-none">
                            {selectedBooking.clients?.full_name}
                          </h2>
                          <div className="mt-2 flex items-center gap-4 text-white/50 text-[10px] font-black uppercase tracking-widest">
                             <span className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> Origin: {selectedBooking.clients?.nationality || 'International'}</span>
                             <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Registered: {format(new Date(selectedBooking.created_at), "dd MMM yy")}</span>
                          </div>
                       </div>
                    </div>
                    <button 
                      onClick={() => setSelectedBooking(null)}
                      className="absolute top-8 right-8 p-3 hover:bg-white/10 rounded-full transition-all text-white/40"
                    >
                      <X className="w-6 h-6" />
                    </button>
                 </div>
              </div>

              {/* Main Intel Body */}
              <div className="flex-1 overflow-y-auto p-10 bg-gray-50/50">
                 <div className="grid grid-cols-12 gap-8">
                    {/* Information Cluster */}
                    <div className="col-span-8 space-y-8">
                       <div className="grid grid-cols-2 gap-6">
                           {[
                             { label: "Traversal Corridor", value: selectedBooking.packages?.name || "Bespoke Itinerary", icon: MapPin, detail: selectedBooking.packages?.destination || "Across Tanzania" },
                             { label: "Deployment Cycle", value: `${format(new Date(selectedBooking.travel_date), "dd MMM")} - ${format(new Date(selectedBooking.return_date), "dd MMM yyyy")}`, icon: Calendar, detail: "Active Temporal Window" },
                             { label: "Asset Manifest", value: `${selectedBooking.num_adults} OPERATIVE(S)`, icon: Users, detail: `${selectedBooking.num_children} JUNIOR ASSETS` },
                             { label: "Financial Status", value: formatCurrency(selectedBooking.total_amount, selectedBooking.currency), icon: DollarSign, detail: `SETTLEMENT: ${selectedBooking.payment_status.toUpperCase()}` },
                           ].map((box, i) => (
                             <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm transition-all hover:shadow-md group">
                               <div className="flex items-center gap-4 mb-4">
                                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                     <box.icon className="w-4 h-4" />
                                  </div>
                                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{box.label}</span>
                               </div>
                               <p className="text-xl font-black text-gray-900 tracking-tighter mb-1">{box.value}</p>
                               <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">{box.detail}</p>
                             </div>
                           ))}
                       </div>

                       {/* Critical Comms */}
                       <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-8 opacity-5">
                             <Activity className="w-24 h-24 text-gray-900" />
                          </div>
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                             <Shield className="w-3 h-3 text-primary" /> Sector Communication Protocols
                          </h4>
                          <div className="space-y-6">
                             <div className="flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                      <Zap className="w-4 h-4" />
                                   </div>
                                   <div>
                                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Primary Intel Channel</p>
                                      <p className="font-bold text-gray-800 tracking-tight">{selectedBooking.clients?.email}</p>
                                   </div>
                                </div>
                                <button className="opacity-0 group-hover:opacity-100 transition-all text-[10px] font-black text-primary uppercase underline tracking-widest">Connect</button>
                             </div>
                             <div className="w-full h-px bg-gray-50" />
                             <div className="flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                      <Activity className="w-4 h-4" />
                                   </div>
                                   <div>
                                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Secure Comms Line</p>
                                      <p className="font-bold text-gray-800 tracking-tight">{selectedBooking.clients?.phone || "NO COMMS REGISTERED"}</p>
                                   </div>
                                </div>
                                <button className="opacity-0 group-hover:opacity-100 transition-all text-[10px] font-black text-primary uppercase underline tracking-widest">Dial Sector</button>
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Operational Sidebar */}
                    <div className="col-span-4 space-y-8">
                       <div className="bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl text-white">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-6">Transition Override</h4>
                          <div className="space-y-3">
                             {["pending","confirmed","completed","cancelled"].map(s => (
                               <button 
                                 key={s}
                                 onClick={() => updateStatus(selectedBooking.id, s)}
                                 disabled={updating === selectedBooking.id}
                                 className={`w-full py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-between group ${
                                   selectedBooking.status === s 
                                   ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20' 
                                   : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/30'
                                 }`}
                               >
                                 {s}
                                 {selectedBooking.status === s && <CheckCircle className="w-4 h-4" />}
                                 {selectedBooking.status !== s && <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />}
                               </button>
                             ))}
                          </div>
                          
                          <div className="mt-8 pt-8 border-t border-white/10">
                             <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                   <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                   <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">Security Clearance Required</span>
                                </div>
                                <p className="text-[10px] text-white/40 font-medium leading-relaxed italic">
                                  State transitions are logged and irreversible without director-level privileges. Ensure all financial parameters are verified before proceeding with sector completion.
                                </p>
                             </div>
                          </div>
                       </div>

                       <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Mission Log Notes</h4>
                          <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100 text-sm font-medium text-gray-700 leading-relaxed min-h-[120px]">
                             {selectedBooking.special_requests || "No mission-critical exceptions or tactical adjustments logged for this operative."}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

