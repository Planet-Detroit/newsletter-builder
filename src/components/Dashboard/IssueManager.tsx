"use client";

import { useState, useEffect, useRef } from "react";
import { useNewsletter } from "@/context/NewsletterContext";
import { NewsletterState } from "@/types/newsletter";

interface SavedIssue {
  key: string;
  date: string;
  subjectLine: string;
  savedAt: string;
  sectionsReady: number;
  sectionsTotal: number;
}

const ISSUE_PREFIX = "pd-issue-";

function listSavedIssues(): SavedIssue[] {
  const issues: SavedIssue[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(ISSUE_PREFIX)) continue;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed: NewsletterState = JSON.parse(raw);
      issues.push({
        key,
        date: parsed.issueDate || key.replace(ISSUE_PREFIX, ""),
        subjectLine: parsed.subjectLine || "(no subject)",
        savedAt: parsed.lastSaved || "",
        sectionsReady: parsed.sections?.filter((s) => s.status === "ready").length ?? 0,
        sectionsTotal: parsed.sections?.length ?? 0,
      });
    } catch {
      // skip corrupt entries
    }
  }
  return issues.sort((a, b) => b.date.localeCompare(a.date));
}

export default function IssueManager() {
  const { state, dispatch } = useNewsletter();
  const [open, setOpen] = useState(false);
  const [issues, setIssues] = useState<SavedIssue[]>([]);
  const [justSaved, setJustSaved] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Refresh list when panel opens
  useEffect(() => {
    if (open) setIssues(listSavedIssues());
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSave = () => {
    const key = `${ISSUE_PREFIX}${state.issueDate}`;
    const toSave = { ...state, lastSaved: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(toSave));
    setIssues(listSavedIssues());
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const handleLoad = (key: string) => {
    if (!confirm("Load this issue? Your current unsaved work will be replaced.")) return;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      dispatch({ type: "LOAD_STATE", payload: parsed });
      // Also update the working draft
      localStorage.setItem("pd-newsletter-draft", raw);
      setOpen(false);
    } catch {
      alert("Failed to load issue.");
    }
  };

  const handleDelete = (key: string) => {
    if (!confirm("Delete this saved issue?")) return;
    localStorage.removeItem(key);
    setIssues(listSavedIssues());
  };

  const handleNewIssue = () => {
    if (!confirm("Start a new issue? Make sure you've saved your current work first.")) return;
    dispatch({ type: "RESET" });
    setOpen(false);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pd-newsletter-${state.issueDate || "draft"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result as string);
          if (!parsed.subjectLine && !parsed.issueDate) throw new Error("Not a valid issue file");
          dispatch({ type: "LOAD_STATE", payload: parsed });
          localStorage.setItem("pd-newsletter-draft", JSON.stringify(parsed));
        } catch {
          alert("Invalid issue file.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-2 text-sm font-medium rounded-lg border border-pd-border hover:border-pd-blue hover:text-pd-blue transition-colors cursor-pointer"
        style={{ color: open ? "#2982C4" : undefined, borderColor: open ? "#2982C4" : undefined }}
      >
        Issues
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            zIndex: 50,
            width: "360px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            padding: "16px",
          }}
        >
          {/* Actions row */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
            <button
              onClick={handleSave}
              style={{
                flex: 1,
                padding: "8px 0",
                fontSize: "12px",
                fontWeight: 600,
                color: justSaved ? "#22c55e" : "#ffffff",
                background: justSaved ? "#f0fdf4" : "#2982C4",
                border: justSaved ? "1px solid #22c55e" : "1px solid #2982C4",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              {justSaved ? "✓ Saved!" : "Save Current Issue"}
            </button>
            <button
              onClick={handleNewIssue}
              style={{
                padding: "8px 12px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#64748b",
                background: "transparent",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              New
            </button>
          </div>

          {/* Saved issues list */}
          <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600, marginBottom: "6px" }}>
            Saved Issues ({issues.length})
          </div>

          {issues.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#94a3b8", padding: "12px 0", textAlign: "center" }}>
              No saved issues yet. Click &quot;Save Current Issue&quot; to save.
            </p>
          ) : (
            <div style={{ maxHeight: "240px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
              {issues.map((issue) => {
                const isCurrent = issue.key === `${ISSUE_PREFIX}${state.issueDate}`;
                return (
                  <div
                    key={issue.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: isCurrent ? "1px solid #2982C4" : "1px solid #e2e8f0",
                      background: isCurrent ? "#eff6ff" : "#ffffff",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>
                        {new Date(issue.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        {isCurrent && <span style={{ fontSize: "10px", color: "#2982C4", marginLeft: "6px" }}>current</span>}
                      </div>
                      <div style={{ fontSize: "11px", color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {issue.subjectLine}
                      </div>
                      <div style={{ fontSize: "10px", color: "#cbd5e1" }}>
                        {issue.sectionsReady}/{issue.sectionsTotal} sections ready
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "4px", marginLeft: "8px", flexShrink: 0 }}>
                      {!isCurrent && (
                        <button
                          onClick={() => handleLoad(issue.key)}
                          style={{
                            padding: "4px 10px",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#2982C4",
                            border: "1px solid #2982C4",
                            borderRadius: "6px",
                            background: "transparent",
                            cursor: "pointer",
                          }}
                        >
                          Load
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(issue.key)}
                        style={{
                          padding: "4px 8px",
                          fontSize: "11px",
                          color: "#ef4444",
                          border: "1px solid #fca5a5",
                          borderRadius: "6px",
                          background: "transparent",
                          cursor: "pointer",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Export / Import */}
          <div style={{ display: "flex", gap: "6px", marginTop: "12px", borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
            <button
              onClick={handleExport}
              style={{
                flex: 1,
                padding: "6px 0",
                fontSize: "11px",
                fontWeight: 600,
                color: "#64748b",
                background: "transparent",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Export JSON
            </button>
            <button
              onClick={handleImport}
              style={{
                flex: 1,
                padding: "6px 0",
                fontSize: "11px",
                fontWeight: 600,
                color: "#64748b",
                background: "transparent",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Import JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
