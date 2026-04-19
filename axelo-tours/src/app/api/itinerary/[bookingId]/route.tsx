import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import React from 'react';
import { renderToStream } from '@react-pdf/renderer';
import { ItineraryDocument } from "@/components/itinerary/ItineraryDocument";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const supabase = await createClient();

    // 1. Auth & Verification
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    // 2. Fetch data and verify ownership
    const { data: booking, error: bError } = await supabase
      .from("bookings")
      .select("*, package:packages(*), client:clients(*)")
      .eq("id", bookingId)
      .single();

    if (bError || !booking) return new NextResponse("Booking not found", { status: 404 });

    // Verify client belongs to auth user
    if (booking.client?.user_id !== user.id) {
       return new NextResponse("Forbidden", { status: 403 });
    }

    // 3. Generate PDF Stream
    const stream = await renderToStream(
      <ItineraryDocument 
        booking={booking} 
        pkg={booking.package} 
        client={booking.client} 
      />
    );

    // 4. Return as PDF
    // Note: renderToStream provides a Node.js Readable stream. 
    // NextResponse expects a Web ReadableStream.
    return new NextResponse(stream as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Itinerary-${bookingId.slice(0, 8)}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error("PDF Generation Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
