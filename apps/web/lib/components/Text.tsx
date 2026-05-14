"use client";

import { type ComponentContext } from "@json-render/react";
import { type catalog } from "../catalog";

type TextCtx = ComponentContext<typeof catalog, "Text">;

const typeStyles: Record<string, string> = {
  insight: "border-l-4 border-blue-500 bg-blue-50 text-blue-900",
  summary: "border-l-4 border-green-500 bg-green-50 text-green-900",
  warning: "border-l-4 border-amber-500 bg-amber-50 text-amber-900",
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