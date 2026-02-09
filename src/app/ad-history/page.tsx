"use client";

import { useState, useEffect } from "react";
import type { AdPerformanceSnapshot } from "@/types/ads";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function generateCSV(snap: AdPerformanceSnapshot): string {
  const rows: string[] = [];
  rows.push("Planet Detroit — Ad Performance Report");
  rows.push(`Campaign,${snap.campaignName}`);
  rows.push(`Snapshot Date,${formatDate(snap.savedAt)}`);
  if (snap.note) rows.push(`Note,${snap.note}`);
  rows.push("");
  rows.push("CAMPAIGN SUMMARY");
  rows.push(`Emails Sent,${snap.campaign.sendCount}`);
  rows.push(`Unique Opens,${snap.campaign.opens}`);
  rows.push(`Open Rate,${snap.campaign.openRate}%`);
  rows.push(`Total Link Clicks,${snap.campaign.clicks}`);
  rows.push("");
  rows.push("LINK PERFORMANCE");
  rows.push("URL,Total Clicks,Unique Clicks");
  for (const link of snap.links) {
    rows.push(`"${link.url}",${link.clicks},${link.uniqueClicks}`);
  }
  return rows.join("\n");
}

function downloadCSV(snap: AdPerformanceSnapshot) {
  const csv = generateCSV(snap);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const datePart = snap.savedAt.slice(0, 10);
  const namePart = snap.campaignName.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 30);
  a.download = `ad-report-${namePart}-${datePart}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdHistoryPage() {
  const [snapshots, setSnapshots] = useState<AdPerformanceSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCampaign, setFilterCampaign] = useState<string>("");

  useEffect(() => {
    fetch("/api/activecampaign/snapshots")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load snapshots");
        return res.json();
      })
      .then((data) => setSnapshots(data.snapshots || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this snapshot?")) return;
    try {
      const res = await fetch(`/api/activecampaign/snapshots?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setSnapshots((prev) => prev.filter((s) => s.id !== id));
    } catch {
      alert("Failed to delete snapshot.");
    }
  };

  // Unique campaign names for filter
  const campaignNames = [...new Set(snapshots.map((s) => s.campaignName))].sort();
  const filtered = filterCampaign
    ? snapshots.filter((s) => s.campaignName === filterCampaign)
    : snapshots;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "Arial, Helvetica, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#1e293b", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <a href="/" style={{ color: "#94a3b8", fontSize: "13px", textDecoration: "none" }}>&larr; Dashboard</a>
          <span style={{ color: "#475569" }}>|</span>
          <span style={{ fontSize: "16px", fontWeight: "bold", color: "#ffffff" }}>Ad Performance History</span>
        </div>
        <span style={{ fontSize: "12px", color: "#94a3b8" }}>
          {snapshots.length} snapshot{snapshots.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px 20px" }}>
        {/* Filter */}
        {campaignNames.length > 1 && (
          <div style={{ marginBottom: "20px" }}>
            <select
              value={filterCampaign}
              onChange={(e) => setFilterCampaign(e.target.value)}
              style={{
                padding: "8px 12px",
                fontSize: "13px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                background: "#ffffff",
                color: "#1e293b",
                width: "100%",
                maxWidth: "400px",
              }}
            >
              <option value="">All campaigns</option>
              {campaignNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        )}

        {loading && (
          <p style={{ color: "#94a3b8", fontSize: "14px", textAlign: "center", padding: "40px 0" }}>
            Loading snapshots...
          </p>
        )}

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px" }}>
            <p style={{ color: "#dc2626", fontSize: "13px" }}>{error}</p>
          </div>
        )}

        {!loading && filtered.length === 0 && !error && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
            <p style={{ fontSize: "16px", marginBottom: "8px" }}>No snapshots yet</p>
            <p style={{ fontSize: "13px" }}>
              Go to the Ads panel, open the Ad Performance Tracker, select a campaign, and click &quot;Save Snapshot.&quot;
            </p>
          </div>
        )}

        {/* Snapshot cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filtered.map((snap) => {
            const isExpanded = expandedId === snap.id;
            return (
              <div
                key={snap.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
                {/* Card header */}
                <div
                  style={{
                    padding: "16px 20px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : snap.id)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
                        {snap.campaignName}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                      {formatDate(snap.savedAt)}
                      {snap.note && <span style={{ marginLeft: "8px", color: "#64748b" }}>— {snap.note}</span>}
                    </div>
                  </div>

                  {/* Quick stats */}
                  <div style={{ display: "flex", gap: "16px", marginLeft: "16px", flexShrink: 0 }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "16px", fontWeight: 700, color: "#2982C4" }}>{snap.campaign.openRate}%</div>
                      <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase" }}>Opens</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "16px", fontWeight: 700, color: "#2982C4" }}>{snap.campaign.clicks}</div>
                      <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase" }}>Clicks</div>
                    </div>
                    <div style={{ fontSize: "18px", color: "#cbd5e1", alignSelf: "center" }}>
                      {isExpanded ? "▾" : "▸"}
                    </div>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{ borderTop: "1px solid #f1f5f9", padding: "16px 20px", background: "#fafbfc" }}>
                    {/* Summary row */}
                    <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                      {[
                        { label: "Sent", value: snap.campaign.sendCount.toLocaleString() },
                        { label: "Opens", value: `${snap.campaign.opens.toLocaleString()} (${snap.campaign.openRate}%)` },
                        { label: "Clicks", value: snap.campaign.clicks.toLocaleString() },
                        { label: "Links Tracked", value: String(snap.links.length) },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          style={{
                            flex: 1,
                            textAlign: "center",
                            padding: "8px",
                            background: "#ffffff",
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          <div style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>{stat.value}</div>
                          <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", marginTop: "2px" }}>{stat.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Link table */}
                    {snap.links.length > 0 && (
                      <div style={{ marginBottom: "12px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                          Link Performance
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {snap.links.map((link, i) => (
                            <div
                              key={i}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "6px 10px",
                                background: "#ffffff",
                                borderRadius: "6px",
                                border: "1px solid #e2e8f0",
                                fontSize: "12px",
                              }}
                            >
                              <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#334155" }}>
                                {link.url.replace(/^https?:\/\/(www\.)?/, "").slice(0, 60)}
                              </span>
                              <div style={{ display: "flex", gap: "12px", marginLeft: "12px", flexShrink: 0 }}>
                                <span><strong>{link.clicks}</strong> clicks</span>
                                <span><strong>{link.uniqueClicks}</strong> unique</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); downloadCSV(snap); }}
                        style={{
                          padding: "6px 14px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#2982C4",
                          background: "#ffffff",
                          border: "1px solid #2982C4",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        Download CSV
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(snap.id); }}
                        style={{
                          padding: "6px 14px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#ef4444",
                          background: "#ffffff",
                          border: "1px solid #fca5a5",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
