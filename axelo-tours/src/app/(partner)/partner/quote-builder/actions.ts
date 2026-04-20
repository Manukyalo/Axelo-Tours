'use server';

import { createClient } from "@/lib/supabase/server";
import { sendQuoteSubmissionAlert } from "@/lib/notifications";

export async function submitQuoteAction(quoteData: any) {
  const supabase = await createClient();

  // 1. Insert into DB
  const { data: quote, error: dbErr } = await supabase
    .from('group_quotes')
    .insert({
      ...quoteData,
      status: 'submitted',
    })
    .select('*, partner:partners(company_name)')
    .single();

  if (dbErr) throw dbErr;

  // 2. Trigger notification
  try {
    await sendQuoteSubmissionAlert({
      quote_ref: quote.quote_ref,
      company_name: (quote.partner as any)?.company_name || 'Partner',
      destination: quote.destination,
      total_net: quote.total_net_usd,
    });
  } catch (err) {
    console.error("Failed to send quote notification:", err);
  }

  return { success: true, quote_ref: quote.quote_ref };
}
