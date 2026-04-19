import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { contract_id } = await req.json();
    if (!contract_id) throw new Error("contract_id is required");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: contract, error } = await supabase
      .from("contracts")
      .select("*, properties(name, contact_name, contact_email)")
      .eq("id", contract_id)
      .single();

    if (error || !contract) throw new Error("Contract not found");

    const property = contract.properties;
    const expiryDate = new Date(contract.end_date).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric"
    });

    // Email to property
    if (property?.contact_email) {
      await resend.emails.send({
        from: "Manu @ Axelo Tours <partners@axelotours.co.ke>",
        to: property.contact_email,
        subject: `Contract Renewal: ${property.name} × Axelo Tours`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px;">
            <p>Dear ${property.contact_name || "Team"},</p>
            <p>I hope you're well! I'm reaching out as our ground operator agreement with <strong>${property.name}</strong> is approaching its expiry on <strong>${expiryDate}</strong>.</p>
            <p>We'd love to continue our partnership — the collaboration has been a wonderful experience and we've thoroughly enjoyed recommending your property to our clients.</p>
            <p>Could we schedule a call this week to discuss renewal terms and any rate updates for the upcoming season? I'm flexible on timing.</p>
            <p>Looking forward to hearing from you.</p>
            <br/>
            <p><strong>Manu</strong><br/>Founder, Axelo Tours & Safari Ltd.<br/>
            <a href="https://axelotours.co.ke">axelotours.co.ke</a></p>
          </div>
        `
      });
    }

    // Notify admin
    const adminEmail = process.env.ADMIN_EMAIL || "admin@axelotours.co.ke";
    await resend.emails.send({
      from: "Axelo System <system@axelotours.co.ke>",
      to: adminEmail,
      subject: `[Action Required] Contract renewal sent: ${property?.name}`,
      html: `
        <p>A renewal request has been sent to <strong>${property?.name}</strong> (${property?.contact_email}).</p>
        <p>Contract expires: <strong>${expiryDate}</strong></p>
        <p>Please follow up if no response within 5 business days.</p>
      `
    });

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("Contract Renewal Error:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
