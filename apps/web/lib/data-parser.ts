import Papa from "papaparse";
import * as XLSX from "xlsx";

export interface FieldMeta {
  name: string;
  type: "string" | "number" | "date";
  sampleValues: (string | number | null)[];
  description: string;
}

export interface ParsedDataset {
  stateKey: string;
  data: Record<string, unknown>[];
  fields: FieldMeta[];
  rowCount: number;
}

export interface DataState {
  [key: string]: Record<string, unknown>[];
}

const DATE_PATTERN = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}|^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/;

function inferFieldType(values: unknown[]): "string" | "number" | "date" {
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== "");
  if (nonNull.length === 0) return "string";

  const numCount = nonNull.filter((v) => typeof v === "number" || (!isNaN(Number(v)) && String(v).trim() !== "")).length;
  const dateCount = nonNull.filter((v) => typeof v === "string" && DATE_PATTERN.test(v.trim())).length;

  if (dateCount > nonNull.length * 0.7) return "date";
  if (numCount > nonNull.length * 0.7) return "number";
  return "string";
}

function generateDescription(name: string, type: string, sampleValues: unknown[]): string {
  const samples = sampleValues.filter((v) => v !== null && v !== undefined).slice(0, 3);
  const sampleStr = samples.length > 0 ? ` 示例: ${samples.join(", ")}` : "";
  return `${name} (${type})${sampleStr}`;
}

export function parseCSV(text: string, fileName: string): ParsedDataset {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  const data = result.data as Record<string, unknown>[];
  const fieldNames = result.meta.fields ?? Object.keys(data[0] ?? {});

  const fields: FieldMeta[] = fieldNames.map((name) => {
    const values = data.map((row) => row[name] ?? null);
    const type = inferFieldType(values);
    const sampleValues = values.slice(0, 5) as (string | number | null)[];
    return {
      name,
      type,
      sampleValues,
      description: generateDescription(name, type, sampleValues),
    };
  });

  return {
    stateKey: fileName.replace(/\.[^.]+$/, ""),
    data,
    fields,
    rowCount: data.length,
  };
}

export function parseExcel(buffer: ArrayBuffer, fileName: string): ParsedDataset {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0] ?? "";
  const sheet = workbook.Sheets[sheetName] ?? {};
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  const firstRow = data[0] ?? {};
  const fieldNames = Object.keys(firstRow);

  const fields: FieldMeta[] = fieldNames.map((name) => {
    const values = data.map((row) => row[name] ?? null);
    const type = inferFieldType(values);
    const sampleValues = values.slice(0, 5) as (string | number | null)[];
    return {
      name,
      type,
      sampleValues,
      description: generateDescription(name, type, sampleValues),
    };
  });

  return {
    stateKey: fileName.replace(/\.[^.]+$/, ""),
    data,
    fields,
    rowCount: data.length,
  };
}

export function generateDataMeta(datasets: ParsedDataset[]): string {
  return datasets
    .map((ds) => {
      const fieldTable = ds.fields
        .map((f) => `| ${f.name} | ${f.type} | ${f.description} |`)
        .join("\n");
      return `### /${ds.stateKey} — ${ds.rowCount} 行数据\n\n| 字段名 | 类型 | 说明 |\n|--------|------|------|\n${fieldTable}\n\n适合的图表类型: ${suggestCharts(ds.fields)}`;
    })
    .join("\n\n");
}

function suggestCharts(fields: FieldMeta[]): string {
  const hasNumeric = fields.some((f) => f.type === "number");
  const hasString = fields.some((f) => f.type === "string");
  const suggestions: string[] = [];
  if (hasNumeric && hasString) suggestions.push("BarChart", "LineChart");
  if (hasNumeric) suggestions.push("DataTable", "KPICard");
  const numericFields = fields.filter((f) => f.type === "number");
  if (numericFields.length >= 2) suggestions.push("LineChart（多线）");
  if (hasString && hasNumeric) suggestions.push("PieChart（占比分析）");
  return suggestions.join("、");
}

export function buildState(datasets: ParsedDataset[]): DataState {
  const state: DataState = {};
  for (const ds of datasets) {
    state[ds.stateKey] = ds.data;
  }
  return state;
}