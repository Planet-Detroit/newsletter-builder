"use client";

import { useState, useCallback } from "react";
import { useNewsletter } from "@/context/NewsletterContext";
import type { CivicAction, CivicActionType } from "@/types/newsletter";

const ACTION_TYPES: { value: CivicActionType; label: string; emoji: string }[] = [
  { value: "attend", label: "Attend", emoji: "📍" },
  { value: "comment", label: "Comment", emoji: "💬" },
  { value: "sign", label: "Sign", emoji: "✍️" },
  { value: "contact", label: "Contact", emoji: "📞" },
  { value: "volunteer", label: "Volunteer", emoji: "🙋" },
  { value: "follow", label: "Follow", emoji: "👁️" },
  { value: "learn-more", label: "Learn More", emoji: "📚" },
];

export default function CivicActionEditor() {
  const { state, dispatch } = useNewsletter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const sectionStatus = state.sections.find((s) => s.id === "civic-action")?.status;
  const selectedPosts = state.pdPosts.filter((p) => p.selected);
  const linkedStory = state.pdPosts.find((p) => p.id === state.civicActionStoryId);

  /* ── Story selection ─────────────────────────────── */

  const handleStorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value ? parseInt(e.target.value, 10) : null;
    dispatch({ type: "SET_CIVIC_ACTION_STORY", payload: id });
  };

  /* ── AI generation ───────────────────────────────── */

  const handleGenerate = useCallback(async () => {
    if (!linkedStory) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/civic-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyTitle: linkedStory.title,
          storyExcerpt: linkedStory.excerpt,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed (${res.status})`);
      }
      const data = await res.json();
      dispatch({ type: "SET_CIVIC_ACTION_INTRO", payload: data.intro || "" });
      dispatch({ type: "SET_CIVIC_ACTIONS", payload: data.actions || [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }, [linkedStory, dispatch]);

  /* ── Action CRUD ─────────────────────────────────── */

  const updateAction = (id: string, updates: Partial<CivicAction>) => {
    const updated = state.civicActions.map((a) =>
      a.id === id ? { ...a, ...updates } : a
    );
    dispatch({ type: "SET_CIVIC_ACTIONS", payload: updated });
  };

  const removeAction = (id: string) => {
    dispatch({
      type: "SET_CIVIC_ACTIONS",
      payload: state.civicActions.filter((a) => a.id !== id),
    });
    if (editingId === id) setEditingId(null);
  };

  const addAction = () => {
    const newAction: CivicAction = {
      id: `ca-${Date.now()}`,
      title: "",
      description: "",
      url: "",
      actionType: "learn-more",
    };
    dispatch({
      type: "SET_CIVIC_ACTIONS",
      payload: [...state.civicActions, newAction],
    });
    setEditingId(newAction.id);
  };

  /* ── Ready toggle ────────────────────────────────── */

  const toggleReady = () => {
    dispatch({
      type: "UPDATE_SECTION_STATUS",
      payload: {
        id: "civic-action",
        status: sectionStatus === "ready" ? "needs_attention" : "ready",
      },
    });
  };

  /* ── Render ──────────────────────────────────────── */

  return (
    <div className="space-y-5">
      {/* Info box */}
      <div className="p-4 bg-pd-blue-50 rounded-lg border border-pd-blue/20">
        <p className="text-sm text-pd-blue-dark mb-1">
          <strong>Civic Action</strong> — Connect your reporting to civic engagement. Pick a featured story, then generate or manually add action items for readers.
        </p>
        <p className="text-xs text-pd-muted">
          This section appears right after your PD stories in the newsletter.
        </p>
      </div>

      {/* Story picker */}
      <div>
        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
          Featured Story
        </h4>
        {selectedPosts.length === 0 ? (
          <p className="text-xs text-pd-muted py-2">
            No stories selected yet. Go to &quot;Reporting from Planet Detroit&quot; first and select your stories.
          </p>
        ) : (
          <select
            value={state.civicActionStoryId ?? ""}
            onChange={handleStorySelect}
            className="w-full px-3 py-2.5 border border-pd-border rounded-lg text-sm bg-white focus:outline-none focus:border-pd-blue"
          >
            <option value="">Choose a story to feature...</option>
            {selectedPosts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        )}

        {linkedStory && (
          <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-pd-border/50">
            <p className="text-sm font-medium text-foreground">{linkedStory.title}</p>
            {linkedStory.excerpt && (
              <p className="text-xs text-pd-muted mt-1 line-clamp-2">{linkedStory.excerpt}</p>
            )}
          </div>
        )}
      </div>

      {/* Generate button */}
      {linkedStory && (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
          style={{
            background: loading ? "#94a3b8" : "#2982C4",
            color: "#ffffff",
            border: "1px solid #2982C4",
          }}
        >
          {loading ? (
            <>
              <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Generating actions...
            </>
          ) : state.civicActions.length > 0 ? (
            "Regenerate Actions"
          ) : (
            "Generate Actions with AI"
          )}
        </button>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>
      )}

      {/* Intro editor */}
      {(state.civicActionIntro || state.civicActions.length > 0) && (
        <div>
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
            Intro Paragraph
          </h4>
          <textarea
            value={state.civicActionIntro}
            onChange={(e) =>
              dispatch({ type: "SET_CIVIC_ACTION_INTRO", payload: e.target.value })
            }
            rows={2}
            placeholder="Based on our reporting on [topic], here are actions you can take:"
            className="w-full px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue bg-white resize-none"
          />
          <p className={`text-xs mt-1 ${state.civicActionIntro.length > 120 ? "text-amber-600" : "text-pd-muted"}`}>
            {state.civicActionIntro.length}/120 characters{state.civicActionIntro.length > 120 ? " — keep to 1 sentence for compact layout" : ""}
          </p>
        </div>
      )}

      {/* Action items */}
      {state.civicActions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Action Items ({state.civicActions.length})
            </h4>
            <button
              onClick={addAction}
              className="text-xs font-medium cursor-pointer hover:underline"
              style={{ color: "var(--pd-blue)" }}
            >
              + Add action
            </button>
          </div>

          {state.civicActions.length > 3 && (
            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg mb-2">
              You have {state.civicActions.length} actions. We recommend 1-3 for brevity — readers are more likely to act when choices are limited.
            </p>
          )}

          <div className="space-y-2">
            {state.civicActions.map((action) => {
              const isEditing = editingId === action.id;
              const typeInfo = ACTION_TYPES.find((t) => t.value === action.actionType);

              if (isEditing) {
                return (
                  <div
                    key={action.id}
                    className="p-3 border-2 rounded-lg space-y-2"
                    style={{ borderColor: "var(--pd-blue)", background: "#fafbfc" }}
                  >
                    <input
                      type="text"
                      value={action.title}
                      onChange={(e) => updateAction(action.id, { title: e.target.value })}
                      placeholder="Action title"
                      className="w-full px-2.5 py-1.5 border border-pd-border rounded text-sm focus:outline-none focus:border-pd-blue bg-white"
                    />
                    <textarea
                      value={action.description}
                      onChange={(e) => updateAction(action.id, { description: e.target.value })}
                      placeholder="What should the reader do and why it matters..."
                      rows={2}
                      className="w-full px-2.5 py-1.5 border border-pd-border rounded text-sm focus:outline-none focus:border-pd-blue bg-white resize-none"
                    />
                    <p className={`text-xs ${action.description.length > 200 ? "text-amber-600" : "text-pd-muted"}`}>
                      {action.description.length}/200{action.description.length > 200 ? " — consider shortening" : ""}
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={action.url}
                        onChange={(e) => updateAction(action.id, { url: e.target.value })}
                        placeholder="https://..."
                        className="flex-1 px-2.5 py-1.5 border border-pd-border rounded text-sm focus:outline-none focus:border-pd-blue bg-white"
                      />
                      <select
                        value={action.actionType}
                        onChange={(e) =>
                          updateAction(action.id, { actionType: e.target.value as CivicActionType })
                        }
                        className="px-2.5 py-1.5 border border-pd-border rounded text-sm bg-white focus:outline-none focus:border-pd-blue"
                      >
                        {ACTION_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.emoji} {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 text-xs font-medium rounded cursor-pointer"
                        style={{ background: "#2982C4", color: "#fff" }}
                      >
                        Done
                      </button>
                      <button
                        onClick={() => removeAction(action.id)}
                        className="px-3 py-1 text-xs font-medium rounded cursor-pointer text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={action.id}
                  onClick={() => setEditingId(action.id)}
                  className="p-3 border border-pd-border rounded-lg cursor-pointer hover:border-pd-blue/40 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-base shrink-0 mt-0.5">{typeInfo?.emoji || "📚"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {action.title || <span className="text-pd-muted italic">Untitled action</span>}
                      </p>
                      {action.description && (
                        <p className="text-xs text-pd-muted mt-0.5 line-clamp-2">{action.description}</p>
                      )}
                      {action.url && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: "var(--pd-blue)" }}>
                          {action.url}
                        </p>
                      )}
                    </div>
                    <span
                      className="text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0"
                      style={{ background: "#f0f7fc", color: "#2982C4" }}
                    >
                      {typeInfo?.label || "Learn More"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state — no actions yet and no story selected */}
      {state.civicActions.length === 0 && !linkedStory && selectedPosts.length > 0 && (
        <div className="text-center py-6 text-pd-muted">
          <p className="text-3xl mb-2">🤝</p>
          <p className="text-sm">Select a featured story above to generate civic actions.</p>
        </div>
      )}

      {/* Manual-only option */}
      {state.civicActions.length === 0 && (
        <div className="text-center">
          <button
            onClick={addAction}
            className="text-xs font-medium cursor-pointer hover:underline"
            style={{ color: "var(--pd-blue)" }}
          >
            Or add actions manually
          </button>
        </div>
      )}

      {/* Ready toggle */}
      {(state.civicActions.length > 0 || state.civicActionIntro) && (
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
      )}
    </div>
  );
}
