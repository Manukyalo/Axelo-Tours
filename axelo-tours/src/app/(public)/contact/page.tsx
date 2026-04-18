"use client";

import { motion } from "framer-motion";
import { 
    Mail, 
    MessageSquare, 
    Phone, 
    MapPin, 
    Send, 
    Sparkles, 
    Headphones,
    Clock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  return (
    <main className="min-h-screen pt-40 pb-32 bg-[#FAFAF7]">
        <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row gap-20">
                {/* Left Side: Contact Info */}
                <div className="flex-1 max-w-xl">
                    <div className="flex items-center space-x-2 text-primary font-bold tracking-widest uppercase text-xs mb-6">
                        <Sparkles className="w-4 h-4" />
                        <span>Get In Touch</span>
                    </div>
                    <h1 className="font-display text-5xl md:text-6xl font-bold text-foreground mb-8 leading-tight">
                        We're Here for the <span className="text-primary italic">Journey</span>.
                    </h1>
                    <p className="text-muted-foreground text-lg font-medium leading-relaxed mb-12">
                        Have questions about park fees, custom itineraries, or seasonal migrations? Our team and AI agents are available 24/7.
                    </p>

                    <div className="space-y-8 mb-16">
                        <div className="flex items-start space-x-6 p-6 rounded-3xl bg-white border border-border/40 shadow-sm">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <Mail className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg mb-1">Email Support</h4>
                                <p className="text-muted-foreground text-sm font-medium">concierge@axelo-tours.com</p>
                                <p className="text-xs text-primary font-bold mt-2 uppercase tracking-widest">Average reply: 2 hours</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-6 p-6 rounded-3xl bg-white border border-border/40 shadow-sm">
                            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600 shrink-0">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg mb-1">WhatsApp Business</h4>
                                <p className="text-muted-foreground text-sm font-medium">+254 700 000 000</p>
                                <p className="text-xs text-green-600 font-bold mt-2 uppercase tracking-widest">Instant Messaging</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-6 p-6 rounded-3xl bg-white border border-border/40 shadow-sm">
                            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg mb-1">HQ Location</h4>
                                <p className="text-muted-foreground text-sm font-medium">Level 4, Greenhouse Mall, Ngong Rd, Nairobi, Kenya</p>
                            </div>
                        </div>
                    </div>

                    {/* AI Voice Teaser */}
                    <div className="p-8 rounded-[2.5rem] bg-brand-dark text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />
                        <div className="relative z-10">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                                    <Headphones className="w-5 h-5 text-white" />
                                </div>
                                <span className="font-bold text-sm uppercase tracking-widest text-accent">Zara Voice Support</span>
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Want to talk instead?</h3>
                            <p className="text-gray-400 text-sm font-medium mb-6">
                                Call our AI Assistant Zara for instant answers about park availability and booking costs.
                            </p>
                            <Button className="bg-white text-brand-dark hover:bg-white/90 font-bold rounded-xl space-x-2">
                                <Phone className="w-4 h-4" />
                                <span>Start AI Call</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right Side: Contact Form */}
                <div className="flex-1">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white p-10 md:p-12 rounded-[3rem] border border-border/40 shadow-2xl shadow-primary/5"
                    >
                        <h2 className="text-3xl font-bold mb-8">Send a Message</h2>
                        <form className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Full Name</label>
                                    <Input placeholder="John Doe" className="h-14 rounded-2xl bg-gray-50 border-none px-6" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Address</label>
                                    <Input placeholder="john@example.com" className="h-14 rounded-2xl bg-gray-50 border-none px-6" />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Subject</label>
                                <Input placeholder="Custom Safari Inquiry" className="h-14 rounded-2xl bg-gray-50 border-none px-6" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Message</label>
                                <textarea 
                                    className="w-full min-h-[200px] rounded-[2rem] bg-gray-50 border-none p-6 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="Tell us about your plans..."
                                />
                            </div>

                            <Button className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold text-lg group">
                                <span>Send Quest Inquiry</span>
                                <Send className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    </main>
  );
}
