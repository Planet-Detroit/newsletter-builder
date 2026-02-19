# Newsletter Builder — Maintenance Guide

**Last Updated:** February 19, 2026

---

## What This Tool Does

The Newsletter Builder creates Planet Detroit's email newsletters. Dustin (managing editor) uses it to assemble each newsletter from multiple content sections, then publish to ActiveCampaign for distribution.

**Key features:**
- **Editor's Letter** — AI-assisted writing with Claude
- **PD Stories** — Pull recent articles from WordPress
- **What We're Reading** — Import curated news briefs from the News Brief Generator
- **Events & Jobs** — Pull from WordPress
- **Auto sections** — Environmental data (CO2, AQI, Lake Erie levels), sponsors, support CTA
- **Ad Builder** — Create and track sponsor ads with performance metrics
- **Preview links** — Shareable URLs stored in Vercel KV (Redis)
- **ActiveCampaign integration** — Create email campaigns directly

**Deployment:** Vercel (https://newsletter-builder-azure.vercel.app)

For detailed technical documentation, see `DOCUMENTATION.md` (404 lines covering architecture, auth, integrations, and troubleshooting).

---

## How to Tell If It's Working

1. Visit https://newsletter-builder-azure.vercel.app
2. Log in with the team password
3. You should see three tabs: Content, Settings & Auto, Ads
4. Try pulling PD Stories — should show recent WordPress articles
5. Try generating an Editor's Letter with AI — Claude should respond
6. Generate a preview — should create a shareable link

---

## Running Locally

```bash
cd newsletter-builder

# Install dependencies
npm install

# Create .env.local with required variables (see below)

# Start dev server
npm run dev
# Opens at http://localhost:3000
```

### Required Environment Variables

| Variable | What It Is | Where to Get It |
|----------|-----------|-----------------|
| `AUTH_PASSWORD` | Login password | Set by you |
| `AUTH_SECRET` | HMAC-SHA256 signing secret for cookies | Generate with `openssl rand -hex 32` |
| `ANTHROPIC_API_KEY` | Claude API key | Anthropic dashboard |
| `WORDPRESS_URL` | WordPress site URL | `https://planetdetroit.org` |
| `WORDPRESS_USERNAME` | WordPress user | WP admin |
| `WORDPRESS_APP_PASSWORD` | WordPress application password | WP > Users > Application Passwords |
| `ACTIVECAMPAIGN_API_URL` | ActiveCampaign account URL | AC dashboard |
| `ACTIVECAMPAIGN_API_KEY` | ActiveCampaign API key | AC > Settings > Developer |
| `AIRNOW_API_KEY` | AirNow API key (air quality data) | airnow.gov |
| `BRIEF_GENERATOR_URL` | News Brief Generator URL | Your Vercel deployment URL |
| `UPSTASH_REDIS_REST_URL` | Vercel KV / Upstash endpoint | Vercel dashboard > Storage |
| `UPSTASH_REDIS_REST_TOKEN` | Vercel KV / Upstash token | Same location |

---

## Common Problems

### "AI generation not working"
- Check that `ANTHROPIC_API_KEY` is set in Vercel environment variables
- Check Anthropic dashboard for usage/billing status
- Check browser console for error messages

### "WordPress articles not loading"
- Verify `WORDPRESS_URL`, `WORDPRESS_USERNAME`, and `WORDPRESS_APP_PASSWORD` are correct
- Application passwords are different from login passwords — generate in WP > Users > Application Passwords
- Check if WordPress site is accessible

### "ActiveCampaign campaign creation fails"
- Verify `ACTIVECAMPAIGN_API_URL` and `ACTIVECAMPAIGN_API_KEY` are set
- Check AC API key permissions — needs campaign create/update access
- ActiveCampaign may rate-limit API calls

### "Preview links broken"
- Check Vercel KV (Upstash Redis) is provisioned and connected
- Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set
- Preview links expire — check TTL settings

### "Newsletter HTML looks wrong in email"
- Email HTML is intentionally table-based for email client compatibility
- Test with Litmus or Email on Acid for rendering across clients
- Common issue: some email clients strip certain CSS — the generator accounts for most of these

---

## Security Notes

- HTML content from partners/external sources is sanitized with DOMPurify before rendering
- Auth uses HMAC-SHA256 signed httpOnly cookies with SameSite=Lax
- State auto-saves to localStorage as backup (in case Redis is unavailable)

---

## Dependencies

| Service | Purpose | Cost |
|---------|---------|------|
| **Vercel** | Hosting + serverless functions | Free tier (may need Pro for heavier usage) |
| **Anthropic** | Claude AI for editor's letter + content generation | Pay-per-use |
| **WordPress** | Article/job content via REST API | Existing site |
| **ActiveCampaign** | Email campaign creation + distribution | Existing subscription |
| **Vercel KV (Upstash Redis)** | Preview link storage, brief caching, ad snapshots | Free tier |
| **AirNow** | Air quality data for environmental section | Free API |
