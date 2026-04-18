import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2023-10-16" as any,
  });
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    const body = await req.json();
    const { 
        amount, 
        currency, 
        fullName, 
        email, 
        phone,
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
      .upsert({ email, full_name: fullName, phone, nationality, passport_no }, { onConflict: 'email' })
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

    // 3. Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects cents
      currency: currency.toLowerCase(),
      metadata: {
        booking_id: booking.id,
        client_name: fullName
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // 4. Record Payment Attempt
    await supabase
      .from('payments')
      .insert({
        booking_id: booking.id,
        provider: 'stripe',
        amount,
        currency,
        reference: paymentIntent.id,
        status: 'pending',
        metadata: paymentIntent
      });

    return NextResponse.json({ 
        client_secret: paymentIntent.client_secret,
        booking_id: booking.id 
    });

  } catch (error: any) {
    console.error("Stripe Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
