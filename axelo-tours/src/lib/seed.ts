import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const packages = [
  {
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
  },
  {
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
  },
  {
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
  },
];

async function seed() {
  console.log("Seeding packages...");
  const { error } = await supabase.from("packages").insert(packages);
  if (error) console.error("Error seeding:", error);
  else console.log("Seeding complete!");
}

seed();
