"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  FileText, Search, RefreshCw, Send, CheckCircle2, 
  XSquare, Clock, ArrowUpRight, DollarSign, Users,
  Filter, Calendar, ExternalLink, Zap, Activity, MapPin
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GroupQuote, Partner } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { updateQuoteStatusAction } from "@/lib/actions/partners";
import toast from "react-hot-toast";

export default function QuotesPage() {
  const supabase = createClient();
  const [quotes, setQuotes] = useState<GroupQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedQuote, setSelectedQuote] = useState<GroupQuote | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("group_quotes")
      .select("*, partner:partners(*)")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Failed to load quotes");
    } else {
      setQuotes(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const handleStatusUpdate = async (id: string, status: string, partnerEmail?: string, quoteRef?: string) => {
    setIsUpdating(true);
    try {
      await updateQuoteStatusAction(id, status, partnerEmail, quoteRef);
      toast.success(`Quote status updated to ${status}`);
      fetchQuotes();
      setSelectedQuote(null);
    } catch (err) {
      toast.error("Failed to update status");
    }
    setIsUpdating(false);
  };

  const filtered = quotes.filter(q => {
    const matchesSearch = 
      q.quote_ref.toLowerCase().includes(search.toLowerCase()) || 
      q.destination.toLowerCase().includes(search.toLowerCase()) ||
      q.partner?.company_name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterStatus === "all" || q.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted": return "bg-blue-100 text-blue-700";
      case "sent": return "bg-emerald-100 text-emerald-700";
      case "declined": return "bg-red-100 text-red-700";
      case "expired": return "bg-gray-100 text-gray-700";
      case "accepted": return "bg-purple-100 text-purple-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Elite Header */}
      <div className="flex flex-col gap-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
                <div className="flex items-center gap-3 text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-3">
                    <div className="w-10 h-[1px] bg-primary/30" />
                    B2B Settlement Hub
                </div>
                <h1 className="text-5xl font-black text-gray-900 tracking-tighter flex items-center gap-4 italic uppercase">
                    Trade_Manifest
                    <span className="text-gray-200 not-italic">/</span>
                    <span className="text-primary tracking-[0.1em]">2026</span>
                </h1>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 bg-gray-100/80 p-1.5 rounded-[22px] border border-gray-100">
                    {["all", "submitted", "sent", "accepted"].map((s) => (
                        <button 
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={`px-6 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? "bg-white text-gray-900 shadow-xl scale-105" : "text-gray-400 hover:text-gray-600"}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Global Metrics Station */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             {[
               { label: "Total_Volume", value: filtered.length, icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50" },
               { label: "Pending_Hub", value: quotes.filter(q => q.status === 'submitted').length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
               { label: "Settled_Assets", value: quotes.filter(q => q.status === 'accepted').length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
               { label: "Financial_Yield", value: `$${quotes.reduce((acc, q) => acc + (q.total_net_usd || 0), 0).toLocaleString()}`, icon: ArrowUpRight, color: "text-primary", bg: "bg-primary/5" }
             ].map((stat, i) => (
                <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-500">
                    <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bg} rounded-full -mr-16 -mt-16 opacity-20 group-hover:scale-150 transition-transform duration-700`} />
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center shadow-inner`}>
                            <stat.icon className="w-5 h-5 stroke-[2.5px]" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{stat.label}</span>
                    </div>
                    <div className="text-3xl font-black text-gray-900 tracking-tighter">{stat.value}</div>
                </div>
             ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white/50 backdrop-blur-md">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search_Reference / Partner_ID / Node_Destination..."
              className="w-full pl-16 pr-8 h-16 bg-gray-50/50 border border-transparent rounded-[2rem] text-sm focus:ring-4 focus:ring-primary/5 focus:bg-white outline-none transition-all font-black tracking-tight"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4">
            <Button 
                variant="outline" 
                className="h-16 px-8 rounded-[2rem] border-gray-100 text-[10px] font-black uppercase tracking-widest gap-3 shadow-sm hover:bg-gray-50 transition-all"
                onClick={fetchQuotes}
            >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} text-primary`} />
                Refresh_Ledger
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-800">
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Request_Identity</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Logistics_Hub</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-center">Load_Volume</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Net_Ledger</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Operational_Status</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">System_Nexus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(quote => (
                <tr key={quote.id} className="group hover:bg-gray-50/80 transition-all duration-300">
                  <td className="px-10 py-8">
                    <div className="font-black text-gray-900 text-[15px] tracking-tight uppercase italic flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-primary/20 rounded-full group-hover:bg-primary transition-colors" />
                        #{quote.quote_ref}
                    </div>
                    <div className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mt-1 ml-3.5 opacity-60 group-hover:opacity-100 transition-opacity">ORG: {quote.partner?.company_name}</div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-3 font-black text-gray-900 text-[13px] tracking-tight uppercase">
                      <MapPin className="h-4 w-4 text-primary opacity-40" />
                      {quote.destination}
                    </div>
                    <div className="text-[10px] text-gray-400 flex items-center gap-2 mt-1.5 font-bold uppercase tracking-[0.15em] ml-7">
                      SET_EXEC: {new Date(quote.travel_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-[10px] font-black text-gray-800 uppercase tracking-widest border border-gray-200">
                      <Users className="h-3.5 w-3.5 text-gray-400" />
                      {quote.pax_count}_PAX
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="text-[16px] font-black text-emerald-600 tracking-tighter">${quote.total_net_usd?.toLocaleString()}</div>
                    <div className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1 italic">M_YIELD: {quote.margin_pct}%</div>
                  </td>
                  <td className="px-10 py-8">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${
                      quote.status === 'submitted' ? 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-100/50' :
                      quote.status === 'sent' ? 'bg-indigo-50 text-indigo-600 border-indigo-100 shadow-indigo-100/50' :
                      quote.status === 'accepted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-100/50' :
                      'bg-gray-50 text-gray-500 border-gray-100'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                          quote.status === 'submitted' ? 'bg-amber-500' :
                          quote.status === 'sent' ? 'bg-indigo-500' :
                          quote.status === 'accepted' ? 'bg-emerald-500' :
                          'bg-gray-400'
                      }`} />
                      {quote.status}
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <button 
                      onClick={() => setSelectedQuote(quote)}
                      className="inline-flex items-center gap-3 text-[10px] font-black bg-gray-900 border border-gray-800 text-white px-8 py-3.5 rounded-[1.5rem] hover:bg-primary transition-all shadow-xl hover:shadow-primary/20 uppercase tracking-[0.2em]"
                    >
                      Process_Node <ExternalLink className="h-3.5 w-3.5 stroke-[3px]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Processing Dialog */}
      <Dialog open={!!selectedQuote} onOpenChange={(open) => !open && setSelectedQuote(null)}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 overflow-hidden bg-white border-0 shadow-2xl rounded-[40px]">
            <div className="flex flex-col h-full uppercase">
                {/* Elite Settlement Header */}
                <div className="px-12 py-10 bg-gray-900 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 text-primary font-black tracking-[0.3em] text-[10px] mb-2">
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            Financial Settlement Terminal
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tighter italic">
                            SETTLE_NODE_#{selectedQuote?.quote_ref}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                         <div className="px-5 py-2.5 bg-white/5 rounded-xl border border-white/10 text-right">
                            <p className="text-[8px] font-black text-white/40 tracking-widest leading-none mb-1">Status</p>
                            <p className={`text-xs font-black tracking-widest leading-none ${
                                selectedQuote?.status === 'submitted' ? 'text-amber-400' :
                                selectedQuote?.status === 'sent' ? 'text-indigo-400' :
                                'text-emerald-400'
                            }`}>{selectedQuote?.status}_PENDING</p>
                         </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-16">
                    {/* Financial Ledger Matrix */}
                    <div className="grid grid-cols-3 gap-8">
                        <div className="p-8 rounded-[3rem] bg-emerald-50 border border-emerald-100 shadow-sm group hover:scale-[1.02] transition-transform">
                            <div className="text-[10px] font-black text-emerald-600 tracking-[0.2em] mb-4 flex items-center gap-2">
                                <DollarSign className="w-4 h-4" /> NET_ASSET_COST
                            </div>
                            <div className="text-4xl font-black text-emerald-900 tracking-tighter">${selectedQuote?.total_net_usd?.toLocaleString()}</div>
                        </div>
                        <div className="p-8 rounded-[3rem] bg-indigo-50 border border-indigo-100 shadow-sm group hover:scale-[1.02] transition-transform">
                            <div className="text-[10px] font-black text-indigo-600 tracking-[0.2em] mb-4 flex items-center gap-2">
                                <ArrowUpRight className="w-4 h-4" /> BASE_QUOTATION
                            </div>
                            <div className="text-4xl font-black text-indigo-900 tracking-tighter">${selectedQuote?.total_sell_usd?.toLocaleString()}</div>
                        </div>
                        <div className="p-8 rounded-[3rem] bg-amber-50/50 border border-amber-100 shadow-sm group hover:scale-[1.02] transition-transform">
                            <div className="text-[10px] font-black text-amber-600 tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4" /> HUB_MAR_YIELD
                            </div>
                            <div className="text-4xl font-black text-amber-900 tracking-tighter">{selectedQuote?.margin_pct}%</div>
                        </div>
                    </div>

                    {/* Partner Nexus Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black text-gray-400 tracking-[0.3em] flex items-center gap-3">
                                <div className="w-6 h-[1px] bg-gray-200" /> PARTNER_ORIGIN_DATA
                            </h3>
                            <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-4">
                                <div className="flex justify-between items-center pb-4 border-b border-gray-200/50">
                                    <span className="text-[10px] font-black text-gray-400">ORGANIZATION</span>
                                    <span className="text-sm font-black text-gray-900">{selectedQuote?.partner?.company_name}</span>
                                </div>
                                <div className="flex justify-between items-center pb-4 border-b border-gray-200/50">
                                    <span className="text-[10px] font-black text-gray-400">CONTACT_LINK</span>
                                    <span className="text-sm font-black text-indigo-600">{selectedQuote?.partner?.email}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-gray-400">DESTINATION_NODE</span>
                                    <span className="text-sm font-black text-gray-900">{selectedQuote?.destination}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black text-gray-400 tracking-[0.3em] flex items-center gap-3">
                                <div className="w-6 h-[1px] bg-gray-200" /> INVENTORY_MANIFEST
                            </h3>
                            <div className="space-y-3">
                                {selectedQuote?.line_items?.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-primary/30 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-1.5 h-1.5 rounded-full ${item.type === 'package' ? 'bg-primary' : 'bg-amber-400'}`} />
                                            <span className="text-[12px] font-black text-gray-800 tracking-tight group-hover:text-primary transition-colors">{item.name}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[8px] font-black text-gray-400 tracking-widest bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">{item.type}</span>
                                            <span className="text-[11px] font-black text-indigo-600">QNTY_{item.qty}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Operational Directives */}
                    {selectedQuote?.notes && (
                        <div className="p-10 rounded-[3rem] bg-gray-900 text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                <FileText className="w-24 h-24 rotate-12" />
                            </div>
                            <div className="text-[10px] font-black text-primary tracking-[0.3em] mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" /> OPERATIONAL_DIRECTIVES
                            </div>
                            <p className="text-xl font-black italic tracking-tight leading-relaxed text-gray-300">
                                "{selectedQuote.notes}"
                            </p>
                        </div>
                    )}
                </div>

                {/* Settlement Controls */}
                <div className="p-12 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-8">
                    <div className="flex gap-4">
                         <Button 
                            variant="outline" 
                            className="h-16 px-10 rounded-2xl border-gray-200 font-black text-[10px] tracking-[0.2em] text-red-500 hover:bg-red-50 hover:border-red-100 transition-all bg-white"
                            onClick={() => handleStatusUpdate(selectedQuote!.id, 'declined')}
                            disabled={isUpdating}
                        >
                            <XSquare className="h-4 w-4 mr-3" /> DECLINE_REQUEST
                        </Button>
                        <Button 
                            variant="ghost" 
                            className="h-16 px-10 rounded-2xl font-black text-[10px] tracking-[0.2em] text-gray-400 hover:text-gray-900"
                            onClick={() => setSelectedQuote(null)}
                        >
                            TERMINATE_SESSION
                        </Button>
                    </div>

                    {selectedQuote?.status === 'submitted' && (
                        <Button 
                            className="h-16 px-12 rounded-2xl bg-gray-900 hover:bg-primary text-white font-black tracking-[0.2em] text-[11px] transition-all shadow-2xl flex items-center gap-4 hover:scale-105 active:scale-95"
                            onClick={() => handleStatusUpdate(selectedQuote.id, 'sent', selectedQuote.partner?.email, selectedQuote.quote_ref)}
                            disabled={isUpdating}
                        >
                            {isUpdating ? <RefreshCw className="animate-spin h-5 w-5" /> : (
                                <>
                                    AUTHORIZE_&_DISPATCH_SETTLEMENT
                                    <Send className="h-4 w-4 stroke-[3px]" />
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
