'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const errorParam = searchParams.get('error');
  const ERROR_MESSAGES: Record<string, string> = {
    not_registered: 'No partner account found for this email. Please apply at /partners.',
    pending_approval: 'Your application is pending review. We\'ll email you within 1–2 business days.',
    rejected: 'Your partner application was not approved. Contact partnerships@axelotours.co.ke.',
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message === 'Invalid login credentials'
        ? 'Incorrect email or password. Please try again.'
        : authError.message);
      setLoading(false);
      return;
    }

    // Force full reload to reset Next.js client-side router cache
    window.location.href = '/partner';
  };

  const handleResetPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your business email first to reset your password.');
      return;
    }

    setResetLoading(true);
    setError('');
    setSuccessMsg('');

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/partner/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setSuccessMsg('Password reset link sent to your email.');
    }
    setResetLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#080d08] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 justify-center mb-10">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-lg">
            A
          </div>
          <div>
            <div className="font-display font-bold text-white text-lg leading-none">AXELO TOURS</div>
            <div className="text-[10px] text-gray-500 tracking-widest uppercase">Partner Portal</div>
          </div>
        </Link>

        {/* Card */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-8">
          <h1 className="font-display text-2xl font-bold text-white mb-1">Partner Sign In</h1>
          <p className="text-gray-400 text-sm mb-7">Access your exclusive rates, quotes, and bookings.</p>

          {/* URL error param */}
          {errorParam && ERROR_MESSAGES[errorParam] && (
            <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-400/20 rounded-xl p-4 mb-5 text-sm text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {ERROR_MESSAGES[errorParam]}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Business Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@yourcompany.com"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-400/20 rounded-xl px-4 py-3 text-sm text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            
            {successMsg && (
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-400/20 rounded-xl px-4 py-3 text-sm text-green-300">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || resetLoading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl transition-all duration-300 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Signing in…</>
              ) : (
                <>Sign In <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/[0.06] text-center space-y-4">
            <p className="text-sm text-gray-500">
              Not a partner yet?{' '}
              <a href="/partners#apply" className="text-primary hover:underline font-semibold">Apply here →</a>
            </p>
            <p className="text-xs text-gray-600 flex items-center justify-center gap-1">
              Forgot your password?{' '}
              <button 
                onClick={handleResetPassword}
                disabled={resetLoading}
                className="hover:text-primary transition-colors disabled:opacity-50"
              >
                {resetLoading ? 'Sending...' : 'Reset it here'}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          © {new Date().getFullYear()} Axelo Tours & Safari Ltd · Secure Partner Access
        </p>
      </div>
    </div>
  );
}

export default function PartnerLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080d08] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
