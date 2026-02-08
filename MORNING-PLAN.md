# Newsletter Builder — Morning Plan
**Friday, Feb 7 2026**

---

## Priority 1: Fix What's Broken

### Curated News — consolidate into one tool
The current workflow (run News Brief Generator externally → copy output → paste into newsletter builder → parser tries to guess the format) is the root cause of the recurring formatting issues. Instead of fixing the parser again, **move the news brief generation directly into the newsletter builder**:
- Add a "Generate Briefs" button to the What We're Reading section
- User pastes raw URLs or article links
- Claude API generates headlines + summaries and writes them straight into the curated stories state — no intermediate format, no parsing
- Eliminates the copy-paste step and the markdown artifacts entirely
- The existing drag-reorder and inline WYSIWYG editing still work on top of this

### Hydration error
The `mounted` guard added to `NewsletterContext` should eliminate this. Verify by refreshing the page — if it still appears, we'll need to check if any component reads `window` or `localStorage` outside the context provider.

---

## Priority 2: Connect Events & Jobs

Both selectors currently use mock data. Need real integrations:

### Events — CitySpark or another source
- Decide on data source (CitySpark API? Google Calendar? Manual paste like curated news?)
- Build `/api/events/route.ts`
- Wire up EventsSelector to call the real API

### Jobs — WordPress or external
- Decide on data source (WordPress job board? Idealist? Manual entry?)
- Build `/api/jobs/route.ts`
- Wire up JobsSelector to call the real API

**Question for Nina:** Where do events and jobs actually come from today? That determines the API integration.

---

## Priority 3: Environmental Data Widgets

The CO2 widget now fetches three data sources in parallel. To complete:

### Air Quality (AQI)
- Get a free API key from [airnowapi.org](https://www.airnowapi.org/account/request/)
- Add `AIRNOW_API_KEY=your_key` to `.env.local`
- The widget will then show Detroit's real-time AQI

### Lake Levels
- Already fetching from NOAA GLERL — verify the CSV format parses correctly
- May need to adjust column detection if NOAA changes their CSV layout

### Nice-to-haves (if time allows)
- UV Index (EPA, no key needed)
- Pollen forecast (Google Pollen API, free tier)

---

## Priority 4: Polish & QA

### Preview/HTML sync audit
The preview page and Header.tsx (ActiveCampaign HTML generator) must match exactly. Currently there's a minor difference in how photo layouts render — align them.

### Test the full workflow end-to-end
1. Fetch PD stories (should default to unchecked now)
2. Select stories, write intro, generate subject line
3. Import curated news, edit with WYSIWYG
4. Add events/jobs (once connected)
5. Fetch environmental data
6. Preview the newsletter
7. Generate & send to ActiveCampaign as draft

### Component naming cleanup
- `SubjectLineEditor.tsx` actually edits the P.S. CTA — rename for clarity

### Extract shared HTML generator
- Both `preview/page.tsx` and `Header.tsx` generate the same newsletter HTML independently
- Every visual change has to be made in two places — this is how things get out of sync
- Extract a single `generateNewsletterHTML(state)` utility that both files call

---

## What's Done (for reference)

- [x] Tab reorganization (Content, Settings & Auto, Ads)
- [x] Date selector, logo, header styling
- [x] Planet Champions & Impact Partners with URLs
- [x] ActiveCampaign v1 API integration
- [x] Featured Promo editor
- [x] Curated news import with drag-reorder
- [x] Mark As Ready toggles on all sections
- [x] WYSIWYG editors (Intro, P.S. CTA, Featured Promo, Curated summary)
- [x] Donation link updated to Donorbox
- [x] Newsletter styling (white header, CTA orange, sponsor formatting)
- [x] Consistent section spacing
- [x] Environmental dashboard strip (CO2 + AQI + Lake Erie)
- [x] Social icons in footer (Facebook, Bluesky, Instagram, LinkedIn, Nextdoor, TikTok)
- [x] Stories default to unchecked
- [x] Hydration error fix
- [x] Sponsor line spacing tightened
