import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function PartnerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/partner/login');

  const { data: partner } = await supabase
    .from('partners')
    .select('id, company_name, tier, net_rate_discount_pct, api_key, partner_type, created_at, phone, country')
    .eq('email', user.email)
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="font-display text-4xl font-black mb-2 tracking-tight">
            Welcome back, <span className="text-primary italic">{partner.company_name}</span>
          </h1>
          <p className="text-gray-400 font-medium">B2B Enterprise Portal • Exclusive Safari Inventory</p>
        </div>
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-3 rounded-2xl">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
            {partner.company_name.charAt(0)}
          </div>
          <div className="text-right pr-2">
            <div className="text-xs font-black uppercase text-gray-500 tracking-wider">Account Tier</div>
            <div className="text-sm font-bold text-white uppercase tracking-tight">{partner.tier} Member</div>
          </div>
        </div>
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

      <div className="grid lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2 grid md:grid-cols-3 gap-4">
          <a
            href="/partner/quote-builder"
            className="group relative overflow-hidden bg-primary shadow-2xl shadow-primary/10 rounded-3xl p-6 transition-all duration-500 hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16" />
            <div className="text-3xl mb-4">🪄</div>
            <h3 className="font-display font-black text-xl mb-1 text-white">Quote Builder</h3>
            <p className="text-xs text-white/70 font-medium leading-relaxed">Turn requests into custom itineraries in under 5 minutes.</p>
            <div className="mt-6 flex items-center gap-2 text-white text-xs font-black uppercase tracking-widest group-hover:translate-x-1 transition-transform">
              Start Builder ↵
            </div>
          </a>
          <a
            href="/partner/catalog"
            className="group bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 rounded-3xl p-6 transition-all duration-300"
          >
            <div className="text-2xl mb-4">🦁</div>
            <h3 className="font-display font-bold text-lg mb-1">Safari Catalog</h3>
            <p className="text-xs text-gray-500 font-medium">B2B inventory with live net-rate discounts.</p>
            <div className="mt-8 text-gray-400 text-[10px] font-black uppercase tracking-widest group-hover:text-white transition-all">
              View Packages →
            </div>
          </a>
          <a
            href="/partner/shore-excursions"
            className="group bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 rounded-3xl p-6 transition-all duration-300"
          >
            <div className="text-2xl mb-4">⚓</div>
            <h3 className="font-display font-bold text-lg mb-1">Excursions</h3>
            <p className="text-xs text-gray-500 font-medium">Day trips & transfers for cruise & hotel guests.</p>
            <div className="mt-8 text-gray-400 text-[10px] font-black uppercase tracking-widest group-hover:text-white transition-all">
              Excursion Desk →
            </div>
          </a>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-[#080d08] border border-white/10 rounded-3xl p-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Net Rate Calculator</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Your Base Rate</span>
              <span className="font-mono text-emerald-400 font-bold">-{partner.net_rate_discount_pct}%</span>
            </div>
            <div className="relative">
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block">Estimated Selling Price (USD)</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-bold">$</span>
                <input 
                  type="number" 
                  placeholder="2,500" 
                  className="bg-transparent text-xl font-display font-black text-white focus:outline-none w-full"
                  defaultValue={2500}
                />
              </div>
            </div>
            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase">Your Net Cost</div>
                <div className="text-xl font-display font-black text-emerald-400">$2,250</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-gray-500 uppercase">Booking Margin</div>
                <div className="text-xl font-display font-black text-white">$250</div>
              </div>
            </div>
          </div>
        </div>
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
