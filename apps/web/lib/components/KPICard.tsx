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