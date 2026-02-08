"use client";

import { useState } from "react";
import { useNewsletter } from "@/context/NewsletterContext";
import { generateNewsletterHTML } from "@/lib/generateNewsletterHTML";

export default function PreviewPage() {
  const { state } = useNewsletter();
  const [view, setView] = useState<"desktop" | "mobile">("desktop");
  const [copied, setCopied] = useState(false);

  const html = generateNewsletterHTML(state);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `planet-detroit-newsletter-${state.issueDate || new Date().toISOString().slice(0, 10)}.html`;
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
            <h1 className="text-lg font-bold">Newsletter Preview</h1>
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
