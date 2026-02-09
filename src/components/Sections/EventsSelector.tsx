"use client";

import { useNewsletter } from "@/context/NewsletterContext";
import MiniWysiwyg from "./MiniWysiwyg";

export default function EventsSelector() {
  const { state, dispatch } = useNewsletter();

  const sectionStatus = state.sections.find((s) => s.id === "events")?.status;

  const toggleReady = () => {
    dispatch({
      type: "UPDATE_SECTION_STATUS",
      payload: { id: "events", status: sectionStatus === "ready" ? "needs_attention" : "ready" },
    });
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-pd-blue-50 rounded-lg border border-pd-blue/20">
        <p className="text-sm text-pd-blue-dark mb-1">
          <strong>Events</strong> — Paste or type event listings below. Use bold for event names and include dates, times, locations, and links.
        </p>
        <p className="text-xs text-pd-muted">
          CitySpark integration coming soon. For now, copy events from <a href="https://cityspark.com" target="_blank" rel="noopener noreferrer" className="text-pd-blue hover:underline">CitySpark</a> and paste them here.
        </p>
      </div>

      <MiniWysiwyg
        value={state.eventsHtml}
        onChange={(html) => dispatch({ type: "SET_EVENTS_HTML", payload: html })}
        placeholder="Paste or type events here..."
        minHeight="200px"
        showLink={true}
      />

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
