import { Anthropic } from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { TRACKED_COMPETITORS } from "@/lib/constants";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      // Ignore empty body error since we have defaults
    }
    const { competitors = TRACKED_COMPETITORS, analysis_type = "full" } = body;

    // Parallel execution of Intelligence Streams
    const [competitorAnalysis, searchIntelligence] = await Promise.all([
      runCompetitorStream(competitors),
      runSearchDemandStream(),
    ]);

    // Save to Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: report, error } = await supabase
      .from("competitor_reports")
      .insert({
        report_date: new Date().toISOString().split("T")[0],
        competitor_name: "Aggregated Market Report",
        data: competitorAnalysis,
        search_trends: searchIntelligence.search_trends,
        keyword_gaps: searchIntelligence.keyword_gaps,
        opportunities: searchIntelligence.opportunities,
        insights: searchIntelligence.summary,
      })
      .select()
      .single();

    if (error) throw error;

    return Response.json({ success: true, report });
  } catch (error: any) {
    console.error("Analysis Error:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function runCompetitorStream(competitors: any[]) {
  const prompt = `Analyze the following East Africa safari competitors: ${competitors.map(c => c.name).join(", ")}.
  For each competitor, provide:
  1. Current starting prices for main safari packages.
  2. Top 3 client complaints based on recent reviews (Google/TripAdvisor).
  3. New product launches or focus areas in the last 30 days.
  4. Notable "missing" package types or gaps in their portfolio.
  
  Return the result EXACTLY as a JSON array of objects: [{ "name": "...", "prices": "...", "complaints": [], "recent_launches": [], "gaps": [] }]
  Do not include any text before or after the JSON.`;

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  // Extract JSON from response (simple parsing for this demo)
  const text = (response.content[0] as any).text;
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
}

async function runSearchDemandStream() {
  const prompt = `Analyze current search demand for "Kenya Safaris" and "East Africa Travel".
  Include:
  1. Top 5 fastest growing search terms (percentage growth).
  2. Top 3 unanswered safari-related questions from Reddit/TripAdvisor.
  3. Trending destinations on social media right now.
  4. Top 3 source countries by search volume.
  5. Keyword gaps compared to industry leaders.
  6. Strategic opportunities (niche markets).

  Return ONLY valid JSON with this exact structure: { 
    "search_trends": { "trending_terms": [], "social_trends": [], "source_countries": [] },
    "keyword_gaps": { "gaps": [] },
    "opportunities": [],
    "unanswered_questions": [],
    "summary": "Brief narrative summary"
  }
  Do not include any markdown formatting like \`\`\`json or text outside the JSON.`;

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = (response.content[0] as any).text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : { search_trends: {}, keyword_gaps: {}, opportunities: [], summary: "" };
}
