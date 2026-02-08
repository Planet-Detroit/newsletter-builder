import { NextResponse } from "next/server";

export async function GET() {
  try {
    // NOAA Great Lakes Water Level data — monthly bulletin CSV
    const url = "https://www.glerl.noaa.gov/data/wlevels/levels.csv";

    const response = await fetch(url, {
      next: { revalidate: 86400 }, // cache for 24 hours (data is monthly)
    });

    if (!response.ok) {
      return await fetchFallback();
    }

    const text = await response.text();
    const lines = text.split("\n").filter((l) => l.trim());

    // Parse CSV — columns typically: date, superior, mihuron, erie, ontario, stclair
    const header = lines[0].toLowerCase();
    const cols = header.split(",").map((c) => c.trim());

    // Find column indices for lakes relevant to Detroit
    const erieIdx = cols.findIndex((c) => c.includes("erie"));
    const huronIdx = cols.findIndex((c) =>
      c.includes("huron") || c.includes("mihuron") || c.includes("michhuron")
    );
    const stclairIdx = cols.findIndex((c) => c.includes("clair"));

    // Get most recent data row
    const dataLines = lines.slice(1).filter((l) => /^\d/.test(l.trim()));
    if (dataLines.length === 0) {
      throw new Error("No lake level data found");
    }

    const latestLine = dataLines[dataLines.length - 1];
    const vals = latestLine.split(",").map((v) => v.trim());

    const result: Record<string, number | string | null> = {
      date: vals[0] || null,
      source: "NOAA Great Lakes Environmental Research Laboratory",
    };

    if (erieIdx >= 0 && vals[erieIdx]) {
      result.erie = parseFloat(vals[erieIdx]);
    }
    if (huronIdx >= 0 && vals[huronIdx]) {
      result.michiganHuron = parseFloat(vals[huronIdx]);
    }
    if (stclairIdx >= 0 && vals[stclairIdx]) {
      result.stClair = parseFloat(vals[stclairIdx]);
    }

    // Get previous month for trend indicator
    if (dataLines.length >= 2) {
      const prevLine = dataLines[dataLines.length - 2];
      const prevVals = prevLine.split(",").map((v) => v.trim());
      if (erieIdx >= 0 && prevVals[erieIdx]) {
        const prev = parseFloat(prevVals[erieIdx]);
        const curr = result.erie as number;
        if (!isNaN(prev) && !isNaN(curr)) {
          result.erieChange = Math.round((curr - prev) * 100) / 100;
        }
      }
      if (huronIdx >= 0 && prevVals[huronIdx]) {
        const prev = parseFloat(prevVals[huronIdx]);
        const curr = result.michiganHuron as number;
        if (!isNaN(prev) && !isNaN(curr)) {
          result.michiganHuronChange = Math.round((curr - prev) * 100) / 100;
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Lake levels fetch error:", error);
    return await fetchFallback();
  }
}

async function fetchFallback() {
  return NextResponse.json({
    erie: null,
    michiganHuron: null,
    message: "Lake level data temporarily unavailable",
    source: "NOAA GLERL",
  });
}
