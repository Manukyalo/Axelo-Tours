"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, MapPin, CheckCircle2, ArrowRight } from "lucide-react";
import { SafariPackage } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";

interface PackageCardProps {
  pkg: SafariPackage;
  index: number;
}

export function PackageCard({ pkg, index }: PackageCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
      className="group bg-white rounded-3xl overflow-hidden border border-border/40 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500"
    >
      {/* Image Section */}
      <div className="relative h-72 w-full overflow-hidden">
        <Image
          src={pkg.images[0] || "/placeholder-safari.jpg"}
          alt={pkg.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        <div className="absolute top-4 left-4 flex flex-col gap-2">
            <Badge className="bg-white/90 text-primary border-none font-bold backdrop-blur-sm self-start">
                <MapPin className="w-3 h-3 mr-1" />
                {pkg.destination}
            </Badge>
            <Badge className="bg-accent/90 text-white border-none font-bold backdrop-blur-sm self-start">
                {pkg.category.toUpperCase()}
            </Badge>
        </div>

        <div className="absolute bottom-4 left-4 text-white">
            <div className="flex items-center space-x-2 text-sm font-medium">
                <Clock className="w-4 h-4 text-accent" />
                <span>{pkg.duration_days} Days</span>
            </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-8">
        <h3 className="font-display text-2xl font-bold text-foreground mb-4 line-clamp-1 group-hover:text-primary transition-colors">
            {pkg.name}
        </h3>

        {/* Highlights */}
        <div className="space-y-3 mb-8">
            {pkg.highlights.slice(0, 3).map((item, i) => (
                <div key={i} className="flex items-start space-x-2 text-sm text-muted-foreground font-medium">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{item}</span>
                </div>
            ))}
        </div>

        {/* Pricing & Link */}
        <div className="pt-6 border-t border-border/40 flex items-center justify-between">
            <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Starting from</p>
                <div className="flex flex-col">
                    <span className="text-2xl font-bold text-primary">
                        {formatCurrency(pkg.price_usd, "USD")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        ≈ {formatCurrency(pkg.price_kes, "KES")}
                    </span>
                </div>
            </div>

            <Link 
                href={`/safaris/${pkg.slug}`}
                className="w-12 h-12 bg-gray-100 group-hover:bg-primary group-hover:text-white rounded-full flex items-center justify-center transition-all duration-300 active:scale-90"
            >
                <ArrowRight className="w-5 h-5" />
            </Link>
        </div>
      </div>
    </motion.div>
  );
}
