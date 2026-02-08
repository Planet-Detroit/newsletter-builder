export default function ToolNav() {
  return (
    <nav style={{ background: "#1e293b", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", height: "32px", fontFamily: "Arial, Helvetica, sans-serif" }}>
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
    </nav>
  );
}
