"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { name: "Safaris", href: "/safaris" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHome = pathname === "/";
  // Always "scrolled" style (dark text) if not on homepage
  const forceDarkText = !isHome || isScrolled;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
        isScrolled
          ? "bg-white/80 backdrop-blur-md py-3 shadow-sm border-b border-border/40"
          : "bg-transparent py-6"
      )}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link 
          href="/" 
          className="flex items-center space-x-2 group"
        >
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl group-hover:scale-110 transition-transform duration-300">
            A
          </div>
          <span className={cn(
            "font-display font-bold text-2xl tracking-tight transition-colors duration-300",
            forceDarkText ? "text-primary" : "text-white"
          )}>
            AXELO <span className="text-accent">TOURS</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-8">
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-all duration-300 hover:text-accent relative group",
                forceDarkText ? "text-foreground" : "text-white"
              )}
            >
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </div>

        {/* CTAs */}
        <div className="hidden md:flex items-center space-x-4">
          <Link
            href={process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL || "#"}
            className={cn(
              "flex items-center space-x-2 text-sm font-medium transition-colors duration-300 hover:text-accent",
              forceDarkText ? "text-foreground" : "text-white"
            )}
          >
            <Smartphone className="w-4 h-4" />
            <span>Download App</span>
          </Link>
          <Link
            href="/safaris"
            className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95"
          >
            Book Now
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={cn(
              "p-2 rounded-lg transition-colors duration-300",
              forceDarkText ? "text-primary hover:bg-primary/10" : "text-white hover:bg-white/10"
            )}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-white border-b border-border shadow-xl md:hidden overflow-hidden"
          >
            <div className="flex flex-col p-6 space-y-4">
              {links.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-medium text-foreground hover:text-primary transition-colors duration-300"
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 flex flex-col space-y-4">
                <Link
                  href={process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL || "#"}
                  className="flex items-center space-x-3 text-foreground font-medium"
                >
                  <Smartphone className="w-5 h-5 text-primary" />
                  <span>Download Our App</span>
                </Link>
                <Link
                  href="/safaris"
                  onClick={() => setMobileMenuOpen(false)}
                  className="bg-primary text-white text-center py-4 rounded-xl font-bold shadow-lg active:scale-95 transition-all"
                >
                  Explore Safaris
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
