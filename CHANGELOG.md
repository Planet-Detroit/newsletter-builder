# Changelog

All notable changes to the Planet Detroit Newsletter Builder.

---

## 2026-02-09

### Collaborative Editing
- Added shared draft auto-sync via Redis so Nina and Dustin can work on the same newsletter simultaneously
- Section-level 3-way merge prevents overwriting each other's work (10 section groups: header, intro, stories, curated, events, jobs, psCta, ads, sponsors, environmental data)
- New sync status indicator in the header: green "Synced", yellow "Saving...", blue "Syncing...", gray "Local only"
- Shows who else is currently editing (e.g., "Dustin editing")
- Graceful fallback to localStorage-only mode when Redis is unavailable
- Login page now asks "Who's working today?" (Nina/Dustin/Other) so the sync system knows who made each edit

**New files:** `src/lib/sync.ts`, `src/app/api/draft/route.ts`
**Modified:** `NewsletterContext.tsx`, `Header.tsx`, `login/page.tsx`, `auth/login/route.ts`

### Ad Panel Enhancements
- Added ad image support (970x350) with image-above-headline layout
- Added WordPress media upload — pick a file, upload directly to WP, get the URL back
- Added second CTA button option with side-by-side layout (stacks on narrow screens)
- Replaced plain textarea with WYSIWYG editor for ad body copy (supports links)
- Fixed ad preview/tracker requiring both headline AND body — now shows when any field has content

**Modified:** `AdManager.tsx`
**New files:** `src/app/api/wordpress/media/route.ts`

### CO2 Widget Improvements
- Individual fetch buttons for CO2, AQI, and Lake Levels (plus Fetch All)
- Individual clear buttons (x) for each data source
- Removed bordered card styling, reduced vertical space

**Modified:** `CO2Widget.tsx`, `NewsletterContext.tsx`

### Share Preview Fix
- Rewrote share-preview storage from in-memory Map to Redis with 7-day TTL
- Fixes "Failed to generate share link" errors caused by Vercel cold starts clearing in-memory data
- Falls back to in-memory Map when Redis isn't configured

**Modified:** `src/app/api/share-preview/route.ts`

### Session Persistence
- Ads, jobs, and events now survive "New Issue" resets (previously all data was cleared)

### Ad Tracker
- Campaign list now filtered to sent campaigns from the last 30 days only (was showing all 50 most recent regardless of status or age)

### Preview Text Reminder
- Amber warning appears when preview text is empty: "Don't forget to add preview text"

### Documentation
- Full documentation update covering all features added since initial build
- Created interactive architecture guide (`architecture-guide.html`) explaining the system's design through analogies and the actual codebase

---

## 2026-02-08 (and earlier sessions)

### Initial Build
- Newsletter builder with tabbed editor (Content, Ads, Settings)
- WordPress integration for posts and job listings
- ActiveCampaign integration for campaign creation
- AI-powered intro generation, subject line suggestions, curated news import
- Event parsing from pasted text
- CO2, Air Quality, and Lake Levels environmental data widgets
- Email-compatible HTML generation with MSO conditional comments
- Shareable newsletter and ad preview links
- Ad performance tracker with ActiveCampaign link stats
- Ad performance snapshots saved to Redis (90-day TTL)
- Ad history page
- Issue manager for tracking newsletter issues
- Password-based authentication with signed cookies
- Cross-navigation (ToolNav) linking to Brief Generator
