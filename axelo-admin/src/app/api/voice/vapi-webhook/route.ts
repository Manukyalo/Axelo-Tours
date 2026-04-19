import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { message } = payload;

    // Vapi hits this endpoint during 'assistant-request' 
    if (message?.type === "assistant-request") {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Fetch active packages for contextual awareness
      const { data: packages, error } = await supabase
        .from("packages")
        .select("name, destination, price_usd, duration_days")
        .eq("available", true)
        .limit(10);

      let contextStr = "Currently available safari packages:\n";
      if (!error && packages) {
        packages.forEach(p => {
            contextStr += `- ${p.name} (${p.duration_days} days) in ${p.destination}. Starting at $${p.price_usd}.\n`;
        });
      } else {
        contextStr += "- General Safari Packages to Maasai Mara, Serengeti, and Amboseli.\n";
      }

      return Response.json({
        assistant: {
            model: {
                provider: "anthropic",
                model: "claude-3-5-sonnet-20241022", // Best balance of reasoning and speed
                messages: [
                    {
                        role: "system",
                        content: `You are Zara, the premium AI phone receptionist for Axelo Tours & Safari Ltd in Kenya.
Your job is to answer customer questions about our safaris in a polite, highly professional, and welcoming voice. 
Keep your responses relatively brief, conversational, and suitable for a voice phone call (no markdown or long lists).
Here is our current inventory context:\n${contextStr}
Always assist the customer, try to identify which package they want, and capture their booking intent.`
                    }
                ]
            },
            voice: {
                provider: "11labs",
                voiceId: process.env.ELEVENLABS_VOICE_ID || "sarah"
            },
            firstMessage: "Thank you for calling Axelo Tours and Safari. I am Zara, your safari assistant. What is your name and how can I help you today?"
        }
      });
    }

    return Response.json({ success: true });
  } catch (e) {
    console.error("Vapi Webhook Error:", e);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
