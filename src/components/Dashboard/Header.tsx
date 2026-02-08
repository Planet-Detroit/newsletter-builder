"use client";

import { useNewsletter } from "@/context/NewsletterContext";
import { generateNewsletterHTML } from "@/lib/generateNewsletterHTML";
import { useState } from "react";

export default function Header() {
  const { state, dispatch } = useNewsletter();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<{ success?: boolean; message?: string; url?: string } | null>(null);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleReset = () => {
    localStorage.removeItem("pd-newsletter-draft");
    dispatch({ type: "RESET" });
    setShowResetConfirm(false);
  };

  const handleGenerate = async () => {
    if (!state.subjectLine) {
      setGenResult({ success: false, message: "Set a subject line first (Editor's Letter section)." });
      return;
    }

    setGenerating(true);
    setGenResult(null);

    try {
      const html = generateNewsletterHTML(state);

      const res = await fetch("/api/activecampaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html,
          subjectLine: state.subjectLine,
          issueDate: state.issueDate,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `API returned ${res.status}`);
      }

      setGenResult({
        success: true,
        message: `Draft campaign created: ${data.campaignName}`,
        url: data.campaignUrl,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate newsletter";
      setGenResult({ success: false, message: msg });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <header className="border-b border-pd-border bg-pd-card">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
              style={{ background: "var(--pd-blue)" }}
            >
              PD
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Newsletter Builder
              </h1>
              <p className="text-sm text-pd-muted">{today}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {state.lastSaved && (
              <span className="text-xs text-pd-muted">
                Saved {new Date(state.lastSaved).toLocaleTimeString()}
              </span>
            )}
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-3 py-2 text-sm font-medium text-pd-muted border border-pd-border rounded-lg hover:border-red-300 hover:text-red-600 transition-colors"
              >
                New Issue
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-600">Clear everything?</span>
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Yes, reset
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3 py-1.5 text-sm font-medium text-pd-muted border border-pd-border rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
            <a
              href="/preview"
              className="px-4 py-2 text-sm font-medium text-pd-blue border border-pd-blue rounded-lg hover:bg-pd-blue-light transition-colors"
            >
              Preview
            </a>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-60"
              style={{ background: generating ? "var(--pd-muted)" : "var(--pd-blue)" }}
            >
              {generating ? "Pushing to AC..." : "Generate Newsletter"}
            </button>
          </div>
        </div>
        {/* Result banner */}
        {genResult && (
          <div
            className={`mt-3 px-4 py-2 rounded-lg text-sm flex items-center justify-between ${
              genResult.success
                ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            <span>{genResult.message}</span>
            <div className="flex items-center gap-2">
              {genResult.url && (
                <a
                  href={genResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium underline"
                >
                  Open in ActiveCampaign
                </a>
              )}
              <button onClick={() => setGenResult(null)} className="text-xs opacity-60 hover:opacity-100 ml-2">
                dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
