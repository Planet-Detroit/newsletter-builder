"use client";

import { NewsletterSection, SectionStatus } from "@/types/newsletter";

interface SectionCardProps {
  section: NewsletterSection;
  onClick: () => void;
  onToggleEnabled?: (id: string) => void;
}

const statusConfig: Record<SectionStatus, { label: string; color: string; bg: string }> = {
  ready: { label: "Ready", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  needs_attention: { label: "Needs Edit", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  empty: { label: "Empty", color: "text-slate-500", bg: "bg-slate-50 border-slate-200" },
  loading: { label: "Loading...", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
};

const automationBadge: Record<string, { label: string; color: string }> = {
  full: { label: "Auto", color: "bg-pd-blue-light text-pd-blue-dark" },
  semi: { label: "Semi-auto", color: "bg-amber-50 text-amber-700" },
  manual: { label: "Manual", color: "bg-slate-100 text-slate-600" },
};

export default function SectionCard({ section, onClick, onToggleEnabled }: SectionCardProps) {
  const status = statusConfig[section.status];
  const automation = automationBadge[section.automationLevel];
  const isEnabled = section.enabled !== false;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-pd-card border border-pd-border rounded-xl p-4 hover:border-pd-blue hover:shadow-md transition-all duration-200 group cursor-pointer ${
        !isEnabled ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{section.icon}</span>
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-pd-blue transition-colors">
              {section.title}
            </h3>
            <p className="text-sm text-pd-muted mt-0.5">{section.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-1 rounded-full border ${status.bg} ${status.color}`}>
            {status.label}
          </span>
          {/* Toggle switch */}
          {onToggleEnabled && (
            <div
              role="switch"
              aria-checked={isEnabled}
              aria-label={`${isEnabled ? "Disable" : "Enable"} ${section.title}`}
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onToggleEnabled(section.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleEnabled(section.id);
                }
              }}
              className={`relative shrink-0 w-9 h-5 rounded-full transition-colors cursor-pointer ${
                isEnabled ? "bg-emerald-500" : "bg-slate-300"
              }`}
            >
              <div
                className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                style={{ transform: isEnabled ? "translateX(18px)" : "translateX(2px)" }}
              />
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-0.5 rounded-full ${automation.color}`}>
          {automation.label}
        </span>
        <span className="text-xs text-pd-muted opacity-0 group-hover:opacity-100 transition-opacity">
          Click to edit →
        </span>
      </div>
    </button>
  );
}
