"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback, useState } from "react";
import {
  NewsletterState,
  SectionStatus,
  PhotoLayout,
  PDPost,
  CuratedStory,
  EventItem,
  JobListing,
  AdSlot,
  CO2Data,
  AirQualityData,
  LakeLevelData,
  SponsorsData,
  SupportCTA,
  DEFAULT_SECTIONS,
  DEFAULT_SPONSORS,
} from "@/types/newsletter";

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
  | { type: "SET_ADS"; payload: AdSlot[] }
  | { type: "SET_CO2"; payload: CO2Data }
  | { type: "SET_AIR_QUALITY"; payload: AirQualityData }
  | { type: "SET_LAKE_LEVELS"; payload: LakeLevelData }
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
      return { ...initialState, issueDate: new Date().toISOString().slice(0, 10) };
    default:
      return state;
  }
}

interface NewsletterContextType {
  state: NewsletterState;
  dispatch: React.Dispatch<Action>;
  contentCompletedCount: number;
  contentTotalCount: number;
  settingsCompletedCount: number;
  settingsTotalCount: number;
  adsCompletedCount: number;
  adsTotalCount: number;
}

const NewsletterContext = createContext<NewsletterContextType | null>(null);

export function NewsletterProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount — migrate stale shapes gracefully
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pd-newsletter-draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Patch pdPosts that are missing newer fields
        if (Array.isArray(parsed.pdPosts)) {
          parsed.pdPosts = parsed.pdPosts.map((p: Record<string, unknown>) => ({
            subtitle: "",
            photoLayout: "small-left",
            selected: false,
            ...p,
          }));
        }
        // Always use latest section definitions (preserving statuses)
        const mergedSections = DEFAULT_SECTIONS.map((def) => {
          const saved = (parsed.sections || []).find((s: { id: string }) => s.id === def.id);
          return saved ? { ...def, status: saved.status } : def;
        });
        dispatch({
          type: "LOAD_STATE",
          payload: {
            ...initialState,
            ...parsed,
            sections: mergedSections,
            sponsors: parsed.sponsors || DEFAULT_SPONSORS,
            supportCTA: parsed.supportCTA || DEFAULT_SUPPORT_CTA,
            issueDate: parsed.issueDate || new Date().toISOString().slice(0, 10),
            logoUrl: parsed.logoUrl || "https://planetdetroit.org/wp-content/uploads/2025/08/Asset-2@4x0424-300x133.png",
          },
        });
      }
    } catch {
      // corrupt state — wipe it and start fresh
      localStorage.removeItem("pd-newsletter-draft");
    }
    setMounted(true);
  }, []);

  // Auto-save to localStorage
  const save = useCallback(() => {
    try {
      const toSave = { ...state, lastSaved: new Date().toISOString() };
      localStorage.setItem("pd-newsletter-draft", JSON.stringify(toSave));
    } catch {
      // ignore storage errors
    }
  }, [state]);

  useEffect(() => {
    const timer = setTimeout(save, 1000);
    return () => clearTimeout(timer);
  }, [save]);

  const contentSections = state.sections.filter((s) => s.tab === "content");
  const settingsSections = state.sections.filter((s) => s.tab === "settings");
  const adsSections = state.sections.filter((s) => s.tab === "ads");
  const contentCompletedCount = contentSections.filter((s) => s.status === "ready").length;
  const contentTotalCount = contentSections.length;
  const settingsCompletedCount = settingsSections.filter((s) => s.status === "ready").length;
  const settingsTotalCount = settingsSections.length;
  const adsCompletedCount = adsSections.filter((s) => s.status === "ready").length;
  const adsTotalCount = adsSections.length;

  // Prevent hydration mismatch: don't render children until localStorage is loaded
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
