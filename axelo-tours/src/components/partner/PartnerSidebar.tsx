'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Package, FileText, BookOpen,
  Ship, Receipt, Code2, LogOut, ChevronRight, Sparkles
} from 'lucide-react';

interface Partner {
  id: string;
  company_name: string;
  tier: string;
  status: string;
  net_rate_discount_pct: number;
  api_key: string | null;
  company_type: string;
}

const NAV_ITEMS = [
  { href: '/partner', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/partner/catalog', label: 'Package Catalog', icon: Package },
  { href: '/partner/quote-builder', label: 'Build a Quote', icon: Sparkles, highlight: true },
  { href: '/partner/quotes', label: 'My Quotes', icon: FileText },
  { href: '/partner/shore-excursions', label: 'Shore Excursions', icon: Ship },
  { href: '/partner/invoices', label: 'Invoices', icon: Receipt },
  { href: '/partner/api-docs', label: 'API Docs', icon: Code2 },
];

const TIER_STYLES: Record<string, string> = {
  standard: 'bg-gray-600/20 text-gray-300 border-gray-500/30',
  silver: 'bg-slate-500/20 text-slate-300 border-slate-400/30',
  gold: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
  platinum: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
};

export default function PartnerSidebar({ partner, userEmail }: { partner: Partner; userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/partner/login');
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href) && href !== '/partner';
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-[#0d150d] border-r border-white/[0.06] flex flex-col z-40">
      {/* Brand */}
      <div className="px-5 pt-6 pb-5 border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">
            A
          </div>
          <div>
            <div className="font-display font-bold text-white text-sm leading-none">AXELO</div>
            <div className="text-[10px] text-gray-500 tracking-widest uppercase">Partner Portal</div>
          </div>
        </Link>

        {/* Partner info */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3.5">
          <div className="text-white font-semibold text-sm truncate mb-1">{partner.company_name}</div>
          <div className="text-gray-500 text-xs truncate mb-2.5">{userEmail}</div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${TIER_STYLES[partner.tier] || TIER_STYLES.standard}`}>
              {partner.tier}
            </span>
            <span className="text-[10px] text-gray-500">{partner.net_rate_discount_pct}% net rate</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const active = item.exact
            ? pathname === item.href
            : isActive(item.href, item.exact);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                active
                  ? 'bg-primary/20 text-primary border border-primary/20'
                  : item.highlight
                  ? 'text-accent hover:bg-accent/10 hover:text-accent border border-transparent'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.05] border border-transparent'
              }`}
            >
              <item.icon className={`w-4 h-4 shrink-0 ${active ? 'text-primary' : ''}`} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 text-primary/60" />}
              {item.highlight && !active && (
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-5 pt-2 border-t border-white/[0.06]">
        <Link
          href="/partner/api-docs"
          className="flex items-center gap-2 px-3 py-2.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          <Code2 className="w-3.5 h-3.5" />
          API Documentation
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/[0.05] transition-all duration-200"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
