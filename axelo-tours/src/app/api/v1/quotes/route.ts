import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '../_auth';

/**
 * POST /api/v1/quotes
 *
 * Creates a group quote programmatically.
 *
 * Body:
 * {
 *   destination: string,
 *   travel_date: string (YYYY-MM-DD),
 *   return_date: string (YYYY-MM-DD),
 *   pax_count: number,
 *   line_items: Array<{ type: 'package'|'accommodation'|'transport'|'extra', id?: string, name: string, unit_price_usd: number, qty: number }>,
 *   transport_included?: boolean,
 *   notes?: string
 * }
 */
export async function POST(request: NextRequest) {
  const auth = await validateApiKey(request);
  if (!auth.success) return auth.response;

  const { partner, headers } = auth;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers });
  }

  const { destination, travel_date, return_date, pax_count, line_items, transport_included, notes } = body as {
    destination?: string;
    travel_date?: string;
    return_date?: string;
    pax_count?: number;
    line_items?: Array<{ type: string; name: string; unit_price_usd: number; qty: number }>;
    transport_included?: boolean;
    notes?: string;
  };

  // Validation
  const errors: string[] = [];
  if (!destination) errors.push('destination is required');
  if (!travel_date) errors.push('travel_date is required (YYYY-MM-DD)');
  if (!return_date) errors.push('return_date is required (YYYY-MM-DD)');
  if (!pax_count || pax_count < 1) errors.push('pax_count must be a positive integer');
  if (!line_items || !Array.isArray(line_items) || line_items.length === 0) errors.push('line_items array is required');

  if (errors.length > 0) {
    return NextResponse.json({ error: 'Validation Error', details: errors }, { status: 422, headers });
  }

  const { supabaseAdmin } = await import('../_auth');

  // Calculate totals
  const discountPct = partner.net_rate_discount_pct || 0;
  const totalNet = (line_items ?? []).reduce((sum, item) => {
    const netUnit = item.unit_price_usd * (1 - discountPct / 100);
    return sum + netUnit * item.qty;
  }, 0);

  // Generate quote reference
  const quoteRef = `AXL-${Date.now().toString(36).toUpperCase()}-API`;

  const { data: quote, error } = await supabaseAdmin
    .from('group_quotes')
    .insert({
      partner_id: partner.id,
      quote_ref: quoteRef,
      destination,
      travel_date,
      return_date,
      pax_count,
      line_items: line_items ?? [],
      transport_included: transport_included ?? true,
      total_net_usd: parseFloat(totalNet.toFixed(2)),
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      status: 'submitted',
      notes: notes ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create quote', details: error.message }, { status: 500, headers });
  }

  return NextResponse.json(
    {
      success: true,
      message: 'Quote created and submitted to Axelo for review.',
      data: {
        quote_id: quote.id,
        quote_ref: quote.quote_ref,
        status: quote.status,
        total_net_usd: quote.total_net_usd,
        valid_until: quote.valid_until,
        created_at: quote.created_at,
      },
    },
    { status: 201, headers }
  );
}
