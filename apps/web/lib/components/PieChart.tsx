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