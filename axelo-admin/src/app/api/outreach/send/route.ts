import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
        body = await req.json();
    } catch (e) {}

    const { outreach_id } = body;
    if (!outreach_id) throw new Error("outreach_id is required");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch the draft and agency
    const { data: outreach, error: err } = await supabase
        .from('b2b_outreach')
        .select('*, b2b_agencies(*)')
        .eq('id', outreach_id)
        .single();
        
    if (err || !outreach) throw new Error("Draft not found");
    // if (outreach.status !== 'draft') throw new Error("Draft already sent or rejected");

    // Target the email
    const toEmail = outreach.b2b_agencies.contact_email;

    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith("re_")) {
         await resend.emails.send({
            from: "Manu @ Axelo Tours <partners@axelotours.co.ke>",
            to: toEmail,
            subject: outreach.email_subject,
            html: `
              <div style="font-family: Arial, sans-serif; color: #333; max-w: 600px;">
                ${outreach.email_body}
                <br/><br/>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #999;">
                  <strong>Axelo Tours & Safari Ltd.</strong><br/>
                  Nairobi, Kenya<br/>
                  <a href="https://axelotours.co.ke" style="color: #666;">axelotours.co.ke</a>
                </p>
              </div>
            `
         });
    } else {
         console.warn("RESEND_API_KEY absent or invalid. Simulating send.");
    }

    // Determine follow up date (5 days from now)
    const followUp = new Date();
    followUp.setDate(followUp.getDate() + 5);

    // Update status mapping
    const { error: updateErr } = await supabase.from('b2b_outreach').update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        follow_up_due: followUp.toISOString()
    }).eq('id', outreach_id);

    if (updateErr) throw updateErr;

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("Outreach Dispatch Error:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
