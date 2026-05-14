import { z } from "zod";
import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { shadcnComponentDefinitions } from "@json-render/shadcn/catalog";

export const catalog = defineCatalog(schema, {
  components: {
    Card: shadcnComponentDefinitions.Card,
    Stack: shadcnComponentDefinitions.Stack,
    Heading: shadcnComponentDefinitions.Heading,
    Button: shadcnComponentDefinitions.Button,
    Input: shadcnComponentDefinitions.Input,

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