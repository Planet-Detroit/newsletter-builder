"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import DOMPurify from "dompurify";

function AdPreviewContent() {
  const searchParams = useSearchParams();
  const [viewWidth, setViewWidth] = useState<"desktop" | "mobile">("desktop");
  const [adHtml, setAdHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewId = searchParams.get("id");

  // Load from Redis if we have an id
  useEffect(() => {
    if (!previewId) return;
    setLoading(true);
    fetch(`/api/share-preview?id=${encodeURIComponent(previewId)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Preview not found or expired");
        return res.json();
      })
      .then((data) => setAdHtml(data.html))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [previewId]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "Arial, Helvetica, sans-serif" }}>
        <p style={{ color: "#94a3b8", fontSize: "14px" }}>Loading preview...</p>
      </div>
    );
  }

  if (error || (!previewId && !adHtml)) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "Arial, Helvetica, sans-serif" }}>
        <div style={{ textAlign: "center", color: "#64748b" }}>
          <p style={{ fontSize: "16px", marginBottom: "8px" }}>No ad preview data provided.</p>
          <p style={{ fontSize: "13px" }}>This link may be expired or incomplete.</p>
        </div>
      </div>
    );
  }

  if (!adHtml) return null;

  const previewMaxWidth = viewWidth === "desktop" ? "600px" : "375px";

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "Arial, Helvetica, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#1e293b", padding: "16px 24px", textAlign: "center" }}>
        <div style={{ fontSize: "18px", fontWeight: "bold", color: "#ffffff", marginBottom: "4px" }}>
          Planet Detroit
        </div>
        <div style={{ fontSize: "12px", color: "#94a3b8" }}>
          Sponsored Content Preview
        </div>
      </div>

      {/* Controls */}
      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "16px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            Preview of how your ad will appear in the Planet Detroit newsletter
          </p>
          <div style={{ display: "flex", gap: "4px" }}>
            <button
              onClick={() => setViewWidth("desktop")}
              style={{
                padding: "4px 12px",
                fontSize: "12px",
                fontWeight: viewWidth === "desktop" ? "600" : "400",
                color: viewWidth === "desktop" ? "#ffffff" : "#64748b",
                background: viewWidth === "desktop" ? "#1e293b" : "#e2e8f0",
                border: "none",
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
                color: viewWidth === "mobile" ? "#ffffff" : "#64748b",
                background: viewWidth === "mobile" ? "#1e293b" : "#e2e8f0",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Mobile
            </button>
          </div>
        </div>
      </div>

      {/* Email simulation */}
      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "0 20px 40px" }}>
        <div
          style={{
            maxWidth: previewMaxWidth,
            margin: "0 auto",
            background: "#ffffff",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            overflow: "hidden",
            transition: "max-width 0.3s ease",
          }}
        >
          {/* Simulated newsletter context above the ad */}
          <div style={{ padding: "24px 32px", borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ height: "10px", background: "#e2e8f0", borderRadius: "5px", width: "60%", marginBottom: "12px" }} />
            <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "4px", width: "100%", marginBottom: "6px" }} />
            <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "4px", width: "90%", marginBottom: "6px" }} />
            <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "4px", width: "75%" }} />
          </div>

          {/* The actual ad */}
          <div style={{ padding: "16px 32px" }}>
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(adHtml) }} />
          </div>

          {/* Simulated newsletter context below the ad */}
          <div style={{ padding: "24px 32px", borderTop: "1px solid #e2e8f0" }}>
            <div style={{ height: "10px", background: "#e2e8f0", borderRadius: "5px", width: "50%", marginBottom: "12px" }} />
            <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "4px", width: "100%", marginBottom: "6px" }} />
            <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "4px", width: "85%" }} />
          </div>
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

export default function AdPreviewPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <p style={{ color: "#94a3b8", fontSize: "14px" }}>Loading preview...</p>
      </div>
    }>
      <AdPreviewContent />
    </Suspense>
  );
}
