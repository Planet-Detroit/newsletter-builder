# Next Steps & Roadmap

## Priority 1: Events via CitySpark

### Background

The Events section currently supports manual entry and AI-powered paste parsing, but lacks an automated feed. CitySpark (cityspark.com) is an event aggregation platform that covers Detroit-area environmental and community events. Integrating CitySpark would save significant time each newsletter issue.

### Exploration Needed

Before building an integration, we need to understand what CitySpark offers:

- **Does CitySpark have a public API?** Check for REST or RSS endpoints at cityspark.com. Look for developer docs or API keys.
- **RSS/iCal feeds?** Many event platforms offer RSS or iCal (.ics) feeds that can be parsed programmatically. Check if CitySpark has category-specific feeds (e.g., environment, sustainability, Detroit metro).
- **Embed widgets?** CitySpark may offer embeddable calendars. These wouldn't help for email HTML but could hint at available data endpoints.
- **Scraping feasibility?** If no API exists, evaluate whether the event listing pages have structured data (schema.org Event markup, JSON-LD) that could be extracted.

### Recommended Approach (Short-Term)

For now, the most practical path is a **manual copy/paste workflow** with AI parsing:

1. **Go to CitySpark** and navigate to the relevant event category for Detroit
2. **Select and copy** the event listings (title, date, time, location, link)
3. **Paste into the Events section** in the newsletter builder using the existing "Paste" input
4. **Click "Parse Events"** to let Claude extract and normalize the data
5. **Review and edit** the parsed results, select which events to include

This already works today with the existing `parse-events` API route, which handles freeform text, CSV, and semi-structured event listings.

### Recommended Approach (Medium-Term)

If CitySpark has an API or RSS feed:

1. Add a `GET /api/cityspark/events` route that fetches upcoming Detroit environmental events
2. Add a "Fetch from CitySpark" button in `EventsSelector.tsx` (similar to the WordPress fetch button in Jobs)
3. Map CitySpark event fields to our `EventItem` interface (title, date, time, location, url, source)
4. Set `source: "CitySpark"` for attribution

If no API exists, consider:

1. A lightweight scraper that runs on-demand (not scheduled) to pull event data from CitySpark's event listing pages
2. Look for structured data (JSON-LD, microdata) in the page source before attempting full DOM parsing
3. The scraper would return data in the same shape as the manual parse, so the UI wouldn't need changes

### Events Feature Parity with Jobs

When events are fully set up, they should gain the same features recently added to jobs:

- **Featured flag** for emphasis (amber highlight, star badge)
- **Partner tier badges** (Planet Champion / Impact Partner) with link to planetdetroit.org/impactpartners/
- **Move to top** button for quick reordering
- **Description visibility toggle** for unfeatured items

The `EventItem` interface will need `featured: boolean` and `partnerTier: PartnerTier` fields, matching `JobListing`.

---

## Priority 2: Deploy to Vercel

### Steps

1. Create a Vercel project linked to the GitHub repo
2. Add all environment variables in Vercel project settings:
   - `ANTHROPIC_API_KEY`
   - `ACTIVECAMPAIGN_API_URL` + `ACTIVECAMPAIGN_API_KEY`
   - `WORDPRESS_URL` + `WORDPRESS_USERNAME` + `WORDPRESS_APP_PASSWORD`
   - `AIRNOW_API_KEY`
   - `BRIEF_GENERATOR_URL`
3. Deploy and verify all API routes work in production
4. Test the ActiveCampaign integration from the deployed URL
5. Set up a custom domain if desired (e.g., newsletter.planetdetroit.org)

### Considerations

- localStorage persistence works fine for a single-editor workflow, but if multiple staff members will use the tool simultaneously, consider adding a shared backend (Vercel KV, Upstash Redis, or Supabase) for draft persistence
- API routes that call external services (Claude, WordPress, ActiveCampaign) should work identically in production since they use environment variables

---

## Priority 3: Refinements

### Environmental Data Widget

- Add caching to the client side so data persists across page reloads within the same session (currently re-fetched each time the widget is opened)
- Consider auto-fetching on page load or when starting a new issue
- Add historical trend indicators (e.g., "CO2 up 2.5 PPM from last year")

### Brief Generator Integration

- Ensure the external brief generator service is deployed and accessible
- Document the brief packet format for the team
- Consider building the brief generation directly into the newsletter builder to reduce external dependencies

### Newsletter Templates

- Save newsletter configurations as reusable templates (e.g., "Standard Weekly", "Special Report", "Breaking News")
- Quick-start from template instead of blank state

### Image Handling

- Upload images directly to the newsletter builder rather than relying on WordPress media library URLs
- Image optimization and resizing for email (max width, file size limits)
- Fallback alt text for accessibility

### Multi-User Support

- If multiple editors need to work on the same issue, add real-time state sync via WebSocket or polling
- User authentication (could be as simple as a shared password or integrated with WordPress auth)
- Edit history / undo functionality

---

## Priority 4: Future Features

### Social Video Scripts

A skill is already available (`social-video-news-script`) that can generate 60-second social media video scripts from newsletter content. This could be integrated as a one-click export:

- Select stories from the current newsletter
- Generate TikTok/Reels/Shorts script with teleprompter text and AV editing notes
- Export as a formatted document

### Analytics Dashboard

- Track open rates, click rates from ActiveCampaign
- Show which stories get the most engagement
- Suggest content types that perform well

### Subscriber Segmentation

- Create newsletter variants for different audience segments
- A/B test subject lines directly from the builder
- Preview how the newsletter looks in different email clients (Gmail, Outlook, Apple Mail)
