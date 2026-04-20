"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calculator, Search, RefreshCw, Plus, 
  TrendingUp, Activity, Shield, Coins,
  ArrowUpRight, ChevronRight, Zap, Target,
  Layers, Database, Sparkles, Wand2, 
  BarChart3, Scale, Tag, PieChart, Info,
  CheckCircle2, Hexagon, Fingerprint, Box
} from "lucide-react";
import { Button } from "@/components/ui/button";

const MOCK_COSTS = [
  {
    id: "CST-882-01",
    label: "Mara Serena Net Rate",
    category: "Accommodation",
    net_cost: "$280.00",
    markup: "25%",
    final_price: "$350.00",
    status: "calibrated",
    last_sync: "2 hours ago"
  },
  {
    id: "CST-882-02",
    label: "Masai Mara Park Fees (Non-Res)",
    category: "Fixed Logistics",
    net_cost: "$80.00",
    markup: "0%",
    final_price: "$80.00",
    status: "locked",
    last_sync: "12 mins ago"
  },
  {
    id: "CST-882-03",
    label: "Private Land Cruiser (Daily)",
    category: "Transport",
    net_cost: "$150.00",
    markup: "40%",
    final_price: "$210.00",
    status: "calibrated",
    last_sync: "4 days ago"
  },
  {
    id: "CST-882-04",
    label: "Flying Doc Insurance (7 Days)",
    category: "Logistics",
    net_cost: "$45.00",
    markup: "10%",
    final_price: "$49.50",
    status: "review",
    last_sync: "1 hour ago"
  }
];

export default function CostingPage() {
  const [search, setSearch] = useState("");

  return (
    <div className="p-10 pb-32 space-y-12 bg-[#fafafa] min-h-screen">
      {/* Strategic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-fuchsia-600/10 text-fuchsia-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 border border-fuchsia-100 shadow-sm">
              <Scale className="w-3.5 h-3.5" />
              Logistics Pricing Engine
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Margin Computation Active
            </div>
          </div>
          <h1 className="text-6xl font-black text-gray-900 tracking-tighter leading-none mb-6 uppercase italic">
            Logistics <span className="text-fuchsia-600 font-black">Costing</span>
          </h1>
          <p className="text-gray-500 font-medium max-w-2xl text-xl leading-snug italic">
            Precision pricing logic for complex safari itineraries. Orchestrating net rates, fixed logistics, and strategic markups with neural-level accuracy.
          </p>
        </div>

        <div className="flex items-center gap-4">
            <Button 
                variant="outline"
                className="gap-3 border-gray-200 text-gray-900 bg-white hover:bg-gray-50 font-black uppercase tracking-widest text-[11px] h-16 px-10 rounded-[28px] shadow-sm transition-all"
            >
                <Database className="w-5 h-5 text-fuchsia-600" />
                Net Rate Sync
            </Button>
            <Button 
                className="gap-3 bg-gray-900 hover:bg-black text-white font-black uppercase tracking-widest text-[11px] h-16 px-10 rounded-[28px] shadow-2xl shadow-gray-200 transition-all border-none relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-indigo-600 opacity-20" />
                <Plus className="w-5 h-5 text-fuchsia-400 group-hover:rotate-90 transition-transform" />
                New Cost Sheet
            </Button>
        </div>
      </div>

      {/* Pricing KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
              { label: "Target Gross Margin", value: "34.2%", trend: "Optimal", icon: PieChart, color: "fuchsia" },
              { label: "Pricing Accuracy", value: "99.8%", trend: "Verified", icon: Target, color: "emerald" },
              { label: "Yield Velocity", value: "+12.4%", trend: "Rising", icon: TrendingUp, color: "indigo" },
              { label: "Node Calibration", value: "Synced", trend: "Live", icon: Zap, color: "amber" }
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

      {/* Pricing Manifest Interface */}
      <div className="space-y-8">
          <div className="flex items-center justify-between px-6">
              <div className="flex items-center gap-5">
                  <Box className="w-6 h-6 text-fuchsia-600" />
                  <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">Cost Logic Manifest</h2>
              </div>
              <div className="flex-1 max-w-xl mx-20">
                <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 group-focus-within:text-fuchsia-600 transition-colors" />
                    <input 
                      type="text"
                      placeholder="Identify cost component..."
                      className="w-full pl-16 pr-6 h-16 bg-white border border-gray-100 rounded-[28px] text-[15px] focus:ring-8 focus:ring-fuchsia-50 outline-none transition-all font-bold tracking-tight shadow-sm placeholder:text-gray-200"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
              </div>
              <div className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] flex items-center gap-3">
                  <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                  Live Operational Stream
              </div>
          </div>

          <div className="bg-white rounded-[64px] border border-gray-100 shadow-3xl shadow-gray-200/50 overflow-hidden relative">
            <div className="absolute top-0 right-10 flex gap-2">
                <div className="w-1.5 h-6 bg-fuchsia-600 rounded-b-full opacity-40" />
                <div className="w-1.5 h-8 bg-fuchsia-600 rounded-b-full opacity-20" />
                <div className="w-1.5 h-10 bg-fuchsia-600 rounded-b-full opacity-10" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#fcfcfc] border-b border-gray-50">
                  <tr>
                    <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-gray-300">Operational Identity</th>
                    <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-gray-300">Base Net Value</th>
                    <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-gray-300">Strategic Markup</th>
                    <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-gray-300">Terminal Pricing</th>
                    <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-gray-300">Logic Status</th>
                    <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-gray-300 text-right">Execution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {MOCK_COSTS.map((c, idx) => (
                    <motion.tr 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={c.id} 
                        className="group hover:bg-fuchsia-50/20 transition-all duration-300"
                    >
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center text-white italic font-black text-xl shadow-lg group-hover:scale-110 transition-transform">
                                {c.label[0]}
                            </div>
                            <div>
                                <div className="font-black text-gray-900 text-[18px] tracking-tighter uppercase italic">{c.label}</div>
                                <div className="text-[10px] text-fuchsia-600 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                                    <Tag className="w-3 h-3" />
                                    {c.category}
                                </div>
                            </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="font-black text-gray-900 text-[18px] tracking-tighter uppercase italic">{c.net_cost}</div>
                        <div className="text-[10px] text-gray-300 font-bold uppercase tracking-widest mt-1">BASE COST NODE</div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-2 text-indigo-600">
                           <TrendingUp className="w-4 h-4" />
                           <span className="font-black text-[18px] tracking-tighter italic">{c.markup}</span>
                        </div>
                        <div className="text-[10px] text-gray-300 font-bold uppercase tracking-widest mt-1 italic">STRATEGIC ACCRETION</div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="font-black text-gray-900 text-[18px] tracking-tighter uppercase underline decoration-fuchsia-100 decoration-4 italic">{c.final_price}</div>
                        <div className="text-[10px] text-gray-300 font-bold uppercase tracking-widest mt-1">PUBLIC TARGET PRICE</div>
                      </td>
                      <td className="px-10 py-8">
                        <span className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm transition-all flex items-center gap-2 w-fit ${
                          c.status === 'calibrated' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-50/50' :
                          c.status === 'locked' ? 'bg-gray-900 text-white border-gray-800 shadow-gray-200' :
                          'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-50/50'
                        }`}>
                          {c.status === 'calibrated' ? <CheckCircle2 className="w-3.5 h-3.5" /> : c.status === 'locked' ? <Shield className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                          {c.status === 'locked' ? 'Operational Hold' : c.status}
                        </span>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                             <button className="p-3.5 rounded-2xl bg-white text-gray-400 hover:text-fuchsia-600 hover:bg-gray-50 border border-gray-100 shadow-sm transition-all"><Calculator className="w-5 h-5" /></button>
                             <button className="p-3.5 rounded-2xl bg-white text-gray-400 hover:text-fuchsia-600 hover:bg-gray-50 border border-gray-100 shadow-sm transition-all"><RefreshCw className="w-5 h-5" /></button>
                             <button className="p-3.5 rounded-2xl bg-gray-900 text-white hover:bg-black hover:scale-110 transition-all shadow-xl"><ChevronRight className="w-5 h-5" /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      </div>

      {/* Cost Engineering Bottom Terminal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="bg-gray-900 rounded-[48px] p-10 text-white relative overflow-hidden group shadow-3xl shadow-gray-200">
                <div className="absolute top-0 right-0 w-80 h-80 bg-fuchsia-500/10 rounded-full -mr-40 -mt-40 blur-[100px] group-hover:scale-150 transition-transform duration-1000" />
                
                <div className="flex items-center gap-5 mb-8 relative z-10">
                    <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                        <Hexagon className="w-7 h-7 text-fuchsia-400" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black tracking-tighter uppercase italic leading-none mb-1">Pricing Logic Center</h3>
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Neural Margin Engine</span>
                    </div>
                </div>

                <div className="space-y-6 relative z-10">
                    <p className="text-white/60 text-lg font-medium italic leading-relaxed">
                        Currently processing 158 pricing points for the High Season cycle. Automated markup logic is detecting a 2.4% yield opportunity in the "Ultra-Luxe" segment.
                    </p>
                    <div className="flex items-center gap-4">
                        <Button className="bg-white text-black hover:bg-fuchsia-50 font-black uppercase text-[10px] tracking-widest h-12 px-8 rounded-2xl transition-all border-none">Execute Optimization</Button>
                        <div className="flex items-center gap-3 text-emerald-400">
                            <Activity className="w-4 h-4 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Pricing: Stable</span>
                        </div>
                    </div>
                </div>
          </div>

          <div className="bg-fuchsia-600 rounded-[48px] p-10 text-white relative overflow-hidden group shadow-3xl shadow-fuchsia-100">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Coins className="w-40 h-40 rotate-12" />
                </div>

                <div className="flex items-center gap-5 mb-8 relative z-10">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/20 shadow-inner">
                        <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black tracking-tighter uppercase italic leading-none mb-1">Live Profit Sequence</h3>
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Real-time Network Yield</span>
                    </div>
                </div>

                <div className="flex items-center justify-between relative z-10">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Network Liquidity</span>
                        <div className="text-5xl font-black tracking-tighter uppercase italic italic leading-none">94.2<span className="text-white/30 truncate ml-2">PTS</span></div>
                    </div>
                    <button className="w-20 h-20 rounded-full bg-white/10 hover:bg-white text-white hover:text-fuchsia-600 flex items-center justify-center border border-white/20 transition-all duration-300">
                        <ArrowUpRight className="w-8 h-8" />
                    </button>
                </div>
          </div>
      </div>
    </div>
  );
}
