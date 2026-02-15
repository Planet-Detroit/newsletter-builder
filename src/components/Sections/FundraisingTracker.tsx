"use client";

import { useState, useCallback, useEffect } from "react";
import type { ACCampaign } from "@/types/ads";

export default function FundraisingTracker() {
  const [campaigns, setCampaigns] = useState<ACCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/activecampaign/campaigns?type=fundraising&days=180");
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

  useEffect(() => {
    if (!fetched && !loading) fetchCampaigns();
  }, [fetched, loading, fetchCampaigns]);

  const toggleCampaign = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(campaigns.map((c) => c.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const selectedCampaigns = campaigns.filter((c) => selectedIds.has(c.id));

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

  return (
    <div className="space-y-5">
      <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
        <p className="text-sm text-emerald-800 mb-0">
          <strong>Fundraiser Performance</strong> — Select campaigns to compare open rates, click rates, and unsubscribes across fundraising emails.
        </p>
      </div>

      {/* Campaign list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Fundraiser Campaigns</h4>
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

        {campaigns.length === 0 && fetched && !loading && (
          <p className="text-xs text-pd-muted py-2">No fundraiser campaigns found in the last 180 days.</p>
        )}

        {campaigns.length > 0 && (
          <div className="max-h-48 overflow-y-auto space-y-1 border border-pd-border rounded-lg p-2">
            {campaigns.map((c) => {
              const checked = selectedIds.has(c.id);
              const dateStr = c.sendDate
                ? new Date(c.sendDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "";
              return (
                <label
                  key={c.id}
                  className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors text-sm ${
                    checked ? "bg-emerald-50 border border-emerald-200" : "hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCampaign(c.id)}
                    className="accent-emerald-600 w-4 h-4"
                  />
                  <span className="flex-1 truncate">{c.name}</span>
                  {dateStr && <span className="text-xs text-pd-muted shrink-0">{dateStr}</span>}
                </label>
              );
            })}
          </div>
        )}

        {selectedIds.size > 0 && (
          <p className="text-xs text-pd-muted">
            {selectedIds.size} campaign{selectedIds.size !== 1 ? "s" : ""} selected
          </p>
        )}
      </div>

      {/* Aggregate metrics */}
      {selectedCampaigns.length > 1 && (
        <div>
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
            Combined Totals ({selectedCampaigns.length} campaigns)
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <MetricCard label="Total Sent" value={aggregate.sendCount.toLocaleString()} color="#059669" />
            <MetricCard label="Unique Opens" value={aggregate.uniqueOpens.toLocaleString()} sub={`${aggOpenRate}% open rate`} color="#059669" />
            <MetricCard label="Unique Clicks" value={aggregate.uniqueClicks.toLocaleString()} sub={`${aggCtr}% CTR`} color="#059669" />
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

      {/* Per-campaign breakdown */}
      {selectedCampaigns.length > 0 && (
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
                      <td className="text-right px-2 py-2.5 font-medium" style={{ color: "#059669" }}>{or}%</td>
                      <td className="text-right px-2 py-2.5">
                        <span className="font-medium">{c.uniqueClicks.toLocaleString()}</span>
                        <span className="text-pd-muted ml-1">/ {c.clicks.toLocaleString()}</span>
                      </td>
                      <td className="text-right px-2 py-2.5 font-medium" style={{ color: "#059669" }}>{cr}%</td>
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
      )}

      {/* Empty state */}
      {selectedCampaigns.length === 0 && fetched && !loading && campaigns.length > 0 && (
        <div className="text-center py-8 text-pd-muted">
          <p className="text-3xl mb-2">📊</p>
          <p className="text-sm">Check one or more campaigns above to see performance.</p>
        </div>
      )}
    </div>
  );
}

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
