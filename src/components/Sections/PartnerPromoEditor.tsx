"use client";

import { useState } from "react";
import DOMPurify from "dompurify";
import { useNewsletter } from "@/context/NewsletterContext";
import MiniWysiwyg from "./MiniWysiwyg";

export default function PartnerPromoEditor() {
  const { state, dispatch } = useNewsletter();
  const promo = state.partnerPromo;
  const sectionStatus = state.sections.find((s) => s.id === "partner-promo")?.status;

  const [title, setTitle] = useState(promo?.title || "");
  const [bodyHtml, setBodyHtml] = useState(promo?.bodyHtml || "");
  const [ctaText, setCtaText] = useState(promo?.ctaText || "");
  const [ctaUrl, setCtaUrl] = useState(promo?.ctaUrl || "");

  const hasContent = title.trim() || bodyHtml.replace(/<[^>]*>/g, "").trim();

  const savePromo = () => {
    if (!hasContent) return;
    dispatch({
      type: "SET_PARTNER_PROMO",
      payload: {
        title: title.trim(),
        bodyHtml,
        ctaText: ctaText.trim(),
        ctaUrl: ctaUrl.trim(),
      },
    });
    dispatch({ type: "UPDATE_SECTION_STATUS", payload: { id: "partner-promo", status: "needs_attention" } });
  };

  const clearPromo = () => {
    setTitle("");
    setBodyHtml("");
    setCtaText("");
    setCtaUrl("");
    dispatch({ type: "SET_PARTNER_PROMO", payload: null });
    dispatch({ type: "UPDATE_SECTION_STATUS", payload: { id: "partner-promo", status: "empty" } });
  };

  const toggleReady = () => {
    if (sectionStatus === "ready") {
      dispatch({ type: "UPDATE_SECTION_STATUS", payload: { id: "partner-promo", status: "needs_attention" } });
    } else {
      savePromo();
      dispatch({ type: "UPDATE_SECTION_STATUS", payload: { id: "partner-promo", status: "ready" } });
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-pd-muted">
        Add a partner or sponsor promotion that appears just above the footer. Include images, text, and an optional call-to-action button.
        Leave blank to skip this section.
      </p>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={savePromo}
          placeholder="e.g., From Our Partners"
          className="w-full px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue"
        />
      </div>

      {/* Body — WYSIWYG for image + text */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Content</label>
        <p className="text-xs text-pd-muted mb-2">
          Paste images and text here. You can paste an image URL or drag-and-drop images directly.
        </p>
        <MiniWysiwyg
          value={bodyHtml}
          onChange={(html) => { setBodyHtml(html); }}
          placeholder="Partner promo content — paste images, text, and links..."
          minHeight="150px"
          showLink={true}
        />
      </div>

      {/* Optional CTA Button */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          CTA Button <span className="text-pd-muted font-normal">(optional)</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={ctaText}
            onChange={(e) => setCtaText(e.target.value)}
            onBlur={savePromo}
            placeholder="Button text, e.g., Learn More"
            className="w-full px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue"
          />
          <input
            type="text"
            value={ctaUrl}
            onChange={(e) => setCtaUrl(e.target.value)}
            onBlur={savePromo}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue"
          />
        </div>
      </div>

      {/* Preview */}
      {hasContent && (
        <div className="p-4 bg-slate-50 rounded-lg border border-pd-border">
          <p className="text-xs text-pd-muted mb-2 uppercase tracking-wider">Preview</p>
          <div className="bg-white rounded-lg border border-pd-border overflow-hidden p-4">
            {title && <h3 className="font-bold text-foreground text-base mb-2">{title}</h3>}
            <div
              className="text-sm text-pd-muted prose prose-sm max-w-none mb-3 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bodyHtml, { ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'img', 'h3', 'h4'], ALLOWED_ATTR: ['href', 'src', 'alt', 'target', 'rel', 'class'] }) }}
            />
            {ctaUrl && ctaText && (
              <span
                className="inline-block px-4 py-2 text-sm font-medium text-white rounded-md"
                style={{ background: "var(--pd-blue)" }}
              >
                {ctaText}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {hasContent && (
          <>
            <button
              onClick={toggleReady}
              className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border-2 transition-colors cursor-pointer"
              style={
                sectionStatus === "ready"
                  ? { borderColor: "var(--pd-success)", background: "var(--pd-success)", color: "#fff" }
                  : { borderColor: "var(--pd-success)", color: "var(--pd-success)" }
              }
            >
              {sectionStatus === "ready" ? "✓ Ready — click to unmark" : "Mark as Ready"}
            </button>
            <button
              onClick={clearPromo}
              className="px-4 py-2 text-sm font-medium text-pd-muted border border-pd-border rounded-lg hover:border-red-300 hover:text-red-500 transition-colors cursor-pointer"
            >
              Clear
            </button>
          </>
        )}
      </div>
    </div>
  );
}
