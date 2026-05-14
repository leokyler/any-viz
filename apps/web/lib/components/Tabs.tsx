"use client";

import { type ComponentContext } from "@json-render/react";
import { type catalog } from "../catalog";
import { useState } from "react";

type TabsCtx = ComponentContext<typeof catalog, "Tabs">;

export function Tabs({ props, children }: TabsCtx) {
  const [activeTab, setActiveTab] = useState(props.defaultTab ?? undefined);
  const childArray = Array.isArray(children) ? children : children ? [children] : [];
  const tabLabels = childArray.map(
    (child: any, i: number) => child?.props?.tabLabel ?? `Tab ${i + 1}`
  );
  const activeIndex = activeTab
    ? tabLabels.indexOf(activeTab)
    : 0;
  const currentActiveIndex = activeIndex >= 0 ? activeIndex : 0;

  return (
    <div>
      <div className="flex border-b border-gray-200">
        {tabLabels.map((label: string, i: number) => (
          <button
            key={label}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              i === currentActiveIndex
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab(label)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-4">{childArray[currentActiveIndex] ?? null}</div>
    </div>
  );
}