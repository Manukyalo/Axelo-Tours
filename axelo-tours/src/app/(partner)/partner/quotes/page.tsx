import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Download, Check } from 'lucide-react';
import { ConfirmBookingButton } from './ConfirmBookingButton';

const STATUS_CONFIG: Record<string, { cls: string; label: string }> = {
  draft: { cls: 'bg-gray-500/20 text-gray-300 border-gray-500/30', label: 'Draft' },
  submitted: { cls: 'bg-amber-500/20 text-amber-300 border-amber-400/30', label: 'Submitted' },
  approved: { cls: 'bg-blue-500/20 text-blue-300 border-blue-400/30', label: 'Approved' },
  confirmed: { cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30', label: 'Confirmed' },
  cancelled: { cls: 'bg-red-500/20 text-red-300 border-red-400/30', label: 'Cancelled' },
};

export default async function MyQuotesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/partner/login');

  const { data: partner } = await supabase
    .from('partners')
    .select('id, net_rate_discount_pct')
    .eq('contact_email', user.email)
    .single();

  if (!partner) redirect('/partner/login');

  const { data: quotes } = await supabase
    .from('group_quotes')
    .select('*')
    .eq('partner_id', partner.id)
    .order('created_at', { ascending: false });

  const counts = {
    total: quotes?.length ?? 0,
    submitted: quotes?.filter(q => q.status === 'submitted').length ?? 0,
    approved: quotes?.filter(q => q.status === 'approved').length ?? 0,
    confirmed: quotes?.filter(q => q.status === 'confirmed').length ?? 0,
  };

  const totalValue = quotes?.filter(q => ['approved', 'confirmed'].includes(q.status))
    .reduce((s, q) => s + (q.total_net_usd ?? 0), 0) ?? 0;

  return (
    <div className="p-8 text-white">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold mb-1">My Quotes</h1>
          <p className="text-gray-400">All group quotes — track status and manage submissions</p>
        </div>
        <a
          href="/partner/quote-builder"
          className="bg-primary hover:bg-primary/90 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          + New Quote
        </a>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Quotes', value: counts.total, color: 'text-gray-300' },
          { label: 'Awaiting Review', value: counts.submitted, color: 'text-amber-300' },
          { label: 'Approved', value: counts.approved, color: 'text-blue-300' },
          { label: 'Confirmed Value', value: `$${totalValue.toLocaleString()}`, color: 'text-emerald-300' },
        ].map(k => (
          <div key={k.label} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
            <div className={`text-2xl font-display font-bold ${k.color} mb-1`}>{k.value}</div>
            <div className="text-xs text-gray-500">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Quotes list */}
      {!quotes || quotes.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="font-display text-xl font-bold mb-2">No quotes yet</h3>
          <p className="text-gray-500 mb-6">Create your first group quote with our 5-step builder.</p>
          <a href="/partner/quote-builder" className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-xl transition-colors">
            Build First Quote
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {quotes.map(q => {
            const sc = STATUS_CONFIG[q.status] ?? STATUS_CONFIG.draft;
            const lineItems = (q.line_items as Array<{ type: string; name: string }>) ?? [];
            return (
              <div
                key={q.id}
                className="bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] rounded-2xl p-5 transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                      <span className="font-mono font-bold text-sm text-white">{q.quote_ref}</span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${sc.cls}`}>
                        {sc.label}
                      </span>
                      {q.valid_until && new Date(q.valid_until) > new Date() && q.status === 'approved' && (
                        <span className="text-xs text-blue-400 bg-blue-500/10 border border-blue-400/20 px-2 py-0.5 rounded-full">
                          Valid until {new Date(q.valid_until).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400 mb-2">
                      {q.destination && <span>{q.destination} · </span>}
                      {q.pax_count && <span>{q.pax_count} pax</span>}
                      {q.travel_date && <span> · {new Date(q.travel_date).toLocaleDateString()}</span>}
                      {q.return_date && <span> – {new Date(q.return_date).toLocaleDateString()}</span>}
                    </div>
                    {lineItems.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {lineItems.slice(0, 3).map((item, i) => (
                          <span key={i} className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-400">
                            {item.name}
                          </span>
                        ))}
                        {lineItems.length > 3 && (
                          <span className="text-xs text-gray-600">+{lineItems.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right">
                      <div className="text-lg font-display font-bold text-emerald-400">
                        {q.total_net_usd ? `$${Number(q.total_net_usd).toLocaleString()}` : '—'}
                      </div>
                      <div className="text-xs text-gray-500">net cost</div>
                    </div>
                    {q.total_sell_usd && (
                      <div className="text-right">
                        <div className="text-sm font-bold text-white">
                          ${Number(q.total_sell_usd).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">sell price</div>
                      </div>
                    )}
                    {q.margin_pct && (
                      <div className="text-right">
                        <div className="text-sm font-bold text-purple-400">{q.margin_pct}%</div>
                        <div className="text-xs text-gray-500">margin</div>
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      {new Date(q.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-4 border-t border-white/[0.05]">
                  <div className="flex items-center gap-3">
                    <a 
                      href={`/api/quotes/${q.id}/pdf`}
                      target="_blank"
                      className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Download PDF
                    </a>
                  </div>

                  {q.status === 'approved' && (
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-blue-300 mr-2 hidden sm:block">
                        ✅ Quote approved! Confirm this booking.
                      </div>
                      <ConfirmBookingButton quoteId={q.id} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
