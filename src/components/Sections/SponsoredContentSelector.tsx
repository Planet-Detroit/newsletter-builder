"use client";

import { useState } from "react";
import { useNewsletter } from "@/context/NewsletterContext";
import { PhotoLayout } from "@/types/newsletter";

const PHOTO_OPTS: { value: PhotoLayout; icon: string; tip: string }[] = [
  { value: "none", icon: "\u00D8", tip: "No photo" },
  { value: "small-left", icon: "\u25E7", tip: "Thumbnail left" },
  { value: "top", icon: "\u25A3", tip: "Full image on top" },
];

export default function SponsoredContentSelector() {
  const { state, dispatch } = useNewsletter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sectionStatus = state.sections.find((s) => s.id === "sponsored-content")?.status;

  const handleFetch = async () => {
    setIsLoading(true);
    setError(null);
    dispatch({ type: "UPDATE_SECTION_STATUS", payload: { id: "sponsored-content", status: "loading" } });
    try {
      const res = await fetch("/api/wordpress/sponsored");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `API returned ${res.status}`);
      }
      const data = await res.json();
      dispatch({ type: "SET_SPONSORED_POSTS", payload: data.posts });
      dispatch({
        type: "UPDATE_SECTION_STATUS",
        payload: { id: "sponsored-content", status: data.posts.length > 0 ? "needs_attention" : "empty" },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Fetch failed";
      setError(msg);
      dispatch({ type: "UPDATE_SECTION_STATUS", payload: { id: "sponsored-content", status: "empty" } });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleFetch}
        disabled={isLoading}
        className="w-full px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
        style={{ background: isLoading ? "var(--pd-muted)" : "#d97706" }}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Fetching sponsored posts...
          </span>
        ) : (
          "Fetch Sponsored Posts"
        )}
      </button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Sponsor name */}
      <div>
        <label className="block text-xs font-medium text-pd-muted mb-1">Sponsor Name</label>
        <input
          type="text"
          value={state.sponsoredByName}
          onChange={(e) => dispatch({ type: "SET_SPONSORED_BY_NAME", payload: e.target.value })}
          placeholder="e.g. Detroit Zoo"
          className="w-full px-3 py-2 text-sm border border-pd-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
        />
        <p className="text-[11px] text-pd-muted/60 mt-1">Appears below the "SPONSORED" badge in the email</p>
      </div>

      {/* Post cards */}
      <div className="space-y-1.5">
        {state.sponsoredPosts.map((post) => (
          <div
            key={post.id}
            className={`rounded-lg border transition-all duration-150 ${
              post.selected
                ? "border-amber-400/60 bg-amber-50/30 shadow-sm"
                : "border-pd-border/60 bg-slate-50/50"
            }`}
          >
            <div className="px-3 py-2.5">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={post.selected}
                  onChange={() => dispatch({ type: "TOGGLE_SPONSORED_POST", payload: post.id })}
                  className="mt-0.5 rounded shrink-0"
                  style={{ accentColor: "#d97706" }}
                />
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => dispatch({ type: "TOGGLE_SPONSORED_POST", payload: post.id })}
                >
                  <p className={`text-sm font-medium leading-snug ${post.selected ? "text-foreground" : "text-pd-muted line-through decoration-pd-muted/30"}`}>
                    {post.title}
                  </p>
                  {post.subtitle && (
                    <p className="text-xs text-pd-muted/70 mt-0.5 truncate">{post.subtitle}</p>
                  )}
                </div>
                <span className="text-[11px] text-pd-muted/60 whitespace-nowrap shrink-0 mt-0.5">
                  {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>

              {/* Photo layout picker for selected posts */}
              {post.selected && post.featuredImage && (
                <div className="flex items-center gap-1 mt-2 ml-6">
                  <span className="text-[10px] text-pd-muted/50 uppercase tracking-wider mr-1">Image:</span>
                  {PHOTO_OPTS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => dispatch({ type: "SET_SPONSORED_POST_PHOTO_LAYOUT", payload: { id: post.id, layout: opt.value } })}
                      className={`px-1.5 py-0.5 text-[10px] rounded border transition-all ${
                        post.photoLayout === opt.value
                          ? "border-amber-500 bg-amber-500 text-white"
                          : "border-pd-border/60 text-pd-muted/60 hover:border-amber-400/50 hover:text-amber-600"
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
        ))}
      </div>

      {state.sponsoredPosts.some((p) => p.selected) && (
        <button
          onClick={() =>
            dispatch({
              type: "UPDATE_SECTION_STATUS",
              payload: { id: "sponsored-content", status: sectionStatus === "ready" ? "needs_attention" : "ready" },
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
            ? "\u2713 Ready \u2014 click to unmark"
            : `Mark as Ready (${state.sponsoredPosts.filter((p) => p.selected).length} selected)`}
        </button>
      )}
    </div>
  );
}
