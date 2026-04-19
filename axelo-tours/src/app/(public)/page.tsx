import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedPackages } from "@/components/home/FeaturedPackages";
import { TrustSection } from "@/components/home/TrustSection";
import { AITripPlannerTeaser } from "@/components/home/AITripPlannerTeaser";
import { AppDownloadSection } from "@/components/home/AppDownloadSection";

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen">
      <HeroSection />
      <FeaturedPackages />
      <TrustSection />
      <AppDownloadSection />
      <AITripPlannerTeaser />
    </main>
  );
}
