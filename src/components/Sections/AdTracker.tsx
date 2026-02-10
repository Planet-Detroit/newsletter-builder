"use client";

import { useState, useCallback } from "react";
import { useNewsletter } from "@/context/NewsletterContext";
import type { ACCampaign, ACLinkStat } from "@/types/ads";

export default function AdTracker() {
  const { state } = useNewsletter();

  // Campaign data
  const [campaigns, setCampaigns] = useState<ACCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  // Selected campaign
  const [selectedId, setSelectedId] = useState<string>("");

  // Link stats
  const [linkStats, setLinkStats] = useState<ACLinkStat[]>([]);
  const [linksLoading, setLinksLoading] = useState(false);

  // Snapshot
  const [snapNote, setSnapNote] = useState("");
  const [snapSaving, setSnapSaving] = useState(false);
  const [snapSaved, setSnapSaved] = useState(false);

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
    setLinksLoading(true);
    setLinkStats([]);
    try {
      const res = await fetch(`/api/activecampaign/link-stats?campaignId=${campaignId}`);
      if (!res.ok) throw new Error("Failed to fetch link stats");
      const data = await res.json();
      setLinkStats(data.links || []);
    } catch {
      setLinkStats([]);
    } finally {
      setLinksLoading(false);
    }
  }, []);

  const handleSaveSnapshot = useCallback(async () => {
    const camp = campaigns.find((c) => c.id === selectedId);
    if (!camp) return;
    setSnapSaving(true);
    try {
      const openRate = camp.sendCount > 0 ? ((camp.uniqueOpens / camp.sendCount) * 100).toFixed(1) : "0";
      const res = await fetch("/api/activecampaign/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: camp.id,
          campaignName: camp.name,
          campaign: { sendCount: camp.sendCount, opens: camp.uniqueOpens, clicks: camp.clicks, openRate },
          links: linkStats,
          note: snapNote,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSnapSaved(true);
      setSnapNote("");
      setTimeout(() => setSnapSaved(false), 3000);
    } catch {
      alert("Failed to save snapshot.");
    } finally {
      setSnapSaving(false);
    }
  }, [campaigns, selectedId, linkStats, snapNote]);

  // Auto-fetch on first render
  if (!fetched && !loading) {
    fetchCampaigns();
  }

  const selected = campaigns.find((c) => c.id === selectedId);

  // Compute derived metrics
  const openRate = selected && selected.sendCount > 0
    ? ((selected.uniqueOpens / selected.sendCount) * 100).toFixed(1)
    : "0";
  const ctr = selected && selected.sendCount > 0
    ? ((selected.uniqueClicks / selected.sendCount) * 100).toFixed(2)
    : "0";

  // Identify which links match ads in the current newsletter
  const isAdLink = (url: string): boolean => {
    return state.ads.some((ad) => {
      // Extract all hrefs from the ad HTML
      const hrefMatches = ad.htmlContent.matchAll(/href="([^"]+)"/g);
      for (const match of hrefMatches) {
        const adUrl = match[1].replace(/&amp;/g, "&");
        // Strip UTM params for comparison
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

  // Separate ad links from other links
  const adLinks = linkStats.filter((l) => isAdLink(l.url));
  const otherLinks = linkStats.filter((l) => !isAdLink(l.url));

  return (
    <div className="space-y-5">
      {/* Intro */}
      <div className="p-4 bg-pd-blue-50 rounded-lg border border-pd-blue/20">
        <p className="text-sm text-pd-blue-dark mb-0">
          <strong>Campaign Performance</strong> — Select a recently sent campaign to see full metrics and per-link breakdowns. Ad links are highlighted automatically.
        </p>
      </div>

      {/* Campaign Selector */}
      <div className="space-y-3">
        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}

        <div className="flex gap-2">
          <select
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              if (e.target.value) fetchLinkStats(e.target.value);
            }}
            className="flex-1 px-3 py-2 border border-pd-border rounded-lg text-sm bg-white focus:outline-none focus:border-pd-blue"
            disabled={loading}
          >
            <option value="">
              {loading ? "Loading campaigns..." : fetched ? "Select a campaign" : "Loading..."}
            </option>
            {campaigns.filter((c) => c.status === "sent").map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.sendDate ? ` — ${new Date(c.sendDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}
              </option>
            ))}
          </select>
          <button
            onClick={fetchCampaigns}
            disabled={loading}
            className="px-3 py-2 text-xs font-medium border border-pd-border rounded-lg hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? "..." : "↻"}
          </button>
        </div>
      </div>

      {/* Metrics Dashboard */}
      {selected && (
        <div className="space-y-4">
          {/* Primary metrics row */}
          <div className="grid grid-cols-3 gap-2">
            <MetricCard label="Sent" value={selected.sendCount.toLocaleString()} color="var(--pd-blue)" />
            <MetricCard
              label="Unique Opens"
              value={selected.uniqueOpens.toLocaleString()}
              sub={`${openRate}% open rate`}
              color="var(--pd-blue)"
            />
            <MetricCard
              label="Unique Clicks"
              value={selected.uniqueClicks.toLocaleString()}
              sub={`${ctr}% CTR`}
              color="var(--pd-blue)"
            />
          </div>

          {/* Secondary metrics row */}
          <div className="grid grid-cols-3 gap-2">
            <MetricCard
              label="Total Opens"
              value={selected.totalOpens.toLocaleString()}
              sub={selected.uniqueOpens > 0
                ? `${(selected.totalOpens / selected.uniqueOpens).toFixed(1)}× per reader`
                : undefined}
              color="#64748b"
              small
            />
            <MetricCard
              label="Total Clicks"
              value={selected.clicks.toLocaleString()}
              color="#64748b"
              small
            />
            <MetricCard
              label="Unsubscribes"
              value={selected.unsubscribes.toLocaleString()}
              sub={selected.sendCount > 0
                ? `${((selected.unsubscribes / selected.sendCount) * 100).toFixed(2)}% rate`
                : undefined}
              color={selected.unsubscribes > 0 ? "#ef4444" : "#64748b"}
              small
            />
          </div>

          {/* Ad Link Performance */}
          {linksLoading && (
            <p className="text-xs text-pd-muted">Loading link data...</p>
          )}

          {!linksLoading && adLinks.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <span>📢</span> Ad Link Clicks
              </h4>
              <div className="space-y-1">
                {adLinks.map((link, i) => (
                  <LinkRow key={`ad-${i}`} link={link} isAd totalSent={selected.sendCount} />
                ))}
              </div>
            </div>
          )}

          {/* All Other Links */}
          {!linksLoading && otherLinks.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">
                All Link Clicks
              </h4>
              <div className="space-y-1">
                {otherLinks.map((link, i) => (
                  <LinkRow key={`link-${i}`} link={link} isAd={false} totalSent={selected.sendCount} />
                ))}
              </div>
            </div>
          )}

          {!linksLoading && selectedId && linkStats.length === 0 && (
            <p className="text-xs text-pd-muted">No link click data found for this campaign yet.</p>
          )}

          {/* Save Snapshot */}
          {!linksLoading && (
            <div className="pt-3 border-t border-pd-border/60">
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
            </div>
          )}
        </div>
      )}

      {/* No campaign selected — show prompt */}
      {!selected && fetched && !loading && (
        <div className="text-center py-8 text-pd-muted">
          <p className="text-3xl mb-2">📊</p>
          <p className="text-sm">Select a campaign above to see performance metrics.</p>
        </div>
      )}

      {/* Ad History link */}
      <div className="text-center pt-2">
        <a
          href="/ad-history"
          className="text-xs font-medium hover:underline"
          style={{ color: "var(--pd-blue)" }}
        >
          View Ad History →
        </a>
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────── */

function MetricCard({
  label,
  value,
  sub,
  color,
  small,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
  small?: boolean;
}) {
  return (
    <div className="text-center p-3 bg-white rounded-lg border border-pd-border">
      <p
        className={`font-bold ${small ? "text-base" : "text-xl"}`}
        style={{ color }}
      >
        {value}
      </p>
      <p className="text-[10px] text-pd-muted uppercase tracking-wide mt-0.5">{label}</p>
      {sub && (
        <p className="text-[10px] text-pd-muted mt-0.5">{sub}</p>
      )}
    </div>
  );
}

function LinkRow({
  link,
  isAd,
  totalSent,
}: {
  link: ACLinkStat;
  isAd: boolean;
  totalSent: number;
}) {
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
          {isAd && "📢 "}
          {displayUrl}
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
