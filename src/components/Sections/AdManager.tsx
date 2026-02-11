"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNewsletter } from "@/context/NewsletterContext";
import { AdSlot, SavedAd } from "@/types/newsletter";
import MiniWysiwyg from "./MiniWysiwyg";

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

interface AdHtmlOptions {
  headline: string;
  copy: string;
  ctaUrl: string;
  ctaText: string;
  ctaUrl2: string;
  ctaText2: string;
  scheme: ColorScheme;
  imageUrl: string;
}

function generateAdHtml(opts: AdHtmlOptions): string {
  const { headline, copy, ctaUrl, ctaText, ctaUrl2, ctaText2, scheme, imageUrl } = opts;
  const c = COLOR_SCHEMES[scheme];
  const trackedUrl = addUtmParams(ctaUrl, headline);
  const trackedUrl2 = ctaUrl2 ? addUtmParams(ctaUrl2, headline) : "";
  const hasTwoCtas = ctaUrl2.trim() && ctaText2.trim();

  // Image block (goes above headline/body)
  const imageBlock = imageUrl.trim()
    ? `<div style="margin-bottom:0;"><img src="${imageUrl}" alt="" style="width:100%;max-width:970px;height:auto;display:block;border-radius:8px 8px 0 0;" /></div>`
    : "";

  // CTA button(s)
  let ctaBlock = "";
  if (hasTwoCtas) {
    // Two buttons: side-by-side on desktop, stacked center on narrow screens
    // Using a table-based layout for email compatibility
    ctaBlock = `<!--[if mso]>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
<td style="padding-right:8px;"><![endif]-->
<div style="display:inline-block;margin:4px;">
  <a href="${trackedUrl}" style="display:inline-block;background:${c.buttonBg};color:${c.buttonText};font-size:14px;font-weight:bold;text-decoration:none;padding:10px 24px;border-radius:5px;white-space:nowrap;">${ctaText || "Learn more →"}</a>
</div>
<!--[if mso]></td><td><![endif]-->
<div style="display:inline-block;margin:4px;">
  <a href="${trackedUrl2}" style="display:inline-block;background:${c.buttonBg};color:${c.buttonText};font-size:14px;font-weight:bold;text-decoration:none;padding:10px 24px;border-radius:5px;white-space:nowrap;">${ctaText2}</a>
</div>
<!--[if mso]></td></tr></table><![endif]-->`;
  } else {
    ctaBlock = `<a href="${trackedUrl}" style="display:inline-block;background:${c.buttonBg};color:${c.buttonText};font-size:14px;font-weight:bold;text-decoration:none;padding:10px 24px;border-radius:5px;">${ctaText || "Learn more →"}</a>`;
  }

  // If there's an image, use rounded top corners on image, no rounding on text area top
  const borderTopRadius = imageUrl.trim() ? "0" : "8px";

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
  <tr>
    <td style="padding:0;">
      <div style="border:2px solid ${c.borderColor};border-radius:8px;overflow:hidden;background:#ffffff;">
        ${imageBlock}
        <div style="padding:20px 24px 16px;border-radius:0 0 ${borderTopRadius} ${borderTopRadius};">
          <div style="display:inline-block;background:${c.tagBg};color:${c.tagText};font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;padding:3px 8px;border-radius:3px;margin-bottom:12px;">Sponsored</div>
          <div style="font-size:18px;font-weight:bold;color:${c.headingColor};line-height:1.3;margin-bottom:10px;">${headline}</div>
          <div style="font-size:14px;color:#4a5568;line-height:1.6;margin-bottom:16px;">${copy}</div>
          <div style="text-align:center;">
            ${ctaBlock}
          </div>
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
  const [ctaText, setCtaText] = useState("Learn more →");
  const [ctaUrl2, setCtaUrl2] = useState("");
  const [ctaText2, setCtaText2] = useState("");
  const [showSecondCta, setShowSecondCta] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [colorScheme, setColorScheme] = useState<ColorScheme>("blue");
  const [position, setPosition] = useState<AdSlot["position"]>("after-intro");
  const [adName, setAdName] = useState("");
  const [editorNote, setEditorNote] = useState("");

  // Image upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Saved ads library
  const [savedAds, setSavedAds] = useState<SavedAd[]>([]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [editingLibraryId, setEditingLibraryId] = useState<string | null>(null);
  const [savingToLibrary, setSavingToLibrary] = useState(false);

  const fetchSavedAds = useCallback(async () => {
    setLibraryLoading(true);
    try {
      const res = await fetch("/api/ads-library");
      if (res.ok) {
        const data = await res.json();
        setSavedAds(data.ads || []);
      }
    } catch {
      // Silently fail — library is a convenience feature
    } finally {
      setLibraryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedAds();
  }, [fetchSavedAds]);

  const handleImageUpload = useCallback(async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("alt_text", headline || "Ad image");
      const res = await fetch("/api/wordpress/media", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Upload failed (${res.status})`);
      }
      const data = await res.json();
      // Use the full-size URL from WordPress
      setImageUrl(data.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [headline]);

  // Generated HTML (editable)
  const [editedHtml, setEditedHtml] = useState("");
  const [showHtmlEditor, setShowHtmlEditor] = useState(false);


  // Live-generate HTML from inputs
  const generatedHtml = useMemo(
    () => generateAdHtml({
      headline,
      copy,
      ctaUrl: ctaUrl || "#",
      ctaText,
      ctaUrl2: showSecondCta ? ctaUrl2 : "",
      ctaText2: showSecondCta ? ctaText2 : "",
      scheme: colorScheme,
      imageUrl,
    }),
    [headline, copy, ctaUrl, ctaText, ctaUrl2, ctaText2, showSecondCta, colorScheme, imageUrl]
  );

  // Use edited HTML if user has modified it, otherwise use generated
  const activeHtml = showHtmlEditor && editedHtml ? editedHtml : generatedHtml;

  // Share link
  const [linkCopied, setLinkCopied] = useState(false);

  const headlineWords = countWords(headline);
  // Strip HTML tags before counting words (copy is now HTML from WYSIWYG)
  const copyPlainText = copy.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ");
  const copyWords = countWords(copyPlainText);
  const isValid = headline.trim() || copyPlainText.trim() || imageUrl.trim() || (ctaUrl.trim() && ctaUrl !== "#");

  const getShareUrl = () => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const params = new URLSearchParams({
      h: headline,
      c: copy,
      u: ctaUrl || "#",
      ct: ctaText,
      s: colorScheme,
      ...(imageUrl ? { img: imageUrl } : {}),
      ...(showSecondCta && ctaUrl2 ? { u2: ctaUrl2, ct2: ctaText2 } : {}),
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

  const resetBuilder = () => {
    setHeadline("");
    setCopy("");
    setCtaUrl("");
    setCtaText("Learn more →");
    setCtaUrl2("");
    setCtaText2("");
    setShowSecondCta(false);
    setImageUrl("");
    setAdName("");
    setEditorNote("");
    setEditedHtml("");
    setShowHtmlEditor(false);
    setEditingLibraryId(null);
  };

  const addToNewsletter = () => {
    const name = adName.trim() || `Ad — ${headline.slice(0, 30)}`;
    const ad: AdSlot = {
      id: `ad-${Date.now()}`,
      name,
      htmlContent: activeHtml,
      position,
      active: true,
      ...(editorNote.trim() ? { editorNote: editorNote.trim() } : {}),
    };
    dispatch({ type: "SET_ADS", payload: [...state.ads, ad] });
    resetBuilder();
  };

  const saveToLibrary = async () => {
    setSavingToLibrary(true);
    try {
      const ad = {
        name: adName.trim() || `Ad — ${headline.slice(0, 30)}`,
        editorNote: editorNote.trim(),
        headline,
        copy,
        ctaUrl: ctaUrl || "#",
        ctaText,
        ctaUrl2: showSecondCta ? ctaUrl2 : "",
        ctaText2: showSecondCta ? ctaText2 : "",
        colorScheme,
        imageUrl,
        htmlContent: activeHtml,
        position,
      };
      const res = await fetch("/api/ads-library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad, id: editingLibraryId || undefined }),
      });
      if (res.ok) {
        await fetchSavedAds();
        if (!editingLibraryId) resetBuilder();
        setEditingLibraryId(null);
      }
    } catch {
      // Silently fail
    } finally {
      setSavingToLibrary(false);
    }
  };

  const loadFromLibrary = (saved: SavedAd) => {
    const ad: AdSlot = {
      id: `ad-${Date.now()}`,
      name: saved.name,
      htmlContent: saved.htmlContent,
      position: saved.position,
      active: true,
      ...(saved.editorNote ? { editorNote: saved.editorNote } : {}),
    };
    dispatch({ type: "SET_ADS", payload: [...state.ads, ad] });
  };

  const editFromLibrary = (saved: SavedAd) => {
    setHeadline(saved.headline);
    setCopy(saved.copy);
    setCtaUrl(saved.ctaUrl === "#" ? "" : saved.ctaUrl);
    setCtaText(saved.ctaText);
    setCtaUrl2(saved.ctaUrl2);
    setCtaText2(saved.ctaText2);
    setShowSecondCta(!!(saved.ctaUrl2 && saved.ctaText2));
    setImageUrl(saved.imageUrl);
    setColorScheme(saved.colorScheme);
    setPosition(saved.position);
    setAdName(saved.name);
    setEditorNote(saved.editorNote);
    setEditingLibraryId(saved.id);
    setEditedHtml("");
    setShowHtmlEditor(false);
  };

  const deleteFromLibrary = async (id: string) => {
    try {
      const res = await fetch(`/api/ads-library?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        setSavedAds((prev) => prev.filter((a) => a.id !== id));
        if (editingLibraryId === id) setEditingLibraryId(null);
      }
    } catch {
      // Silently fail
    }
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
        {/* Ad Image */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-foreground">Ad Image <span className="text-pd-muted font-normal">(optional)</span></label>
            <span className="text-xs text-pd-muted">
              970 × 350px recommended
              {" · "}
              <a href="https://planetdetroit.org/wp-admin/upload.php" target="_blank" rel="noopener noreferrer" className="text-pd-blue hover:underline">WP Media Library</a>
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/ad-banner.jpg"
              className="flex-1 px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-3 py-2 text-sm font-medium border border-pd-border rounded-lg transition-colors cursor-pointer shrink-0 hover:bg-slate-50 disabled:opacity-50"
              style={{ color: "var(--pd-blue)" }}
              title="Upload to WordPress"
            >
              {uploading ? (
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Uploading…
                </span>
              ) : (
                "Upload to WP"
              )}
            </button>
          </div>
          {uploadError && (
            <p className="text-xs text-pd-danger mt-1">{uploadError}</p>
          )}
          {imageUrl.trim() && (
            <div className="mt-2 rounded-lg overflow-hidden border border-pd-border bg-slate-50 relative" style={{ maxWidth: "100%" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Ad preview"
                style={{ width: "100%", height: "auto", display: "block", maxHeight: "200px", objectFit: "contain" }}
                onError={(e) => { (e.currentTarget.style.display = "none"); }}
              />
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-white/90 border border-pd-border text-pd-muted hover:text-pd-danger hover:border-pd-danger transition-colors cursor-pointer text-xs"
                title="Remove image"
              >
                ✕
              </button>
            </div>
          )}
        </div>

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

        {/* Copy (WYSIWYG) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-foreground">Body Copy</label>
            <span className={`text-xs ${copyWords > 50 ? "text-pd-danger font-medium" : "text-pd-muted"}`}>
              {copyWords}/50 words
            </span>
          </div>
          <MiniWysiwyg
            value={copy}
            onChange={setCopy}
            placeholder="Write the ad body copy here... (links, bold, italic supported)"
            minHeight="80px"
            showLink={true}
            showEmoji={false}
          />
        </div>

        {/* Primary CTA */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Primary CTA</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              placeholder="Learn more →"
              className="w-1/3 px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue"
            />
            <input
              type="url"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              placeholder="https://planetdetroit.org"
              className="flex-1 px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue"
            />
          </div>
        </div>

        {/* Second CTA toggle + fields */}
        <div>
          <button
            type="button"
            onClick={() => setShowSecondCta(!showSecondCta)}
            className="text-xs font-medium cursor-pointer hover:underline"
            style={{ color: "var(--pd-blue)" }}
          >
            {showSecondCta ? "− Remove second CTA" : "+ Add second CTA button"}
          </button>
          {showSecondCta && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={ctaText2}
                onChange={(e) => setCtaText2(e.target.value)}
                placeholder="Button text"
                className="w-1/3 px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue"
              />
              <input
                type="url"
                value={ctaUrl2}
                onChange={(e) => setCtaUrl2(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue"
              />
            </div>
          )}
          {showSecondCta && (
            <p className="text-xs text-pd-muted mt-1">Buttons will sit side-by-side when there&apos;s room, and stack vertically on narrow screens.</p>
          )}
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
          <div>
            <textarea
              value={editorNote}
              onChange={(e) => setEditorNote(e.target.value)}
              placeholder="Internal note (e.g., 'Run through March', 'Dustin handles billing')"
              rows={2}
              className="w-full px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue bg-white resize-y"
            />
            <p className="text-xs text-pd-muted mt-1">This note is for editors only and will not appear in the newsletter.</p>
          </div>
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
          <button
            onClick={saveToLibrary}
            disabled={savingToLibrary}
            className="w-full px-4 py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-colors border-2 disabled:opacity-50"
            style={{ borderColor: "var(--pd-blue)", color: "var(--pd-blue)" }}
          >
            {savingToLibrary
              ? "Saving…"
              : editingLibraryId
                ? "Update in Library"
                : "Save to Library"}
          </button>
          {editingLibraryId && (
            <button
              onClick={resetBuilder}
              className="w-full px-4 py-2 text-xs text-pd-muted hover:underline cursor-pointer"
            >
              Cancel editing &mdash; clear builder
            </button>
          )}
        </div>
      )}

      {/* ── Saved Ads Library ────────────────────────────── */}
      <div className="border border-pd-border rounded-lg overflow-hidden">
        <button
          onClick={() => setLibraryOpen(!libraryOpen)}
          className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <span className="text-sm font-medium text-foreground">
            Saved Ads Library
            {savedAds.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-pd-blue text-white">
                {savedAds.length}
              </span>
            )}
          </span>
          <span className="text-pd-muted text-xs">{libraryOpen ? "▲" : "▼"}</span>
        </button>

        {libraryOpen && (
          <div className="p-3 space-y-2 border-t border-pd-border">
            {libraryLoading && (
              <p className="text-xs text-pd-muted py-2 text-center">Loading saved ads…</p>
            )}
            {!libraryLoading && savedAds.length === 0 && (
              <p className="text-xs text-pd-muted py-2 text-center">No saved ads yet. Build an ad above and click &quot;Save to Library&quot; to reuse it across newsletters.</p>
            )}
            {savedAds.map((saved) => (
              <div key={saved.id} className="p-3 border border-pd-border rounded-lg bg-white">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{saved.name}</p>
                    <p className="text-xs text-pd-muted">
                      {POSITIONS.find((p) => p.value === saved.position)?.label}
                      {" · "}
                      {new Date(saved.updatedAt).toLocaleDateString()}
                    </p>
                    {saved.editorNote && (
                      <p className="text-xs italic mt-1" style={{ color: "#b45309" }}>{saved.editorNote}</p>
                    )}
                  </div>
                  <div
                    className="w-3 h-3 rounded-full shrink-0 mt-1"
                    style={{ background: COLOR_SCHEMES[saved.colorScheme]?.accent || "#ccc" }}
                    title={COLOR_SCHEMES[saved.colorScheme]?.name}
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => loadFromLibrary(saved)}
                    className="flex-1 px-2 py-1.5 text-xs font-medium rounded border transition-colors cursor-pointer hover:bg-slate-50"
                    style={{ borderColor: "var(--pd-blue)", color: "var(--pd-blue)" }}
                  >
                    Load into Newsletter
                  </button>
                  <button
                    onClick={() => editFromLibrary(saved)}
                    className="px-2 py-1.5 text-xs font-medium rounded border border-pd-border text-pd-muted hover:text-foreground hover:border-slate-400 transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteFromLibrary(saved.id)}
                    className="px-2 py-1.5 text-xs font-medium rounded border border-pd-border text-pd-danger hover:bg-red-50 hover:border-pd-danger transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
                  {ad.editorNote && (
                    <p className="text-xs italic mt-0.5" style={{ color: "#b45309" }}>{ad.editorNote}</p>
                  )}
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

    </div>
  );
}
