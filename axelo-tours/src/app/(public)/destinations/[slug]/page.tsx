import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin, Compass, Sun, Map } from "lucide-react";
import Script from "next/script";

export const revalidate = 3600;

const DESTINATION_DATA: Record<string, any> = {
  "maasai-mara": {
    name: "Maasai Mara",
    title: "Discover the Magic of the Maasai Mara | Luxury Safaris",
    description: "Experience the world-renowned Great Wildebeest Migration and unparalleled big cat sightings in Kenya's most famous game reserve.",
    overview: "The Maasai Mara National Reserve is globally famous for its exceptional populations of lions, leopards, cheetahs, and the annual Great Migration of over two million wildebeest, zebra, and Thomson's gazelle. Staying in our carefully curated luxury camps offers you front-row seats to nature's greatest spectacle.",
    bestTime: "July to October (Great Migration) or December to February (warm and dry)."
  },
  "amboseli": {
    name: "Amboseli National Park",
    title: "Amboseli Safaris | The Land of Giants & Mt. Kilimanjaro",
    description: "Get up close with massive elephant herds against the breathtaking backdrop of Mount Kilimanjaro.",
    overview: "Amboseli National Park is crowned by Mount Kilimanjaro, Africa's highest peak. The name 'Amboseli' comes from a Maasai word meaning 'salty dust', and it is one of the best places in Africa to view large herds of elephants up close. Nature lovers can explore five different habitats here ranging from the dried-up bed of Lake Amboseli, wetlands with sulphur springs, the savannah, and woodlands.",
    bestTime: "June to October (dry season) is best for wildlife viewing."
  },
  "diani-beach": {
    name: "Diani Beach",
    title: "Luxury Diani Beach Holidays | Kenya's Coastal Paradise",
    description: "Relax on the pristine white sands of Diani Beach. The perfect post-safari Indian Ocean retreat.",
    overview: "Voted Africa's leading beach destination multiple times, Diani Beach is a stunning 17-kilometer stretch of flawless, white-sand coastline along the Indian Ocean. Combining the raw beauty of Kenya with luxurious beachfront resorts, Diani is the ultimate destination to unwind after an exhilarating bush safari.",
    bestTime: "December to March for snorkeling; avoid the long rains in May."
  },
  "laikipia": {
    name: "Laikipia",
    title: "Exclusive Safari Experiences in Laikipia Conservancy",
    description: "Discover off-the-beaten-path luxury and groundbreaking conservation in the magnificent Laikipia plateau.",
    overview: "Laikipia is a vast plateau extending from the foothills of Mount Kenya to the shores of Lake Baringo. It acts as a phenomenal refuge for rare wildlife like the Grevy's zebra and African wild dog. It offers exclusive, low-density tourism with activities not allowed in national parks, such as night drives, walking safaris, and camel treks.",
    bestTime: "All year round, though the dry season (June to September) concentrates game around water sources."
  },
  "samburu": {
    name: "Samburu National Reserve",
    title: "Samburu Safaris | Discover the 'Special Five' of Northern Kenya",
    description: "Journey into the rugged Northern Frontier District and encounter unique wildlife found nowhere else in Kenya.",
    overview: "Samburu National Reserve is a rugged and semi-desert park located in the Rift Valley Province of Kenya. It is fiercely beautiful with its dry plains bisected by the meandering Ewaso Nyiro River. Samburu is famous for the 'Special Five': the reticulated giraffe, Grevy's zebra, Beisa oryx, Somali ostrich, and gerenuk.",
    bestTime: "July to October, and December to March."
  }
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const dest = DESTINATION_DATA[params.slug];
  if (!dest) return { title: "Destination Not Found" };

  return {
    title: dest.title,
    description: dest.description,
  };
}

async function getPackagesForDestination(locationName: string) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  
  // Basic substring search for packages matching the destination
  const { data } = await supabase
    .from("packages")
    .select("*")
    // Simple ilike search on the destination field
    .ilike("destination", `%${locationName}%`)
    .limit(6);
    
  return data || [];
}

export default async function DestinationPage({ params }: { params: { slug: string } }) {
  const dest = DESTINATION_DATA[params.slug];
  if (!dest) notFound();

  const packages = await getPackagesForDestination(dest.name);

  // Simplified FAQ Schema for SEO
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `What is the best time to visit ${dest.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": dest.bestTime
        }
      },
      {
        "@type": "Question",
        "name": `Why should I visit ${dest.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": dest.overview
        }
      }
    ]
  };

  return (
    <>
      <Script
        id={`jsonld-dest-${params.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      
      <div className="bg-gray-50 min-h-screen pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
            
            {/* Header / Hero */}
            <div className="bg-white rounded-3xl p-8 md:p-16 shadow-sm border border-gray-100 mb-16 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                
                <div className="relative z-10 max-w-3xl">
                    <div className="flex items-center gap-2 text-primary font-bold tracking-widest uppercase text-sm mb-6">
                        <MapPin className="w-5 h-5" /> Northern Kenya & Rift Valley
                    </div>
                    <h1 className="font-display text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-8">
                       Explore <br/><span className="text-primary italic">{dest.name}</span>
                    </h1>
                    <p className="text-xl text-gray-600 leading-relaxed mb-8">
                        {dest.overview}
                    </p>
                    <div className="flex items-center gap-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <div className="w-12 h-12 bg-white flex items-center justify-center rounded-xl shadow-sm shrink-0">
                            <Sun className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Best Time to Visit</p>
                            <p className="text-sm font-medium text-gray-900">{dest.bestTime}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Packages Grid */}
            <div className="mb-8 flex items-end justify-between">
                <div>
                     <h2 className="text-3xl font-display font-black text-gray-900">Recommended Safaris</h2>
                     <p className="text-gray-500 mt-2">Curated luxury packages featuring {dest.name}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {packages.map((pkg: any) => (
                    <Link key={pkg.id} href={`/safaris/${pkg.slug}`} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col h-full relative cursor-pointer">
                        <div className="h-64 bg-gray-200 relative overflow-hidden">
                             {/* Usually an image here */}
                             <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 group-hover:scale-105 transition-transform duration-500"></div>
                             
                             <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg border border-white">
                                <p className="text-xs text-gray-500 font-bold uppercase">From</p>
                                <p className="text-lg font-black text-gray-900">${pkg.rack_rate_adult}</p>
                             </div>
                             
                             <div className="absolute bottom-4 left-4 bg-gray-900/80 backdrop-blur-sm px-4 py-2 rounded-xl">
                                <p className="text-sm font-bold text-white flex items-center gap-2">
                                     <Map className="w-4 h-4 text-primary" />
                                     {pkg.duration_days} Days
                                </p>
                             </div>
                        </div>
                        
                        <div className="p-8 flex-grow flex flex-col">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-primary transition-colors leading-tight">{pkg.name}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-6 flex-grow">{pkg.description}</p>
                            
                            <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-auto">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest line-clamp-1">{pkg.destination}</span>
                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white text-gray-400 transition-colors shrink-0">
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
                
                {packages.length === 0 && (
                    <div className="col-span-full py-16 bg-white rounded-3xl border border-gray-100 text-center flex flex-col items-center justify-center">
                        <Compass className="w-12 h-12 text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-900">Custom Itineraries Available</h3>
                        <p className="text-gray-500 max-w-md mt-2">While we don't have predefined packages currently showing for {dest.name}, our concierges can build you a custom luxury trip.</p>
                        <Link href="/contact" className="mt-6 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                            Build Custom Itinerary
                        </Link>
                    </div>
                )}
            </div>

        </div>
      </div>
    </>
  );
}
