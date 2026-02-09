"use client";

import { useState, useEffect } from "react";

async function decompressFromHash(hash: string): Promise<string> {
  const base64 = decodeURIComponent(hash);
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate"));
  return await new Response(stream).text();
}

export default function NewsletterPreviewPage() {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [viewWidth, setViewWidth] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) {
      setError(true);
      return;
    }
    decompressFromHash(hash)
      .then(setHtml)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "Arial, Helvetica, sans-serif" }}>
        <div style={{ textAlign: "center", color: "#64748b" }}>
          <p style={{ fontSize: "16px", marginBottom: "8px" }}>No newsletter preview data found.</p>
          <p style={{ fontSize: "13px" }}>This link may be expired or incomplete.</p>
        </div>
      </div>
    );
  }

  if (!html) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "Arial, Helvetica, sans-serif" }}>
        <p style={{ color: "#94a3b8", fontSize: "14px" }}>Loading preview...</p>
      </div>
    );
  }

  const previewWidth = viewWidth === "desktop" ? "700px" : "375px";

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "Arial, Helvetica, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#1e293b", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <span style={{ fontSize: "16px", fontWeight: "bold", color: "#ffffff" }}>Planet Detroit</span>
          <span style={{ fontSize: "12px", color: "#94a3b8", marginLeft: "12px" }}>Newsletter Preview</span>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          <button
            onClick={() => setViewWidth("desktop")}
            style={{
              padding: "4px 12px",
              fontSize: "12px",
              fontWeight: viewWidth === "desktop" ? "600" : "400",
              color: viewWidth === "desktop" ? "#ffffff" : "#94a3b8",
              background: viewWidth === "desktop" ? "#2982C4" : "transparent",
              border: "1px solid",
              borderColor: viewWidth === "desktop" ? "#2982C4" : "#475569",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Desktop
          </button>
          <button
            onClick={() => setViewWidth("mobile")}
            style={{
              padding: "4px 12px",
              fontSize: "12px",
              fontWeight: viewWidth === "mobile" ? "600" : "400",
              color: viewWidth === "mobile" ? "#ffffff" : "#94a3b8",
              background: viewWidth === "mobile" ? "#2982C4" : "transparent",
              border: "1px solid",
              borderColor: viewWidth === "mobile" ? "#2982C4" : "#475569",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Mobile
          </button>
        </div>
      </div>

      {/* Newsletter iframe */}
      <div style={{ display: "flex", justifyContent: "center", padding: "32px 20px" }}>
        <div
          style={{
            width: previewWidth,
            maxWidth: "100%",
            background: "#ffffff",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            overflow: "hidden",
            transition: "width 0.3s ease",
          }}
        >
          <iframe
            srcDoc={html}
            style={{ width: "100%", height: "85vh", border: "none" }}
            title="Newsletter Preview"
          />
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "0 20px 32px" }}>
        <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>
          Planet Detroit — Local environmental news for Detroit and Michigan
        </p>
      </div>
    </div>
  );
}
