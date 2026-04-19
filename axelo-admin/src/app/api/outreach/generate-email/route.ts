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

    const { agency_id } = body;
    if (!agency_id) throw new Error("agency_id is required");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch the agency
    const { data: agency, error: agencyErr } = await supabase
        .from('b2b_agencies')
        .select('*')
        .eq('id', agency_id)
        .single();
        
    if (agencyErr || !agency) throw new Error("Agency not found");

    const prompt = `Write a professional B2B partnership cold email from Manu (Founder) at Axelo Tours to the team at ${agency.name}. 
Context about them: 
- They currently offer: ${agency.specialties}
- Their Kenya gap: ${agency.kenya_gap}
- Personalization hook to use: ${agency.personalization_hook}

Requirements:
- Open with the personalization hook referencing something specific about their business.
- Position Axelo Tours as their missing premium Kenya partner to fill their gap.
- Mention our live B2B partner portal with real-time package availability and instantaneous commission tracking.
- Tone: Professional, warm, premium, not salesy. 
- Clear CTA: Schedule a 15-minute intro chat.
- Length: 150-200 words maximum. Avoid fluff.

Return ONLY valid JSON with this exact structure: { "subject": "...", "body": "..." }
Do not use markdown backticks or any text around the JSON block. Format the body using HTML tags like <p>, <br> for spacing.`;

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = (response.content[0] as any).text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse Claude JSON");
    
    const emailData = JSON.parse(jsonMatch[0]);

    // Save as draft in b2b_outreach table
    const { data: outreach, error: insertErr } = await supabase.from('b2b_outreach').insert({
        agency_id: agency.id,
        email_subject: emailData.subject,
        email_body: emailData.body,
        status: 'draft'
    }).select().single();

    if (insertErr) throw insertErr;

    return Response.json({ success: true, outreach });
  } catch (error: any) {
    console.error("Email Gen Error:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
