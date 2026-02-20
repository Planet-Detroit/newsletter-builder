# Feature Spec: Newsletter Civic Action Section

**Date**: 2026-02-19
**Status**: Draft

---

## 1. Purpose

Every Friday newsletter should include a "Civic Action: How to Engage" section that highlights one article and suggests 1-3 small, concrete actions readers can take. The newsletter-builder already has a civic action section in the "in-development" tab — this spec promotes it to production-ready, refines the workflow, and ensures ActiveCampaign click tracking works on all action links.

## 2. Users

- **Primary user**: Dustin (managing editor) — assembles the Friday newsletter
- **How they'll access it**: Newsletter builder tool, new section in the Content tab
- **How often they'll use it**: Weekly (every Friday newsletter)

## 3. User Workflow

1. Editor opens the newsletter builder and navigates to the "Civic Action" section (now in the Content tab, not in-development)
2. Editor selects a PD story from the dropdown (same as current behavior — populated from selected PD Stories)
3. Editor clicks "Generate Actions with AI" — Claude analyzes the story and returns:
   - A short intro paragraph (2-3 sentences summarizing why this matters)
   - 1-3 action items, each with a title, short description, and link
4. Editor reviews and edits the intro and each action item inline
5. Editor can add, remove, or reorder actions
6. Editor marks section as "Ready"
7. When newsletter HTML is generated, the civic action section renders as a visually distinct block with tracked links
8. When pushed to ActiveCampaign, all action links are click-tracked automatically (via AC's `tracklinks: 'all'` setting)

## 4. Requirements

### Section promotion
1. Move civic action section from "in-development" tab to "content" tab in `DEFAULT_SECTIONS`
2. Set section order so it appears after PD Stories and before What We're Reading

### AI generation
3. The `/api/civic-actions` endpoint already exists and generates actions from a story — verify it returns good results and refine the Claude prompt if needed
4. Claude should return exactly 1-3 actions (not more) with actionable, specific titles
5. Each action should have a working URL when possible (link to meeting page, comment form, org website, etc.)

### Editor UI
6. Keep the existing `CivicActionEditor.tsx` component — it already supports story selection, AI generation, and inline editing
7. Ensure the action type selector (attend, comment, sign, contact, volunteer, follow, learn-more) maps to appropriate emojis in the output
8. Add a character count or soft limit hint — intro should be under 300 characters, each action description under 200 characters (newsletter space is limited)

### HTML output
9. Render as a visually distinct block in the newsletter HTML — blue left border, light background, clear heading
10. Heading: "Civic Action: How to Engage" (or similar — editor can customize)
11. Each action shows: emoji (based on action type) + linked title + description
12. Include a "Read the full story" link back to the PD article
13. All links must work with ActiveCampaign's click tracking (no special handling needed — AC wraps all links when `tracklinks: 'all'`)

### Tracking
14. Action links should include UTM parameters: `utm_source=newsletter&utm_medium=email&utm_campaign=friday_newsletter&utm_content=civic_action_{action_type}`
15. This allows GA4 to distinguish civic action clicks from other newsletter clicks

## 5. Acceptance Criteria

- [ ] When editor opens the newsletter builder, then "Civic Action" appears in the Content tab (not in-development)
- [ ] When editor selects a story and clicks "Generate Actions with AI," then Claude returns an intro + 1-3 actions within 10 seconds
- [ ] When editor edits an action's title, description, or URL, then changes are reflected in the newsletter preview
- [ ] When editor deletes all actions, then the civic action section is omitted from the newsletter HTML
- [ ] When newsletter HTML is generated, then the civic action section renders with correct styling (blue border, light background, emojis)
- [ ] When newsletter HTML is generated, then all action URLs include UTM parameters
- [ ] When the newsletter is pushed to ActiveCampaign, then action links are click-trackable in AC reports
- [ ] When editor adds more than 3 actions, then a warning suggests keeping it to 1-3 for brevity
- [ ] When no story is selected, then the section shows a prompt to select a story first

## 6. Out of Scope

- This spec does NOT add a reader response form to the newsletter (that's a WordPress-only feature)
- This spec does NOT auto-select the story — editor chooses which article to highlight
- This spec does NOT integrate with the civic-action-builder tool (they are independent workflows)
- This spec does NOT track individual reader actions beyond link clicks (AC handles this natively)

## 7. Connects To

- **newsletter-builder** — `CivicActionEditor.tsx`, `generateNewsletterHTML.ts`, `NewsletterContext.tsx`, `types/newsletter.ts`
- **ask-planet-detroit API** — `/api/civic-actions` (already exists in newsletter-builder's Next.js API routes)
- **ActiveCampaign** — campaign creation with link tracking
- **WordPress** — PD Stories data (article titles, URLs, excerpts)

## 8. Known Risks

- **If AI-generated actions are irrelevant**: Editor reviews and edits before publishing. The AI output is a starting point, not final copy.
- **If the section makes the newsletter too long**: Keep to 1-3 actions with short descriptions. The section should add ~100-150 words max.
- **If action URLs are broken**: Editor should verify links before sending. Consider adding a "test links" button in a future iteration.

## 9. Success Metrics

- Civic action section is included in Friday newsletters consistently
- Click-through rate on civic action links (measurable in ActiveCampaign)
- Editor reports the section takes <5 minutes to finalize

---

## Action Type Emoji Mapping

| Action Type | Emoji |
|------------|-------|
| attend | :calendar: |
| comment | :speech_balloon: |
| sign | :memo: |
| contact | :telephone: |
| volunteer | :raised_hands: |
| follow | :seedling: |
| learn-more | :mag: |

---

_After completing this spec, hand it to Claude Code and say: "Read this spec. Write automated tests for each acceptance criterion first, then implement the feature."_
