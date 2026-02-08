"use client";

import { useNewsletter } from "@/context/NewsletterContext";

export default function SupportCtaEditor() {
  const { state, dispatch } = useNewsletter();
  const cta = state.supportCTA;

  const update = (field: "headline" | "buttonText" | "buttonUrl", value: string) => {
    dispatch({
      type: "SET_SUPPORT_CTA",
      payload: { ...cta, [field]: value },
    });
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-pd-muted">
        This appears near the bottom of the newsletter as a donation/support call-to-action.
      </p>

      {/* Headline */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Headline Text</label>
        <input
          type="text"
          value={cta.headline}
          onChange={(e) => update("headline", e.target.value)}
          className="w-full px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue"
        />
      </div>

      {/* Button Text */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Button Text</label>
        <input
          type="text"
          value={cta.buttonText}
          onChange={(e) => update("buttonText", e.target.value)}
          className="w-full px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue"
        />
      </div>

      {/* Button URL */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Button Link</label>
        <input
          type="url"
          value={cta.buttonUrl}
          onChange={(e) => update("buttonUrl", e.target.value)}
          placeholder="https://donorbox.org/..."
          className="w-full px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue"
        />
      </div>

      {/* Live Preview */}
      <div>
        <label className="block text-xs font-medium text-pd-muted uppercase tracking-wider mb-2">Preview</label>
        <div style={{ background: "#ffffff", padding: "24px", textAlign: "center", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <p style={{ color: "#1e293b", fontSize: "16px", fontWeight: "bold", margin: "0 0 12px" }}>
            {cta.headline || "Support local environmental journalism"}
          </p>
          <span
            style={{
              display: "inline-block",
              background: "#ea5a39",
              color: "#ffffff",
              padding: "12px 32px",
              fontWeight: "bold",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          >
            {cta.buttonText || "Donate to Planet Detroit"}
          </span>
        </div>
      </div>
    </div>
  );
}
