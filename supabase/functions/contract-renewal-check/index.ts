// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const resendKey = Deno.env.get("RESEND_API_KEY")!;
    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "admin@axelotours.co.ke";

    // Find contracts expiring within 60 days
    const sixtyDaysOut = new Date();
    sixtyDaysOut.setDate(sixtyDaysOut.getDate() + 60);

    const { data: contracts, error } = await supabase
      .from("contracts")
      .select("*, properties(name, contact_name, contact_email)")
      .lte("end_date", sixtyDaysOut.toISOString().split("T")[0])
      .gte("end_date", new Date().toISOString().split("T")[0]) // not yet expired
      .neq("status", "renewed");

    if (error) throw error;

    console.log(`Found ${contracts?.length || 0} contracts expiring within 60 days`);

    if (!contracts || contracts.length === 0) {
      return new Response(JSON.stringify({ message: "No contracts expiring soon." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;

    for (const contract of contracts) {
      const property = contract.properties;
      const daysLeft = Math.ceil(
        (new Date(contract.end_date).getTime() - Date.now()) / 86400000
      );
      const expiryDate = new Date(contract.end_date).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      });

      // Update contract status to 'expiring'
      await supabase.from("contracts").update({ status: "expiring" }).eq("id", contract.id);

      // Send renewal email to property contact
      if (property?.contact_email) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Manu @ Axelo Tours <partners@axelotours.co.ke>",
            to: property.contact_email,
            subject: `Contract Renewal Reminder: ${property.name} × Axelo Tours`,
            html: `
              <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px;">
                <p>Dear ${property.contact_name || "Team"},</p>
                <p>This is a friendly reminder that our ground operator agreement with <strong>${property.name}</strong> expires in <strong>${daysLeft} days</strong> on <strong>${expiryDate}</strong>.</p>
                <p>We sincerely value our partnership and hope to continue working together. Please reach out at your earliest convenience so we can discuss renewal terms and any updated rates for the coming season.</p>
                <p>Best regards,<br/><strong>Manu</strong><br/>Founder, Axelo Tours & Safari Ltd.</p>
              </div>
            `,
          }),
        });
      }

      // Send admin notification
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Axelo System <system@axelotours.co.ke>",
          to: adminEmail,
          subject: `[Contract Alert] ${property?.name} expires in ${daysLeft} days`,
          html: `
            <p><strong>${property?.name}</strong>'s contract expires in <strong>${daysLeft} days</strong> (${expiryDate}).</p>
            <p>Contact: ${property?.contact_email || "No email on file"}</p>
            <p>A renewal request email has been automatically dispatched to the property. Please follow up if no response within 5 business days.</p>
          `,
        }),
      });

      processed++;
    }

    return new Response(
      JSON.stringify({ message: `Processed ${processed} expiring contracts.` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Contract renewal cron error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
