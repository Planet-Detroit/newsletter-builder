import { NextResponse } from "next/server";

/**
 * GET /api/activecampaign/campaigns
 * Lists recent campaigns from ActiveCampaign (v3 API).
 */

export async function GET() {
  const apiUrl = process.env.ACTIVECAMPAIGN_API_URL;
  const apiKey = process.env.ACTIVECAMPAIGN_API_KEY;

  if (!apiUrl || !apiKey) {
    return NextResponse.json(
      { error: "ActiveCampaign API not configured. Set ACTIVECAMPAIGN_API_URL and ACTIVECAMPAIGN_API_KEY." },
      { status: 500 }
    );
  }

  try {
    // Fetch most recent 50 campaigns, sorted by send date
    const res = await fetch(`${apiUrl}/api/3/campaigns?limit=50&orders[sdate]=DESC`, {
      headers: { "Api-Token": apiKey },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      throw new Error(`ActiveCampaign returned ${res.status}`);
    }

    const data = await res.json();

    // Return simplified campaign list
    const campaigns = (data.campaigns || []).map((c: Record<string, string>) => ({
      id: c.id,
      name: c.name,
      sendDate: c.sdate || null,
      status: c.status === "5" ? "sent" : c.status === "2" ? "draft" : c.status === "6" ? "sending" : c.status,
      sendCount: parseInt(c.send_amt || "0", 10),
      opens: parseInt(c.uniqueopens || "0", 10),
      clicks: parseInt(c.linkclicks || "0", 10),
    }));

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("ActiveCampaign campaigns error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
