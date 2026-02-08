"use client";

import { useState, useRef } from "react";
import { useNewsletter } from "@/context/NewsletterContext";
import { EventItem } from "@/types/newsletter";

export default function EventsSelector() {
  const { state, dispatch } = useNewsletter();
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pasteInput, setPasteInput] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const sectionStatus = state.sections.find((s) => s.id === "events")?.status;

  // ── Parse pasted text with AI ─────────────────────────────────
  const handleParsePaste = async () => {
    if (!pasteInput.trim()) return;
    setIsParsing(true);
    setError(null);

    try {
      const res = await fetch("/api/parse-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: pasteInput }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `API returned ${res.status}`);
      }
      const data = await res.json();
      if (data.events && data.events.length > 0) {
        dispatch({ type: "SET_EVENTS", payload: [...state.events, ...data.events] });
        dispatch({ type: "UPDATE_SECTION_STATUS", payload: { id: "events", status: "needs_attention" } });
        setPasteInput("");
      } else {
        setError("Couldn't extract any events from the pasted text.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Parsing failed");
    } finally {
      setIsParsing(false);
    }
  };

  // ── Manual add ────────────────────────────────────────────────
  const handleAddManual = () => {
    const newEvent: EventItem = {
      id: `evt-${Date.now()}-manual`,
      title: "",
      date: "",
      time: "",
      location: "",
      url: "",
      source: "Community",
      selected: false,
    };
    dispatch({ type: "SET_EVENTS", payload: [...state.events, newEvent] });
    setEditingId(newEvent.id);
  };

  // ── Drag-and-drop reorder ─────────────────────────────────────
  const handleDragStart = (idx: number) => { dragItem.current = idx; };
  const handleDragEnter = (idx: number) => { dragOverItem.current = idx; };
  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      const items = [...state.events];
      const [moved] = items.splice(dragItem.current, 1);
      items.splice(dragOverItem.current, 0, moved);
      dispatch({ type: "SET_EVENTS", payload: items });
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  // ── Update an event field ─────────────────────────────────────
  const updateEvent = (id: string, field: Partial<EventItem>) => {
    const updated = state.events.map((e) => (e.id === id ? { ...e, ...field } : e));
    dispatch({ type: "SET_EVENTS", payload: updated });
  };

  // ── Toggle select ─────────────────────────────────────────────
  const toggleEvent = (id: string) => {
    const updated = state.events.map((e) => (e.id === id ? { ...e, selected: !e.selected } : e));
    dispatch({ type: "SET_EVENTS", payload: updated });
  };

  // ── Remove ────────────────────────────────────────────────────
  const removeEvent = (id: string) => {
    dispatch({ type: "SET_EVENTS", payload: state.events.filter((e) => e.id !== id) });
  };

  const toggleReady = () => {
    dispatch({
      type: "UPDATE_SECTION_STATUS",
      payload: { id: "events", status: sectionStatus === "ready" ? "needs_attention" : "ready" },
    });
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Import area */}
      <div className="p-4 bg-pd-blue-50 rounded-lg border border-pd-blue/20">
        <p className="text-sm text-pd-blue-dark mb-3">
          <strong>Paste events</strong> from CitySpark exports (CSV, text), email, or any format. The AI will extract event names, dates, times, locations, and URLs.
        </p>
        <textarea
          value={pasteInput}
          onChange={(e) => setPasteInput(e.target.value)}
          placeholder={"Detroit River Cleanup Volunteer Day\nFeb 14, 2026 9:00 AM - 1:00 PM\nRiverside Park, Detroit\nhttps://example.com/cleanup\n\nGreat Lakes Water Policy Town Hall\nFeb 18, 2026 6:30 PM\nWayne State University, Detroit"}
          rows={6}
          className="w-full px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue resize-y font-mono"
          disabled={isParsing}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleParsePaste}
          disabled={!pasteInput.trim() || isParsing}
          className="flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          style={{ background: pasteInput.trim() && !isParsing ? "var(--pd-blue)" : "var(--pd-muted)" }}
        >
          {isParsing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Parsing events...
            </span>
          ) : (
            "Import Events"
          )}
        </button>
        <button
          onClick={handleAddManual}
          className="px-4 py-2.5 text-sm font-medium rounded-lg border border-pd-border text-pd-muted hover:border-pd-blue hover:text-pd-blue transition-colors cursor-pointer"
          title="Add an event manually"
        >
          + Manual
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Event list */}
      {state.events.length > 0 && (
        <div className="space-y-2 mt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">
              {state.events.length} event{state.events.length !== 1 ? "s" : ""} — drag to reorder, click to edit
            </h4>
            <button
              onClick={() => {
                if (confirm("Clear all events? This cannot be undone.")) {
                  dispatch({ type: "SET_EVENTS", payload: [] });
                  dispatch({ type: "UPDATE_SECTION_STATUS", payload: { id: "events", status: "empty" } });
                }
              }}
              className="px-3 py-1 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
            >
              Reset All
            </button>
          </div>

          {state.events.map((event, idx) => (
            <div
              key={event.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragEnter={() => handleDragEnter(idx)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`p-3 border rounded-lg transition-all cursor-grab active:cursor-grabbing ${
                event.selected ? "border-pd-border bg-white" : "border-pd-border/50 bg-slate-50 opacity-60"
              }`}
            >
              {editingId === event.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={event.title}
                    onChange={(e) => updateEvent(event.id, { title: e.target.value })}
                    className="w-full px-2 py-1.5 border border-pd-blue rounded text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-pd-blue"
                    placeholder="Event name"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={event.date}
                      onChange={(e) => updateEvent(event.id, { date: e.target.value })}
                      className="px-2 py-1.5 border border-pd-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-pd-blue"
                    />
                    <input
                      type="text"
                      value={event.time}
                      onChange={(e) => updateEvent(event.id, { time: e.target.value })}
                      className="px-2 py-1.5 border border-pd-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-pd-blue"
                      placeholder="Time (e.g., 6:00 PM - 8:00 PM)"
                    />
                  </div>
                  <input
                    type="text"
                    value={event.location}
                    onChange={(e) => updateEvent(event.id, { location: e.target.value })}
                    className="w-full px-2 py-1.5 border border-pd-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-pd-blue"
                    placeholder="Location (e.g., Eastern Market, Detroit)"
                  />
                  <input
                    type="text"
                    value={event.url}
                    onChange={(e) => updateEvent(event.id, { url: e.target.value })}
                    className="w-full px-2 py-1.5 border border-pd-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-pd-blue"
                    placeholder="URL"
                  />
                  <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs font-medium text-white rounded cursor-pointer" style={{ background: "var(--pd-blue)" }}>
                    Done
                  </button>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <span className="text-pd-muted mt-0.5 cursor-grab select-none" title="Drag to reorder">⠿</span>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setEditingId(event.id)}>
                    <p className="text-sm font-semibold text-foreground leading-snug">{event.title || "(click to edit)"}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {event.date && (
                        <span className="text-xs text-pd-muted">
                          {formatDate(event.date)}
                          {event.time ? ` · ${event.time}` : ""}
                        </span>
                      )}
                    </div>
                    {event.location && <p className="text-xs text-pd-muted">{event.location}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      {event.source && <span className="text-[10px] text-pd-blue font-medium">{event.source}</span>}
                      {event.url && <span className="text-[10px] text-pd-muted truncate max-w-[200px]">{event.url}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleEvent(event.id)}
                      className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-colors ${
                        event.selected ? "bg-pd-blue text-white" : "bg-slate-200 text-pd-muted"
                      }`}
                      title={event.selected ? "Included" : "Excluded"}
                    >
                      {event.selected ? "✓" : "—"}
                    </button>
                    <button
                      onClick={() => removeEvent(event.id)}
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
