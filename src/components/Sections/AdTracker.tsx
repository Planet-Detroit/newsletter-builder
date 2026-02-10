"use client";

import { useState, useCallback, useEffect } from "react";
import { useNewsletter } from "@/context/NewsletterContext";
import type { ACCampaign, ACLinkStat } from "@/types/ads";

/** Per-campaign link data keyed by campaign ID */
type CampaignLinks = Record<string, ACLinkStat[]>;

export default function AdTracker() {
  const { state } = useNewsletter();

  // Campaign list
  const [campaigns, setCampaigns] = useState<ACCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  // Multi-select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Per-campaign link data
  const [campaignLinks, setCampaignLinks] = useState<CampaignLinks>({});
  const [linksLoading, setLinksLoading] = useState<Set<string>>(new Set());

  // Snapshot
  const [snapNote, setSnapNote] = useState("");
  const [snapSaving, setSnapSaving] = useState(false);
  const [snapSaved, setSnapSaved] = useState(false);

  // PDF export
  const [exporting, setExporting] = useState(false);

  /* ── Data fetching ──────────────────────────────────── */

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/activecampaign/campaigns");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed (${res.status})`);
      }
      const data = await res.json();
      setCampaigns(data.campaigns || []);
      setFetched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLinkStats = useCallback(async (campaignId: string) => {
    setLinksLoading((prev) => new Set(prev).add(campaignId));
    try {
      const res = await fetch(`/api/activecampaign/link-stats?campaignId=${campaignId}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setCampaignLinks((prev) => ({ ...prev, [campaignId]: data.links || [] }));
    } catch {
      setCampaignLinks((prev) => ({ ...prev, [campaignId]: [] }));
    } finally {
      setLinksLoading((prev) => {
        const next = new Set(prev);
        next.delete(campaignId);
        return next;
      });
    }
  }, []);

  // Auto-fetch campaigns on mount
  useEffect(() => {
    if (!fetched && !loading) fetchCampaigns();
  }, [fetched, loading, fetchCampaigns]);

  /* ── Selection handlers ─────────────────────────────── */

  const toggleCampaign = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        // Fetch links if we don't have them yet
        if (!campaignLinks[id] && !linksLoading.has(id)) {
          fetchLinkStats(id);
        }
      }
      return next;
    });
  };

  const selectAll = () => {
    const sentCampaigns = campaigns.filter((c) => c.status === "sent");
    const allIds = new Set(sentCampaigns.map((c) => c.id));
    setSelectedIds(allIds);
    // Fetch links for any we don't have
    for (const c of sentCampaigns) {
      if (!campaignLinks[c.id] && !linksLoading.has(c.id)) {
        fetchLinkStats(c.id);
      }
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  /* ── Computed data ──────────────────────────────────── */

  const selectedCampaigns = campaigns.filter((c) => selectedIds.has(c.id));
  const anyLinksLoading = [...linksLoading].some((id) => selectedIds.has(id));

  // Aggregate metrics across selected campaigns
  const aggregate = selectedCampaigns.reduce(
    (acc, c) => ({
      sendCount: acc.sendCount + c.sendCount,
      totalOpens: acc.totalOpens + c.totalOpens,
      uniqueOpens: acc.uniqueOpens + c.uniqueOpens,
      clicks: acc.clicks + c.clicks,
      uniqueClicks: acc.uniqueClicks + c.uniqueClicks,
      unsubscribes: acc.unsubscribes + c.unsubscribes,
    }),
    { sendCount: 0, totalOpens: 0, uniqueOpens: 0, clicks: 0, uniqueClicks: 0, unsubscribes: 0 }
  );

  const aggOpenRate = aggregate.sendCount > 0
    ? ((aggregate.uniqueOpens / aggregate.sendCount) * 100).toFixed(1)
    : "0";
  const aggCtr = aggregate.sendCount > 0
    ? ((aggregate.uniqueClicks / aggregate.sendCount) * 100).toFixed(2)
    : "0";

  // Identify ad links
  const isAdLink = (url: string): boolean => {
    return state.ads.some((ad) => {
      const hrefMatches = ad.htmlContent.matchAll(/href="([^"]+)"/g);
      for (const match of hrefMatches) {
        const adUrl = match[1].replace(/&amp;/g, "&");
        const stripUtm = (u: string) => {
          try {
            const parsed = new URL(u);
            for (const key of [...parsed.searchParams.keys()]) {
              if (key.startsWith("utm_")) parsed.searchParams.delete(key);
            }
            return parsed.origin + parsed.pathname;
          } catch {
            return u;
          }
        };
        if (stripUtm(url) === stripUtm(adUrl)) return true;
      }
      return false;
    });
  };

  // Aggregate link stats across selected campaigns
  const aggregatedLinks: ACLinkStat[] = (() => {
    const map = new Map<string, { clicks: number; uniqueClicks: number; name: string }>();
    for (const id of selectedIds) {
      for (const link of campaignLinks[id] || []) {
        const existing = map.get(link.url);
        if (existing) {
          existing.clicks += link.clicks;
          existing.uniqueClicks += link.uniqueClicks;
        } else {
          map.set(link.url, { clicks: link.clicks, uniqueClicks: link.uniqueClicks, name: link.name });
        }
      }
    }
    return [...map.entries()]
      .map(([url, data]) => ({ url, ...data }))
      .sort((a, b) => b.clicks - a.clicks);
  })();

  const adLinks = aggregatedLinks.filter((l) => isAdLink(l.url));
  const otherLinks = aggregatedLinks.filter((l) => !isAdLink(l.url));

  /* ── Snapshot handler ───────────────────────────────── */

  const handleSaveSnapshot = useCallback(async () => {
    if (selectedCampaigns.length === 0) return;
    setSnapSaving(true);
    try {
      // Save one snapshot per selected campaign
      for (const camp of selectedCampaigns) {
        const openRate = camp.sendCount > 0 ? ((camp.uniqueOpens / camp.sendCount) * 100).toFixed(1) : "0";
        await fetch("/api/activecampaign/snapshots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaignId: camp.id,
            campaignName: camp.name,
            campaign: { sendCount: camp.sendCount, opens: camp.uniqueOpens, clicks: camp.clicks, openRate },
            links: campaignLinks[camp.id] || [],
            note: snapNote,
          }),
        });
      }
      setSnapSaved(true);
      setSnapNote("");
      setTimeout(() => setSnapSaved(false), 3000);
    } catch {
      alert("Failed to save snapshot.");
    } finally {
      setSnapSaving(false);
    }
  }, [selectedCampaigns, campaignLinks, snapNote]);

  /* ── PDF export ─────────────────────────────────────── */

  const handleExportPdf = useCallback(async () => {
    setExporting(true);
    try {
      const payload = {
        campaigns: selectedCampaigns.map((c) => ({
          id: c.id,
          name: c.name,
          sendDate: c.sendDate,
          sendCount: c.sendCount,
          totalOpens: c.totalOpens,
          uniqueOpens: c.uniqueOpens,
          clicks: c.clicks,
          uniqueClicks: c.uniqueClicks,
          unsubscribes: c.unsubscribes,
          links: campaignLinks[c.id] || [],
        })),
        aggregate,
        adLinks,
        adNames: state.ads.map((a) => a.name),
      };
      const res = await fetch("/api/activecampaign/report-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Export failed" }));
        throw new Error(errData.error || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ad-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "PDF export failed");
    } finally {
      setExporting(false);
    }
  }, [selectedCampaigns, campaignLinks, aggregate, adLinks, state.ads]);

  /* ── Render ─────────────────────────────────────────── */

  const sentCampaigns = campaigns.filter((c) => c.status === "sent");

  return (
    <div className="space-y-5">
      {/* Intro */}
      <div className="p-4 bg-pd-blue-50 rounded-lg border border-pd-blue/20">
        <p className="text-sm text-pd-blue-dark mb-0">
          <strong>Campaign Performance</strong> — Select one or more campaigns to see metrics, per-link breakdowns, and export PDF reports for clients.
        </p>
      </div>

      {/* Campaign multi-select */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Campaigns</h4>
          <div className="flex gap-2">
            <button onClick={selectAll} className="text-xs cursor-pointer hover:underline" style={{ color: "var(--pd-blue)" }}>
              Select all
            </button>
            <span className="text-xs text-pd-muted">|</span>
            <button onClick={clearSelection} className="text-xs cursor-pointer hover:underline text-pd-muted">
              Clear
            </button>
            <span className="text-xs text-pd-muted">|</span>
            <button
              onClick={fetchCampaigns}
              disabled={loading}
              className="text-xs cursor-pointer hover:underline disabled:opacity-50"
              style={{ color: "var(--pd-blue)" }}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        {sentCampaigns.length === 0 && fetched && !loading && (
          <p className="text-xs text-pd-muted py-2">No sent campaigns found in the last 30 days.</p>
        )}

        <div className="max-h-48 overflow-y-auto space-y-1 border border-pd-border rounded-lg p-2">
          {sentCampaigns.map((c) => {
            const checked = selectedIds.has(c.id);
            const dateStr = c.sendDate
              ? new Date(c.sendDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "";
            return (
              <label
                key={c.id}
                className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors text-sm ${
                  checked ? "bg-pd-blue-50 border border-pd-blue/20" : "hover:bg-slate-50 border border-transparent"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCampaign(c.id)}
                  className="accent-[#2982C4] w-4 h-4"
                />
                <span className="flex-1 truncate">{c.name}</span>
                {dateStr && <span className="text-xs text-pd-muted shrink-0">{dateStr}</span>}
              </label>
            );
          })}
        </div>

        {selectedIds.size > 0 && (
          <p className="text-xs text-pd-muted">
            {selectedIds.size} campaign{selectedIds.size !== 1 ? "s" : ""} selected
          </p>
        )}
      </div>

      {/* Results */}
      {selectedCampaigns.length > 0 && (
        <div className="space-y-4">
          {/* Aggregate metrics — always shown */}
          {selectedCampaigns.length > 1 && (
            <div>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                Combined Totals ({selectedCampaigns.length} campaigns)
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <MetricCard label="Total Sent" value={aggregate.sendCount.toLocaleString()} color="var(--pd-blue)" />
                <MetricCard label="Unique Opens" value={aggregate.uniqueOpens.toLocaleString()} sub={`${aggOpenRate}% open rate`} color="var(--pd-blue)" />
                <MetricCard label="Unique Clicks" value={aggregate.uniqueClicks.toLocaleString()} sub={`${aggCtr}% CTR`} color="var(--pd-blue)" />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <MetricCard label="Total Opens" value={aggregate.totalOpens.toLocaleString()} color="#64748b" small />
                <MetricCard label="Total Clicks" value={aggregate.clicks.toLocaleString()} color="#64748b" small />
                <MetricCard
                  label="Unsubscribes"
                  value={aggregate.unsubscribes.toLocaleString()}
                  sub={aggregate.sendCount > 0 ? `${((aggregate.unsubscribes / aggregate.sendCount) * 100).toFixed(2)}% rate` : undefined}
                  color={aggregate.unsubscribes > 0 ? "#ef4444" : "#64748b"}
                  small
                />
              </div>
            </div>
          )}

          {/* Per-campaign breakdown table */}
          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
              {selectedCampaigns.length === 1 ? "Campaign Metrics" : "Per-Campaign Breakdown"}
            </h4>
            <div className="overflow-x-auto border border-pd-border rounded-lg">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-pd-border">
                    <th className="text-left px-3 py-2 font-medium text-pd-muted">Campaign</th>
                    <th className="text-right px-2 py-2 font-medium text-pd-muted">Sent</th>
                    <th className="text-right px-2 py-2 font-medium text-pd-muted">Opens</th>
                    <th className="text-right px-2 py-2 font-medium text-pd-muted">Open%</th>
                    <th className="text-right px-2 py-2 font-medium text-pd-muted">Clicks</th>
                    <th className="text-right px-2 py-2 font-medium text-pd-muted">CTR</th>
                    <th className="text-right px-2 py-2 font-medium text-pd-muted">Unsubs</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCampaigns.map((c) => {
                    const or = c.sendCount > 0 ? ((c.uniqueOpens / c.sendCount) * 100).toFixed(1) : "0";
                    const cr = c.sendCount > 0 ? ((c.uniqueClicks / c.sendCount) * 100).toFixed(2) : "0";
                    const dateStr = c.sendDate
                      ? new Date(c.sendDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : "";
                    return (
                      <tr key={c.id} className="border-b border-pd-border/50 last:border-0 hover:bg-slate-50">
                        <td className="px-3 py-2.5">
                          <div className="font-medium text-foreground truncate max-w-[200px]">{c.name}</div>
                          {dateStr && <div className="text-pd-muted">{dateStr}</div>}
                        </td>
                        <td className="text-right px-2 py-2.5 font-medium">{c.sendCount.toLocaleString()}</td>
                        <td className="text-right px-2 py-2.5">
                          <span className="font-medium">{c.uniqueOpens.toLocaleString()}</span>
                          <span className="text-pd-muted ml-1">/ {c.totalOpens.toLocaleString()}</span>
                        </td>
                        <td className="text-right px-2 py-2.5 font-medium" style={{ color: "var(--pd-blue)" }}>{or}%</td>
                        <td className="text-right px-2 py-2.5">
                          <span className="font-medium">{c.uniqueClicks.toLocaleString()}</span>
                          <span className="text-pd-muted ml-1">/ {c.clicks.toLocaleString()}</span>
                        </td>
                        <td className="text-right px-2 py-2.5 font-medium" style={{ color: "var(--pd-blue)" }}>{cr}%</td>
                        <td className="text-right px-2 py-2.5 font-medium" style={{ color: c.unsubscribes > 0 ? "#ef4444" : undefined }}>
                          {c.unsubscribes}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Link stats */}
          {anyLinksLoading && (
            <p className="text-xs text-pd-muted">Loading link data...</p>
          )}

          {!anyLinksLoading && adLinks.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider flex items-center gap-1.5">
                Ad Link Clicks {selectedCampaigns.length > 1 && "(combined)"}
              </h4>
              <div className="space-y-1">
                {adLinks.map((link, i) => (
                  <LinkRow key={`ad-${i}`} link={link} isAd totalSent={aggregate.sendCount} />
                ))}
              </div>
            </div>
          )}

          {!anyLinksLoading && selectedIds.size > 0 && adLinks.length === 0 && aggregatedLinks.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs">
              <p className="text-amber-800">Link data loaded but no matching ad links found. Make sure your ads are set up in the Ad Builder with the correct destination URLs.</p>
            </div>
          )}

          {!anyLinksLoading && selectedIds.size > 0 && aggregatedLinks.length === 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs">
              <p className="text-amber-800">No link click data found for the selected campaign{selectedIds.size > 1 ? "s" : ""} yet. Link data may take a few hours to populate in ActiveCampaign after sending.</p>
            </div>
          )}

          {/* Action bar: Snapshot + PDF Export */}
          {!anyLinksLoading && (
            <div className="pt-3 border-t border-pd-border/60 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={snapNote}
                  onChange={(e) => setSnapNote(e.target.value)}
                  placeholder="Add a note (optional)..."
                  maxLength={80}
                  className="flex-1 px-3 py-2 border border-pd-border rounded-lg text-xs focus:outline-none focus:border-pd-blue bg-white"
                />
                <button
                  onClick={handleSaveSnapshot}
                  disabled={snapSaving || snapSaved}
                  className="px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0"
                  style={
                    snapSaved
                      ? { background: "#f0fdf4", color: "#22c55e", border: "1px solid #22c55e" }
                      : { background: "#2982C4", color: "#ffffff", border: "1px solid #2982C4" }
                  }
                >
                  {snapSaving ? "Saving..." : snapSaved ? "✓ Saved!" : "Save Snapshot"}
                </button>
              </div>

              <button
                onClick={handleExportPdf}
                disabled={exporting}
                className="w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                style={{
                  background: exporting ? "#94a3b8" : "#1e293b",
                  color: "#ffffff",
                  border: "1px solid #1e293b",
                }}
              >
                {exporting ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>Export PDF for Client</>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {selectedCampaigns.length === 0 && fetched && !loading && sentCampaigns.length > 0 && (
        <div className="text-center py-8 text-pd-muted">
          <p className="text-3xl mb-2">📊</p>
          <p className="text-sm">Check one or more campaigns above to see performance.</p>
        </div>
      )}

      {/* Ad History link */}
      <div className="text-center pt-2">
        <a href="/ad-history" className="text-xs font-medium hover:underline" style={{ color: "var(--pd-blue)" }}>
          View Ad History →
        </a>
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────── */

function MetricCard({ label, value, sub, color, small }: {
  label: string; value: string; sub?: string; color: string; small?: boolean;
}) {
  return (
    <div className="text-center p-3 bg-white rounded-lg border border-pd-border">
      <p className={`font-bold ${small ? "text-base" : "text-xl"}`} style={{ color }}>{value}</p>
      <p className="text-[10px] text-pd-muted uppercase tracking-wide mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-pd-muted mt-0.5">{sub}</p>}
    </div>
  );
}

function LinkRow({ link, isAd, totalSent }: { link: ACLinkStat; isAd: boolean; totalSent: number }) {
  const linkCtr = totalSent > 0 ? ((link.uniqueClicks / totalSent) * 100).toFixed(2) : "0";
  const displayUrl = link.url.replace(/^https?:\/\/(www\.)?/, "").slice(0, 55);

  return (
    <div
      className="flex items-center gap-2 p-2.5 rounded-lg text-xs"
      style={{
        background: isAd ? "#fef3f0" : "#ffffff",
        border: isAd ? "1px solid #ea5a39" : "1px solid #e2e8f0",
      }}
    >
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium" style={{ color: isAd ? "#ea5a39" : "#1e293b" }}>
          {isAd && "📢 "}{displayUrl}
        </p>
      </div>
      <div className="flex gap-3 shrink-0 text-right">
        <div>
          <span className="font-bold">{link.clicks}</span>
          <span className="text-pd-muted ml-1">clicks</span>
        </div>
        <div>
          <span className="font-bold">{link.uniqueClicks}</span>
          <span className="text-pd-muted ml-1">unique</span>
        </div>
        <div className="w-14">
          <span className="font-bold">{linkCtr}%</span>
          <span className="text-pd-muted ml-1">CTR</span>
        </div>
      </div>
    </div>
  );
}
