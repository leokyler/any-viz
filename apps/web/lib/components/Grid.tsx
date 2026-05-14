"use client";

import { type ComponentContext } from "@json-render/react";
import { type catalog } from "../catalog";

type GridCtx = ComponentContext<typeof catalog, "Grid">;

export function Grid({ props, children }: GridCtx) {
  const columns = props.columns ?? 2;
  const gap = props.gap ?? 16;

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: `${gap}px`,
      }}
    >
      {children}
    </div>
  );
}