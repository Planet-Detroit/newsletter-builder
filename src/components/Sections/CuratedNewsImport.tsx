"use client";

import { useState, useEffect } from "react";
import { useNewsletter } from "@/context/NewsletterContext";
import MiniWysiwyg from "./MiniWysiwyg";

const STORAGE_KEY = "nl:saved-briefs";

interface SavedBrief {
  id: string;
  name: string;
  html: string;
  savedAt: string;
}

function loadSavedBriefs(): SavedBrief[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistBriefs(briefs: SavedBrief[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(briefs));
}

export default function CuratedNewsImport() {
  const { state, dispatch } = useNewsletter();
  const sectionStatus = state.sections.find((s) => s.id === "curated-news")?.status;

  const [savedBriefs, setSavedBriefs] = useState<SavedBrief[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [saveName, setSaveName] = useState("");

  useEffect(() => {
    setSavedBriefs(loadSavedBriefs());
  }, []);

  const handleSave = () => {
    const name = saveName.trim() || `Brief ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    const brief: SavedBrief = {
      id: `brief-${Date.now()}`,
      name,
      html: state.curatedNewsHtml,
      savedAt: new Date().toISOString(),
    };
    const updated = [brief, ...savedBriefs];
    setSavedBriefs(updated);
    persistBriefs(updated);
    setSaveName("");
  };

  const handleLoad = (brief: SavedBrief) => {
    dispatch({ type: "SET_CURATED_NEWS_HTML", payload: brief.html });
    setShowLibrary(false);
  };

  const handleDelete = (id: string) => {
    const updated = savedBriefs.filter((b) => b.id !== id);
    setSavedBriefs(updated);
    persistBriefs(updated);
  };

  const toggleReady = () => {
    dispatch({
      type: "UPDATE_SECTION_STATUS",
      payload: { id: "curated-news", status: sectionStatus === "ready" ? "needs_attention" : "ready" },
    });
  };

  const hasContent = state.curatedNewsHtml.replace(/<[^>]*>/g, "").trim().length > 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-pd-muted">
        Paste your formatted &ldquo;What We&rsquo;re Reading&rdquo; content below. Supports rich text (bold, italic, links).
      </p>

      <MiniWysiwyg
        value={state.curatedNewsHtml}
        onChange={(html) => dispatch({ type: "SET_CURATED_NEWS_HTML", payload: html })}
        placeholder="Paste or type your 'What We're Reading' content here..."
        minHeight="200px"
        showLink={true}
        showEmoji={true}
      />

      {/* Save / Library controls */}
      <div className="flex gap-2">
        {hasContent && (
          <div className="flex gap-2 flex-1">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Brief name (optional)"
              className="flex-1 px-3 py-1.5 text-sm border border-pd-border rounded-lg focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue"
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
            />
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-sm font-medium text-pd-blue border border-pd-blue rounded-lg hover:bg-pd-blue hover:text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              Save to Library
            </button>
          </div>
        )}
        <button
          onClick={() => setShowLibrary(!showLibrary)}
          className="px-3 py-1.5 text-sm font-medium text-pd-muted border border-pd-border rounded-lg hover:border-pd-blue hover:text-pd-blue transition-colors cursor-pointer whitespace-nowrap"
        >
          {showLibrary ? "Hide Library" : `Library${savedBriefs.length > 0 ? ` (${savedBriefs.length})` : ""}`}
        </button>
      </div>

      {/* Saved briefs library */}
      {showLibrary && (
        <div className="border border-pd-border rounded-lg overflow-hidden">
          {savedBriefs.length === 0 ? (
            <p className="p-4 text-sm text-pd-muted text-center">No saved briefs yet. Save your current content to start a library.</p>
          ) : (
            <div className="divide-y divide-pd-border">
              {savedBriefs.map((brief) => (
                <div key={brief.id} className="flex items-center justify-between p-3 hover:bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{brief.name}</p>
                    <p className="text-xs text-pd-muted">
                      {new Date(brief.savedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 ml-3 shrink-0">
                    <button
                      onClick={() => handleLoad(brief)}
                      className="px-3 py-1.5 text-xs font-medium text-white rounded-lg cursor-pointer"
                      style={{ background: "var(--pd-blue)" }}
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleDelete(brief.id)}
                      className="px-2 py-1.5 text-xs font-medium text-red-500 rounded-lg border border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        onClick={toggleReady}
        className="w-full px-4 py-2 text-sm font-medium rounded-lg border-2 transition-colors cursor-pointer"
        style={
          sectionStatus === "ready"
            ? { borderColor: "var(--pd-success)", background: "var(--pd-success)", color: "#fff" }
            : { borderColor: "var(--pd-success)", color: "var(--pd-success)" }
        }
      >
        {sectionStatus === "ready" ? "✓ Ready — click to unmark" : "Mark as Ready"}
      </button>
    </div>
  );
}
