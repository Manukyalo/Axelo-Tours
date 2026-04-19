import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    // Africa's Talking sends inbound callbacks as form data usually
    let callerNumber = "";
    
    // Check Content-Type to parse appropriately
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
        const body = await req.json();
        callerNumber = body.callerNumber || body.from;
    } else {
        const formData = await req.formData();
        callerNumber = (formData.get("callerNumber") || formData.get("from")) as string;
    }

    if (!callerNumber) {
        return new Response("Missing callerNumber", { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Initial logging
    await supabase.from("call_logs").insert({
      caller_phone: callerNumber,
      summary: "Inbound call received, initiating Vapi callback...",
      transcript: { raw: "" } 
    });

    // Start Vapi Session (outbound callback routing)
    fetch("https://api.vapi.ai/call/phone", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.VAPI_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            assistantId: process.env.VAPI_ASSISTANT_ID,
            customer: {
                number: callerNumber
            },
            phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID
        })
    }).catch(e => console.error("Vapi Initialization Failed:", e));

    // Send valid XML to Africa's Talking. 
    // We reject this original local AT leg so that Vapi's fast-callback rings them immediately.
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="woman" playBip="true">Connecting to Axelo Zara Assistant...</Say>
  <Reject />
</Response>`;
    
    return new Response(xml, { 
        status: 200, 
        headers: { "Content-Type": "application/xml" } 
    });

  } catch (error) {
    console.error("Inbound Webhook Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
