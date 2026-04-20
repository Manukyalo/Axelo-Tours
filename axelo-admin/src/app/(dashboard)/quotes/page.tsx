"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  FileText, Search, RefreshCw, Send, CheckCircle2, 
  XSquare, Clock, ArrowUpRight, DollarSign, Users,
  Filter, Calendar, ExternalLink
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            B2B Group Quotes
          </h1>
          <p className="text-gray-500 mt-2">
            Review and approve custom safari requests from enterprise partners.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
          {["all", "submitted", "sent", "accepted"].map((s) => (
            <button 
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize ${filterStatus === s ? "bg-gray-900 text-white shadow-lg" : "text-gray-500 hover:bg-gray-50"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search reference, partner or destination..."
              className="w-full pl-11 pr-4 h-12 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            className="h-12 w-12 rounded-2xl border-gray-100 flex items-center justify-center p-0"
            onClick={fetchQuotes}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Reference / Partner</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Destination & Dates</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Group</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Financials (USD)</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(quote => (
                <tr key={quote.id} className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="font-black text-gray-900">{quote.quote_ref}</div>
                    <div className="text-xs text-primary font-bold">{quote.partner?.company_name}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 font-bold text-gray-800">
                      <ArrowUpRight className="h-3 w-3" />
                      {quote.destination}
                    </div>
                    <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-1">
                      <Calendar className="h-3 w-3 text-gray-300" />
                      {new Date(quote.travel_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-lg text-xs font-black text-gray-700">
                      <Users className="h-3 w-3" />
                      {quote.pax_count}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm font-black text-emerald-600">${quote.total_net_usd?.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">Sell: ${quote.total_sell_usd?.toLocaleString()} ({quote.margin_pct}%)</div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${getStatusColor(quote.status)}`}>
                      {quote.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button 
                      onClick={() => setSelectedQuote(quote)}
                      className="inline-flex items-center gap-2 text-xs font-black bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition-all"
                    >
                      Process <ExternalLink className="h-3 w-3" />
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
        <DialogContent className="max-w-2xl rounded-[32px] border-0 shadow-2xl p-8 bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <FileText className="h-6 w-6" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-2xl font-black">Process Quote #{selectedQuote?.quote_ref}</DialogTitle>
                <div className="text-sm text-gray-500 font-medium">B2B Request from {selectedQuote?.partner?.company_name}</div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-8">
            {/* Financial Overview */}
            <div className="grid grid-cols-3 gap-6">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Net Cost</div>
                <div className="text-xl font-black text-emerald-900">${selectedQuote?.total_net_usd?.toLocaleString()}</div>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Sell Price</div>
                <div className="text-xl font-black text-blue-900">${selectedQuote?.total_sell_usd?.toLocaleString()}</div>
              </div>
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100">
                <div className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">Partner Margin</div>
                <div className="text-xl font-black text-purple-900">{selectedQuote?.margin_pct}%</div>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-3">
               <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 pb-2">Line Items</h3>
               <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                 {selectedQuote?.line_items?.map((item: any, idx: number) => (
                   <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${
                          item.type === 'package' ? 'bg-primary/10 text-primary' :
                          item.type === 'accommodation' ? 'bg-amber-100 text-amber-600' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {item.type}
                        </span>
                        <span className="text-sm font-bold text-gray-800">{item.name}</span>
                      </div>
                      <div className="text-xs font-black text-gray-500">Qty: {item.qty}</div>
                   </div>
                 ))}
               </div>
            </div>

            {/* Notes */}
            {selectedQuote?.notes && (
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100">
                <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Special Requests / Notes
                </div>
                <p className="text-sm text-amber-900 font-medium italic">"{selectedQuote.notes}"</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-6 border-t border-gray-50">
               {selectedQuote?.status === 'submitted' && (
                  <Button 
                    className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-2"
                    onClick={() => handleStatusUpdate(selectedQuote.id, 'sent', selectedQuote.partner?.email, selectedQuote.quote_ref)}
                    disabled={isUpdating}
                  >
                    {isUpdating ? <RefreshCw className="animate-spin h-5 w-5" /> : (
                      <>
                        <Send className="h-5 w-5" />
                        Approve & Send to Partner
                      </>
                    )}
                  </Button>
               )}
               <div className="flex gap-4">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-12 rounded-2xl border-gray-100 font-bold text-red-600 hover:bg-red-50 hover:border-red-100"
                    onClick={() => handleStatusUpdate(selectedQuote!.id, 'declined')}
                    disabled={isUpdating}
                  >
                    <XSquare className="h-4 w-4 mr-2" /> Decline Request
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="flex-1 h-12 rounded-2xl font-bold"
                    onClick={() => setSelectedQuote(null)}
                  >
                    Close
                  </Button>
               </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
