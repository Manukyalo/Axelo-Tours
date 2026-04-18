"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PackageCard } from "./PackageCard";
import { SafariPackage } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

// Fallback data if Supabase is empty or keys are missing
const MOCK_PACKAGES: SafariPackage[] = [
  {
    id: "1",
    name: "Ultimate Maasai Mara Luxury",
    slug: "ultimate-maasai-mara-luxury",
    destination: "Maasai Mara",
    duration_days: 5,
    price_usd: 3500,
    price_kes: 455000,
    highlights: ["Private Hot Air Balloon", "Big Five Tracking", "Luxury Tented Camp"],
    images: ["/images/lion.png"],
    available: true,
    category: "luxury",
    difficulty: "easy",
    best_season: ["Jan", "Feb", "Jul", "Aug"],
    created_at: new Date().toISOString(),
    group_size_min: 1,
    group_size_max: 6,
    inclusions: [],
    exclusions: [],
  },
  {
    id: "2",
    name: "Tsavo Wilderness Expedition",
    slug: "tsavo-wilderness-expedition",
    destination: "Tsavo",
    duration_days: 4,
    price_usd: 1800,
    price_kes: 234000,
    highlights: ["Leopard Tracking", "Mzima Springs", "Red Elephant Search"],
    images: ["/images/leopard.png"],
    available: true,
    category: "luxury",
    difficulty: "moderate",
    best_season: ["Jun", "Jul", "Dec"],
    created_at: new Date().toISOString(),
    group_size_min: 1,
    group_size_max: 8,
    inclusions: [],
    exclusions: [],
  },
  {
    id: "3",
    name: "Amboseli Elephant Odyssey",
    slug: "amboseli-elephant-odyssey",
    destination: "Amboseli",
    duration_days: 3,
    price_usd: 1200,
    price_kes: 156000,
    highlights: ["Kilimanjaro Views", "Elephant Herds", "Masai Village Visit"],
    images: ["/images/elephants.png"],
    available: true,
    category: "standard",
    difficulty: "easy",
    best_season: ["Jan", "Aug", "Sep"],
    created_at: new Date().toISOString(),
    group_size_min: 2,
    group_size_max: 12,
    inclusions: [],
    exclusions: [],
  },
];

export function FeaturedPackages() {
  const [packages, setPackages] = useState<SafariPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchPackages() {
      try {
        const { data, error } = await supabase
          .from("packages")
          .select("*")
          .eq("available", true)
          .order("price_usd", { ascending: false })
          .limit(3);

        if (error || !data || data.length === 0) {
          console.log("Using mock data for featured packages");
          setPackages(MOCK_PACKAGES);
        } else {
          setPackages(data as SafariPackage[]);
        }
      } catch (err) {
        setPackages(MOCK_PACKAGES);
      } finally {
        setLoading(false);
      }
    }

    fetchPackages();
  }, [supabase]);

  return (
    <section className="py-32 bg-background relative overflow-hidden">
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
                <div className="max-w-2xl">
                    <div className="flex items-center space-x-2 text-primary font-bold tracking-widest uppercase text-xs mb-4">
                        <Sparkles className="w-4 h-4" />
                        <span>Curated Selections</span>
                    </div>
                    <h2 className="font-display text-5xl md:text-6xl font-bold text-foreground leading-tight">
                        Featured <span className="text-primary italic">Adventures</span>
                    </h2>
                    <p className="mt-6 text-muted-foreground text-lg font-medium leading-relaxed">
                        Hand-picked safari experiences designed for the modern explorer. 
                        Each journey is meticulously planned to ensure total comfort and breathtaking encounters.
                    </p>
                </div>
                
                <Link 
                    href="/safaris"
                    className="group flex items-center space-x-3 text-lg font-bold text-primary hover:text-primary/80 transition-all border-b-2 border-primary/20 hover:border-primary pb-1"
                >
                    <span>View All Packages</span>
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-[500px] w-full bg-muted animate-pulse rounded-3xl" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {packages.map((pkg, index) => (
                        <PackageCard key={pkg.id} pkg={pkg} index={index} />
                    ))}
                </div>
            )}
        </div>
    </section>
  );
}
