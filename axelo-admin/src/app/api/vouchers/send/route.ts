import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { voucherId, propertyEmail, clientNames, pdfUrl } = await req.json();

    if (!voucherId || !propertyEmail || !pdfUrl) {
      return NextResponse.json(
        { error: "Missing required fields (voucherId, propertyEmail, pdfUrl)" },
        { status: 400 }
      );
    }

    const clientNameStr = clientNames && clientNames.length > 0 ? clientNames[0] : 'Guest';

    // 1. Send the email via Resend
    const { data: emailData, error: resendError } = await resend.emails.send({
      from: 'Axelo Tours <reservations@axelotours.com>', // Assuming reservations@ is verified in Resend. Adjust if needed.
      to: [propertyEmail],
      subject: `Booking Voucher - ${clientNameStr} - Axelo Tours`,
      html: `
        <div style="font-family: sans-serif; color: #374151;">
          <h2>Accommodation Voucher</h2>
          <p>Dear Reservations Team,</p>
          <p>Please find attached the accommodation voucher for the upcoming stay of <strong>${clientNameStr}</strong>.</p>
          <p>You can download or view the official voucher PDF here: <br/>
            <a href="${pdfUrl}" target="_blank" style="color: #ea580c; font-weight: bold;">View Voucher PDF</a>
          </p>
          <p>Please confirm receipt and availability at your earliest convenience.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280;">
            Axelo Tours & Safari Ltd.<br/>
            123 Safari Way, Nairobi, Kenya<br/>
            info@axelotours.com | +254 700 000 000
          </p>
        </div>
      `,
    });

    if (resendError) {
      console.error("Resend Error:", resendError);
      throw new Error(`Failed to send email: ${resendError.message}`);
    }

    // 2. Update voucher status in DB
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: dbError } = await supabase
      .from('vouchers')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_to_email: propertyEmail
      })
      .eq('id', voucherId);

    if (dbError) {
      console.error("DB Update Error after sending email:", dbError);
      // We don't throw here because the email actually sent successfully. We just log.
    }

    return NextResponse.json({ success: true, emailId: emailData?.id });
  } catch (error: any) {
    console.error("Send Voucher Route Error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
