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

export function Sidebar({ isMobileOpen, onMobileClose }: { isMobileOpen?: boolean; onMobileClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onMobileClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ 
          width: collapsed ? 72 : 256,
          x: typeof window !== "undefined" && window.innerWidth < 1024 
            ? (isMobileOpen ? 0 : -256) 
            : 0 
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          "fixed top-0 left-0 h-full bg-brand-dark border-r border-white/8 flex flex-col z-50 overflow-hidden shadow-2xl transition-transform lg:translate-x-0",
          !isMobileOpen && "-translate-x-full lg:translate-x-0"
        )}
      >
      {/* Logo */}
      <div className={cn(
        "flex items-center h-16 px-4 border-b border-white/8 shrink-0",
        collapsed ? "justify-center" : "justify-between"
      )}>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">A</div>
              <span className="font-display font-bold text-white text-lg tracking-tight">
                AXELO <span className="text-accent">ADMIN</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && (
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">A</div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all",
            collapsed && "absolute -right-3.5 top-5 w-7 h-7 bg-brand-dark border border-white/10 shadow-lg"
          )}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-grow py-4 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-0.5 px-2">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center h-10 rounded-xl px-3 transition-all duration-200 group relative",
                    isActive
                      ? "bg-primary text-white shadow-lg shadow-primary/25"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className="w-4.5 h-4.5 shrink-0" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -5 }}
                        className="ml-3 text-sm font-medium whitespace-nowrap"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {collapsed && (
                    <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap shadow-xl border border-white/10 transition-opacity z-50">
                      {label}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-white/8">
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center h-10 rounded-xl px-3 w-full transition-all text-white/40 hover:text-red-400 hover:bg-red-500/10",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="w-4.5 h-4.5 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="ml-3 text-sm font-medium"
              >
                Log Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
    </>
  );
}
