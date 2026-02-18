"use client";

export default function ToolNav() {
  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <nav style={{ background: "#1e293b", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", height: "32px", fontFamily: "Arial, Helvetica, sans-serif", position: "relative" }}>
      <span style={{ fontSize: "11px", color: "#94a3b8", letterSpacing: "0.5px", marginRight: "12px", textTransform: "uppercase", fontWeight: "bold" }}>
        PD Tools
      </span>
      <a
        href="https://news-brief-generator.vercel.app/"
        style={{ fontSize: "12px", color: "#94a3b8", textDecoration: "none", padding: "4px 10px", borderRadius: "4px", transition: "color 0.15s" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
      >
        Brief Generator
      </a>
      <span style={{ color: "#475569", fontSize: "10px" }}>/</span>
      <span
        style={{ fontSize: "12px", color: "#ffffff", padding: "4px 10px", borderRadius: "4px", fontWeight: "600" }}
      >
        Newsletter Builder
      </span>
      <span style={{ color: "#475569", fontSize: "10px" }}>/</span>
      <a
        href="https://civic-action-builder.vercel.app/"
        style={{ fontSize: "12px", color: "#94a3b8", textDecoration: "none", padding: "4px 10px", borderRadius: "4px", transition: "color 0.15s" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
      >
        Civic Action
      </a>
      <button
        onClick={handleSignOut}
        style={{ position: "absolute", right: "16px", fontSize: "11px", color: "#64748b", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", transition: "color 0.15s", fontFamily: "inherit" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#94a3b8")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
      >
        Sign out
      </button>
    </nav>
  );
}
