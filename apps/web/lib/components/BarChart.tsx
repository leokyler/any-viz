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