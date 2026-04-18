"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Download, RefreshCw, CreditCard, Smartphone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/formatters";
import { Payment } from "@/types";
import { Button } from "@/components/ui/button";

const STATUS_BG: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  failed: "bg-red-100 text-red-700 border-red-200",
  refunded: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function PaymentsPage() {
  const supabase = createClient();
  const [payments, setPayments] = useState<(Payment & { bookings?: any })[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerFilter, setProviderFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function fetchPayments() {
      const { data } = await supabase
        .from("payments")
        .select("*, bookings(id, clients(full_name), packages(name))")
        .order("created_at", { ascending: false });
      setPayments((data as any[]) || []);
      setLoading(false);
    }
    fetchPayments();
  }, []);

  const filtered = payments.filter(p =>
    (providerFilter === "all" || p.provider === providerFilter) &&
    (statusFilter === "all" || p.status === statusFilter)
  );

  const totalCompleted = filtered
    .filter(p => p.status === "completed")
    .reduce((s, p) => s + p.amount, 0);

  const totalPending = filtered
    .filter(p => p.status === "pending")
    .reduce((s, p) => s + p.amount, 0);

  const exportCSV = () => {
    const rows = [
      ["Reference", "Booking ID", "Client", "Provider", "Amount", "Currency", "Status", "Date"],
      ...filtered.map(p => [
        p.reference, p.booking_id, p.bookings?.clients?.full_name, p.provider,
        p.amount, p.currency, p.status, format(new Date(p.created_at), "yyyy-MM-dd"),
      ]),
    ];
    const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "axelo-payments.csv";
    a.click();
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments Ledger</h1>
          <p className="text-gray-500 text-sm">{payments.length} total transactions</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      {/* Summary Totals */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Completed Revenue", value: totalCompleted, className: "bg-emerald-50 border-emerald-100" },
          { label: "Pending Amount", value: totalPending, className: "bg-amber-50 border-amber-100" },
          { label: "Total Transactions", value: filtered.length, className: "bg-blue-50 border-blue-100", isCount: true },
        ].map(({ label, value, className, isCount }) => (
          <div key={label} className={`rounded-2xl border p-5 ${className}`}>
            <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900">
              {isCount ? value : formatCurrency(value as number, "KES")}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <select value={providerFilter} onChange={e => setProviderFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="all">All Providers</option>
          <option value="intasend">M-Pesa (IntaSend)</option>
          <option value="stripe">Stripe (Card)</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="all">All Statuses</option>
          {["pending","completed","failed","refunded"].map(s => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </select>
        <span className="text-sm text-gray-400">{filtered.length} results</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {["Reference","Booking ID","Client","Provider","Amount","Currency","Status","Date"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center"><RefreshCw className="w-5 h-5 animate-spin text-primary mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400">No payments found.</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs text-gray-500 max-w-[120px] truncate">{p.reference}</td>
                  <td className="px-5 py-4 font-mono text-xs text-gray-500">{p.booking_id?.split("-")[0].toUpperCase()}</td>
                  <td className="px-5 py-4 font-medium text-gray-900">{p.bookings?.clients?.full_name ?? "—"}</td>
                  <td className="px-5 py-4">
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      p.provider === "intasend" ? "bg-green-50 text-green-700 border-green-200" : "bg-purple-50 text-purple-700 border-purple-200"
                    }`}>
                      {p.provider === "intasend"
                        ? <Smartphone className="w-3 h-3" />
                        : <CreditCard className="w-3 h-3" />}
                      {p.provider === "intasend" ? "M-Pesa" : "Stripe"}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-bold text-gray-900">{formatCurrency(p.amount, p.currency)}</td>
                  <td className="px-5 py-4 text-gray-500 font-medium">{p.currency}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize border ${STATUS_BG[p.status]}`}>{p.status}</span>
                  </td>
                  <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{format(new Date(p.created_at), "dd MMM yyyy HH:mm")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
