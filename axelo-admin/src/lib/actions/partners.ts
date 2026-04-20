'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendPartnerApprovalEmail, sendQuoteApprovalNotification } from "@/lib/notifications";
import { Partner } from "@/types";

/**
 * Approves a partner and sends a welcome email with their API key.
 */
export async function approvePartnerAction(partnerId: string, updates: Partial<Partner>) {
  const supabase = await createClient();

  // 1. Update partner in DB
  const { data: partner, error } = await supabase
    .from('partners')
    .update({
      ...updates,
      status: 'approved'
    })
    .eq('id', partnerId)
    .select()
    .single();

  if (error) throw new Error(`Failed to approve partner: ${error.message}`);

  // 2. Send notification if email exists
  if (partner.email && partner.api_key) {
    try {
      await sendPartnerApprovalEmail(partner.email, partner.company_name, partner.api_key);
    } catch (err) {
      console.error("Failed to send approval email:", err);
      // We don't throw here as the DB update was successful
    }
  }

  revalidatePath('/partners');
  return { success: true, partner };
}

/**
 * Updates a quote status (e.g., approving a B2B request) and notifies the partner.
 */
export async function updateQuoteStatusAction(quoteId: string, status: string, partnerEmail?: string, quoteRef?: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('group_quotes')
    .update({ status })
    .eq('id', quoteId);

  if (error) throw new Error(`Failed to update quote: ${error.message}`);

  // Notify partner if quote is approved
  if (status === 'sent' && partnerEmail && quoteRef) {
    try {
      await sendQuoteApprovalNotification(partnerEmail, quoteRef);
    } catch (err) {
      console.error("Failed to send quote notification:", err);
    }
  }

  revalidatePath('/quotes');
  return { success: true };
}
