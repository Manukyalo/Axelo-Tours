import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const IntaSend = require('intasend-node');

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
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
    const { searchParams } = new URL(req.url);
    const invoice_id = searchParams.get('invoice_id');

    if (!invoice_id) {
      return NextResponse.json({ error: "Invoice ID required" }, { status: 400 });
    }

    const intasend = new IntaSend(
      process.env.INTASEND_PUBLISHABLE_KEY,
      process.env.INTASEND_SECRET_KEY,
      false
    );

    const collection = intasend.collection();
    const response = await collection.status(invoice_id);

    // Update status in DB if completed
    if (response.invoice.state === 'COMPLETE') {
      // Find the payment record to get the booking ID
      const { data: payment } = await supabase
        .from('payments')
        .select('booking_id')
        .eq('reference', invoice_id)
        .single();

      if (payment) {
        // Update payment
        await supabase
          .from('payments')
          .update({ status: 'completed' })
          .eq('reference', invoice_id);

        // Update booking
        await supabase
          .from('bookings')
          .update({ 
            payment_status: 'paid',
            status: 'confirmed'
          })
          .eq('id', payment.booking_id);
      }
    } else if (response.invoice.state === 'FAILED' || response.invoice.state === 'REJECTED') {
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('reference', invoice_id);
    }

    return NextResponse.json({ 
        status: response.invoice.state,
        booking_id: invoice_id // mapping to ref
    });

  } catch (error: any) {
    console.error("Status Check Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
