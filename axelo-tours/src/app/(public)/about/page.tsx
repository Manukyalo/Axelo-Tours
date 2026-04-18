"use client";

import { motion } from "framer-motion";
import { 
    Search, 
    MessageSquare, 
    CreditCard, 
    Compass, 
    Sparkles, 
    Globe, 
    ShieldCheck, 
    Heart,
    ArrowRight
} from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Discovery",
    description: "Browse our curated packages or tell Zara about your dream trip."
  },
  {
    icon: MessageSquare,
    title: "AI Planning",
    description: "Zara builds a custom itinerary including lodges, flights, and park fees."
  },
  {
    icon: CreditCard,
    title: "Secure Booking",
    description: "Pay via Stripe or M-Pesa with instant confirmation and digital vouchers."
  },
  {
    icon: Compass,
    title: "Tailored Adventure",
    description: "Experience the wild with expert local guides and 24/7 digital support."
  }
];

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-40 pb-32">
        {/* Story Section */}
        <section className="container mx-auto px-6 mb-32">
            <div className="flex flex-col lg:flex-row items-center gap-16">
                <div className="flex-1">
                    <div className="flex items-center space-x-2 text-primary font-bold tracking-widest uppercase text-xs mb-6">
                        <Sparkles className="w-4 h-4" />
                        <span>Our Philosophy</span>
                    </div>
                    <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground mb-8 leading-tight">
                        Redefining the <span className="text-primary italic">Wild</span> Experience.
                    </h1>
                    <p className="text-muted-foreground text-xl font-medium leading-relaxed mb-8">
                        Axelo Tours & Safari Ltd. was born from a simple observation: the incredible beauty of East Africa deserved a digital experience just as majestic.
                    </p>
                    <p className="text-muted-foreground text-lg leading-relaxed mb-10">
                        We are a Silicon Valley-inspired travel-tech company based in Kenya. We believe that booking a safari shouldn't feel like a 1990s paperwork marathon. By leveraging AI and seamless payment infrastructure, we make the wild accessible to everyone, from solo backpackers to luxury seekers.
                    </p>

                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <Globe className="w-8 h-8 text-primary mb-4" />
                            <h4 className="font-bold text-lg mb-2">Global Vision</h4>
                            <p className="text-sm text-muted-foreground">Standardizing safari commerce for the international market.</p>
                        </div>
                        <div>
                            <Heart className="w-8 h-8 text-accent mb-4" />
                            <h4 className="font-bold text-lg mb-2">Local Heart</h4>
                            <p className="text-sm text-muted-foreground">Ensuring park fees and local communities benefit directly.</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 w-full max-w-2xl">
                    <div className="relative aspect-square bg-[#F5F5F0] rounded-[3rem] overflow-hidden border border-border/40 p-4">
                        <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden">
                             <img 
                                src="/images/lion.png" 
                                alt="Savanna" 
                                className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-1000"
                             />
                        </div>
                        {/* Status Float */}
                        <motion.div 
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute bottom-12 -left-8 bg-white p-6 rounded-3xl shadow-2xl shadow-primary/10 border border-border/40 flex items-center space-x-4 max-w-[200px]"
                        >
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold leading-tight">Verified KWS Partner</span>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>

        {/* Process Section */}
        <section className="bg-brand-dark py-32 text-white">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto mb-20">
                    <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">How It <span className="text-accent italic">Works</span></h2>
                    <p className="text-gray-400 text-lg font-medium">
                        Four simple steps from your couch to the savanna.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="relative group"
                        >
                            <div className="mb-8 relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-accent group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                    <step.icon className="w-8 h-8" />
                                </div>
                                <div className="absolute top-8 left-16 right-0 h-[2px] bg-white/5 -z-10 group-last:hidden hidden lg:block" />
                            </div>
                            <h3 className="text-xl font-bold mb-4">{step.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed font-medium">
                                {step.description}
                            </p>
                            <div className="mt-6 flex items-center space-x-2 text-primary font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                <span>Learn More</span>
                                <ArrowRight className="w-3 h-3" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    </main>
  );
}
