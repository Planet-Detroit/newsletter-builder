"use client";

import { useRef, useEffect, useCallback } from "react";

interface MiniWysiwygProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  showLink?: boolean;
}

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
}: MiniWysiwygProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);

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
