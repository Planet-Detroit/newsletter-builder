# Planet Detroit Newsletter Builder

## Overview

The Planet Detroit Newsletter Builder is a Next.js web application that streamlines the creation of Planet Detroit's email newsletter. It pulls content from WordPress, environmental APIs, and AI-powered parsing to assemble a fully formatted HTML email ready for ActiveCampaign.

The app is deployed at `newsletter-builder-azure.vercel.app` and persists drafts in the browser's localStorage. Vercel KV (Upstash Redis) is used for shareable preview links, ad performance snapshots, and brief storage. The final output is a single HTML string suitable for email clients.

---

## Architecture

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS

**State management:** React Context + useReducer, with auto-save to localStorage (1-second debounce). State is loaded on mount and migrates gracefully when the schema changes between versions.

**Key principle:** All newsletter styling is inline CSS in a single generator function (`generateNewsletterHTML.ts`). This is the single source of truth for the email output. No `<style>` tags are used, ensuring maximum email client compatibility.

---

## Authentication

All pages and API routes are protected by a shared password. The system uses Next.js middleware with HMAC-SHA256 signed cookies (Web Crypto API, Edge-compatible).

**How it works:**
- Visiting any page without a valid session redirects to `/login`
- API routes return `401 Unauthorized` without a valid session
- On successful login, an HTTP-only signed cookie (`pd_auth`) is set for 7 days
- The cookie is signed with `AUTH_SECRET` using HMAC-SHA256; changing the secret invalidates all sessions
- A "Sign out" button in the ToolNav clears the cookie

**Files:**
- `src/middleware.ts` — Route protection (checks cookie on every request)
- `src/lib/auth.ts` — Token signing/verification using Web Crypto API
- `src/app/login/page.tsx` — Login form
- `src/app/api/auth/login/route.ts` — Validates password, sets cookie
- `src/app/api/auth/logout/route.ts` — Clears cookie

---

## Cross-Navigation (ToolNav)

A slim dark navigation bar (`ToolNav.tsx`) appears at the top of every page, linking between the two Planet Detroit tools:

- **Newsletter Builder** (`newsletter-builder-azure.vercel.app`) — this app
- **Brief Generator** (`news-brief-generator.vercel.app`) — the curated news brief tool

The current tool is highlighted in white; the other is a gray link. The newsletter builder's ToolNav also includes a "Sign out" button on the right. Both apps have their own copy of the component (mirrored, with the active tool swapped).

---

## Dashboard Layout

The main page is organized into three tabs:

**Content** (6 sections): Editor's Letter, PD Stories, What We're Reading, Events, Jobs, P.S. CTA

**Settings & Auto** (6 sections): Header & Logo, CO2 / Air Quality / Lake Levels, Featured Promo, Planet Champions & Partners, Support CTA, Footer

**Ads** (1 section): Ad Manager for sponsored placements

Each section has a status badge (empty, needs attention, ready) and opens in a slide-over editor panel when clicked. A progress bar at the top tracks how many sections are marked "ready" per tab.

---

## Content Sections

### Editor's Letter (`IntroEditor.tsx`)

The main editorial section with AI generation support.

**Features:**
- Rich text editor (contentEditable) with bold, italic, link, and emoji picker buttons
- "Generate Intro & Subject Lines" button calls Claude Sonnet to draft 2-3 paragraphs and 5 subject line suggestions based on the selected stories, curated news, and events
- Subject line input at top of dashboard with word counter (3-5 word target, color-coded green/red)
- Preview text input for email preheader (hidden text that shows in inbox alongside the subject line, 90-char guide)
- Word counter (200 max, red warning when exceeded) and paragraph counter (aim for 2, amber when exceeded)
- Staff signoff selector: dropdown of 6 Planet Detroit staff members (Nina Ignaczak, Dustin Blitchok, Ethan Bakuli, Brian Allnutt, Isabelle Tavares, Ian Solomon) with live preview showing round photo, name, and title

### PD Stories (`PDStoriesSelector.tsx`)

Manages the "Reporting from Planet Detroit" section of the newsletter.

**Features:**
- "Fetch Recent Posts from WordPress" pulls posts from the last 14 days via REST API v2
- Each post card shows: thumbnail, title, excerpt, date
- Click checkbox to include/exclude from newsletter
- Per-post photo layout selector: none (text only), small-left (120x80 thumbnail floated left), top (full-width hero image)
- Bulk layout preset buttons to set all posts at once
- Drag-and-drop reorder
- Cards default to unchecked (user selects which to include)

### What We're Reading (`CuratedNewsImport.tsx`)

Curated external news stories with AI-powered summarization.

**Three import methods:**
1. **Import from Brief Generator** - Fetches pre-curated brief packets from an external Vercel KV-backed service (requires `BRIEF_GENERATOR_URL`). Each brief has a delete button (✕) that removes it from both the UI and the remote KV store.
2. **AI URL/text import** - Paste URLs or article text; Claude generates headline (with emoji), 1-2 sentence summary, and source attribution
3. **Manual add** - Empty card for hand-entry

**Per-story editing:** Inline edit headline, summary, source, URL. Drag-and-drop reorder. Toggle selection. Cards default to unchecked.

### Events (`EventsSelector.tsx`)

Community events section.

**Features:**
- Paste text + AI parsing (Claude extracts title, date, time, location, URL, source from freeform text, CSV, or email)
- Manual add
- Drag-and-drop reorder
- Edit inline: title, date picker, time, location, URL, source
- Cards default to unchecked

### Jobs (`JobsSelector.tsx`)

Environmental job listings.

**Features:**
- "Fetch from WordPress" auto-discovers job custom post type and imports listings
- "Paste" input + AI parsing (Claude extracts title, organization, description, URL)
- Manual add
- Drag-and-drop reorder + "Move to top" button on each card
- Featured flag: amber highlight in editor and warm yellow background in newsletter HTML with a star badge
- Partner tier badges: Planet Champion (blue) or Impact Partner (green) with link to planetdetroit.org/impactpartners/
- Description visibility toggle: checkbox to show/hide description blurbs on unfeatured jobs (featured jobs always show descriptions)
- Cards default to unchecked

### P.S. CTA (`PSCtaEditor.tsx`)

A post-script call-to-action that appears after the editor's letter.

**Features:**
- Rich text area for the P.S. message
- Button text input (default: "Support Planet Detroit")
- Button URL input (default: donorbox.org link)
- Live preview showing orange (#ea5a39) button with white text

---

## Settings & Auto Sections

### Header & Logo (`HeaderEditor.tsx`)

- Logo URL input with live preview (default: Planet Detroit logo from WordPress media library)
- Issue date picker (used in header and filename exports)

### CO2 / Air Quality / Lake Levels (`CO2Widget.tsx`)

Fetches three environmental data points with individual or bulk fetch buttons:

- **Atmospheric CO2**: Weekly data from NOAA Mauna Loa (current PPM, year-over-year change)
- **Air Quality**: Detroit area AQI from EPA AirNow (ZIP 48201, 25-mile radius)
- **Lake Levels**: Lake Erie and Michigan-Huron from NOAA GLERL (meters, monthly change)

Each data source can be fetched individually (CO₂, AQI, Lakes buttons) or all at once (Fetch All). Each fetched data point has a ✕ button to clear it from the newsletter, allowing editors to include only the data they want. Data is rendered as a compact strip in the newsletter header.

### Featured Promo (`FeaturedPromoEditor.tsx`)

Optional announcement box that appears below the intro.

Fields: headline, description, image URL, CTA button text, CTA button URL. Light blue background in the newsletter.

### Planet Champions & Partners (`SponsorsEditor.tsx`)

Two lists of sponsor organizations. Each has a name and optional URL. Pre-populated with ~35 default partners. Champions and Partners are displayed separately in the newsletter with distinct headings.

### Support CTA (`SupportCtaEditor.tsx`)

Bottom-of-newsletter donation call-to-action. Editable headline, button text, and button URL. Renders with orange (#ea5a39) button on white background.

### Footer

Hardcoded in `generateNewsletterHTML.ts`. Contains: Planet Detroit logo/link, tagline ("Stay informed about your environment and your health."), social media icons (Facebook, Bluesky, Instagram, LinkedIn, Nextdoor, TikTok), mailing address (The Green Garage, 4444 Second Avenue, Detroit, MI 48201), and ActiveCampaign unsubscribe/preferences links.

---

## Ad Management (`AdManager.tsx`)

A full ad builder and performance tracker for sponsored placements.

### Ad Builder

Creates email-compatible ad HTML with a visual builder. Fields include:

- **Ad image** (optional): URL input or direct upload to WordPress media library via REST API. Recommended size 970×350px. Images render full-width above the headline/body content.
- **Headline**: Text with word counter (16-word guide)
- **Body copy**: WYSIWYG editor (MiniWysiwyg) with bold, italic, and link support
- **Primary CTA**: Button text + URL with auto-generated UTM parameters (utm_source=newsletter, utm_medium=email, utm_campaign=planet-detroit-newsletter, utm_content=headline-slug)
- **Second CTA** (optional): Toggle to add a second button. Two buttons render side-by-side when there's room, stacking vertically on narrow screens. Uses inline-block layout with MSO conditional comments for Outlook compatibility.
- **Color scheme**: PD Blue (#2982C4) or PD Orange (#ea5a39)

The ad layout order is: image → Sponsored tag → headline → body → CTA button(s). The preview and "Add to Newsletter" sections appear as soon as any field has content.

### Ad Placement

Supports 4 newsletter positions: After Intro, After PD Stories, After What We're Reading, Before Footer. Each placed ad has an active/inactive toggle and can be removed.

### Ad Performance Tracker

Connects to the ActiveCampaign API to track ad link performance:

- Campaign dropdown listing sent campaigns (v3 API)
- Summary stats: total sent, open rate, total clicks
- Per-link click table with unique click counts; links matching ad CTAs are highlighted in orange
- **Save Snapshot** button stores performance data to Vercel KV (Upstash Redis) with a 90-day TTL and optional note
- Link to `/ad-history` page

### Ad History Page (`/ad-history`)

Protected page (behind login) that displays saved performance snapshots. Features expandable cards with campaign stats and per-link breakdowns, campaign filter dropdown, delete buttons, and a **Download CSV** button per snapshot for sharing reports with advertising clients.

---

## Newsletter HTML Generation

The `generateNewsletterHTML.ts` file is the single source of truth for the final email output. It takes the entire `NewsletterState` and produces a complete HTML document.

**Rendering pipeline (in order):**

1. Header with logo, issue date, and environmental data strip
2. Greeting + Editor's Letter body + staff signoff
3. P.S. CTA (if text present)
4. Featured Promo (if configured)
5. Ad slot: after-intro
6. PD Stories with per-story photo layouts
7. Ad slot: after-pd-stories
8. What We're Reading (curated news)
9. Ad slot: after-reading
10. Jobs with featured badges, partner tier badges, conditional descriptions
11. Events with formatted dates
12. Sponsors section (Champions + Partners)
13. Support CTA
14. Ad slot: before-footer
15. Footer with social links and address

**Design constants:**
- Max width: 600px
- Primary blue: #2982C4
- CTA orange: #ea5a39
- Body text: #333, headings: #1e293b
- Font: Arial, Helvetica, sans-serif
- All styles are inline for email client compatibility

---

## Preview & Export

The `/preview` page provides:

- **Live preview** in a responsive iframe (desktop 700px or mobile 375px toggle)
- **Share preview** — Stores the newsletter HTML in Vercel KV (with in-memory fallback) and copies a public URL. The `/newsletter-preview` page is exempt from auth, so links can be shared with clients and stakeholders. Preview links expire after 7 days.
- **Copy HTML** to clipboard
- **Download HTML** as a file (named `planet-detroit-newsletter-YYYY-MM-DD.html`)

## Issue Management (`IssueManager.tsx`)

Located in the dashboard date selector row, this component manages saving and loading newsletter issues.

- **Save Current Issue**: Stores the full newsletter state to localStorage keyed by date (`pd-issue-YYYY-MM-DD`)
- **Load**: Restores a saved issue into the editor
- **Delete**: Removes a saved issue from localStorage
- **New Issue**: Resets the editor to a blank state
- **Export JSON / Import JSON**: Export any saved issue as a portable JSON file, or import one from disk. Useful for backup or transferring between browsers.

---

## ActiveCampaign Integration

Clicking "Generate Newsletter" in the dashboard header:

1. Validates a subject line is set
2. Sends the full HTML + subject line + issue date to `/api/activecampaign`
3. The API creates a message (v1 `message_add`) and a draft campaign (v1 `campaign_create`) in ActiveCampaign
4. Returns a direct link to the campaign in the AC UI
5. A success banner with the link appears in the dashboard header

The campaign is created as a **draft** (status 0) and is never auto-sent.

---

## External Integrations

| Service | Purpose | Env Var(s) |
|---------|---------|------------|
| WordPress (planetdetroit.org) | Posts, job listings, media uploads | `WORDPRESS_URL`, `WORDPRESS_USERNAME`, `WORDPRESS_APP_PASSWORD` |
| Claude AI (Anthropic) | Intro generation, content parsing, summarization | `ANTHROPIC_API_KEY` |
| ActiveCampaign | Email campaign creation, link tracking | `ACTIVECAMPAIGN_API_URL`, `ACTIVECAMPAIGN_API_KEY` |
| Vercel KV (Upstash Redis) | Share preview links, ad performance snapshots | `KV_REST_API_URL`, `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) |
| NOAA GML | Weekly CO2 data | (no key needed) |
| EPA AirNow | Air quality index | `AIRNOW_API_KEY` |
| NOAA GLERL | Great Lakes water levels | (no key needed) |
| Brief Generator | Pre-curated news briefs | `BRIEF_GENERATOR_URL` |

**Deployment:** Vercel (auto-deploys from `main` branch on GitHub at `Planet-Detroit/newsletter-builder`). Environment variables are set in the Vercel project dashboard. The Vercel KV store ("promoted-walleye") is shared with the news-brief-generator project; newsletter builder keys are namespaced with `nl:` to avoid collisions.

---

## Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=                   # Claude AI for content generation
ACTIVECAMPAIGN_API_URL=              # e.g., https://planetdetroit.api-us1.com
ACTIVECAMPAIGN_API_KEY=              # ActiveCampaign v1 API key
WORDPRESS_URL=                        # e.g., https://planetdetroit.org
WORDPRESS_USERNAME=                  # WordPress username for basic auth
WORDPRESS_APP_PASSWORD=              # WordPress application password
AUTH_PASSWORD=                        # Shared newsroom login password
AUTH_SECRET=                          # Random 64-char hex string for cookie signing

# Vercel KV / Upstash Redis (for share previews + ad snapshots)
KV_REST_API_URL=                     # Upstash Redis REST URL (auto-injected by Vercel KV)
KV_REST_API_TOKEN=                   # Upstash Redis REST token (auto-injected by Vercel KV)
UPSTASH_REDIS_REST_URL=              # Alternative naming (both conventions supported)
UPSTASH_REDIS_REST_TOKEN=            # Alternative naming (both conventions supported)

# Optional
AIRNOW_API_KEY=                      # EPA AirNow (air quality data)
BRIEF_GENERATOR_URL=                 # External brief generator service URL
```

Generate `AUTH_SECRET` with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## File Structure

```
src/
  middleware.ts                        # Auth middleware (cookie check on all routes)
  app/
    page.tsx                          # Main dashboard
    login/page.tsx                    # Login page (public, not protected)
    preview/page.tsx                  # Newsletter preview + export
    newsletter-preview/page.tsx       # Public shareable preview (no auth)
    ad-preview/page.tsx               # Public ad preview
    ad-history/page.tsx               # Ad performance history (auth required)
    api/
      auth/login/route.ts            # Login endpoint (public)
      auth/logout/route.ts           # Logout endpoint
      activecampaign/route.ts         # Push to ActiveCampaign
      activecampaign/campaigns/route.ts  # List AC campaigns (v3 API)
      activecampaign/link-stats/route.ts # Per-link click data (v1 API)
      activecampaign/snapshots/route.ts  # CRUD for ad performance snapshots (KV)
      share-preview/route.ts          # Store/retrieve newsletter previews (KV + in-memory fallback)
      co2/route.ts                    # NOAA CO2 data
      air-quality/route.ts            # EPA AirNow data
      lake-levels/route.ts            # NOAA GLERL data
      intro/route.ts                  # AI intro generation
      curated-news/route.ts           # AI article summarization
      parse-events/route.ts           # AI event parsing
      parse-jobs/route.ts             # AI job parsing
      wordpress/posts/route.ts        # WordPress post fetch
      wordpress/jobs/route.ts         # WordPress job fetch
      wordpress/media/route.ts        # WordPress media upload (images)
      import-briefs/route.ts          # Brief generator import + delete proxy
  components/
    ToolNav.tsx                       # Cross-navigation bar + sign out
    Dashboard/
      Header.tsx                      # Top nav + generate button
      ProgressBar.tsx                 # Section completion tracker
      SectionCard.tsx                 # Grid card for each section
      IssueManager.tsx                # Save/load/export newsletter issues
    Sections/
      SectionEditor.tsx               # Slide-over router
      IntroEditor.tsx                 # Editor's Letter (with word/paragraph limits, emoji picker)
      PDStoriesSelector.tsx           # PD Stories
      CuratedNewsImport.tsx           # Curated news (with brief deletion)
      EventsSelector.tsx              # Events
      JobsSelector.tsx                # Jobs
      PSCtaEditor.tsx                 # P.S. CTA
      AdManager.tsx                   # Ad builder + placement + performance tracker
      CO2Widget.tsx                   # Environmental data (individual fetch/clear)
      HeaderEditor.tsx                # Header settings
      FeaturedPromoEditor.tsx         # Featured promo
      SponsorsEditor.tsx              # Sponsors
      SupportCtaEditor.tsx            # Support CTA
      StaticSection.tsx               # Read-only sections
      MiniWysiwyg.tsx                 # Lightweight rich text editor (bold, italic, link, emoji)
  context/
    NewsletterContext.tsx              # State management (context + reducer)
  lib/
    auth.ts                           # HMAC-SHA256 token signing/verification
    generateNewsletterHTML.ts         # HTML email generator (single source of truth)
    redis.ts                          # Upstash Redis singleton (supports KV_* and UPSTASH_* naming)
  types/
    newsletter.ts                     # TypeScript interfaces + constants
    ads.ts                            # AC campaign, link stat, and snapshot interfaces
```

---

## Default Behavior Notes

- All content cards (posts, stories, events, jobs) default to **unchecked**. The editor manually selects which items to include.
- The editor's signoff defaults to Nina Ignaczak.
- The P.S. CTA and Support CTA default to the donorbox donation link.
- Environmental data must be explicitly fetched each issue (no auto-fetch on load). Each data source can be fetched and cleared individually.
- The newsletter is never auto-sent; ActiveCampaign campaigns are created as drafts.
- Ad preview and "Add to Newsletter" sections appear when any ad field has content (image, headline, body, or CTA).
- Share preview links use Redis when Vercel KV is connected, with an in-memory fallback otherwise.
- The `nl:` key prefix namespaces all newsletter builder data in the shared Redis instance.
