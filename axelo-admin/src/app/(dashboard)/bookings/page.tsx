"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Search, Filter, Download, Eye, ChevronRight, ChevronLeft,
  X, CheckCircle, XCircle, RefreshCw, Plus
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/formatters";
import { Booking } from "@/types";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 20;

const STATUS_BG: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border border-amber-200",
  confirmed: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  completed: "bg-blue-100 text-blue-700 border border-blue-200",
  cancelled: "bg-red-100 text-red-700 border border-red-200",
};

const PAYMENT_BG: Record<string, string> = {
  unpaid: "bg-red-100 text-red-700",
  partial: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
  refunded: "bg-gray-100 text-gray-600",
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

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("bookings")
      .select("*, clients(full_name, email, phone, nationality), packages(name, destination)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (paymentFilter !== "all") query = query.eq("payment_status", paymentFilter);

    const { data, count } = await query;
    setBookings((data as any[]) || []);
    setTotal(count || 0);
    setLoading(false);
  }, [page, statusFilter, paymentFilter]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("bookings").update({ status }).eq("id", id);
    fetchBookings();
    setSelectedBooking(null);
  };

  const exportCSV = () => {
    const rows = [
      ["ID", "Client", "Package", "Travel Date", "Guests", "Amount", "Currency", "Status", "Payment Status", "Created"],
      ...bookings.map(b => [
        b.id, b.clients?.full_name, b.packages?.name, b.travel_date,
        b.num_adults + b.num_children, b.total_amount, b.currency, b.status, b.payment_status,
        format(new Date(b.created_at), "yyyy-MM-dd"),
      ]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "axelo-bookings.csv"; a.click();
  };

  const filtered = bookings.filter(b =>
    !search || b.clients?.full_name?.toLowerCase().includes(search.toLowerCase()) || b.id.includes(search)
  );

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tighter">
            <span className="w-2 h-8 bg-indigo-600 rounded-full hidden md:block" />
            Operational Manifest
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            Monitor live bookings, guest status, and financial transitions.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={exportCSV} variant="outline" className="gap-2 border-gray-200 text-gray-600 hover:bg-gray-50 font-bold h-12 px-6 rounded-2xl transition-all">
            <Download className="w-4 h-4" />
            Export Data
          </Button>
          <Link href="/bookings/new">
            <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-primary hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-indigo-200 text-white font-bold h-12 px-6 rounded-2xl">
              <Plus className="w-5 h-5" />
              New Entry
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col mb-8">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-4">
               <div className="flex items-center gap-4 flex-1">
                   <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            value={search} onChange={e => setSearch(e.target.value)} 
                            placeholder="Identify Client or Manifest ID..."
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30" 
                        />
                   </div>
                   <div className="flex gap-2">
                      <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[140px]">
                        <option value="all">All States</option>
                        {["pending","confirmed","completed","cancelled"].map(s => (
                          <option key={s} value={s} className="capitalize">{s}</option>
                        ))}
                      </select>
                      <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[140px]">
                        <option value="all">Financials</option>
                        {["unpaid","partial","paid","refunded"].map(s => (
                          <option key={s} value={s} className="capitalize">{s}</option>
                        ))}
                      </select>
                   </div>
               </div>
               <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                    <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> 
                        {total} Total Bookings
                    </span>
               </div>
          </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-[10px] uppercase text-gray-400 font-black tracking-widest border-b border-gray-100">
              <tr>
                {["Manifest ID","Client Manifest","Destination / Package","Dispatch Date","Manifest Status","Financials","Manifest actions"].map(h => (
                  <th key={h} className="px-6 py-4 font-bold tracking-widest uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center"><RefreshCw className="w-5 h-5 text-primary animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest">No entries found in manifest.</td></tr>
              ) : filtered.map(b => (
                <tr key={b.id} className="group hover:bg-gray-50/50 transition-all border-b border-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-mono text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      #{b.id.split("-")[0].toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 leading-tight tracking-tighter">
                        {b.clients?.full_name ?? "Missing Identity"}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium">{b.clients?.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <MapPin className="w-4 h-4" />
                       </div>
                       <span className="font-bold text-gray-700 tracking-tighter truncate max-w-[150px]">{b.packages?.name ?? "Custom Itinerary"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-700 tracking-tighter">{format(new Date(b.travel_date), "dd MMM yyyy")}</span>
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">Scheduled Arrival</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      b.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      b.status === 'completed' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                      'bg-gray-50 text-gray-400 border-gray-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        b.status === 'confirmed' ? 'bg-emerald-600' :
                        b.status === 'pending' ? 'bg-amber-600' :
                        b.status === 'completed' ? 'bg-indigo-600' :
                        'bg-gray-400'
                      }`} />
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-black text-gray-900 text-[13px] tracking-tighter">{formatCurrency(b.total_amount, b.currency)}</span>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${
                        b.payment_status === 'paid' ? 'text-emerald-500' :
                        b.payment_status === 'partial' ? 'text-amber-500' :
                        'text-red-500'
                      }`}>
                        {b.payment_status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100">
                      <Button 
                        variant="ghost" size="icon" 
                        onClick={() => setSelectedBooking(b)}
                        className="h-9 w-9 rounded-xl hover:bg-white hover:text-indigo-600 hover:shadow-sm border border-transparent hover:border-indigo-100"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" size="icon" 
                        className="h-9 w-9 rounded-xl hover:bg-white hover:text-red-600 hover:shadow-sm border border-transparent hover:border-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-gray-700">Page {page + 1} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-hidden rounded-[32px] p-0 border-none shadow-2xl bg-gray-50">
          {selectedBooking && (
            <div className="flex flex-col h-full max-h-[90vh]">
              {/* Premium Header */}
              <div className="bg-white p-8 border-b border-gray-100 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-100">
                      Manifest #{selectedBooking.id.split("-")[0].toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 border rounded-full text-[10px] font-black uppercase tracking-widest ${
                      selectedBooking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-100'
                    }`}>
                      {selectedBooking.status}
                    </span>
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tighter">
                    {selectedBooking.clients?.full_name}
                  </h2>
                  <p className="text-gray-500 font-medium mt-1 uppercase text-[11px] tracking-widest">
                    Operational Deployment File
                  </p>
                </div>
                <button onClick={() => setSelectedBooking(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-8 flex-1">
                {/* Information Grid */}
                <div className="grid grid-cols-2 gap-8 lg:grid-cols-3">
                  {[
                    { label: "Travel Date", value: format(new Date(selectedBooking.travel_date), "dd MMM yyyy"), icon: Clock },
                    { label: "Return Date", value: format(new Date(selectedBooking.return_date), "dd MMM yyyy"), icon: RefreshCw },
                    { label: "Guest Manifest", value: `${selectedBooking.num_adults} Adult(s), ${selectedBooking.num_children} Child(ren)`, icon: Users },
                    { label: "Selected Package", value: selectedBooking.packages?.name || "TBA", icon: MapPin },
                    { label: "Financial Total", value: formatCurrency(selectedBooking.total_amount, selectedBooking.currency), icon: DollarSign },
                    { label: "Payment Status", value: selectedBooking.payment_status.toUpperCase(), icon: Award },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mb-3">
                        <item.icon className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                      <p className="text-sm font-bold text-gray-900 tracking-tight">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Special Requests */}
                <div className="bg-amber-50/50 p-6 rounded-[24px] border border-amber-100">
                   <div className="flex items-center gap-2 mb-4 text-amber-600">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Crucial Operator Notes</span>
                   </div>
                   <p className="text-gray-700 text-sm font-medium leading-relaxed italic">
                      "{selectedBooking.special_requests || "No special requests or dietary requirements logged for this manifest."}"
                   </p>
                </div>

                {/* Contact Sub-Table */}
                <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Communication Channels</p>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <span className="text-sm font-bold text-gray-600">Secure Email</span>
                         <span className="text-sm font-bold text-indigo-600">{selectedBooking.clients?.email}</span>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                         <span className="text-sm font-bold text-gray-600">Communication Line</span>
                         <span className="text-sm font-bold text-gray-900">{selectedBooking.clients?.phone || "Not Registered"}</span>
                      </div>
                   </div>
                </div>

                {/* Action Dock */}
                <div className="pt-4 flex items-center gap-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-4">Transition State:</p>
                    {["pending","confirmed","completed","cancelled"].map(s => (
                      <button 
                        key={s} 
                        onClick={() => updateStatus(selectedBooking.id, s)}
                        disabled={updating === selectedBooking.id}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                          selectedBooking.status === s 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100 ring-4 ring-indigo-50' 
                          : 'bg-white text-gray-400 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
