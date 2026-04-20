"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      <Sidebar isMobileOpen={isMobileOpen} onMobileClose={() => setIsMobileOpen(false)} />
      
      {/* Mobile Header */}
      <div className="lg:hidden bg-brand-dark flex items-center justify-between px-6 py-4 sticky top-0 z-30 shadow-lg">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">A</div>
          <span className="font-display font-bold text-white text-lg tracking-tight">
            AXELO <span className="text-accent underline decoration-primary decoration-4 underline-offset-4">ADMIN</span>
          </span>
        </div>
        <Button 
          variant="ghost" 
          onClick={() => setIsMobileOpen(true)}
          className="text-white hover:bg-white/10"
        >
          <Menu className="w-6 h-6" />
        </Button>
      </div>

      <main className="flex-1 lg:pl-0 min-h-screen transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
