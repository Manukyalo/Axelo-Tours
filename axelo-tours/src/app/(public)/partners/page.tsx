'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  Globe, Users, TrendingUp, Headphones, CheckCircle, ArrowRight,
  Building2, Plane, Ship, ShoppingBag, ChevronDown, Star, Zap, Lock
} from 'lucide-react';

const PARTNER_BENEFITS = [
  {
    icon: TrendingUp,
    title: 'Live Net Rates',
    description: 'Access real-time discounted rates exclusive to verified partners — no negotiating every trip.',
    color: 'from-emerald-500 to-green-600',
  },
  {
    icon: Globe,
    title: 'Live Availability',
    description: 'Check availability across all Axelo packages in real-time via our portal or REST API.',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    icon: Zap,
    title: 'Instant Group Quotes',
    description: 'Build multi-day group itineraries and generate branded PDF quotes in under 5 minutes.',
    color: 'from-amber-500 to-orange-600',
  },
  {
    icon: Headphones,
    title: 'Dedicated Account Manager',
    description: 'Your personal Axelo point-of-contact — available via WhatsApp, email, or video call.',
    color: 'from-purple-500 to-pink-600',
  },
  {
    icon: Lock,
    title: 'REST API Access',
    description: 'Integrate Axelo directly into your own booking system with our documented REST API.',
    color: 'from-rose-500 to-red-600',
  },
  {
    icon: Star,
    title: 'Tiered Rewards',
    description: 'Earn higher discounts as your booking volume grows — Standard, Silver, Gold, Platinum.',
    color: 'from-yellow-500 to-amber-600',
  },
];

const PARTNER_TYPES = [
  { value: 'travel_agency', label: 'Travel Agency', icon: Building2 },
  { value: 'cruise_line', label: 'Cruise Line', icon: Ship },
  { value: 'charter_airline', label: 'Charter Airline', icon: Plane },
  { value: 'wholesaler', label: 'Tour Wholesaler', icon: ShoppingBag },
  { value: 'ota', label: 'Online Travel Agency (OTA)', icon: Globe },
];

const STATS = [
  { value: '140+', label: 'Active Partners' },
  { value: '38', label: 'Countries Represented' },
  { value: '$2.4M+', label: 'Group Revenue Processed' },
  { value: '4.9★', label: 'Partner Satisfaction' },
];

type FormData = {
  company_name: string;
  company_type: string;
  country: string;
  annual_pax: string;
  contact_name: string;
  contact_email: string;
  phone: string;
  website: string;
};

export default function PartnersPage() {
  const supabase = createClient();
  const [formData, setFormData] = useState<FormData>({
    company_name: '',
    company_type: '',
    country: '',
    annual_pax: '',
    contact_name: '',
    contact_email: '',
    phone: '',
    website: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const required: (keyof FormData)[] = ['company_name', 'company_type', 'country', 'contact_name', 'contact_email'];
    const missing = required.filter(f => !formData[f]);
    if (missing.length) {
      setError(`Please fill in: ${missing.map(f => f.replace('_', ' ')).join(', ')}`);
      setIsSubmitting(false);
      return;
    }

    const { error: dbError } = await supabase.from('partners').insert({
      company_name: formData.company_name,
      company_type: formData.company_type,
      country: formData.country,
      annual_pax: formData.annual_pax ? parseInt(formData.annual_pax) : null,
      contact_name: formData.contact_name,
      contact_email: formData.contact_email,
      phone: formData.phone || null,
      website: formData.website || null,
      status: 'pending',
    });

    setIsSubmitting(false);

    if (dbError) {
      if (dbError.message.includes('duplicate') || dbError.message.includes('unique')) {
        setError('An application from this email already exists. Please contact partnerships@axelotours.co.ke.');
      } else {
        setError('Something went wrong. Please try again or email partnerships@axelotours.co.ke');
      }
      return;
    }

    setSubmitted(true);
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterStatus('loading');

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newsletterEmail,
          source: 'Partner Newsletter'
        }),
      });

      if (res.ok) {
        setNewsletterStatus('success');
        setNewsletterEmail('');
      } else {
        setNewsletterStatus('error');
      }
    } catch (err) {
      setNewsletterStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative bg-brand-dark text-white overflow-hidden">
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(200,150,46,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(200,150,46,0.4) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        <div className="relative container mx-auto px-6 py-32 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-4 py-1.5 text-accent text-sm font-semibold mb-8">
            <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            B2B Partner Programme — Now Open
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold leading-none mb-6">
            Sell Africa Differently.<br />
            <span className="text-accent">Earn More.</span>
          </h1>

          <p className="text-xl text-gray-300 leading-relaxed mb-10 max-w-2xl mx-auto">
            Join 140+ travel agencies, cruise lines, and wholesalers accessing Axelo&apos;s exclusive net rates,
            live availability, and group quote tools — all from one portal.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#apply"
              className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-white font-bold px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-accent/25 hover:-translate-y-0.5 active:scale-95"
            >
              Apply for Partnership <ArrowRight className="w-5 h-5" />
            </a>
            <Link
              href="/partner/login"
              className="inline-flex items-center justify-center gap-2 border border-white/20 hover:border-white/40 text-white font-bold px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl transition-all duration-300 hover:bg-white/5 active:scale-95"
            >
              Partner Login
            </Link>
          </div>
        </div>

        {/* Stats banner */}
        <div className="relative border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {STATS.map(stat => (
                <div key={stat.label}>
                  <div className="text-3xl font-display font-bold text-accent mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Benefits ─────────────────────────────────────────────────────── */}
      <section className="py-28 bg-muted/30">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold mb-4">Everything you need to sell East Africa</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Purpose-built tools for serious travel businesses — not afterthoughts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PARTNER_BENEFITS.map(benefit => (
              <div
                key={benefit.title}
                className="group bg-card border border-border rounded-2xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${benefit.color} flex items-center justify-center mb-5`}>
                  <benefit.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-display text-xl font-bold mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Partner Tiers ────────────────────────────────────────────────── */}
      <section className="py-28">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold mb-4">Partner Tiers & Net Rates</h2>
            <p className="text-muted-foreground text-lg">The more you book, the better your rates.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {[
              { tier: 'Standard', pax: '0–99 pax/yr', discount: '10%', color: 'border-gray-200 bg-card' },
              { tier: 'Silver', pax: '100–299 pax/yr', discount: '15%', color: 'border-slate-300 bg-slate-50 dark:bg-slate-900' },
              { tier: 'Gold', pax: '300–599 pax/yr', discount: '20%', color: 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20' },
              { tier: 'Platinum', pax: '600+ pax/yr', discount: '25%+', color: 'border-purple-300 bg-purple-50 dark:bg-purple-900/20', featured: true },
            ].map(t => (
              <div
                key={t.tier}
                className={`rounded-2xl border-2 p-6 text-center relative ${t.color} ${t.featured ? 'ring-2 ring-purple-400 shadow-lg shadow-purple-100 dark:shadow-purple-900/30' : ''}`}
              >
                {t.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    BEST RATES
                  </div>
                )}
                <div className="font-display text-xl font-bold mb-2">{t.tier}</div>
                <div className="text-sm text-muted-foreground mb-4">{t.pax}</div>
                <div className="text-3xl font-display font-bold text-primary">{t.discount}</div>
                <div className="text-sm text-muted-foreground mt-1">net rate discount</div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            * Cruise line and charter airline partners receive custom rates. Discuss with your account manager.
          </p>
        </div>
      </section>

      {/* ─── Application Form ─────────────────────────────────────────────── */}
      <section id="apply" className="py-28 bg-muted/30">
        <div className="container mx-auto px-6 max-w-2xl">
          {submitted ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
              <h2 className="font-display text-3xl font-bold mb-4">Application Received!</h2>
              <p className="text-muted-foreground text-lg mb-6">
                Thank you for applying to the Axelo Partner Programme. Our partnerships team will review your
                application and reach out to <strong>{formData.contact_email}</strong> within 1–2 business days.
              </p>
              <p className="text-sm text-muted-foreground">
                Questions? Email{' '}
                <a href="mailto:partnerships@axelotours.co.ke" className="text-primary hover:underline">
                  partnerships@axelotours.co.ke
                </a>
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-12">
                <h2 className="font-display text-4xl font-bold mb-4">Apply for Partnership</h2>
                <p className="text-muted-foreground text-lg">
                  Takes 2 minutes. Your dedicated account manager will reach out within 24 hours.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="bg-card border border-border rounded-3xl p-8 md:p-10 shadow-sm space-y-6">
                {/* Company Info */}
                <div>
                  <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                    Company Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Company Name *</label>
                      <input
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleChange}
                        placeholder="Acme Travel Ltd"
                        className="w-full border border-border bg-background rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Company Type *</label>
                      <div className="relative">
                        <select
                          name="company_type"
                          value={formData.company_type}
                          onChange={handleChange}
                          className="w-full border border-border bg-background rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none cursor-pointer"
                          required
                        >
                          <option value="">Select type…</option>
                          {PARTNER_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Country / Region *</label>
                      <input
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        placeholder="United Kingdom"
                        className="w-full border border-border bg-background rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Annual Pax Volume</label>
                      <input
                        name="annual_pax"
                        type="number"
                        min="1"
                        value={formData.annual_pax}
                        onChange={handleChange}
                        placeholder="e.g. 250"
                        className="w-full border border-border bg-background rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold mb-2">Website</label>
                      <input
                        name="website"
                        type="url"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="https://acmetravel.com"
                        className="w-full border border-border bg-background rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                    Contact Details
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Your Name *</label>
                      <input
                        name="contact_name"
                        value={formData.contact_name}
                        onChange={handleChange}
                        placeholder="Sarah Johnson"
                        className="w-full border border-border bg-background rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Business Email *</label>
                      <input
                        name="contact_email"
                        type="email"
                        value={formData.contact_email}
                        onChange={handleChange}
                        placeholder="sarah@acmetravel.com"
                        className="w-full border border-border bg-background rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold mb-2">WhatsApp / Phone</label>
                      <input
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+44 7700 900000"
                        className="w-full border border-border bg-background rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      Submit Application <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <p className="text-xs text-muted-foreground text-center">
                  By submitting you agree to Axelo&apos;s Partner Terms. We&apos;ll never share your details with third parties.
                </p>
              </form>
            </>
          )}
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-center mb-12">Common Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'How long does approval take?',
                a: 'Typically 1–2 business days. We verify each application manually to maintain quality.',
              },
              {
                q: 'Can I access the API before approval?',
                a: 'No, API keys are generated upon approval. However, you can explore the API documentation without a key.',
              },
              {
                q: 'Do you support cruise line shore excursions?',
                a: 'Yes — cruise line partners get access to our dedicated Shore Excursions module with Mombasa and Zanzibar packages with per-pax pricing.',
              },
              {
                q: 'What commission structures are available?',
                a: 'Partners receive net rates (not commissions). You set your own selling price and keep the margin. Details vary by tier.',
              },
            ].map(faq => (
              <details key={faq.q} className="group bg-card border border-border rounded-2xl overflow-hidden">
                <summary className="flex items-center justify-between px-6 py-5 cursor-pointer font-semibold list-none">
                  {faq.q}
                  <ChevronDown className="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform duration-300" />
                </summary>
                <div className="px-6 pb-5 text-muted-foreground leading-relaxed">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Newsletter / Nexus ────────────────────────────────────────────── */}
      <section className="py-24 bg-brand-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#e5a93e,transparent_50%)]" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-display text-3xl font-bold text-white mb-4">Stay in the Loop</h2>
                <p className="text-gray-300 leading-relaxed mb-0">
                  Not ready to apply yet? Join <strong>Axelo Nexus</strong>, our monthly newsletter for professional partners featuring:
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'Advance notice of new group tours',
                    'Educational webinar invites',
                    'Kenya & Tanzania travel updates',
                    'B2B tech stack sneak peeks'
                  ].map(item => (
                    <li key={item} className="flex items-center gap-3 text-sm text-gray-400">
                      <CheckCircle className="w-4 h-4 text-accent" /> {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                {newsletterStatus === 'success' ? (
                  <div className="text-center p-6 bg-accent/10 border border-accent/20 rounded-2xl">
                    <CheckCircle className="w-12 h-12 text-accent mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-white mb-2">You&apos;re Subscribed!</h3>
                    <p className="text-gray-400 text-sm">Welcome to Axelo Nexus.</p>
                  </div>
                ) : (
                  <form onSubmit={handleNewsletterSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Business Email</label>
                      <input
                        type="email"
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        placeholder="you@travelagency.com"
                        className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={newsletterStatus === 'loading'}
                      className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-4 rounded-xl transition-all duration-300 disabled:opacity-50"
                    >
                      {newsletterStatus === 'loading' ? 'Joining...' : 'Join the Nexus'}
                    </button>
                    {newsletterStatus === 'error' && (
                      <p className="text-xs text-red-400 text-center">Something went wrong. Please try again.</p>
                    )}
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-brand-dark/95 text-white border-t border-white/5">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-display text-4xl font-bold mb-4">Ready to start selling East Africa?</h2>
          <p className="text-gray-400 text-lg mb-8">Already a partner?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a href="#apply" className="inline-flex items-center justify-center w-full sm:w-auto gap-2 bg-accent hover:bg-accent/90 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95">
              Apply Now <ArrowRight className="w-5 h-5" />
            </a>
            <Link href="/partner/login" className="inline-flex items-center justify-center w-full sm:w-auto gap-2 border border-white/20 hover:border-white/40 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 active:scale-95">
              <Users className="w-5 h-5" /> Partner Portal Login
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
