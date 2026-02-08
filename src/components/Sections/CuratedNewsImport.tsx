"use client";

import { useState, useRef } from "react";
import { useNewsletter } from "@/context/NewsletterContext";
import { CuratedStory } from "@/types/newsletter";
import MiniWysiwyg from "./MiniWysiwyg";

interface BriefArticle {
  emoji: string;
  caption: string;
  summary: string;
  sourceName: string;
  url: string;
}

interface BriefPacket {
  id: string;
  title: string;
  createdAt: string;
  postUrl: string | null;
  articles: BriefArticle[];
}

export default function CuratedNewsImport() {
  const { state, dispatch } = useNewsletter();
  const [urlInput, setUrlInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Brief import state
  const [briefs, setBriefs] = useState<BriefPacket[]>([]);
  const [briefsLoading, setBriefsLoading] = useState(false);
  const [briefsError, setBriefsError] = useState<string | null>(null);
  const [briefsFetched, setBriefsFetched] = useState(false);

  const sectionStatus = state.sections.find((s) => s.id === "curated-news")?.status;

  // ── Import from News Brief Generator ────────────────────────
  const handleFetchBriefs = async () => {
    setBriefsLoading(true);
    setBriefsError(null);
    try {
      const res = await fetch("/api/import-briefs");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to fetch briefs (${res.status})`);
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.briefs ?? [];
      setBriefs(list);
      setBriefsFetched(true);
    } catch (err) {
      setBriefsError(err instanceof Error ? err.message : "Failed to connect to brief generator");
    } finally {
      setBriefsLoading(false);
    }
  };

  const handleImportBrief = (brief: BriefPacket) => {
    const newStories: CuratedStory[] = brief.articles.map((article, idx) => ({
      id: `curated-${Date.now()}-brief-${idx}`,
      headline: `${article.emoji} ${article.caption}`,
      summary: article.summary,
      source: article.sourceName,
      url: "",
      selected: false,
    }));

    dispatch({
      type: "SET_CURATED_STORIES",
      payload: [...state.curatedStories, ...newStories],
    });
    dispatch({
      type: "UPDATE_SECTION_STATUS",
      payload: { id: "curated-news", status: "needs_attention" },
    });
  };

  // ── AI-powered brief generation ──────────────────────────────
  const handleGenerate = async () => {
    if (!urlInput.trim()) return;
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/curated-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: urlInput }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `API returned ${res.status}`);
      }

      const data = await res.json();
      if (data.stories && data.stories.length > 0) {
        dispatch({
          type: "SET_CURATED_STORIES",
          payload: [...state.curatedStories, ...data.stories],
        });
        dispatch({
          type: "UPDATE_SECTION_STATUS",
          payload: { id: "curated-news", status: "needs_attention" },
        });
        setUrlInput("");
      } else {
        setError("No stories could be generated from the provided URLs.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Manual add ───────────────────────────────────────────────
  const handleAddManual = () => {
    const newStory: CuratedStory = {
      id: `curated-${Date.now()}-manual`,
      headline: "",
      summary: "",
      source: "",
      url: "",
      selected: false,
    };
    dispatch({
      type: "SET_CURATED_STORIES",
      payload: [...state.curatedStories, newStory],
    });
    setEditingId(newStory.id);
  };

  // ── Drag-and-drop reorder ────────────────────────────────────
  const handleDragStart = (idx: number) => { dragItem.current = idx; };
  const handleDragEnter = (idx: number) => { dragOverItem.current = idx; };
  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      dispatch({ type: "REORDER_CURATED_STORIES", payload: { fromIndex: dragItem.current, toIndex: dragOverItem.current } });
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  // ── Mark as ready ────────────────────────────────────────────
  const toggleReady = () => {
    dispatch({
      type: "UPDATE_SECTION_STATUS",
      payload: { id: "curated-news", status: sectionStatus === "ready" ? "needs_attention" : "ready" },
    });
  };

  const urlCount = (urlInput.match(/https?:\/\/[^\s]+/g) || []).length;

  return (
    <div className="space-y-4">
      {/* ── Import from News Brief Generator ─────────────────── */}
      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-amber-800">
            📰 Import from News Brief Generator
          </p>
          <button
            onClick={handleFetchBriefs}
            disabled={briefsLoading}
            className="px-3 py-1.5 text-xs font-medium text-amber-800 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {briefsLoading ? "Loading..." : briefsFetched ? "Refresh" : "Fetch Briefs"}
          </button>
        </div>
        <p className="text-xs text-amber-700 mb-2">
          Pull curated stories directly from your news brief generator — no copy/paste needed.
        </p>

        {briefsError && (
          <p className="text-xs text-red-600 mt-2">{briefsError}</p>
        )}

        {briefsFetched && briefs.length === 0 && !briefsError && (
          <p className="text-xs text-amber-600 mt-2">No briefs found. Push a brief from the news brief generator first.</p>
        )}

        {briefs.length > 0 && (
          <div className="mt-2 space-y-2">
            {briefs.map((brief) => (
              <div
                key={brief.id}
                className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-amber-200"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {brief.title || "Untitled Brief"}
                  </p>
                  <p className="text-xs text-pd-muted">
                    {new Date(brief.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    {" · "}
                    {brief.articles.length} article{brief.articles.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={() => handleImportBrief(brief)}
                  className="ml-3 px-3 py-1.5 text-xs font-medium text-white rounded-lg shrink-0 cursor-pointer"
                  style={{ background: "var(--pd-blue)" }}
                >
                  Import
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Divider ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-pd-border" />
        <span className="text-xs text-pd-muted">or generate from URLs</span>
        <div className="flex-1 border-t border-pd-border" />
      </div>

      {/* ── URL-based generation ─────────────────────────────── */}
      <div className="p-4 bg-pd-blue-50 rounded-lg border border-pd-blue/20">
        <p className="text-sm text-pd-blue-dark mb-3">
          <strong>Paste article URLs</strong> (one per line) and click Generate. The AI will fetch each article and create a headline + summary for the newsletter.
        </p>
        <textarea
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder={"https://www.freep.com/story/news/...\nhttps://www.bridgemi.com/...\nhttps://www.mlive.com/..."}
          rows={4}
          className="w-full px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue resize-y font-mono"
          disabled={isGenerating}
        />
        {urlCount > 0 && (
          <p className="text-xs text-pd-muted mt-1">{urlCount} URL{urlCount !== 1 ? "s" : ""} detected</p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleGenerate}
          disabled={!urlInput.trim() || isGenerating}
          className="flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          style={{ background: urlInput.trim() && !isGenerating ? "var(--pd-blue)" : "var(--pd-muted)" }}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating briefs...
            </span>
          ) : (
            `Generate Briefs${urlCount > 0 ? ` (${urlCount})` : ""}`
          )}
        </button>
        <button
          onClick={handleAddManual}
          className="px-4 py-2.5 text-sm font-medium rounded-lg border border-pd-border text-pd-muted hover:border-pd-blue hover:text-pd-blue transition-colors cursor-pointer"
          title="Add a story manually"
        >
          + Manual
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Story list */}
      {state.curatedStories.length > 0 && (
        <div className="space-y-2 mt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">
              {state.curatedStories.length} stories — drag to reorder, click to edit
            </h4>
            <button
              onClick={() => {
                if (confirm("Clear all curated stories? This cannot be undone.")) {
                  dispatch({ type: "SET_CURATED_STORIES", payload: [] });
                  dispatch({ type: "UPDATE_SECTION_STATUS", payload: { id: "curated-news", status: "empty" } });
                }
              }}
              className="px-3 py-1 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
            >
              Reset All
            </button>
          </div>

          {state.curatedStories.map((story, idx) => (
            <div
              key={story.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragEnter={() => handleDragEnter(idx)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`p-3 border rounded-lg transition-all cursor-grab active:cursor-grabbing ${
                story.selected ? "border-pd-border bg-white" : "border-pd-border/50 bg-slate-50 opacity-60"
              }`}
            >
              {editingId === story.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={story.headline}
                    onChange={(e) => dispatch({ type: "UPDATE_CURATED_STORY", payload: { id: story.id, story: { headline: e.target.value } } })}
                    className="w-full px-2 py-1.5 border border-pd-blue rounded text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-pd-blue"
                    placeholder="Headline"
                  />
                  <MiniWysiwyg
                    value={story.summary}
                    onChange={(html) => dispatch({ type: "UPDATE_CURATED_STORY", payload: { id: story.id, story: { summary: html } } })}
                    placeholder="Summary"
                    minHeight="60px"
                    showLink={false}
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={story.source}
                      onChange={(e) => dispatch({ type: "UPDATE_CURATED_STORY", payload: { id: story.id, story: { source: e.target.value } } })}
                      className="flex-1 px-2 py-1.5 border border-pd-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-pd-blue"
                      placeholder="Source"
                    />
                    <input
                      type="text"
                      value={story.url}
                      onChange={(e) => dispatch({ type: "UPDATE_CURATED_STORY", payload: { id: story.id, story: { url: e.target.value } } })}
                      className="flex-1 px-2 py-1.5 border border-pd-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-pd-blue"
                      placeholder="URL"
                    />
                  </div>
                  <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs font-medium text-white rounded cursor-pointer" style={{ background: "var(--pd-blue)" }}>
                    Done
                  </button>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <span className="text-pd-muted mt-0.5 cursor-grab select-none" title="Drag to reorder">⠿</span>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setEditingId(story.id)}>
                    <p className="text-sm font-semibold text-foreground leading-snug">{story.headline || "(click to edit)"}</p>
                    {story.summary && <p className="text-xs text-pd-muted mt-0.5 line-clamp-2">{story.summary}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      {story.source && <span className="text-[10px] text-pd-blue font-medium">{story.source}</span>}
                      {story.url && <span className="text-[10px] text-pd-muted truncate max-w-[200px]">{story.url}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => dispatch({ type: "UPDATE_CURATED_STORY", payload: { id: story.id, story: { selected: !story.selected } } })}
                      className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-colors ${
                        story.selected ? "bg-pd-blue text-white" : "bg-slate-200 text-pd-muted"
                      }`}
                      title={story.selected ? "Included" : "Excluded"}
                    >
                      {story.selected ? "✓" : "—"}
                    </button>
                    <button
                      onClick={() => dispatch({ type: "REMOVE_CURATED_STORY", payload: story.id })}
                      className="w-6 h-6 rounded flex items-center justify-center text-xs text-pd-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Remove"
                    >
                      x
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

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
      )}
    </div>
  );
}
