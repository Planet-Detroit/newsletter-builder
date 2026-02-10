import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/activecampaign/debug-links?campaignId=xxx
 *
 * Diagnostic endpoint — shows raw API responses from all link-fetching
 * strategies so we can see exactly what AC returns.
 *
 * Remove this route once link stats are working correctly.
 */

export async function GET(request: NextRequest) {
  const apiUrl = process.env.ACTIVECAMPAIGN_API_URL;
  const apiKey = process.env.ACTIVECAMPAIGN_API_KEY;

  if (!apiUrl || !apiKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const campaignId = request.nextUrl.searchParams.get("campaignId");
  if (!campaignId) {
    return NextResponse.json({ error: "Missing campaignId" }, { status: 400 });
  }

  const results: Record<string, unknown> = { campaignId };

  // 1. v3 links with filter
  try {
    const res = await fetch(
      `${apiUrl}/api/3/links?filters[campaignid]=${campaignId}&limit=5`,
      { headers: { "Api-Token": apiKey }, signal: AbortSignal.timeout(10000) }
    );
    results.v3_links_status = res.status;
    results.v3_links = res.ok ? await res.json() : await res.text();
  } catch (e) {
    results.v3_links_error = String(e);
  }

  // 2. v3 campaignMessages
  try {
    const res = await fetch(
      `${apiUrl}/api/3/campaigns/${campaignId}/campaignMessages`,
      { headers: { "Api-Token": apiKey }, signal: AbortSignal.timeout(10000) }
    );
    results.v3_campaignMessages_status = res.status;
    results.v3_campaignMessages = res.ok ? await res.json() : await res.text();
  } catch (e) {
    results.v3_campaignMessages_error = String(e);
  }

  // 3. Get message ID from campaignMessages if possible
  let messageId = campaignId;
  try {
    const cmData = results.v3_campaignMessages as { campaignMessages?: Array<{ message?: string }> };
    if (cmData?.campaignMessages?.[0]?.message) {
      messageId = cmData.campaignMessages[0].message;
    }
  } catch { /* ignore */ }
  results.resolvedMessageId = messageId;

  // 4. v1 campaign_report_link_list with resolved messageId
  try {
    const res = await fetch(
      `${apiUrl}/admin/api.php?api_action=campaign_report_link_list&campaignid=${campaignId}&messageid=${messageId}&api_output=json&api_key=${apiKey}`,
      { signal: AbortSignal.timeout(10000) }
    );
    results.v1_report_status = res.status;
    const data = await res.json();
    // Only return first 3 entries to keep response readable
    const keys = Object.keys(data).slice(0, 10);
    results.v1_report_keys = Object.keys(data);
    results.v1_report_sample = Object.fromEntries(keys.map((k) => [k, data[k]]));
    results.v1_report_result_code = data.result_code;
    results.v1_report_result_message = data.result_message;
  } catch (e) {
    results.v1_report_error = String(e);
  }

  // 5. v1 with campaignId as messageId (if different)
  if (messageId !== campaignId) {
    try {
      const res = await fetch(
        `${apiUrl}/admin/api.php?api_action=campaign_report_link_list&campaignid=${campaignId}&messageid=${campaignId}&api_output=json&api_key=${apiKey}`,
        { signal: AbortSignal.timeout(10000) }
      );
      results.v1_fallback_status = res.status;
      const data = await res.json();
      results.v1_fallback_result_code = data.result_code;
      results.v1_fallback_result_message = data.result_message;
    } catch (e) {
      results.v1_fallback_error = String(e);
    }
  }

  return NextResponse.json(results, { status: 200 });
}
