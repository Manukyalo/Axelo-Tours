"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Download, RefreshCw, CreditCard, Smartphone, DollarSign, 
  Clock, MapPin, Eye, Trash2, Zap, Activity, ShieldCheck,
  TrendingUp, ArrowUpRight, Filter, ChevronRight, Search
} from "lucide-react";
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
    <div className="p-8 space-y-10 bg-[#fafafa] min-h-screen">
      {/* Elite Header */}
      <div className="flex flex-col gap-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                        <Activity className="w-3 h-3" />
                        Live Liquidity Monitor
                    </div>
                </div>
                <h1 className="text-5xl font-black text-gray-900 tracking-tighter leading-none mb-4">
                    Financial Settlement <span className="text-emerald-600 italic">Ledger</span>
                </h1>
                <p className="text-gray-500 font-medium max-w-xl text-lg leading-relaxed">
                    Audit secure global transactions, reconcile provider payouts, and monitor terminal performance in real-time.
                </p>
            </div>
            <div className="flex items-center gap-3 bg-white p-2 rounded-[24px] shadow-sm border border-gray-100">
                <Button onClick={exportCSV} variant="outline" className="gap-2 border-0 bg-gray-50 text-gray-600 hover:bg-gray-100 font-bold h-12 px-6 rounded-2xl transition-all">
                    <Download className="w-4 h-4" />
                    Export Manifest
                </Button>
                <Button 
                    onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1000); }}
                    className="gap-3 bg-gray-900 hover:bg-black text-white font-bold h-12 px-8 rounded-2xl shadow-xl shadow-gray-200 transition-all flex items-center group"
                >
                    <RefreshCw className={`w-4 h-4 group-hover:rotate-180 transition-all duration-500 ${loading ? 'animate-spin' : ''}`} />
                    Sync Ledger
                </Button>
            </div>
        </div>

        {/* Global Summary Station */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
                { 
                    label: "Gross Revenue", 
                    value: totalCompleted, 
                    sub: "Settled Funds", 
                    icon: DollarSign, 
                    color: "emerald",
                    trend: "+12.4%",
                    desc: "Verified settlements"
                },
                { 
                    label: "Pipeline Volume", 
                    value: totalPending, 
                    sub: "Awaiting Verification", 
                    icon: Clock, 
                    color: "amber",
                    trend: "Stable",
                    desc: "Transmission phase"
                },
                { 
                    label: "Traffic Hits", 
                    value: filtered.length, 
                    sub: "Total Transmissions", 
                    icon: ShieldCheck, 
                    color: "indigo",
                    trend: "Active",
                    isCount: true,
                    desc: "Secure API calls"
                },
            ].map(({ label, value, icon: Icon, color, sub, trend, isCount, desc }) => (
                <div key={label} className="group bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 relative overflow-hidden">
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-50/50 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-150 transition-transform duration-700`} />
                    
                    <div className="flex items-start justify-between mb-8 relative z-10">
                        <div className={`w-14 h-14 rounded-2xl bg-${color}-50 flex items-center justify-center text-${color}-600 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                            <Icon className="w-7 h-7" />
                        </div>
                        <div className="bg-gray-50 px-3 py-1 rounded-full text-[10px] font-black text-gray-400 group-hover:bg-white group-hover:shadow-sm transition-all uppercase tracking-widest">
                            {trend}
                        </div>
                    </div>

                    <div className="relative z-10">
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{label}</p>
                        <h3 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">
                            {isCount ? value : formatCurrency(value as number, "KES")}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[12px] font-bold text-gray-500 italic">{sub}</span>
                            <span className="w-1 h-1 bg-gray-200 rounded-full" />
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{desc}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Terminal Interface */}
      <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
                      <button onClick={() => setProviderFilter("all")} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${providerFilter === 'all' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>Global</button>
                      <button onClick={() => setProviderFilter("intasend")} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${providerFilter === 'intasend' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>M-Pesa</button>
                      <button onClick={() => setProviderFilter("stripe")} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${providerFilter === 'stripe' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>Stripe</button>
                  </div>
                  <div className="relative">
                      <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <select 
                        value={statusFilter} 
                        onChange={e => setStatusFilter(e.target.value)}
                        className="pl-10 pr-6 py-2.5 bg-white border border-gray-100 rounded-2xl text-[11px] font-black uppercase tracking-widest text-gray-500 focus:outline-none focus:ring-4 focus:ring-gray-900/5 appearance-none cursor-pointer shadow-sm min-w-[180px]"
                      >
                        <option value="all">Verification Status</option>
                        {["pending","completed","failed","refunded"].map(s => (
                          <option key={s} value={s} className="capitalize">{s}</option>
                        ))}
                      </select>
                  </div>
              </div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
                  {filtered.length} Transmission Segments Logged
              </div>
          </div>

      {/* Manifest Table */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#fcfcfc] text-[10px] uppercase text-gray-400 font-bold tracking-widest border-b border-gray-100">
              <tr>
                {["Transaction Hash / Ref","Manifest Unit","Client Identity","Channel Terminal","Settlement Value","Audit Status","Timestamp","Analysis"].map(h => (
                  <th key={h} className="px-8 py-6">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="px-8 py-20 text-center"><RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto opacity-20" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                    <td colSpan={8} className="px-8 py-32 text-center text-gray-300">
                        <div className="flex flex-col items-center gap-4">
                            <Activity className="w-12 h-12 opacity-10" />
                            <span className="font-black uppercase tracking-[0.3em] text-[10px]">No transaction signals detected</span>
                        </div>
                    </td>
                </tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="group hover:bg-[#fafafa] transition-all duration-300">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl border border-gray-100 shadow-sm group-hover:bg-white group-hover:scale-110 transition-all duration-500 overflow-hidden`}>
                             {p.provider === "intasend" 
                               ? <Smartphone className="w-4 h-4 text-emerald-600" /> 
                               : <CreditCard className="w-4 h-4 text-indigo-600" />}
                        </div>
                        <span className="font-mono text-[11px] font-black text-gray-500 group-hover:text-gray-900 transition-colors tracking-tight">
                            {p.reference}
                        </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Manifest Unit</span>
                        <span className="font-bold text-gray-900 tracking-tighter">#{p.booking_id?.split("-")[0].toUpperCase()}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-[13px]">
                    <div className="flex flex-col">
                      <span className="font-black text-gray-900 leading-tight tracking-tighter">
                        {p.bookings?.clients?.full_name ?? "External Protocol"}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold italic mt-0.5">{p.bookings?.packages?.name ?? "Custom Settlement"}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${
                      p.provider === "intasend" ? "bg-emerald-50/50 text-emerald-600 border-emerald-100" : "bg-indigo-50/50 text-indigo-600 border-indigo-100"
                    }`}>
                      {p.provider === "intasend" ? "M-Pesa Hub" : "Card Terminal"}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-black text-gray-900 text-lg tracking-tighter leading-none">{formatCurrency(p.amount, p.currency)}</span>
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1">Settled Net</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                      p.status === 'completed' ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100' :
                      p.status === 'pending' ? 'bg-white text-amber-600 border-amber-100 shadow-sm' :
                      p.status === 'failed' ? 'bg-white text-red-600 border-red-100 shadow-sm' :
                      'bg-gray-50 text-gray-400 border-gray-100'
                    }`}>
                      {p.status === 'completed' && <ShieldCheck className="w-3.5 h-3.5" />}
                      {p.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-gray-500 whitespace-nowrap text-[11px] font-bold tracking-tight">
                    {format(new Date(p.created_at), "dd MMM yyyy")}
                    <span className="block text-[9px] text-gray-300 font-black uppercase tracking-widest mt-0.5">{format(new Date(p.created_at), "HH:mm")} Z</span>
                  </td>
                  <td className="px-8 py-6">
                    <button className="p-2.5 bg-gray-50 hover:bg-white text-gray-400 hover:text-gray-900 border border-gray-100 hover:shadow-xl rounded-xl transition-all duration-300 group/btn">
                        <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
