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