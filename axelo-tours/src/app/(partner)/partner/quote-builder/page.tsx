'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, ArrowRight, Check, Plus, Minus, Loader2, Download } from 'lucide-react';
import { submitQuoteAction } from './actions';
import { toast } from 'react-hot-toast';

interface Package {
  id: string;
  name: string;
  destination: string;
  duration_days: number;
  price_usd: number;
  category: string;
}

interface Property {
  id: string;
  name: string;
  location: string;
  category: string;
}

interface LineItem {
  type: 'package' | 'accommodation' | 'transport' | 'extra';
  id?: string;
  name: string;
  unit_price_usd: number;
  qty: number;
  nights?: number;
}

const STEPS = [
  { id: 1, label: 'Dates & Pax' },
  { id: 2, label: 'Packages' },
  { id: 3, label: 'Accommodation' },
  { id: 4, label: 'Transport & Extras' },
  { id: 5, label: 'Review & Submit' },
];

function QuoteBuilderInner() {
  const supabase = createClient();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
  const [partner, setPartner] = useState<{ id: string; net_rate_discount_pct: number; company_name: string } | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);

  const [destination, setDestination] = useState(searchParams.get('destination') ?? '');
  const [travelDate, setTravelDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [paxCount, setPaxCount] = useState(20);
  const [selectedPackages, setSelectedPackages] = useState<string[]>(
    searchParams.get('package') ? [searchParams.get('package')!] : []
  );
  const [selectedProperty, setSelectedProperty] = useState('');
  const [accommodationNights, setAccommodationNights] = useState(3);
  const [transportIncluded, setTransportIncluded] = useState(true);
  const [extras, setExtras] = useState<LineItem[]>([]);
  const [marginPct, setMarginPct] = useState(20);
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [quoteRef, setQuoteRef] = useState('');
  const [quoteId, setQuoteId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from('partners').select('id, net_rate_discount_pct, company_name').eq('contact_email', user.email).single();
      setPartner(p);
      const { data: pkgs } = await supabase.from('packages').select('id, name, destination, duration_days, price_usd, category').eq('available', true).order('destination');
      setPackages(pkgs ?? []);
      const { data: props } = await supabase.from('properties').select('id, name, location, category').eq('status', 'active').order('category');
      setProperties(props ?? []);
    };
    init();
  }, [supabase]);

  const discountPct = partner?.net_rate_discount_pct ?? 10;

  const buildLineItems = (): LineItem[] => {
    const items: LineItem[] = [];
    selectedPackages.forEach(pid => {
      const pkg = packages.find(p => p.id === pid);
      if (pkg) items.push({ type: 'package', id: pkg.id, name: pkg.name, unit_price_usd: pkg.price_usd, qty: paxCount });
    });
    if (selectedProperty) {
      const prop = properties.find(p => p.id === selectedProperty);
      if (prop) items.push({ type: 'accommodation', id: prop.id, name: `${prop.name} (${accommodationNights} nights)`, unit_price_usd: 150, qty: paxCount, nights: accommodationNights });
    }
    if (transportIncluded) items.push({ type: 'transport', name: 'Airport & Game Drive Transfers', unit_price_usd: 45, qty: paxCount });
    extras.forEach(e => items.push(e));
    return items;
  };

  const calcTotals = () => {
    const items = buildLineItems();
    const totalCost = items.reduce((s, i) => s + i.unit_price_usd * i.qty, 0);
    const netTotal = totalCost * (1 - discountPct / 100);
    const sellTotal = netTotal * (1 + marginPct / 100);
    const marginValue = sellTotal - netTotal;
    return { netTotal, sellTotal, marginValue, totalCost };
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    if (!travelDate || !returnDate || !paxCount || selectedPackages.length === 0) {
      setError('Please complete all required steps before submitting.');
      setSubmitting(false);
      return;
    }
    const { netTotal, sellTotal, marginValue } = calcTotals();
    
    try {
      const result = await submitQuoteAction({
        partner_id: partner?.id,
        quote_ref: `AXL-${Date.now().toString(36).toUpperCase()}`,
        destination,
        travel_date: travelDate,
        return_date: returnDate,
        pax_count: paxCount,
        line_items: buildLineItems(),
        transport_included: transportIncluded,
        total_net_usd: parseFloat(netTotal.toFixed(2)),
        total_sell_usd: parseFloat(sellTotal.toFixed(2)),
        margin_usd: parseFloat(marginValue.toFixed(2)),
        margin_pct: marginPct,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        notes,
      } as any);

      setQuoteRef(result.quote_ref);
      setSubmitted(true);
      toast.success("Quote submitted successfully!");
    } catch (err: any) {
      console.error("Submission error:", err);
      setError('Failed to submit quote. Please try again.');
      toast.error("Failed to submit quote");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-8 text-white flex items-center justify-center min-h-[70vh]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="font-display text-3xl font-bold mb-3">Quote Submitted!</h2>
          <p className="text-gray-400 mb-3">Reference: <span className="font-mono text-emerald-400">{quoteRef}</span></p>
          <p className="text-gray-400 mb-8">Axelo team will review and respond within 4 business hours.</p>
          <div className="flex flex-col gap-3 justify-center">
            <div className="flex gap-3 justify-center">
              <a href="/partner/quotes" className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-xl transition-colors">
                View My Quotes
              </a>
              <button onClick={() => { setSubmitted(false); setStep(1); setSelectedPackages([]); }} className="border border-white/20 hover:border-white/40 text-white font-bold px-6 py-3 rounded-xl transition-colors">
                New Quote
              </button>
            </div>
            {quoteRef && (
              <button 
                onClick={() => window.open(`/api/quotes/${quoteRef}/pdf`, '_blank')}
                className="flex items-center justify-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 font-semibold mt-2"
              >
                <Download className="w-4 h-4" /> Download Quote PDF (Net)
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const { netTotal, sellTotal, marginValue } = calcTotals();

  return (
    <div className="p-8 text-white">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-1">Build a Group Quote</h1>
        <p className="text-gray-400">Create a detailed quote for your group clients</p>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-0 mb-10">
        {STEPS.map((s, idx) => (
          <div key={s.id} className="flex items-center flex-1">
            <button
              onClick={() => step > s.id && setStep(s.id)}
              className={`flex items-center gap-2.5 min-w-0 ${step > s.id ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-all ${
                step === s.id ? 'bg-primary text-white ring-4 ring-primary/20' :
                step > s.id ? 'bg-emerald-500 text-white' : 'bg-white/10 text-gray-500'
              }`}>
                {step > s.id ? <Check className="w-4 h-4" /> : s.id}
              </div>
              <span className={`text-sm font-medium hidden md:block truncate ${step === s.id ? 'text-white' : step > s.id ? 'text-emerald-400' : 'text-gray-500'}`}>
                {s.label}
              </span>
            </button>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-2 transition-colors ${step > s.id ? 'bg-emerald-500/50' : 'bg-white/10'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main step content */}
        <div className="lg:col-span-2 bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">

          {/* Step 1: Dates & Pax */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="font-display text-xl font-bold">Dates & Group Size</h2>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Destination / Country</label>
                <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. Kenya — Maasai Mara"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Travel Date *</label>
                  <input type="date" value={travelDate} onChange={e => setTravelDate(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all [color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Return Date *</label>
                  <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all [color-scheme:dark]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Group Size *</label>
                <div className="flex items-center gap-4">
                  <button onClick={() => setPaxCount(Math.max(10, paxCount - 5))}
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-4xl font-display font-bold text-primary">{paxCount}</span>
                    <div className="text-xs text-gray-500 mt-1">passengers</div>
                  </div>
                  <button onClick={() => setPaxCount(paxCount + 5)}
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Packages */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold">Select Packages</h2>
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {packages.map(pkg => {
                  const selected = selectedPackages.includes(pkg.id);
                  const net = pkg.price_usd * (1 - discountPct / 100);
                  return (
                    <button key={pkg.id} onClick={() => setSelectedPackages(prev => selected ? prev.filter(id => id !== pkg.id) : [...prev, pkg.id])}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${selected ? 'bg-primary/10 border-primary/40' : 'bg-white/[0.02] border-white/10 hover:border-white/20'}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-sm mb-0.5">{pkg.name}</div>
                          <div className="text-xs text-gray-400">{pkg.destination} · {pkg.duration_days} days · <span className="capitalize">{pkg.category}</span></div>
                        </div>
                        <div className="text-right">
                          <div className="text-emerald-400 font-bold text-sm">${net.toFixed(0)}<span className="text-gray-500 text-xs">/pax</span></div>
                          <div className="text-xs text-gray-600 line-through">${pkg.price_usd}</div>
                        </div>
                      </div>
                      {selected && <div className="mt-2 flex items-center gap-1.5 text-xs text-primary"><Check className="w-3 h-3" /> Selected</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Accommodation */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold">Accommodation</h2>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Number of Nights</label>
                <div className="flex items-center gap-4 mb-5">
                  <button onClick={() => setAccommodationNights(Math.max(1, accommodationNights - 1))} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><Minus className="w-4 h-4" /></button>
                  <span className="text-3xl font-display font-bold flex-1 text-center">{accommodationNights}</span>
                  <button onClick={() => setAccommodationNights(accommodationNights + 1)} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><Plus className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                <button onClick={() => setSelectedProperty('')} className={`w-full text-left p-4 rounded-xl border transition-all ${!selectedProperty ? 'bg-primary/10 border-primary/40' : 'bg-white/[0.02] border-white/10 hover:border-white/20'}`}>
                  <div className="font-semibold text-sm">No specific property — Axelo will recommend</div>
                  <div className="text-xs text-gray-400 mt-0.5">Best option based on dates and budget tier</div>
                </button>
                {properties.map(prop => (
                  <button key={prop.id} onClick={() => setSelectedProperty(prop.id)} className={`w-full text-left p-4 rounded-xl border transition-all ${selectedProperty === prop.id ? 'bg-primary/10 border-primary/40' : 'bg-white/[0.02] border-white/10 hover:border-white/20'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-sm">{prop.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{prop.location} · <span className="capitalize">{prop.category}</span></div>
                      </div>
                      <div className="text-xs text-emerald-400">Net rate on request</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Transport & Extras */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-bold">Transport & Extras</h2>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-12 h-6 rounded-full relative transition-colors ${transportIncluded ? 'bg-primary' : 'bg-white/15'}`}
                  onClick={() => setTransportIncluded(p => !p)}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${transportIncluded ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </div>
                <span className="font-semibold">Include transport package</span>
                <span className="text-xs text-gray-500">($45/pax – airport transfers + game drives)</span>
              </label>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-base">Additional Extras</h3>
                  <button onClick={() => setExtras(prev => [...prev, { type: 'extra', name: '', unit_price_usd: 0, qty: paxCount }])}
                    className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors">
                    <Plus className="w-4 h-4" /> Add Extra
                  </button>
                </div>
                {extras.length === 0 && <p className="text-sm text-gray-500">No extras added.</p>}
                {extras.map((extra, idx) => (
                  <div key={idx} className="flex gap-3 mb-3">
                    <input value={extra.name} onChange={e => setExtras(prev => { const n = [...prev]; n[idx].name = e.target.value; return n; })}
                      placeholder="Extra name (e.g. Cultural dance show)"
                      className="flex-1 bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-primary/50 transition-all" />
                    <input type="number" value={extra.unit_price_usd} onChange={e => setExtras(prev => { const n = [...prev]; n[idx].unit_price_usd = parseFloat(e.target.value) || 0; return n; })}
                      placeholder="$/pax"
                      className="w-24 bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-primary/50 transition-all" />
                    <button onClick={() => setExtras(prev => prev.filter((_, i) => i !== idx))} className="text-gray-600 hover:text-red-400 transition-colors">✕</button>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Notes for Axelo Team</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  rows={3} placeholder="Dietary requirements, special accessibility needs, specific lodge preferences…"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-primary/50 transition-all resize-none" />
              </div>
            </div>
          )}

          {/* Step 5: Summary */}
          {step === 5 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-bold">Review & Submit Quote</h2>
              {/* Margin slider */}
              <div className="bg-black/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Your Selling Margin</span>
                  <span className="text-lg font-display font-bold text-purple-400">{marginPct}%</span>
                </div>
                <input type="range" min={0} max={50} value={marginPct} onChange={e => setMarginPct(parseInt(e.target.value))}
                  className="w-full accent-primary" />
                <div className="flex justify-between text-xs text-gray-500 mt-1"><span>0%</span><span>50%</span></div>
              </div>

              {/* Line items */}
              <div className="space-y-2">
                {buildLineItems().map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm py-2 border-b border-white/[0.05]">
                    <div>
                      <span className={`text-xs px-1.5 py-0.5 rounded mr-2 ${
                        item.type === 'package' ? 'bg-primary/20 text-primary' :
                        item.type === 'accommodation' ? 'bg-amber-500/20 text-amber-300' :
                        item.type === 'transport' ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-500/20 text-gray-300'
                      }`}>{item.type}</span>
                      {item.name}
                    </div>
                    <span className="text-gray-300">${(item.unit_price_usd * item.qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {buildLineItems().length === 0 && <p className="text-gray-500 text-sm">No items added yet. Go back and select packages.</p>}

              {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-300">{error}</div>}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.06]">
            <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            {step < 5 ? (
              <button onClick={() => setStep(s => Math.min(5, s + 1))}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><Check className="w-4 h-4" /> Submit to Axelo</>}
              </button>
            )}
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="space-y-4">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 sticky top-6">
            <h3 className="font-display font-bold text-lg mb-4">Quote Summary</h3>
            <div className="space-y-3 text-sm">
              {destination && <div className="flex justify-between"><span className="text-gray-400">Destination</span><span className="font-medium">{destination}</span></div>}
              {travelDate && <div className="flex justify-between"><span className="text-gray-400">Travel Date</span><span className="font-medium">{travelDate}</span></div>}
              {returnDate && <div className="flex justify-between"><span className="text-gray-400">Return</span><span className="font-medium">{returnDate}</span></div>}
              <div className="flex justify-between"><span className="text-gray-400">Pax Count</span><span className="font-medium">{paxCount}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Packages</span><span className="font-medium">{selectedPackages.length}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Transport</span><span className="font-medium">{transportIncluded ? 'Included' : 'Not included'}</span></div>
            </div>

            {netTotal > 0 && (
              <div className="mt-5 pt-5 border-t border-white/[0.08] space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Net Cost</span>
                  <span className="text-emerald-400 font-bold">${netTotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Sell Price ({marginPct}% margin)</span>
                  <span className="font-bold">${sellTotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Your Profit</span>
                  <span className="text-purple-400 font-bold">${marginValue.toFixed(0)}</span>
                </div>
                <div className="pt-2 border-t border-white/[0.06]">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Per pax (sell)</span>
                    <span>${(sellTotal / paxCount).toFixed(0)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuoteBuilderPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <QuoteBuilderInner />
    </Suspense>
  );
}
