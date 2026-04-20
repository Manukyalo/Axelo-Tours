"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  FileText, Search, Send, FileOutput, CheckCircle2, 
  AlertTriangle, Eye, Plus, Calendar, User, MapPin
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Types
type Voucher = {
  id: string; voucher_ref: string; booking_id: string;
  client_names: string[]; property_name: string; property_email: string;
  check_in: string; check_out: string; nights: number; status: string;
  pdf_url?: string; sent_at?: string; 
};

export default function VouchersPage() {
  const supabase = createClient();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [processStatus, setProcessStatus] = useState<Record<string, string>>({}); // id -> 'generating' | 'sending' | etc

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("vouchers").select(`
      *,
      bookings ( id, booking_ref )
    `).order("created_at", { ascending: false });
    
    setVouchers((data as any) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchVouchers(); }, [fetchVouchers]);

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
        // Optimistically update
        setVouchers(prev => prev.map(v => v.id === voucher.id ? { ...v, pdf_url: result.url } : v));
      } else {
        alert("Failed: " + result.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error generating PDF");
    }
    setProcessStatus(prev => ({ ...prev, [voucher.id]: '' }));
  };

  const sendToLodge = async (voucher: Voucher) => {
    if (!voucher.pdf_url) return alert("Generate PDF first");
    
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
      } else {
        alert("Failed to send: " + result.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error sending email");
    }
    setProcessStatus(prev => ({ ...prev, [voucher.id]: '' }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-600">Draft</span>;
      case 'sent': return <span className="px-2 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-600">Sent</span>;
      case 'lodge_confirmed': return <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-600">Confirmed</span>;
      case 'checked_in': return <span className="px-2 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-600">Checked In</span>;
      default: return <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-600">{status}</span>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" /> Logistics & Vouchers
          </h1>
          <p className="text-gray-500 mt-1 uppercase tracking-widest text-xs font-bold">Property Voucher Fulfilment System</p>
        </div>
        <div>
          <button className="bg-gray-900 text-white hover:bg-black font-bold border-none px-4 py-2 rounded-xl flex items-center justify-center transition-all shadow-md">
            <Plus className="w-4 h-4 mr-2" /> New Voucher
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
          <div className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              placeholder="Search by Voucher Ref, Booking ID or Property..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold">
                <th className="p-4 pl-6 font-medium">Ref & Property</th>
                <th className="p-4 font-medium">Guest Details</th>
                <th className="p-4 font-medium">Stay Dates</th>
                <th className="p-4 font-medium">Status / PDF</th>
                <th className="p-4 pr-6 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">Loading tracking data...</td></tr>
              ) : vouchers.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">No vouchers generated yet.</td></tr>
              ) : vouchers.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="font-mono text-primary font-bold">{v.voucher_ref}</div>
                    <div className="font-medium text-gray-900 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400"/> {v.property_name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{v.property_email}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-gray-900 flex items-center gap-1"><User className="w-3 h-3 text-gray-400"/> {v.client_names?.[0] || 'Unknown'}</div>
                    <div className="text-xs text-gray-500 mt-1">Booking: {(v as any).bookings?.booking_ref || v.booking_id.substring(0,8)}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-gray-800 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400"/> {v.check_in}</div>
                    <div className="text-xs text-gray-500 mt-1">{v.nights} Nights</div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-2 items-start">
                      {getStatusBadge(v.status)}
                      {v.pdf_url ? (
                        <a href={v.pdf_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-bold bg-blue-50 px-2 py-1 rounded-md">
                          <Eye className="w-3 h-3" /> View Doc
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">No Doc Generated</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <div className="flex justify-end gap-2">
                       {!v.pdf_url && (
                         <button 
                          onClick={() => generatePDF(v)}
                          disabled={processStatus[v.id] === 'generating'}
                          className="p-2 text-primary hover:bg-orange-50 rounded-xl transition-colors font-medium text-sm flex items-center gap-2 border border-orange-100"
                        >
                          {processStatus[v.id] === 'generating' ? <AlertTriangle className="w-4 h-4 animate-pulse" /> : <FileOutput className="w-4 h-4" />}
                          Generate
                        </button>
                       )}

                       {v.pdf_url && v.status === 'draft' && (
                         <button 
                         onClick={() => sendToLodge(v)}
                         disabled={processStatus[v.id] === 'sending'}
                         className="p-2 text-white bg-primary hover:bg-orange-600 rounded-xl transition-colors font-bold text-sm flex items-center gap-2 shadow-sm"
                       >
                         {processStatus[v.id] === 'sending' ? <AlertTriangle className="w-4 h-4 animate-pulse" /> : <Send className="w-4 h-4" />}
                         Dispatch
                       </button>
                       )}
                       
                       {v.status === 'sent' && (
                          <span className="text-xs text-gray-400 flex flex-col items-end">
                            Sent at {new Date(v.sent_at!).toLocaleDateString()}
                          </span>
                       )}
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
