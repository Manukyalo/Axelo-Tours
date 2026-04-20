import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '../_auth';

/**
 * GET /api/v1/availability
 *
 * Returns availability for packages given travel dates and pax count.
 *
 * Query params (all required):
 *   - travel_date: YYYY-MM-DD
 *   - return_date: YYYY-MM-DD
 *   - pax: number of passengers
 *   - destination (optional): filter results
 */
export async function GET(request: NextRequest) {
  const auth = await validateApiKey(request);
  if (!auth.success) return auth.response;

  const { headers } = auth;
  const { searchParams } = new URL(request.url);

  const travelDate = searchParams.get('travel_date');
  const returnDate = searchParams.get('return_date');
  const paxStr = searchParams.get('pax');
  const destination = searchParams.get('destination');

  if (!travelDate || !returnDate || !paxStr) {
    return NextResponse.json(
      {
        error: 'Bad Request',
        message: 'Required params: travel_date (YYYY-MM-DD), return_date (YYYY-MM-DD), pax (integer)',
      },
      { status: 400, headers }
    );
  }

  const pax = parseInt(paxStr, 10);
  if (isNaN(pax) || pax < 1) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'pax must be a positive integer' },
      { status: 400, headers }
    );
  }

  const { supabaseAdmin } = await import('../_auth');

  // Get packages that can accommodate the pax and fit the destination filter
  let pkgQuery = supabaseAdmin
    .from('packages')
    .select('id, name, slug, destination, duration_days, price_usd, group_size_min, group_size_max, category')
    .eq('available', true)
    .lte('group_size_min', pax)
    .gte('group_size_max', pax);

  if (destination) pkgQuery = pkgQuery.ilike('destination', `%${destination}%`);

  const { data: packages, error: pkgError } = await pkgQuery;

  if (pkgError) {
    return NextResponse.json({ error: 'Database error', details: pkgError.message }, { status: 500, headers });
  }

  // Check for existing confirmed bookings overlapping the requested dates
  const { data: conflictingBookings } = await supabaseAdmin
    .from('bookings')
    .select('package_id')
    .in('status', ['confirmed'])
    .lte('travel_date', returnDate)
    .gte('return_date', travelDate);

  const fullyBookedPackageIds = new Set(conflictingBookings?.map(b => b.package_id) ?? []);

  const discountPct = auth.partner.net_rate_discount_pct || 0;

  const results = packages?.map(pkg => ({
    package_id: pkg.id,
    name: pkg.name,
    slug: pkg.slug,
    destination: pkg.destination,
    duration_days: pkg.duration_days,
    category: pkg.category,
    pax_capacity: { min: pkg.group_size_min, max: pkg.group_size_max },
    available: !fullyBookedPackageIds.has(pkg.id),
    pricing: {
      public_price_usd: pkg.price_usd,
      net_rate_usd: parseFloat((pkg.price_usd * (1 - discountPct / 100)).toFixed(2)),
      total_net_usd: parseFloat((pkg.price_usd * (1 - discountPct / 100) * pax).toFixed(2)),
    },
  }));

  const availableCount = results?.filter(r => r.available).length ?? 0;

  return NextResponse.json(
    {
      meta: {
        travel_date: travelDate,
        return_date: returnDate,
        pax,
        total_packages_checked: results?.length ?? 0,
        available_count: availableCount,
        timestamp: new Date().toISOString(),
      },
      data: results,
    },
    { status: 200, headers }
  );
}
