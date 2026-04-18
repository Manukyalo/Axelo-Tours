"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, RefreshCw, ChevronRight, User, Mail, Phone, Globe, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Client, Booking } from "@/types";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/formatters";

const STATUS_BG: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function ClientsPage() {
  const supabase = createClient();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Client | null>(null);
  const [clientBookings, setClientBookings] = useState<(Booking & { packages?: any })[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    async function fetchClients() {
      const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
      setClients((data as Client[]) || []);
      setLoading(false);
    }
    fetchClients();
  }, []);

  const selectClient = useCallback(async (client: Client) => {
    setSelected(client);
    setLoadingBookings(true);
    const { data } = await supabase
      .from("bookings")
      .select("*, packages(name, destination)")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false });
    setClientBookings((data as any[]) || []);
    setLoadingBookings(false);
  }, []);

  const filtered = clients.filter(c =>
    !search ||
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.nationality || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 text-sm">{clients.length} registered clients</p>
        </div>
      </div>

      <div className="flex gap-6 h-[calc(100vh-160px)]">
        {/* Client List */}
        <div className="w-[380px] shrink-0 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, country..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-y-auto flex-grow">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <RefreshCw className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-gray-400 py-12">No clients found.</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {filtered.map(c => (
                  <li key={c.id}>
                    <button onClick={() => selectClient(c)}
                      className={`w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors ${selected?.id === c.id ? "bg-primary/5 border-l-2 border-primary" : ""}`}>
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary font-bold text-sm">{c.full_name.charAt(0)}</span>
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{c.full_name}</p>
                        <p className="text-xs text-gray-400 truncate">{c.email}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Client Detail Panel */}
        <div className="flex-grow bg-white rounded-2xl border border-gray-100 shadow-sm overflow-y-auto">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <User className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">Select a client to view details</p>
            </div>
          ) : (
            <div className="p-8 space-y-8">
              {/* Client Info */}
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold text-2xl">{selected.full_name.charAt(0)}</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selected.full_name}</h2>
                  <p className="text-gray-500 text-sm">Joined {format(new Date(selected.created_at), "dd MMM yyyy")}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {[
                  { icon: Mail, label: "Email", value: selected.email },
                  { icon: Phone, label: "Phone", value: selected.phone || "—" },
                  { icon: Globe, label: "Nationality", value: selected.nationality || "—" },
                  { icon: FileText, label: "Passport", value: selected.passport_no || "—" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">{label}</p>
                      <p className="text-sm font-medium text-gray-900">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Client Bookings */}
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-4">
                  Booking History <span className="text-gray-400 font-normal">({clientBookings.length})</span>
                </h3>
                {loadingBookings ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : clientBookings.length === 0 ? (
                  <p className="text-gray-400 text-sm">No bookings yet.</p>
                ) : (
                  <div className="space-y-3">
                    {clientBookings.map(b => (
                      <div key={b.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
                        <div>
                          <p className="font-semibold text-gray-900">{b.packages?.name ?? "Package"}</p>
                          <p className="text-xs text-gray-400">{format(new Date(b.travel_date), "dd MMM yyyy")} · {b.num_adults + b.num_children} guests</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{formatCurrency(b.total_amount, b.currency)}</p>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${STATUS_BG[b.status]}`}>{b.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
