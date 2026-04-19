// @ts-nocheck
// supabase/functions/weekly-intel/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.10.2"

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // 1. Run Intelligence Analysis via Claude
    // (Note: In a real production Edge Function, you would use fetch to Anthropic)
    const analysisResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2000,
        messages: [{ 
          role: "user", 
          content: "Perform a weekly competitor analysis and search demand report for Axelo Tours (East Africa Safaris). Return JSON with search_trends, keyword_gaps, opportunities, and summary." 
        }],
      }),
    })

    const result = await analysisResponse.json()
    const intelData = JSON.parse(result.content[0].text)

    // 2. Save to Database
    const { data: report, error: dbError } = await supabase
      .from('competitor_reports')
      .insert({
        report_date: new Date().toISOString().split('T')[0],
        competitor_name: "Weekly Automated Intelligence",
        data: [], // Full competitor scrape would go here
        search_trends: intelData.search_trends,
        keyword_gaps: intelData.keyword_gaps,
        opportunities: intelData.opportunities,
        insights: intelData.summary
      })
      .select()
      .single()

    if (dbError) throw dbError

    // 3. Send Email via Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Axelo Intelligence <intel@axelotours.co.ke>",
        to: ["admin@axelotours.co.ke"],
        subject: "🚀 Weekly Market Intelligence Report",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
            <h1 style="color: #1A6B3A;">Market Intelligence Summary</h1>
            <p>Your weekly analysis is ready. Here are the top opportunities found:</p>
            <ul>
              ${intelData.opportunities.slice(0, 3).map((o: any) => `<li><strong>${o.niche || o}</strong>: ${o.why || 'Growth detected'}</li>`).join('')}
            </ul>
            <p style="background: #f4f4f4; padding: 15px; border-radius: 10px;">
              <em>"${intelData.summary}"</em>
            </p>
            <a href="https://admin.axelotours.co.ke/intel" style="display: inline-block; padding: 12px 24px; background: #1A6B3A; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
              View Full Dashboard
            </a>
          </div>
        `
      }),
    })

    return new Response(JSON.stringify({ success: true, report_id: report.id }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
