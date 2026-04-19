import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, source } = await req.json();

    if (!email) {
      return Response.json({ success: false, error: "Email required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Save lead to DB
    const { error } = await supabase.from("leads").insert({
      email,
      source: source || "Website Exit Intent",
      status: "new"
    });

    if (error && error.code !== "23505") { // Ignore unique violation if they already exist
        console.error("Lead save error:", error);
        throw error;
    }

    // Send Welcome Email
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith("re_")) {
         await resend.emails.send({
            from: "Axelo Tours <concierge@axelotours.co.ke>",
            to: email,
            subject: "Your Free Kenya Safari Planning Guide",
            html: `
              <div style="font-family: sans-serif; color: #333; max-w: 600px; margin: 0 auto;">
                <h1 style="color: #1a1a1a;">Welcome to Axelo Tours!</h1>
                <p>Thank you for requesting our <strong>Kenya Safari Planning Guide</strong>.</p>
                <p>You can download your PDF guide by clicking the link below:</p>
                <a href="https://axelotours.co.ke/guide.pdf" style="display: inline-block; background: #e5a93e; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Download Guide</a>
                <p>If you have any questions or want to start building a custom itinerary, reply directly to this email!</p>
                <p>Best regards,<br><strong>Zara & The Axelo Team</strong></p>
              </div>
            `
         });
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("Lead capture error:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
