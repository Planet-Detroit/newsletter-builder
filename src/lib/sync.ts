import { NewsletterState } from "@/types/newsletter";

/**
 * Section groups for 3-way merge.
 * Each group maps to a set of NewsletterState fields that are edited together.
 * When merging remote changes, we compare at the group level so editing
 * "intro" doesn't overwrite someone else's "curatedStories" changes.
 */
export const SECTION_GROUPS: Record<string, (keyof NewsletterState)[]> = {
  header: ["subjectLine", "previewText", "issueDate", "logoUrl"],
  intro: ["intro", "signoffStaffId"],
  stories: ["pdPosts", "storyPhotoLayout"],
  curated: ["curatedStories"],
  events: ["events", "eventsHtml"],
  jobs: ["jobs", "jobsShowDescriptions"],
  psCta: ["psCTA", "psCtaUrl", "psCtaButtonText"],
  civicAction: ["civicActions", "civicActionIntro", "civicActionStoryId"],
  ads: ["ads"],
  sponsors: ["sponsors", "supportCTA", "featuredPromo"],
  env: ["co2", "airQuality", "lakeLevels"],
};

// Fields that are always taken from remote (UI/meta state)
const ALWAYS_REMOTE_FIELDS: (keyof NewsletterState)[] = ["sections", "lastSaved"];

/**
 * Deep equality check using JSON serialization.
 * Good enough for our state shapes (plain objects, arrays, primitives).
 */
export function isDeepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Compare a specific section group between two states.
 * Returns true if all fields in the group are equal.
 */
function isSectionGroupEqual(
  stateA: NewsletterState,
  stateB: NewsletterState,
  groupFields: (keyof NewsletterState)[]
): boolean {
  return groupFields.every((field) =>
    isDeepEqual(stateA[field], stateB[field])
  );
}

/**
 * 3-way merge: merges remote changes into local state without overwriting
 * sections the local user has edited.
 *
 * @param local      - Current local state (what the user sees)
 * @param remote     - Latest state from Redis (from another user)
 * @param lastSynced - Snapshot of state at last successful sync (the "base")
 * @returns Merged state
 *
 * For each section group:
 *   - If local === lastSynced (user didn't touch it) → take remote
 *   - If local !== lastSynced (user edited it) → keep local
 */
export function mergeDraftState(
  local: NewsletterState,
  remote: NewsletterState,
  lastSynced: NewsletterState
): NewsletterState {
  // Start with local state as the base
  const merged = { ...local };

  // For each section group, decide whether to take remote or keep local
  for (const [, fields] of Object.entries(SECTION_GROUPS)) {
    const localUnchanged = isSectionGroupEqual(local, lastSynced, fields);

    if (localUnchanged) {
      // User didn't edit this section group — accept remote changes
      for (const field of fields) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (merged as any)[field] = remote[field];
      }
    }
    // else: user edited this section — keep local values (already in merged)
  }

  // Always take remote for meta/UI fields
  for (const field of ALWAYS_REMOTE_FIELDS) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (merged as any)[field] = remote[field];
  }

  return merged;
}

/**
 * Read the pd_user cookie from document.cookie.
 * Returns empty string if not found.
 */
export function getUserFromCookie(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)pd_user=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

/**
 * Set the pd_user cookie (client-side, 7-day expiry).
 */
export function setUserCookie(name: string): void {
  const maxAge = 7 * 24 * 60 * 60; // 7 days
  document.cookie = `pd_user=${encodeURIComponent(name)};path=/;max-age=${maxAge};samesite=lax`;
}
