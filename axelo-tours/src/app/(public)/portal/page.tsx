import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import Link from "next/link";
import { PortalDashboard } from "@/components/portal/PortalDashboard";

export default async function PortalPage() {
  const supabase = await createClient();

  // 1. Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/portal/login");
  }

  // 2. Get client profile
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, full_name")
    .eq("user_id", user.id)
    .single();

  if (clientError || !client) {
    return (
        <div className="container mx-auto px-6 py-20 text-center">
            <h1 className="text-3xl font-display font-bold mb-4">Welcome to your Portal</h1>
            <p className="text-gray-500 mb-8">It looks like you don't have any bookings associated with this account yet.</p>
            <Link href="/safaris" className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-bold transition-all hover:scale-105">
                <Plus className="w-5 h-5" />
                Explore Safaris
            </Link>
        </div>
    );
  }

  // 3. Fetch bookings with joined packages
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select(`
      *,
      package:packages(*)
    `)
    .eq("client_id", client.id)
    .order("travel_date", { ascending: true });

  if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
  }

  return (
    <PortalDashboard 
      client={client} 
      bookings={bookings || []} 
    />
  );
}
