import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '../_auth';

/**
 * POST /api/v1/bookings
 *
 * Confirms a booking from an approved group quote.
 *
 * Body:
 * {
 *   quote_id: string (UUID of an approved group_quote),
 *   contact_name: string,
 *   contact_email: string,
 *   contact_phone: string,
 *   special_requests?: string
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

  const { quote_id, contact_name, contact_email, contact_phone, special_requests } = body as {
    quote_id?: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    special_requests?: string;
  };

  const errors: string[] = [];
  if (!quote_id) errors.push('quote_id is required');
  if (!contact_name) errors.push('contact_name is required');
  if (!contact_email) errors.push('contact_email is required');
  if (!contact_phone) errors.push('contact_phone is required');

  if (errors.length > 0) {
    return NextResponse.json({ error: 'Validation Error', details: errors }, { status: 422, headers });
  }

  const { supabaseAdmin } = await import('../_auth');

  // Fetch the quote and verify ownership + status
  const { data: quote, error: quoteFetchError } = await supabaseAdmin
    .from('group_quotes')
    .select('*')
    .eq('id', quote_id)
    .eq('partner_id', partner.id)
    .single();

  if (quoteFetchError || !quote) {
    return NextResponse.json(
      { error: 'Not Found', message: 'Quote not found or does not belong to your account.' },
      { status: 404, headers }
    );
  }

  if (quote.status !== 'approved') {
    return NextResponse.json(
      {
        error: 'Conflict',
        message: `Quote is in '${quote.status}' status. Only approved quotes can be confirmed.`,
        quote_ref: quote.quote_ref,
      },
      { status: 409, headers }
    );
  }

  // Check quote validity
  if (quote.valid_until && new Date(quote.valid_until) < new Date()) {
    return NextResponse.json(
      {
        error: 'Gone',
        message: `Quote ${quote.quote_ref} expired on ${new Date(quote.valid_until).toDateString()}. Please request a new quote.`,
      },
      { status: 410, headers }
    );
  }

  // Update quote to confirmed
  const { error: updateError } = await supabaseAdmin
    .from('group_quotes')
    .update({
      status: 'confirmed',
      notes: [quote.notes, `Confirmed via API by ${contact_name} (${contact_email})`].filter(Boolean).join('\n'),
    })
    .eq('id', quote_id);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to confirm booking', details: updateError.message }, { status: 500, headers });
  }

  return NextResponse.json(
    {
      success: true,
      message: 'Booking confirmed. Axelo operations team will be in touch within 2 business hours.',
      data: {
        booking_ref: quote.quote_ref,
        status: 'confirmed',
        destination: quote.destination,
        travel_date: quote.travel_date,
        return_date: quote.return_date,
        pax_count: quote.pax_count,
        total_net_usd: quote.total_net_usd,
        contact: { name: contact_name, email: contact_email, phone: contact_phone },
        special_requests: special_requests ?? null,
        confirmed_at: new Date().toISOString(),
      },
    },
    { status: 200, headers }
  );
}
