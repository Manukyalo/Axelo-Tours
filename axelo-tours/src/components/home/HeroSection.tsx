"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronDown, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { AIPortalModal } from "../portal/AIPortalModal";

// Lazy load Three.js canvas
const HeroCanvas = dynamic(() => import("./HeroCanvas"), { 
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-brand-dark animate-pulse" />
});

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  useEffect(() => {
    if (!sectionRef.current || !contentRef.current) return;

    // GSAP Scroll Animations
    gsap.to(contentRef.current, {
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
      y: 100,
      opacity: 0,
      scale: 0.95,
      ease: "none",
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="relative h-screen flex items-center justify-center overflow-hidden bg-brand-dark"
    >
      <HeroCanvas />

      {/* Content Overlay */}
      <div 
        ref={contentRef}
        className="container mx-auto px-6 relative z-10 text-center"
      >
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center"
        >
            <div className="flex items-center space-x-2 mb-6 px-4 py-1.5 rounded-full bg-accent/20 border border-accent/30 text-accent backdrop-blur-sm">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Kenya Premier Safari Experience</span>
            </div>

            <h1 className="font-display text-6xl md:text-8xl lg:text-[10rem] text-white font-bold mb-8 tracking-tighter leading-none">
                The Wild <span className="text-accent italic">Awaits</span>.
            </h1>

            <p className="text-gray-300 text-lg md:text-2xl max-w-2xl mb-12 font-medium leading-relaxed">
                Expertly crafted safaris. Real-time booking. 
                <span className="block text-white/40 mt-1">No office needed. Just pure adventure.</span>
            </p>

            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <Link href="/safaris" className="w-full sm:w-auto">
                    <button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white px-10 py-5 rounded-full font-bold text-lg transition-all duration-300 shadow-xl shadow-primary/20 hover:shadow-primary/40 active:scale-95 group flex items-center justify-center space-x-2">
                        <span>Explore Safaris</span>
                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </button>
                </Link>
                <button 
                    onClick={() => setIsAIModalOpen(true)}
                    className="w-full sm:w-auto border-2 border-white/20 hover:border-accent hover:text-accent text-white px-10 py-5 rounded-full font-bold text-lg transition-all duration-300 backdrop-blur-sm active:scale-95 group flex items-center justify-center space-x-2"
                >
                    <Sparkles className="w-5 h-5" />
                    <span>Plan My Trip with AI</span>
                </button>
            </div>
        </motion.div>
      </div>

      {/* AI Modal */}
      <AIPortalModal 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
      />

      {/* AI Modal */}
      <AIPortalModal 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
      />
    </section>
  );
}
