import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const IntaSend = require('intasend-node');

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const intasend = new IntaSend(
    process.env.INTASEND_PUBLISHABLE_KEY,
    process.env.INTASEND_SECRET_KEY,
    false
  );
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    const body = await req.json();
    const { 
        amount, 
        currency, 
        phone, 
        fullName, 
        email, 
        package_id, 
        travel_date, 
        return_date, 
        num_adults, 
        num_children,
        special_requests,
        nationality,
        passport_no
    } = body;

    // 1. Upsert Client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .upsert({ 
        email, 
        full_name: fullName, 
        phone, 
        nationality, 
        passport_no 
      }, { onConflict: 'email' })
      .select()
      .single();

    if (clientError) throw clientError;

    // 2. Create Pending Booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        client_id: client.id,
        package_id,
        travel_date,
        return_date,
        num_adults,
        num_children,
        total_amount: amount,
        currency,
        status: 'pending',
        payment_status: 'unpaid',
        special_requests
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // 3. Initiate IntaSend STK Push
    const collect = intasend.collection();
    const response = await collect.mpesaStkPush({
      amount: amount,
      phone_number: phone.replace('+', ''), // Remove + for IntaSend
      email: email,
      api_ref: booking.id,
      narrative: `Booking for ${fullName}`
    });

    // 4. Record Payment Attempt
    await supabase
      .from('payments')
      .insert({
        booking_id: booking.id,
        provider: 'intasend',
        amount,
        currency,
        reference: response.invoice.invoice_id,
        status: 'pending',
        metadata: response
      });

    return NextResponse.json({ 
        booking_id: booking.id, 
        invoice_id: response.invoice.invoice_id 
    });

  } catch (error: any) {
    console.error("IntaSend Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
