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
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Welcome back — here's what's happening.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/packages/new" className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" /> Add Package
          </Link>
          <Link href="/bookings" className="flex items-center gap-2 border border-gray-200 bg-white text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">
            View All Bookings
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard label="Total Bookings" value={String(totalBookings)} icon={CalendarCheck} trend="+12%" color="bg-primary" />
        <StatCard label="Revenue This Month" value={formatCurrency(thisMonthKES, "KES")} sub="KES" icon={TrendingUp} trend="+8%" color="bg-emerald-500" />
        <StatCard label="Pending Bookings" value={String(pendingCount)} sub="Requires action" icon={Clock} color="bg-amber-500" />
        <StatCard label="Active Packages" value={String(activePackages)} sub={`of ${packages.length} total`} icon={Package} color="bg-blue-500" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Line Chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-900 mb-6">Revenue — Last 30 Days (KES)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v) => [formatCurrency(Number(v ?? 0), "KES"), "Revenue"]}
                contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#1A6B3A" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Donut Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Bookings by Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusCounts} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {statusCounts.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(v) => <span className="text-xs text-gray-600 font-medium">{v}</span>}
              />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Recent Bookings</h2>
          <Link href="/bookings" className="text-sm text-primary font-bold hover:underline">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Booking ID", "Client", "Package", "Travel Date", "Amount", "Status", "Payment"].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">No bookings yet.</td>
                </tr>
              ) : recent.map(b => (
                <tr key={b.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{b.id.split("-")[0].toUpperCase()}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{b.clients?.full_name ?? "—"}</td>
                  <td className="px-6 py-4 text-gray-600">{b.packages?.name ?? "—"}</td>
                  <td className="px-6 py-4 text-gray-600">{format(new Date(b.travel_date), "dd MMM yyyy")}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">{formatCurrency(b.total_amount, b.currency)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${STATUS_BG[b.status]}`}>{b.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${PAYMENT_BG[b.payment_status]}`}>{b.payment_status}</span>
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
