"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useNewsletter } from "@/context/NewsletterContext";
import { generateNewsletterHTML } from "@/lib/generateNewsletterHTML";
import type { NewsletterType } from "@/types/newsletter";


export default function PreviewPage() {
  const { state } = useNewsletter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<"desktop" | "mobile">("desktop");
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  // URL param overrides persisted state — avoids race condition with Redis save
  const typeParam = searchParams.get("type") as NewsletterType | null;
  const effectiveState = typeParam && typeParam !== state.newsletterType
    ? { ...state, newsletterType: typeParam }
    : state;

  const isFundraising = effectiveState.newsletterType === "fundraising";
  const html = generateNewsletterHTML(effectiveState);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = async () => {
    setSharing(true);
    try {
      const res = await fetch("/api/share-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html }),
      });
      if (!res.ok) throw new Error("Failed to store preview");
      const { id } = await res.json();
      const url = `${window.location.origin}/newsletter-preview?id=${id}`;
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      alert("Failed to generate share link.");
    } finally {
      setSharing(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const prefix = isFundraising ? "planet-detroit-fundraising" : "planet-detroit-newsletter";
    a.download = `${prefix}-${state.issueDate || new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-pd-border bg-pd-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-pd-blue text-sm hover:underline">
              &larr; Back to Dashboard
            </a>
            <h1 className="text-lg font-bold">{isFundraising ? "Fundraising Email Preview" : "Newsletter Preview"}</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex border border-pd-border rounded-lg overflow-hidden">
              <button
                onClick={() => setView("desktop")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === "desktop" ? "bg-pd-blue text-white" : "text-pd-muted hover:bg-slate-50"}`}
              >
                Desktop
              </button>
              <button
                onClick={() => setView("mobile")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === "mobile" ? "bg-pd-blue text-white" : "text-pd-muted hover:bg-slate-50"}`}
              >
                Mobile
              </button>
            </div>
            <button
              onClick={handleShareLink}
              disabled={sharing}
              className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
              style={shareCopied
                ? { borderColor: "#22c55e", color: "#22c55e", background: "#f0fdf4" }
                : { borderColor: "#e2e8f0", color: "#64748b" }
              }
            >
              {sharing ? "Generating..." : shareCopied ? "Link copied!" : "Share preview"}
            </button>
            <button
              onClick={handleCopy}
              className="px-4 py-2 text-sm font-medium text-pd-blue border border-pd-blue rounded-lg hover:bg-pd-blue-light transition-colors"
            >
              {copied ? "Copied!" : "Copy HTML"}
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg"
              style={{ background: "var(--pd-blue)" }}
            >
              Download HTML
            </button>
          </div>
        </div>
      </header>

      {/* Preview iframe */}
      <div className="flex justify-center py-8">
        <div
          className="bg-white shadow-2xl rounded-lg overflow-hidden transition-all duration-300"
          style={{ width: view === "desktop" ? "700px" : "375px" }}
        >
          <iframe
            srcDoc={html}
            className="w-full border-0"
            style={{ height: "80vh" }}
            title="Newsletter Preview"
          />
        </div>
      </div>
    </div>
  );
}
