import { parseCSV, parseExcel, generateDataMeta } from "@/lib/data-parser";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const fileName = file.name;

  if (fileName.endsWith(".csv")) {
    const text = await file.text();
    const parsed = parseCSV(text, fileName);
    return Response.json({
      stateKey: parsed.stateKey,
      state: { [parsed.stateKey]: parsed.data },
      dataMeta: generateDataMeta([parsed]),
    });
  }

  if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
    const buffer = await file.arrayBuffer();
    const parsed = parseExcel(buffer, fileName);
    return Response.json({
      stateKey: parsed.stateKey,
      state: { [parsed.stateKey]: parsed.data },
      dataMeta: generateDataMeta([parsed]),
    });
  }

  return Response.json(
    { error: "Unsupported file type. Please upload CSV or Excel files." },
    { status: 400 }
  );
}