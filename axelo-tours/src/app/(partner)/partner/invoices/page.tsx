import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Receipt } from 'lucide-react';

export default async function InvoicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/partner/login');

  const { data: partner } = await supabase
    .from('partners')
    .select('id')
    .eq('contact_email', user.email)
    .single();

  if (!partner) redirect('/partner/login');

  const { data: quotes } = await supabase
    .from('group_quotes')
    .select('id, quote_ref, destination, travel_date, pax_count, total_net_usd, total_sell_usd, status, created_at')
    .eq('partner_id', partner.id)
    .in('status', ['confirmed', 'approved'])
    .order('created_at', { ascending: false });

  const totalDue = quotes?.filter(q => q.status === 'approved')
    .reduce((s, q) => s + (q.total_net_usd ?? 0), 0) ?? 0;
  const totalPaid = quotes?.filter(q => q.status === 'confirmed')
    .reduce((s, q) => s + (q.total_net_usd ?? 0), 0) ?? 0;

  return (
    <div className="p-8 text-white">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-1">Invoices</h1>
        <p className="text-gray-400">Payment records for confirmed and approved group bookings</p>
      </div>

      {/* Summary */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-amber-500/10 border border-amber-400/20 rounded-2xl p-5">
          <div className="text-2xl font-display font-bold text-amber-300">${totalDue.toLocaleString()}</div>
          <div className="text-sm text-gray-400 mt-1">Awaiting Payment</div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-400/20 rounded-2xl p-5">
          <div className="text-2xl font-display font-bold text-emerald-300">${totalPaid.toLocaleString()}</div>
          <div className="text-sm text-gray-400 mt-1">Total Confirmed & Paid</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
          <div className="text-2xl font-display font-bold">{(quotes?.length ?? 0)}</div>
          <div className="text-sm text-gray-400 mt-1">Total Invoices</div>
        </div>
      </div>

      {!quotes || quotes.length === 0 ? (
        <div className="text-center py-24 text-gray-500">
          <Receipt className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="mb-2">No invoices yet</p>
          <p className="text-sm">Invoices are generated when quotes are approved or confirmed.</p>
        </div>
      ) : (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="grid grid-cols-6 px-6 py-3 text-xs text-gray-500 uppercase tracking-wide border-b border-white/[0.06]">
            <span className="col-span-2">Reference</span>
            <span>Destination</span>
            <span>Net Value</span>
            <span>Status</span>
            <span>Date</span>
          </div>
          {quotes.map(q => (
            <div key={q.id} className="grid grid-cols-6 px-6 py-4 items-center border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors text-sm">
              <div className="col-span-2">
                <div className="font-mono text-white font-medium">{q.quote_ref}</div>
                {q.pax_count && <div className="text-xs text-gray-500 mt-0.5">{q.pax_count} pax</div>}
              </div>
              <div className="text-gray-300">{q.destination || '—'}</div>
              <div className="font-bold text-emerald-400">
                ${Number(q.total_net_usd ?? 0).toLocaleString()}
              </div>
              <div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${
                  q.status === 'confirmed'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                }`}>
                  {q.status === 'confirmed' ? 'Paid' : 'Due'}
                </span>
              </div>
              <div className="text-gray-500 text-xs">
                {new Date(q.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-blue-500/10 border border-blue-400/20 rounded-xl p-5 text-sm text-blue-300">
        <strong>Payment Terms:</strong> Net 14 days from quote approval. Wire transfer to Axelo Tours &amp; Safari Ltd bank details shared upon confirmation.
        Contact <a href="mailto:finance@axelotours.co.ke" className="underline">finance@axelotours.co.ke</a> for proforma invoices.
      </div>
    </div>
  );
}
