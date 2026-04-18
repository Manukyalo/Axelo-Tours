"use client";

import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";

interface SafariSearchFiltersProps {
  onSearchChange: (val: string) => void;
  onCategoryChange: (val: string) => void;
  onDestinationChange: (val: string) => void;
}

export function SafariSearchFilters({ 
    onSearchChange, 
    onCategoryChange, 
    onDestinationChange 
}: SafariSearchFiltersProps) {
  return (
    <div className="max-w-5xl">
      <div className="bg-white/80 backdrop-blur-xl p-3 rounded-[2rem] border border-border/40 shadow-xl shadow-primary/5 flex flex-col md:flex-row items-center gap-2 mb-12">
        {/* Search Field */}
        <div className="relative flex-grow w-full group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            className="pl-14 h-14 rounded-[1.5rem] border-none bg-transparent focus:ring-0 font-medium text-lg placeholder:text-muted-foreground/60" 
            placeholder="Search by destination or package name..."
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="h-10 w-[1px] bg-border/40 hidden md:block mx-2" />

        {/* Category Filter */}
        <div className="w-full md:w-auto min-w-[160px]">
          <Select onValueChange={(val: any) => onCategoryChange(String(val || "all"))}>
            <SelectTrigger className="h-14 rounded-[1.5rem] border-none bg-transparent hover:bg-muted/50 transition-colors font-bold text-sm uppercase tracking-wider focus:ring-0">
              <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-primary" />
                  <SelectValue placeholder="Category" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-border/40">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="luxury">Luxury</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="budget">Budget</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="h-10 w-[1px] bg-border/40 hidden md:block mx-2" />

        {/* Destination Filter */}
        <div className="w-full md:w-auto min-w-[170px]">
          <Select onValueChange={(val: any) => onDestinationChange(String(val || "all"))}>
            <SelectTrigger className="h-14 rounded-[1.5rem] border-none bg-transparent hover:bg-muted/50 transition-colors font-bold text-sm uppercase tracking-wider focus:ring-0">
              <div className="flex items-center space-x-2">
                  <SlidersHorizontal className="w-4 h-4 text-primary" />
                  <SelectValue placeholder="Destination" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-border/40">
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="Maasai Mara">Maasai Mara</SelectItem>
              <SelectItem value="Amboseli">Amboseli</SelectItem>
              <SelectItem value="Tsavo">Tsavo</SelectItem>
              <SelectItem value="Samburu">Samburu</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
