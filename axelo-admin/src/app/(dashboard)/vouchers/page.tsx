"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileCheck, Search, RefreshCw, Send, Plus, 
  Printer, Download, Mail, Filter, Calendar,
  MoreHorizontal, MapPin, Building2, User,
  Shield, CreditCard, Zap, Activity, Globe,
  MoreVertical, ChevronRight, Fingerprint, 
  Layers, Database, Sparkles, Wand2, ArrowUpRight,
  Hexagon, Wallet, Receipt, Box
} from "lucide-react";
import { Button } from "@/components/ui/button";

const MOCK_VOUCHERS = [
  {
    id: "VCH-2024-001",
    booking_ref: "AXL-8829",
    client_name: "Sarah Jenkins",
    lodge_name: "Mara Serena Safari Lodge",
    destination: "Maasai Mara",
    check_in: "2024-06-15",
    status: "dispatched",
    service_type: "Full Board",
    value: "$4,250.00"
  },
  {
    id: "VCH-2024-002",
    booking_ref: "AXL-9012",
    client_name: "Robert Mckenzie",
    lodge_name: "Amboseli Serena",
    destination: "Amboseli",
    check_in: "2024-06-18",
    status: "confirmed",
    service_type: "Full Board",
    value: "$2,890.00"
  },
  {
    id: "VCH-2024-003",
    booking_ref: "AXL-7741",
    client_name: "Elena Rodriguez",
    lodge_name: "Sarova Lion Hill",
    destination: "Nakuru",
    check_in: "2024-06-20",
    status: "pending",
    service_type: "Full Board +",
    value: "$3,120.00"
  },
  {
    id: "VCH-2024-004",
    booking_ref: "AXL-6612",
    client_name: "Marcus Thorne",
    lodge_name: "Loisaba Star Beds",
    destination: "Laikipia",
    check_in: "2024-07-05",
    status: "confirmed",
    service_type: "All Inclusive",
    value: "$8,400.00"
  }
];

export default function VouchersPage() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-10 pb-32 space-y-12 bg-[#fafafa] min-h-screen">
      {/* Strategic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-indigo-600/10 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 border border-indigo-100 shadow-sm">
              <Shield className="w-3.5 h-3.5" />
              Financial Asset Governance
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Audit Trail Synchronized
            </div>
          </div>
          <h1 className="text-6xl font-black text-gray-900 tracking-tighter leading-none mb-6 uppercase italic">
            Credit <span className="text-indigo-600 font-black">Instruments</span>
          </h1>
          <p className="text-gray-500 font-medium max-w-2xl text-xl leading-snug italic">
            Managing global travel credit across the Axelo network. High-fidelity voucher generation with real-time lodge reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-4">
            <Button 
                variant="outline"
                className="gap-3 border-gray-200 text-gray-900 bg-white hover:bg-gray-50 font-black uppercase tracking-widest text-[11px] h-16 px-10 rounded-[28px] shadow-sm transition-all"
            >
                <Filter className="w-5 h-5 text-indigo-600" />
                Audit Filter
            </Button>
            <Button 
                className="gap-3 bg-gray-900 hover:bg-black text-white font-black uppercase tracking-widest text-[11px] h-16 px-10 rounded-[28px] shadow-2xl shadow-gray-200 transition-all border-none relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-fuchsia-100 opacity-20" />
                <Plus className="w-5 h-5 text-indigo-400 group-hover:rotate-90 transition-transform" />
                Gen Neural Instrument
            </Button>
        </div>
      </div>

      {/* Financial Health Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
              { label: "Active Book Value", value: "$842.5K", trend: "+14.2%", icon: Wallet, color: "indigo" },
              { label: "Node Reconciliation", value: "98.8%", trend: "Synced", icon: RefreshCw, color: "emerald" },
              { label: "Critical Dispatch", value: "08", trend: "High Priority", icon: Box, color: "rose" },
              { label: "Neural Integrity", value: "Verified", trend: "SSL-Locked", icon: Fingerprint, color: "amber" }
          ].map((stat, i) => (
              <div key={i} className="group bg-white p-10 rounded-[48px] border border-gray-100 shadow-xl shadow-gray-100/50 hover:shadow-2xl hover:shadow-gray-200 transition-all duration-500 relative overflow-hidden">
                   <div className={`absolute top-0 right-0 w-32 h-32 bg-${stat.color}-50/50 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700`} />
                   
                   <div className="flex items-start justify-between mb-10 relative z-10">
                        <div className={`w-14 h-14 rounded-2xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600 shadow-sm border border-${stat.color}-100 group-hover:scale-110 transition-transform duration-500`}>
                            <stat.icon className="w-7 h-7" />
                        </div>
                        <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border transition-all ${
                            stat.color === 'rose' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                            stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            'bg-gray-50 text-gray-400 border-gray-100'
                        }`}>
                            {stat.trend}
                        </span>
                   </div>

                   <div className="relative z-10">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">{stat.label}</p>
                       <h3 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">{stat.value}</h3>
                   </div>
              </div>
          ))}
      </div>

      {/* Main Financial Registry */}
      <div className="space-y-8">
          <div className="flex items-center justify-between px-6">
              <div className="flex items-center gap-5">
                  <Database className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">Instrument Registry</h2>
              </div>
              <div className="flex-1 max-w-xl mx-20">
                <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                    <input 
                      type="text"
                      placeholder="Identify instrument via reference, entity or client..."
                      className="w-full pl-16 pr-6 h-16 bg-white border border-gray-100 rounded-[28px] text-[15px] focus:ring-8 focus:ring-indigo-50 outline-none transition-all font-bold tracking-tight shadow-sm placeholder:text-gray-200"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
              </div>
              <div className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] flex items-center gap-3">
                  <Activity className="w-4 h-4 text-indigo-500 animate-pulse" />
                  Live Sync Status
              </div>
          </div>

          <div className="bg-white rounded-[64px] border border-gray-100 shadow-3xl shadow-gray-200/50 overflow-hidden relative">
            <div className="absolute top-0 right-10 flex gap-2">
                <div className="w-1.5 h-6 bg-indigo-600 rounded-b-full opacity-40" />
                <div className="w-1.5 h-8 bg-indigo-600 rounded-b-full opacity-20" />
                <div className="w-1.5 h-10 bg-indigo-600 rounded-b-full opacity-10" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#fcfcfc] border-b border-gray-50">
                  <tr>
                    <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-gray-300">Instrument Signature</th>
                    <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-gray-300">Operational Entity</th>
                    <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-gray-300">Beneficiary Identity</th>
                    <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-gray-300">Temporal Node</th>
                    <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-gray-300">Tactical Status</th>
                    <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-gray-300 text-right">Execution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {MOCK_VOUCHERS.map((v, idx) => (
                    <motion.tr 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={v.id} 
                        className="group hover:bg-gray-50/50 transition-all duration-300"
                    >
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center text-white italic font-black text-xl shadow-lg group-hover:scale-110 transition-transform">
                                V
                            </div>
                            <div>
                                <div className="font-black text-gray-900 text-[18px] tracking-tighter uppercase italic">#{v.id}</div>
                                <div className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                                    <Fingerprint className="w-3 h-3" />
                                    {v.booking_ref}
                                </div>
                            </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-4 font-black text-gray-900 text-sm tracking-tight uppercase italic leading-none mb-1">
                          <Building2 className="h-4 w-4 text-indigo-500" />
                          {v.lodge_name}
                        </div>
                        <div className="text-[10px] text-gray-400 flex items-center gap-2 font-bold uppercase tracking-widest">
                          <MapPin className="h-3 w-3 text-emerald-400" />
                          {v.destination}
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-4 font-black text-gray-900 text-sm tracking-tight uppercase italic leading-none mb-1">
                          <User className="h-4 w-4 text-indigo-400" />
                          {v.client_name}
                        </div>
                        <div className="text-[10px] text-gray-400 flex items-center gap-2 font-bold uppercase tracking-widest">
                          <Zap className="h-3 w-3 text-amber-500" />
                          {v.service_type} • <span className="text-gray-900">{v.value}</span>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1.5">Scheduled Deployment</span>
                            <div className="flex items-center gap-2 text-[13px] font-black text-gray-700 uppercase tracking-tight italic">
                                <Calendar className="h-4 w-4 text-indigo-600" />
                                {new Date(v.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                            </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <span className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm transition-all flex items-center gap-2 w-fit ${
                          v.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-50/50' :
                          v.status === 'dispatched' ? 'bg-indigo-50 text-indigo-600 border-indigo-100 shadow-indigo-50/50' :
                          'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-50/50'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${v.status === 'confirmed' ? 'bg-emerald-500' : v.status === 'dispatched' ? 'bg-indigo-500' : 'bg-amber-500'} animate-pulse`} />
                          {v.status}
                        </span>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                            <button className="p-3.5 rounded-2xl bg-white text-gray-400 hover:text-indigo-600 hover:bg-gray-50 border border-gray-100 shadow-sm transition-all" title="Print Asset"><Printer className="w-5 h-5" /></button>
                            <button className="p-3.5 rounded-2xl bg-white text-gray-400 hover:text-indigo-600 hover:bg-gray-50 border border-gray-100 shadow-sm transition-all" title="Secure Email Dispatch"><Mail className="w-5 h-5" /></button>
                            <button className="p-3.5 rounded-2xl bg-gray-900 text-white hover:bg-black hover:scale-110 transition-all shadow-xl shadow-gray-200" title="Download Source Asset"><Download className="w-5 h-5" /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      </div>

      {/* Tactical Bottom Control Station */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="bg-gray-900 rounded-[48px] p-10 text-white relative overflow-hidden group shadow-3xl shadow-gray-200">
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full -mr-40 -mt-40 blur-[100px] group-hover:scale-150 transition-transform duration-1000" />
                
                <div className="flex items-center gap-5 mb-8 relative z-10">
                    <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/10 shadow-inner">
                        <Hexagon className="w-7 h-7 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black tracking-tighter uppercase italic leading-none mb-1">Financial Reconciliation</h3>
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Neural Verification Engine</span>
                    </div>
                </div>

                <div className="space-y-6 relative z-10">
                    <p className="text-white/60 text-lg font-medium italic leading-relaxed">
                        Currently processing 14 pending lodge confirmations for the Q3 cycle. Automated reconciliation module is identifying mismatched rate signatures.
                    </p>
                    <div className="flex items-center gap-4">
                        <Button className="bg-white text-black hover:bg-indigo-50 font-black uppercase text-[10px] tracking-widest h-12 px-8 rounded-2xl transition-all border-none">Initiate Neural Sync</Button>
                        <div className="flex items-center gap-3 text-emerald-400">
                            <Activity className="w-4 h-4 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Logic: Optimizing</span>
                        </div>
                    </div>
                </div>
          </div>

          <div className="bg-indigo-600 rounded-[48px] p-10 text-white relative overflow-hidden group shadow-3xl shadow-indigo-100">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Receipt className="w-40 h-40 rotate-12" />
                </div>

                <div className="flex items-center gap-5 mb-8 relative z-10">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/20 shadow-inner">
                        <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black tracking-tighter uppercase italic leading-none mb-1">Audit Log Velocity</h3>
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Global Credit Distribution</span>
                    </div>
                </div>

                <div className="flex items-center justify-between relative z-10">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Secure Transitions</span>
                        <div className="text-5xl font-black tracking-tighter uppercase italic italic leading-none">1,402.1<span className="text-white/30 truncate ml-2">OPS/sec</span></div>
                    </div>
                    <button className="w-20 h-20 rounded-full bg-white/10 hover:bg-white text-white hover:text-indigo-600 flex items-center justify-center border border-white/20 transition-all duration-300">
                        <ArrowUpRight className="w-8 h-8" />
                    </button>
                </div>
          </div>
      </div>
    </div>
  );
}
