"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  CalendarCheck,
  Package,
  Users,
  CreditCard,
  Calculator,
  FileText,
  Globe,
  Phone,
  Mail,
  Handshake,
  BookOpen,
  Building2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard",   href: "/",             icon: LayoutDashboard },
  { label: "Bookings",    href: "/bookings",     icon: CalendarCheck },
  { label: "Packages",    href: "/packages",     icon: Package },
  { label: "Clients",     href: "/clients",      icon: Users },
  { label: "Payments",    href: "/payments",     icon: CreditCard },
  { label: "Costing",     href: "/costing",      icon: Calculator },
  { label: "Vouchers",    href: "/vouchers",     icon: FileText },
  { label: "Market Intel",href: "/intel",        icon: Globe },
  { label: "Calls",       href: "/calls",        icon: Phone },
  { label: "Outreach",    href: "/outreach",     icon: Mail },
  { label: "Partners",    href: "/partners",     icon: Handshake },
  { label: "Properties",  href: "/properties",   icon: Building2 },
  { label: "Blog",        href: "/blog",         icon: BookOpen },
  { label: "Settings",    href: "/settings",     icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 264 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="h-screen bg-brand-dark border-r border-white/8 flex flex-col shrink-0 overflow-hidden shadow-2xl relative z-40"
    >
      {/* Logo Area */}
      <div className={cn(
        "flex items-center h-20 px-6 border-b border-white/8 shrink-0 relative",
        collapsed ? "justify-center" : "justify-between"
      )}>
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center space-x-3"
            >
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20">A</div>
              <div className="flex flex-col">
                <span className="font-display font-black text-white text-lg leading-tight tracking-tight">
                  AXELO <span className="text-accent">ADMIN</span>
                </span>
                <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">Enterprise Portal</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {collapsed && (
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20">A</div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-brand-dark border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-primary/50 transition-all z-50 shadow-xl",
          )}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </div>

      {/* Navigation Space */}
      <nav className="flex-grow py-6 overflow-y-auto custom-scrollbar">
        <div className="px-4 mb-4">
          {!collapsed && <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">Management</p>}
          <ul className="space-y-1.5">
            {NAV_ITEMS.slice(0, 7).map(({ label, href, icon: Icon }) => {
              const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center h-11 rounded-xl px-3.5 transition-all duration-200 group relative",
                      isActive
                        ? "bg-primary text-white shadow-xl shadow-primary/30"
                        : "text-white/40 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {!collapsed && (
                      <span className="ml-3.5 text-sm font-semibold tracking-tight whitespace-nowrap">
                        {label}
                      </span>
                    )}
                    {collapsed && (
                      <div className="absolute left-full ml-4 px-3 py-2 bg-brand-dark border border-white/10 text-white text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap shadow-2xl transition-all translate-x-2 group-hover:translate-x-0 z-50">
                        {label}
                      </div>
                    )}
                    {isActive && !collapsed && (
                      <motion.div layoutId="activeNav" className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="px-4 pt-6 mt-6 border-t border-white/5">
          {!collapsed && <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">Operations</p>}
          <ul className="space-y-1.5">
            {NAV_ITEMS.slice(7).map(({ label, href, icon: Icon }) => {
              const isActive = pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center h-11 rounded-xl px-3.5 transition-all duration-200 group relative",
                      isActive
                        ? "bg-primary text-white shadow-xl shadow-primary/30"
                        : "text-white/40 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {!collapsed && (
                      <span className="ml-3.5 text-sm font-semibold tracking-tight whitespace-nowrap">
                        {label}
                      </span>
                    )}
                    {collapsed && (
                      <div className="absolute left-full ml-4 px-3 py-2 bg-brand-dark border border-white/10 text-white text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap shadow-2xl transition-all translate-x-2 group-hover:translate-x-0 z-50">
                        {label}
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Profile/Logout Section */}
      <div className="p-4 border-t border-white/8 bg-brand-dark/50">
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center h-12 rounded-xl px-3.5 w-full transition-all text-white/30 hover:text-red-400 hover:bg-red-500/10 group",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="w-5 h-5 shrink-0 group-hover:rotate-12 transition-transform" />
          {!collapsed && <span className="ml-3.5 text-sm font-bold">Sign Out</span>}
        </button>
      </div>
    </motion.aside>
  );
}
