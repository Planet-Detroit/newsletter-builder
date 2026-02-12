"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback, useState, useRef } from "react";
import {
  NewsletterState,
  SectionStatus,
  PhotoLayout,
  PDPost,
  CuratedStory,
  EventItem,
  JobListing,
  CivicAction,
  PublicMeeting,
  CommentPeriod,
  AdSlot,
  CO2Data,
  AirQualityData,
  LakeLevelData,
  SponsorsData,
  SupportCTA,
  DEFAULT_SECTIONS,
  DEFAULT_SPONSORS,
} from "@/types/newsletter";
import { mergeDraftState, getUserFromCookie } from "@/lib/sync";

const DEFAULT_SUPPORT_CTA: SupportCTA = {
  headline: "Support local environmental journalism",
  buttonText: "Donate to Planet Detroit",
  buttonUrl: "https://donorbox.org/be-a-planet-detroiter-780440",
};

const initialState: NewsletterState = {
  subjectLine: "",
  previewText: "",
  intro: "",
  psCTA: "",
  psCtaUrl: "https://donorbox.org/be-a-planet-detroiter-780440",
  psCtaButtonText: "Support Planet Detroit",
  signoffStaffId: "nina",
  issueDate: new Date().toISOString().slice(0, 10),
  logoUrl: "https://planetdetroit.org/wp-content/uploads/2025/08/Asset-2@4x0424-300x133.png",
  storyPhotoLayout: "small-left",
  featuredPromo: null,
  sponsors: DEFAULT_SPONSORS,
  supportCTA: DEFAULT_SUPPORT_CTA,
  pdPosts: [],
  curatedStories: [],
  events: [],
  eventsHtml: "",
  jobs: [],
  jobsShowDescriptions: true,
  civicActions: [],
  civicActionIntro: "",
  civicActionStoryId: null,
  publicMeetings: [],
  commentPeriods: [],
  publicMeetingsIntro: "",
  ads: [],
  co2: null,
  airQuality: null,
  lakeLevels: null,
  sections: DEFAULT_SECTIONS,
  lastSaved: null,
};

type Action =
  | { type: "SET_SUBJECT_LINE"; payload: string }
  | { type: "SET_PREVIEW_TEXT"; payload: string }
  | { type: "SET_INTRO"; payload: string }
  | { type: "SET_PS_CTA"; payload: string }
  | { type: "SET_PS_CTA_URL"; payload: string }
  | { type: "SET_PS_CTA_BUTTON_TEXT"; payload: string }
  | { type: "SET_SIGNOFF_STAFF"; payload: string }
  | { type: "SET_ISSUE_DATE"; payload: string }
  | { type: "SET_LOGO_URL"; payload: string }
  | { type: "SET_SPONSORS"; payload: SponsorsData }
  | { type: "SET_FEATURED_PROMO"; payload: NewsletterState["featuredPromo"] }
  | { type: "SET_SUPPORT_CTA"; payload: SupportCTA }
  | { type: "SET_PD_POSTS"; payload: PDPost[] }
  | { type: "TOGGLE_PD_POST"; payload: number }
  | { type: "REORDER_PD_POSTS"; payload: { fromIndex: number; toIndex: number } }
  | { type: "SET_POST_PHOTO_LAYOUT"; payload: { id: number; layout: PhotoLayout } }
  | { type: "SET_STORY_PHOTO_LAYOUT"; payload: PhotoLayout }
  | { type: "SET_CURATED_STORIES"; payload: CuratedStory[] }
  | { type: "UPDATE_CURATED_STORY"; payload: { id: string; story: Partial<CuratedStory> } }
  | { type: "REORDER_CURATED_STORIES"; payload: { fromIndex: number; toIndex: number } }
  | { type: "REMOVE_CURATED_STORY"; payload: string }
  | { type: "SET_EVENTS"; payload: EventItem[] }
  | { type: "SET_EVENTS_HTML"; payload: string }
  | { type: "SET_JOBS"; payload: JobListing[] }
  | { type: "SET_JOBS_SHOW_DESCRIPTIONS"; payload: boolean }
  | { type: "SET_CIVIC_ACTIONS"; payload: CivicAction[] }
  | { type: "SET_CIVIC_ACTION_INTRO"; payload: string }
  | { type: "SET_CIVIC_ACTION_STORY"; payload: number | null }
  | { type: "SET_PUBLIC_MEETINGS"; payload: PublicMeeting[] }
  | { type: "SET_COMMENT_PERIODS"; payload: CommentPeriod[] }
  | { type: "SET_PUBLIC_MEETINGS_INTRO"; payload: string }
  | { type: "SET_ADS"; payload: AdSlot[] }
  | { type: "SET_CO2"; payload: CO2Data | null }
  | { type: "SET_AIR_QUALITY"; payload: AirQualityData | null }
  | { type: "SET_LAKE_LEVELS"; payload: LakeLevelData | null }
  | { type: "UPDATE_SECTION_STATUS"; payload: { id: string; status: SectionStatus } }
  | { type: "LOAD_STATE"; payload: NewsletterState }
  | { type: "RESET" };

function reducer(state: NewsletterState, action: Action): NewsletterState {
  switch (action.type) {
    case "SET_SUBJECT_LINE":
      return { ...state, subjectLine: action.payload };
    case "SET_PREVIEW_TEXT":
      return { ...state, previewText: action.payload };
    case "SET_INTRO":
      return { ...state, intro: action.payload };
    case "SET_PS_CTA":
      return { ...state, psCTA: action.payload };
    case "SET_PS_CTA_URL":
      return { ...state, psCtaUrl: action.payload };
    case "SET_PS_CTA_BUTTON_TEXT":
      return { ...state, psCtaButtonText: action.payload };
    case "SET_SIGNOFF_STAFF":
      return { ...state, signoffStaffId: action.payload };
    case "SET_ISSUE_DATE":
      return { ...state, issueDate: action.payload };
    case "SET_LOGO_URL":
      return { ...state, logoUrl: action.payload };
    case "SET_SPONSORS":
      return { ...state, sponsors: action.payload };
    case "SET_FEATURED_PROMO":
      return { ...state, featuredPromo: action.payload };
    case "SET_SUPPORT_CTA":
      return { ...state, supportCTA: action.payload };
    case "SET_PD_POSTS":
      return { ...state, pdPosts: action.payload };
    case "TOGGLE_PD_POST":
      return {
        ...state,
        pdPosts: state.pdPosts.map((p) =>
          p.id === action.payload ? { ...p, selected: !p.selected } : p
        ),
      };
    case "REORDER_PD_POSTS": {
      const posts = [...state.pdPosts];
      const [moved] = posts.splice(action.payload.fromIndex, 1);
      posts.splice(action.payload.toIndex, 0, moved);
      return { ...state, pdPosts: posts };
    }
    case "SET_POST_PHOTO_LAYOUT":
      return {
        ...state,
        pdPosts: state.pdPosts.map((p) =>
          p.id === action.payload.id ? { ...p, photoLayout: action.payload.layout } : p
        ),
      };
    case "SET_STORY_PHOTO_LAYOUT":
      return {
        ...state,
        storyPhotoLayout: action.payload,
        pdPosts: state.pdPosts.map((p) => ({ ...p, photoLayout: action.payload })),
      };
    case "SET_CURATED_STORIES":
      return { ...state, curatedStories: action.payload };
    case "UPDATE_CURATED_STORY":
      return {
        ...state,
        curatedStories: state.curatedStories.map((s) =>
          s.id === action.payload.id ? { ...s, ...action.payload.story } : s
        ),
      };
    case "REORDER_CURATED_STORIES": {
      const stories = [...state.curatedStories];
      const [moved] = stories.splice(action.payload.fromIndex, 1);
      stories.splice(action.payload.toIndex, 0, moved);
      return { ...state, curatedStories: stories };
    }
    case "REMOVE_CURATED_STORY":
      return {
        ...state,
        curatedStories: state.curatedStories.filter((s) => s.id !== action.payload),
      };
    case "SET_EVENTS":
      return { ...state, events: action.payload };
    case "SET_EVENTS_HTML":
      return { ...state, eventsHtml: action.payload };
    case "SET_JOBS":
      return { ...state, jobs: action.payload };
    case "SET_JOBS_SHOW_DESCRIPTIONS":
      return { ...state, jobsShowDescriptions: action.payload };
    case "SET_CIVIC_ACTIONS":
      return { ...state, civicActions: action.payload };
    case "SET_CIVIC_ACTION_INTRO":
      return { ...state, civicActionIntro: action.payload };
    case "SET_CIVIC_ACTION_STORY":
      return { ...state, civicActionStoryId: action.payload };
    case "SET_PUBLIC_MEETINGS":
      return { ...state, publicMeetings: action.payload };
    case "SET_COMMENT_PERIODS":
      return { ...state, commentPeriods: action.payload };
    case "SET_PUBLIC_MEETINGS_INTRO":
      return { ...state, publicMeetingsIntro: action.payload };
    case "SET_ADS":
      return { ...state, ads: action.payload };
    case "SET_CO2":
      return { ...state, co2: action.payload };
    case "SET_AIR_QUALITY":
      return { ...state, airQuality: action.payload };
    case "SET_LAKE_LEVELS":
      return { ...state, lakeLevels: action.payload };
    case "UPDATE_SECTION_STATUS":
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.id === action.payload.id ? { ...s, status: action.payload.status } : s
        ),
      };
    case "LOAD_STATE":
      return { ...action.payload };
    case "RESET":
      return {
        ...initialState,
        issueDate: new Date().toISOString().slice(0, 10),
        // Preserve ads, jobs, events, and public meetings across issue resets
        ads: state.ads,
        jobs: state.jobs,
        jobsShowDescriptions: state.jobsShowDescriptions,
        events: state.events,
        eventsHtml: state.eventsHtml,
        publicMeetings: state.publicMeetings,
        commentPeriods: state.commentPeriods,
        publicMeetingsIntro: state.publicMeetingsIntro,
      };
    default:
      return state;
  }
}

export type SyncStatus = "synced" | "syncing" | "saving" | "offline" | "local-only";

interface NewsletterContextType {
  state: NewsletterState;
  dispatch: React.Dispatch<Action>;
  contentCompletedCount: number;
  contentTotalCount: number;
  settingsCompletedCount: number;
  settingsTotalCount: number;
  adsCompletedCount: number;
  adsTotalCount: number;
  inDevCompletedCount: number;
  inDevTotalCount: number;
  syncStatus: SyncStatus;
  currentUser: string;
  lastEditor: string;
}

const NewsletterContext = createContext<NewsletterContextType | null>(null);

const POLL_INTERVAL = 5000; // 5 seconds

/**
 * Migrate a loaded state object — patch missing fields, merge sections.
 */
function migrateState(parsed: Record<string, unknown>): NewsletterState {
  // Patch pdPosts that are missing newer fields
  if (Array.isArray(parsed.pdPosts)) {
    parsed.pdPosts = (parsed.pdPosts as Record<string, unknown>[]).map((p) => ({
      subtitle: "",
      photoLayout: "small-left",
      selected: false,
      ...p,
    }));
  }
  // Always use latest section definitions (preserving statuses)
  const mergedSections = DEFAULT_SECTIONS.map((def) => {
    const saved = (
      (parsed.sections as { id: string; status: string }[]) || []
    ).find((s) => s.id === def.id);
    return saved ? { ...def, status: saved.status as SectionStatus } : def;
  });
  return {
    ...initialState,
    ...(parsed as Partial<NewsletterState>),
    sections: mergedSections,
    sponsors: (parsed.sponsors as SponsorsData) || DEFAULT_SPONSORS,
    supportCTA: (parsed.supportCTA as SupportCTA) || DEFAULT_SUPPORT_CTA,
    issueDate:
      (parsed.issueDate as string) || new Date().toISOString().slice(0, 10),
    logoUrl:
      (parsed.logoUrl as string) ||
      "https://planetdetroit.org/wp-content/uploads/2025/08/Asset-2@4x0424-300x133.png",
  };
}

export function NewsletterProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [mounted, setMounted] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("offline");
  const [currentUser, setCurrentUser] = useState("");
  const [lastEditor, setLastEditor] = useState("");

  // Refs for sync tracking
  const lastSyncedState = useRef<NewsletterState | null>(null);
  const remoteVersion = useRef<number>(0);
  const isSaving = useRef(false);
  const isMerging = useRef(false); // prevent save loop during merge

  // ─── Initial load: try Redis first, fall back to localStorage ───
  useEffect(() => {
    const user = getUserFromCookie();
    setCurrentUser(user);

    async function loadInitialState() {
      // Try Redis first
      try {
        const res = await fetch("/api/draft");
        if (res.ok) {
          const data = await res.json();
          const remoteState =
            typeof data.state === "string"
              ? JSON.parse(data.state)
              : data.state;
          const migrated = migrateState(remoteState);
          dispatch({ type: "LOAD_STATE", payload: migrated });
          lastSyncedState.current = migrated;
          remoteVersion.current = data.version || 0;
          if (data.userId) setLastEditor(data.userId);
          setSyncStatus("synced");
          setMounted(true);
          return;
        }
      } catch {
        // Redis unavailable — fall through to localStorage
      }

      // Fall back to localStorage
      try {
        const saved = localStorage.getItem("pd-newsletter-draft");
        if (saved) {
          const parsed = JSON.parse(saved);
          const migrated = migrateState(parsed);
          dispatch({ type: "LOAD_STATE", payload: migrated });
          lastSyncedState.current = migrated;
        }
      } catch {
        localStorage.removeItem("pd-newsletter-draft");
      }

      setSyncStatus("local-only");
      setMounted(true);
    }

    loadInitialState();
  }, []);

  // ─── Auto-save to localStorage + Redis ───
  const save = useCallback(async () => {
    if (isMerging.current) return; // don't save during a merge dispatch

    const toSave = { ...state, lastSaved: new Date().toISOString() };

    // Always save to localStorage as fallback
    try {
      localStorage.setItem("pd-newsletter-draft", JSON.stringify(toSave));
    } catch {
      // ignore localStorage errors
    }

    // Also save to Redis
    if (isSaving.current) return; // skip if a save is already in-flight
    isSaving.current = true;
    setSyncStatus("saving");

    try {
      const user = getUserFromCookie() || currentUser || "unknown";
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: toSave, userId: user }),
      });

      if (res.ok) {
        const data = await res.json();
        lastSyncedState.current = toSave;
        remoteVersion.current = data.version || 0;
        setSyncStatus("synced");
      } else if (res.status === 503) {
        // Redis not configured
        setSyncStatus("local-only");
      } else {
        setSyncStatus("offline");
      }
    } catch {
      setSyncStatus("local-only");
    } finally {
      isSaving.current = false;
    }
  }, [state, currentUser]);

  useEffect(() => {
    if (!mounted) return;
    const timer = setTimeout(save, 1000);
    return () => clearTimeout(timer);
  }, [save, mounted]);

  // ─── Polling for remote changes ───
  useEffect(() => {
    if (!mounted) return;

    const poll = async () => {
      if (isSaving.current || isMerging.current) return;

      try {
        // Lightweight meta check first
        const metaRes = await fetch("/api/draft?meta=true");
        if (!metaRes.ok) {
          if (metaRes.status === 503) setSyncStatus("local-only");
          return;
        }

        const meta = await metaRes.json();
        const remoteVer = meta.version || 0;
        const remoteEditor = meta.userId || "";

        // Update last editor display
        if (remoteEditor && remoteEditor !== lastEditor) {
          setLastEditor(remoteEditor);
        }

        // No new changes, or we were the last editor
        const user = getUserFromCookie() || currentUser;
        if (remoteVer <= remoteVersion.current || remoteEditor === user) {
          if (syncStatus !== "synced" && syncStatus !== "local-only") {
            setSyncStatus("synced");
          }
          return;
        }

        // Someone else made changes — fetch full state and merge
        setSyncStatus("syncing");
        const fullRes = await fetch("/api/draft");
        if (!fullRes.ok) return;

        const fullData = await fullRes.json();
        const remoteState =
          typeof fullData.state === "string"
            ? JSON.parse(fullData.state)
            : fullData.state;
        const migratedRemote = migrateState(remoteState);

        // 3-way merge
        const base = lastSyncedState.current || initialState;
        const merged = mergeDraftState(state, migratedRemote, base);

        // Dispatch merged state without triggering a save-to-redis loop
        isMerging.current = true;
        dispatch({ type: "LOAD_STATE", payload: merged });
        lastSyncedState.current = merged;
        remoteVersion.current = fullData.version || 0;

        // Allow the next render cycle to complete before re-enabling saves
        requestAnimationFrame(() => {
          isMerging.current = false;
        });

        setSyncStatus("synced");
      } catch {
        // Network error — silently continue
      }
    };

    const interval = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [mounted, state, currentUser, lastEditor, syncStatus]);

  const contentSections = state.sections.filter((s) => s.tab === "content");
  const settingsSections = state.sections.filter((s) => s.tab === "settings");
  const adsSections = state.sections.filter((s) => s.tab === "ads");
  const inDevSections = state.sections.filter((s) => s.tab === "in-development");
  const contentCompletedCount = contentSections.filter((s) => s.status === "ready").length;
  const contentTotalCount = contentSections.length;
  const settingsCompletedCount = settingsSections.filter((s) => s.status === "ready").length;
  const settingsTotalCount = settingsSections.length;
  const adsCompletedCount = adsSections.filter((s) => s.status === "ready").length;
  const adsTotalCount = adsSections.length;
  const inDevCompletedCount = inDevSections.filter((s) => s.status === "ready").length;
  const inDevTotalCount = inDevSections.length;

  // Prevent hydration mismatch: don't render children until initial state is loaded
  if (!mounted) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <p style={{ color: "#94a3b8", fontSize: "14px" }}>Loading newsletter builder...</p>
      </div>
    );
  }

  return (
    <NewsletterContext.Provider
      value={{
        state,
        dispatch,
        contentCompletedCount,
        contentTotalCount,
        settingsCompletedCount,
        settingsTotalCount,
        adsCompletedCount,
        adsTotalCount,
        inDevCompletedCount,
        inDevTotalCount,
        syncStatus,
        currentUser,
        lastEditor,
      }}
    >
      {children}
    </NewsletterContext.Provider>
  );
}

export function useNewsletter() {
  const ctx = useContext(NewsletterContext);
  if (!ctx) throw new Error("useNewsletter must be used within NewsletterProvider");
  return ctx;
}
