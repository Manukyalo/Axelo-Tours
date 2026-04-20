import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '../_auth';

/**
 * GET /api/v1/packages
 *
 * Returns all available packages with net rates calculated per partner tier.
 *
 * Query params:
 *   - destination (optional): filter by destination
 *   - category (optional): budget | standard | luxury | custom
 *   - min_days, max_days (optional): duration filter
 */
export async function GET(request: NextRequest) {
  const auth = await validateApiKey(request);
  if (!auth.success) return auth.response;

  const { partner, headers } = auth;
  const { searchParams } = new URL(request.url);

  const destination = searchParams.get('destination');
  const category = searchParams.get('category');
  const minDays = searchParams.get('min_days');
  const maxDays = searchParams.get('max_days');

  const { supabaseAdmin } = await import('../_auth');

  let query = supabaseAdmin
    .from('packages')
    .select('id, name, slug, destination, duration_days, price_usd, category, difficulty, highlights, inclusions, images, best_season, group_size_min, group_size_max')
    .eq('available', true)
    .order('price_usd', { ascending: true });

  if (destination) query = query.ilike('destination', `%${destination}%`);
  if (category) query = query.eq('category', category);
  if (minDays) query = query.gte('duration_days', parseInt(minDays));
  if (maxDays) query = query.lte('duration_days', parseInt(maxDays));

  const { data: packages, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500, headers });
  }

  const discountPct = partner.net_rate_discount_pct || 0;

  const enriched = packages?.map(pkg => ({
    ...pkg,
    pricing: {
      public_price_usd: pkg.price_usd,
      net_rate_usd: parseFloat((pkg.price_usd * (1 - discountPct / 100)).toFixed(2)),
      discount_pct: discountPct,
      currency: 'USD',
    },
  }));

  return NextResponse.json(
    {
      meta: {
        partner: partner.company_name,
        tier: partner.tier,
        discount_pct: discountPct,
        count: enriched?.length ?? 0,
        timestamp: new Date().toISOString(),
      },
      data: enriched,
    },
    { status: 200, headers }
  );
}
