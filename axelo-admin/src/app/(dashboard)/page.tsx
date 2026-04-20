"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  CalendarCheck,
  Package,
  Clock,
  ArrowUpRight,
  Plus,
  RefreshCw,
  LucideIcon,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/formatters";
import { Booking, SafariPackage } from "@/types";
import { format, subDays, startOfDay } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  confirmed: "#10B981",
  completed: "#3B82F6",
  cancelled: "#EF4444",
};

const STATUS_BG: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
};

const PAYMENT_BG: Record<string, string> = {
  unpaid: "bg-red-100 text-red-700",
  partial: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
  refunded: "bg-gray-100 text-gray-600",
};

function StatCard({ label, value, sub, icon: Icon, trend, color }: {
  label: string; value: string; sub?: string; icon: LucideIcon;
  trend?: string; color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />{trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </motion.div>
  );
}

export default function AdminDashboard() {
  const supabase = createClient();
  const [bookings, setBookings] = useState<(Booking & { clients?: any; packages?: any })[]>([]);
  const [packages, setPackages] = useState<SafariPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [{ data: bData }, { data: pData }] = await Promise.all([
        supabase
          .from("bookings")
          .select("*, clients(full_name, email), packages(name)")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase.from("packages").select("*"),
      ]);
      setBookings((bData as any[]) || []);
      setPackages((pData as SafariPackage[]) || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Derived stats
  const totalBookings = bookings.length;
  const pendingCount = bookings.filter(b => b.status === "pending").length;
  const activePackages = packages.filter(p => p.available).length;

  const thisMonthKES = bookings
    .filter(b => {
      const d = new Date(b.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && b.currency === "KES";
    })
    .reduce((sum, b) => sum + (b.total_amount || 0), 0);

  // Revenue line chart — last 30 days
  const revenueData = Array.from({ length: 30 }, (_, i) => {
    const day = subDays(new Date(), 29 - i);
    const dayStr = format(day, "MMM d");
    const revenue = bookings
      .filter(b => {
        const bDay = startOfDay(new Date(b.travel_date));
        return bDay.getTime() === startOfDay(day).getTime() && b.currency === "KES";
      })
      .reduce((sum, b) => sum + (b.total_amount || 0), 0);
    return { day: dayStr, revenue };
  });

  // Donut data
  const statusCounts = ["pending", "confirmed", "completed", "cancelled"].map(s => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    value: bookings.filter(b => b.status === s).length,
    color: STATUS_COLORS[s],
  }));

  const recent = bookings.slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter flex items-center gap-3">
             <span className="w-2 h-10 bg-primary rounded-full hidden md:block" />
             Operational Mission Control
          </h1>
          <p className="text-gray-500 text-lg mt-1 font-medium italic">
            Command center for real-time safari operations and financial throughput.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/bookings" className="flex items-center h-12 gap-2 border border-gray-200 bg-white text-gray-700 px-6 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95 shadow-sm">
            Operational Hub
          </Link>
          <Link href="/bookings/new" className="flex items-center h-12 gap-2 bg-gradient-to-r from-primary to-emerald-600 text-white px-6 rounded-2xl text-sm font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-emerald-100">
            <Plus className="w-5 h-5 stroke-[3px]" /> Deploy Booking
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Active Revenue Pipeline", value: formatCurrency(thisMonthKES, "KES"), icon: TrendingUp, color: "emerald", sub: "30-Day Velocity", trend: "+8.4%" },
          { label: "Booking Transmissions", value: String(totalBookings), icon: CalendarCheck, color: "primary", sub: "Total Life Cycle", trend: "+12.1%" },
          { label: "Critical Actions Required", value: String(pendingCount), icon: Clock, color: "amber", sub: "Pending Manifests", trend: "Attention Needed" },
          { label: "Available Inventory", value: String(activePackages), icon: Package, color: "indigo", sub: "Live Experiences", trend: `${packages.length} Total` },
        ].map(({ label, value, icon: Icon, color, sub, trend }) => (
          <div key={label} className="group bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-100 transition-all hover:-translate-y-1">
             <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-${color === 'primary' ? 'emerald' : color}-50 flex items-center justify-center text-${color === 'primary' ? 'emerald' : color}-600 group-hover:scale-110 transition-all shadow-sm`}>
                   <Icon className="w-6 h-6" />
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
                   {trend && (
                     <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${trend.includes('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {trend}
                     </span>
                   )}
                </div>
             </div>
             <p className="text-3xl font-black text-gray-900 tracking-tighter mb-1">
                {value}
             </p>
             <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 overflow-hidden hover:shadow-xl hover:shadow-gray-100 transition-all">
          <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Financial Throughput</h2>
                <h3 className="text-xl font-black text-gray-900 tracking-tighter">Gross Revenue velocity (KES)</h3>
              </div>
              <div className="bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-black text-gray-500 uppercase">Last 30 Days Cycle</span>
              </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
              <XAxis dataKey="day" hide />
              <YAxis hide />
              <Tooltip
                cursor={{ stroke: '#10b981', strokeWidth: 1 }}
                content={({ active, payload }) => {
                   if (active && payload && payload.length) {
                     return (
                       <div className="bg-gray-900 text-white p-3 rounded-2xl shadow-2xl border border-gray-800">
                         <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{payload[0].payload.day}</p>
                         <p className="text-sm font-black tracking-tighter">{formatCurrency(payload[0].value as number, "KES")}</p>
                       </div>
                     );
                   }
                   return null;
                }}
              />
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981 shadow-lg' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Donut Chart */}
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 hover:shadow-xl hover:shadow-gray-100 transition-all">
          <div className="mb-6">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Operational Pulse</h2>
              <h3 className="text-xl font-black text-gray-900 tracking-tighter">Status Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusCounts} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value" stroke="none">
                {statusCounts.map((entry, i) => (
                  <Cell key={i} fill={entry.color} cornerRadius={12} />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-gray-900 text-white p-3 rounded-2xl shadow-2xl border border-gray-800">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{payload[0].name}</p>
                        <p className="text-sm font-black tracking-tighter">{payload[0].value} Units</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-2">
              {statusCounts.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{s.name}: {s.value}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-gray-100 transition-all">
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div>
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Operational Queue</h2>
              <h3 className="text-xl font-black text-gray-900 tracking-tighter">Synchronized Manifest</h3>
          </div>
          <Link href="/bookings" className="h-10 px-6 flex items-center bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all shadow-sm">
            Access Full Ledger
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-[10px] uppercase text-gray-400 font-black tracking-widest border-b border-gray-100">
              <tr>
                {["Manifest ID", "Identity Hub", "Service Line", "Window", "Settlement", "Audit Status"].map(h => (
                  <th key={h} className="px-8 py-4 font-bold tracking-widest uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-16 text-center text-gray-400 font-black uppercase text-xs tracking-widest">Awaiting system transmissions...</td>
                </tr>
              ) : recent.map(b => (
                <tr key={b.id} className="group hover:bg-gray-50/50 transition-all border-b border-gray-50">
                  <td className="px-8 py-6">
                    <span className="font-mono text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      {b.id.split("-")[0].toUpperCase()}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-black text-gray-900 text-[13px] tracking-tighter">{b.clients?.full_name ?? "External Identity"}</span>
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">{b.clients?.email}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <span className="text-[12px] font-bold text-gray-600 leading-tight tracking-tight uppercase">{b.packages?.name ?? "Custom Module"}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-gray-900 tracking-tighter uppercase">{format(new Date(b.travel_date), "dd MMM yyyy")}</span>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Deployment Date</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 font-black text-gray-900 text-[13px] tracking-tighter">
                    {formatCurrency(b.total_amount, b.currency)}
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        b.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        b.status === 'completed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        b.status === 'confirmed' ? 'bg-emerald-600' :
                        b.status === 'pending' ? 'bg-amber-600' :
                        b.status === 'completed' ? 'bg-blue-600' :
                        'bg-red-600'
                      }`} />
                      {b.status}
                    </span>
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
