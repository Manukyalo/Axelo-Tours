import { createClient } from "@supabase/supabase-js";

export async function GET(_req: Request, { params }: { params: { packageId: string } }) {
  const { packageId } = params;
  if (!packageId) return Response.json({ reviews: [] });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data } = await supabase
    .from("reviews")
    .select("id, reviewer_name, reviewer_country, rating, body, created_at")
    .eq("package_id", packageId)
    .eq("verified", true)
    .order("created_at", { ascending: false })
    .limit(6);

  return Response.json({ reviews: data || [] });
}
