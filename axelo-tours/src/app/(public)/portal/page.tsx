import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format, isFuture } from "date-fns";
import { 
  Calendar, 
  Users, 
  MapPin, 
  Download, 
  MessageSquare, 
  Plus,
  Plane,
  History,
  CheckCircle2,
  Clock,
  ExternalLink
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
    // If no client profile exists, we can't show bookings, but we keep them in the portal
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

  const upcomingBookings = bookings?.filter(b => isFuture(new Date(b.travel_date)) && b.status !== 'cancelled') || [];
  const pastBookings = bookings?.filter(b => !isFuture(new Date(b.travel_date)) || b.status === 'completed') || [];

  return (
    <div className="bg-gray-50/50 min-h-screen pb-20">
      <header className="bg-white border-b border-gray-100 pt-12 pb-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <nav className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest mb-4">
                <Link href="/" className="hover:opacity-70 transition-opacity">Home</Link>
                <span className="text-gray-300">/</span>
                <span className="text-gray-400">Portal</span>
              </nav>
              <h1 className="text-4xl lg:text-5xl font-display font-bold text-gray-900 leading-tight">
                Jambo, <span className="text-primary italic">{client.full_name.split(' ')[0]}</span>.
              </h1>
              <p className="text-gray-500 font-medium mt-2">Manage your safari adventures and documents in one place.</p>
            </div>
            <div className="flex items-center gap-3">
               <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-colors">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Support
               </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 -mt-10">
        <div className="space-y-16">
          {/* Upcoming Trips */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Plane className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Upcoming Adventures</h2>
            </div>

            {upcomingBookings.length === 0 ? (
              <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200 p-16 text-center">
                <p className="text-gray-400 font-medium mb-6">No upcoming trips scheduled.</p>
                <Link href="/safaris" className="text-primary font-bold hover:underline inline-flex items-center gap-2">
                  Find your next dream safari <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {upcomingBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </section>

          {/* Past Trips */}
          {pastBookings.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                  <History className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Past Memories</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} compact />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

function BookingCard({ booking, compact = false }: { booking: any, compact?: boolean }) {
  const pkg = booking.package;
  const isConfirmed = booking.status === 'confirmed';
  
  // Logic for voucher status badges (simulated based on status)
  const voucherStatus = isConfirmed ? "Lodge Confirmed" : "Processing";
  const docStatus = isConfirmed && booking.payment_status === 'paid' ? "Documents Sent" : "Pending Payment";

  if (compact) {
    return (
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-start justify-between mb-4">
           <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{pkg.destination}</p>
              <h3 className="font-bold text-gray-900 line-clamp-1">{pkg.name}</h3>
           </div>
           <CheckCircle2 className="w-5 h-5 text-green-500" />
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500 font-medium mb-6">
           <span className="flex items-center gap-1.5 font-bold">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(booking.travel_date), "MMM yyyy")}
           </span>
        </div>
        <Link 
          href={`/api/itinerary/${booking.id}`}
          target="_blank"
          className="w-full py-3 bg-gray-50 text-gray-600 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
        >
          <Download className="w-4 h-4" />
          Itinerary PDF
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden flex flex-col md:flex-row transition-transform hover:scale-[1.01] duration-300">
      <div className="w-full md:w-2/5 relative h-64 md:h-auto overflow-hidden">
        <Image 
          src={pkg.images?.[0] || "/images/placeholder-safari.jpg"} 
          alt={pkg.name}
          fill
          className="object-cover"
        />
        <div className="absolute top-6 left-6 flex flex-col gap-2">
           <span className={cn(
             "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg backdrop-blur-md",
             booking.status === 'confirmed' ? "bg-green-500/90 text-white" : "bg-primary/90 text-white"
           )}>
             {booking.status}
           </span>
           <span className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg backdrop-blur-md bg-white/90 text-gray-900">
             {voucherStatus}
           </span>
        </div>
      </div>
      
      <div className="flex-1 p-8 md:p-10 flex flex-col">
        <div className="mb-6">
           <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest mb-3">
              <MapPin className="w-3.5 h-3.5" />
              {pkg.destination}
           </div>
           <h3 className="text-2xl font-display font-bold text-gray-900 mb-4">{pkg.name}</h3>
           
           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Travel Date</p>
                 <div className="flex items-center gap-2 font-bold text-gray-700">
                    <Calendar className="w-4 h-4 text-primary" />
                    {format(new Date(booking.travel_date), "MMM d, yyyy")}
                 </div>
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Guests</p>
                 <div className="flex items-center gap-2 font-bold text-gray-700">
                    <Users className="w-4 h-4 text-primary" />
                    {booking.num_adults + booking.num_children} People
                 </div>
              </div>
           </div>
        </div>

        <div className="mt-auto pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-4">
           <Link 
             href={`/api/itinerary/${booking.id}`}
             target="_blank"
             className="w-full sm:w-auto flex-1 bg-primary text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
           >
              <Download className="w-5 h-5" />
              Download Itinerary
           </Link>
           <button className="w-full sm:w-auto bg-gray-50 text-gray-600 px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors">
              <MessageSquare className="w-5 h-5 text-primary" />
              Support
           </button>
        </div>
      </div>
    </div>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}
