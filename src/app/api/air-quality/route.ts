import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.AIRNOW_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        aqi: null,
        category: null,
        parameter: null,
        message: "Add AIRNOW_API_KEY to .env to enable live air quality data",
        demo: true,
      });
    }

    // AirNow API — Detroit ZIP code 48201
    const url = `https://www.airnowapi.org/aq/observation/zipCode/current/?format=application/json&zipCode=48201&distance=25&API_KEY=${apiKey}`;

    const response = await fetch(url, {
      next: { revalidate: 1800 },
    });

    if (!response.ok) {
      throw new Error(`AirNow API error: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("No air quality data available for Detroit");
    }

    // Find the primary pollutant (highest AQI)
    const sorted = [...data].sort(
      (a: Record<string, number>, b: Record<string, number>) =>
        (b.AQI || 0) - (a.AQI || 0)
    );
    const primary = sorted[0];

    return NextResponse.json({
      aqi: primary.AQI,
      category: primary.Category?.Name || getCategoryName(primary.AQI),
      parameter: primary.ParameterName,
      reportingArea: primary.ReportingArea,
      color: getAQIColor(primary.AQI),
      dateObserved: primary.DateObserved,
      source: "EPA AirNow",
    });
  } catch (error) {
    console.error("Air quality fetch error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function getCategoryName(aqi: number): string {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

function getAQIColor(aqi: number): string {
  if (aqi <= 50) return "#00e400";
  if (aqi <= 100) return "#ffff00";
  if (aqi <= 150) return "#ff7e00";
  if (aqi <= 200) return "#ff0000";
  if (aqi <= 300) return "#8f3f97";
  return "#7e0023";
}
