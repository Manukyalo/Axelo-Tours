"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  Calendar, 
  CreditCard, 
  Package as PackageIcon, 
  Users, 
  Save, 
  Loader2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ClientSearchSelect } from "@/components/bookings/ClientSearchSelect";
import { SafariPackage, Client } from "@/types";
import { addDays, format } from "date-fns";
import { toast } from "react-hot-toast";

export default function NewBookingPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<SafariPackage[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  const [formData, setFormData] = useState({
    package_id: "",
    travel_date: format(addDays(new Date(), 30), "yyyy-MM-dd"),
    num_adults: 2,
    num_children: 0,
    total_amount: 0,
    currency: "USD" as "USD" | "KES",
    status: "pending" as const,
    payment_status: "unpaid" as const,
    special_requests: "",
  });

  useEffect(() => {
    async function fetchPackages() {
      const { data } = await supabase.from("packages").select("*").eq("available", true);
      setPackages((data as SafariPackage[]) || []);
    }
    fetchPackages();
  }, [supabase]);

  // Update total amount and return date when package changes
  useEffect(() => {
    if (formData.package_id) {
      const pkg = packages.find(p => p.id === formData.package_id);
      if (pkg) {
        setFormData(prev => ({
          ...prev,
          total_amount: prev.currency === "USD" ? pkg.price_usd : pkg.price_kes
        }));
      }
    }
  }, [formData.package_id, formData.currency, packages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) {
      toast.error("Please select a client");
      return;
    }
    if (!formData.package_id) {
      toast.error("Please select a package");
      return;
    }

    setLoading(true);
    
    const pkg = packages.find(p => p.id === formData.package_id);
    const returnDate = pkg 
      ? format(addDays(new Date(formData.travel_date), pkg.duration_days), "yyyy-MM-dd")
      : formData.travel_date;

    const { error } = await supabase.from("bookings").insert({
      client_id: selectedClient.id,
      package_id: formData.package_id,
      travel_date: formData.travel_date,
      return_date: returnDate,
      num_adults: formData.num_adults,
      num_children: formData.num_children,
      total_amount: formData.total_amount,
      currency: formData.currency,
      status: formData.status,
      payment_status: formData.payment_status,
      special_requests: formData.special_requests,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success("Booking created successfully!");
      router.push("/bookings");
      router.refresh();
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Breadcrumbs / Back */}
      <div className="flex items-center gap-4">
        <Link href="/bookings">
          <Button variant="ghost" size="sm" className="rounded-xl gap-1">
            <ChevronLeft className="w-4 h-4" /> Back to Bookings
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Create New Booking</h1>
          <p className="text-gray-500 mt-1">Register a new safari experience for a client.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Section 1: Client Selection */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
              <Users className="w-4 h-4" />
              <span>Client Selection</span>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Select Client</label>
              <ClientSearchSelect 
                selectedId={selectedClient?.id} 
                onSelect={setSelectedClient} 
              />
              {selectedClient && (
                <div className="mt-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{selectedClient.full_name}</p>
                    <p className="text-xs text-gray-400">{selectedClient.email}</p>
                  </div>
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedClient(null)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    Change
                  </Button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Section 2: Trip Details */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
              <PackageIcon className="w-4 h-4" />
              <span>Trip Details</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Safari Package</label>
                <select 
                  className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none pointer-events-auto"
                  value={formData.package_id}
                  onChange={(e) => setFormData(f => ({ ...f, package_id: e.target.value }))}
                  required
                >
                  <option value="">Select a package...</option>
                  {packages.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} ({pkg.duration_days} Days) — {pkg.destination}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Travel Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input 
                      type="date"
                      className="w-full h-10 pl-10 pr-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={formData.travel_date}
                      onChange={(e) => setFormData(f => ({ ...f, travel_date: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Currency</label>
                  <select 
                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={formData.currency}
                    onChange={(e) => setFormData(f => ({ ...f, currency: e.target.value as "USD" | "KES" }))}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="KES">KES (Sh)</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Section 3: Financials */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
              <CreditCard className="w-4 h-4" />
              <span>Financials</span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Adults</label>
                  <input 
                    type="number"
                    min="1"
                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={formData.num_adults}
                    onChange={(e) => setFormData(f => ({ ...f, num_adults: parseInt(e.target.value) }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Children</label>
                  <input 
                    type="number"
                    min="0"
                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={formData.num_children}
                    onChange={(e) => setFormData(f => ({ ...f, num_children: parseInt(e.target.value) }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Total Amount ({formData.currency})</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                    {formData.currency === "USD" ? "$" : "Sh"}
                  </span>
                  <input 
                    type="number"
                    className="w-full h-10 pl-10 pr-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={formData.total_amount}
                    onChange={(e) => setFormData(f => ({ ...f, total_amount: parseFloat(e.target.value) }))}
                    required
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Section 4: Status & Notes */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
              <AlertCircle className="w-4 h-4" />
              <span>Status & Notes</span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Status</label>
                  <select 
                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={formData.status}
                    onChange={(e) => setFormData(f => ({ ...f, status: e.target.value as any }))}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Payment</label>
                  <select 
                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={formData.payment_status}
                    onChange={(e) => setFormData(f => ({ ...f, payment_status: e.target.value as any }))}
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Special Requests</label>
                <textarea 
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  value={formData.special_requests}
                  onChange={(e) => setFormData(f => ({ ...f, special_requests: e.target.value }))}
                  placeholder="Any dietary restrictions or preferences..."
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
          <Link href="/bookings">
            <Button variant="ghost" type="button" className="rounded-xl px-6">Cancel</Button>
          </Link>
          <Button 
            type="submit" 
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-white rounded-xl px-8 py-6 h-auto text-base font-bold shadow-xl shadow-primary/20 gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Booking
          </Button>
        </div>
      </form>
    </div>
  );
}
