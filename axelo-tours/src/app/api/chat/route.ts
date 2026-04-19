import { createClient } from "@/lib/supabase/server";
import { ChatMessage, SafariPackage } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { messages, session_token } = await req.json() as { messages: ChatMessage[], session_token: string };
    
    if (!messages || !session_token) {
      return new NextResponse("Missing criteria", { status: 400 });
    }

    const supabase = await createClient();

    // 1. Fetch available packages for context
    const { data: packages } = await supabase
      .from("packages")
      .select("id, name, destination, duration_days, price_kes, price_usd, highlights")
      .eq("available", true);

    const packageContext = (packages as SafariPackage[])?.map(p => 
      `${p.name} | ${p.destination} | ${p.duration_days} days | KES ${p.price_kes} / USD ${p.price_usd} | ${p.highlights.join(', ')}`
    ).join('\n') || "No packages available at the moment.";

    const systemPrompt = `You are Zara, the friendly AI safari assistant for Axelo Tours & Safari Ltd. 
Be warm, enthusiastic, and professional. Use occasional wildlife emojis 🦁🐘🦒. 
When a client is ready to book, provide: /book/[package-id] where [package-id] is the actual ID of the package.
Never invent packages or prices not in the list below. 
If asked about items not in the list, politely explain you only handle these specific Axelo Tours packages but can help them choose the best one.

AVAILABLE PACKAGES:
${packageContext}`;

    // 2. Prepare payload for Anthropic (last 10 messages)
    const contextMessages = messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content
    }));

    // 3. Call Anthropic API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1024,
        system: systemPrompt,
        messages: contextMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Anthropic Error:", error);
      return new NextResponse("Error from AI service", { status: 500 });
    }

    // 4. Setup streaming and session update
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let assistantResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) return;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data:")) {
                const data = line.slice(5).trim();
                if (data === "[DONE]") continue;

                try {
                  const json = JSON.parse(data);
                  if (json.type === "content_block_delta") {
                    const text = json.delta.text;
                    assistantResponse += text;
                    controller.enqueue(encoder.encode(text));
                  }
                } catch (e) {
                  // Ignore parse errors for partial chunks
                }
              }
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          // 5. Update session in database once stream finishes
          const updatedMessages = [
            ...messages,
            { role: "assistant", content: assistantResponse } as ChatMessage
          ];

          await supabase.from("chat_sessions").upsert({
            session_token,
            messages: updatedMessages,
            message_count: updatedMessages.length,
            last_message: assistantResponse.slice(0, 200),
            updated_at: new Date().toISOString(),
          });

          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("Chat API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
