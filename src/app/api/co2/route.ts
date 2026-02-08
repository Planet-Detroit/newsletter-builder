import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Fetch weekly CO2 data from Scripps/NOAA Mauna Loa
    // Primary source: weekly average CO2 from NOAA GML
    const url =
      "https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_weekly_mlo.csv";

    const response = await fetch(url, {
      next: { revalidate: 3600 }, // cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`NOAA data fetch failed: ${response.status}`);
    }

    const text = await response.text();
    const lines = text.split("\n").filter((line) => !line.startsWith("#") && line.trim());

    // Find the header and data lines
    // Format: year, month, day, decimal, ppm, ndays, 1_yr_ago, 10_yr_ago, since_1800
    const dataLines = lines.filter((line) => /^\d{4}/.test(line.trim()));

    if (dataLines.length < 2) {
      throw new Error("Insufficient CO2 data");
    }

    // Get most recent entry
    const latestLine = dataLines[dataLines.length - 1];
    const parts = latestLine.split(",").map((s) => s.trim());

    // CSV columns: year, month, day, decimal_date, ppm, ndays, 1_yr_ago, 10_yr_ago, increase_since_1800
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const day = parseInt(parts[2]);
    const currentPPM = parseFloat(parts[4]);
    const oneYearAgo = parseFloat(parts[6]);

    // Handle -999.99 sentinel values (missing data)
    const current = currentPPM > 0 ? currentPPM : NaN;
    const lastYear = oneYearAgo > 0 ? oneYearAgo : NaN;

    if (isNaN(current)) {
      throw new Error("Current CO2 data not available");
    }

    const change = !isNaN(lastYear)
      ? Math.round((current - lastYear) * 100) / 100
      : null;

    return NextResponse.json({
      current: Math.round(current * 100) / 100,
      lastYear: !isNaN(lastYear) ? Math.round(lastYear * 100) / 100 : null,
      change,
      date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      source: "NOAA Global Monitoring Laboratory, Mauna Loa",
    });
  } catch (error) {
    console.error("CO2 fetch error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
