// app/api/generate/route.ts
import { streamText } from "ai";
import { catalog } from "@/lib/catalog";
import { deepseek } from "@ai-sdk/deepseek";
import { warehouseDataMeta } from "@/lib/warehouse-data";

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const systemPrompt = catalog.prompt({ customRules: [warehouseDataMeta] });

  const result = streamText({
    model: deepseek("deepseek-v4-flash"),
    system: systemPrompt,
    prompt,
  });

  return result.toTextStreamResponse();
}