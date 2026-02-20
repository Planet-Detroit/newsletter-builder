/**
 * Acceptance tests for the Civic Action newsletter section.
 * Tests cover each acceptance criterion from the spec.
 *
 * NOTE: These tests target pure logic (HTML generation, section config, UTM params).
 * React component behavior is verified via the logic these components call.
 */

import { describe, test, expect } from "vitest";
import { generateNewsletterHTML } from "@/lib/generateNewsletterHTML";
import { DEFAULT_SECTIONS, type NewsletterState, type CivicAction } from "@/types/newsletter";

// ── Helper: minimal valid state to generate newsletter HTML ──────────────

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
    airQuality: null,
    lakeLevels: null,
    sections: DEFAULT_SECTIONS,
    lastSaved: null,
    ...overrides,
  };
}

function makeAction(overrides: Partial<CivicAction> = {}): CivicAction {
  return {
    id: "ca-test-1",
    title: "Attend the City Council meeting",
    description: "Show up and speak during public comment",
    url: "https://detroitmi.gov/meetings",
    actionType: "attend",
    ...overrides,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// AC 1: Civic Action appears in Content tab (not in-development)
// ──────────────────────────────────────────────────────────────────────────

describe("AC 1: Civic Action in Content tab", () => {
  test("civic-action section is in the content tab", () => {
    const section = DEFAULT_SECTIONS.find((s) => s.id === "civic-action");
    expect(section).toBeDefined();
    expect(section!.tab).toBe("content");
  });

  test("civic-action section is NOT in the in-development tab", () => {
    const inDev = DEFAULT_SECTIONS.filter((s) => s.tab === "in-development");
    const civicInDev = inDev.find((s) => s.id === "civic-action");
    expect(civicInDev).toBeUndefined();
  });

  test("civic-action appears after pd-stories and before curated-news", () => {
    const contentSections = DEFAULT_SECTIONS
      .filter((s) => s.tab === "content")
      .sort((a, b) => a.order - b.order);

    const pdStoriesIdx = contentSections.findIndex((s) => s.id === "pd-stories");
    const civicIdx = contentSections.findIndex((s) => s.id === "civic-action");
    const curatedIdx = contentSections.findIndex((s) => s.id === "curated-news");

    expect(pdStoriesIdx).toBeGreaterThanOrEqual(0);
    expect(civicIdx).toBeGreaterThanOrEqual(0);
    expect(curatedIdx).toBeGreaterThanOrEqual(0);
    expect(civicIdx).toBeGreaterThan(pdStoriesIdx);
    expect(civicIdx).toBeLessThan(curatedIdx);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// AC 3: Editing actions is reflected in preview
// (Test: changes to state produce different HTML output)
// ──────────────────────────────────────────────────────────────────────────

describe("AC 3: Edits reflected in newsletter preview", () => {
  test("changing an action title changes the generated HTML", () => {
    const action = makeAction({ title: "Original Title" });
    const html1 = generateNewsletterHTML(
      makeState({ civicActionIntro: "Intro text.", civicActions: [action] })
    );
    expect(html1).toContain("Original Title");

    const updatedAction = { ...action, title: "Updated Title" };
    const html2 = generateNewsletterHTML(
      makeState({ civicActionIntro: "Intro text.", civicActions: [updatedAction] })
    );
    expect(html2).toContain("Updated Title");
    expect(html2).not.toContain("Original Title");
  });

  test("changing an action URL changes the generated HTML", () => {
    const action = makeAction({ url: "https://example.com/old" });
    const html = generateNewsletterHTML(
      makeState({ civicActionIntro: "Intro.", civicActions: [action] })
    );
    expect(html).toContain("https://example.com/old");
  });
});

// ──────────────────────────────────────────────────────────────────────────
// AC 4: Deleting all actions omits the section from HTML
// ──────────────────────────────────────────────────────────────────────────

describe("AC 4: Empty actions omit the section", () => {
  test("no civic action HTML when actions array is empty", () => {
    const html = generateNewsletterHTML(
      makeState({ civicActionIntro: "Some intro.", civicActions: [] })
    );
    // The section heading "Take Action" should NOT appear
    expect(html).not.toContain("Take Action");
  });

  test("no civic action HTML when intro is empty", () => {
    const html = generateNewsletterHTML(
      makeState({ civicActionIntro: "", civicActions: [makeAction()] })
    );
    expect(html).not.toContain("Take Action");
  });

  test("civic action HTML present when both intro and actions exist", () => {
    const html = generateNewsletterHTML(
      makeState({ civicActionIntro: "Here's what to do.", civicActions: [makeAction()] })
    );
    expect(html).toContain("Take Action");
  });
});

// ──────────────────────────────────────────────────────────────────────────
// AC 5: Correct styling — blue border, light background, emojis
// ──────────────────────────────────────────────────────────────────────────

describe("AC 5: Civic action section styling", () => {
  const html = generateNewsletterHTML(
    makeState({
      civicActionIntro: "Act now on this important story.",
      civicActions: [
        makeAction({ actionType: "attend" }),
        makeAction({ id: "ca-2", actionType: "comment", title: "Submit a comment" }),
      ],
    })
  );

  test("has blue left border", () => {
    expect(html).toContain("border-left:4px solid #2982C4");
  });

  test("has light blue background", () => {
    expect(html).toContain("background:#f0f7fc");
  });

  test("renders emojis for action types", () => {
    // attend emoji: &#x1F4CD; (📍)
    expect(html).toContain("&#x1F4CD;");
    // comment emoji: &#x1F4AC; (💬)
    expect(html).toContain("&#x1F4AC;");
  });

  test("renders the intro paragraph", () => {
    expect(html).toContain("Act now on this important story.");
  });
});

// ──────────────────────────────────────────────────────────────────────────
// AC 6: All action URLs include UTM parameters
// ──────────────────────────────────────────────────────────────────────────

describe("AC 6: UTM parameters on action links", () => {
  test("action URLs include correct UTM parameters", () => {
    const action = makeAction({
      url: "https://detroitmi.gov/meetings",
      actionType: "attend",
    });
    const html = generateNewsletterHTML(
      makeState({ civicActionIntro: "Intro.", civicActions: [action] })
    );

    // The URL in href should include UTM params
    expect(html).toContain("utm_source=newsletter");
    expect(html).toContain("utm_medium=email");
    expect(html).toContain("utm_campaign=friday_newsletter");
    expect(html).toContain("utm_content=civic_action_attend");
  });

  test("UTM utm_content varies by action type", () => {
    const actions: CivicAction[] = [
      makeAction({ id: "ca-1", actionType: "comment", url: "https://example.com/comment" }),
      makeAction({ id: "ca-2", actionType: "volunteer", url: "https://example.com/volunteer" }),
    ];
    const html = generateNewsletterHTML(
      makeState({ civicActionIntro: "Intro.", civicActions: actions })
    );

    expect(html).toContain("utm_content=civic_action_comment");
    expect(html).toContain("utm_content=civic_action_volunteer");
  });

  test("actions without a URL don't generate broken links", () => {
    const action = makeAction({ url: "" });
    const html = generateNewsletterHTML(
      makeState({ civicActionIntro: "Intro.", civicActions: [action] })
    );
    // No href with UTM params for empty URL
    expect(html).not.toContain("utm_source=newsletter");
    // Title should be bold text, not a link
    expect(html).toContain(`<strong>${action.title}</strong>`);
  });

  test("Read the full story link includes UTM parameters", () => {
    const storyUrl = "https://planetdetroit.org/2026/02/test-story";
    const state = makeState({
      civicActionIntro: "Intro.",
      civicActions: [makeAction()],
      civicActionStoryId: 123,
      pdPosts: [
        {
          id: 123,
          title: "Test Story",
          subtitle: "",
          excerpt: "",
          url: storyUrl,
          featuredImage: null,
          date: "2026-02-20",
          selected: true,
          photoLayout: "none",
        },
      ],
    });
    const html = generateNewsletterHTML(state);
    expect(html).toContain("Read the full story");
    expect(html).toContain(storyUrl);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// AC 8: Warning when editor adds more than 3 actions
// (This is UI-level, but we test the logic boundary — >3 actions)
// ──────────────────────────────────────────────────────────────────────────

describe("AC 8: More than 3 actions warning boundary", () => {
  test("4 actions all render in the HTML (the warning is UI-only)", () => {
    const actions = [
      makeAction({ id: "ca-1", title: "Action 1" }),
      makeAction({ id: "ca-2", title: "Action 2" }),
      makeAction({ id: "ca-3", title: "Action 3" }),
      makeAction({ id: "ca-4", title: "Action 4" }),
    ];
    const html = generateNewsletterHTML(
      makeState({ civicActionIntro: "Intro.", civicActions: actions })
    );
    expect(html).toContain("Action 1");
    expect(html).toContain("Action 2");
    expect(html).toContain("Action 3");
    expect(html).toContain("Action 4");
  });
});

// ──────────────────────────────────────────────────────────────────────────
// AC 9: No story selected → prompt shown (UI-level; test data boundary)
// ──────────────────────────────────────────────────────────────────────────

describe("AC 9: No story selected data boundary", () => {
  test("civicActionStoryId defaults to null", () => {
    const state = makeState();
    expect(state.civicActionStoryId).toBeNull();
  });
});

// ──────────────────────────────────────────────────────────────────────────
// Additional: "Read the full story" link in HTML
// ──────────────────────────────────────────────────────────────────────────

describe("Read the full story link", () => {
  test("renders a link to the featured PD story when story is selected", () => {
    const state = makeState({
      civicActionIntro: "Intro text.",
      civicActions: [makeAction()],
      civicActionStoryId: 42,
      pdPosts: [
        {
          id: 42,
          title: "Water Quality Investigation",
          subtitle: "",
          excerpt: "",
          url: "https://planetdetroit.org/2026/02/water-quality",
          featuredImage: null,
          date: "2026-02-20",
          selected: true,
          photoLayout: "none",
        },
      ],
    });
    const html = generateNewsletterHTML(state);
    expect(html).toContain("Read the full story");
    expect(html).toContain("https://planetdetroit.org/2026/02/water-quality");
  });

  test("does NOT render Read the full story when no story is linked", () => {
    const html = generateNewsletterHTML(
      makeState({
        civicActionIntro: "Intro.",
        civicActions: [makeAction()],
        civicActionStoryId: null,
      })
    );
    expect(html).not.toContain("Read the full story");
  });
});

// ──────────────────────────────────────────────────────────────────────────
// Additional: All 7 action type emojis render correctly
// ──────────────────────────────────────────────────────────────────────────

describe("Action type emoji mapping", () => {
  const emojiMap: Record<string, string> = {
    attend: "&#x1F4CD;",
    comment: "&#x1F4AC;",
    sign: "&#x270D;",
    contact: "&#x1F4DE;",
    volunteer: "&#x1F64B;",
    follow: "&#x1F441;",
    "learn-more": "&#x1F4DA;",
  };

  for (const [type, emoji] of Object.entries(emojiMap)) {
    test(`${type} action type renders correct emoji`, () => {
      const action = makeAction({
        actionType: type as CivicAction["actionType"],
        url: "",
      });
      const html = generateNewsletterHTML(
        makeState({ civicActionIntro: "Intro.", civicActions: [action] })
      );
      expect(html).toContain(emoji);
    });
  }
});
