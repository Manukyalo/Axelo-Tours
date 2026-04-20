import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function PartnerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/partner/login');

  const { data: partner } = await supabase
    .from('partners')
    .select('id, company_name, tier, net_rate_discount_pct, api_key, company_type, created_at')
    .eq('contact_email', user.email)
    .single();

  if (!partner) redirect('/partner/login');

  const { data: quotes } = await supabase
    .from('group_quotes')
    .select('id, quote_ref, destination, travel_date, pax_count, total_net_usd, status, created_at')
    .eq('partner_id', partner.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: allQuotes } = await supabase
    .from('group_quotes')
    .select('status, total_net_usd')
    .eq('partner_id', partner.id);

  const totalQuotes = allQuotes?.length ?? 0;
  const confirmedQuotes = allQuotes?.filter(q => q.status === 'confirmed').length ?? 0;
  const totalRevenue = allQuotes?.filter(q => ['confirmed', 'approved'].includes(q.status))
    .reduce((sum, q) => sum + (q.total_net_usd ?? 0), 0) ?? 0;

  const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-gray-500/20 text-gray-300',
    submitted: 'bg-amber-500/20 text-amber-300',
    approved: 'bg-blue-500/20 text-blue-300',
    confirmed: 'bg-emerald-500/20 text-emerald-300',
    cancelled: 'bg-red-500/20 text-red-300',
  };

  return (
    <div className="p-8 text-white">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-1">
          Welcome back, <span className="text-accent">{partner.company_name}</span>
        </h1>
        <p className="text-gray-400">Your partner dashboard — manage quotes, catalog, and excursions.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Total Quotes',
            value: totalQuotes,
            sub: 'all time',
            color: 'from-blue-600/20 to-blue-600/5 border-blue-500/20',
            textColor: 'text-blue-300',
          },
          {
            label: 'Confirmed Bookings',
            value: confirmedQuotes,
            sub: 'all time',
            color: 'from-emerald-600/20 to-emerald-600/5 border-emerald-500/20',
            textColor: 'text-emerald-300',
          },
          {
            label: 'Net Revenue',
            value: `$${totalRevenue.toLocaleString()}`,
            sub: 'total value',
            color: 'from-amber-600/20 to-amber-600/5 border-amber-500/20',
            textColor: 'text-amber-300',
          },
          {
            label: 'Your Net Rate',
            value: `${partner.net_rate_discount_pct}% off`,
            sub: `${partner.tier} tier`,
            color: 'from-purple-600/20 to-purple-600/5 border-purple-500/20',
            textColor: 'text-purple-300',
          },
        ].map(kpi => (
          <div
            key={kpi.label}
            className={`bg-gradient-to-b ${kpi.color} border rounded-2xl p-5`}
          >
            <div className={`text-3xl font-display font-bold ${kpi.textColor} mb-1`}>{kpi.value}</div>
            <div className="text-sm text-gray-300 font-medium">{kpi.label}</div>
            <div className="text-xs text-gray-500 mt-0.5">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <a
          href="/partner/quote-builder"
          className="group bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 rounded-2xl p-6 transition-all duration-300"
        >
          <div className="text-2xl mb-3">✨</div>
          <h3 className="font-display font-bold text-lg mb-1">Build Group Quote</h3>
          <p className="text-sm text-gray-400">5-step wizard → PDF in minutes</p>
          <div className="mt-4 text-primary text-sm font-semibold group-hover:translate-x-1 transition-transform">
            Start building →
          </div>
        </a>
        <a
          href="/partner/catalog"
          className="group bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all duration-300"
        >
          <div className="text-2xl mb-3">📦</div>
          <h3 className="font-display font-bold text-lg mb-1">Browse Catalog</h3>
          <p className="text-sm text-gray-400">All packages with your net rates</p>
          <div className="mt-4 text-gray-400 text-sm font-semibold group-hover:text-white group-hover:translate-x-1 transition-all">
            View catalog →
          </div>
        </a>
        <a
          href="/partner/shore-excursions"
          className="group bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all duration-300"
        >
          <div className="text-2xl mb-3">🚢</div>
          <h3 className="font-display font-bold text-lg mb-1">Shore Excursions</h3>
          <p className="text-sm text-gray-400">Mombasa &amp; Zanzibar packages</p>
          <div className="mt-4 text-gray-400 text-sm font-semibold group-hover:text-white group-hover:translate-x-1 transition-all">
            View excursions →
          </div>
        </a>
      </div>

      {/* Recent Quotes */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="font-display font-bold text-lg">Recent Quotes</h2>
          <a href="/partner/quotes" className="text-sm text-gray-400 hover:text-white transition-colors">
            View all →
          </a>
        </div>

        {!quotes || quotes.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <p className="mb-4">No quotes yet.</p>
            <a
              href="/partner/quote-builder"
              className="inline-flex items-center gap-2 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              Build your first quote
            </a>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {quotes.map(q => (
              <div key={q.id} className="px-6 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-0.5">
                    <span className="font-mono text-sm text-gray-300">{q.quote_ref}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${STATUS_COLORS[q.status] || STATUS_COLORS.draft}`}>
                      {q.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {q.destination} · {q.pax_count} pax
                    {q.travel_date ? ` · ${new Date(q.travel_date).toLocaleDateString()}` : ''}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-emerald-400">
                    {q.total_net_usd ? `$${Number(q.total_net_usd).toLocaleString()}` : '—'}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">net</div>
                </div>
                <a
                  href={`/partner/quotes`}
                  className="text-xs text-gray-500 hover:text-white transition-colors shrink-0"
                >
                  View →
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Key Notice */}
      {partner.api_key && (
        <div className="mt-6 bg-blue-600/10 border border-blue-500/20 rounded-2xl p-5 flex items-start gap-3">
          <span className="text-xl">🔑</span>
          <div>
            <div className="font-semibold text-blue-300 mb-1">REST API Available</div>
            <p className="text-sm text-gray-400">
              Your API key is active. Integrate Axelo packages directly into your booking system.{' '}
              <a href="/partner/api-docs" className="text-blue-400 hover:underline">View API docs →</a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
