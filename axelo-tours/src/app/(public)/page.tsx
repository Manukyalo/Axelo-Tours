import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedPackages } from "@/components/home/FeaturedPackages";
import { TrustSection } from "@/components/home/TrustSection";
import { ManageBookingSection } from "@/components/home/ManageBookingSection";
import { AITripPlannerTeaser } from "@/components/home/AITripPlannerTeaser";
import { AppDownloadSection } from "@/components/home/AppDownloadSection";

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Axelo Tours & Safari Ltd",
    "url": "https://axelotours.co.ke",
    "logo": "https://axelotours.co.ke/logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+254-700-000-000",
      "contactType": "customer service",
      "areaServed": "KE",
      "availableLanguage": "en"
    },
    "sameAs": [
      "https://facebook.com/axelotours",
      "https://instagram.com/axelotours",
      "https://twitter.com/axelotours"
    ]
  };

  const localBusinessLd = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "name": "Axelo Tours & Safari Ltd",
    "image": "https://axelotours.co.ke/og-image.png",
    "@id": "https://axelotours.co.ke",
    "url": "https://axelotours.co.ke",
    "telephone": "+254700000000",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Level 4, Greenhouse Mall, Ngong Rd",
      "addressLocality": "Nairobi",
      "postalCode": "00100",
      "addressCountry": "KE"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -1.3005,
      "longitude": 36.7818
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "00:00",
      "closes": "23:59"
    }
  };

  return (
    <main className="flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessLd) }}
      />
      <HeroSection />
      <FeaturedPackages />
      <TrustSection />
      <ManageBookingSection />
      <AppDownloadSection />
      <AITripPlannerTeaser />
    </main>
  );
}

