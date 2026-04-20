'use server';

import { createClient } from "@/lib/supabase/server";
import { sendPartnerApprovalEmail } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

export async function approvePartnerAction(partnerId: string, apiKey: string) {
  const supabase = await createClient();

  // 1. Get partner details
  const { data: partner } = await supabase
    .from('partners')
    .select('company_name, contact_email, net_rate_discount_pct')
    .eq('id', partnerId)
    .single();

  if (!partner) throw new Error("Partner not found");

  // 2. Update Supabase
  const { error } = await supabase
    .from('partners')
    .update({
      status: 'active',
      api_key: apiKey,
      approved_at: new Date().toISOString(),
      net_rate_discount_pct: partner.net_rate_discount_pct || 10,
    })
    .eq('id', partnerId);

  if (error) throw error;

  // 3. Send Email
  try {
    await sendPartnerApprovalEmail(partner.contact_email, partner.company_name, apiKey);
  } catch (err) {
    console.error("Failed to send approval email:", err);
    // We don't throw here to avoid rolling back the DB update if just email fails
  }

  revalidatePath('/admin/partners');
  return { success: true };
}
