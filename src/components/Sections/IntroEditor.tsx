"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useNewsletter } from "@/context/NewsletterContext";
import { STAFF_MEMBERS } from "@/types/newsletter";

/** Convert any leftover markdown bold/italic to HTML */
function mdToHtml(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>");
}

const INTRO_EMOJI_GROUPS = [
  { label: "News", emojis: ["📰", "🗞️", "📢", "📣", "🔔", "⚡", "🚨", "📌", "📍", "🏛️"] },
  { label: "Environment", emojis: ["🌍", "🌊", "🌿", "🌱", "♻️", "🌡️", "💧", "🔥", "☀️", "🌧️", "❄️", "🌳", "🐟", "🦅"] },
  { label: "Community", emojis: ["🏘️", "🤝", "💚", "🎉", "📅", "💼", "🗳️", "⚖️", "🏗️", "🚗"] },
  { label: "Actions", emojis: ["👉", "👆", "✅", "❌", "⚠️", "💡", "🔗", "📧", "📞", "🎯"] },
];

export default function IntroEditor() {
  const { state, dispatch } = useNewsletter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);

  // Close emoji picker on outside click
  useEffect(() => {
    if (!emojiOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setEmojiOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [emojiOpen]);

  const sectionStatus = state.sections.find((s) => s.id === "intro")?.status;
  const selectedStaff = STAFF_MEMBERS.find((m) => m.id === state.signoffStaffId) || STAFF_MEMBERS[0];

  // Sync state → contentEditable (only when change comes from outside, e.g. AI generation)
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    const el = editorRef.current;
    if (el && el.innerHTML !== state.intro) {
      el.innerHTML = state.intro || "";
    }
  }, [state.intro]);

  /** Read HTML from the contentEditable div and push to state */
  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    isInternalUpdate.current = true;
    dispatch({ type: "SET_INTRO", payload: el.innerHTML });
  }, [dispatch]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    dispatch({ type: "UPDATE_SECTION_STATUS", payload: { id: "intro", status: "loading" } });

    try {
      const res = await fetch("/api/intro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdPosts: state.pdPosts,
          curatedStories: state.curatedStories,
          curatedNewsHtml: state.curatedNewsHtml,
          events: state.events,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `API returned ${res.status}`);
      }

      const data = await res.json();
      // Convert any markdown formatting to HTML
      const cleanIntro = mdToHtml(data.intro);
      // Setting state will trigger the useEffect above to update contentEditable
      dispatch({ type: "SET_INTRO", payload: cleanIntro });
      setSubjectOptions(data.subjectLines || []);
      dispatch({ type: "UPDATE_SECTION_STATUS", payload: { id: "intro", status: "needs_attention" } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      setError(msg);
      dispatch({ type: "UPDATE_SECTION_STATUS", payload: { id: "intro", status: "empty" } });
    } finally {
      setIsGenerating(false);
    }
  };

  const pickSubjectLine = (line: string) => {
    dispatch({ type: "SET_SUBJECT_LINE", payload: line });
  };

  /* ── Formatting commands (WYSIWYG via execCommand) ── */
  const execFmt = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    // Read updated HTML back to state
    handleInput();
  };

  const handleBold = () => execFmt("bold");
  const handleItalic = () => execFmt("italic");
  const handleLink = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const url = prompt("Enter URL:", "https://");
    if (!url) return;
    execFmt("createLink", url);
  };
  const handleHighlight = (color: string) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    // Check if selection already has this background color — toggle off if so
    const parent = sel.anchorNode?.parentElement;
    if (parent && parent.tagName === "SPAN" && parent.style.backgroundColor) {
      const current = parent.style.backgroundColor;
      // Normalize to compare (browsers store as rgb)
      const temp = document.createElement("span");
      temp.style.backgroundColor = color;
      if (current === temp.style.backgroundColor) {
        // Remove highlight by unwrapping the span
        execFmt("removeFormat");
        return;
      }
    }
    execFmt("hiliteColor", color);
  };
  const insertEmoji = (emoji: string) => {
    editorRef.current?.focus();
    document.execCommand("insertText", false, emoji);
    handleInput();
    setEmojiOpen(false);
  };

  /** Handle paste: strip everything except basic formatting */
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");

    if (html) {
      // Strip to only allow basic tags + span (for highlights)
      const cleaned = html
        .replace(/<(?!\/?(?:strong|em|b|i|a|br|p|div|span)\b)[^>]*>/gi, "")
        .replace(/ class="[^"]*"/gi, "")
        // Preserve background-color styles on spans, strip all other styles
        .replace(/<span[^>]*style="[^"]*?(background-color:\s*[^;"]+;?)[^"]*"[^>]*>/gi, '<span style="$1">')
        .replace(/<(?!span\b)([^>]*) style="[^"]*"/gi, "<$1");
      document.execCommand("insertHTML", false, cleaned);
    } else {
      document.execCommand("insertText", false, text);
    }
    handleInput();
  };

  return (
    <div className="space-y-4">
      {/* Subject line */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Subject Line
        </label>
        <input
          type="text"
          value={state.subjectLine}
          onChange={(e) => dispatch({ type: "SET_SUBJECT_LINE", payload: e.target.value })}
          placeholder="Generate intro first to get AI suggestions..."
          className="w-full px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue"
        />
        {(() => {
          const words = state.subjectLine.trim().split(/\s+/).filter(Boolean).length;
          const ok = words >= 3 && words <= 5;
          return (
            <p className="text-xs mt-1" style={{ color: words === 0 ? "#94a3b8" : ok ? "#22c55e" : "#ef4444" }}>
              {words} / 3–5 words{!ok && words > 0 ? (words < 3 ? " — too short" : " — too long") : ""}
              <span style={{ color: "#94a3b8", marginLeft: "8px" }}>({state.subjectLine.length} chars)</span>
            </p>
          );
        })()}
      </div>

      {/* Preview text (preheader) */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Preview Text
        </label>
        <input
          type="text"
          value={state.previewText}
          onChange={(e) => dispatch({ type: "SET_PREVIEW_TEXT", payload: e.target.value })}
          placeholder="The snippet readers see before opening the email..."
          className="w-full px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue"
        />
        <p className="text-xs text-pd-muted mt-1">
          {state.previewText.length > 0 ? (
            <>
              {state.previewText.length} / 90 chars ideal
              {state.previewText.length > 90 && <span style={{ color: "#ef4444" }}> — may be truncated in some email clients</span>}
            </>
          ) : (
            <span style={{ color: "#f59e0b" }}>Don&apos;t forget to add preview text — this is the snippet readers see in their inbox before opening</span>
          )}
        </p>
      </div>

      {/* Subject line suggestions */}
      {subjectOptions.length > 0 && (
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-pd-muted uppercase tracking-wider">
            AI Suggestions — click to use
          </label>
          {subjectOptions.map((line, i) => (
            <button
              key={i}
              onClick={() => pickSubjectLine(line)}
              className={`w-full text-left px-3 py-2 text-sm rounded-lg border transition-colors ${
                state.subjectLine === line
                  ? "border-pd-blue bg-pd-blue-50 text-pd-blue-dark"
                  : "border-pd-border hover:border-pd-blue hover:bg-pd-blue-50"
              }`}
            >
              {line}
            </button>
          ))}
        </div>
      )}

      {/* AI Generate */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
        style={{ background: isGenerating ? "var(--pd-muted)" : "var(--pd-blue)" }}
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Writing with Claude...
          </span>
        ) : (
          "Generate Intro + Subject Lines with Claude"
        )}
      </button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
          {error.includes("API") && (
            <p className="text-xs text-red-500 mt-1">
              Make sure ANTHROPIC_API_KEY is set in your .env.local file.
            </p>
          )}
        </div>
      )}

      {/* WYSIWYG Editor */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Editor&apos;s Letter
        </label>

        {/* Fixed greeting */}
        <div className="px-3 py-2 bg-slate-50 border border-pd-border border-b-0 rounded-t-lg text-sm text-foreground font-medium">
          Dear Planet Detroiter,
        </div>

        {/* Formatting toolbar */}
        <div className="flex items-center gap-1 px-2 py-1.5 bg-slate-100 border-x border-pd-border">
          <button
            onMouseDown={(e) => { e.preventDefault(); handleBold(); }}
            className="px-2.5 py-1 text-xs font-bold rounded hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-pd-border cursor-pointer"
            title="Bold"
          >
            B
          </button>
          <button
            onMouseDown={(e) => { e.preventDefault(); handleItalic(); }}
            className="px-2.5 py-1 text-xs italic rounded hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-pd-border cursor-pointer"
            title="Italic"
          >
            I
          </button>
          <button
            onMouseDown={(e) => { e.preventDefault(); handleLink(); }}
            className="px-2.5 py-1 text-xs rounded hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-pd-border cursor-pointer"
            style={{ color: "var(--pd-blue)" }}
            title="Insert link"
          >
            Link
          </button>
          <div className="w-px h-4 bg-pd-border mx-0.5" />
          <button
            onMouseDown={(e) => { e.preventDefault(); handleHighlight("#fff59d"); }}
            className="px-2 py-1 text-xs rounded hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-pd-border cursor-pointer"
            title="Highlight yellow (click again to remove)"
          >
            <span style={{ backgroundColor: "#fff59d", padding: "1px 4px", borderRadius: "2px" }}>A</span>
          </button>
          <button
            onMouseDown={(e) => { e.preventDefault(); handleHighlight("#b3e5fc"); }}
            className="px-2 py-1 text-xs rounded hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-pd-border cursor-pointer"
            title="Highlight blue (click again to remove)"
          >
            <span style={{ backgroundColor: "#b3e5fc", padding: "1px 4px", borderRadius: "2px" }}>A</span>
          </button>
          <div ref={emojiRef} style={{ position: "relative" }}>
            <button
              onMouseDown={(e) => { e.preventDefault(); setEmojiOpen(!emojiOpen); }}
              className="px-2.5 py-1 text-xs rounded hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-pd-border cursor-pointer"
              title="Insert emoji"
            >
              😀
            </button>
            {emojiOpen && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                zIndex: 50,
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                padding: "8px",
                width: "260px",
                maxHeight: "220px",
                overflowY: "auto",
              }}>
                {INTRO_EMOJI_GROUPS.map((group) => (
                  <div key={group.label} style={{ marginBottom: "6px" }}>
                    <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px", padding: "0 2px" }}>
                      {group.label}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>
                      {group.emojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); insertEmoji(emoji); }}
                          style={{ fontSize: "18px", padding: "2px 4px", cursor: "pointer", borderRadius: "4px", border: "none", background: "transparent", lineHeight: 1 }}
                          onMouseEnter={(e) => { (e.currentTarget.style.background = "#f1f5f9"); }}
                          onMouseLeave={(e) => { (e.currentTarget.style.background = "transparent"); }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="w-px h-4 bg-pd-border mx-1" />
          <span className="text-[10px] text-pd-muted">Select text, then click a button</span>
        </div>

        {/* contentEditable WYSIWYG area */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onPaste={handlePaste}
          data-placeholder="Write or generate the body of your intro (the greeting is added automatically)..."
          className="w-full px-3 py-3 border border-pd-border border-t-0 rounded-b-lg text-sm focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue leading-relaxed min-h-[200px] overflow-y-auto"
          style={{
            maxHeight: "400px",
            color: "var(--foreground)",
          }}
        />
        {(() => {
          const textOnly = state.intro.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
          const wordCount = textOnly ? textOnly.split(/\s+/).length : 0;
          const overLimit = wordCount > 200;
          // Count paragraphs by looking at block-level separations in the HTML
          const blocks = state.intro.split(/<\/?(?:p|div|br)\s*\/?>/i).filter((b) => b.replace(/<[^>]*>/g, "").trim().length > 0);
          const paraCount = Math.max(blocks.length, textOnly ? 1 : 0);
          return (
            <div className="flex items-center justify-between mt-1 px-1">
              <p className="text-xs" style={{ color: overLimit ? "#ef4444" : "#94a3b8" }}>
                {wordCount} / 200 words{overLimit ? " — over limit" : ""}
              </p>
              {paraCount > 2 && (
                <p className="text-xs" style={{ color: "#f59e0b" }}>
                  {paraCount} paragraphs — aim for 2
                </p>
              )}
            </div>
          );
        })()}
        <style>{`
          [contenteditable]:empty::before {
            content: attr(data-placeholder);
            color: var(--pd-muted);
            pointer-events: none;
            display: block;
          }
          [contenteditable] a {
            color: #2982C4;
            text-decoration: underline;
          }
          [contenteditable]:focus {
            border-color: var(--pd-blue);
          }
        `}</style>
      </div>

      {/* ── Signoff ── */}
      <div className="border border-pd-border rounded-lg p-4 bg-slate-50/60">
        <label className="block text-sm font-medium text-foreground mb-2">Signoff</label>
        <select
          value={state.signoffStaffId}
          onChange={(e) => dispatch({ type: "SET_SIGNOFF_STAFF", payload: e.target.value })}
          className="w-full px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue bg-white mb-3"
        >
          {STAFF_MEMBERS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} — {m.title}
            </option>
          ))}
        </select>

        {/* Signoff preview */}
        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-pd-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedStaff.photoUrl}
            alt={selectedStaff.name}
            style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
          />
          <div>
            <p className="text-sm text-pd-muted italic">Thanks for reading,</p>
            <p className="text-sm font-semibold text-foreground">{selectedStaff.name}</p>
            <p className="text-xs text-pd-muted">{selectedStaff.title}</p>
          </div>
        </div>
        <p className="text-xs text-pd-muted mt-2">
          Tip: Update staff photos in <code className="bg-slate-200 px-1 rounded">src/types/newsletter.ts</code> under STAFF_MEMBERS.
        </p>
      </div>

      {state.intro && (
        <button
          onClick={() =>
            dispatch({
              type: "UPDATE_SECTION_STATUS",
              payload: { id: "intro", status: sectionStatus === "ready" ? "needs_attention" : "ready" },
            })
          }
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
