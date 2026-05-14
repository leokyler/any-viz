# AnyViz MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an MVP of AnyViz — a conversational data analysis tool where users upload CSV/Excel files and ask questions in natural language to generate interactive visualizations.

**Architecture:** AI-First full-stack on Next.js 16. LLM generates json-render spec (structured JSON) referencing data via `$state` paths. Frontend renders specs with json-render-react runtime. Raw data never leaves the client — only metadata (field names, types, descriptions) is sent to the LLM.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, @json-render/core + @json-render/react + @json-render/shadcn, Recharts, Vercel AI SDK (`ai` + `@ai-sdk/deepseek`), Papa Parse (CSV), SheetJS (Excel), zod

---

### Task 1: Install Dependencies and Configure Project

**Files:**
- Modify: `apps/web/package.json`

- [ ] **Step 1: Add dependencies to apps/web**

```bash
cd /home/leo/irepos/any-viz && pnpm --filter web add @json-render/core @json-render/react @json-render/shadcn @ai-sdk/deepseek ai recharts papaparse xlsx zod
```

- [ ] **Step 2: Add dev dependencies**

```bash
pnpm --filter web add -D @types/papaparse
```

- [ ] **Step 3: Verify installation**

```bash
cd /home/leo/irepos/any-viz/apps/web && pnpm ls --depth 0 | grep -E "json-render|ai-sdk|recharts|papaparse|xlsx|zod"
```

Expected: all packages listed with versions.

- [ ] **Step 4: Commit**

```bash
cd /home/leo/irepos/any-viz && git add apps/web/package.json pnpm-lock.yaml && git commit -m "chore(web): add json-render, AI SDK, recharts, and data parsing dependencies"
```

---

### Task 2: Create Data Parser and Schema Inferrer

**Files:**
- Create: `apps/web/lib/data-parser.ts`

This module parses uploaded files (CSV/Excel), infers field types, and generates both the initial state object (for `StateProvider`) and the metadata description string (for LLM prompt).

- [ ] **Step 1: Write the data parser module**

```typescript
// apps/web/lib/data-parser.ts
import Papa from "papaparse";
import * as XLSX from "xlsx";

export interface FieldMeta {
  name: string;
  type: "string" | "number" | "date";
  sampleValues: (string | number | null)[];
  description: string;
}

export interface ParsedDataset {
  stateKey: string;
  data: Record<string, unknown>[];
  fields: FieldMeta[];
  rowCount: number;
}

export interface DataState {
  [key: string]: Record<string, unknown>[];
}

const DATE_PATTERN = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}|^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/;

function inferFieldType(values: unknown[]): "string" | "number" | "date" {
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== "");
  if (nonNull.length === 0) return "string";

  const numCount = nonNull.filter((v) => typeof v === "number" || (!isNaN(Number(v)) && String(v).trim() !== "")).length;
  const dateCount = nonNull.filter((v) => typeof v === "string" && DATE_PATTERN.test(v.trim())).length;

  if (dateCount > nonNull.length * 0.7) return "date";
  if (numCount > nonNull.length * 0.7) return "number";
  return "string";
}

function generateDescription(name: string, type: string, sampleValues: unknown[]): string {
  const samples = sampleValues.filter((v) => v !== null && v !== undefined).slice(0, 3);
  const sampleStr = samples.length > 0 ? ` 示例: ${samples.join(", ")}` : "";
  return `${name} (${type})${sampleStr}`;
}

export function parseCSV(text: string, fileName: string): ParsedDataset {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  const data = result.data as Record<string, unknown>[];
  const fieldNames = result.meta.fields ?? Object.keys(data[0] ?? {});

  const fields: FieldMeta[] = fieldNames.map((name) => {
    const values = data.map((row) => row[name] ?? null);
    const type = inferFieldType(values);
    const sampleValues = values.slice(0, 5);
    return {
      name,
      type,
      sampleValues,
      description: generateDescription(name, type, sampleValues),
    };
  });

  return {
    stateKey: fileName.replace(/\.[^.]+$/, ""),
    data,
    fields,
    rowCount: data.length,
  };
}

export function parseExcel(buffer: ArrayBuffer, fileName: string): ParsedDataset {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  const fieldNames = Object.keys(data[0] ?? {});

  const fields: FieldMeta[] = fieldNames.map((name) => {
    const values = data.map((row) => row[name] ?? null);
    const type = inferFieldType(values);
    const sampleValues = values.slice(0, 5);
    return {
      name,
      type,
      sampleValues,
      description: generateDescription(name, type, sampleValues),
    };
  });

  return {
    stateKey: fileName.replace(/\.[^.]+$/, ""),
    data,
    fields,
    rowCount: data.length,
  };
}

export function generateDataMeta(datasets: ParsedDataset[]): string {
  return datasets
    .map((ds) => {
      const fieldTable = ds.fields
        .map((f) => `| ${f.name} | ${f.type} | ${f.description} |`)
        .join("\n");
      return `### /${ds.stateKey} — ${ds.rowCount} 行数据\n\n| 字段名 | 类型 | 说明 |\n|--------|------|------|\n${fieldTable}\n\n适合的图表类型: ${suggestCharts(ds.fields)}`;
    })
    .join("\n\n");
}

function suggestCharts(fields: FieldMeta[]): string {
  const hasNumeric = fields.some((f) => f.type === "number");
  const hasString = fields.some((f) => f.type === "string");
  const suggestions: string[] = [];
  if (hasNumeric && hasString) suggestions.push("BarChart", "LineChart");
  if (hasNumeric) suggestions.push("DataTable", "KPICard");
  const numericFields = fields.filter((f) => f.type === "number");
  if (numericFields.length >= 2) suggestions.push("LineChart（多线）");
  if (hasString && hasNumeric) suggestions.push("PieChart（占比分析）");
  return suggestions.join("、");
}

export function buildState(datasets: ParsedDataset[]): DataState {
  const state: DataState = {};
  for (const ds of datasets) {
    state[ds.stateKey] = ds.data;
  }
  return state;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /home/leo/irepos/any-viz/apps/web && pnpm tsc --noEmit 2>&1 | head -20
```

Expected: no errors related to `data-parser.ts` (other existing errors are ok).

- [ ] **Step 3: Commit**

```bash
cd /home/leo/irepos/any-viz && git add apps/web/lib/data-parser.ts && git commit -m "feat(web): add data parser with CSV/Excel support and schema inference"
```

---

### Task 3: Create json-render Catalog and Registry

**Files:**
- Create: `apps/web/lib/catalog.ts`
- Create: `apps/web/lib/registry.tsx`

Migrating from the demo branch with the 5 new MVP components added.

- [ ] **Step 1: Create catalog.ts with all MVP components**

```typescript
// apps/web/lib/catalog.ts
import { z } from "zod";
import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { shadcnComponentDefinitions } from "@json-render/shadcn/catalog";

export const catalog = defineCatalog(schema, {
  components: {
    // Layout components (from shadcn)
    Card: shadcnComponentDefinitions.Card,
    Stack: shadcnComponentDefinitions.Stack,
    Heading: shadcnComponentDefinitions.Heading,
    Button: shadcnComponentDefinitions.Button,
    Input: shadcnComponentDefinitions.Input,

    // Chart components (custom with Recharts)
    LineChart: {
      props: z.object({
        data: z.array(z.record(z.string(), z.union([z.string(), z.number()]))),
        dataKey: z.string(),
        xKey: z.string().nullable(),
        color: z.string().nullable(),
        showGrid: z.boolean().nullable(),
        showLegend: z.boolean().nullable(),
        height: z.number().nullable(),
      }),
      description:
        "折线图。props.data 用 $state 引用数据数组，props.dataKey 指定 Y 轴字段，props.xKey 指定 X 轴字段。",
      example: {
        data: { $state: "/monthlyTrend" },
        dataKey: "value",
        xKey: "month",
      },
    },
    BarChart: {
      props: z.object({
        data: z.array(z.record(z.string(), z.union([z.string(), z.number()]))),
        dataKey: z.string(),
        xKey: z.string().nullable(),
        color: z.string().nullable(),
        showGrid: z.boolean().nullable(),
        showLegend: z.boolean().nullable(),
        height: z.number().nullable(),
      }),
      description:
        "柱状图。props.data 用 $state 引用数据数组，props.dataKey 指定 Y 轴字段，props.xKey 指定 X 轴字段。",
      example: {
        data: { $state: "/zoneStock" },
        dataKey: "quantity",
        xKey: "zone",
      },
    },
    PieChart: {
      props: z.object({
        data: z.array(z.record(z.string(), z.union([z.string(), z.number()]))),
        nameKey: z.string().nullable(),
        dataKey: z.string(),
        colors: z.array(z.string()).nullable(),
        showLegend: z.boolean().nullable(),
        height: z.number().nullable(),
      }),
      description:
        "饼图。props.data 用 $state 引用数据数组，props.dataKey 指定数值字段，props.nameKey 指定名称字段。",
      example: {
        data: { $state: "/categoryShare" },
        dataKey: "value",
        nameKey: "name",
      },
    },

    // New MVP components
    DataTable: {
      props: z.object({
        data: z.array(z.record(z.string(), z.union([z.string(), z.number()]))),
        columns: z.array(z.object({ key: z.string(), label: z.string() })).nullable(),
        maxRows: z.number().nullable(),
      }),
      description:
        "数据表格。props.data 用 $state 引用数据数组，props.columns 指定列定义。省略 columns 则自动取数据所有字段。",
      example: {
        data: { $state: "/zoneStock" },
        columns: [
          { key: "zone", label: "库区" },
          { key: "quantity", label: "库存量" },
        ],
      },
    },
    KPICard: {
      props: z.object({
        title: z.string(),
        value: z.union([z.string(), z.number()]),
        unit: z.string().nullable(),
        trend: z.enum(["up", "down", "flat"]).nullable(),
        trendValue: z.string().nullable(),
      }),
      description:
        "关键指标卡片。展示单个核心指标，如总库存、总销售额等。value 可以用 $state 引用动态计算的值。",
      example: {
        title: "总库存",
        value: 12850,
        unit: "件",
        trend: "up",
        trendValue: "+12%",
      },
    },
    Text: {
      props: z.object({
        content: z.string(),
        type: z.enum(["insight", "summary", "warning"]).nullable(),
      }),
      description:
        "AI 洞察文本块。用于展示分析结论、趋势说明等文字内容。type 为 insight 表示分析洞察，summary 表示总结，warning 表示注意事项。",
      example: {
        content: "库存总量较上月增长 12%，主要由 A 区原材料入库推动。",
        type: "insight",
      },
    },
    Tabs: {
      props: z.object({
        defaultTab: z.string().nullable(),
      }),
      description: "选项卡容器。用 children 放置各 Tab 内容，每个 child 的 props.tabLabel 作为标签名。",
      example: {
        defaultTab: "chart",
      },
    },
    Grid: {
      props: z.object({
        columns: z.number().nullable(),
        gap: z.number().nullable(),
      }),
      description:
        "响应式网格布局。columns 指定列数，gap 指定间距（px）。用于并排放置多个 Card 或图表。",
      example: {
        columns: 2,
        gap: 16,
      },
    },
  },
  actions: {},
});
```

- [ ] **Step 2: Create registry.tsx with all MVP component implementations**

```tsx
// apps/web/lib/registry.tsx
"use client";

import { defineRegistry } from "@json-render/react";
import { shadcnComponents } from "@json-render/shadcn";
import { catalog } from "./catalog";
import { LineChart } from "./components/LineChart";
import { BarChart } from "./components/BarChart";
import { PieChart } from "./components/PieChart";
import { DataTable } from "./components/DataTable";
import { KPICard } from "./components/KPICard";
import { Text } from "./components/Text";

export const { registry } = defineRegistry(catalog, {
  components: {
    Card: shadcnComponents.Card,
    Stack: shadcnComponents.Stack,
    Heading: shadcnComponents.Heading,
    Button: shadcnComponents.Button,
    Input: shadcnComponents.Input,
    LineChart,
    BarChart,
    PieChart,
    DataTable,
    KPICard,
    Text,
    // Tabs and Grid use shadcn internal patterns or simple custom
    // They will be registered separately once components are built
  },
});
```

- [ ] **Step 3: Create the components directory and chart components (migrated from demo)**

Create `apps/web/lib/components/LineChart.tsx`:

```tsx
// apps/web/lib/components/LineChart.tsx
"use client";

import { type ComponentContext } from "@json-render/react";
import { type catalog } from "../catalog";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type LineChartCtx = ComponentContext<typeof catalog, "LineChart">;

export function LineChart({ props }: LineChartCtx) {
  const data = props.data;

  return (
    <ResponsiveContainer width="100%" height={props.height ?? 300}>
      <RechartsLineChart data={data}>
        {props.showGrid !== false && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey={props.xKey ?? "name"} />
        <YAxis />
        <Tooltip />
        {props.showLegend !== false && <Legend />}
        <Line
          type="monotone"
          dataKey={props.dataKey}
          stroke={props.color ?? "#3b82f6"}
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
```

Create `apps/web/lib/components/BarChart.tsx`:

```tsx
// apps/web/lib/components/BarChart.tsx
"use client";

import { type ComponentContext } from "@json-render/react";
import { type catalog } from "../catalog";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type BarChartCtx = ComponentContext<typeof catalog, "BarChart">;

export function BarChart({ props }: BarChartCtx) {
  const data = props.data;

  return (
    <ResponsiveContainer width="100%" height={props.height ?? 300}>
      <RechartsBarChart data={data}>
        {props.showGrid !== false && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey={props.xKey ?? "name"} />
        <YAxis />
        <Tooltip />
        {props.showLegend !== false && <Legend />}
        <Bar dataKey={props.dataKey} fill={props.color ?? "#3b82f6"} radius={[4, 4, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
```

Create `apps/web/lib/components/PieChart.tsx`:

```tsx
// apps/web/lib/components/PieChart.tsx
"use client";

import { type ComponentContext } from "@json-render/react";
import { type catalog } from "../catalog";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type PieChartCtx = ComponentContext<typeof catalog, "PieChart">;

const DEFAULT_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

export function PieChart({ props }: PieChartCtx) {
  const data = props.data;
  const colors = props.colors ?? DEFAULT_COLORS;

  return (
    <ResponsiveContainer width="100%" height={props.height ?? 300}>
      <RechartsPieChart>
        <Pie
          data={data}
          dataKey={props.dataKey}
          nameKey={props.nameKey ?? "name"}
          cx="50%"
          cy="50%"
          outerRadius={100}
          label
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
        {props.showLegend !== false && <Legend />}
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
```

Create `apps/web/lib/components/DataTable.tsx`:

```tsx
// apps/web/lib/components/DataTable.tsx
"use client";

import { type ComponentContext } from "@json-render/react";
import { type catalog } from "../catalog";

type DataTableCtx = ComponentContext<typeof catalog, "DataTable">;

export function DataTable({ props }: DataTableCtx) {
  const { data, columns, maxRows } = props;
  const displayData = maxRows ? data.slice(0, maxRows) : data;
  const resolvedColumns =
    columns ?? Object.keys(data[0] ?? {}).map((key) => ({ key, label: key }));

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {resolvedColumns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-sm font-semibold text-gray-700"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {displayData.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {resolvedColumns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm text-gray-600">
                  {String(row[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

Create `apps/web/lib/components/KPICard.tsx`:

```tsx
// apps/web/lib/components/KPICard.tsx
"use client";

import { type ComponentContext } from "@json-render/react";
import { type catalog } from "../catalog";

type KPICardCtx = ComponentContext<typeof catalog, "KPICard">;

const trendIcons = {
  up: { arrow: "↑", color: "text-green-500" },
  down: { arrow: "↓", color: "text-red-500" },
  flat: { arrow: "→", color: "text-gray-500" },
};

export function KPICard({ props }: KPICardCtx) {
  const { title, value, unit, trend, trendValue } = props;
  const trendInfo = trend ? trendIcons[trend] : null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
      </div>
      {trendInfo && trendValue && (
        <p className={`mt-2 text-sm font-medium ${trendInfo.color}`}>
          {trendInfo.arrow} {trendValue}
        </p>
      )}
    </div>
  );
}
```

Create `apps/web/lib/components/Text.tsx`:

```tsx
// apps/web/lib/components/Text.tsx
"use client";

import { type ComponentContext } from "@json-render/react";
import { type catalog } from "../catalog";

type TextCtx = ComponentContext<typeof catalog, "Text">;

const typeStyles: Record<string, string> = {
  insight:
    "border-l-4 border-blue-500 bg-blue-50 text-blue-900",
  summary:
    "border-l-4 border-green-500 bg-green-50 text-green-900",
  warning:
    "border-l-4 border-amber-500 bg-amber-50 text-amber-900",
};

export function Text({ props }: TextCtx) {
  const { content, type } = props;
  const style = type ? typeStyles[type] : "border-l-4 border-gray-300 bg-gray-50 text-gray-800";

  return (
    <div className={`rounded-lg px-4 py-3 text-sm leading-relaxed ${style}`}>
      {content}
    </div>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /home/leo/irepos/any-viz/apps/web && pnpm tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
cd /home/leo/irepos/any-viz && git add apps/web/lib/ && git commit -m "feat(web): add json-render catalog, registry, and all MVP components"
```

---

### Task 4: Create LLM API Route

**Files:**
- Create: `apps/web/app/api/generate/route.ts`

- [ ] **Step 1: Create the generate API route**

```typescript
// apps/web/app/api/generate/route.ts
import { streamText } from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import { catalog } from "@/lib/catalog";

export async function POST(req: Request) {
  const { prompt, dataMeta } = await req.json();

  const systemPrompt = catalog.prompt({
    customRules: [
      dataMeta,
      "所有文本内容（标题、描述、洞察文字等）使用与用户提问相同的语言。",
      "优先使用 $state 引用数据，不要在 props 中硬编码实际数据值。",
      "根据数据特点选择合适的图表类型：趋势用 LineChart，比较用 BarChart，占比用 PieChart。",
      "布局建议：多个图表时用 Stack 或 Grid 排列，单个分析主题用 Card 包裹。",
    ],
  });

  const result = streamText({
    model: deepseek("deepseek-v4-flash"),
    system: systemPrompt,
    prompt,
  });

  return result.toTextStreamResponse();
}
```

- [ ] **Step 2: Verify the route compiles**

```bash
cd /home/leo/irepos/any-viz/apps/web && pnpm tsc --noEmit 2>&1 | head -10
```

- [ ] **Step 3: Commit**

```bash
cd /home/leo/irepos/any-viz && git add apps/web/app/api/generate/route.ts && git commit -m "feat(web): add LLM generate API route with json-render catalog prompt"
```

---

### Task 5: Create File Upload API Route

**Files:**
- Create: `apps/web/app/api/upload/route.ts`

- [ ] **Step 1: Create the upload API route**

```typescript
// apps/web/app/api/upload/route.ts
import { parseCSV, parseExcel, generateDataMeta, buildState } from "@/lib/data-parser";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const fileName = file.name;

  if (fileName.endsWith(".csv")) {
    const text = await file.text();
    const parsed = parseCSV(text, fileName);
    return Response.json({
      stateKey: parsed.stateKey,
      state: { [parsed.stateKey]: parsed.data },
      dataMeta: generateDataMeta([parsed]),
    });
  }

  if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
    const buffer = await file.arrayBuffer();
    const parsed = parseExcel(buffer, fileName);
    return Response.json({
      stateKey: parsed.stateKey,
      state: { [parsed.stateKey]: parsed.data },
      dataMeta: generateDataMeta([parsed]),
    });
  }

  return Response.json(
    { error: "Unsupported file type. Please upload CSV or Excel files." },
    { status: 400 }
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/leo/irepos/any-viz && git add apps/web/app/api/upload/route.ts && git commit -m "feat(web): add file upload API route for CSV and Excel parsing"
```

---

### Task 6: Create the useUIStream Hook

**Files:**
- Create: `apps/web/lib/use-ui-stream.ts`

This hook wraps the streaming spec compilation logic. It reads the LLM stream, compiles chunks into a valid json-render spec using `createSpecStreamCompiler`, and manages streaming state.

- [ ] **Step 1: Create the useUIStream hook**

```typescript
// apps/web/lib/use-ui-stream.ts
"use client";

import { useState, useCallback } from "react";
import { createSpecStreamCompiler } from "@json-render/core";

interface UseUIStreamOptions {
  api: string;
}

interface UseUIStreamResult {
  spec: unknown;
  isStreaming: boolean;
  send: (prompt: string, dataMeta?: string) => Promise<void>;
  error: string | null;
}

export function useUIStream({ api }: UseUIStreamOptions): UseUIStreamResult {
  const [spec, setSpec] = useState<unknown>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (prompt: string, dataMeta?: string) => {
      setIsStreaming(true);
      setError(null);
      setSpec(null);

      const compiler = createSpecStreamCompiler();

      try {
        const response = await fetch(api, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, dataMeta }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const { result } = compiler.push(chunk);
          setSpec(result);
        }

        const finalResult = compiler.getResult();
        setSpec(finalResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsStreaming(false);
      }
    },
    [api]
  );

  return { spec, isStreaming, send, error };
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/leo/irepos/any-viz && git add apps/web/lib/use-ui-stream.ts && git commit -m "feat(web): add useUIStream hook for streaming spec compilation"
```

---

### Task 7: Build the Main Page UI

**Files:**
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/app/globals.css`
- Modify: `apps/web/app/layout.tsx`

This is the main conversational UI — chat inline with embedded visualizations.

- [ ] **Step 1: Update globals.css for a clean app style**

Replace the contents of `apps/web/app/globals.css`:

```css
@import "tailwindcss";
@import "@repo/tailwind-config";

:root {
  --foreground-rgb: 0, 0, 0;
  --background-rgb: 245, 245, 245;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-rgb: 23, 23, 23;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: rgb(var(--background-rgb));
}
```

- [ ] **Step 2: Update layout.tsx**

```tsx
// apps/web/app/layout.tsx
import "@repo/ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
import { Geist } from "next/font/google";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AnyViz — 智能数据分析",
  description: "通过对话进行智能数据分析",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={geist.className}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Create the main page with chat and visualization**

```tsx
// apps/web/app/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import {
  Renderer,
  StateProvider,
  VisibilityProvider,
  ActionProvider,
  ValidationProvider,
} from "@json-render/react";
import { registry } from "@/lib/registry";
import { useUIStream } from "@/lib/use-ui-stream";
import { generateDataMeta } from "@/lib/data-parser";

interface DataState {
  [key: string]: Record<string, unknown>[];
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  spec?: unknown;
}

export default function Page() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [dataState, setDataState] = useState<DataState>({});
  const [dataMeta, setDataMeta] = useState<string>("");
  const [input, setInput] = useState("");
  const { spec, isStreaming, send, error } = useUIStream({ api: "/api/generate" });
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, spec]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      setDataState((prev) => ({ ...prev, ...data.state }));
      setDataMeta((prev) => (prev ? `${prev}\n\n${data.dataMeta}` : data.dataMeta));

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `已加载数据文件「${file.name}」，共 ${Object.values(data.state)[0]?.length ?? 0} 行。你可以开始提问了。`,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `文件上传失败: ${err instanceof Error ? err.message : "未知错误"}`,
        },
      ]);
    }

    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    await send(userMessage.content, dataMeta);
  };

  const currentSpec = spec;

  useEffect(() => {
    if (currentSpec && !isStreaming) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "",
          spec: currentSpec,
        },
      ]);
    }
  }, [isStreaming]);

  return (
    <StateProvider initialState={dataState}>
      <VisibilityProvider>
        <ActionProvider handlers={{}}>
          <ValidationProvider customFunctions={{}}>
            <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
              {/* Header */}
              <header className="flex items-center justify-between border-b bg-white px-6 py-4 dark:bg-gray-900">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  AnyViz
                </h1>
                <div className="flex items-center gap-3">
                  {Object.keys(dataState).length > 0 && (
                    <span className="text-sm text-gray-500">
                      已加载 {Object.keys(dataState).length} 个数据集
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    上传数据
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={handleUpload}
                  />
                </div>
              </header>

              {/* Chat area */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {messages.length === 0 && !currentSpec && (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
                        上传数据，开始提问
                      </h2>
                      <p className="mt-2 text-gray-500">
                        支持 CSV、Excel 文件，自然语言提问即可生成图表
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-6 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
                      >
                        上传数据文件
                      </button>
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                    </div>
                  </div>
                ))}

                {currentSpec && (
                  <div className="mb-4 max-w-[80%]">
                    <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
                      <Renderer
                        spec={currentSpec}
                        registry={registry}
                        loading={isStreaming}
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mb-4 flex justify-start">
                    <div className="max-w-[80%] rounded-2xl bg-red-50 px-4 py-3 text-red-700">
                      出错了: {error}
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Input bar */}
              <div className="border-t bg-white px-6 py-4 dark:bg-gray-900">
                <form onSubmit={handleSubmit} className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      Object.keys(dataState).length > 0
                        ? "提问关于你的数据..."
                        : "请先上传数据文件"
                    }
                    disabled={isStreaming || Object.keys(dataState).length === 0}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100"
                  />
                  <button
                    type="submit"
                    disabled={isStreaming || !input.trim()}
                    className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isStreaming ? "生成中..." : "发送"}
                  </button>
                </form>
              </div>
            </div>
          </ValidationProvider>
        </ActionProvider>
      </VisibilityProvider>
    </StateProvider>
  );
}
```

- [ ] **Step 4: Verify the app compiles**

```bash
cd /home/leo/irepos/any-viz/apps/web && pnpm tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
cd /home/leo/irepos/any-viz && git add apps/web/app/ && git commit -m "feat(web): build main page with chat-embedded visualization UI"
```

---

### Task 8: Create Environment Config for DeepSeek API Key

**Files:**
- Create: `apps/web/.env.local.example`
- Modify: `apps/web/.gitignore` (ensure .env.local is ignored)

- [ ] **Step 1: Create .env.local.example**

```
# apps/web/.env.local.example
DEEPSEEK_API_KEY=your-deepseek-api-key-here
```

- [ ] **Step 2: Ensure .env.local is in .gitignore**

Check that `apps/web/.gitignore` includes `.env.local`. If it doesn't, add it.

- [ ] **Step 3: Verify the Vercel AI SDK picks up the env variable**

The `@ai-sdk/deepseek` package reads `DEEPSEEK_API_KEY` from environment by default when calling `deepseek()`. Confirm in `apps/web/app/api/generate/route.ts` that no explicit key config is needed (it relies on the default env var).

- [ ] **Step 4: Commit**

```bash
cd /home/leo/irepos/any-viz && git add apps/web/.env.local.example && git commit -m "chore(web): add .env.local.example for DeepSeek API key"
```

---

### Task 9: Integration Test — End-to-End Smoke Test

**Files:**
- No new files — manual verification

- [ ] **Step 1: Set up environment**

```bash
cp apps/web/.env.local.example apps/web/.env.local
# Then edit apps/web/.env.local with your actual DeepSeek API key
```

- [ ] **Step 2: Start dev server**

```bash
cd /home/leo/irepos/any-viz && pnpm --filter web dev
```

- [ ] **Step 3: Verify in browser (http://localhost:3001)**

1. Page loads with "上传数据" button and empty chat
2. Upload a CSV file
3. Confirm data sets are loaded (header shows dataset count)
4. Type a question like "显示各库区库存量的柱状图"
5. Confirm streaming spec renders into a BarChart with bound data
6. Confirm data values come from `$state`, not from LLM response

- [ ] **Step 4: Fix any issues found during smoke test**

If any TypeScript errors or runtime issues appear, fix them and commit.

- [ ] **Step 5: Final commit (if fixes were needed)**

```bash
cd /home/leo/irepos/any-viz && git add -A && git commit -m "fix(web): address smoke test issues"
```