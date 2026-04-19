import { Anthropic } from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {}

    const target_region = body.target_region || "United States";
    const count = body.count || 5;

    const prompt = `Act as an expert B2B travel researcher. Find ${count} luxury travel agencies or tour operators in the ${target_region} that currently sell African safari packages. 
For each agency, determine:
1. Name of the agency
2. Website URL (invent a realistic one if you must, but try to use real known agencies)
3. Country (${target_region})
4. A realistic contact email (e.g., partnerships@..., or info@...)
5. Their current specialties and Africa destinations they cover
6. Who their client demographic is (e.g., UHNW, honeymoons, adventure)
7. A specific "kenya_gap" - a missing offering in their Kenya portfolio that Axelo Tours can fill (e.g., missing guided Samburu walking safaris).
8. A "personalization_hook" - a highly specific, genuine-sounding compliment or observation about their recent work to use as an icebreaker.

Return the result EXACTLY as a JSON array of objects with the following keys: 
name, website, country, contact_email, specialties, client_demographic, kenya_gap, personalization_hook

Do not include any text before or after the JSON array. Do not use Markdown backticks.`;

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = (response.content[0] as any).text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Failed to parse Claude JSON");
    
    const agencies = JSON.parse(jsonMatch[0]);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Upsert into b2b_agencies table matching by name or website
    const updates = [];
    for (const agency of agencies) {
        // Find existing to avoid dupes
        const { data: existing } = await supabase.from('b2b_agencies').select('id').eq('name', agency.name).maybeSingle();
        if (existing) {
             updates.push(supabase.from('b2b_agencies').update(agency).eq('id', existing.id));
        } else {
             updates.push(supabase.from('b2b_agencies').insert(agency));
        }
    }

    await Promise.all(updates);

    return Response.json({ success: true, count: agencies.length, agencies });
  } catch (error: any) {
    console.error("Outreach Research Error:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
