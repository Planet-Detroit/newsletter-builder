"use client";

import { useState, useMemo, useCallback } from "react";
import { useNewsletter } from "@/context/NewsletterContext";
import { AdSlot } from "@/types/newsletter";

interface ACCampaign {
  id: string;
  name: string;
  sendDate: string | null;
  status: string;
  sendCount: number;
  opens: number;
  clicks: number;
}

interface ACLinkStat {
  url: string;
  name: string;
  clicks: number;
  uniqueClicks: number;
}

const POSITIONS = [
  { value: "after-intro" as const, label: "After Intro" },
  { value: "after-pd-stories" as const, label: "After PD Stories" },
  { value: "after-reading" as const, label: "After What We're Reading" },
  { value: "before-footer" as const, label: "Before Footer" },
];

type ColorScheme = "blue" | "warm";

const COLOR_SCHEMES: Record<ColorScheme, { name: string; accent: string; buttonBg: string; buttonText: string; headingColor: string; tagBg: string; tagText: string; borderColor: string }> = {
  blue: {
    name: "PD Blue",
    accent: "#2982C4",
    buttonBg: "#2982C4",
    buttonText: "#ffffff",
    headingColor: "#1e293b",
    tagBg: "#e8f4fc",
    tagText: "#2982C4",
    borderColor: "#2982C4",
  },
  warm: {
    name: "PD Orange",
    accent: "#ea5a39",
    buttonBg: "#ea5a39",
    buttonText: "#ffffff",
    headingColor: "#1e293b",
    tagBg: "#fef3f0",
    tagText: "#ea5a39",
    borderColor: "#ea5a39",
  },
};

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function addUtmParams(url: string, headline: string): string {
  if (!url || url === "#") return url;
  try {
    const u = new URL(url);
    if (!u.searchParams.has("utm_source")) u.searchParams.set("utm_source", "newsletter");
    if (!u.searchParams.has("utm_medium")) u.searchParams.set("utm_medium", "email");
    if (!u.searchParams.has("utm_campaign")) u.searchParams.set("utm_campaign", "planet-detroit-newsletter");
    if (!u.searchParams.has("utm_content")) u.searchParams.set("utm_content", headline.slice(0, 40).replace(/\s+/g, "-").toLowerCase());
    return u.toString();
  } catch {
    return url;
  }
}

function generateAdHtml(headline: string, copy: string, ctaUrl: string, scheme: ColorScheme): string {
  const c = COLOR_SCHEMES[scheme];
  const trackedUrl = addUtmParams(ctaUrl, headline);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
  <tr>
    <td style="padding:0;">
      <div style="border:2px solid ${c.borderColor};border-radius:8px;overflow:hidden;background:#ffffff;">
        <div style="padding:20px 24px 16px;">
          <div style="display:inline-block;background:${c.tagBg};color:${c.tagText};font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;padding:3px 8px;border-radius:3px;margin-bottom:12px;">Sponsored</div>
          <div style="font-size:18px;font-weight:bold;color:${c.headingColor};line-height:1.3;margin-bottom:10px;">${headline}</div>
          <div style="font-size:14px;color:#4a5568;line-height:1.6;margin-bottom:16px;">${copy}</div>
          <a href="${trackedUrl}" style="display:inline-block;background:${c.buttonBg};color:${c.buttonText};font-size:14px;font-weight:bold;text-decoration:none;padding:10px 24px;border-radius:5px;">Learn more →</a>
        </div>
      </div>
    </td>
  </tr>
</table>`;
}

export default function AdManager() {
  const { state, dispatch } = useNewsletter();
  const sectionStatus = state.sections.find((s) => s.id === "ads")?.status;

  // Builder state
  const [headline, setHeadline] = useState("");
  const [copy, setCopy] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [colorScheme, setColorScheme] = useState<ColorScheme>("blue");
  const [position, setPosition] = useState<AdSlot["position"]>("after-intro");
  const [adName, setAdName] = useState("");

  // Generated HTML (editable)
  const [editedHtml, setEditedHtml] = useState("");
  const [showHtmlEditor, setShowHtmlEditor] = useState(false);

  // ActiveCampaign tracking state
  const [acCampaigns, setAcCampaigns] = useState<ACCampaign[]>([]);
  const [acLoading, setAcLoading] = useState(false);
  const [acError, setAcError] = useState<string | null>(null);
  const [acFetched, setAcFetched] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [linkStats, setLinkStats] = useState<ACLinkStat[]>([]);
  const [linksLoading, setLinksLoading] = useState(false);
  const [showTracker, setShowTracker] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    setAcLoading(true);
    setAcError(null);
    try {
      const res = await fetch("/api/activecampaign/campaigns");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed (${res.status})`);
      }
      const data = await res.json();
      setAcCampaigns(data.campaigns || []);
      setAcFetched(true);
    } catch (err) {
      setAcError(err instanceof Error ? err.message : "Failed to load campaigns");
    } finally {
      setAcLoading(false);
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

  // Live-generate HTML from inputs
  const generatedHtml = useMemo(
    () => generateAdHtml(headline, copy, ctaUrl || "#", colorScheme),
    [headline, copy, ctaUrl, colorScheme]
  );

  // Use edited HTML if user has modified it, otherwise use generated
  const activeHtml = showHtmlEditor && editedHtml ? editedHtml : generatedHtml;

  // Share link
  const [linkCopied, setLinkCopied] = useState(false);

  const headlineWords = countWords(headline);
  const copyWords = countWords(copy);
  const isValid = headline.trim() && copy.trim();

  const getShareUrl = () => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const params = new URLSearchParams({
      h: headline,
      c: copy,
      u: ctaUrl || "#",
      s: colorScheme,
    });
    return `${base}/ad-preview?${params.toString()}`;
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = getShareUrl();
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleGenerateHtml = () => {
    setEditedHtml(generatedHtml);
    setShowHtmlEditor(true);
  };

  const addToNewsletter = () => {
    const name = adName.trim() || `Ad — ${headline.slice(0, 30)}`;
    const ad: AdSlot = {
      id: `ad-${Date.now()}`,
      name,
      htmlContent: activeHtml,
      position,
      active: true,
    };
    dispatch({ type: "SET_ADS", payload: [...state.ads, ad] });
    // Reset builder
    setHeadline("");
    setCopy("");
    setCtaUrl("");
    setAdName("");
    setEditedHtml("");
    setShowHtmlEditor(false);
  };

  const toggleAd = (id: string) => {
    const updated = state.ads.map((a) => (a.id === id ? { ...a, active: !a.active } : a));
    dispatch({ type: "SET_ADS", payload: updated });
  };

  const removeAd = (id: string) => {
    dispatch({ type: "SET_ADS", payload: state.ads.filter((a) => a.id !== id) });
  };

  return (
    <div className="space-y-5">
      {/* ── Ad Builder ─────────────────────────────────────── */}
      <div className="p-4 bg-pd-blue-50 rounded-lg border border-pd-blue/20">
        <p className="text-sm text-pd-blue-dark mb-1"><strong>Ad Builder</strong> — Enter the ad details below and pick a color scheme. A mobile-friendly email ad will be generated automatically.</p>
      </div>

      <div className="space-y-3">
        {/* Headline */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-foreground">Headline</label>
            <span className={`text-xs ${headlineWords > 16 ? "text-pd-danger font-medium" : "text-pd-muted"}`}>
              {headlineWords}/16 words
            </span>
          </div>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Detroit seniors: Two research opportunities now enrolling"
            className="w-full px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue"
          />
        </div>

        {/* Copy */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-foreground">Copy</label>
            <span className={`text-xs ${copyWords > 50 ? "text-pd-danger font-medium" : "text-pd-muted"}`}>
              {copyWords}/50 words
            </span>
          </div>
          <textarea
            value={copy}
            onChange={(e) => setCopy(e.target.value)}
            placeholder="Write the ad body copy here..."
            rows={4}
            className="w-full px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue resize-y"
          />
        </div>

        {/* CTA URL */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">CTA Link</label>
          <input
            type="url"
            value={ctaUrl}
            onChange={(e) => setCtaUrl(e.target.value)}
            placeholder="https://planetdetroit.org"
            className="w-full px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue"
          />
        </div>

        {/* Color Scheme */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Color Scheme</label>
          <div className="flex gap-3">
            {(Object.keys(COLOR_SCHEMES) as ColorScheme[]).map((key) => {
              const scheme = COLOR_SCHEMES[key];
              const selected = colorScheme === key;
              return (
                <button
                  key={key}
                  onClick={() => setColorScheme(key)}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all cursor-pointer ${selected ? "ring-1" : "opacity-70 hover:opacity-100"}`}
                  style={{ borderColor: selected ? scheme.accent : "#e2e8f0" }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 rounded-full" style={{ background: scheme.accent }} />
                    <span className="text-sm font-medium">{scheme.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="h-2 flex-1 rounded" style={{ background: scheme.accent }} />
                    <div className="h-2 flex-1 rounded bg-slate-200" />
                    <div className="h-2 w-8 rounded" style={{ background: scheme.accent, opacity: 0.5 }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Live Preview ─────────────────────────────────── */}
      {isValid && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">Preview</h4>
            <button
              onClick={copyShareLink}
              className="text-xs px-3 py-1 rounded-lg border transition-colors cursor-pointer"
              style={linkCopied
                ? { borderColor: "var(--pd-success)", color: "var(--pd-success)", background: "#f0fdf4" }
                : { borderColor: "var(--pd-border)", color: "var(--pd-blue)" }
              }
            >
              {linkCopied ? "Link copied!" : "Copy share link"}
            </button>
          </div>
          <div
            className="bg-white border border-pd-border rounded-lg p-4 overflow-hidden"
            style={{ maxWidth: "600px" }}
          >
            <div dangerouslySetInnerHTML={{ __html: activeHtml }} />
          </div>
        </div>
      )}

      {/* ── HTML Editor ──────────────────────────────────── */}
      {isValid && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">HTML Output</h4>
            <button
              onClick={() => {
                if (!showHtmlEditor) handleGenerateHtml();
                else setShowHtmlEditor(false);
              }}
              className="text-xs text-pd-blue hover:underline cursor-pointer"
            >
              {showHtmlEditor ? "Hide HTML" : "View & edit HTML"}
            </button>
          </div>
          {showHtmlEditor && (
            <textarea
              value={editedHtml}
              onChange={(e) => setEditedHtml(e.target.value)}
              rows={12}
              className="w-full px-3 py-2 border border-pd-border rounded-lg text-xs focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue font-mono resize-y"
            />
          )}
        </div>
      )}

      {/* ── Add to Newsletter ────────────────────────────── */}
      {isValid && (
        <div className="p-4 border border-pd-border rounded-lg space-y-3 bg-slate-50">
          <h4 className="text-sm font-medium text-foreground">Add to Newsletter</h4>
          <input
            type="text"
            value={adName}
            onChange={(e) => setAdName(e.target.value)}
            placeholder="Ad name (e.g., Revival Research — Feb 2026)"
            className="w-full px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue bg-white"
          />
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value as AdSlot["position"])}
            className="w-full px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue bg-white"
          >
            {POSITIONS.map((pos) => (
              <option key={pos.value} value={pos.value}>{pos.label}</option>
            ))}
          </select>
          <button
            onClick={addToNewsletter}
            className="w-full px-4 py-2.5 text-sm font-medium text-white rounded-lg cursor-pointer transition-colors"
            style={{ background: "var(--pd-blue)" }}
          >
            Add Ad to Newsletter
          </button>
        </div>
      )}

      {/* ── Active Ad Slots ──────────────────────────────── */}
      {state.ads.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Active Ad Slots</h4>
          {state.ads.map((ad) => (
            <div key={ad.id} className="flex items-center justify-between p-3 border border-pd-border rounded-lg">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleAd(ad.id)}
                  className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${ad.active ? "bg-pd-blue" : "bg-slate-300"}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${ad.active ? "translate-x-5" : ""}`} />
                </button>
                <div>
                  <p className="text-sm font-medium">{ad.name}</p>
                  <p className="text-xs text-pd-muted">
                    {POSITIONS.find((p) => p.value === ad.position)?.label}
                  </p>
                </div>
              </div>
              <button onClick={() => removeAd(ad.id)} className="text-pd-danger text-xs hover:underline cursor-pointer">
                Remove
              </button>
            </div>
          ))}

          <button
            onClick={() =>
              dispatch({
                type: "UPDATE_SECTION_STATUS",
                payload: { id: "ads", status: sectionStatus === "ready" ? "needs_attention" : "ready" },
              })
            }
            className="w-full px-4 py-2 text-sm font-medium rounded-lg border-2 transition-colors cursor-pointer"
            style={
              sectionStatus === "ready"
                ? { borderColor: "var(--pd-success)", background: "var(--pd-success)", color: "#fff" }
                : { borderColor: "var(--pd-success)", color: "var(--pd-success)" }
            }
          >
            {sectionStatus === "ready" ? "✓ Ready — click to unmark" : "Mark as Ready"}
          </button>
        </div>
      )}

      {/* ── Ad Performance Tracker ─────────────────────── */}
      <div className="border-t border-pd-border pt-5">
        <button
          onClick={() => {
            setShowTracker(!showTracker);
            if (!acFetched && !showTracker) fetchCampaigns();
          }}
          className="flex items-center gap-2 text-sm font-medium cursor-pointer"
          style={{ color: "var(--pd-blue)" }}
        >
          <span style={{ fontSize: "16px" }}>📊</span>
          {showTracker ? "Hide" : "Show"} Ad Performance Tracker
        </button>

        {showTracker && (
          <div className="mt-3 space-y-3">
            <div className="p-4 bg-slate-50 rounded-lg border border-pd-border">
              <p className="text-xs text-pd-muted mb-3">
                Select an ActiveCampaign campaign to see link click data. Match ad CTA URLs to see how each ad performed.
              </p>

              {acError && (
                <p className="text-xs text-red-600 mb-2">{acError}</p>
              )}

              <div className="flex gap-2">
                <select
                  value={selectedCampaignId}
                  onChange={(e) => {
                    setSelectedCampaignId(e.target.value);
                    if (e.target.value) fetchLinkStats(e.target.value);
                  }}
                  className="flex-1 px-3 py-2 border border-pd-border rounded-lg text-sm bg-white focus:outline-none focus:border-pd-blue"
                  disabled={acLoading}
                >
                  <option value="">
                    {acLoading ? "Loading campaigns..." : acFetched ? "Select a campaign" : "Click to load campaigns"}
                  </option>
                  {acCampaigns.filter((c) => c.status === "sent").map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.sendDate ? ` — ${new Date(c.sendDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}
                    </option>
                  ))}
                </select>
                <button
                  onClick={fetchCampaigns}
                  disabled={acLoading}
                  className="px-3 py-2 text-xs font-medium border border-pd-border rounded-lg hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {acLoading ? "..." : "↻"}
                </button>
              </div>

              {/* Campaign summary */}
              {selectedCampaignId && (() => {
                const camp = acCampaigns.find((c) => c.id === selectedCampaignId);
                if (!camp) return null;
                const openRate = camp.sendCount > 0 ? ((camp.opens / camp.sendCount) * 100).toFixed(1) : "0";
                return (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-white rounded-lg border border-pd-border">
                      <p className="text-lg font-bold" style={{ color: "var(--pd-blue)" }}>{camp.sendCount.toLocaleString()}</p>
                      <p className="text-[10px] text-pd-muted uppercase">Sent</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded-lg border border-pd-border">
                      <p className="text-lg font-bold" style={{ color: "var(--pd-blue)" }}>{openRate}%</p>
                      <p className="text-[10px] text-pd-muted uppercase">Open Rate</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded-lg border border-pd-border">
                      <p className="text-lg font-bold" style={{ color: "var(--pd-blue)" }}>{camp.clicks.toLocaleString()}</p>
                      <p className="text-[10px] text-pd-muted uppercase">Total Clicks</p>
                    </div>
                  </div>
                );
              })()}

              {/* Link stats table */}
              {linksLoading && (
                <p className="text-xs text-pd-muted mt-3">Loading link data...</p>
              )}

              {!linksLoading && linkStats.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-xs font-medium text-foreground mb-2 uppercase tracking-wider">Link Clicks</h5>
                  <div className="space-y-1">
                    {linkStats.map((link, i) => {
                      // Check if this link matches any ad CTA
                      const matchesAd = state.ads.some((ad) => {
                        const match = ad.htmlContent.match(/href="([^"]+)"/);
                        return match && link.url.includes(match[1].replace(/&amp;/g, "&"));
                      });
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-2 p-2 rounded-lg text-xs"
                          style={{
                            background: matchesAd ? "#fef3f0" : "#ffffff",
                            border: matchesAd ? "1px solid #ea5a39" : "1px solid #e2e8f0",
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="truncate font-medium" style={{ color: matchesAd ? "#ea5a39" : "#1e293b" }}>
                              {matchesAd && "📢 "}
                              {link.url.replace(/^https?:\/\/(www\.)?/, "").slice(0, 60)}
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
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {!linksLoading && selectedCampaignId && linkStats.length === 0 && (
                <p className="text-xs text-pd-muted mt-3">No link click data found for this campaign yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
