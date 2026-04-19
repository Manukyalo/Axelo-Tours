"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
    Clock, 
    MapPin, 
    CheckCircle2, 
    Calendar as CalendarIcon, 
    Users, 
    ArrowRight,
    Star,
    Share2,
    Heart,
    ChevronRight,
    Utensils,
    BedDouble
} from "lucide-react";
import { SafariPackage } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { 
    Accordion, 
    AccordionContent, 
    AccordionItem, 
    AccordionTrigger 
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import Link from "next/link";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Mock fallbacks for itinerary
const MOCK_ITINERARY = [
    {
        day: 1,
        title: "Arrival & Evening Game Drive",
        description: "Arrival at the airstrip followed by a warm welcome and transfer to the lodge. After a sumptuous lunch, head out for your first game drive in search of the Big Five as the sun sets over the savanna.",
        accommodation: "Angama Mara Luxury Tented Camp",
        meals: "Lunch, Dinner"
    },
    {
        day: 2,
        title: "Full Day Big Five Pursuit",
        description: "Spend the full day exploring the vast plains. Witness the incredible land-scale and dense wildlife populations. Picnic lunch will be served under an Acacia tree in the middle of the wilderness.",
        accommodation: "Angama Mara Luxury Tented Camp",
        meals: "Breakfast, Lunch, Dinner"
    },
    {
        day: 3,
        title: "Masai Culture & Departure",
        description: "Visit a local Masai Manyatta to learn about their ancient customs. Enjoy a final bush breakfast before being transferred to the airstrip for your flight home.",
        accommodation: "N/A",
        meals: "Breakfast"
    }
];

export default function SafariDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [pkg, setPkg] = useState<SafariPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [adults, setAdults] = useState<string>("2");
  const supabase = createClient();

  useEffect(() => {
    async function fetchPackage() {
        try {
            const { data, error } = await supabase
                .from("packages")
                .select("*")
                .eq("slug", slug)
                .single();

            if (error || !data) {
                // Fallback to finding in mock array
                console.warn("Package not found in DB, using mock fallback");
                // For simplicity, we just use the first mock package for now in dev
                setPkg({
                    id: "1",
                    name: "Ultimate Maasai Mara Luxury",
                    slug: "ultimate-maasai-mara-luxury",
                    destination: "Maasai Mara",
                    duration_days: 3,
                    price_usd: 3500,
                    price_kes: 455000,
                    highlights: ["Private Hot Air Balloon", "Big Five Tracking", "Luxury Tented Camp"],
                    images: ["/images/lion.png", "/images/elephants.png", "/images/leopard.png"],
                    available: true,
                    category: "luxury",
                    difficulty: "easy",
                    best_season: ["Jan", "Feb", "Jul", "Aug"],
                    created_at: new Date().toISOString(),
                    group_size_min: 1,
                    group_size_max: 6,
                    inclusions: ["All meals", "Soft drinks", "Park fees", "Game drives"],
                    exclusions: ["International flights", "Visas", "Tips"],
                    itinerary: MOCK_ITINERARY
                });
            } else {
                setPkg(data as SafariPackage);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }
    fetchPackage();
  }, [slug, supabase]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  if (!pkg) return <div className="min-h-screen bg-background flex items-center justify-center">Package not found</div>;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": pkg.name,
    "description": pkg.destination + " safari experience. " + pkg.highlights.join(", "),
    "image": pkg.images[0],
    "offers": {
      "@type": "Offer",
      "price": pkg.price_usd,
      "priceCurrency": "USD",
      "availability": pkg.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "url": `https://axelotours.co.ke/safaris/${pkg.slug}`
    },
    "brand": {
      "@type": "Brand",
      "name": "Axelo Tours"
    }
  };

  return (
    <main className="min-h-screen bg-background pb-32">
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
        {/* Top Header Section with Pattern */}

        <div className="relative pt-32 pb-16 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />
            
            <div className="container mx-auto px-6 relative">
                {/* Breadcrumbs */}
                <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-12">
                    <Link href="/safaris" className="hover:text-primary transition-colors">Safaris</Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="cursor-default">{pkg.destination}</span>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-foreground font-bold">{pkg.name}</span>
                </div>

                {/* Title Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="max-w-3xl">
                        <div className="flex items-center space-x-3 mb-6">
                            <Badge className="bg-primary/10 text-primary border-primary/20 font-bold uppercase py-1 px-4 text-xs tracking-wider ring-1 ring-primary/20">{pkg.category}</Badge>
                            <div className="flex items-center text-yellow-500 font-bold text-sm">
                                <Star className="w-4 h-4 fill-current mr-1.5" />
                                <span>5.0 (24 Reviews)</span>
                            </div>
                        </div>
                        <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground mb-8 tracking-tight leading-[1.1]">{pkg.name}</h1>
                        <div className="flex flex-wrap items-center gap-8 text-muted-foreground font-medium">
                            <div className="flex items-center space-x-2.5">
                                <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center shadow-sm">
                                    <MapPin className="w-5 h-5 text-primary" />
                                </div>
                                <span>{pkg.destination}, Kenya</span>
                            </div>
                            <div className="flex items-center space-x-2.5">
                                <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center shadow-sm">
                                    <Clock className="w-5 h-5 text-primary" />
                                </div>
                                <span>{pkg.duration_days} Days / {pkg.duration_days - 1} Nights</span>
                            </div>
                            <div className="flex items-center space-x-2.5">
                                <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center shadow-sm">
                                    <Users className="w-5 h-5 text-primary" />
                                </div>
                                <span>Max {pkg.group_size_max} Guests</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <button className="w-14 h-14 rounded-2xl border border-border bg-white flex items-center justify-center hover:bg-muted transition-all duration-300 shadow-sm active:scale-95">
                            <Share2 className="w-6 h-6 text-foreground" />
                        </button>
                        <button className="w-14 h-14 rounded-2xl border border-border bg-white flex items-center justify-center hover:text-red-500 hover:border-red-500 transition-all duration-300 shadow-sm active:scale-95 group">
                            <Heart className="w-6 h-6 group-hover:fill-current" />
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div className="container mx-auto px-6">

            {/* Gallery Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-16 rounded-[2.5rem] overflow-hidden bg-gray-100 p-2 border border-border/40 shadow-sm">
                <div className="md:col-span-2 relative aspect-[4/3] group cursor-pointer overflow-hidden rounded-3xl">
                    <Image 
                        src={pkg.images[0]} 
                        alt="Hero" 
                        fill 
                        priority
                        className="object-cover transition-transform duration-700 group-hover:scale-110" 
                        sizes="(max-width: 768px) 100vw, 50vw"
                    />
                </div>
                <div className="grid md:col-span-2 grid-cols-2 gap-4">
                    {pkg.images.slice(1, 5).map((img, i) => (
                         <div key={i} className="relative aspect-square group cursor-pointer overflow-hidden rounded-3xl">
                            <Image 
                                src={img} 
                                alt="Detail" 
                                fill 
                                className="object-cover transition-transform duration-700 group-hover:scale-110" 
                                sizes="(max-width: 768px) 50vw, 25vw"
                            />
                            {i === 3 && pkg.images.length > 5 && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-lg">
                                    +{pkg.images.length - 5} More
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="flex flex-col lg:flex-row gap-16 relative">
                {/* Left Side: Content */}
                <div className="flex-grow max-w-4xl">
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold mb-8">Trip Highlights</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pkg.highlights.map((h, i) => (
                                <div key={i} className="flex items-start space-x-3 p-4 rounded-2xl bg-white border border-border/40 shadow-sm">
                                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                    <span className="font-medium text-foreground">{h}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mb-16">
                        <h2 className="text-3xl font-bold mb-8">Itinerary</h2>
                        <Accordion className="w-full space-y-4">
                            {(pkg.itinerary || MOCK_ITINERARY).map((item, i) => (
                                <AccordionItem key={i} value={`day-${item.day}`} className="border border-border/40 rounded-3xl px-6 bg-white shadow-sm overflow-hidden">
                                    <AccordionTrigger className="hover:no-underline py-6">
                                        <div className="flex items-center space-x-4 text-left">
                                            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                                                D{item.day}
                                            </div>
                                            <span className="text-xl font-bold">{item.title}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-8 pt-2">
                                        <p className="text-muted-foreground leading-relaxed mb-6 font-medium">
                                            {item.description}
                                        </p>
                                        <div className="flex flex-wrap gap-8 pt-6 border-t border-border/40">
                                            {item.accommodation && (
                                                <div className="flex items-center space-x-2 text-sm font-bold">
                                                    <BedDouble className="w-4 h-4 text-primary" />
                                                    <span className="text-muted-foreground uppercase tracking-widest text-[10px]">Stay:</span>
                                                    <span>{item.accommodation}</span>
                                                </div>
                                            )}
                                            {item.meals && (
                                                <div className="flex items-center space-x-2 text-sm font-bold">
                                                    <Utensils className="w-4 h-4 text-primary" />
                                                    <span className="text-muted-foreground uppercase tracking-widest text-[10px]">Meals:</span>
                                                    <span>{item.meals}</span>
                                                </div>
                                            )}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>

                {/* Right Side: Sticky Booking Card */}
                <div className="lg:w-[400px] shrink-0">
                    <div className="sticky top-28 p-8 rounded-[2.5rem] bg-brand-dark text-white shadow-2xl shadow-primary/20 space-y-8">
                        <div>
                            <p className="text-xs uppercase font-bold tracking-[0.2em] text-accent mb-2">Investment</p>
                            <div className="flex flex-col">
                                <span className="text-4xl font-bold">{formatCurrency(pkg.price_usd, "USD")}</span>
                                <span className="text-sm text-white/50">≈ {formatCurrency(pkg.price_kes, "KES")} / Person</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                             <Popover>
                                <PopoverTrigger render={
                                    <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-left">
                                        <div className="flex items-center space-x-3">
                                            <CalendarIcon className="w-5 h-5 text-accent" />
                                            <span className="font-bold">Next Date</span>
                                        </div>
                                        <span className={cn("font-medium", selectedDate ? "text-white" : "text-white/60")}>
                                            {selectedDate ? format(selectedDate, "PPP") : "Select One"}
                                        </span>
                                    </button>
                                } />
                                <PopoverContent className="w-auto p-0 bg-white" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={(date) => setSelectedDate(date || undefined)}
                                        disabled={(date: Date) => date < new Date() || date < new Date("1900-01-01")}
                                        initialFocus
                                    />
                                </PopoverContent>
                             </Popover>

                             <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                                <div className="flex items-center space-x-3">
                                    <Users className="w-5 h-5 text-accent" />
                                    <span className="font-bold">Travelers</span>
                                </div>
                                <Select value={adults} onValueChange={(val) => setAdults(val || "1")}>
                                    <SelectTrigger className="border-none bg-transparent hover:bg-transparent p-0 h-auto font-medium text-white shadow-none focus:ring-0">
                                        <SelectValue placeholder="2 Adults" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[1,2,3,4,5,6,7,8,9,10,12,15].map(n => (
                                            <SelectItem key={n} value={String(n)}>{n} Adult{n > 1 ? 's' : ''}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                             </div>
                        </div>

                        <Link href={`/book/${pkg.id}?adults=${adults}${selectedDate ? `&date=${selectedDate.toISOString()}` : ''}`} className="block">
                            <Button className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold text-lg group">
                                <span>Reserve Your Quest</span>
                                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </Link>

                        <p className="text-[10px] text-center text-white/40 uppercase font-bold tracking-widest">
                            No immediate charge. Free cancellation up to 30 days.
                        </p>

                        <div className="pt-8 border-t border-white/10 space-y-4">
                            <p className="font-bold text-sm">Included Luxuries:</p>
                            <div className="grid grid-cols-1 gap-3">
                                {pkg.inclusions.slice(0, 4).map((inc, i) => (
                                    <div key={i} className="flex items-center space-x-2 text-xs text-white/70">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        <span>{inc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>
  );
}
