import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  try {
    const costData = await req.json();

    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1024,
      temperature: 0.1,
      system: "You are a senior safari travel operational expert. Return strictly a JSON object with properties: isCompetitive (boolean), missingCosts (string array), and recommendations (string array). Do not include any markdown block ticks, just the pure JSON.",
      messages: [
        {
          role: "user",
          content: `Analyze this safari cost sheet and margins.\n\nData:\n${JSON.stringify(costData, null, 2)}\n\nQuestions:\n1. Are we competitive for this destination based on the provided rates and margins?\n2. Are there any hidden costs (e.g., conservancy fees, crater fees, flights) we might have missed?\n3. How does the B2B margin look compared to standard East African operator margins (usually 15-20%)?`
        }
      ]
    });

    const content = response.content[0].type === "text" ? response.content[0].text : "{}";
    const data = JSON.parse(content);

    return NextResponse.json(data);
  } catch (error) {
    console.error("AI Margin Analysis Error:", error);
    return NextResponse.json(
      { error: "Failed to analyze margins" },
      { status: 500 }
    );
  }
}
