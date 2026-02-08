"use client";

import { useState } from "react";
import { useNewsletter } from "@/context/NewsletterContext";
import MiniWysiwyg from "./MiniWysiwyg";

export default function FeaturedPromoEditor() {
  const { state, dispatch } = useNewsletter();
  const promo = state.featuredPromo;
  const sectionStatus = state.sections.find((s) => s.id === "featured")?.status;

  const [headline, setHeadline] = useState(promo?.headline || "");
  const [description, setDescription] = useState(promo?.description || "");
  const [imageUrl, setImageUrl] = useState(promo?.imageUrl || "");
  const [ctaText, setCtaText] = useState(promo?.ctaText || "Learn More");
  const [ctaUrl, setCtaUrl] = useState(promo?.ctaUrl || "");

  const hasContent = headline.trim() || description.trim();

  const savePromo = () => {
    if (!hasContent) return;
    dispatch({
      type: "SET_FEATURED_PROMO",
      payload: {
        headline: headline.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim(),
        ctaText: ctaText.trim() || "Learn More",
        ctaUrl: ctaUrl.trim(),
      },
    });
    dispatch({ type: "UPDATE_SECTION_STATUS", payload: { id: "featured", status: "needs_attention" } });
  };

  const clearPromo = () => {
    setHeadline("");
    setDescription("");
    setImageUrl("");
    setCtaText("Learn More");
    setCtaUrl("");
    dispatch({ type: "SET_FEATURED_PROMO", payload: null });
    dispatch({ type: "UPDATE_SECTION_STATUS", payload: { id: "featured", status: "empty" } });
  };

  const toggleReady = () => {
    if (sectionStatus === "ready") {
      dispatch({ type: "UPDATE_SECTION_STATUS", payload: { id: "featured", status: "needs_attention" } });
    } else {
      savePromo();
      dispatch({ type: "UPDATE_SECTION_STATUS", payload: { id: "featured", status: "ready" } });
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-pd-muted">
        Use this for special announcements like the Neighborhood Reporting Lab, events, fundraising campaigns, or partner highlights.
        Leave blank to skip this section in the newsletter.
      </p>

      {/* Headline */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Headline</label>
        <input
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          onBlur={savePromo}
          placeholder="e.g., Neighborhood Reporting Lab: Apply Now!"
          className="w-full px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Description</label>
        <MiniWysiwyg
          value={description}
          onChange={(html) => { setDescription(html); }}
          placeholder="A short description of the promo (1-3 sentences)..."
          minHeight="80px"
        />
      </div>

      {/* Image URL */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Image URL (optional)</label>
        <input
          type="text"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          onBlur={savePromo}
          placeholder="https://planetdetroit.org/wp-content/uploads/..."
          className="w-full px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue"
        />
        {imageUrl && (
          <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-pd-border">
            <img
              src={imageUrl}
              alt="Promo preview"
              className="max-w-full h-auto rounded"
              style={{ maxHeight: "160px" }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Button Text</label>
          <input
            type="text"
            value={ctaText}
            onChange={(e) => setCtaText(e.target.value)}
            onBlur={savePromo}
            placeholder="Learn More"
            className="w-full px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Button Link</label>
          <input
            type="text"
            value={ctaUrl}
            onChange={(e) => setCtaUrl(e.target.value)}
            onBlur={savePromo}
            placeholder="https://planetdetroit.org/..."
            className="w-full px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue"
          />
        </div>
      </div>

      {/* Preview */}
      {hasContent && (
        <div className="p-4 bg-slate-50 rounded-lg border border-pd-border">
          <p className="text-xs text-pd-muted mb-2 uppercase tracking-wider">Preview</p>
          <div className="bg-white rounded-lg border border-pd-border overflow-hidden">
            {imageUrl && (
              <img
                src={imageUrl}
                alt=""
                className="w-full h-auto"
                style={{ maxHeight: "200px", objectFit: "cover" }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
            <div className="p-4">
              <h3 className="font-bold text-foreground text-base mb-1">{headline}</h3>
              <p className="text-sm text-pd-muted mb-3">{description}</p>
              {ctaUrl && (
                <span
                  className="inline-block px-4 py-2 text-sm font-medium text-white rounded-md"
                  style={{ background: "var(--pd-blue)" }}
                >
                  {ctaText || "Learn More"}
                </span>
              )}
            </div>
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
