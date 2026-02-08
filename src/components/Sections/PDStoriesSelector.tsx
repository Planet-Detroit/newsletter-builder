"use client";

import { useState, useRef, useCallback } from "react";
import { useNewsletter } from "@/context/NewsletterContext";
import { PhotoLayout, PDPost } from "@/types/newsletter";

const PHOTO_OPTS: { value: PhotoLayout; icon: string; tip: string }[] = [
  { value: "none", icon: "Ø", tip: "No photo" },
  { value: "small-left", icon: "◧", tip: "Thumbnail left" },
  { value: "top", icon: "▣", tip: "Full image on top" },
];

export default function PDStoriesSelector() {
  const { state, dispatch } = useNewsletter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const sectionStatus = state.sections.find((s) => s.id === "pd-stories")?.status;

  const handleFetch = async () => {
    setIsLoading(true);
    setError(null);
    dispatch({ type: "UPDATE_SECTION_STATUS", payload: { id: "pd-stories", status: "loading" } });
    try {
      const res = await fetch("/api/wordpress/posts");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `API returned ${res.status}`);
      }
      const data = await res.json();
      dispatch({ type: "SET_PD_POSTS", payload: data.posts });
      dispatch({
        type: "UPDATE_SECTION_STATUS",
        payload: { id: "pd-stories", status: data.posts.length > 0 ? "needs_attention" : "empty" },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Fetch failed";
      setError(msg);
      dispatch({ type: "UPDATE_SECTION_STATUS", payload: { id: "pd-stories", status: "empty" } });
    } finally {
      setIsLoading(false);
    }
  };

  // Drag handlers
  const onDragStart = useCallback((idx: number) => {
    dragItem.current = idx;
    setDragIdx(idx);
  }, []);

  const onDragEnter = useCallback((idx: number) => {
    dragOverItem.current = idx;
    setOverIdx(idx);
  }, []);

  const onDragEnd = useCallback(() => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      dispatch({
        type: "REORDER_PD_POSTS",
        payload: { fromIndex: dragItem.current, toIndex: dragOverItem.current },
      });
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setDragIdx(null);
    setOverIdx(null);
  }, [dispatch]);

  // Click-to-move
  const movePost = useCallback((fromIndex: number, direction: "up" | "down") => {
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= state.pdPosts.length) return;
    dispatch({ type: "REORDER_PD_POSTS", payload: { fromIndex, toIndex } });
  }, [dispatch, state.pdPosts.length]);

  // Apply layout to all
  const setAllLayouts = (layout: PhotoLayout) => {
    dispatch({ type: "SET_STORY_PHOTO_LAYOUT", payload: layout });
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleFetch}
        disabled={isLoading}
        className="w-full px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
        style={{ background: isLoading ? "var(--pd-muted)" : "var(--pd-blue)" }}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Fetching from planetdetroit.org...
          </span>
        ) : (
          "Fetch Recent Posts from WordPress"
        )}
      </button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Bulk layout presets */}
      {state.pdPosts.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-pd-muted">
            {state.pdPosts.length} posts · drag to reorder
          </p>
          <div className="flex items-center gap-1">
            <span className="text-xs text-pd-muted mr-1">All:</span>
            {PHOTO_OPTS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setAllLayouts(opt.value)}
                className="w-6 h-6 flex items-center justify-center rounded text-xs border border-pd-border text-pd-muted hover:border-pd-blue hover:text-pd-blue transition-colors"
                title={`Set all to ${opt.tip}`}
              >
                {opt.icon}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Story cards */}
      <div className="space-y-1.5">
        {state.pdPosts.map((post, idx) => (
          <StoryCard
            key={post.id}
            post={post}
            index={idx}
            total={state.pdPosts.length}
            isDragging={dragIdx === idx}
            isOver={overIdx === idx && dragIdx !== idx}
            onToggle={() => dispatch({ type: "TOGGLE_PD_POST", payload: post.id })}
            onLayoutChange={(layout) => dispatch({ type: "SET_POST_PHOTO_LAYOUT", payload: { id: post.id, layout } })}
            onMoveUp={() => movePost(idx, "up")}
            onMoveDown={() => movePost(idx, "down")}
            onDragStart={() => onDragStart(idx)}
            onDragEnter={() => onDragEnter(idx)}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>

      {state.pdPosts.some((p) => p.selected) && (
        <button
          onClick={() =>
            dispatch({
              type: "UPDATE_SECTION_STATUS",
              payload: { id: "pd-stories", status: sectionStatus === "ready" ? "needs_attention" : "ready" },
            })
          }
          className="w-full px-4 py-2 text-sm font-medium rounded-lg border-2 transition-colors cursor-pointer"
          style={
            sectionStatus === "ready"
              ? { borderColor: "var(--pd-success)", background: "var(--pd-success)", color: "#fff" }
              : { borderColor: "var(--pd-success)", color: "var(--pd-success)" }
          }
        >
          {sectionStatus === "ready"
            ? `✓ Ready — click to unmark`
            : `Mark as Ready (${state.pdPosts.filter((p) => p.selected).length} selected)`}
        </button>
      )}
    </div>
  );
}

/* ── Individual story card ── */

interface StoryCardProps {
  post: PDPost;
  index: number;
  total: number;
  isDragging: boolean;
  isOver: boolean;
  onToggle: () => void;
  onLayoutChange: (layout: PhotoLayout) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
}

function StoryCard({
  post,
  index,
  total,
  isDragging,
  isOver,
  onToggle,
  onLayoutChange,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: StoryCardProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      className={`
        group rounded-lg border transition-all duration-150
        ${isDragging ? "opacity-40 scale-[0.98]" : "opacity-100"}
        ${isOver ? "border-pd-blue border-dashed bg-pd-blue-50" : ""}
        ${post.selected
          ? "border-pd-blue/40 bg-white shadow-sm"
          : "border-pd-border/60 bg-slate-50/50"
        }
      `}
    >
      <div className="flex items-stretch">
        {/* Drag handle + reorder arrows */}
        <div className="flex flex-col items-center justify-center w-9 shrink-0 border-r border-pd-border/40 cursor-grab active:cursor-grabbing">
          <button
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            disabled={index === 0}
            className="p-0.5 text-pd-muted/40 hover:text-pd-blue disabled:opacity-0 transition-colors"
            title="Move up"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2.5v7M3 5.5l3-3 3 3" />
            </svg>
          </button>
          <svg width="10" height="10" viewBox="0 0 10 10" className="text-pd-muted/30 my-0.5">
            <circle cx="3" cy="3" r="1" fill="currentColor" />
            <circle cx="7" cy="3" r="1" fill="currentColor" />
            <circle cx="3" cy="7" r="1" fill="currentColor" />
            <circle cx="7" cy="7" r="1" fill="currentColor" />
          </svg>
          <button
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            disabled={index === total - 1}
            className="p-0.5 text-pd-muted/40 hover:text-pd-blue disabled:opacity-0 transition-colors"
            title="Move down"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9.5v-7M3 6.5l3 3 3-3" />
            </svg>
          </button>
        </div>

        {/* Main content area */}
        <div className="flex-1 min-w-0 px-3 py-2.5">
          <div className="flex items-start gap-2.5">
            {/* Checkbox */}
            <input
              type="checkbox"
              checked={post.selected}
              onChange={onToggle}
              className="mt-0.5 rounded shrink-0"
              style={{ accentColor: "var(--pd-blue)" }}
            />

            {/* Title + subtitle */}
            <div className="flex-1 min-w-0 cursor-pointer" onClick={onToggle}>
              <p className={`text-sm font-medium leading-snug ${post.selected ? "text-foreground" : "text-pd-muted line-through decoration-pd-muted/30"}`}>
                {post.title}
              </p>
              {post.subtitle && (
                <p className="text-xs text-pd-muted/70 mt-0.5 truncate">{post.subtitle}</p>
              )}
            </div>

            {/* Date */}
            <span className="text-[11px] text-pd-muted/60 whitespace-nowrap shrink-0 mt-0.5">
              {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>

          {/* Per-card photo layout — only show for selected posts with images */}
          {post.selected && post.featuredImage && (
            <div className="flex items-center gap-1 mt-2 ml-6">
              <span className="text-[10px] text-pd-muted/50 uppercase tracking-wider mr-1">Image:</span>
              {PHOTO_OPTS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={(e) => { e.stopPropagation(); onLayoutChange(opt.value); }}
                  className={`px-1.5 py-0.5 text-[10px] rounded border transition-all ${
                    post.photoLayout === opt.value
                      ? "border-pd-blue bg-pd-blue text-white"
                      : "border-pd-border/60 text-pd-muted/60 hover:border-pd-blue/50 hover:text-pd-blue"
                  }`}
                  title={opt.tip}
                >
                  {opt.tip}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
