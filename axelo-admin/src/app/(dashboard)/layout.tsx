"use client";

import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto h-screen relative">
        {children}
      </main>
    </div>
  );
}
