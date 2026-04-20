import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function PartnerCatalogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/partner/login');

  const { data: partner } = await supabase
    .from('partners')
    .select('id, net_rate_discount_pct, tier')
    .eq('contact_email', user.email)
    .single();

  if (!partner) redirect('/partner/login');

  const { data: packages } = await supabase
    .from('packages')
    .select('id, name, slug, destination, duration_days, price_usd, category, difficulty, highlights, images, group_size_min, group_size_max, best_season')
    .eq('available', true)
    .order('price_usd', { ascending: true });

  const discountPct = partner.net_rate_discount_pct ?? 10;

  const CATEGORY_COLORS: Record<string, string> = {
    budget: 'bg-gray-500/20 text-gray-300',
    standard: 'bg-blue-500/20 text-blue-300',
    luxury: 'bg-amber-500/20 text-amber-300',
    custom: 'bg-purple-500/20 text-purple-300',
  };

  const DIFF_COLORS: Record<string, string> = {
    easy: 'text-emerald-400',
    moderate: 'text-amber-400',
    challenging: 'text-red-400',
  };

  return (
    <div className="p-8 text-white">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold mb-1">Package Catalog</h1>
          <p className="text-gray-400">
            Showing your exclusive net rates · <span className="text-emerald-400 font-semibold">{discountPct}% off</span> public pricing
          </p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2 text-sm text-emerald-300">
          {packages?.length ?? 0} packages available
        </div>
      </div>

      {/* Pricing Legend */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-5 py-3.5 mb-8 flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-500" />
          <span className="text-gray-400">Public Price</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-gray-400">Your Net Rate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-gray-400">Your Margin (if selling at public price)</span>
        </div>
      </div>

      {/* Package Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {packages?.map(pkg => {
          const netRate = pkg.price_usd * (1 - discountPct / 100);
          const margin = pkg.price_usd - netRate;
          const marginPct = discountPct;

          return (
            <div
              key={pkg.id}
              className="group bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.08] hover:border-white/20 rounded-2xl overflow-hidden transition-all duration-300"
            >
              {/* Background strip */}
              <div
                className="h-2 w-full"
                style={{
                  background: `linear-gradient(90deg, #1A6B3A ${discountPct}%, transparent ${discountPct}%)`,
                }}
              />

              <div className="p-5">
                {/* Title & badges */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-display font-bold text-lg leading-tight">{pkg.name}</h3>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${CATEGORY_COLORS[pkg.category] || CATEGORY_COLORS.standard}`}>
                      {pkg.category}
                    </span>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 text-sm text-gray-400 mb-4">
                  <span>📍 {pkg.destination}</span>
                  <span>·</span>
                  <span>{pkg.duration_days} days</span>
                  <span>·</span>
                  <span className={`font-medium ${DIFF_COLORS[pkg.difficulty] || ''}`}>{pkg.difficulty}</span>
                </div>

                {/* Highlights */}
                {pkg.highlights && pkg.highlights.length > 0 && (
                  <ul className="mb-4 space-y-1">
                    {pkg.highlights.slice(0, 3).map((h: string) => (
                      <li key={h} className="text-xs text-gray-400 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Pricing table */}
                <div className="bg-black/20 rounded-xl p-4 space-y-2.5 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Public Price</span>
                    <span className="text-sm text-gray-400 line-through">${pkg.price_usd.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-emerald-500 uppercase tracking-wide font-semibold">Your Net Rate</span>
                    <span className="text-lg font-display font-bold text-emerald-400">${netRate.toFixed(0)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-2 flex items-center justify-between">
                    <span className="text-xs text-purple-400 uppercase tracking-wide">Your Margin</span>
                    <span className="text-sm font-semibold text-purple-300">${margin.toFixed(0)} ({marginPct}%)</span>
                  </div>
                  <p className="text-[10px] text-gray-600">Per person, based on group rate. Land only.</p>
                </div>

                {/* Group size */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>Group: {pkg.group_size_min}–{pkg.group_size_max} pax</span>
                  {pkg.best_season?.length > 0 && (
                    <span>Best: {pkg.best_season.slice(0, 2).join(', ')}</span>
                  )}
                </div>

                {/* CTA */}
                <a
                  href={`/partner/quote-builder?package=${pkg.id}&destination=${encodeURIComponent(pkg.destination)}`}
                  className="w-full flex items-center justify-center gap-2 bg-primary/20 hover:bg-primary/30 border border-primary/30 hover:border-primary/60 text-primary font-semibold py-2.5 rounded-xl text-sm transition-all duration-200 group-hover:shadow-lg group-hover:shadow-primary/10"
                >
                  ✨ Add to Quote
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
