// app/api/generate/route.ts
import { streamText } from "ai";
import { catalog } from "@/lib/catalog";
import { deepseek } from "@ai-sdk/deepseek";

export async function POST(req: Request) {
  const { prompt } = await req.json();

  // Generate system prompt from catalog
  const systemPrompt = catalog.prompt();

  const result = streamText({
    model: deepseek("deepseek-v4-flash"),
    system: systemPrompt,
    prompt,
  });

  return result.toTextStreamResponse();
}
