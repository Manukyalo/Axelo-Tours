"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Search, Filter, Download, Eye, ChevronRight, ChevronLeft,
  X, CheckCircle, XCircle, RefreshCw,
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
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-500 text-sm">{total} total bookings</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-4 items-center">
        <div className="relative flex-grow min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search client or booking ID..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="all">All Statuses</option>
          {["pending","confirmed","completed","cancelled"].map(s => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </select>
        <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="all">All Payments</option>
          {["unpaid","partial","paid","refunded"].map(s => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {["Booking ID","Client","Package","Travel Date","Guests","Amount","Status","Payment","Actions"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center"><RefreshCw className="w-5 h-5 text-primary animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-gray-400">No bookings found.</td></tr>
              ) : filtered.map(b => (
                <tr key={b.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs text-gray-500">{b.id.split("-")[0].toUpperCase()}</td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900">{b.clients?.full_name ?? "—"}</p>
                    <p className="text-xs text-gray-400">{b.clients?.email}</p>
                  </td>
                  <td className="px-5 py-4 text-gray-600 max-w-[160px] truncate">{b.packages?.name ?? "—"}</td>
                  <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{format(new Date(b.travel_date), "dd MMM yyyy")}</td>
                  <td className="px-5 py-4 text-gray-600">{(b.num_adults || 0) + (b.num_children || 0)}</td>
                  <td className="px-5 py-4 font-bold text-gray-900 whitespace-nowrap">{formatCurrency(b.total_amount, b.currency)}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${STATUS_BG[b.status]}`}>{b.status}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${PAYMENT_BG[b.payment_status]}`}>{b.payment_status}</span>
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => setSelectedBooking(b)} className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
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

      {/* Detail Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ["ID", selectedBooking.id.split("-")[0].toUpperCase()],
                  ["Client", selectedBooking.clients?.full_name],
                  ["Email", selectedBooking.clients?.email],
                  ["Phone", selectedBooking.clients?.phone],
                  ["Package", selectedBooking.packages?.name],
                  ["Travel Date", format(new Date(selectedBooking.travel_date), "dd MMM yyyy")],
                  ["Return", format(new Date(selectedBooking.return_date), "dd MMM yyyy")],
                  ["Adults", selectedBooking.num_adults],
                  ["Children", selectedBooking.num_children],
                  ["Total", formatCurrency(selectedBooking.total_amount, selectedBooking.currency)],
                  ["Special Requests", selectedBooking.special_requests || "None"],
                ].map(([k, v]) => (
                  <div key={String(k)}>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">{k}</p>
                    <p className="text-gray-900 font-medium mt-0.5">{v || "—"}</p>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-3">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {["pending","confirmed","completed","cancelled"].map(s => (
                    <button key={s} onClick={() => updateStatus(selectedBooking.id, s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize border transition-all ${selectedBooking.status === s ? STATUS_BG[s] : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
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
