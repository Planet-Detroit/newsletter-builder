import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/activecampaign/link-stats?campaignId=xxx&messageId=xxx
 * Gets per-link click data for a campaign using ActiveCampaign v1 API.
 *
 * Note: The v1 API requires both campaignId and messageId.
 * For standard campaigns, messageId is usually the same as campaignId.
 * If unsure, try campaignId as messageId first.
 */

export async function GET(request: NextRequest) {
  const apiUrl = process.env.ACTIVECAMPAIGN_API_URL;
  const apiKey = process.env.ACTIVECAMPAIGN_API_KEY;

  if (!apiUrl || !apiKey) {
    return NextResponse.json(
      { error: "ActiveCampaign API not configured." },
      { status: 500 }
    );
  }

  const campaignId = request.nextUrl.searchParams.get("campaignId");
  const messageId = request.nextUrl.searchParams.get("messageId") || campaignId;

  if (!campaignId) {
    return NextResponse.json({ error: "Missing campaignId parameter" }, { status: 400 });
  }

  try {
    // Use v1 API for link reporting
    const v1Url = `${apiUrl}/admin/api.php?api_action=campaign_report_link_list&campaignid=${campaignId}&messageid=${messageId}&api_output=json&api_key=${apiKey}`;

    const res = await fetch(v1Url, {
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      throw new Error(`ActiveCampaign returned ${res.status}`);
    }

    const data = await res.json();

    if (data.result_code === 0) {
      // No data or error — might mean no links clicked yet
      return NextResponse.json({ links: [], message: data.result_message || "No link data found" });
    }

    // Extract link objects from the response
    // AC v1 returns links as numbered keys (0, 1, 2, ...) plus metadata
    const links: { url: string; clicks: number; uniqueClicks: number; name: string }[] = [];

    for (const key of Object.keys(data)) {
      const val = data[key];
      if (val && typeof val === "object" && val.url) {
        links.push({
          url: val.url,
          name: val.name || "",
          clicks: parseInt(val.clicks || "0", 10),
          uniqueClicks: parseInt(val.uniqueclicks || "0", 10),
        });
      }
    }

    // Sort by clicks descending
    links.sort((a, b) => b.clicks - a.clicks);

    return NextResponse.json({ links });
  } catch (error) {
    console.error("ActiveCampaign link stats error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
