"use client";

import { useNewsletter } from "@/context/NewsletterContext";

export default function HeaderEditor() {
  const { state, dispatch } = useNewsletter();

  return (
    <div className="space-y-6">
      <p className="text-sm text-pd-muted">
        Configure the newsletter header. The logo and date appear at the top of every issue.
      </p>

      {/* Logo URL */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Logo Image URL
        </label>
        <input
          type="text"
          value={state.logoUrl}
          onChange={(e) => dispatch({ type: "SET_LOGO_URL", payload: e.target.value })}
          placeholder="https://planetdetroit.org/wp-content/uploads/logo.png"
          className="w-full px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue"
        />
        <p className="text-xs text-pd-muted mt-1">
          Paste the full URL to your logo image. If blank, the text &quot;PLANET DETROIT&quot; will be used.
        </p>
      </div>

      {/* Logo preview */}
      {state.logoUrl && (
        <div className="p-4 bg-slate-50 rounded-lg border border-pd-border text-center">
          <p className="text-xs text-pd-muted mb-2 uppercase tracking-wider">Preview</p>
          <div className="p-4 rounded-lg" style={{ background: "#2982C4" }}>
            <img
              src={state.logoUrl}
              alt="Logo preview"
              style={{ maxWidth: "280px", height: "auto", margin: "0 auto", display: "block" }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        </div>
      )}

      {/* Issue date */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Issue Date
        </label>
        <input
          type="date"
          value={state.issueDate}
          onChange={(e) => dispatch({ type: "SET_ISSUE_DATE", payload: e.target.value })}
          className="w-full px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue"
        />
        <p className="text-xs text-pd-muted mt-1">
          This date appears in the newsletter header and is also editable from the main dashboard.
        </p>
      </div>

      {/* Static template info */}
      <div className="p-4 bg-slate-50 rounded-lg border border-pd-border">
        <p className="text-sm text-pd-muted">
          The header template includes the logo, tagline (&quot;Environmental news for Metro Detroit&quot;), and issue date.
          It is automatically assembled in the final newsletter.
        </p>
      </div>
    </div>
  );
}
