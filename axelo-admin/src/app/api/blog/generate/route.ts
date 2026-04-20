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
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.NEXT_PUBLIC_CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const mode = body.mode || "generate"; // "generate" or "refine"
    
    if (mode === "refine") {
        const { currentContent, command, title } = body;
        const refinePrompt = `You are Zara, the expert travel AI for Axelo Tours & Safari Ltd.
        You are helping an editor refine a blog article.
        
        ARTICLE TITLE: "${title}"
        CURRENT CONTENT:
        ${currentContent}
        
        USER COMMAND: "${command}"
        
        Your task: Apply the command to the current content. 
        - If they ask for more detail, expand the relevant sections.
        - If they ask for SEO optimization, improve headers and keywords.
        - If they ask for formatting, wrap text in proper HTML tags (H2, H3, P, B, I).
        - Maintain the professional, adventurous tone of Axelo Tours.
        
        Return ONLY valid JSON with this exact structure:
        {
          "title": "...",
          "meta_description": "...",
          "content_html": "...",
          "keywords": ["...", "..."],
          "read_time_minutes": 5
        }
        Do not include any text outside the JSON block.`;

        const response = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 4000,
            messages: [{ role: "user", content: refinePrompt }],
        });

        const text = (response.content[0] as any).text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Failed to parse JSON from Claude");
        const refinedData = JSON.parse(jsonMatch[0]);

        return Response.json({ success: true, refined: refinedData });
    }

    // Default: Generate Mode
    const requestedTopic = body.topic;
    const finalTopic = requestedTopic || TOPICS[Math.floor(Math.random() * TOPICS.length)];

    const genPrompt = `You are an expert travel writer and SEO specialist for Axelo Tours & Safari Ltd (Kenya's premier safari company).
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
      messages: [{ role: "user", content: genPrompt }],
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
      published: false, 
    }).select().single();

    if (error) throw error;

    return Response.json({ success: true, post: data });
  } catch (error: any) {
    console.error("Blog API Error:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
