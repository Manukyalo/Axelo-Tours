import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PartnerSidebar from '@/components/partner/PartnerSidebar';

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/partner/login');
  }

  // Verify active partner record
  const { data: partner } = await supabase
    .from('partners')
    .select('id, company_name, tier, status, net_rate_discount_pct, api_key, company_type')
    .eq('contact_email', user.email)
    .single();

  if (!partner) {
    redirect('/partner/login?error=not_registered');
  }

  if (partner.status === 'pending') {
    redirect('/partner/login?error=pending_approval');
  }

  if (partner.status === 'rejected') {
    redirect('/partner/login?error=rejected');
  }

  return (
    <div className="flex min-h-screen bg-[#080d08]">
      <PartnerSidebar partner={partner} userEmail={user.email ?? ''} />
      <main className="flex-1 ml-[260px] min-h-screen">
        {children}
      </main>
    </div>
  );
}
