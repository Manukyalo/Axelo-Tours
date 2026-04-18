"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ChevronRight, 
    ChevronLeft, 
    Users, 
    Calendar as CalendarIcon, 
    CreditCard, 
    CheckCircle2, 
    ShieldCheck, 
    Info,
    Smartphone,
    Globe,
    ArrowRight
} from "lucide-react";
import { format, addDays } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { createClient } from "@/lib/supabase/client";
import { SafariPackage } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";

type Step = 1 | 2 | 3 | 4;

interface BookingState {
    adults: number;
    children: number;
    startDate: Date | undefined;
    currency: 'KES' | 'USD';
    fullName: string;
    email: string;
    phone: string;
    nationality: string;
    passportNo: string;
    specialRequests: string;
}

const INITIAL_STATE: BookingState = {
    adults: 2,
    children: 0,
    startDate: undefined,
    currency: 'KES',
    fullName: '',
    email: '',
    phone: '',
    nationality: '',
    passportNo: '',
    specialRequests: '',
};

export default function BookingPage() {
    const params = useParams();
    const router = useRouter();
    const [step, setStep] = useState<Step>(1);
    const [pkg, setPkg] = useState<SafariPackage | null>(null);
    const [loading, setLoading] = useState(true);
    const [bookingState, setBookingState] = useState<BookingState>(INITIAL_STATE);
    const [isProcessing, setIsProcessing] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        async function fetchPackage() {
            const { data, error } = await supabase
                .from('packages')
                .select('*')
                .eq('id', params.id)
                .single();

            if (error) {
                toast.error("Package not found");
                router.push('/safaris');
                return;
            }
            setPkg(data);
            setLoading(false);
        }
        fetchPackage();
    }, [params.id]);

    const totalPrice = useMemo(() => {
        if (!pkg) return 0;
        const basePrice = bookingState.currency === 'KES' ? pkg.price_kes : pkg.price_usd;
        return (bookingState.adults + bookingState.children) * basePrice;
    }, [pkg, bookingState.adults, bookingState.children, bookingState.currency]);

    const handleMpesaPayment = async () => {
        if (!pkg) return;
        setIsProcessing(true);
        try {
            const res = await fetch('/api/payments/intasend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...bookingState,
                    amount: totalPrice,
                    package_id: pkg.id,
                    travel_date: format(bookingState.startDate!, 'yyyy-MM-dd'),
                    return_date: format(addDays(bookingState.startDate!, pkg.duration_days), 'yyyy-MM-dd'),
                    num_adults: bookingState.adults,
                    num_children: bookingState.children
                })
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            // Poll for status
            const pollInterval = setInterval(async () => {
                const statusRes = await fetch(`/api/payments/intasend/status?invoice_id=${data.invoice_id}`);
                const statusData = await statusRes.json();
                
                if (statusData.status === 'COMPLETE') {
                    clearInterval(pollInterval);
                    toast.success("Payment confirmed!");
                    router.push(`/booking/confirm?booking_id=${data.booking_id}`);
                } else if (statusData.status === 'FAILED' || statusData.status === 'REJECTED') {
                    clearInterval(pollInterval);
                    toast.error("Payment failed. Please try again.");
                    setIsProcessing(false);
                }
            }, 3000);

            // Timeout after 60s
            setTimeout(() => {
                clearInterval(pollInterval);
                if (isProcessing) {
                    toast.error("Payment timeout. Check your M-Pesa for a message.");
                    setIsProcessing(false);
                }
            }, 60000);

        } catch (error: any) {
            toast.error(error.message);
            setIsProcessing(false);
        }
    };

    const handleNext = () => {
        if (step === 1 && !bookingState.adults) {
            toast.error("Please select at least one adult");
            return;
        }
        if (step === 2 && !bookingState.startDate) {
            toast.error("Please select a travel date");
            return;
        }
        if (step === 3) {
            if (!bookingState.fullName || !bookingState.email || !bookingState.phone) {
                toast.error("Please fill in all required fields");
                return;
            }
            if (!bookingState.phone.startsWith('+')) {
                toast.error("Please include country code (e.g., +254)");
                return;
            }
        }
        setStep((s) => (s + 1) as Step);
        window.scrollTo(0, 0);
    };

    const handleBack = () => {
        setStep((s) => (s - 1) as Step);
        window.scrollTo(0, 0);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!pkg) return null;

    return (
        <main className="min-h-screen pt-32 pb-20 bg-[#FAFAF7]">
            <div className="container mx-auto px-6 max-w-5xl">
                {/* Progress Header */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Book Your Adventure</h1>
                            <p className="text-muted-foreground font-medium">{pkg.name}</p>
                        </div>
                        <Badge variant="outline" className="px-4 py-2 border-primary text-primary font-bold">
                            Step {step} of 4
                        </Badge>
                    </div>

                    <div className="relative h-2 bg-black/5 rounded-full overflow-hidden">
                        <motion.div 
                            className="absolute top-0 left-0 h-full bg-primary"
                            initial={{ width: "25%" }}
                            animate={{ width: `${step * 25}%` }}
                            transition={{ duration: 0.5, ease: "circOut" }}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div 
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-border/40 shadow-sm">
                                        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                                            <Users className="w-6 h-6 text-primary" />
                                            Guest Selection
                                        </h2>

                                        <div className="space-y-8">
                                            {/* Adults */}
                                            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl">
                                                <div>
                                                    <p className="font-bold text-lg">Adults</p>
                                                    <p className="text-sm text-muted-foreground font-medium">Aged 12+</p>
                                                </div>
                                                <div className="flex items-center space-x-6">
                                                    <button 
                                                        onClick={() => setBookingState(s => ({ ...s, adults: Math.max(1, s.adults - 1) }))}
                                                        className="w-12 h-12 rounded-2xl bg-white border border-border/40 flex items-center justify-center hover:bg-white/80 active:scale-95 transition-all"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="text-2xl font-bold w-4 text-center">{bookingState.adults}</span>
                                                    <button 
                                                        onClick={() => setBookingState(s => ({ ...s, adults: Math.min(20, s.adults + 1) }))}
                                                        className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Children */}
                                            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl">
                                                <div>
                                                    <p className="font-bold text-lg">Children</p>
                                                    <p className="text-sm text-muted-foreground font-medium">Aged 3-11</p>
                                                </div>
                                                <div className="flex items-center space-x-6">
                                                    <button 
                                                        onClick={() => setBookingState(s => ({ ...s, children: Math.max(0, s.children - 1) }))}
                                                        className="w-12 h-12 rounded-2xl bg-white border border-border/40 flex items-center justify-center hover:bg-white/80 active:scale-95 transition-all"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="text-2xl font-bold w-4 text-center">{bookingState.children}</span>
                                                    <button 
                                                        onClick={() => setBookingState(s => ({ ...s, children: Math.min(10, s.children + 1) }))}
                                                        className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-12 pt-8 border-t border-border/40">
                                            <div className="flex items-center justify-between mb-8">
                                                <h3 className="font-bold text-lg">Preferred Currency</h3>
                                                <div className="flex p-1 bg-slate-100 rounded-xl">
                                                    <button 
                                                        onClick={() => setBookingState(s => ({ ...s, currency: 'KES' }))}
                                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${bookingState.currency === 'KES' ? 'bg-white shadow-sm' : 'text-muted-foreground'}`}
                                                    >
                                                        KES
                                                    </button>
                                                    <button 
                                                        onClick={() => setBookingState(s => ({ ...s, currency: 'USD' }))}
                                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${bookingState.currency === 'USD' ? 'bg-white shadow-sm' : 'text-muted-foreground'}`}
                                                    >
                                                        USD
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex items-center p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                                <Info className="w-5 h-5 text-primary mr-3 shrink-0" />
                                                <p className="text-sm text-primary font-medium leading-normal">
                                                    Prices include all park fees, luxury transportation, and professional guides. No hidden costs.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <Button onClick={handleNext} className="w-full h-16 rounded-3xl text-lg font-bold group">
                                        Continue to Dates
                                        <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div 
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-border/40 shadow-sm flex flex-col items-center">
                                        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 self-start">
                                            <CalendarIcon className="w-6 h-6 text-primary" />
                                            Select Start Date
                                        </h2>
                                        
                                        <div className="calendar-container w-full max-w-sm">
                                            <DayPicker 
                                                mode="single"
                                                selected={bookingState.startDate}
                                                onSelect={(d) => setBookingState(s => ({ ...s, startDate: d }))}
                                                disabled={{ before: new Date() }}
                                                className="border-none p-0 w-full"
                                                modifiersStyles={{
                                                    selected: { backgroundColor: '#1A6B3A', borderRadius: '12px' }
                                                }}
                                            />
                                        </div>

                                        {bookingState.startDate && (
                                            <div className="mt-8 pt-8 border-t border-border/40 w-full">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-slate-50 p-4 rounded-2xl">
                                                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Departure</p>
                                                        <p className="font-bold">{format(bookingState.startDate, "PPP")}</p>
                                                    </div>
                                                    <div className="bg-slate-50 p-4 rounded-2xl">
                                                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Return</p>
                                                        <p className="font-bold">{format(addDays(bookingState.startDate, pkg.duration_days), "PPP")}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-4">
                                        <Button variant="outline" onClick={handleBack} className="flex-1 h-16 rounded-3xl text-lg font-bold border-border/40">
                                            <ChevronLeft className="mr-2 w-5 h-5" />
                                            Back
                                        </Button>
                                        <Button onClick={handleNext} className="flex-[2] h-16 rounded-3xl text-lg font-bold group">
                                            Continue to Details
                                            <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div 
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-border/40 shadow-sm">
                                        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                                            <Smartphone className="w-6 h-6 text-primary" />
                                            Primary Guest Details
                                        </h2>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold ml-1">Full Name *</label>
                                                <Input 
                                                    value={bookingState.fullName}
                                                    onChange={(e) => setBookingState(s => ({ ...s, fullName: e.target.value }))}
                                                    className="h-14 rounded-2xl border-border/40 focus:ring-primary"
                                                    placeholder="John Doe"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold ml-1">Email Address *</label>
                                                <Input 
                                                    type="email"
                                                    value={bookingState.email}
                                                    onChange={(e) => setBookingState(s => ({ ...s, email: e.target.value }))}
                                                    className="h-14 rounded-2xl border-border/40 focus:ring-primary"
                                                    placeholder="john@example.com"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold ml-1">Phone Number (+Country Code) *</label>
                                                <Input 
                                                    value={bookingState.phone}
                                                    onChange={(e) => setBookingState(s => ({ ...s, phone: e.target.value }))}
                                                    className="h-14 rounded-2xl border-border/40 focus:ring-primary"
                                                    placeholder="+254 700 000 000"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold ml-1">Nationality *</label>
                                                <Input 
                                                    value={bookingState.nationality}
                                                    onChange={(e) => setBookingState(s => ({ ...s, nationality: e.target.value }))}
                                                    className="h-14 rounded-2xl border-border/40 focus:ring-primary"
                                                    placeholder="Kenyan"
                                                />
                                            </div>
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="text-sm font-bold ml-1">Passport Number (Optional)</label>
                                                <Input 
                                                    value={bookingState.passportNo}
                                                    onChange={(e) => setBookingState(s => ({ ...s, passportNo: e.target.value }))}
                                                    className="h-14 rounded-2xl border-border/40 focus:ring-primary"
                                                />
                                            </div>
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="text-sm font-bold ml-1">Special Requests (Dietary, Accessibility, etc.)</label>
                                                <textarea 
                                                    value={bookingState.specialRequests}
                                                    onChange={(e) => setBookingState(s => ({ ...s, specialRequests: e.target.value }))}
                                                    className="w-full p-4 rounded-2xl border border-border/40 focus:ring-primary focus:border-primary min-h-[120px] outline-none transition-all"
                                                    placeholder="Add any specific requirements..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <Button variant="outline" onClick={handleBack} className="flex-1 h-16 rounded-3xl text-lg font-bold border-border/40">
                                            <ChevronLeft className="mr-2 w-5 h-5" />
                                            Back
                                        </Button>
                                        <Button onClick={handleNext} className="flex-[2] h-16 rounded-3xl text-lg font-bold group">
                                            Continue to Payment
                                            <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 4 && (
                                <motion.div 
                                    key="step4"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    {/* Placeholder for Payment Steps - To be integrated with API */}
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-border/40 shadow-sm">
                                        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                                            <CreditCard className="w-6 h-6 text-primary" />
                                            Secure Payment
                                        </h2>

                                        <div className="space-y-8">
                                            <div className="p-6 border-2 border-primary bg-primary/5 rounded-[2rem] relative">
                                                <div className="absolute top-4 right-4 text-primary">
                                                    <CheckCircle2 className="w-6 h-6" />
                                                </div>
                                                <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                                                    M-Pesa STK Push
                                                </h3>
                                                <p className="text-muted-foreground font-medium mb-6">
                                                    Enter your phone number below and you'll receive a prompt on your phone to enter your M-Pesa PIN.
                                                </p>
                                                <div className="space-y-4">
                                                    <Input 
                                                        value={bookingState.phone}
                                                        onChange={(e) => setBookingState(s => ({ ...s, phone: e.target.value }))}
                                                        className="h-14 rounded-2xl border-primary scale-105"
                                                        placeholder="+254..."
                                                    />
                                                    <Button 
                                                        onClick={handleMpesaPayment}
                                                        disabled={isProcessing}
                                                        className="w-full h-14 rounded-2xl font-bold text-lg"
                                                    >
                                                        {isProcessing ? "Waiting for M-Pesa confirmation..." : "Pay with M-Pesa"}
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="p-6 border border-border/40 bg-slate-50 rounded-[2rem] opacity-60 grayscale cursor-not-allowed">
                                                <h3 className="font-bold text-xl mb-4">Credit / Debit Card</h3>
                                                <p className="text-sm text-muted-foreground font-medium">Coming soon for USD payments.</p>
                                            </div>
                                        </div>

                                        <div className="mt-12 flex items-center justify-center space-x-8 opacity-40">
                                            <div className="flex items-center space-x-2">
                                                <ShieldCheck className="w-5 h-5" />
                                                <span className="text-xs font-bold uppercase tracking-wider">PCI-DSS Compliant</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Globe className="w-5 h-5" />
                                                <span className="text-xs font-bold uppercase tracking-wider">IntaSend Verified</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <Button variant="outline" onClick={handleBack} disabled={isProcessing} className="flex-1 h-16 rounded-3xl text-lg font-bold border-border/40">
                                            <ChevronLeft className="mr-2 w-5 h-5" />
                                            Back
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-32 space-y-6">
                            <div className="bg-white p-8 rounded-[2.5rem] border border-border/40 shadow-sm overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10" />
                                
                                <h3 className="text-xl font-bold mb-6">Booking Summary</h3>
                                
                                <div className="space-y-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground font-medium">Package</span>
                                        <span className="font-bold text-right max-w-[150px]">{pkg.name}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground font-medium">Duration</span>
                                        <span className="font-bold">{pkg.duration_days} Days / {pkg.duration_days - 1} Nights</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground font-medium">Guests</span>
                                        <span className="font-bold">{bookingState.adults} Adults, {bookingState.children} Children</span>
                                    </div>
                                    {bookingState.startDate && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground font-medium">Arrival</span>
                                            <span className="font-bold">{format(bookingState.startDate, "MMM dd, yyyy")}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 pt-8 border-t-2 border-dashed border-border/40">
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Amount</p>
                                            <h4 className="text-3xl font-display font-bold text-primary">
                                                {formatCurrency(totalPrice, bookingState.currency)}
                                            </h4>
                                        </div>
                                        <Badge className="bg-accent text-white font-bold">{bookingState.currency}</Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-brand-dark p-8 rounded-[2.5rem] text-white">
                                <h4 className="font-bold mb-4 flex items-center">
                                    <ShieldCheck className="w-5 h-5 mr-2 text-accent" />
                                    Booking Guarantee
                                </h4>
                                <ul className="space-y-3 text-sm text-gray-400 font-medium">
                                    <li className="flex items-center">
                                        <CheckCircle2 className="w-4 h-4 mr-2 text-primary" />
                                        Instant Confirmation
                                    </li>
                                    <li className="flex items-center">
                                        <CheckCircle2 className="w-4 h-4 mr-2 text-primary" />
                                        Best Rate Price Match
                                    </li>
                                    <li className="flex items-center">
                                        <CheckCircle2 className="w-4 h-4 mr-2 text-primary" />
                                        Secure Encrypted Payment
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .calendar-container .rdp {
                    --rdp-cell-size: 45px;
                    --rdp-accent-color: #1A6B3A;
                    --rdp-background-color: #E8F3ED;
                    margin: 0;
                }
                .calendar-container .rdp-day_selected {
                    font-weight: bold;
                }
            `}</style>
        </main>
    );
}
