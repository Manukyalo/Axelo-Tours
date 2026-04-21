"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Eye, RefreshCw, ChevronRight, AlertTriangle,
  MapPin, Calendar, Globe, Activity, Shield, CheckCircle,
  XCircle, FileSearch, CreditCard, Zap, X, Clock,
  Download, Plus, ChevronDown, Briefcase, ChevronLeft
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/formatters";
import { Booking } from "@/types";
import { format } from "date-fns";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { 
  OperationalHeader, 
  AssetBadge, 
  MonoSection, 
  TacticalButton, 
  MissionCard 
} from "@/components/OperationalComponents";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

const STATUS_VARIANTS: Record<string, { label: string, variant: "success" | "warning" | "error" | "info" | "neutral", icon: any }> = {
  pending: { label: "Awaiting Clearance", variant: "warning", icon: Clock },
  confirmed: { label: "Manifest Secured", variant: "info", icon: Shield },
  completed: { label: "Deployment Finalized", variant: "success", icon: CheckCircle },
  cancelled: { label: "Mission Aborted", variant: "error", icon: XCircle },
};

const PAYMENT_VARIANTS: Record<string, { label: string, variant: "success" | "warning" | "error" | "info" | "neutral" }> = {
  paid: { label: "Settled", variant: "success" },
  partial: { label: "Partial", variant: "warning" },
  unpaid: { label: "Outstanding", variant: "error" },
  refunded: { label: "Voided", variant: "neutral" },
};

export default function BookingsPage() {
  const supabase = createClient();
  const [bookings, setBookings] = useState<(Booking & { clients?: any; packages?: any })[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<typeof bookings[0] | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("bookings")
      .select("*, clients(full_name, email, phone, nationality), packages(name, destination)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (paymentFilter !== "all") query = query.eq("payment_status", paymentFilter);
    if (search) query = query.or(`id.ilike.%${search}%, booking_ref.ilike.%${search}%`);

    const { data, count } = await query;
    setBookings((data as any[]) || []);
    setTotal(count || 0);
    setLoading(false);
  }, [page, statusFilter, paymentFilter, search, supabase]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) {
      toast.error("Security Override Failed: " + error.message);
    } else {
      toast.success(`Manifest state transitioned to ${status.toUpperCase()}`);
      fetchBookings();
      if (selectedBooking?.id === id) {
        setSelectedBooking(prev => prev ? { ...prev, status: status as Booking["status"] } : null);
      }
    }
    setUpdating(null);
  };

  const exportCSV = () => {
    const rows = [
      ["Manifest ID", "Guest Name", "Intel/Package", "Deployment", "Financials", "Status"],
      ...bookings.map(b => [
        b.booking_ref || b.id,
        b.clients?.full_name,
        b.packages?.name,
        b.travel_date,
        `${b.currency} ${b.total_amount}`,
        b.status
      ]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `AX-MANIFEST-${format(new Date(), "yyyyMMdd")}.csv`; a.click();
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-8 space-y-10 bg-background min-h-screen">
      <OperationalHeader 
        title="Deployment Logs" 
        subtitle="Mission Manifests & Logistics"
        icon={Globe}
        actions={
          <div className="flex items-center gap-3">
             <button 
                onClick={exportCSV}
                className="p-3 text-muted-foreground hover:text-foreground transition-colors bg-card border border-border rounded-xl"
                title="Export Manifests"
              >
                <Download className="w-5 h-5" />
              </button>
              <Link href="/bookings/new">
                <TacticalButton icon={Plus}>Initialize Mission</TacticalButton>
              </Link>
          </div>
        }
      />

      {/* Strategic Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-5 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-primary transition-colors" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search manifests, guests, or reference codes..."
            className="w-full h-14 pl-16 pr-6 bg-white border border-gray-100 rounded-[24px] text-sm font-bold tracking-tight shadow-sm focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none" 
          />
        </div>

        <div className="md:col-span-7 flex gap-4 overflow-x-auto pb-2 scrollbar-none">
           <div className="relative flex-none">
              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
                className="h-14 pl-6 pr-12 bg-white border border-gray-100 rounded-[24px] text-[10px] font-black uppercase tracking-widest text-gray-500 focus:ring-2 focus:ring-primary/10 transition-all appearance-none cursor-pointer outline-none"
              >
                <option value="all">CORRIDOR STATUS: ALL</option>
                {Object.entries(STATUS_VARIANTS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label.toUpperCase()}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
           </div>

           <div className="relative flex-none">
              <select 
                value={paymentFilter} 
                onChange={e => setPaymentFilter(e.target.value)}
                className="h-14 pl-6 pr-12 bg-white border border-gray-100 rounded-[24px] text-[10px] font-black uppercase tracking-widest text-gray-500 focus:ring-2 focus:ring-primary/10 transition-all appearance-none cursor-pointer outline-none"
              >
                <option value="all">SETTLEMENT: ALL</option>
                {Object.entries(PAYMENT_VARIANTS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label.toUpperCase()}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
           </div>

           <button 
              onClick={() => fetchBookings()}
              className="h-14 w-14 flex-none flex items-center justify-center bg-white border border-gray-100 rounded-[24px] text-gray-400 hover:text-primary transition-all active:scale-95 shadow-sm"
            >
              <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
           </button>

           <div className="flex-grow text-right self-center pr-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <span className="text-primary">{total}</span> ACTIVE NODES DETECTED
              </p>
           </div>
        </div>
      </div>

      {/* Deployment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <AnimatePresence mode="popLayout">
          {loading ? (
             Array.from({ length: 8 }).map((_, i) => (
               <div key={i} className="h-[280px] rounded-3xl bg-card border border-border/50 animate-pulse" />
             ))
          ) : bookings.length === 0 ? (
            <div className="col-span-full py-32 flex flex-col items-center justify-center gap-8 bg-card rounded-[40px] border border-dashed border-border/60">
               <div className="w-24 h-24 rounded-[36px] bg-muted/50 border border-border flex items-center justify-center text-muted-foreground/20">
                  <Briefcase className="w-12 h-12" />
               </div>
               <div className="text-center space-y-2">
                  <p className="text-lg font-bold text-foreground uppercase tracking-tight">No Manifests Found</p>
                  <p className="text-sm font-medium text-muted-foreground max-w-[250px] mx-auto opacity-60">No active bookings match the current synchronization criteria.</p>
               </div>
               <Link href="/bookings/new">
                  <TacticalButton variant="outline">Initialize First Entry</TacticalButton>
               </Link>
            </div>
          ) : bookings.map((booking) => {
            const statusCfg = STATUS_VARIANTS[booking.status] || { label: booking.status, variant: "neutral", icon: Clock };
            const paymentCfg = PAYMENT_VARIANTS[booking.payment_status] || { label: booking.payment_status, variant: "neutral" };
            
            return (
              <MissionCard 
                key={booking.id}
                label={booking.booking_ref || `REF: ${booking.id.split("-")[0].toUpperCase()}`}
                status={booking.status === 'confirmed' ? 'active' : booking.status === 'pending' ? 'calibration' : 'draft'}
                className="flex flex-col h-full hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer"
              >
                <div onClick={() => setSelectedBooking(booking)} className="flex flex-col h-full gap-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-foreground tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                        {booking.clients?.full_name || "Anonymous Guest"}
                      </h3>
                      <div className="flex items-center gap-2">
                        <AssetBadge label={booking.clients?.nationality || "Global"} variant="neutral" dot={false} />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{booking.clients?.email?.split('@')[0]}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-2xl border border-border/40">
                       <statusCfg.icon className={cn("w-5 h-5", 
                         statusCfg.variant === 'success' ? 'text-emerald-500' : 
                         statusCfg.variant === 'warning' ? 'text-amber-500' :
                         statusCfg.variant === 'error' ? 'text-rose-500' : 'text-primary'
                       )} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-2xl border border-border/30">
                       <MapPin className="w-4 h-4 text-primary" />
                       <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground line-clamp-1">{booking.packages?.name || "Custom Plan"}</span>
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{booking.packages?.destination || "Global"}</span>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <MonoSection 
                        label="Dispatch" 
                        value={format(new Date(booking.travel_date), "dd MMM")} 
                        className="bg-card/50"
                      />
                      <MonoSection 
                        label="Financials" 
                        value={formatCurrency(booking.total_amount, booking.currency)}
                        className="bg-card/50"
                      />
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-border/40 flex items-center justify-between">
                    <AssetBadge label={statusCfg.label} variant={statusCfg.variant} />
                    <AssetBadge label={paymentCfg.label} variant={paymentCfg.variant} dot={false} />
                  </div>
                </div>
              </MissionCard>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Operational Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-10 border-t border-border">
           <div className="flex items-center gap-4">
              <span className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-widest">
                Sector Mapping Progress
              </span>
              <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
                 <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((page + 1) / totalPages) * 100}%` }}
                    className="h-full bg-primary"
                 />
              </div>
              <span className="text-[10px] font-mono font-bold text-primary">
                {page + 1} / {totalPages}
              </span>
           </div>

           <div className="flex items-center gap-3">
              <TacticalButton 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(0, p - 1))} 
                disabled={page === 0}
                icon={ChevronLeft}
              >
                Prev Sector
              </TacticalButton>
              <TacticalButton 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} 
                disabled={page >= totalPages - 1}
                icon={ChevronRight}
              >
                Next Sector
              </TacticalButton>
           </div>
        </div>
      )}

      {/* Mission Briefing Overlay */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 overflow-hidden bg-gray-50 border-0 shadow-2xl rounded-[32px]">
          {selectedBooking && (
            <div className="flex flex-col h-full">
               {/* Elite Header */}
               <div className="px-12 py-8 bg-brand-dark flex items-center justify-between shadow-md z-10">
                  <div className="flex items-center gap-8">
                     <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shadow-2xl backdrop-blur-md">
                        <Shield className="w-8 h-8" />
                     </div>
                     <div>
                        <div className="flex items-center gap-3 text-primary font-bold uppercase tracking-wider text-[10px] mb-2">
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            Mission Manifest #{selectedBooking.booking_ref || selectedBooking.id.split("-")[0].toUpperCase()}
                        </div>
                        <h2 className="text-3xl font-bold text-white tracking-tight uppercase">
                            {selectedBooking.clients?.full_name}
                        </h2>
                     </div>
                  </div>

                  <div className="flex items-center gap-6">
                      <div className="px-5 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md text-right">
                         <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Financial State</p>
                         <div className="flex items-center justify-end gap-2 text-emerald-400 font-mono font-bold text-lg">
                            <CreditCard className="w-4 h-4" />
                            {formatCurrency(selectedBooking.total_amount, selectedBooking.currency)}
                         </div>
                      </div>
                      <button 
                        onClick={() => setSelectedBooking(null)}
                        className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center text-white/40 transition-all border border-white/10"
                      >
                         <X className="w-6 h-6" />
                      </button>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12 bg-white/80 backdrop-blur-xl">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                     {/* Identity Profile */}
                     <div className="lg:col-span-2 space-y-10">
                        <div className="space-y-6">
                           <h3 className="text-sm font-black text-foreground uppercase tracking-[0.3em] flex items-center gap-4">
                              <span className="w-8 h-px bg-primary/30" />
                              Strategic Vector Parameters
                           </h3>

                           <div className="grid grid-cols-2 gap-8">
                              <MissionCard className="bg-white border-0 shadow-xl shadow-black/5 p-8" label="Itinerary Node">
                                 <div className="flex flex-col gap-6">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                                       <MapPin className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                       <p className="text-xl font-bold text-foreground">{selectedBooking.packages?.name || "Bespoke Request"}</p>
                                       <p className="text-xs font-black text-primary uppercase tracking-widest">{selectedBooking.packages?.destination || "Global Routing"}</p>
                                    </div>
                                 </div>
                              </MissionCard>

                              <MissionCard className="bg-white border-0 shadow-xl shadow-black/5 p-8" label="Temporal Window">
                                 <div className="flex flex-col gap-6">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                                       <Calendar className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                       <p className="text-xl font-bold text-foreground">
                                          {format(new Date(selectedBooking.travel_date), "dd MMM")} — {format(new Date(selectedBooking.return_date), "dd MMM yyyy")}
                                       </p>
                                       <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Active Dispatch Window</p>
                                    </div>
                                 </div>
                              </MissionCard>
                           </div>
                        </div>

                        <div className="space-y-6">
                           <h3 className="text-sm font-black text-foreground uppercase tracking-[0.3em] flex items-center gap-4">
                              <span className="w-8 h-px bg-primary/30" />
                              Technical Briefing Notes
                           </h3>
                           <div className="p-10 bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
                              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                 <FileSearch className="w-32 h-32 text-white" />
                              </div>
                              <div className="relative font-mono text-sm text-white/70 leading-relaxed italic border-l-4 border-primary pl-8 py-2">
                                 {selectedBooking.special_requests || "NO OPERATIONAL EXCEPTIONS OR TACTICAL ADJUSTMENTS DECLARED FOR THIS MISSION SECTOR."}
                              </div>
                              <div className="mt-8 flex gap-3">
                                 <AssetBadge label={`Adults: ${selectedBooking.num_adults}`} variant="info" dot={false} />
                                 <AssetBadge label={`Children: ${selectedBooking.num_children}`} variant="warning" dot={false} />
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Authorization Protocol */}
                     <div className="space-y-10">
                        <div className="bg-white p-10 rounded-[2.5rem] border border-border shadow-2xl space-y-8">
                           <div>
                              <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                 <Shield className="w-4 h-4" /> Authorization State
                              </h3>
                              
                              <div className="space-y-3">
                                 {Object.entries(STATUS_VARIANTS).map(([k, cfg]) => (
                                    <button 
                                      key={k}
                                      onClick={() => updateStatus(selectedBooking.id, k)}
                                      disabled={updating === selectedBooking.id}
                                      className={cn(
                                        "w-full p-5 rounded-2xl flex items-center justify-between border transition-all duration-300 group",
                                        selectedBooking.status === k 
                                          ? "bg-primary border-primary text-white shadow-xl shadow-primary/20" 
                                          : "bg-gray-50 border-gray-100 text-gray-400 hover:border-primary/30 hover:bg-white"
                                      )}
                                    >
                                       <div className="flex items-center gap-4">
                                          <div className={cn("p-2 rounded-xl transition-colors", 
                                             selectedBooking.status === k ? "bg-white/20" : "bg-white shadow-sm border border-border"
                                          )}>
                                             <cfg.icon className="w-4 h-4" />
                                          </div>
                                          <span className="text-[11px] font-black uppercase tracking-[0.2em]">{cfg.label}</span>
                                       </div>
                                       {selectedBooking.status === k ? (
                                          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                       ) : (
                                          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                                       )}
                                    </button>
                                 ))}
                              </div>
                           </div>

                           <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100/50">
                              <p className="text-[10px] font-bold text-amber-800/60 uppercase tracking-widest leading-relaxed">
                                 <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5" />
                                 State transitions are broadcasted across the logistics network and affect regional inventory allocation.
                              </p>
                           </div>
                        </div>

                        <div className="bg-brand-dark p-8 rounded-[2.5rem] shadow-2xl text-white space-y-6">
                           <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/60">Communication Matrix</h3>
                           <div className="space-y-4">
                              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                                 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Globe className="w-5 h-5" />
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Digital Channel</span>
                                    <span className="text-sm font-bold truncate max-w-[150px]">{selectedBooking.clients?.email}</span>
                                 </div>
                              </div>
                              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                                 <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                    <Activity className="w-5 h-5" />
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Tactical Voice</span>
                                    <span className="text-sm font-bold">{selectedBooking.clients?.phone || "UNREGISTERED"}</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
