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