"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings2, Shield, Key, Globe, 
  Users, Bell, Database, Zap, 
  Lock, Cpu, Activity, Fingerprint,
  RefreshCw, CheckCircle2, AlertTriangle,
  ChevronRight, ArrowUpRight, Sparkles,
  Layers, Wallet, Cog, Terminal, Server
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("calibration");

  return (
    <div className="p-10 pb-32 space-y-12 bg-[#fafafa] min-h-screen">
      {/* Strategic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-indigo-600/10 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 border border-indigo-100 shadow-sm">
              <Cog className="w-3.5 h-3.5" />
              System Core Calibration
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Logic Kernels Operational
            </div>
          </div>
          <h1 className="text-6xl font-black text-gray-900 tracking-tighter leading-none mb-6 uppercase italic">
            System <span className="text-indigo-600 font-black">Core</span>
          </h1>
          <p className="text-gray-500 font-medium max-w-2xl text-xl leading-snug italic">
            Managing the neural foundation of the Axelo network. Orchestrating API transmissions, security integrity, and high-frequency financial calibration.
          </p>
        </div>

        <div className="flex items-center gap-4">
            <Button 
                variant="outline"
                className="gap-3 border-gray-200 text-gray-900 bg-white hover:bg-gray-50 font-black uppercase tracking-widest text-[11px] h-16 px-10 rounded-[28px] shadow-sm transition-all"
            >
                <Terminal className="w-5 h-5 text-indigo-600" />
                Root Terminal
            </Button>
            <Button 
                className="gap-3 bg-gray-900 hover:bg-black text-white font-black uppercase tracking-widest text-[11px] h-16 px-10 rounded-[28px] shadow-2xl shadow-gray-200 transition-all border-none relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-fuchsia-400 opacity-20" />
                <Settings2 className="w-5 h-5 text-indigo-400" />
                Deploy Patch
            </Button>
        </div>
      </div>

      {/* System Health Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
              { label: "Uptime Velocity", value: "99.98%", trend: "Stable", icon: Server, color: "indigo" },
              { label: "Security Integrity", value: "Locked", trend: "Verified", icon: Shield, color: "emerald" },
              { label: "API Transmission", value: "14ms", trend: "Optimal", icon: Activity, color: "fuchsia" },
              { label: "Logic Cache", value: "Dynamic", trend: "Active", icon: Database, color: "amber" }
          ].map((stat, i) => (
              <div key={i} className="group bg-white p-10 rounded-[48px] border border-gray-100 shadow-xl shadow-gray-100/50 hover:shadow-2xl hover:shadow-gray-200 transition-all duration-500 relative overflow-hidden">
                   <div className={`absolute top-0 right-0 w-32 h-32 bg-${stat.color}-50/50 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700`} />
                   
                   <div className="flex items-start justify-between mb-10 relative z-10">
                        <div className={`w-14 h-14 rounded-2xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600 shadow-sm border border-${stat.color}-100 group-hover:scale-110 transition-transform duration-500`}>
                            <stat.icon className="w-7 h-7" />
                        </div>
                        <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border transition-all ${
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

      {/* Settings Navigation & Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Navigation Sidebar */}
          <div className="space-y-4">
              {[
                  { id: "calibration", label: "Infrastructure", icon: Cpu },
                  { id: "security", label: "Access & Security", icon: Lock },
                  { id: "financial", label: "Fiscal Logic", icon: Wallet },
                  { id: "users", label: "Command Entities", icon: Users },
                  { id: "notifications", label: "Transmission Rules", icon: Bell }
              ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between p-6 rounded-[28px] transition-all group ${
                        activeTab === item.id 
                        ? "bg-gray-900 text-white shadow-2xl scale-[1.02]" 
                        : "bg-white text-gray-400 border border-gray-100 hover:border-indigo-100 hover:text-gray-900"
                    }`}
                  >
                      <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-2xl ${activeTab === item.id ? "bg-white/10" : "bg-gray-50 group-hover:bg-indigo-50"}`}>
                              <item.icon className="w-5 h-5" />
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-[0.2em]">{item.label}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === item.id ? "translate-x-0" : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"}`} />
                  </button>
              ))}
          </div>

          {/* Configuration Panel */}
          <div className="lg:col-span-3 space-y-8">
              <div className="bg-white rounded-[64px] border border-gray-100 shadow-3xl shadow-gray-200/50 p-12 relative overflow-hidden">
                <div className="absolute top-0 right-10 flex gap-2">
                    <div className="w-1.5 h-6 bg-indigo-600 rounded-b-full opacity-40" />
                    <div className="w-1.5 h-8 bg-indigo-600 rounded-b-full opacity-20" />
                    <div className="w-1.5 h-10 bg-indigo-600 rounded-b-full opacity-10" />
                </div>

                <div className="max-w-2xl">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic mb-2">Core Optimization</h2>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-12">Calibrating neural infrastructure and system parameters</p>

                    <div className="space-y-10">
                        {/* Setting Item */}
                        <div className="flex items-center justify-between group">
                            <div>
                                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-1 group-hover:text-indigo-600 transition-colors">Spectral Cache Rate</h4>
                                <p className="text-[10px] font-medium text-gray-400 italic">Determine the frequency of global destination indexing</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">300ms / High</span>
                                <div className="w-12 h-6 bg-gray-900 rounded-full p-1 flex justify-end">
                                    <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                                </div>
                            </div>
                        </div>

                        <div className="w-full h-px bg-gray-50" />

                        <div className="flex items-center justify-between group">
                            <div>
                                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-1 group-hover:text-fuchsia-600 transition-colors">Neural Margin Logic</h4>
                                <p className="text-[10px] font-medium text-gray-400 italic">Allow AI to auto-calibrate cost sheet markups</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black text-fuchsia-600 uppercase tracking-widest">Enabled / Active</span>
                                <div className="w-12 h-6 bg-fuchsia-600 rounded-full p-1 flex justify-end">
                                    <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                                </div>
                            </div>
                        </div>

                        <div className="w-full h-px bg-gray-50" />

                        <div className="flex items-center justify-between group">
                            <div>
                                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-1 group-hover:text-indigo-600 transition-colors">Multi-Region Redundancy</h4>
                                <p className="text-[10px] font-medium text-gray-400 italic">Force synchronization across secondary server nodes</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Global Standby</span>
                                <div className="w-12 h-6 bg-gray-100 rounded-full p-1">
                                    <div className="w-4 h-4 bg-white rounded-full shadow-sm border border-gray-200" />
                                </div>
                            </div>
                        </div>

                        <div className="pt-10">
                            <h4 className="text-xs font-black text-gray-900 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                <Key className="w-3.5 h-3.5 text-indigo-600 stroke-[3px]" />
                                Infrastructure Access Tokens
                            </h4>
                            <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 flex items-center justify-between group hover:border-indigo-100 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse" />
                                    <div className="font-mono text-xs text-gray-400 tracking-widest">ax_live_09918273645...</div>
                                </div>
                                <button className="text-[9px] font-black text-indigo-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity underline decoration-2 underline-offset-4">Regenerate Key</button>
                            </div>
                        </div>
                    </div>
                </div>
              </div>

              {/* Bottom Support/Danger Station */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  <div className="bg-indigo-600 rounded-[48px] p-10 text-white relative overflow-hidden group shadow-3xl shadow-indigo-100">
                      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                          <CheckCircle2 className="w-40 h-40 rotate-12" />
                      </div>
                      <div className="relative z-10">
                          <h3 className="text-2xl font-black tracking-tighter uppercase italic leading-none mb-4">System Verification</h3>
                          <p className="text-white/60 text-sm font-bold uppercase tracking-widest leading-relaxed mb-8">All core modules are synchronized with the Asset Logistics design language.</p>
                          <Button className="bg-white text-indigo-600 hover:bg-indigo-50 font-black uppercase text-[10px] tracking-widest h-12 px-8 rounded-2xl transition-all border-none">Execute System Audit</Button>
                      </div>
                  </div>

                  <div className="bg-rose-50 rounded-[48px] p-10 border border-rose-100 relative overflow-hidden group shadow-xl shadow-rose-50">
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                          <AlertTriangle className="w-40 h-40 text-rose-600 -rotate-12" />
                      </div>
                      <div className="relative z-10">
                          <h3 className="text-2xl font-black text-rose-900 tracking-tighter uppercase italic leading-none mb-4 whitespace-nowrap">Factory Recalibration</h3>
                          <p className="text-rose-600/60 text-sm font-bold uppercase tracking-widest leading-relaxed mb-8 italic">Caution: Resetting kernel parameters will disrupt active client transmissions.</p>
                          <Button variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-100 font-black uppercase text-[10px] tracking-widest h-12 px-8 rounded-2xl transition-all h-12">Hard Force Reset</Button>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}
