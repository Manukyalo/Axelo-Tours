'use client';

import { useState } from 'react';
import { Loader2, Check } from 'lucide-react';
import { confirmQuoteAction } from './actions';

export function ConfirmBookingButton({ quoteId }: { quoteId: string }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleConfirm = async () => {
    if (!confirm('Are you sure you want to confirm this booking?')) return;
    
    setLoading(true);
    try {
      const res = await confirmQuoteAction(quoteId);
      if (res.success) {
        setSuccess(true);
      } else {
        alert('Error: ' + res.error);
      }
    } catch (err) {
      alert('Failed to confirm booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-400/20">
        <Check className="w-4 h-4" /> Booked
      </div>
    );
  }

  return (
    <button 
      onClick={handleConfirm}
      disabled={loading}
      className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-lg shadow-primary/20 flex items-center gap-2 active:scale-95"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Booking'}
    </button>
  );
}
