// lib/catalog.ts
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
        "折线图组件。props.data 用 $state 引用数据数组，props.dataKey 指定 Y 轴字段，props.xKey 指定 X 轴字段（默认 name）。示例：props.data 用 {\"$state\":\"/monthlyTrend\"} 绑定数据。",
      example: {
        data: { $state: "/monthlyTrend" },
        dataKey: "inbound",
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
        "柱状图组件。props.data 用 $state 引用数据数组，props.dataKey 指定 Y 轴字段，props.xKey 指定 X 轴字段（默认 name）。示例：props.data 用 {\"$state\":\"/zoneStock\"} 绑定数据。",
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
        "饼图组件。props.data 用 $state 引用数据数组，props.dataKey 指定数值字段，props.nameKey 指定名称字段（默认 name）。示例：props.data 用 {\"$state\":\"/categoryShare\"} 绑定数据。",
      example: {
        data: { $state: "/categoryShare" },
        dataKey: "value",
        nameKey: "name",
      },
    },
  },
  actions: {},
});