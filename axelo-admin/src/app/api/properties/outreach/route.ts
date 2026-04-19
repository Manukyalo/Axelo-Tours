import { Anthropic } from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });

export async function POST(req: Request) {
  try {
    const { destination, count = 5 } = await req.json();
    if (!destination) throw new Error("destination is required");

    const prompt = `You are a travel industry researcher. Find ${count} premium lodges or camps in ${destination}, Africa, that have LIMITED online booking presence — meaning they tend to work exclusively through ground operators, don't have strong OTA listings (Booking.com, Expedia), and would benefit from a direct distribution partner.

For each property provide:
1. name — the lodge/camp name
2. website — their website URL (use real or realistic ones)
3. email — a realistic contact email (e.g. reservations@...)
4. room_count — approximate number of rooms/tents
5. category — one of: budget, midrange, luxury, ultra-luxury
6. why_partner — one specific, compelling reason why Axelo Tours partnering with them would be mutually beneficial (mention their online book gap)

Return ONLY a valid JSON array with these fields: name, website, email, room_count, category, why_partner
No markdown blocks, no text outside the JSON.`;

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = (response.content[0] as any).text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Failed to parse Claude JSON");

    const prospects = JSON.parse(jsonMatch[0]);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Upsert into properties
    const results = [];
    for (const p of prospects) {
      const insert = {
        name: p.name,
        location: destination,
        destination: destination,
        category: p.category || "luxury",
        contact_email: p.email,
        website: p.website,
        status: "prospect",
        notes: p.why_partner,
      };

      const { data: existing } = await supabase.from("properties").select("id").eq("name", p.name).maybeSingle();
      if (!existing) {
        const { data } = await supabase.from("properties").insert(insert).select().single();
        results.push(data);
      }
    }

    return Response.json({ success: true, count: results.length, properties: results });
  } catch (error: any) {
    console.error("Property Outreach Error:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
