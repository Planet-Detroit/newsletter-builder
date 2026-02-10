/** ActiveCampaign campaign summary (from v3 API) */
export interface ACCampaign {
  id: string;
  name: string;
  sendDate: string | null;
  status: string;
  sendCount: number;
  /** Total opens (includes repeat opens by same subscriber) */
  totalOpens: number;
  /** Unique opens (one per subscriber) */
  uniqueOpens: number;
  /** Total link clicks */
  clicks: number;
  /** Unique link clicks (one per subscriber per link) */
  uniqueClicks: number;
  /** Unsubscribes from this campaign */
  unsubscribes: number;
  /** @deprecated Use uniqueOpens instead */
  opens: number;
}

/** Per-link click data (from v1 API) */
export interface ACLinkStat {
  url: string;
  name: string;
  clicks: number;
  uniqueClicks: number;
}

/** Saved performance snapshot stored in Vercel KV */
export interface AdPerformanceSnapshot {
  id: string; // "snap-{campaignId}-{timestamp}"
  campaignId: string;
  campaignName: string;
  savedAt: string; // ISO timestamp
  note: string;
  campaign: {
    sendCount: number;
    opens: number;
    clicks: number;
    openRate: string; // pre-calculated e.g. "24.5"
  };
  links: ACLinkStat[];
}
