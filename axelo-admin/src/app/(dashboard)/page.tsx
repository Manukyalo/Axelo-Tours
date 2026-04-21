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
      className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all group"
    >
      <div className="flex items-start justify-between mb-6">
        <div className={`w-14 h-14 rounded-3xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        {trend && (
          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full flex items-center gap-1.5 uppercase tracking-widest">
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[3px]" />{trend}
          </span>
        )}
      </div>
      <p className="text-3xl font-black text-gray-900 tracking-tighter mb-1.5">{value}</p>
      <p className="text-[11px] text-gray-400 font-black uppercase tracking-[0.2em]">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-2 font-bold italic opacity-60">{sub}</p>}
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
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 px-2">
        <div>
          <div className="flex items-center gap-2 mb-3">
             <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
             <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Admin Dashboard</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">
             Overview
          </h1>
          <p className="text-gray-500 text-base">
            Monitor your recent bookings, revenue, and overall business performance.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/bookings" className="flex items-center h-12 gap-2 bg-white text-gray-700 px-6 rounded-xl text-sm font-semibold hover:bg-gray-50 border border-gray-200 transition-all shadow-sm">
            View All Bookings
          </Link>
          <Link href="/bookings/new" className="flex items-center h-12 gap-2 bg-gray-900 text-white px-6 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all shadow-md">
            <Plus className="w-4 h-4" /> New Booking
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: "Monthly Revenue", value: formatCurrency(thisMonthKES, "KES"), icon: TrendingUp, color: "emerald", sub: "Last 30 Days", trend: "+8.4%" },
          { label: "Total Bookings", value: String(totalBookings), icon: CalendarCheck, color: "emerald", sub: "All time", trend: "+12.1%" },
          { label: "Action Required", value: String(pendingCount), icon: Clock, color: "amber", sub: "Pending Bookings", trend: "Attention Needed" },
          { label: "Active Packages", value: String(activePackages), icon: Package, color: "indigo", sub: "Available Tours", trend: `${packages.length} Total` },
        ].map(({ label, value, icon: Icon, color, sub, trend }) => (
          <div key={label} className="group bg-white p-6 rounded-2xl border border-gray-200 shadow-sm transition-all hover:shadow-md relative overflow-hidden">
             <div className="flex items-start justify-between mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-sm border ${
                  color === 'emerald' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' :
                  color === 'amber' ? 'bg-amber-50 text-amber-600 border-amber-100/50' :
                  'bg-indigo-50 text-indigo-600 border-indigo-100/50'
                }`}>
                   <Icon className="w-6 h-6" />
                </div>
                <div className="text-right">
                   <p className="text-xs font-semibold text-gray-500 tracking-wider mb-2">{label}</p>
                   {trend && (
                     <span className={`text-[10px] font-semibold border rounded-full px-2.5 py-0.5 ${trend.includes('+') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {trend}
                     </span>
                   )}
                </div>
             </div>
             <p className="text-3xl font-bold text-gray-900 mb-1">
                {value}
             </p>
             <p className="text-sm font-medium text-gray-500">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Financial Overview</h2>
                <h3 className="text-xl font-bold text-gray-900">Gross Revenue (KES)</h3>
              </div>
              <div className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                  <span className="text-xs font-medium text-gray-600">Last 30 Days</span>
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
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="mb-6">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Bookings Overview</h2>
              <h3 className="text-xl font-bold text-gray-900">Status Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusCounts} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value" stroke="none">
                {statusCounts.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
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
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-xs font-medium text-gray-600 capitalize">{s.name}: {s.value}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Recent Activity</h2>
              <h3 className="text-lg font-bold text-gray-900">Latest Bookings</h3>
          </div>
          <Link href="/bookings" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
            View All &rarr;
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-xs uppercase text-gray-500 font-semibold border-b border-gray-200">
              <tr>
                {["Booking ID", "Client", "Package", "Travel Date", "Amount", "Status"].map(h => (
                  <th key={h} className="px-6 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">No recent bookings.</td>
                </tr>
              ) : recent.map(b => (
                <tr key={b.id} className="hover:bg-gray-50/50 transition-all">
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs text-gray-600 font-medium">
                      #{b.id.split("-")[0].toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900 text-sm">{b.clients?.full_name ?? "Unknown Client"}</span>
                      <span className="text-xs text-gray-500 mt-0.5">{b.clients?.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {b.packages?.name ?? "Custom Package"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                    {format(new Date(b.travel_date), "dd MMM yyyy")}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900 text-sm">
                    {formatCurrency(b.total_amount, b.currency)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                        b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        b.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        b.status === 'completed' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
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
