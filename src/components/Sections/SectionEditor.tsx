"use client";

import { NewsletterSection } from "@/types/newsletter";
import IntroEditor from "./IntroEditor";
import PDStoriesSelector from "./PDStoriesSelector";
import CuratedNewsImport from "./CuratedNewsImport";
import EventsSelector from "./EventsSelector";
import JobsSelector from "./JobsSelector";
import AdManager from "./AdManager";
import AdTracker from "./AdTracker";
import CO2Widget from "./CO2Widget";
import PSCtaEditor from "./PSCtaEditor";
import SponsorsEditor from "./SponsorsEditor";
import HeaderEditor from "./HeaderEditor";
import FeaturedPromoEditor from "./FeaturedPromoEditor";
import SupportCtaEditor from "./SupportCtaEditor";
import CivicActionEditor from "./CivicActionEditor";
import StaticSection from "./StaticSection";

interface SectionEditorProps {
  section: NewsletterSection;
  onClose: () => void;
}

export default function SectionEditor({ section, onClose }: SectionEditorProps) {
  const renderEditor = () => {
    switch (section.id) {
      case "intro":
        return <IntroEditor />;
      case "pd-stories":
        return <PDStoriesSelector />;
      case "civic-action":
        return <CivicActionEditor />;
      case "curated-news":
        return <CuratedNewsImport />;
      case "events":
        return <EventsSelector />;
      case "jobs":
        return <JobsSelector />;
      case "ads":
        return <AdManager />;
      case "ad-tracker":
        return <AdTracker />;
      case "co2":
        return <CO2Widget />;
      case "ps-cta":
        return <PSCtaEditor field="psCTA" label="P.S. Call-to-Action" placeholder="e.g., Support local journalism — donate today!" />;
      case "sponsors":
        return <SponsorsEditor />;
      case "header":
        return <HeaderEditor />;
      case "featured":
        return <FeaturedPromoEditor />;
      case "support":
        return <SupportCtaEditor />;
      case "footer":
        return <StaticSection title={section.title} description="The footer includes social links, your address, slogan, and unsubscribe link. Edit address/slogan in src/lib/generateNewsletterHTML.ts." />;
      default:
        return <p className="text-pd-muted">Editor not yet implemented for this section.</p>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Slide-over panel */}
      <div className="relative ml-auto w-full max-w-2xl bg-pd-card shadow-2xl flex flex-col animate-slide-in">
        {/* Panel header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-pd-border">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{section.icon}</span>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
              <p className="text-sm text-pd-muted">{section.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-pd-muted hover:text-foreground"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderEditor()}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
