import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/activecampaign/debug-links?campaignId=xxx
 *
 * Diagnostic endpoint — tries every possible AC API endpoint for link data
 * and shows the raw responses. Remove once link stats are working.
 */

export async function GET(request: NextRequest) {
  const apiUrl = process.env.ACTIVECAMPAIGN_API_URL;
  const apiKey = process.env.ACTIVECAMPAIGN_API_KEY;

  if (!apiUrl || !apiKey) {
    return NextResponse.json({ error: "Not configured", apiUrl: !!apiUrl, apiKey: !!apiKey }, { status: 500 });
  }

  const campaignId = request.nextUrl.searchParams.get("campaignId");
  if (!campaignId) {
    return NextResponse.json({ error: "Add ?campaignId=XXX to the URL" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: Record<string, any> = {
    campaignId,
    apiUrlBase: apiUrl.replace(/\/+$/, ""),
    timestamp: new Date().toISOString(),
  };

  const headers = { "Api-Token": apiKey };
  const timeout = AbortSignal.timeout(10000);

  // ── Strategy A: v3 /api/3/campaigns/{id}/links ──────────
  try {
    const url = `${apiUrl}/api/3/campaigns/${campaignId}/links`;
    const res = await fetch(url, { headers, signal: timeout });
    results["A_v3_campaigns_id_links"] = {
      url,
      status: res.status,
      data: res.ok ? await res.json() : await res.text().catch(() => "unreadable"),
    };
  } catch (e) {
    results["A_v3_campaigns_id_links"] = { error: String(e) };
  }

  // ── Strategy B: v3 /api/3/links?filters[campaignid]=X ────
  try {
    const url = `${apiUrl}/api/3/links?filters[campaignid]=${campaignId}&limit=5`;
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
    results["B_v3_links_filtered"] = {
      url,
      status: res.status,
      data: res.ok ? await res.json() : await res.text().catch(() => "unreadable"),
    };
  } catch (e) {
    results["B_v3_links_filtered"] = { error: String(e) };
  }

  // ── Strategy C: v3 /api/3/links (unfiltered, first 3) ────
  try {
    const url = `${apiUrl}/api/3/links?limit=3`;
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
    results["C_v3_links_unfiltered"] = {
      url,
      status: res.status,
      data: res.ok ? await res.json() : await res.text().catch(() => "unreadable"),
    };
  } catch (e) {
    results["C_v3_links_unfiltered"] = { error: String(e) };
  }

  // ── Strategy D: v3 /api/3/campaignLinks (if it exists) ────
  try {
    const url = `${apiUrl}/api/3/campaignLinks?filters[campaignid]=${campaignId}&limit=5`;
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
    results["D_v3_campaignLinks"] = {
      url,
      status: res.status,
      data: res.ok ? await res.json() : await res.text().catch(() => "unreadable"),
    };
  } catch (e) {
    results["D_v3_campaignLinks"] = { error: String(e) };
  }

  // ── Strategy E: v3 campaignMessages (to find messageId) ───
  let messageId = campaignId;
  try {
    const url = `${apiUrl}/api/3/campaigns/${campaignId}/campaignMessages`;
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
    const data = res.ok ? await res.json() : null;
    results["E_v3_campaignMessages"] = {
      url,
      status: res.status,
      data,
    };
    if (data?.campaignMessages?.[0]?.message) {
      messageId = String(data.campaignMessages[0].message);
    }
  } catch (e) {
    results["E_v3_campaignMessages"] = { error: String(e) };
  }
  results.resolvedMessageId = messageId;

  // ── Strategy F: v1 campaign_report_link_list (resolved msgId)
  try {
    const url = `${apiUrl}/admin/api.php?api_action=campaign_report_link_list&campaignid=${campaignId}&messageid=${messageId}&api_output=json&api_key=${apiKey}`;
    const safeUrl = url.replace(apiKey, "***");
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    results["F_v1_report_resolved_msgId"] = {
      url: safeUrl,
      status: res.status,
      result_code: data.result_code,
      result_message: data.result_message,
      keys: Object.keys(data),
      sampleEntries: Object.fromEntries(Object.entries(data).slice(0, 5)),
    };
  } catch (e) {
    results["F_v1_report_resolved_msgId"] = { error: String(e) };
  }

  // ── Strategy G: v1 with campaignId as messageId ───────────
  if (messageId !== campaignId) {
    try {
      const url = `${apiUrl}/admin/api.php?api_action=campaign_report_link_list&campaignid=${campaignId}&messageid=${campaignId}&api_output=json&api_key=${apiKey}`;
      const safeUrl = url.replace(apiKey, "***");
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      const data = await res.json();
      results["G_v1_report_campId_as_msgId"] = {
        url: safeUrl,
        status: res.status,
        result_code: data.result_code,
        result_message: data.result_message,
        keys: Object.keys(data),
      };
    } catch (e) {
      results["G_v1_report_campId_as_msgId"] = { error: String(e) };
    }
  }

  // ── Strategy H: v1 campaign_report_totals (general report) ─
  try {
    const url = `${apiUrl}/admin/api.php?api_action=campaign_report_totals&campaignid=${campaignId}&messageid=${messageId}&api_output=json&api_key=${apiKey}`;
    const safeUrl = url.replace(apiKey, "***");
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    results["H_v1_report_totals"] = {
      url: safeUrl,
      status: res.status,
      result_code: data.result_code,
      data,
    };
  } catch (e) {
    results["H_v1_report_totals"] = { error: String(e) };
  }

  return NextResponse.json(results, { status: 200 });
}
