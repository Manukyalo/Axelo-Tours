'use client';

import { useState } from 'react';
import { Loader2, CheckCircle } from 'lucide-react';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'Footer Newsletter' }),
      });

      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-400">
        <CheckCircle className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium">Welcome! Check your inbox for the safari guide.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex">
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your Email" 
          required
          className="bg-white/5 border border-white/10 rounded-l-lg px-4 py-3 outline-none focus:border-accent flex-grow transition-colors duration-300 text-white"
        />
        <button 
          type="submit"
          disabled={status === 'loading'}
          className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-r-lg px-6 font-bold transition-all duration-300 flex items-center justify-center min-w-[70px]"
        >
          {status === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Go'}
        </button>
      </div>
      {status === 'error' && (
        <p className="text-xs text-red-400 font-medium">Something went wrong. Please try again.</p>
      )}
    </form>
  );
}
