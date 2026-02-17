# Changelog — 2026-02-17

## Summary

This session added a **Sponsored Content section**, **social share links** on PD stories, **ActiveCampaign preview text sync**, and several smaller improvements to the ad builder and email rendering.

---

## New: Sponsored Content Section

A dedicated section for sponsored posts pulled from WordPress's "Sponsored" category (`sponsor-stories` slug, category ID 1348).

### Files created
- `src/app/api/wordpress/sponsored/route.ts` — API route that looks up the `sponsor-stories` category by slug, then fetches posts from the last 90 days with embedded featured media. Returns the same `{ posts: [...] }` shape as the regular posts route.
- `src/components/Sections/SponsoredContentSelector.tsx` — Simplified version of PDStoriesSelector with amber/yellow theming. Includes fetch button, checkbox selection, per-post photo layout picker, sponsor name input, and "Mark as Ready" button.

### Files modified
- **`src/types/newsletter.ts`** — Added `sponsoredPosts: PDPost[]` and `sponsoredByName: string` to `NewsletterState`. Added `sponsored-content` section (order 2, icon `💛`, tab `content`). Bumped remaining content section orders to 3–7.
- **`src/context/NewsletterContext.tsx`** — Added `sponsoredPosts: []` and `sponsoredByName: ""` to initial state. Added reducer actions: `SET_SPONSORED_POSTS`, `TOGGLE_SPONSORED_POST`, `SET_SPONSORED_POST_PHOTO_LAYOUT`, `SET_SPONSORED_BY_NAME`.
- **`src/components/Sections/SectionEditor.tsx`** — Added `case "sponsored-content"` routing to `SponsoredContentSelector`.
- **`src/lib/generateNewsletterHTML.ts`** — Renders sponsored section after the PD Stories ad slot, before Civic Action. Uses light yellow background (`#fffbeb`), centered "SPONSORED" pill badge (`#fbbf24`), and optional "by {sponsor name}" line in amber text (`#92400e`).

### Sponsored posts excluded from PD Stories
- **`src/app/api/wordpress/posts/route.ts`** — Now looks up the `sponsor-stories` category ID and passes `categories_exclude={id}` to the WP API, preventing sponsored posts from appearing in the regular "Reporting from Planet Detroit" fetch.

### Sponsored post rendering
- Sponsored posts use `subtitleOnly: true` — they show the subtitle if present but do **not** fall back to the excerpt. If no subtitle exists, only the headline and image render.

---

## New: Social Share Links on PD Stories

Each story in "Reporting from Planet Detroit" now shows a `Share:` line with links for **Bluesky | X | FB | LinkedIn | Reddit | Nextdoor | Email**.

- Platform-specific social tags are included in share text:
  - Bluesky: `@planetdetroit.bsky.social`
  - X: `via @PlanetDetroit`
  - Facebook: `via @planetdetroitnews`
  - Reddit: `| Planet Detroit`
  - Nextdoor: `via Planet Detroit`
- Email uses a Gmail web compose link (`mail.google.com/mail/?view=cm`) since `mailto:` is unreliable inside email clients.
- Share links only appear on PD stories, **not** on sponsored posts.
- Styling: 11px light gray (`#94a3b8`) with light separators.

### Implementation
- `renderShareLinks()` helper added to `generateNewsletterHTML.ts`
- `renderStoryHTML()` now accepts an options object: `{ shareLinks?: boolean, subtitleOnly?: boolean }`

---

## Fix: ActiveCampaign Preview Text Sync

Preview text entered in the builder was not being sent to ActiveCampaign — it only existed as a hidden div in the HTML.

- **`src/components/Dashboard/Header.tsx`** — Now includes `previewText: state.previewText` in the API request body.
- **`src/app/api/activecampaign/route.ts`** — Added `previewText` to `RequestBody` interface. Passes it as `preheader_text` in the v1 `message_add` call.

---

## Improvement: Ad Name Input Moved

- **`src/components/Sections/AdManager.tsx`** — The "Ad Name" input was previously hidden inside the "Add to Newsletter" section (only visible after filling out ad content). It is now the **first field** in the ad builder, always visible, so ads can be named before building them.

---

## Infrastructure: Vercel Build Cache Fix

Vercel was aggressively caching builds and not recompiling source files on new deploys.

- **`next.config.ts`** — Added `generateBuildId: () => \`build-${Date.now()}\`` to force a unique build ID on every deployment, preventing stale cached builds.

---

## Key Architecture Notes for Future Sessions

- **WordPress sponsored category:** slug is `sponsor-stories` (not `sponsored`), category ID `1348`.
- **`renderStoryHTML()`** now takes an options object instead of a boolean — use `{ shareLinks: true }` for PD stories and `{ subtitleOnly: true }` for sponsored posts.
- **State migration** (`migrateState` in `NewsletterContext.tsx`) automatically picks up new fields from `initialState` and new sections from `DEFAULT_SECTIONS` — no manual migration needed for additive changes.
- **Vercel deploys:** The `generateBuildId` in `next.config.ts` ensures fresh builds. If builds ever seem stale again, this is the mechanism that prevents it.
