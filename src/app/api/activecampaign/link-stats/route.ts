import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/activecampaign/link-stats?campaignId=xxx
 * Gets per-link click data for a campaign.
 *
 * Step 1: Use v3 API to discover the messageId linked to this campaign.
 * Step 2: Use v1 API campaign_report_link_list with the real messageId.
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
  let messageId = request.nextUrl.searchParams.get("messageId");

  if (!campaignId) {
    return NextResponse.json({ error: "Missing campaignId parameter" }, { status: 400 });
  }

  try {
    // Step 1: Discover the real messageId via v3 API if not provided
    if (!messageId) {
      try {
        const cmRes = await fetch(
          `${apiUrl}/api/3/campaigns/${campaignId}/campaignMessages`,
          {
            headers: { "Api-Token": apiKey },
            signal: AbortSignal.timeout(8000),
          }
        );
        if (cmRes.ok) {
          const cmData = await cmRes.json();
          const messages = cmData.campaignMessages || [];
          if (messages.length > 0) {
            // Each campaignMessage has a "message" field with the message ID
            messageId = messages[0].message;
            console.log(`[link-stats] Resolved messageId=${messageId} for campaign=${campaignId}`);
          }
        }
      } catch (lookupErr) {
        console.warn("[link-stats] Could not resolve messageId via v3, falling back to campaignId:", lookupErr);
      }
    }

    // Fall back to campaignId if lookup didn't find anything
    if (!messageId) messageId = campaignId;

    // Step 2: Fetch link report via v1 API
    const v1Url = `${apiUrl}/admin/api.php?api_action=campaign_report_link_list&campaignid=${campaignId}&messageid=${messageId}&api_output=json&api_key=${apiKey}`;

    const res = await fetch(v1Url, {
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      throw new Error(`ActiveCampaign returned ${res.status}`);
    }

    const data = await res.json();

    if (data.result_code === 0) {
      // No data — try one more fallback with campaignId as messageId if we used a different one
      if (messageId !== campaignId) {
        console.log(`[link-stats] Retrying with messageId=campaignId (${campaignId})`);
        const fallbackUrl = `${apiUrl}/admin/api.php?api_action=campaign_report_link_list&campaignid=${campaignId}&messageid=${campaignId}&api_output=json&api_key=${apiKey}`;
        const fallbackRes = await fetch(fallbackUrl, { signal: AbortSignal.timeout(10000) });
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (fallbackData.result_code !== 0) {
            return NextResponse.json({ links: extractLinks(fallbackData) });
          }
        }
      }
      return NextResponse.json({ links: [], message: data.result_message || "No link data found" });
    }

    return NextResponse.json({ links: extractLinks(data) });
  } catch (error) {
    console.error("ActiveCampaign link stats error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Extract link objects from the AC v1 response (numbered keys: 0, 1, 2, ...) */
function extractLinks(data: Record<string, unknown>): { url: string; clicks: number; uniqueClicks: number; name: string }[] {
  const links: { url: string; clicks: number; uniqueClicks: number; name: string }[] = [];

  for (const key of Object.keys(data)) {
    const val = data[key] as Record<string, string> | null;
    if (val && typeof val === "object" && val.url) {
      links.push({
        url: val.url,
        name: val.name || "",
        clicks: parseInt(val.clicks || "0", 10),
        uniqueClicks: parseInt(val.uniqueclicks || "0", 10),
      });
    }
  }

  links.sort((a, b) => b.clicks - a.clicks);
  return links;
}
