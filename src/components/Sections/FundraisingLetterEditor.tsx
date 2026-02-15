"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useNewsletter } from "@/context/NewsletterContext";
import { STAFF_MEMBERS } from "@/types/newsletter";

const EMOJI_GROUPS = [
  { label: "Fundraising", emojis: ["💚", "🌱", "🙏", "🎯", "✨", "💪", "🌍", "❤️", "🤝", "⭐"] },
  { label: "Environment", emojis: ["🌊", "🌿", "♻️", "🌡️", "💧", "☀️", "🌳", "🐟", "🦅", "🔥"] },
  { label: "Actions", emojis: ["👉", "👆", "✅", "💡", "📧", "🎯", "📣", "🔗", "📌", "⚡"] },
];

export default function FundraisingLetterEditor() {
  const { state, dispatch } = useNewsletter();
  const [emojiOpen, setEmojiOpen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);

  const sectionStatus = state.sections.find((s) => s.id === "fundraising-letter")?.status;

  // Close emoji picker on outside click
  useEffect(() => {
    if (!emojiOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setEmojiOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [emojiOpen]);

  // Sync state -> contentEditable
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    const el = editorRef.current;
    if (el && el.innerHTML !== state.fundraisingLetter) {
      el.innerHTML = state.fundraisingLetter || "";
    }
  }, [state.fundraisingLetter]);

  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    isInternalUpdate.current = true;
    dispatch({ type: "SET_FUNDRAISING_LETTER", payload: el.innerHTML });
  }, [dispatch]);

  /* Formatting commands */
  const execFmt = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
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
  const insertEmoji = (emoji: string) => {
    editorRef.current?.focus();
    document.execCommand("insertText", false, emoji);
    handleInput();
    setEmojiOpen(false);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");

    if (html) {
      const cleaned = html
        .replace(/<(?!\/?(?:strong|em|b|i|a|br|p|div)\b)[^>]*>/gi, "")
        .replace(/ style="[^"]*"/gi, "")
        .replace(/ class="[^"]*"/gi, "");
      document.execCommand("insertHTML", false, cleaned);
    } else {
      document.execCommand("insertText", false, text);
    }
    handleInput();
  };

  const textOnly = state.fundraisingLetter.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  const wordCount = textOnly ? textOnly.split(/\s+/).length : 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-pd-muted">
        Write a fundraising appeal letter. This will appear as the main body of your fundraising newsletter.
      </p>

      {/* Subject line */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Subject Line
        </label>
        <input
          type="text"
          value={state.subjectLine}
          onChange={(e) => dispatch({ type: "SET_SUBJECT_LINE", payload: e.target.value })}
          placeholder="e.g., Can you help us reach our goal?"
          className="w-full px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue"
        />
        <p className="text-xs text-pd-muted mt-1">
          {state.subjectLine.length > 0 ? `${state.subjectLine.length} chars` : "Required for ActiveCampaign export"}
        </p>
      </div>

      {/* Preview text */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Preview Text
        </label>
        <input
          type="text"
          value={state.previewText}
          onChange={(e) => dispatch({ type: "SET_PREVIEW_TEXT", payload: e.target.value })}
          placeholder="The snippet readers see before opening..."
          className="w-full px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue"
        />
      </div>

      {/* WYSIWYG Editor */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Fundraising Letter
        </label>

        {/* Personalized greeting (AC merge tag) */}
        <div className="px-3 py-2 bg-slate-50 border border-pd-border border-b-0 rounded-t-lg text-sm text-foreground">
          <span className="font-medium">Dear </span>
          <span className="font-medium text-pd-blue" title="ActiveCampaign personalization tag — falls back to &quot;Planet Detroiter&quot; when no first name exists">%FIRSTNAME%</span>
          <span className="font-medium">,</span>
          <span className="text-xs text-pd-muted ml-2">(Personalizes to subscriber&apos;s first name, falls back to &ldquo;Planet Detroiter&rdquo;)</span>
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
                {EMOJI_GROUPS.map((group) => (
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
          data-placeholder="Write your fundraising appeal letter..."
          className="w-full px-3 py-3 border border-pd-border border-t-0 rounded-b-lg text-sm focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue leading-relaxed min-h-[200px] overflow-y-auto"
          style={{
            maxHeight: "400px",
            color: "var(--foreground)",
          }}
        />
        <div className="flex items-center justify-between mt-1 px-1">
          <p className="text-xs" style={{ color: wordCount > 500 ? "#ef4444" : "#94a3b8" }}>
            {wordCount} words{wordCount > 500 ? " — consider trimming" : ""}
          </p>
        </div>
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

      {/* Signoff */}
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
        {(() => {
          const selectedStaff = STAFF_MEMBERS.find((m) => m.id === state.signoffStaffId) || STAFF_MEMBERS[0];
          return (
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-pd-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedStaff.photoUrl}
                alt={selectedStaff.name}
                style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
              />
              <div>
                <p className="text-sm text-pd-muted italic">With gratitude,</p>
                <p className="text-sm font-semibold text-foreground">{selectedStaff.name}</p>
                <p className="text-xs text-pd-muted">{selectedStaff.title}</p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Mark as Ready */}
      {state.fundraisingLetter && (
        <button
          onClick={() =>
            dispatch({
              type: "UPDATE_SECTION_STATUS",
              payload: { id: "fundraising-letter", status: sectionStatus === "ready" ? "needs_attention" : "ready" },
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
