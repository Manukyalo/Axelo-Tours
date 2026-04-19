import { createClient } from "@supabase/supabase-js";
import { Anthropic } from "@anthropic-ai/sdk";

const TOPICS = [
  "The Ultimate Guide to Witnessing the Great Wildebeest Migration",
  "Top 5 Luxury Lodges in the Maasai Mara for Honeymooners",
  "A Beginner's Guide to Photography on an African Safari",
  "Amboseli National Park: Getting Close to the Big Tuskers",
  "Diani Beach: The Perfect Post-Safari Coastal Retreat",
  "Family Safari in Kenya: Best Parks for Kids",
  "Conservation in Samburu: Tracking the Unique Grevy's Zebra",
  "What to Pack for a Luxury Safari in East Africa",
];

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    let requestedTopic = null;
    let authHeader = req.headers.get("authorization");
    
    try {
        const body = await req.json();
        if (body.topic) requestedTopic = body.topic;
    } catch(e) {}

    // Verify Admin or Cron (simple check for now, standard deployment should verify Supabase Auth or a CRON_SECRET)
    // If it's the cron, we just pick a random topic from the list
    const finalTopic = requestedTopic || TOPICS[Math.floor(Math.random() * TOPICS.length)];

    const prompt = `You are an expert travel writer and SEO specialist for Axelo Tours & Safari Ltd (Kenya's premier safari company).
Write a comprehensive, engaging, and SEO-optimised blog article on the topic: "${finalTopic}"

Include:
- A compelling H1 title.
- A meta description (155 chars max).
- An engaging introduction.
- 5-7 H2 sections with detailed, expertly written content.
- A conclusion with a strong Call-To-Action to book a safari with Axelo Tours.
- Natural keyword placement.

Return ONLY valid JSON with this exact structure:
{
  "title": "...",
  "slug": "...",
  "meta_description": "...",
  "content_html": "<h1>...</h1><p>...</p><h2>...</h2>...",
  "keywords": ["...", "..."],
  "read_time_minutes": 5
}
Do not include any text outside the JSON block.`;

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = (response.content[0] as any).text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse JSON from Claude");
    
    const blogData = JSON.parse(jsonMatch[0]);

    // Save to the database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase.from("blog_posts").insert({
      title: blogData.title,
      slug: blogData.slug,
      meta_description: blogData.meta_description,
      content_html: blogData.content_html,
      keywords: blogData.keywords,
      read_time_minutes: blogData.read_time_minutes,
      published: false, // Wait for admin review
    }).select().single();

    if (error) {
        console.error("Supabase Save Error:", error);
        throw error;
    }

    return Response.json({ success: true, post: data });
  } catch (error: any) {
    console.error("Blog Generation Error:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
