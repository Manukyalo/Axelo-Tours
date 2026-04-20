"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  FileText, Search, Send, FileOutput, CheckCircle2, 
  AlertTriangle, Eye, Plus, Calendar, User, MapPin,
  X, Building, Loader2, Info, Activity, RefreshCw,
  FileCircleControl, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// Types
type Voucher = {
  id: string; voucher_ref: string; booking_id: string;
  client_names: string[]; property_name: string; property_email: string;
  check_in: string; check_out: string; nights: number; status: string;
  pdf_url?: string; sent_at?: string; 
};

type Booking = {
  id: string;
  booking_ref: string;
  travel_date: string;
  return_date: string;
  clients: { name: string; email: string; nationality: string; passport_number: string };
  num_adults: number;
  num_children: number;
};

type Property = {
  id: string;
  name: string;
  email: string;
  destination: string;
};

export default function VouchersPage() {
  const supabase = createClient();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [processStatus, setProcessStatus] = useState<Record<string, string>>({});

  // Form State
  const [formData, setFormData] = useState({
    booking_id: "",
    property_id: "",
    check_in: "",
    check_out: "",
    room_type: "Double",
    meal_plan: "Full Board",
    special_requests: "",
    client_names: [] as string[],
    client_nationality: "",
    client_passport: ""
  });

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("vouchers").select(`
      *,
      bookings ( id, booking_ref )
    `).order("created_at", { ascending: false });
    
    setVouchers((data as any) || []);
    setLoading(false);
  }, [supabase]);

  const fetchDependencies = useCallback(async () => {
    const [bRes, pRes] = await Promise.all([
      supabase.from("bookings").select("*, clients(*)").order("created_at", { ascending: false }),
      supabase.from("properties").select("*").order("name")
    ]);
    if (bRes.data) setBookings(bRes.data as any);
    if (pRes.data) setProperties(pRes.data as any);
  }, [supabase]);

  useEffect(() => { 
    fetchVouchers(); 
    fetchDependencies();
  }, [fetchVouchers, fetchDependencies]);

  const handleBookingSelect = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      setFormData(prev => ({
        ...prev,
        booking_id: bookingId,
        check_in: booking.travel_date,
        check_out: booking.return_date,
        client_names: [booking.clients?.name].filter(Boolean),
        client_nationality: booking.clients?.nationality || "",
        client_passport: booking.clients?.passport_number || ""
      }));
    }
  };

  const createVoucher = async () => {
    if (!formData.booking_id || !formData.property_id) {
      toast.error("Please select a booking and a property");
      return;
    }

    setSubmitting(true);
    const property = properties.find(p => p.id === formData.property_id);
    const booking = bookings.find(b => b.id === formData.booking_id);

    const nights = Math.ceil((new Date(formData.check_out).getTime() - new Date(formData.check_in).getTime()) / (1000 * 60 * 60 * 24));
    
    const newVoucher = {
      voucher_ref: `AX-VCH-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      booking_id: formData.booking_id,
      property_id: formData.property_id,
      property_name: property?.name || "",
      property_email: property?.email || "",
      client_names: formData.client_names,
      client_nationality: formData.client_nationality,
      client_passport: formData.client_passport,
      check_in: formData.check_in,
      check_out: formData.check_out,
      nights: nights > 0 ? nights : 1,
      room_type: formData.room_type,
      meal_plan: formData.meal_plan,
      special_requests: formData.special_requests,
      status: 'draft',
      num_adults: booking?.num_adults || 2,
      num_children: booking?.num_children || 0
    };

    const { data, error } = await supabase.from("vouchers").insert(newVoucher).select().single();

    if (error) {
      toast.error("Error creating voucher: " + error.message);
    } else {
      toast.success("Voucher registered successfully");
      setShowCreateModal(false);
      fetchVouchers();
    }
    setSubmitting(false);
  };

  const generatePDF = async (voucher: Voucher) => {
    setProcessStatus(prev => ({ ...prev, [voucher.id]: 'generating' }));
    try {
      const res = await fetch('/api/vouchers/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voucher)
      });
      const result = await res.json();
      
      if (result.success) {
        setVouchers(prev => prev.map(v => v.id === voucher.id ? { ...v, pdf_url: result.url } : v));
        toast.success("PDF Generated Successfully");
      } else {
        toast.error("Generation failed: " + result.error);
      }
    } catch (err) {
      toast.error("Error generating PDF");
    }
    setProcessStatus(prev => ({ ...prev, [voucher.id]: '' }));
  };

  const sendToLodge = async (voucher: Voucher) => {
    if (!voucher.pdf_url) return toast.error("Generate PDF first");
    
    setProcessStatus(prev => ({ ...prev, [voucher.id]: 'sending' }));
    try {
      const res = await fetch('/api/vouchers/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucherId: voucher.id,
          propertyEmail: voucher.property_email,
          clientNames: voucher.client_names,
          pdfUrl: voucher.pdf_url
        })
      });
      const result = await res.json();
      
      if (result.success) {
        setVouchers(prev => prev.map(v => v.id === voucher.id ? { ...v, status: 'sent', sent_at: new Date().toISOString() } : v));
        toast.success("Voucher dispatched to lodge");
      } else {
        toast.error("Failed to send: " + result.error);
      }
    } catch (err) {
      toast.error("Error sending email");
    }
    setProcessStatus(prev => ({ ...prev, [voucher.id]: '' }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-600">Draft</span>;
      case 'sent': return <span className="px-2 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-600">Sent</span>;
      case 'lodge_confirmed': return <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-600">Confirmed</span>;
      default: return <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-600 uppercase tracking-tighter">{status}</span>;
    }
  };

  return (
    <div className="p-8 space-y-10 bg-[#fafafa] min-h-screen">
      {/* Tactical Logistics Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border border-primary/20">
              <FileCircleControl className="w-3.5 h-3.5" />
              Logistics Control
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Voucher Engine Active
            </div>
          </div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter leading-none mb-4 uppercase">
            Voucher <span className="text-primary italic">Manifest</span>
          </h1>
          <p className="text-gray-500 font-medium max-w-xl text-lg leading-relaxed italic">
            Orchestrating supplier communications and service guarantees. Generate high-fidelity vouchers, track transmission status, and manage logistics protocols.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-[24px] shadow-sm border border-gray-100">
            <Button 
                onClick={() => setShowCreateModal(true)}
                className="gap-3 bg-gray-900 hover:bg-black text-white font-bold h-12 px-8 rounded-2xl shadow-xl shadow-gray-200 transition-all flex items-center group"
            >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-all duration-500" />
                New Logistics Unit
            </Button>
        </div>
      </div>

      <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative group flex-grow max-w-md">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-primary transition-colors stroke-[3px]" />
                  <input 
                      placeholder="Query Voucher Manifest..."
                      className="w-full h-14 pl-16 pr-6 bg-white border border-gray-100 rounded-[24px] text-sm font-bold tracking-tight shadow-sm focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none" 
                  />
              </div>
              
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  {vouchers.length} Transmission Segments Logged
              </div>
          </div>

          {/* Manifest Table */}
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden relative">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#fcfcfc] text-[10px] uppercase text-gray-400 font-bold tracking-widest border-b border-gray-100">
                  <tr>
                    {["Protocol Ref","Destination Node","Entity Identity","Check-In / Out","Operational Status","Actions"].map(h => (
                      <th key={h} className="px-8 py-6">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan={6} className="px-8 py-20 text-center"><RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto opacity-20" /></td></tr>
                  ) : vouchers.length === 0 ? (
                    <tr>
                        <td colSpan={6} className="px-8 py-32 text-center text-gray-300">
                            <div className="flex flex-col items-center gap-4">
                                <FileText className="w-12 h-12 opacity-10" />
                                <span className="font-black uppercase tracking-[0.3em] text-[10px]">No logistics signals detected</span>
                            </div>
                        </td>
                    </tr>
                  ) : vouchers.map(v => (
                    <tr key={v.id} className="group hover:bg-[#fafafa] transition-all duration-300">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 shadow-sm group-hover:bg-white group-hover:scale-110 transition-all duration-500">
                                 <FileText className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-mono text-[11px] font-black text-gray-900 tracking-tight">{v.voucher_ref}</span>
                                <span className="text-[9px] text-gray-400 font-bold">BK-#{(v as any).bookings?.booking_ref || "---"}</span>
                            </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                            <span className="font-black text-gray-900 tracking-tighter uppercase italic">{v.property_name}</span>
                            <span className="text-[10px] text-gray-400 font-bold italic">{v.property_email}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-[13px]">
                        <div className="flex items-center gap-2">
                           <User className="w-3.5 h-3.5 text-gray-300" />
                           <span className="font-black text-gray-900 leading-tight tracking-tighter">
                             {v.client_names?.[0] || "---"}
                           </span>
                           {v.client_names?.length > 1 && (
                               <span className="text-[10px] font-black text-gray-300">+{v.client_names.length - 1}</span>
                           )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                           <span className="text-[11px] font-black text-gray-900 tracking-tight flex items-center gap-2">
                               <Calendar className="w-3 h-3 text-primary" />
                               {new Date(v.check_in).toLocaleDateString()}
                           </span>
                           <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-1">Duration: {v.nights} Nights</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                          v.status === 'sent' ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100' :
                          v.status === 'confirmed' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' :
                          'bg-white text-gray-400 border-gray-100 shadow-sm'
                        }`}>
                          {v.status === 'sent' && <Send className="w-3 h-3" />}
                          {v.status === 'confirmed' && <CheckCircle2 className="w-3 h-3" />}
                          {v.status}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => v.pdf_url && window.open(v.pdf_url)}
                                disabled={!v.pdf_url}
                                className={`p-2.5 rounded-xl border transition-all ${v.pdf_url ? 'bg-white border-gray-100 text-gray-400 hover:text-primary hover:shadow-xl' : 'bg-gray-50 border-transparent text-gray-200 outline-none'}`}
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => sendToLodge(v)}
                                disabled={processStatus[v.id] === 'sending'}
                                className="p-2.5 bg-gray-900 hover:bg-black text-white rounded-xl shadow-xl shadow-gray-200 transition-all disabled:opacity-50"
                                title="Send to property"
                            >
                                {processStatus[v.id] === 'sending' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                            <button 
                                onClick={() => generatePDF(v)}
                                disabled={processStatus[v.id] === 'generating'}
                                className="p-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-all"
                                title="Regenerate PDF"
                            >
                                {processStatus[v.id] === 'generating' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Modal */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[40px] w-full max-w-2xl shadow-3xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100"
          >
            <div className="p-10 border-b border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-900 rounded-[20px] flex items-center justify-center text-white shadow-2xl shadow-gray-200">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Unit Registration</h3>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">Logistic Manifest Protocol</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-3 hover:bg-gray-50 rounded-2xl transition-all group"
              >
                <X className="w-6 h-6 text-gray-400 group-hover:rotate-90 transition-transform duration-500" />
              </button>
            </div>

            <div className="p-10 space-y-10 overflow-y-auto custom-scrollbar">
              {/* Step 1: Booking Link */}
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-900 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">1</div>
                  Deployment Context
                </label>
                <div className="relative group">
                    <select 
                        className="w-full h-16 pl-6 pr-12 bg-[#fafafa] border border-gray-100 rounded-[24px] text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all appearance-none outline-none"
                        value={formData.booking_id}
                        onChange={(e) => handleBookingSelect(e.target.value)}
                    >
                        <option value="">Query Master Registry...</option>
                        {bookings.map(b => (
                            <option key={b.id} value={b.id}>
                            {b.booking_ref} - {b.clients?.name} ({b.travel_date})
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-focus-within:rotate-180 transition-transform" />
                </div>
              </div>

              {/* Step 2: Property & Logic */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-[10px]">2</div>
                    Landing Node
                  </label>
                  <div className="relative group">
                    <Building className="w-4 h-4 absolute left-6 top-1/2 -translate-y-1/2 text-primary/40 pointer-events-none" />
                    <select 
                      className="w-full h-16 pl-14 pr-12 bg-[#fafafa] border border-gray-100 rounded-[24px] text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all appearance-none outline-none"
                      value={formData.property_id}
                      onChange={(e) => setFormData({...formData, property_id: e.target.value})}
                    >
                      <option value="">Select Host Site...</option>
                      {properties.map(p => (
                        <option key={p.id} value={p.id}>{p.name} - {p.destination}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-[10px]">3</div>
                    Tactical Unit
                  </label>
                  <select 
                    className="w-full h-16 px-6 bg-[#fafafa] border border-gray-100 rounded-[24px] text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all appearance-none outline-none"
                    value={formData.room_type}
                    onChange={(e) => setFormData({...formData, room_type: e.target.value})}
                  >
                    <option value="Single">SOLO UNIT</option>
                    <option value="Double">DUAL CORE</option>
                    <option value="Twin">TWIN MODULE</option>
                    <option value="Triple">TRIPLE CONFIG</option>
                    <option value="Family Tent">ELITE FAMILY</option>
                    <option value="Suite">EXECUTIVE TERMINAL</option>
                  </select>
                </div>
              </div>

              {/* Step 3: Deployment Schedule */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">04. Engagement</label>
                  <input 
                    type="date"
                    className="w-full h-16 px-6 bg-[#fafafa] border border-gray-100 rounded-[24px] text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none"
                    value={formData.check_in}
                    onChange={(e) => setFormData({...formData, check_in: e.target.value})}
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">05. Termination</label>
                  <input 
                    type="date"
                    className="w-full h-16 px-6 bg-[#fafafa] border border-gray-100 rounded-[24px] text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none"
                    value={formData.check_out}
                    onChange={(e) => setFormData({...formData, check_out: e.target.value})}
                  />
                </div>
              </div>

              {/* Step 4: Special Request Ledger */}
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">06. Intelligence Addendum</label>
                <textarea 
                  className="w-full p-6 bg-[#fafafa] border border-gray-100 rounded-[32px] text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all h-32 resize-none outline-none"
                  placeholder="Insert mission-critical tactical requirements..."
                  value={formData.special_requests}
                  onChange={(e) => setFormData({...formData, special_requests: e.target.value})}
                />
              </div>
            </div>

            <div className="p-10 bg-[#fafafa] border-t border-gray-50 flex items-center justify-between sticky bottom-0">
               <div className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] max-w-[200px]">
                 Transmission verification is required prior to dispatch.
               </div>
               <div className="flex gap-4">
                 <button 
                  onClick={() => setShowCreateModal(false)}
                  className="px-8 py-3 text-xs font-black text-gray-400 hover:text-gray-900 transition-all uppercase tracking-widest"
                 >
                   Abort
                 </button>
                 <Button
                    onClick={createVoucher}
                    disabled={loading || !formData.booking_id || !formData.property_id}
                    className="h-14 px-10 bg-gray-900 hover:bg-black text-white font-black uppercase tracking-widest text-[11px] rounded-[20px] shadow-2xl shadow-gray-200 transition-all disabled:opacity-50"
                 >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Authorize Manifest"}
                 </Button>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
