"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SafariPackage } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { PackageCard } from "@/components/home/PackageCard";
import { SafariSearchFilters } from "@/components/safaris/SafariSearchFilters";
import { Sparkles, Map } from "lucide-react";

// Mock data for fallback
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
    {
        id: "4",
        name: "Samburu Cultural Echoes",
        slug: "samburu-cultural-echoes",
        destination: "Samburu",
        duration_days: 4,
        price_usd: 1500,
        price_kes: 195000,
        highlights: ["Special Five Heritage", "Ewaso Ng'iro River", "Cultural Interactions"],
        images: ["/images/lion.png"], // Reuse for mock
        available: true,
        category: "standard",
        difficulty: "moderate",
        best_season: ["Dec", "Jan", "Feb"],
        created_at: new Date().toISOString(),
        group_size_min: 2,
        group_size_max: 10,
        inclusions: [],
        exclusions: [],
    }
  ];

export default function SafarisListingPage() {
  const [packages, setPackages] = useState<SafariPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [destination, setDestination] = useState("all");

  const supabase = createClient();

  useEffect(() => {
    async function fetchPackages() {
      try {
        const { data, error } = await supabase
          .from("packages")
          .select("*")
          .eq("available", true);

        if (error || !data || data.length === 0) {
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

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
        const matchesSearch = pkg.name.toLowerCase().includes(search.toLowerCase()) || 
                             pkg.destination.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = category === "all" || pkg.category === category;
        const matchesDestination = destination === "all" || pkg.destination === destination;
        
        return matchesSearch && matchesCategory && matchesDestination;
    });
  }, [packages, search, category, destination]);

  return (
    <main className="min-h-screen pt-40 pb-32">
        <div className="container mx-auto px-6">
            {/* Header Area */}
            <div className="max-w-3xl mb-16">
                <div className="flex items-center space-x-2 text-primary font-bold tracking-widest uppercase text-xs mb-4">
                    <Map className="w-4 h-4" />
                    <span>Discover The Wild</span>
                </div>
                <h1 className="font-display text-5xl md:text-6xl font-bold text-foreground mb-6">
                    Safari <span className="text-primary italic">Collections</span>
                </h1>
                <p className="text-muted-foreground text-lg font-medium">
                    From the heights of Kilimanjaro to the plains of the Mara, find your next adventure with our curated selection of East African safaris.
                </p>
            </div>

            {/* Filters */}
            <SafariSearchFilters 
                onSearchChange={setSearch} 
                onCategoryChange={setCategory} 
                onDestinationChange={setDestination} 
            />

            {/* Results Grid */}
            <div className="min-h-[400px]">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-96 w-full bg-muted animate-pulse rounded-3xl" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <AnimatePresence mode="popLayout">
                            {filteredPackages.map((pkg, index) => (
                                <PackageCard key={pkg.id} pkg={pkg} index={index} />
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* No Results */}
                {!loading && filteredPackages.length === 0 && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-20 text-center"
                    >
                        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                            <Map className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">No adventures found</h3>
                        <p className="text-muted-foreground font-medium">Try adjusting your filters or search keywords.</p>
                    </motion.div>
                )}
            </div>
        </div>
    </main>
  );
}
