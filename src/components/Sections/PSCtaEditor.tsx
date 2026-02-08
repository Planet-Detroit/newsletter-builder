"use client";

import { useNewsletter } from "@/context/NewsletterContext";
import MiniWysiwyg from "./MiniWysiwyg";

interface Props {
  field: "psCTA";
  label: string;
  placeholder: string;
}

export default function PSCtaEditor({ field, label, placeholder }: Props) {
  const { state, dispatch } = useNewsletter();

  const value = state[field];
  const sectionStatus = state.sections.find((s) => s.id === "ps-cta")?.status;

  const handleChange = (html: string) => {
    if (field === "psCTA") {
      dispatch({ type: "SET_PS_CTA", payload: html });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
        <MiniWysiwyg
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          minHeight="80px"
        />
      </div>

      {/* CTA Button Settings */}
      <div className="border border-pd-border rounded-lg p-4 bg-slate-50/60 space-y-3">
        <label className="block text-sm font-medium text-foreground">CTA Button</label>

        <div>
          <label className="block text-xs text-pd-muted mb-1">Button Text</label>
          <input
            type="text"
            value={state.psCtaButtonText}
            onChange={(e) => dispatch({ type: "SET_PS_CTA_BUTTON_TEXT", payload: e.target.value })}
            placeholder="Support Planet Detroit"
            className="w-full px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue"
          />
        </div>

        <div>
          <label className="block text-xs text-pd-muted mb-1">Button Link</label>
          <input
            type="url"
            value={state.psCtaUrl}
            onChange={(e) => dispatch({ type: "SET_PS_CTA_URL", payload: e.target.value })}
            placeholder="https://donorbox.org/..."
            className="w-full px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue"
          />
        </div>

        {/* Preview */}
        <div>
          <label className="block text-xs text-pd-muted mb-1">Preview</label>
          <div style={{ textAlign: "center", padding: "12px", background: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <span
              style={{
                display: "inline-block",
                background: "#ea5a39",
                color: "#ffffff",
                padding: "10px 24px",
                fontWeight: "bold",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            >
              {state.psCtaButtonText || "Support Planet Detroit"}
            </span>
          </div>
        </div>
      </div>

      {value && (
        <button
          onClick={() =>
            dispatch({
              type: "UPDATE_SECTION_STATUS",
              payload: { id: "ps-cta", status: sectionStatus === "ready" ? "needs_attention" : "ready" },
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
      )}
    </div>
  );
}
