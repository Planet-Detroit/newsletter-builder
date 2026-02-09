"use client";

import { useRef, useEffect, useCallback, useState } from "react";

interface MiniWysiwygProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  showLink?: boolean;
  showEmoji?: boolean;
}

const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  { label: "News", emojis: ["📰", "🗞️", "📢", "📣", "🔔", "⚡", "🚨", "📌", "📍", "🏛️"] },
  { label: "Environment", emojis: ["🌍", "🌊", "🌿", "🌱", "♻️", "🌡️", "💧", "🔥", "☀️", "🌧️", "❄️", "🌳", "🐟", "🦅"] },
  { label: "Community", emojis: ["🏘️", "🤝", "💚", "🎉", "📅", "💼", "🗳️", "⚖️", "🏗️", "🚗"] },
  { label: "Actions", emojis: ["👉", "👆", "✅", "❌", "⚠️", "💡", "🔗", "📧", "📞", "🎯"] },
];

/**
 * A lightweight WYSIWYG editor using contentEditable.
 * Supports Bold, Italic, and optionally Link formatting.
 * Stores HTML internally; the parent sees cleaned HTML via onChange.
 */
export default function MiniWysiwyg({
  value,
  onChange,
  placeholder = "Type here...",
  minHeight = "80px",
  showLink = true,
  showEmoji = true,
}: MiniWysiwygProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);

  // Close emoji picker on outside click
  useEffect(() => {
    if (!emojiOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setEmojiOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [emojiOpen]);

  // Sync external value → contentEditable (only when change comes from outside)
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    isInternalUpdate.current = true;
    onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const execFmt = (command: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    handleInput();
  };

  const handleBold = () => execFmt("bold");
  const handleItalic = () => execFmt("italic");
  const handleLink = () => {
    const url = prompt("Enter URL:");
    if (url) execFmt("createLink", url);
  };

  const insertEmoji = (emoji: string) => {
    editorRef.current?.focus();
    document.execCommand("insertText", false, emoji);
    handleInput();
    setEmojiOpen(false);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");
    if (html) {
      const cleaned = html
        .replace(/<(?!\/?(b|i|em|strong|a|br)\b)[^>]+>/gi, "")
        .replace(/ (class|style|id)="[^"]*"/gi, "");
      document.execCommand("insertHTML", false, cleaned);
    } else {
      document.execCommand("insertText", false, text);
    }
    handleInput();
  };

  return (
    <div className="border border-pd-border rounded-lg overflow-hidden focus-within:border-pd-blue focus-within:ring-1 focus-within:ring-pd-blue">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-pd-border/60 bg-slate-50/80">
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); handleBold(); }}
          className="px-2 py-0.5 text-sm font-bold rounded hover:bg-slate-200 transition-colors"
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); handleItalic(); }}
          className="px-2 py-0.5 text-sm italic rounded hover:bg-slate-200 transition-colors"
          title="Italic"
        >
          I
        </button>
        {showLink && (
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); handleLink(); }}
            className="px-2 py-0.5 text-sm rounded hover:bg-slate-200 transition-colors"
            title="Insert link"
            style={{ color: "var(--pd-blue)" }}
          >
            🔗
          </button>
        )}
        {showEmoji && (
          <div ref={emojiRef} style={{ position: "relative" }}>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setEmojiOpen(!emojiOpen); }}
              className="px-2 py-0.5 text-sm rounded hover:bg-slate-200 transition-colors"
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
        )}
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        className="px-3 py-2 text-sm focus:outline-none"
        style={{ minHeight }}
      >
        {/* placeholder is handled via CSS */}
      </div>

      <style jsx>{`
        [contenteditable]:empty::before {
          content: "${placeholder.replace(/"/g, '\\"')}";
          color: #94a3b8;
          pointer-events: none;
        }
        [contenteditable] a {
          color: var(--pd-blue);
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
