/**
 * Tests for the section enabled/disabled toggle feature.
 * Verifies that:
 * - DEFAULT_SECTIONS have correct enabled defaults
 * - isSectionEnabled correctly reads section state
 * - Disabled sections are excluded from HTML output
 * - Enabled sections are included in HTML output
 */

import { describe, test, expect } from "vitest";
import { generateNewsletterHTML, isSectionEnabled } from "@/lib/generateNewsletterHTML";
import { DEFAULT_SECTIONS, type NewsletterState } from "@/types/newsletter";

// ── Helper: minimal valid state ──────────────────────────────────────────

function makeState(overrides: Partial<NewsletterState> = {}): NewsletterState {
  return {
    newsletterType: "regular",
    subjectLine: "",
    previewText: "",
    intro: "",
    psCTA: "",
    psCtaUrl: "",
    psCtaButtonText: "",
    signoffStaffId: "nina",
    issueDate: "2026-02-20",
    logoUrl: "",
    storyPhotoLayout: "none",
    featuredPromo: null,
    sponsors: { champions: [], partners: [] },
    supportCTA: { headline: "Support", buttonText: "Donate", buttonUrl: "https://example.com" },
    pdPosts: [],
    sponsoredPosts: [],
    sponsoredByName: "",
    curatedStories: [],
    curatedNewsHtml: "",
    events: [],
    eventsHtml: "",
    jobs: [],
    jobsShowDescriptions: false,
    civicActions: [],
    civicActionIntro: "",
    civicActionStoryId: null,
    publicMeetings: [],
    commentPeriods: [],
    publicMeetingsIntro: "",
    fundraisingLetter: "",
    fundraisingCTA: { headline: "", buttonText: "", buttonUrl: "" },
    partnerPromo: null,
    ads: [],
    co2: null,
    sections: DEFAULT_SECTIONS,
    lastSaved: null,
    ...overrides,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Default enabled values
// ──────────────────────────────────────────────────────────────────────────

describe("Default section enabled values", () => {
  test("civic-action defaults to enabled", () => {
    const section = DEFAULT_SECTIONS.find((s) => s.id === "civic-action");
    expect(section!.enabled).toBe(true);
  });

  test("public-meetings defaults to enabled", () => {
    const section = DEFAULT_SECTIONS.find((s) => s.id === "public-meetings");
    expect(section!.enabled).toBe(true);
  });

  test("all sections default to enabled", () => {
    for (const section of DEFAULT_SECTIONS) {
      expect(section.enabled).toBe(true);
    }
  });

  test("pd-stories defaults to enabled", () => {
    const section = DEFAULT_SECTIONS.find((s) => s.id === "pd-stories");
    expect(section!.enabled).toBe(true);
  });

  test("curated-news defaults to enabled", () => {
    const section = DEFAULT_SECTIONS.find((s) => s.id === "curated-news");
    expect(section!.enabled).toBe(true);
  });

  test("all sections have the enabled field defined", () => {
    for (const section of DEFAULT_SECTIONS) {
      expect(typeof section.enabled).toBe("boolean");
    }
  });
});

// ──────────────────────────────────────────────────────────────────────────
// isSectionEnabled helper
// ──────────────────────────────────────────────────────────────────────────

describe("isSectionEnabled helper", () => {
  test("returns true for enabled sections", () => {
    const state = makeState();
    expect(isSectionEnabled(state, "pd-stories")).toBe(true);
  });

  test("returns false for disabled sections", () => {
    const state = makeState({
      sections: DEFAULT_SECTIONS.map((s) =>
        s.id === "civic-action" ? { ...s, enabled: false } : s
      ),
    });
    expect(isSectionEnabled(state, "civic-action")).toBe(false);
  });

  test("returns true for unknown section IDs (backwards compat)", () => {
    const state = makeState();
    expect(isSectionEnabled(state, "nonexistent-section")).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// Disabled sections excluded from HTML
// ──────────────────────────────────────────────────────────────────────────

describe("Disabled sections excluded from HTML", () => {
  test("civic-action section included when enabled (default)", () => {
    const html = generateNewsletterHTML(
      makeState({
        civicActionIntro: "Here are actions.",
        civicActions: [{
          id: "ca-1",
          title: "Test Action",
          description: "Test description",
          url: "https://example.com",
          actionType: "attend",
        }],
      })
    );
    // civic-action is enabled by default, so content should appear
    expect(html).toContain("Civic Action");
    expect(html).toContain("Test Action");
  });

  test("civic-action section excluded when disabled", () => {
    const html = generateNewsletterHTML(
      makeState({
        sections: DEFAULT_SECTIONS.map((s) =>
          s.id === "civic-action" ? { ...s, enabled: false } : s
        ),
        civicActionIntro: "Here are actions.",
        civicActions: [{
          id: "ca-1",
          title: "Test Action",
          description: "Test description",
          url: "https://example.com",
          actionType: "attend",
        }],
      })
    );
    expect(html).not.toContain("Civic Action");
    expect(html).not.toContain("Test Action");
  });

  test("intro section excluded when disabled", () => {
    const html = generateNewsletterHTML(
      makeState({
        sections: DEFAULT_SECTIONS.map((s) =>
          s.id === "intro" ? { ...s, enabled: false } : s
        ),
        intro: "This is the editor's letter.",
      })
    );
    expect(html).not.toContain("This is the editor's letter.");
  });

  test("curated-news section excluded when disabled", () => {
    const html = generateNewsletterHTML(
      makeState({
        sections: DEFAULT_SECTIONS.map((s) =>
          s.id === "curated-news" ? { ...s, enabled: false } : s
        ),
        curatedNewsHtml: "<p>Some curated content</p>",
      })
    );
    expect(html).not.toContain("What We're Reading");
    expect(html).not.toContain("Some curated content");
  });

  test("jobs section excluded when disabled", () => {
    const html = generateNewsletterHTML(
      makeState({
        sections: DEFAULT_SECTIONS.map((s) =>
          s.id === "jobs" ? { ...s, enabled: false } : s
        ),
        jobs: [{
          id: "j1",
          title: "Environmental Manager",
          organization: "Detroit Zoo",
          url: "https://example.com/job",
          description: "",
          datePosted: "2026-02-20",
          selected: true,
          featured: false,
          partnerTier: null,
        }],
      })
    );
    expect(html).not.toContain("Environmental Manager");
  });

  test("events section excluded when disabled", () => {
    const html = generateNewsletterHTML(
      makeState({
        sections: DEFAULT_SECTIONS.map((s) =>
          s.id === "events" ? { ...s, enabled: false } : s
        ),
        eventsHtml: "<p>Earth Day cleanup at Rouge Park</p>",
      })
    );
    expect(html).not.toContain("Earth Day cleanup at Rouge Park");
  });

  test("support CTA excluded when disabled", () => {
    const html = generateNewsletterHTML(
      makeState({
        sections: DEFAULT_SECTIONS.map((s) =>
          s.id === "support" ? { ...s, enabled: false } : s
        ),
      })
    );
    // Default support CTA headline
    expect(html).not.toContain("Donate");
  });
});
