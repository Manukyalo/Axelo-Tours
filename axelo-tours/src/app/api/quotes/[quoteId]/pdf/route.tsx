import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import React from 'react';
import { renderToStream } from '@react-pdf/renderer';
import { QuoteDocument } from "@/components/partner/QuoteDocument";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params;
    const supabase = await createClient();

    // 1. Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    // 2. Fetch partner record to verify ownership
    const { data: partner } = await supabase
      .from('partners')
      .select('id, company_name, contact_name, contact_email')
      .eq('contact_email', user.email)
      .single();

    if (!partner) return new NextResponse("Forbidden", { status: 403 });

    // 3. Fetch quote
    const { data: quote, error: qError } = await supabase
      .from("group_quotes")
      .select("*")
      .eq("id", quoteId)
      .single();

    if (qError || !quote) return new NextResponse("Quote not found", { status: 404 });

    // 4. Verify ownership (Partner context)
    // Also allow Admin to view PDFs
    const { data: isAdmin } = await supabase.rpc('is_admin'); // Assuming this helper exists from previous phases
    
    if (quote.partner_id !== partner.id && !isAdmin) {
       return new NextResponse("Forbidden", { status: 403 });
    }

    // 5. Generate PDF Stream
    const stream = await renderToStream(
      <QuoteDocument quote={quote} partner={partner} />
    );

    // 6. Return as PDF
    return new NextResponse(stream as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Axelo-Quote-${quote.quote_ref}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error("PDF Generation Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
