import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/activecampaign/campaigns
 * Lists recent sent campaigns from ActiveCampaign (v3 API).
 *
 * Query params:
 *   ?type=fundraising  — only return campaigns whose name starts with "Fundraiser:"
 *   ?days=180          — look back N days instead of the default 30
 */

export async function GET(request: NextRequest) {
  const apiUrl = process.env.ACTIVECAMPAIGN_API_URL;
  const apiKey = process.env.ACTIVECAMPAIGN_API_KEY;

  if (!apiUrl || !apiKey) {
    return NextResponse.json(
      { error: "ActiveCampaign API not configured. Set ACTIVECAMPAIGN_API_URL and ACTIVECAMPAIGN_API_KEY." },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = request.nextUrl;
    const typeFilter = searchParams.get("type"); // e.g. "fundraising"
    const daysParam = parseInt(searchParams.get("days") || "30", 10);
    const lookbackDays = Math.min(Math.max(daysParam, 1), 365);

    // Fetch more campaigns when looking back further
    const limit = lookbackDays > 30 ? 100 : 50;

    const res = await fetch(`${apiUrl}/api/3/campaigns?limit=${limit}&orders[sdate]=DESC`, {
      headers: { "Api-Token": apiKey },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      throw new Error(`ActiveCampaign returned ${res.status}`);
    }

    const data = await res.json();

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - lookbackDays);

    const campaigns = (data.campaigns || [])
      .map((c: Record<string, string>) => ({
        id: c.id,
        name: c.name,
        sendDate: c.sdate || null,
        status: c.status === "5" ? "sent" : c.status === "2" ? "draft" : c.status === "6" ? "sending" : c.status,
        sendCount: parseInt(c.send_amt || "0", 10),
        totalOpens: parseInt(c.opens || "0", 10),
        uniqueOpens: parseInt(c.uniqueopens || "0", 10),
        clicks: parseInt(c.linkclicks || "0", 10),
        uniqueClicks: parseInt(c.uniquelinkclicks || "0", 10),
        unsubscribes: parseInt(c.unsubscribes || "0", 10),
        opens: parseInt(c.uniqueopens || "0", 10),
      }))
      .filter((c: { status: string; sendDate: string | null; name: string }) => {
        if (c.status !== "sent") return false;
        if (!c.sendDate) return false;
        if (new Date(c.sendDate) < cutoff) return false;
        // Filter by type if requested
        if (typeFilter === "fundraising" && !c.name.startsWith("Fundraiser:")) return false;
        return true;
      });

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("ActiveCampaign campaigns error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
