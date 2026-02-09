"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

type ColorScheme = "blue" | "warm";

const COLOR_SCHEMES: Record<ColorScheme, { accent: string; buttonBg: string; buttonText: string; headingColor: string; tagBg: string; tagText: string; borderColor: string }> = {
  blue: {
    accent: "#2982C4",
    buttonBg: "#2982C4",
    buttonText: "#ffffff",
    headingColor: "#1e293b",
    tagBg: "#e8f4fc",
    tagText: "#2982C4",
    borderColor: "#2982C4",
  },
  warm: {
    accent: "#ea5a39",
    buttonBg: "#ea5a39",
    buttonText: "#ffffff",
    headingColor: "#1e293b",
    tagBg: "#fef3f0",
    tagText: "#ea5a39",
    borderColor: "#ea5a39",
  },
};

function generateAdHtml(headline: string, copy: string, ctaUrl: string, scheme: ColorScheme): string {
  const c = COLOR_SCHEMES[scheme];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
  <tr>
    <td style="padding:0;">
      <div style="border:2px solid ${c.borderColor};border-radius:8px;overflow:hidden;background:#ffffff;">
        <div style="padding:20px 24px 16px;">
          <div style="display:inline-block;background:${c.tagBg};color:${c.tagText};font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;padding:3px 8px;border-radius:3px;margin-bottom:12px;">Sponsored</div>
          <div style="font-size:18px;font-weight:bold;color:${c.headingColor};line-height:1.3;margin-bottom:10px;">${headline}</div>
          <div style="font-size:14px;color:#4a5568;line-height:1.6;margin-bottom:16px;">${copy}</div>
          <a href="${ctaUrl}" style="display:inline-block;background:${c.buttonBg};color:${c.buttonText};font-size:14px;font-weight:bold;text-decoration:none;padding:10px 24px;border-radius:5px;">Learn more →</a>
        </div>
      </div>
    </td>
  </tr>
</table>`;
}

function AdPreviewContent() {
  const searchParams = useSearchParams();
  const [viewWidth, setViewWidth] = useState<"desktop" | "mobile">("desktop");

  const headline = searchParams.get("h") || "";
  const copy = searchParams.get("c") || "";
  const ctaUrl = searchParams.get("u") || "#";
  const scheme = (searchParams.get("s") as ColorScheme) || "blue";

  if (!headline && !copy) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "Arial, Helvetica, sans-serif" }}>
        <div style={{ textAlign: "center", color: "#64748b" }}>
          <p style={{ fontSize: "16px", marginBottom: "8px" }}>No ad preview data provided.</p>
          <p style={{ fontSize: "13px" }}>This link may be expired or incomplete.</p>
        </div>
      </div>
    );
  }

  const adHtml = generateAdHtml(headline, copy, ctaUrl, scheme);
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
            <div dangerouslySetInnerHTML={{ __html: adHtml }} />
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
