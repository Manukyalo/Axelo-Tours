"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Search, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { createClient } from "@/lib/supabase/client";
import { Client } from "@/types";

interface ClientSearchSelectProps {
  onSelect: (client: Client) => void;
  selectedId?: string;
}

export function ClientSearchSelect({ onSelect, selectedId }: ClientSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchClients() {
      setLoading(true);
      const { data } = await supabase
        .from("clients")
        .select("*")
        .ilike("full_name", `%${search}%`)
        .limit(10);
      
      setClients((data as Client[]) || []);
      setLoading(false);
    }

    const timer = setTimeout(() => {
      fetchClients();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, supabase]);

  const selectedClient = clients.find((client) => client.id === selectedId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "flex w-full items-center justify-between rounded-xl h-10 border border-gray-200 bg-white px-3 text-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20",
          !selectedId && "text-gray-400"
        )}
      >
        {selectedId ? (
          <span className="text-gray-900 font-medium truncate">
            {selectedClient?.full_name || "Client Selected"}
          </span>
        ) : (
          <span>Select or search client...</span>
        )}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl shadow-2xl border-gray-100 overflow-hidden">
        <div className="p-3 border-b border-gray-100 bg-gray-50/50">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-1">
          {loading && (
            <div className="p-4 text-center text-xs text-gray-400">Searching...</div>
          )}
          {!loading && clients.length === 0 && (
            <div className="p-4 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
              No clients found.
              <Button variant="ghost" size="sm" className="h-8 text-primary font-bold">
                <UserPlus className="w-3.5 h-3.5 mr-1" /> Add New Client
              </Button>
            </div>
          )}
          {clients.map((client) => (
            <button
              key={client.id}
              onClick={() => {
                onSelect(client);
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors",
                selectedId === client.id ? "bg-primary/5 text-primary font-bold" : "text-gray-700 hover:bg-gray-50"
              )}
            >
              <div className="text-left">
                <p className={cn("font-medium", selectedId === client.id ? "text-primary" : "text-gray-900")}>
                  {client.full_name}
                </p>
                <p className="text-[10px] text-gray-400">{client.email || client.phone || "No contact info"}</p>
              </div>
              {selectedId === client.id && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
