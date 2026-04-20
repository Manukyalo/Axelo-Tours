'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function confirmQuoteAction(quoteId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // Verify ownership
  const { data: partner } = await supabase
    .from('partners')
    .select('id')
    .eq('contact_email', user.email)
    .single();

  if (!partner) throw new Error('Partner not found');

  const { error } = await supabase
    .from('group_quotes')
    .update({ status: 'confirmed' })
    .eq('id', quoteId)
    .eq('partner_id', partner.id); // Security check

  if (error) {
    console.error('Confirm quote error:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/partner/quotes');
  return { success: true };
}
