"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
    CheckCircle2, 
    Calendar, 
    MapPin, 
    ArrowRight, 
    Clock, 
    Download,
    PartyPopper
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";

export default function ConfirmationPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const bookingId = searchParams.get('booking_id');
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const supabase = createClient();

    useEffect(() => {
        if (!bookingId) {
            router.push('/');
            return;
        }

        async function fetchBooking() {
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    *,
                    packages (*),
                    clients (*)
                `)
                .eq('id', bookingId)
                .single();

            if (error) {
                console.error(error);
                return;
            }
            setBooking(data);
            setLoading(false);
        }
        fetchBooking();
    }, [bookingId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen pt-40 pb-20 bg-[#FAFAF7]">
            <div className="container mx-auto px-6 max-w-2xl text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mb-12"
                >
                    <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/20">
                        <CheckCircle2 className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
                        Safari <span className="text-primary italic">Confirmed!</span>
                    </h1>
                    <p className="text-muted-foreground text-lg font-medium">
                        Pack your bags, {booking?.clients?.full_name || 'Adventurer'}! Your safari experience is officially secured.
                    </p>
                </motion.div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-border/40 shadow-sm text-left mb-12">
                    <div className="flex items-center justify-between mb-8 pb-8 border-b border-dashed border-border/40">
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Booking Reference</p>
                            <p className="text-xl font-mono font-bold text-primary">{bookingId?.slice(0, 8).toUpperCase()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Status</p>
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">Paid & Confirmed</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-primary">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Package</p>
                                <p className="font-bold">{booking?.packages?.name}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-primary">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Travel Dates</p>
                                <p className="font-bold">{format(new Date(booking?.travel_date), "MMM dd")} - {format(new Date(booking?.return_date), "MMM dd, yyyy")}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-primary">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Duration</p>
                                <p className="font-bold">{booking?.packages?.duration_days} Days / {booking?.packages?.duration_days - 1} Nights</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between">
                        <span className="text-sm font-bold text-primary">Total Paid</span>
                        <span className="text-lg font-bold text-primary">{formatCurrency(booking?.total_amount, booking?.currency)}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button onClick={() => router.push('/portal')} className="h-16 rounded-[2rem] font-bold text-lg group bg-brand-dark hover:bg-black">
                        Access Your Portal
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <Button variant="outline" className="h-16 rounded-[2rem] font-bold text-lg border-border/40 bg-white">
                        <Download className="mr-2 w-5 h-5" />
                        Download PDF
                    </Button>
                </div>

                <div className="mt-12 p-8 bg-accent/5 rounded-[2.5rem] border border-accent/10 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-left">
                        <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-white shadow-lg">
                            <Download className="w-8 h-8" />
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-1">Don't forget the app!</h4>
                            <p className="text-sm text-muted-foreground font-medium">Download the Axelo Tours app on Android to view your live itinerary, chat with Zara, and access your tickets offline.</p>
                        </div>
                    </div>
                    <PartyPopper className="absolute -bottom-4 -right-4 w-32 h-32 text-accent/10 -rotate-12" />
                </div>
            </div>
        </main>
    );
}
