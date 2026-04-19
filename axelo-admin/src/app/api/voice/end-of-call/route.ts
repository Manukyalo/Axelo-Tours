import { createClient } from "@supabase/supabase-js";
import { Anthropic } from "@anthropic-ai/sdk";

// Initialize Africa's Talking
// We require it dynamically or globally based on standard usage
const africastalking = require("africastalking");

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const message = payload.message || payload;
    
    // We only care about the end-of-call report from Vapi
    if (message.type !== "end-of-call-report" && !message.transcript) {
        return Response.json({ success: true }); 
    }

    const { transcript, summary, call } = message;
    const duration = call?.duration || 0;
    const customerPhone = call?.customer?.number || "";

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    
    // Quick intent extraction using Claude
    const prompt = `Analyze this phone transcript between Zara (an AI safari receptionist) and a customer.
Transcript:
${transcript || "No transcript available."}

Extract the following:
1. "caller_name": The customer's extracted name (or "Unknown").
2. "intent_score": Integer from 0-10 on their likelihood to book a safari based on their phrasing and questions. 
3. "interested_package": The name of the specific safari package they asked about (or null).

Return ONLY valid JSON with this exact structure:
{
  "caller_name": "...",
  "intent_score": 7,
  "interested_package": "..."
}
Do not include any string wrapping, code blocks, or text outside the JSON block.`;

    let parsed = { caller_name: "Unknown", intent_score: 0, interested_package: null };
    try {
        const aiRes = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 300,
            messages: [{ role: "user", content: prompt }]
        });
        const textResponse = (aiRes.content[0] as any).text;
        parsed = JSON.parse(textResponse);
    } catch (parseErr) {
        console.error("AI Intent Parsing Error:", parseErr);
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Africa's Talking Integration
    let smsSent = false;
    if (parsed.intent_score >= 6 && customerPhone) {
        const at = africastalking({
            apiKey: process.env.AFRICAS_TALKING_API_KEY,
            username: process.env.AFRICAS_TALKING_USERNAME
        });
        
        try {
            await at.SMS.send({
                to: [customerPhone],
                message: "Hi! Thanks for calling Axelo Tours. Book your safari here: https://axelotours.co.ke/safaris — Reply or WhatsApp +254700000000 for help. — Zara, Axelo Tours",
                from: process.env.AFRICAS_TALKING_SENDER_ID || undefined
            });
            smsSent = true;
        } catch (smsErr) {
            console.error("Africa's Talking SMS failed:", smsErr);
        }
    }

    // Insert Final Call Log
    await supabase.from("call_logs").insert({
        caller_phone: customerPhone || "Unknown",
        caller_name: parsed.caller_name || "Unknown",
        duration_seconds: duration,
        transcript: { raw: transcript, summary: summary },
        summary: summary || "AI call completed.",
        booking_intent_score: parsed.intent_score,
        interested_package: parsed.interested_package,
        sms_sent: smsSent
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("End-of-call Webhook Error:", error);
    return Response.json({ error: "Internal Error" }, { status: 500 });
  }
}
