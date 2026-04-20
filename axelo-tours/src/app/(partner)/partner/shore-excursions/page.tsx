'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Ship, Clock, Users, MapPin, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface ShoreExcursion {
  id: string;
  port: string;
  name: string;
  description: string;
  duration_hours: number;
  price_per_pax_usd: number;
  min_pax: number;
  max_pax: number;
  departure_time: string;
  return_time: string;
  highlights: string[];
  available: boolean;
  category: string;
}

interface Partner {
  id: string;
  company_type: string;
  net_rate_discount_pct: number;
}

interface BookingForm {
  excursion_id: string;
  ship_name: string;
  port_call_date: string;
  estimated_pax: number;
  notes: string;
}

const PORT_COLORS: Record<string, string> = {
  Mombasa: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
  Zanzibar: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
  'Dar es Salaam': 'bg-purple-500/20 text-purple-300 border-purple-400/30',
};

const CATEGORY_ICONS: Record<string, string> = {
  cultural: '🏛️',
  wildlife: '🦁',
  adventure: '🤿',
  beach: '🏖️',
  historical: '⚓',
};

export default function ShoreExcursionsPage() {
  const supabase = createClient();
  const [excursions, setExcursions] = useState<ShoreExcursion[]>([]);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePort, setActivePort] = useState<string>('all');
  const [bookingFor, setBookingFor] = useState<string | null>(null);
  const [form, setForm] = useState<BookingForm>({ excursion_id: '', ship_name: '', port_call_date: '', estimated_pax: 50, notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from('partners').select('id, company_type, net_rate_discount_pct').eq('contact_email', user.email).single();
      setPartner(p);
      const { data: ex } = await supabase.from('shore_excursions').select('*').eq('available', true).order('port').order('price_per_pax_usd');
      setExcursions(ex ?? []);
      setLoading(false);
    };
    init();
  }, [supabase]);

  const ports = ['all', ...Array.from(new Set(excursions.map(e => e.port)))];
  const filtered = activePort === 'all' ? excursions : excursions.filter(e => e.port === activePort);

  const handleBook = (ex: ShoreExcursion) => {
    setBookingFor(ex.id);
    setForm(prev => ({ ...prev, excursion_id: ex.id }));
    setFormError('');
  };

  const handleSubmitBooking = async () => {
    if (!form.ship_name || !form.port_call_date || !form.estimated_pax) {
      setFormError('Please fill in ship name, port call date, and estimated pax.');
      return;
    }
    setSubmitting(true);
    const ex = excursions.find(e => e.id === bookingFor);
    const total = (ex?.price_per_pax_usd ?? 0) * form.estimated_pax;

    const { error } = await supabase.from('shore_excursion_bookings').insert({
      partner_id: partner?.id,
      excursion_id: form.excursion_id,
      ship_name: form.ship_name,
      port_call_date: form.port_call_date,
      estimated_pax: form.estimated_pax,
      total_usd: total,
      status: 'pending',
      notes: form.notes || null,
    });
    setSubmitting(false);
    if (error) { setFormError('Failed to submit. Please try again.'); return; }
    setSubmitted(bookingFor);
    setBookingFor(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 text-white">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-1">Shore Excursions</h1>
        <p className="text-gray-400">Mombasa &amp; Zanzibar port excursion packages — per-pax pricing</p>
      </div>

      {/* Info banner for non-cruise partners */}
      {partner?.company_type !== 'cruise_line' && (
        <div className="bg-blue-500/10 border border-blue-400/20 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-300 font-semibold mb-0.5">Shore Excursion Booking</p>
            <p className="text-xs text-blue-300/70">
              Shore excursion bookings are available for all partner types. Cruise line partners receive priority allocation during peak ship call days.
              Contact <a href="mailto:excursions@axelotours.co.ke" className="underline">excursions@axelotours.co.ke</a> for group charter rates.
            </p>
          </div>
        </div>
      )}

      {/* Port filter */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {ports.map(port => (
          <button
            key={port}
            onClick={() => setActivePort(port)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
              activePort === port ? 'bg-primary text-white' : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
            }`}
          >
            {port === 'all' ? '🌍 All Ports' : `⚓ ${port}`}
            <span className="ml-1.5 text-xs opacity-60">
              ({port === 'all' ? excursions.length : excursions.filter(e => e.port === port).length})
            </span>
          </button>
        ))}
      </div>

      {/* Excursion cards */}
      <div className="grid md:grid-cols-2 gap-5">
        {filtered.map(ex => (
          <div key={ex.id} className="bg-white/[0.03] border border-white/[0.08] hover:border-white/20 rounded-2xl overflow-hidden transition-all group">
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${PORT_COLORS[ex.port] || ''}`}>
                      ⚓ {ex.port}
                    </span>
                    <span className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-gray-400">
                      {CATEGORY_ICONS[ex.category]} {ex.category}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg leading-tight">{ex.name}</h3>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-display font-bold text-emerald-400">${ex.price_per_pax_usd}</div>
                  <div className="text-xs text-gray-500">/pax</div>
                </div>
              </div>

              <p className="text-sm text-gray-400 leading-relaxed mb-4 line-clamp-2">{ex.description}</p>

              {/* Highlights */}
              {ex.highlights?.length > 0 && (
                <ul className="space-y-1 mb-4">
                  {ex.highlights.slice(0, 3).map(h => (
                    <li key={h} className="text-xs text-gray-400 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary shrink-0" /> {h}
                    </li>
                  ))}
                </ul>
              )}

              {/* Meta */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-black/20 rounded-xl p-2.5 text-center">
                  <Clock className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                  <div className="text-xs font-bold">{ex.duration_hours}h</div>
                  <div className="text-[10px] text-gray-500">Duration</div>
                </div>
                <div className="bg-black/20 rounded-xl p-2.5 text-center">
                  <Users className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                  <div className="text-xs font-bold">{ex.min_pax}–{ex.max_pax}</div>
                  <div className="text-[10px] text-gray-500">Pax Range</div>
                </div>
                <div className="bg-black/20 rounded-xl p-2.5 text-center">
                  <MapPin className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                  <div className="text-xs font-bold">{ex.departure_time?.slice(0, 5)}</div>
                  <div className="text-[10px] text-gray-500">Departure</div>
                </div>
              </div>

              {/* Success state */}
              {submitted === ex.id ? (
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-emerald-400">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  Booking request sent! Axelo will confirm within 2 hours.
                </div>
              ) : bookingFor === ex.id ? (
                <div className="bg-black/20 border border-white/10 rounded-xl p-4 space-y-3">
                  <h4 className="font-semibold text-sm text-white">Book this Excursion</h4>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Ship Name *</label>
                    <input value={form.ship_name} onChange={e => setForm(p => ({ ...p, ship_name: e.target.value }))}
                      placeholder="MSC Seashore" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-primary/50 transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Port Call Date *</label>
                      <input type="date" value={form.port_call_date} onChange={e => setForm(p => ({ ...p, port_call_date: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-primary/50 transition-all [color-scheme:dark]" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Est. Pax Count *</label>
                      <input type="number" value={form.estimated_pax} onChange={e => setForm(p => ({ ...p, estimated_pax: parseInt(e.target.value) || 0 }))}
                        min={ex.min_pax} max={ex.max_pax}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-primary/50 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Notes (optional)</label>
                    <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                      rows={2} placeholder="Accessibility needs, language guides, etc."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-primary/50 transition-all resize-none" />
                  </div>

                  {form.estimated_pax > 0 && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5 flex items-center justify-between text-sm">
                      <span className="text-gray-400">Estimated Total</span>
                      <span className="text-emerald-400 font-bold">
                        ${(ex.price_per_pax_usd * form.estimated_pax).toLocaleString()} USD
                      </span>
                    </div>
                  )}

                  {formError && <p className="text-xs text-red-400">{formError}</p>}

                  <div className="flex gap-2 pt-1">
                    <button onClick={() => { setBookingFor(null); setFormError(''); }}
                      className="flex-1 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleSubmitBooking} disabled={submitting}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                      {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Booking…</> : <><Ship className="w-4 h-4" /> Request Booking</>}
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => handleBook(ex)}
                  className="w-full bg-white/[0.05] hover:bg-primary/20 border border-white/10 hover:border-primary/40 text-white hover:text-primary font-semibold py-2.5 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2">
                  <Ship className="w-4 h-4" /> Book This Excursion
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <Ship className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No excursions available for this port.</p>
        </div>
      )}
    </div>
  );
}
