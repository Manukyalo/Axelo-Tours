"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  Sparkles,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMagicLink, setIsMagicLink] = useState(false);
  const [mailSent, setMailSent] = useState(false);
  
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isMagicLink) {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/portal`,
          },
        });
        if (error) throw error;
        setMailSent(true);
        toast.success("Magic link sent!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        window.location.href = "/portal";
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-gray-50/50">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden relative z-10"
      >
        <div className="p-10 pt-12">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-display font-bold text-gray-900 mb-3">Client Portal</h1>
            <p className="text-gray-500 font-medium">Access your safari itineraries and documents.</p>
          </div>

          <AnimatePresence mode="wait">
            {mailSent ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
                <p className="text-gray-500 mb-8 max-w-xs mx-auto">
                  We've sent a secure login link to <strong>{email}</strong>. It expires in 10 minutes.
                </p>
                <button 
                  onClick={() => setMailSent(false)}
                  className="text-sm font-bold text-primary hover:underline"
                >
                  Back to login
                </button>
              </motion.div>
            ) : (
              <motion.form 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleAuth}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors group-focus-within:text-primary" />
                    <input 
                      type="email"
                      placeholder="Email Address"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>

                  {!isMagicLink && (
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors group-focus-within:text-primary" />
                      <input 
                        type="password"
                        placeholder="Password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between px-1">
                  <button 
                    type="button"
                    onClick={() => setIsMagicLink(!isMagicLink)}
                    className="text-xs font-bold text-primary flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isMagicLink ? "Use Password Instead" : "Send Magic Link Instead"}
                  </button>
                  {!isMagicLink && (
                    <Link href="#" className="text-xs font-bold text-gray-400 hover:text-gray-600">
                      Forgot Password?
                    </Link>
                  )}
                </div>

                <button 
                  disabled={loading}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>{isMagicLink ? "Send Magic Link" : "Sign In"}</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                  <p className="text-[10px] text-primary/80 font-bold uppercase tracking-wider text-center">
                    First time? Account created when you booked.
                  </p>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
