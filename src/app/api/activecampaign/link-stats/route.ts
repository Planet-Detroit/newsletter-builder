import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/activecampaign/link-stats?campaignId=xxx
 * Gets per-link click data for a campaign.
 *
 * Tries multiple AC API strategies in order:
 *   1. v3 API — GET /api/3/links filtered by campaignid (most reliable)
 *   2. v1 API — campaign_report_link_list with message ID lookup
 *   3. v1 API — campaign_report_link_list with campaignId as messageId
 */

interface LinkResult {
  url: string;
  name: string;
  clicks: number;
  uniqueClicks: number;
}

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
  if (!campaignId) {
    return NextResponse.json({ error: "Missing campaignId parameter" }, { status: 400 });
  }

  try {
    // Strategy 1: v3 API — GET /api/3/links filtered by campaignid
    const v3Links = await tryV3Links(apiUrl, apiKey, campaignId);
    if (v3Links.length > 0) {
      console.log(`[link-stats] v3 API returned ${v3Links.length} links for campaign=${campaignId}`);
      return NextResponse.json({ links: v3Links });
    }

    // Strategy 2: v1 API with message ID lookup via v3 campaignMessages
    const messageId = await lookupMessageId(apiUrl, apiKey, campaignId);
    if (messageId && messageId !== campaignId) {
      const v1Links = await tryV1LinkReport(apiUrl, apiKey, campaignId, messageId);
      if (v1Links.length > 0) {
        console.log(`[link-stats] v1 API (messageId=${messageId}) returned ${v1Links.length} links`);
        return NextResponse.json({ links: v1Links });
      }
    }

    // Strategy 3: v1 API with campaignId as messageId
    const v1Fallback = await tryV1LinkReport(apiUrl, apiKey, campaignId, campaignId);
    if (v1Fallback.length > 0) {
      console.log(`[link-stats] v1 API fallback returned ${v1Fallback.length} links`);
      return NextResponse.json({ links: v1Fallback });
    }

    // Nothing worked
    console.log(`[link-stats] No link data found for campaign=${campaignId} across all strategies`);
    return NextResponse.json({ links: [], message: "No link data found" });
  } catch (error) {
    console.error("ActiveCampaign link stats error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Strategy 1: Use v3 API to get links with click counts.
 * GET /api/3/links?filters[campaignid]={id}&limit=100
 */
async function tryV3Links(apiUrl: string, apiKey: string, campaignId: string): Promise<LinkResult[]> {
  try {
    // Try filtered links endpoint
    const url = `${apiUrl}/api/3/links?filters[campaignid]=${campaignId}&limit=100`;
    const res = await fetch(url, {
      headers: { "Api-Token": apiKey },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.warn(`[link-stats] v3 links endpoint returned ${res.status}`);
      return [];
    }

    const data = await res.json();
    const links = (data.links || []) as Array<{
      link: string;
      name?: string;
      clicks?: string | number;
      uniqueClicks?: string | number;
      uniqueclicks?: string | number;
    }>;

    if (links.length === 0) return [];

    const result: LinkResult[] = links
      .filter((l) => l.link && l.link.trim())
      .map((l) => ({
        url: l.link,
        name: l.name || "",
        clicks: parseInt(String(l.clicks || "0"), 10),
        uniqueClicks: parseInt(String(l.uniqueClicks || l.uniqueclicks || "0"), 10),
      }))
      .filter((l) => l.clicks > 0 || l.uniqueClicks > 0)
      .sort((a, b) => b.clicks - a.clicks);

    return result;
  } catch (err) {
    console.warn("[link-stats] v3 links strategy failed:", err);
    return [];
  }
}

/**
 * Look up the message ID associated with a campaign via v3 API.
 */
async function lookupMessageId(apiUrl: string, apiKey: string, campaignId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${apiUrl}/api/3/campaigns/${campaignId}/campaignMessages`,
      {
        headers: { "Api-Token": apiKey },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const messages = data.campaignMessages || [];
    if (messages.length > 0 && messages[0].message) {
      return String(messages[0].message);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Strategy 2/3: v1 API campaign_report_link_list
 */
async function tryV1LinkReport(apiUrl: string, apiKey: string, campaignId: string, messageId: string): Promise<LinkResult[]> {
  try {
    const url = `${apiUrl}/admin/api.php?api_action=campaign_report_link_list&campaignid=${campaignId}&messageid=${messageId}&api_output=json&api_key=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];

    const data = await res.json();
    if (data.result_code === 0) return [];

    return extractLinksFromV1(data);
  } catch {
    return [];
  }
}

/** Extract link objects from the AC v1 response (numbered keys: 0, 1, 2, ...) */
function extractLinksFromV1(data: Record<string, unknown>): LinkResult[] {
  const links: LinkResult[] = [];

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
