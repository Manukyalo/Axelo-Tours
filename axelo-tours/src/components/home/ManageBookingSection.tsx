"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Map, ArrowRight, Smartphone, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const features = [
    {
        icon: Map,
        title: "Live Itinerary",
        description: "Access your day-by-day Safari quest with live updates."
    },
    {
        icon: ShieldCheck,
        title: "Travel Documents",
        description: "All your tickets, vouchers and park permits in one secure place."
    },
    {
        icon: MessageSquare,
        title: "AI Concierge",
        description: "Zara is available 24/7 to answer questions about your trip."
    }
];

export function ManageBookingSection() {
    return (
        <section className="py-24 bg-brand-dark text-white overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    {/* Content Left */}
                    <div className="lg:w-1/2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="inline-flex items-center space-x-2 bg-primary/20 text-primary px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-8 border border-primary/20">
                                <ShieldCheck className="w-4 h-4" />
                                <span>Traveler Exclusives</span>
                            </div>
                            <h2 className="text-4xl md:text-6xl font-display font-bold mb-8 leading-[1.1] tracking-tight">
                                Already Booked? <br />
                                <span className="text-accent underline decoration-accent/30 underline-offset-8">Manage Your Quest</span>
                            </h2>
                            <p className="text-xl text-gray-400 font-medium leading-relaxed mb-12 max-w-xl">
                                Welcome back, explorer. Access your personalized portal to track your safari, manage documents, and chat with your dedicated AI concierge.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                                {features.map((f, i) => (
                                    <div key={i} className="flex flex-col space-y-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary">
                                            <f.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold mb-2">{f.title}</h4>
                                            <p className="text-xs text-gray-500 font-medium leading-relaxed">{f.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <Link href="/portal/login" className="w-full sm:w-auto">
                                    <Button className="w-full sm:w-auto h-16 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg group">
                                        <span>Access My Portal</span>
                                        <ArrowRight className="ml-3 w-5 h-5 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </Link>
                                <div className="flex items-center space-x-3 text-gray-500 text-sm font-medium">
                                    <Smartphone className="w-5 h-5" />
                                    <span>Or use the Axelo App</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Image / Visual Right */}
                    <div className="lg:w-1/2 relative">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
                            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="relative z-10 rounded-[3rem] border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                        >
                            <div className="aspect-[4/5] md:aspect-video rounded-[2.5rem] overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-tr from-brand-dark/80 via-transparent to-transparent z-10" />
                                {/* Mock of a portal dashboard screen */}
                                <div className="absolute inset-x-8 bottom-8 z-20 space-y-4">
                                    <div className="inline-flex items-center space-x-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-green-500/20 backdrop-blur-md">
                                        Active Quest
                                    </div>
                                    <p className="text-3xl font-display font-bold leading-tight">Masai Mara <br />Ultimate Safari</p>
                                    <div className="flex items-center space-x-4">
                                        <div className="flex -space-x-2">
                                            {[1, 2].map((i) => (
                                                <div key={i} className="w-8 h-8 rounded-full border-2 border-brand-dark bg-gray-600" />
                                            ))}
                                        </div>
                                        <span className="text-sm font-bold text-gray-300">2 Travelers</span>
                                    </div>
                                </div>
                                <div className="absolute inset-0 bg-primary/20 mix-blend-overlay" />
                                <div className="absolute inset-0 bg-black/40" />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                     <div className="w-20 h-20 rounded-full bg-primary/20 border border-primary/40 animate-ping absolute" />
                                     <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center relative">
                                        <ShieldCheck className="w-8 h-8 text-white" />
                                     </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Background blobs */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/10 rounded-full blur-[120px] -z-10" />
                        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-[80px] -z-10" />
                    </div>
                </div>
            </div>
        </section>
    );
}
