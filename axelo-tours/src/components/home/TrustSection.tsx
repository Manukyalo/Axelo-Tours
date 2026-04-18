"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { 
    ShieldCheck, 
    Zap, 
    Smartphone, 
    MessageSquare, 
    Map, 
    FileText,
    Users,
    Globe,
    Calendar
} from "lucide-react";

const trustItems = [
  {
    icon: ShieldCheck,
    title: "Licensed & Insured",
    description: "Fully registered and compliant with all East African tourism regulations."
  },
  {
    icon: Zap,
    title: "Real-Time Booking",
    description: "Instant confirmation for all standard safari packages and day trips."
  },
  {
    icon: Smartphone,
    title: "M-Pesa Payments",
    description: "Seamless mobile money integration for fast and secure transactions."
  },
  {
    icon: MessageSquare,
    title: "24/7 AI Support",
    description: "Our AI assistant Zara is always online to help with your itinerary."
  },
  {
    icon: Map,
    title: "Expert Local Guides",
    description: "Vetted professional guides with years of experience in the wild."
  },
  {
    icon: FileText,
    title: "Paperless & Digital",
    description: "Get all your vouchers and maps directly on your smartphone via our app."
  }
];

const stats = [
    { label: "Successful Bookings", value: 1200, suffix: "+", icon: Users },
    { label: "Parks Covered", value: 15, suffix: "", icon: Globe },
    { label: "Years Experience", value: 8, suffix: "+", icon: Calendar },
];

function CountUp({ value, suffix }: { value: number; suffix: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (isInView) {
            let start = 0;
            const duration = 2000;
            const increment = value / (duration / 16);
            const timer = setInterval(() => {
                start += increment;
                if (start >= value) {
                    setCount(value);
                    clearInterval(timer);
                } else {
                    setCount(Math.floor(start));
                }
            }, 16);
            return () => clearInterval(timer);
        }
    }, [isInView, value]);

    return <span ref={ref}>{count}{suffix}</span>;
}

export function TrustSection() {
  return (
    <section className="py-32 bg-brand-dark text-white overflow-hidden">
        <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-20">
                <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">Built on <span className="text-accent italic">Trust & Innovation</span></h2>
                <p className="text-gray-400 text-lg font-medium">
                    We combine years of local expertise with cutting-edge digital infrastructure to provide a safari experience that is both safe and effortless.
                </p>
            </div>

            {/* Trust Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32">
                {trustItems.map((item, index) => (
                    <motion.div
                        key={item.title}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                    >
                        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <item.icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                        <p className="text-gray-400 font-medium leading-relaxed">{item.description}</p>
                    </motion.div>
                ))}
            </div>

            {/* Animated Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-12 border-t border-white/5">
                {stats.map((stat, i) => (
                    <div key={i} className="flex items-center space-x-6">
                        <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                            <stat.icon className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-white mb-1">
                                <CountUp value={stat.value} suffix={stat.suffix} />
                            </div>
                            <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                                {stat.label}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
  );
}
