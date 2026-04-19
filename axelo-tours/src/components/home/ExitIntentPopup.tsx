"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

export function ExitIntentPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    // Check if we've already shown it this session
    const hasSeenPopup = sessionStorage.getItem("axelo_exit_intent_seen");
    if (hasSeenPopup) return;

    let timeoutId: NodeJS.Timeout;

    const handleMouseLeave = (e: MouseEvent) => {
      // If cursor leaves strictly above upper boundary (user going to tab/address bar)
      if (e.clientY < 10) {
        triggerPopup();
      }
    };

    const triggerPopup = () => {
      setIsVisible(true);
      sessionStorage.setItem("axelo_exit_intent_seen", "true");
      document.removeEventListener("mouseleave", handleMouseLeave);
      clearTimeout(timeoutId);
    };

    // Trigger on exit intent
    document.addEventListener("mouseleave", handleMouseLeave);

    // Or trigger after 30 seconds of browsing as a fallback
    timeoutId = setTimeout(() => {
      triggerPopup();
    }, 30000);

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      clearTimeout(timeoutId);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === "loading") return;

    setStatus("loading");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "Exit Intent" })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setStatus("success");
      setTimeout(() => setIsVisible(false), 3000);
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="bg-white rounded-[2rem] w-full max-w-4xl flex flex-col md:flex-row overflow-hidden shadow-2xl border border-white"
        >
          {/* Visual Side */}
          <div className="md:w-5/12 bg-gray-900 relative p-8 flex flex-col justify-end text-white overflow-hidden min-h-[200px] md:min-h-[auto]">
            {/* Background image placeholder */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent z-10" />
            <div className="absolute inset-0 bg-primary/20 mix-blend-multiply z-10" />
            
            <div className="relative z-20 mt-auto">
              <h3 className="font-display font-black text-3xl mb-2">Wait before you go!</h3>
              <p className="text-white/80 text-sm">Don't leave without our exclusive insights.</p>
            </div>
          </div>

          {/* Content Side */}
          <div className="md:w-7/12 p-8 md:p-12 relative bg-white">
            <button 
                onClick={() => setIsVisible(false)}
                className="absolute top-6 right-6 w-10 h-10 bg-gray-50 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="max-w-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                    <Mail className="w-6 h-6 text-primary" />
                </div>
                
                <h2 className="text-3xl font-display font-black text-gray-900 mb-4 leading-tight">
                    Get Our <span className="text-primary italic">Free</span> Kenya Safari Planning Guide
                </h2>
                
                <p className="text-gray-600 mb-8 leading-relaxed">
                    Join 15,000+ travelers. Get expert packing lists, seasonal insights, and un-published luxury lodge discounts directly in your inbox.
                </p>

                {status === "success" ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-50 border border-green-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3"
                    >
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                        <div>
                            <p className="font-bold text-green-900">Guide sent to your email!</p>
                            <p className="text-sm text-green-700">Check your inbox for the PDF download.</p>
                        </div>
                    </motion.div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <input 
                                type="email" 
                                required
                                placeholder="Enter your email address"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-gray-900 font-medium placeholder-gray-400"
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={status === "loading" || !email}
                            className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-bold h-14 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
                        >
                            {status === "loading" ? "Sending..." : "Send Me The Guide"}
                            <ArrowRight className="w-5 h-5" />
                        </button>
                        {status === "error" && (
                            <p className="text-red-500 text-sm font-medium text-center">Something went wrong. Please try again.</p>
                        )}
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-4">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            We respect your privacy. No spam.
                        </div>
                    </form>
                )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
