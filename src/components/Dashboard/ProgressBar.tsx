"use client";

import { useNewsletter } from "@/context/NewsletterContext";
import { TabGroup } from "@/types/newsletter";

interface Props {
  tab: TabGroup;
}

export default function ProgressBar({ tab }: Props) {
  const {
    contentCompletedCount, contentTotalCount,
    settingsCompletedCount, settingsTotalCount,
    adsCompletedCount, adsTotalCount,
    inDevCompletedCount, inDevTotalCount,
  } = useNewsletter();

  const counts: Record<TabGroup, { completed: number; total: number; label: string }> = {
    content: { completed: contentCompletedCount, total: contentTotalCount, label: "Content Progress" },
    settings: { completed: settingsCompletedCount, total: settingsTotalCount, label: "Settings" },
    ads: { completed: adsCompletedCount, total: adsTotalCount, label: "Ads" },
    "in-development": { completed: inDevCompletedCount, total: inDevTotalCount, label: "In Development" },
  };

  const { completed, total, label } = counts[tab];
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">
          {label}
        </span>
        <span className="text-sm text-pd-muted">
          {completed} of {total} sections ready
        </span>
      </div>
      <div className="w-full h-3 bg-pd-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: pct === 100
              ? "var(--pd-success)"
              : "linear-gradient(90deg, var(--pd-blue), var(--pd-blue-dark))",
          }}
        />
      </div>
    </div>
  );
}
