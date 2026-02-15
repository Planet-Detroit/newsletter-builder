"use client";

import { useState } from "react";
import Header from "@/components/Dashboard/Header";
import ProgressBar from "@/components/Dashboard/ProgressBar";
import SectionCard from "@/components/Dashboard/SectionCard";
import IssueManager from "@/components/Dashboard/IssueManager";
import SectionEditor from "@/components/Sections/SectionEditor";
import { useNewsletter } from "@/context/NewsletterContext";
import { NewsletterSection, NewsletterType, TabGroup } from "@/types/newsletter";

export default function Dashboard() {
  const { state, dispatch } = useNewsletter();
  const [activeSection, setActiveSection] = useState<NewsletterSection | null>(null);
  const [activeTab, setActiveTab] = useState<TabGroup>(
    state.newsletterType === "fundraising" ? "fundraising" : "content"
  );

  const isFundraising = state.newsletterType === "fundraising";

  const handleTypeChange = (type: NewsletterType) => {
    dispatch({ type: "SET_NEWSLETTER_TYPE", payload: type });
    setActiveTab(type === "fundraising" ? "fundraising" : "content");
  };

  const sectionsByTab = (tab: TabGroup) =>
    [...state.sections].filter((s) => s.tab === tab).sort((a, b) => a.order - b.order);

  const contentSections = sectionsByTab("content");
  const settingsSections = sectionsByTab("settings");
  const adsSections = sectionsByTab("ads");
  const fundraisingSections = sectionsByTab("fundraising");
  const inDevSections = sectionsByTab("in-development");

  const displayedSections =
    activeTab === "content" ? contentSections
    : activeTab === "ads" ? adsSections
    : activeTab === "fundraising" ? fundraisingSections
    : activeTab === "in-development" ? inDevSections
    : settingsSections;

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  };

  // Fundraising mode: only the Fundraising tab. Regular mode: everything except Fundraising.
  const tabs: { id: TabGroup; label: string; count: number }[] = isFundraising
    ? [
        { id: "fundraising", label: "Fundraising", count: fundraisingSections.length },
      ]
    : [
        { id: "content", label: "Content", count: contentSections.length },
        { id: "ads", label: "Ads", count: adsSections.length },
        { id: "settings", label: "Settings & Auto", count: settingsSections.length },
        { id: "in-development", label: "In Development", count: inDevSections.length },
      ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Newsletter type + date selector row */}
        <div className="mb-6 flex items-center gap-4 p-4 bg-pd-card border border-pd-border rounded-xl">
          {/* Newsletter type toggle */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
            <button
              onClick={() => handleTypeChange("regular")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                !isFundraising
                  ? "bg-white shadow-sm text-foreground"
                  : "text-pd-muted hover:text-foreground"
              }`}
            >
              Newsletter
            </button>
            <button
              onClick={() => handleTypeChange("fundraising")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                isFundraising
                  ? "bg-white shadow-sm text-foreground"
                  : "text-pd-muted hover:text-foreground"
              }`}
            >
              Fundraising
            </button>
          </div>
          <div className="w-px h-6 bg-pd-border" />
          <label className="text-sm font-medium text-foreground whitespace-nowrap">
            Issue Date
          </label>
          <input
            type="date"
            value={state.issueDate}
            onChange={(e) => dispatch({ type: "SET_ISSUE_DATE", payload: e.target.value })}
            className="px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue focus:ring-1 focus:ring-pd-blue"
          />
          <span className="text-sm text-pd-muted flex-1">
            {formatDisplayDate(state.issueDate)}
          </span>
          <IssueManager />
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-1 mb-6 border-b border-pd-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? "border-pd-blue text-pd-blue"
                  : "border-transparent text-pd-muted hover:text-foreground hover:border-slate-300"
              }`}
            >
              {tab.label}
              <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-pd-blue-light text-pd-blue">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <ProgressBar tab={activeTab} />

        {/* Section cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedSections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              onClick={() => setActiveSection(section)}
            />
          ))}
        </div>

        {/* Quick stats — only on content tab in regular mode */}
        {activeTab === "content" && !isFundraising && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard
              label="PD Stories"
              value={state.pdPosts.filter((p) => p.selected).length}
              unit="selected"
            />
            <StatCard
              label="Curated News"
              value={state.curatedStories.length}
              unit="stories"
            />
            <StatCard
              label="Public Meetings"
              value={
                (state.publicMeetings || []).filter((m) => m.selected).length +
                (state.commentPeriods || []).filter((c) => c.selected).length
              }
              unit="selected"
            />
            <StatCard
              label="Events"
              value={state.events.filter((e) => e.selected).length}
              unit="featured"
            />
            <StatCard
              label="Active Ads"
              value={state.ads.filter((a) => a.active).length}
              unit="slots"
            />
          </div>
        )}
      </main>

      {/* Section editor slide-over */}
      {activeSection && (
        <SectionEditor
          section={activeSection}
          onClose={() => setActiveSection(null)}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="bg-pd-card border border-pd-border rounded-xl p-4 text-center">
      <p className="text-2xl font-bold" style={{ color: value > 0 ? "var(--pd-blue)" : "var(--pd-muted)" }}>
        {value}
      </p>
      <p className="text-xs text-pd-muted mt-1">{label}</p>
      <p className="text-xs text-pd-muted">{unit}</p>
    </div>
  );
}
