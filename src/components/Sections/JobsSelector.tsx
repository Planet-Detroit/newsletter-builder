"use client";

import { useState, useRef } from "react";
import { useNewsletter } from "@/context/NewsletterContext";
import { JobListing, PartnerTier } from "@/types/newsletter";
import MiniWysiwyg from "./MiniWysiwyg";

const TIER_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  champion: { label: "Planet Champion", color: "#2982C4", bg: "#e8f4fd" },
  partner: { label: "Impact Partner", color: "#16a34a", bg: "#ecfdf5" },
};

export default function JobsSelector() {
  const { state, dispatch } = useNewsletter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pasteInput, setPasteInput] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const sectionStatus = state.sections.find((s) => s.id === "jobs")?.status;
  const showDescriptions = state.jobsShowDescriptions ?? true;

  // Fetch from WordPress
  const handleFetchWP = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/wordpress/jobs");
      const data = await res.json();
      if (data.error && !data.debug) throw new Error(data.error);

      if (data.jobs && data.jobs.length > 0) {
        dispatch({ type: "SET_JOBS", payload: [...state.jobs, ...data.jobs] });
        dispatch({ type: "UPDATE_SECTION_STATUS", payload: { id: "jobs", status: "needs_attention" } });
      } else {
        const debugInfo = data.debug ? "\n\nDebug:\n" + data.debug.join("\n") : "";
        setError((data.message || "No jobs found on WordPress.") + debugInfo);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch jobs");
    } finally {
      setIsLoading(false);
    }
  };

  // Parse pasted text with AI
  const handleParsePaste = async () => {
    if (!pasteInput.trim()) return;
    setIsParsing(true);
    setError(null);

    try {
      const res = await fetch("/api/parse-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: pasteInput }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `API returned ${res.status}`);
      }
      const data = await res.json();
      if (data.jobs && data.jobs.length > 0) {
        dispatch({ type: "SET_JOBS", payload: [...state.jobs, ...data.jobs] });
        dispatch({ type: "UPDATE_SECTION_STATUS", payload: { id: "jobs", status: "needs_attention" } });
        setPasteInput("");
        setShowPaste(false);
      } else {
        setError("Couldn't extract any jobs from the pasted text.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Parsing failed");
    } finally {
      setIsParsing(false);
    }
  };

  // Manual add
  const handleAddManual = () => {
    const newJob: JobListing = {
      id: `job-${Date.now()}-manual`,
      organization: "",
      title: "",
      url: "",
      description: "",
      datePosted: new Date().toISOString().slice(0, 10),
      selected: false,
      featured: false,
      partnerTier: null,
    };
    dispatch({ type: "SET_JOBS", payload: [...state.jobs, newJob] });
    setEditingId(newJob.id);
  };

  // Drag-and-drop reorder
  const handleDragStart = (idx: number) => { dragItem.current = idx; };
  const handleDragEnter = (idx: number) => { dragOverItem.current = idx; };
  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      const items = [...state.jobs];
      const [moved] = items.splice(dragItem.current, 1);
      items.splice(dragOverItem.current, 0, moved);
      dispatch({ type: "SET_JOBS", payload: items });
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  // Update a job field
  const updateJob = (id: string, field: Partial<JobListing>) => {
    const updated = state.jobs.map((j) => (j.id === id ? { ...j, ...field } : j));
    dispatch({ type: "SET_JOBS", payload: updated });
  };

  // Toggle select
  const toggleJob = (id: string) => {
    const updated = state.jobs.map((j) => (j.id === id ? { ...j, selected: !j.selected } : j));
    dispatch({ type: "SET_JOBS", payload: updated });
  };

  // Move to top
  const moveToTop = (idx: number) => {
    if (idx === 0) return;
    const items = [...state.jobs];
    const [moved] = items.splice(idx, 1);
    items.unshift(moved);
    dispatch({ type: "SET_JOBS", payload: items });
  };

  // Remove
  const removeJob = (id: string) => {
    dispatch({ type: "SET_JOBS", payload: state.jobs.filter((j) => j.id !== id) });
  };

  const toggleReady = () => {
    dispatch({
      type: "UPDATE_SECTION_STATUS",
      payload: { id: "jobs", status: sectionStatus === "ready" ? "needs_attention" : "ready" },
    });
  };

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleFetchWP}
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          style={{ background: isLoading ? "var(--pd-muted)" : "var(--pd-blue)" }}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Fetching from WordPress...
            </span>
          ) : (
            "Fetch from WordPress"
          )}
        </button>
        <button
          onClick={() => setShowPaste(!showPaste)}
          className="px-4 py-2.5 text-sm font-medium rounded-lg border border-pd-border text-pd-muted hover:border-pd-blue hover:text-pd-blue transition-colors cursor-pointer"
        >
          Paste
        </button>
        <button
          onClick={handleAddManual}
          className="px-4 py-2.5 text-sm font-medium rounded-lg border border-pd-border text-pd-muted hover:border-pd-blue hover:text-pd-blue transition-colors cursor-pointer"
          title="Add a job manually"
        >
          + Manual
        </button>
      </div>

      {/* Paste import area */}
      {showPaste && (
        <div className="p-4 bg-pd-blue-50 rounded-lg border border-pd-blue/20">
          <p className="text-sm text-pd-blue-dark mb-3">
            <strong>Paste job listings</strong> from your WordPress plugin export, email, spreadsheet, or any text format. The AI will extract organization, title, description, and URLs.
          </p>
          <textarea
            value={pasteInput}
            onChange={(e) => setPasteInput(e.target.value)}
            placeholder={"Michigan Dept. of Environment \u2014 Environmental Quality Analyst\nhttps://example.com/job1\nAnalyze environmental data...\n\nGreat Lakes Law Center \u2014 Staff Attorney\nhttps://example.com/job2\nRepresent communities..."}
            rows={6}
            className="w-full px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue resize-y font-mono"
            disabled={isParsing}
          />
          <button
            onClick={handleParsePaste}
            disabled={!pasteInput.trim() || isParsing}
            className="mt-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            style={{ background: pasteInput.trim() && !isParsing ? "var(--pd-blue)" : "var(--pd-muted)" }}
          >
            {isParsing ? "Parsing..." : "Parse Jobs"}
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Job list */}
      {state.jobs.length > 0 && (
        <div className="space-y-2 mt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">
              {state.jobs.length} job{state.jobs.length !== 1 ? "s" : ""} &mdash; drag to reorder, click to edit
            </h4>
            <button
              onClick={() => {
                if (confirm("Clear all jobs? This cannot be undone.")) {
                  dispatch({ type: "SET_JOBS", payload: [] });
                  dispatch({ type: "UPDATE_SECTION_STATUS", payload: { id: "jobs", status: "empty" } });
                }
              }}
              className="px-3 py-1 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
            >
              Reset All
            </button>
          </div>

          {/* Description blurb toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none py-1">
            <input
              type="checkbox"
              checked={showDescriptions}
              onChange={(e) => dispatch({ type: "SET_JOBS_SHOW_DESCRIPTIONS", payload: e.target.checked })}
              className="accent-[#2982C4] w-3.5 h-3.5"
            />
            <span className="text-xs text-pd-muted">Show description blurbs on unfeatured jobs</span>
          </label>

          {state.jobs.map((job, idx) => (
            <div
              key={job.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragEnter={() => handleDragEnter(idx)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`p-3 border rounded-lg transition-all cursor-grab active:cursor-grabbing ${
                job.featured && job.selected
                  ? "border-amber-300 bg-amber-50/40 ring-1 ring-amber-200"
                  : job.selected
                  ? "border-pd-border bg-white"
                  : "border-pd-border/50 bg-slate-50 opacity-60"
              }`}
            >
              {editingId === job.id ? (
                /* Edit mode */
                <div className="space-y-2">
                  <input
                    type="text"
                    value={job.title}
                    onChange={(e) => updateJob(job.id, { title: e.target.value })}
                    className="w-full px-2 py-1.5 border border-pd-blue rounded text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-pd-blue"
                    placeholder="Job title"
                  />
                  <input
                    type="text"
                    value={job.organization}
                    onChange={(e) => updateJob(job.id, { organization: e.target.value })}
                    className="w-full px-2 py-1.5 border border-pd-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-pd-blue"
                    placeholder="Organization"
                  />
                  <MiniWysiwyg
                    value={job.description}
                    onChange={(html) => updateJob(job.id, { description: html })}
                    placeholder="Description"
                    minHeight="60px"
                    showLink={false}
                  />
                  <input
                    type="text"
                    value={job.url}
                    onChange={(e) => updateJob(job.id, { url: e.target.value })}
                    className="w-full px-2 py-1.5 border border-pd-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-pd-blue"
                    placeholder="URL"
                  />

                  {/* Featured + Partner controls */}
                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={job.featured ?? false}
                        onChange={(e) => updateJob(job.id, { featured: e.target.checked })}
                        className="accent-amber-500 w-3.5 h-3.5"
                      />
                      <span className="text-xs font-medium text-amber-700">Featured</span>
                    </label>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-pd-muted">Partner:</span>
                      <select
                        value={job.partnerTier ?? ""}
                        onChange={(e) =>
                          updateJob(job.id, {
                            partnerTier: (e.target.value || null) as PartnerTier,
                          })
                        }
                        className="px-2 py-1 text-xs border border-pd-border rounded focus:outline-none focus:ring-1 focus:ring-pd-blue bg-white"
                      >
                        <option value="">None</option>
                        <option value="champion">Planet Champion</option>
                        <option value="partner">Impact Partner</option>
                      </select>
                    </div>
                  </div>

                  <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs font-medium text-white rounded cursor-pointer" style={{ background: "var(--pd-blue)" }}>
                    Done
                  </button>
                </div>
              ) : (
                /* Display mode */
                <div className="flex items-start gap-2">
                  <span className="text-pd-muted mt-0.5 cursor-grab select-none" title="Drag to reorder">{"\u2807"}</span>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setEditingId(job.id)}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {job.featured && (
                        <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded bg-amber-100 text-amber-700 leading-none">
                          Featured
                        </span>
                      )}
                      {job.partnerTier && TIER_LABELS[job.partnerTier] && (
                        <span
                          className="inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded leading-none"
                          style={{ background: TIER_LABELS[job.partnerTier].bg, color: TIER_LABELS[job.partnerTier].color }}
                        >
                          {TIER_LABELS[job.partnerTier].label}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-foreground leading-snug mt-0.5">{job.title || "(click to edit)"}</p>
                    {job.organization && <p className="text-xs font-medium mt-0.5" style={{ color: "var(--pd-blue)" }}>{job.organization}</p>}
                    {job.description && <p className="text-xs text-pd-muted mt-0.5 line-clamp-2">{job.description}</p>}
                    {job.url && <span className="text-[10px] text-pd-muted truncate block mt-1 max-w-[300px]">{job.url}</span>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {idx > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); moveToTop(idx); }}
                        className="w-6 h-6 rounded flex items-center justify-center text-xs text-pd-muted hover:text-pd-blue hover:bg-blue-50 transition-colors"
                        title="Move to top"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="2" y1="1.5" x2="10" y2="1.5" />
                          <polyline points="3.5,7 6,4 8.5,7" />
                          <line x1="6" y1="4" x2="6" y2="11" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => toggleJob(job.id)}
                      className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-colors ${
                        job.selected ? "bg-pd-blue text-white" : "bg-slate-200 text-pd-muted"
                      }`}
                      title={job.selected ? "Included" : "Excluded"}
                    >
                      {job.selected ? "\u2713" : "\u2014"}
                    </button>
                    <button
                      onClick={() => removeJob(job.id)}
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
            {sectionStatus === "ready" ? "\u2713 Ready \u2014 click to unmark" : "Mark as Ready"}
          </button>
        </div>
      )}
    </div>
  );
}
