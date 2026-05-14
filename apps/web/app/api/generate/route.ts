import { streamText } from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import { catalog } from "@/lib/catalog";

export async function POST(req: Request) {
  const { prompt, context } = await req.json();
  const dataMeta = context?.dataMeta ?? "";

  const systemPrompt = catalog.prompt({
    customRules: [
      dataMeta,
      "所有文本内容（标题、描述、洞察文字等）使用与用户提问相同的语言。",
      "优先使用 $state 引用数据，不要在 props 中硬编码实际数据值。",
      "根据数据特点选择合适的图表类型：趋势用 LineChart，比较用 BarChart，占比用 PieChart。",
      "布局建议：多个图表时用 Stack 或 Grid 排列，单个分析主题用 Card 包裹。",
    ].filter(Boolean),
  });

  const result = streamText({
    model: deepseek("deepseek-v4-flash"),
    system: systemPrompt,
    prompt,
  });

  return result.toTextStreamResponse();
}