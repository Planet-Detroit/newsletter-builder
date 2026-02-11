"use client";

import { useState } from "react";
import { useNewsletter } from "@/context/NewsletterContext";
import type { PublicMeeting, CommentPeriod } from "@/types/newsletter";

function formatMeetingDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function urgencyStyle(days: number): { color: string; bg: string } {
  if (days < 7) return { color: "#dc2626", bg: "#fef2f2" };
  if (days <= 14) return { color: "#d97706", bg: "#fffbeb" };
  return { color: "#16a34a", bg: "#f0fdf4" };
}

export default function PublicMeetingsEditor() {
  const { state, dispatch } = useNewsletter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const sectionStatus = state.sections.find((s) => s.id === "public-meetings")?.status;
  const meetings = state.publicMeetings || [];
  const commentPeriods = state.commentPeriods || [];

  /* ── Fetch from API ─────────────────────────────── */

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/public-meetings");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed (${res.status})`);
      }
      const data = await res.json();

      const fetchedMeetings: PublicMeeting[] = (data.meetings || []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (m: any) => ({
          id: m.id || `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: m.title || "",
          agency: m.agency || "",
          start_datetime: m.start_datetime || "",
          location: m.location || "",
          is_hybrid: false,
          is_virtual: !m.location,
          accepts_public_comment: false,
          details_url: m.url || "",
          issue_tags: m.issue_tags || [],
          selected: false,
        })
      );

      const fetchedPeriods: CommentPeriod[] = (data.commentPeriods || []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (cp: any) => ({
          id: cp.id || `cp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: cp.title || "",
          agency: cp.agency || "",
          end_date: cp.end_date || "",
          days_remaining: cp.days_remaining ?? 0,
          comment_url: cp.url || "",
          description: cp.description || "",
          selected: false,
        })
      );

      dispatch({ type: "SET_PUBLIC_MEETINGS", payload: fetchedMeetings });
      dispatch({ type: "SET_COMMENT_PERIODS", payload: fetchedPeriods });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fetch failed");
    } finally {
      setLoading(false);
    }
  };

  /* ── Toggle selection ───────────────────────────── */

  const toggleMeeting = (id: string) => {
    dispatch({
      type: "SET_PUBLIC_MEETINGS",
      payload: meetings.map((m) =>
        m.id === id ? { ...m, selected: !m.selected } : m
      ),
    });
  };

  const togglePeriod = (id: string) => {
    dispatch({
      type: "SET_COMMENT_PERIODS",
      payload: commentPeriods.map((cp) =>
        cp.id === id ? { ...cp, selected: !cp.selected } : cp
      ),
    });
  };

  /* ── Inline edit ────────────────────────────────── */

  const updateMeeting = (id: string, updates: Partial<PublicMeeting>) => {
    dispatch({
      type: "SET_PUBLIC_MEETINGS",
      payload: meetings.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    });
  };

  const updatePeriod = (id: string, updates: Partial<CommentPeriod>) => {
    dispatch({
      type: "SET_COMMENT_PERIODS",
      payload: commentPeriods.map((cp) =>
        cp.id === id ? { ...cp, ...updates } : cp
      ),
    });
  };

  /* ── Ready toggle ───────────────────────────────── */

  const toggleReady = () => {
    dispatch({
      type: "UPDATE_SECTION_STATUS",
      payload: {
        id: "public-meetings",
        status: sectionStatus === "ready" ? "needs_attention" : "ready",
      },
    });
  };

  const hasContent =
    meetings.some((m) => m.selected) ||
    commentPeriods.some((cp) => cp.selected);

  /* ── Render ─────────────────────────────────────── */

  return (
    <div className="space-y-5">
      {/* Info box */}
      <div className="p-4 bg-pd-blue-50 rounded-lg border border-pd-blue/20">
        <p className="text-sm text-pd-blue-dark mb-1">
          <strong>Public Meetings & Comment Periods</strong> — Include upcoming
          government meetings and open comment periods so readers can participate
          in decisions that affect their communities.
        </p>
        <p className="text-xs text-pd-muted">
          Data fetched from the Ask Planet Detroit backend. Select which items to
          include, then edit details inline if needed.
        </p>
      </div>

      {/* Fetch button */}
      <button
        onClick={handleFetch}
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
            Fetching...
          </>
        ) : meetings.length > 0 || commentPeriods.length > 0 ? (
          "Refresh from API"
        ) : (
          "Fetch from API"
        )}
      </button>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>
      )}

      {/* Intro paragraph */}
      {(meetings.length > 0 || commentPeriods.length > 0) && (
        <div>
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
            Intro Paragraph (optional)
          </h4>
          <textarea
            value={state.publicMeetingsIntro || ""}
            onChange={(e) =>
              dispatch({
                type: "SET_PUBLIC_MEETINGS_INTRO",
                payload: e.target.value,
              })
            }
            rows={2}
            placeholder="Here are upcoming opportunities to participate in public decision-making..."
            className="w-full px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue bg-white resize-none"
          />
        </div>
      )}

      {/* Meetings */}
      {meetings.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
            Upcoming Meetings ({meetings.filter((m) => m.selected).length}/
            {meetings.length} selected)
          </h4>
          <div className="space-y-2">
            {meetings.map((meeting) => {
              const isEditing = editingId === meeting.id;

              if (isEditing) {
                return (
                  <div
                    key={meeting.id}
                    className="p-3 border-2 rounded-lg space-y-2"
                    style={{
                      borderColor: "var(--pd-blue)",
                      background: "#fafbfc",
                    }}
                  >
                    <input
                      type="text"
                      value={meeting.title}
                      onChange={(e) =>
                        updateMeeting(meeting.id, { title: e.target.value })
                      }
                      placeholder="Meeting title"
                      className="w-full px-2.5 py-1.5 border border-pd-border rounded text-sm focus:outline-none focus:border-pd-blue bg-white"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={meeting.agency}
                        onChange={(e) =>
                          updateMeeting(meeting.id, { agency: e.target.value })
                        }
                        placeholder="Agency"
                        className="flex-1 px-2.5 py-1.5 border border-pd-border rounded text-sm focus:outline-none focus:border-pd-blue bg-white"
                      />
                      <input
                        type="text"
                        value={meeting.location}
                        onChange={(e) =>
                          updateMeeting(meeting.id, { location: e.target.value })
                        }
                        placeholder="Location"
                        className="flex-1 px-2.5 py-1.5 border border-pd-border rounded text-sm focus:outline-none focus:border-pd-blue bg-white"
                      />
                    </div>
                    <input
                      type="text"
                      value={meeting.details_url}
                      onChange={(e) =>
                        updateMeeting(meeting.id, {
                          details_url: e.target.value,
                        })
                      }
                      placeholder="https://..."
                      className="w-full px-2.5 py-1.5 border border-pd-border rounded text-sm focus:outline-none focus:border-pd-blue bg-white"
                    />
                    <div className="flex gap-3 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={meeting.is_virtual}
                          onChange={(e) =>
                            updateMeeting(meeting.id, {
                              is_virtual: e.target.checked,
                            })
                          }
                        />
                        Virtual
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={meeting.is_hybrid}
                          onChange={(e) =>
                            updateMeeting(meeting.id, {
                              is_hybrid: e.target.checked,
                            })
                          }
                        />
                        Hybrid
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={meeting.accepts_public_comment}
                          onChange={(e) =>
                            updateMeeting(meeting.id, {
                              accepts_public_comment: e.target.checked,
                            })
                          }
                        />
                        Public Comment
                      </label>
                    </div>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 text-xs font-medium rounded cursor-pointer"
                      style={{ background: "#2982C4", color: "#fff" }}
                    >
                      Done
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={meeting.id}
                  className="flex items-start gap-2 p-3 border rounded-lg transition-colors"
                  style={{
                    borderColor: meeting.selected
                      ? "var(--pd-blue)"
                      : "var(--pd-border)",
                    background: meeting.selected ? "#f8fbff" : "transparent",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={meeting.selected}
                    onChange={() => toggleMeeting(meeting.id)}
                    className="mt-1 shrink-0 cursor-pointer"
                  />
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => setEditingId(meeting.id)}
                  >
                    <p className="text-sm font-medium text-foreground">
                      {meeting.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
                        style={{ background: "#f0f7fc", color: "#2982C4" }}
                      >
                        {meeting.agency}
                      </span>
                      <span className="text-xs text-pd-muted">
                        {formatMeetingDate(meeting.start_datetime)}
                      </span>
                      {meeting.location && (
                        <span className="text-xs text-pd-muted">
                          &middot; {meeting.location}
                        </span>
                      )}
                      {meeting.is_virtual && (
                        <span className="text-[9px] font-bold uppercase px-1 py-0.5 rounded" style={{ color: "#7c3aed", border: "1px solid #7c3aed" }}>
                          Virtual
                        </span>
                      )}
                      {meeting.is_hybrid && (
                        <span className="text-[9px] font-bold uppercase px-1 py-0.5 rounded" style={{ color: "#0891b2", border: "1px solid #0891b2" }}>
                          Hybrid
                        </span>
                      )}
                      {meeting.accepts_public_comment && (
                        <span className="text-[9px] font-bold uppercase px-1 py-0.5 rounded" style={{ color: "#16a34a", border: "1px solid #16a34a" }}>
                          Public Comment
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Comment Periods */}
      {commentPeriods.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
            Open Comment Periods (
            {commentPeriods.filter((cp) => cp.selected).length}/
            {commentPeriods.length} selected)
          </h4>
          <div className="space-y-2">
            {commentPeriods.map((cp) => {
              const isEditing = editingId === cp.id;
              const urg = urgencyStyle(cp.days_remaining);

              if (isEditing) {
                return (
                  <div
                    key={cp.id}
                    className="p-3 border-2 rounded-lg space-y-2"
                    style={{
                      borderColor: "var(--pd-blue)",
                      background: "#fafbfc",
                    }}
                  >
                    <input
                      type="text"
                      value={cp.title}
                      onChange={(e) =>
                        updatePeriod(cp.id, { title: e.target.value })
                      }
                      placeholder="Comment period title"
                      className="w-full px-2.5 py-1.5 border border-pd-border rounded text-sm focus:outline-none focus:border-pd-blue bg-white"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={cp.agency}
                        onChange={(e) =>
                          updatePeriod(cp.id, { agency: e.target.value })
                        }
                        placeholder="Agency"
                        className="flex-1 px-2.5 py-1.5 border border-pd-border rounded text-sm focus:outline-none focus:border-pd-blue bg-white"
                      />
                      <input
                        type="text"
                        value={cp.comment_url}
                        onChange={(e) =>
                          updatePeriod(cp.id, { comment_url: e.target.value })
                        }
                        placeholder="Comment URL"
                        className="flex-1 px-2.5 py-1.5 border border-pd-border rounded text-sm focus:outline-none focus:border-pd-blue bg-white"
                      />
                    </div>
                    <textarea
                      value={cp.description}
                      onChange={(e) =>
                        updatePeriod(cp.id, { description: e.target.value })
                      }
                      placeholder="Brief description..."
                      rows={2}
                      className="w-full px-2.5 py-1.5 border border-pd-border rounded text-sm focus:outline-none focus:border-pd-blue bg-white resize-none"
                    />
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 text-xs font-medium rounded cursor-pointer"
                      style={{ background: "#2982C4", color: "#fff" }}
                    >
                      Done
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={cp.id}
                  className="flex items-start gap-2 p-3 border rounded-lg transition-colors"
                  style={{
                    borderColor: cp.selected
                      ? "var(--pd-blue)"
                      : "var(--pd-border)",
                    background: cp.selected ? "#f8fbff" : "transparent",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={cp.selected}
                    onChange={() => togglePeriod(cp.id)}
                    className="mt-1 shrink-0 cursor-pointer"
                  />
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => setEditingId(cp.id)}
                  >
                    <p className="text-sm font-medium text-foreground">
                      {cp.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
                        style={{ background: "#f0f7fc", color: "#2982C4" }}
                      >
                        {cp.agency}
                      </span>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          color: urg.color,
                          background: urg.bg,
                          border: `1px solid ${urg.color}`,
                        }}
                      >
                        {cp.days_remaining <= 1
                          ? "Closing soon!"
                          : `${cp.days_remaining} days left`}
                      </span>
                      <span className="text-xs text-pd-muted">
                        Closes {cp.end_date}
                      </span>
                    </div>
                    {cp.description && (
                      <p className="text-xs text-pd-muted mt-1 line-clamp-2">
                        {cp.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {meetings.length === 0 && commentPeriods.length === 0 && !loading && (
        <div className="text-center py-6 text-pd-muted">
          <p className="text-3xl mb-2">🏛️</p>
          <p className="text-sm">
            Click &quot;Fetch from API&quot; to load upcoming meetings and open
            comment periods.
          </p>
        </div>
      )}

      {/* Ready toggle */}
      {hasContent && (
        <button
          onClick={toggleReady}
          className="w-full px-4 py-2 text-sm font-medium rounded-lg border-2 transition-colors cursor-pointer"
          style={
            sectionStatus === "ready"
              ? {
                  borderColor: "var(--pd-success)",
                  background: "var(--pd-success)",
                  color: "#fff",
                }
              : { borderColor: "var(--pd-success)", color: "var(--pd-success)" }
          }
        >
          {sectionStatus === "ready"
            ? "✓ Ready — click to unmark"
            : "Mark as Ready"}
        </button>
      )}
    </div>
  );
}
