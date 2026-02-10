# Next Steps & Roadmap

## Recently Completed (Feb 9, 2026)

- **Collaborative editing** — Shared draft via Redis with section-level merge. Nina and Dustin can work simultaneously without overwriting each other.
- **Ad panel overhaul** — Image support, dual CTAs, WYSIWYG body copy, WordPress image upload
- **Share preview fix** — Redis-backed storage so preview links survive Vercel cold starts
- **Session persistence** — Ads, jobs, and events carry over across New Issue resets
- **Ad tracker filtering** — Only shows sent campaigns from the last 30 days
- **Preview text reminder** — Amber warning when preheader is empty
- **Vercel KV connected** — Redis store linked to newsletter-builder project on Vercel

---

## Priority 0: First Send (Feb 10, 2026)

Tomorrow's the first real newsletter built with this tool. Things to watch for:

- **Preview text** — make sure it shows up in email client inboxes (Gmail, Apple Mail, Outlook)
- **Ad rendering** — if using image ads, test in Outlook (it's the pickiest client)
- **ActiveCampaign draft** — after clicking "Generate Newsletter," review the draft in AC before sending. Check that images load, links work, and the preheader is correct.
- **Share preview** — test the share link to make sure it works for external recipients (should load without login)

---

## Priority 1: CitySpark Events Integration

### Background

The Events section currently supports manual entry and AI-powered paste parsing. CitySpark (cityspark.com) is an event aggregation platform covering Detroit-area environmental and community events. Automating this would save significant time each issue.

### Exploration Needed

- **Does CitySpark have a public API?** Check for REST or RSS endpoints. Look for developer docs or API keys.
- **RSS/iCal feeds?** Many event platforms offer category-specific feeds (environment, sustainability, Detroit metro).
- **Structured data?** If no API, check if their pages have schema.org Event markup or JSON-LD that could be extracted.
- **Partnership?** Consider reaching out to CitySpark directly — they may offer data access for media partners.

### Implementation Plan

If CitySpark has an API or feed:
1. Add `GET /api/cityspark/events` route to fetch upcoming Detroit environmental events
2. Add "Fetch from CitySpark" button in `EventsSelector.tsx` (same pattern as WordPress fetch in Jobs)
3. Map CitySpark fields to the existing `EventItem` interface
4. Set `source: "CitySpark"` for attribution

If no API exists:
1. Build an on-demand scraper that pulls event data from CitySpark listing pages
2. Use Claude to extract and normalize event data from the page content
3. Same UI — the data source is different but the output format is identical

### Events Feature Parity with Jobs

When events are fully set up, add:
- Featured flag for emphasis (amber highlight, star badge)
- Partner tier badges (Planet Champion / Impact Partner)
- Move to top button for quick reordering
- Description visibility toggle

The `EventItem` interface will need `featured: boolean` and `partnerTier: PartnerTier` fields.

---

## Priority 2: Engineering Health (Recommended Improvements)

These aren't features — they're investments that make the existing system more reliable and easier to change. Think of them as maintenance on the tool itself.

### Extract sync logic from NewsletterContext

**What:** `NewsletterContext.tsx` is 485 lines handling state, auto-save, Redis sync, polling, and merging. Split into focused pieces.
**Why:** When something breaks in sync, you shouldn't have to read 485 lines to find it. Smaller files are easier to understand, test, and debug.
**How:** Create `useAutoSave.ts` (localStorage + Redis save logic), `useDraftSync.ts` (polling + merge logic), keep `NewsletterContext.tsx` as the coordinator that wires them together.

### Add basic tests for critical paths

**What:** Automated tests for the 3-4 things that would be worst to break.
**Why:** Right now, the only way to know if a change broke something is to click through the app manually. Tests catch regressions automatically.
**Priority tests:**
1. `generateNewsletterHTML` — does it produce valid HTML with the right sections?
2. `mergeDraftState` — does the 3-way merge actually preserve both editors' changes?
3. Ad HTML generation — do images, dual CTAs, and WYSIWYG body render correctly?
4. `isValid` logic — does the ad preview show when it should?

### Add API input validation

**What:** Validate incoming data on API routes using a library like Zod.
**Why:** Right now, if bad data hits `/api/draft`, it goes straight into Redis. Validation catches malformed requests before they corrupt your shared state.
**Where:** Start with `/api/draft` (shared state — most critical) and `/api/activecampaign` (talks to external service).

### Separate newsletter content from UI state

**What:** The `sections` array (which panels are open/ready/empty) lives in the same state object as actual newsletter content (subject line, stories, ads). These are separate concerns.
**Why:** The sync system has to carefully exclude `sections` from merge logic. If they were separate state objects from the start, sync would be simpler and less error-prone.
**When:** Next time you do a significant refactor. Not urgent, but would simplify future sync improvements.

---

## Priority 3: Feature Ideas

### Environmental Data
- Auto-fetch CO2/AQI/Lakes on page load or new issue start
- Historical trend indicators ("CO2 up 2.5 PPM from last year")

### Newsletter Templates
- Save configurations as reusable templates ("Standard Weekly", "Special Report", "Breaking News")
- Quick-start from template instead of blank state

### Brief Generator Integration
- Build brief generation directly into the newsletter builder
- Reduce the need to switch between two separate apps

### Analytics Dashboard
- Track open rates and click rates from ActiveCampaign over time
- Show which stories get the most engagement
- Suggest content types that perform well

### Social Video Scripts
- The `social-video-news-script` skill can generate 60-second video scripts from newsletter content
- One-click export: select stories, generate TikTok/Reels/Shorts script

### Email Client Preview
- Preview how the newsletter looks in Gmail, Outlook, and Apple Mail
- Catch rendering issues before sending

---

## Process Improvements

Based on how this tool was built (iteratively, feature by feature, in conversation):

- **Start each feature with a plain-language spec** — even a 3-bullet list of "what should this do?" gives you something to verify against when done
- **One feature per commit** — makes it easy to roll back a single change without untangling others
- **Keep this changelog updated** — future-you will thank present-you when you wonder "when did we add the WYSIWYG?"
- **Don't run git commands from the sandbox** — avoids the .git/HEAD.lock issue. Copy-paste push commands to your local terminal instead.
- **Test the email HTML in Litmus or Email on Acid** — free tiers exist and they show you exactly how the newsletter renders across 90+ email clients
