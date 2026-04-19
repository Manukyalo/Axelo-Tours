// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find all outreach emails marked 'sent' where follow_up_due is in the past
    // and they haven't replied yet.
    const { data: dueFollowUps, error: queryErr } = await supabase
      .from("b2b_outreach")
      .select("*, b2b_agencies(*)")
      .eq("status", "sent")
      .is("replied_at", null)
      .lte("follow_up_due", new Date().toISOString());

    if (queryErr) throw queryErr;
    if (!dueFollowUps || dueFollowUps.length === 0) {
      return new Response(JSON.stringify({ message: "No follow-ups due." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`Found ${dueFollowUps.length} follow ups due.`);
    let processCount = 0;

    for (const outreach of dueFollowUps) {
        const prompt = `You are Manu from Axelo Tours. You previously sent this email to ${outreach.b2b_agencies.name}:
---
Subject: ${outreach.email_subject}
Body: ${outreach.email_body}
---
The email was sent 5 days ago and they have not replied.
Write a polite, 3-sentence maximum follow-up email bumping the thread.
Do not be overly salesy or aggressive. 

Return ONLY valid JSON: { "subject": "Re: [Original Subject]", "body": "..." }
No markdown blocks or extra text. Use HTML <br> tags for spacing inside body.`;

        try {
            const antRes = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "x-api-key": anthropicKey,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    model: "claude-3-5-sonnet-20241022",
                    max_tokens: 500,
                    messages: [{ role: "user", content: prompt }]
                })
            });
            
            const aiData = await antRes.json();
            const text = aiData.content[0].text;
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) continue;
            
            const emailData = JSON.parse(jsonMatch[0]);

            // Save the follow up as a NEW draft
            await supabase.from("b2b_outreach").insert({
               agency_id: outreach.agency_id,
               email_subject: emailData.subject,
               email_body: emailData.body,
               status: 'draft'
            });

            // Mark the original as followed_up so we don't hit it again next week
            // (or we can just push follow_up_due into the future)
            await supabase.from("b2b_outreach").update({
               follow_up_due: null // Prevents re-triggering the same original email
            }).eq("id", outreach.id);

            processCount++;
        } catch (e) {
            console.error("Failed to generate follow up for", outreach.id, e);
        }
    }

    return new Response(JSON.stringify({ message: `Queued ${processCount} follow-up drafts.` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Follow up CRON error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
