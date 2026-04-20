import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = "Axelo Partnerships <partnerships@axelotours.co.ke>";
const ADMIN_EMAIL = "partnerships@axelotours.co.ke";

export async function sendPartnerApprovalEmail(email: string, companyName: string, apiKey: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not found in environment. Email not sent.");
    return;
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Partner Account Approved - Axelo Tours & Safari Ltd",
    html: `
      <div style="font-family: sans-serif; color: #333; max-w: 600px; padding: 20px;">
        <h1 style="color: #1A6B3A;">Welcome to the Axelo Partner Network, ${companyName}!</h1>
        <p>We are excited to inform you that your partner application has been approved.</p>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <p style="margin-top: 0;"><strong>Your Portal Access:</strong></p>
          <p>Login URL: <a href="https://axelotours.co.ke/partner/login" style="color: #1A6B3A;">axelotours.co.ke/partner/login</a></p>
          <p>Use your registered email to sign in.</p>
        </div>

        <div style="background: #eefdf3; border: 1px solid #c6f6d5; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <p style="margin-top: 0; color: #1A6B3A;"><strong>Your API Key:</strong></p>
          <code style="display: block; background: #fff; padding: 10px; border-radius: 6px; font-size: 14px;">${apiKey}</code>
          <p style="font-size: 12px; color: #666; margin-bottom: 0;">Keep this key secure. It provides programmatic access to our net rates and inventory.</p>
        </div>

        <p>You now have access to:</p>
        <ul>
          <li><strong>Exclusive Net Rates</strong> for all our safari packages.</li>
          <li><strong>Group Quote Builder</strong> for custom requests.</li>
          <li><strong>Live Inventory</strong> and direct booking capabilities.</li>
        </ul>

        <p>If you have any questions, feel free to reply to this email or contact your accounts manager.</p>
        
        <p>Best regards,<br><strong>Director of Partnerships</strong><br>Axelo Tours & Safari Ltd</p>
      </div>
    `
  });
}

export async function sendQuoteApprovalNotification(email: string, quoteRef: string) {
  if (!process.env.RESEND_API_KEY) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Quote Approved: ${quoteRef}`,
    html: `
      <div style="font-family: sans-serif; color: #333;">
        <h2 style="color: #1A6B3A;">Good news! Your quote has been approved.</h2>
        <p>Quote Ref: <strong>${quoteRef}</strong> is now ready for confirmation.</p>
        <p>Log in to your partner portal to download the PDF and confirm the booking.</p>
        <p><a href="https://axelotours.co.ke/partner/quotes" style="display: inline-block; background: #1A6B3A; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px;">View Quotes</a></p>
      </div>
    `
  });
}
