"use client";

import { useState } from "react";
import { 
  FileCheck, Search, RefreshCw, Send, Plus, 
  Printer, Download, Mail, Filter, Calendar,
  MoreHorizontal, MapPin, Building2, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const MOCK_VOUCHERS = [
  {
    id: "VCH-2024-001",
    booking_ref: "AXL-8829",
    client_name: "Sarah Jenkins",
    lodge_name: "Mara Serena Safari Lodge",
    destination: "Maasai Mara",
    check_in: "2024-06-15",
    status: "dispatched",
    service_type: "Full Board"
  },
  {
    id: "VCH-2024-002",
    booking_ref: "AXL-9012",
    client_name: "Robert Mckenzie",
    lodge_name: "Amboseli Serena",
    destination: "Amboseli",
    check_in: "2024-06-18",
    status: "confirmed",
    service_type: "Full Board"
  },
  {
    id: "VCH-2024-003",
    booking_ref: "AXL-7741",
    client_name: "Elena Rodriguez",
    lodge_name: "Sarova Lion Hill",
    destination: "Nakuru",
    check_in: "2024-06-20",
    status: "pending",
    service_type: "Full Board +"
  }
];

export default function VouchersPage() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-10 min-h-screen pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tighter">
            <span className="w-2 h-8 bg-primary rounded-full hidden md:block" />
            Voucher Dispatch Manifest
          </h1>
          <p className="text-gray-500 mt-2 font-bold italic">
            Secure asset generation and lodge confirmation logistics for active bookings.
          </p>
        </div>
        <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2 bg-white border-gray-200 text-gray-600 hover:bg-gray-50 font-black uppercase tracking-widest text-[10px] h-12 px-6 rounded-2xl transition-all shadow-sm">
                <Filter className="w-4 h-4 stroke-[3px]" />
                Filter Manifest
            </Button>
            <Button className="gap-2 bg-gradient-to-r from-primary to-emerald-600 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-emerald-100 text-white font-black uppercase tracking-widest text-[10px] h-12 px-6 rounded-2xl">
                <Plus className="w-4 h-4 stroke-[3px]" />
                Gen Neural Voucher
            </Button>
        </div>
      </div>

      {/* Stats Station */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
              { label: "Active Assets", value: "128", trend: "+12%", color: "primary" },
              { label: "Lodge Confirmations", value: "94%", trend: "Synced", color: "indigo" },
              { label: "Pending Dispatch", value: "14", trend: "Critical", color: "amber" },
              { label: "Neural Audits", value: "Checked", trend: "Secure", color: "emerald" }
          ].map((stat, i) => (
              <div key={i} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-100 transition-all group">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{stat.label}</p>
                  <div className="flex items-end justify-between">
                      <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">{stat.value}</h3>
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter border ${
                          stat.color === 'amber' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          'bg-indigo-50 text-indigo-600 border-indigo-100'
                      }`}>
                          {stat.trend}
                      </span>
                  </div>
              </div>
          ))}
      </div>

      {/* Main Registry */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
        <div className="p-8 border-b border-gray-100 bg-gray-50/30 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search reference, client or lodge..."
              className="w-full pl-12 pr-6 h-14 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold tracking-tight shadow-inner"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            className="h-14 w-14 rounded-2xl border-gray-100 flex items-center justify-center p-0 bg-white hover:bg-gray-50 transition-all font-black"
          >
            <RefreshCw className="h-5 w-5 text-primary stroke-[3px]" />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Voucher Identity</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Operational Node</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Guest Segment</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Timeline</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Sequence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {MOCK_VOUCHERS.map(v => (
                <tr key={v.id} className="group hover:bg-gray-50/50 transition-all">
                  <td className="px-8 py-6">
                    <div className="font-black text-gray-900 text-[15px] tracking-tighter uppercase italic italic">#{v.id}</div>
                    <div className="text-[10px] text-indigo-600 font-black uppercase tracking-wider mt-0.5">REF: {v.booking_ref}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 font-black text-gray-900 text-[13px] tracking-tight uppercase">
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                      {v.lodge_name}
                    </div>
                    <div className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-1 font-bold uppercase tracking-widest">
                      <MapPin className="h-3 w-3" />
                      {v.destination}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 font-black text-gray-900 text-[13px] tracking-tight uppercase">
                      <User className="h-3.5 w-3.5 text-indigo-400" />
                      {v.client_name}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-widest">
                      Plan: {v.service_type}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-[11px] font-black text-gray-700 uppercase tracking-tight">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-gray-300" />
                        {new Date(v.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      v.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      v.status === 'dispatched' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                      'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <button className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:text-primary transition-all border border-gray-100 shadow-sm"><Printer className="w-4 h-4" /></button>
                        <button className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:text-primary transition-all border border-gray-100 shadow-sm"><Mail className="w-4 h-4" /></button>
                        <button className="p-2.5 rounded-xl bg-gray-900 text-white hover:scale-[1.05] transition-all shadow-lg"><Download className="w-4 h-4" /></button>
                    </div>
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
