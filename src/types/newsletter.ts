export type SectionStatus = "ready" | "needs_attention" | "empty" | "loading";

export type NewsletterType = "regular" | "fundraising";

export type TabGroup = "content" | "settings" | "ads" | "fundraising" | "in-development";

export interface NewsletterSection {
  id: string;
  title: string;
  description: string;
  status: SectionStatus;
  icon: string;
  order: number;
  automationLevel: "full" | "semi" | "manual";
  tab: TabGroup;
  enabled: boolean;
}

export type PhotoLayout = "none" | "small-left" | "top";

export interface Sponsor {
  name: string;
  url: string;
}

export interface SponsorsData {
  champions: Sponsor[];
  partners: Sponsor[];
}

export interface PDPost {
  id: number;
  title: string;
  subtitle: string;
  excerpt: string;
  url: string;
  featuredImage: string | null;
  date: string;
  selected: boolean;
  photoLayout: PhotoLayout;
}

export interface CuratedStory {
  id: string;
  headline: string;
  source: string;
  url: string;
  summary: string;
  selected: boolean;
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  url: string;
  source: string;
  selected: boolean;
}

export interface PublicMeeting {
  id: string;
  title: string;
  agency: string;
  start_datetime: string;
  location: string;
  is_hybrid: boolean;
  is_virtual: boolean;
  accepts_public_comment: boolean;
  details_url: string;
  issue_tags: string[];
  selected: boolean;
}

export interface CommentPeriod {
  id: string;
  title: string;
  agency: string;
  end_date: string;
  days_remaining: number;
  comment_url: string;
  description: string;
  selected: boolean;
}

export type CivicActionType = "attend" | "comment" | "sign" | "contact" | "volunteer" | "follow" | "learn-more";

export interface CivicAction {
  id: string;
  title: string;
  description: string;
  url: string;
  actionType: CivicActionType;
}

export type PartnerTier = "champion" | "partner" | null;

export interface JobListing {
  id: string;
  organization: string;
  title: string;
  url: string;
  description: string;
  datePosted: string;
  selected: boolean;
  featured: boolean;
  partnerTier: PartnerTier;
}

export interface AdSlot {
  id: string;
  name: string;
  htmlContent: string;
  position: "after-intro" | "after-pd-stories" | "after-reading" | "before-footer";
  active: boolean;
  editorNote?: string;
}

export interface SavedAd {
  id: string;
  name: string;
  editorNote: string;
  savedAt: string;
  updatedAt: string;
  headline: string;
  copy: string;
  ctaUrl: string;
  ctaText: string;
  ctaUrl2: string;
  ctaText2: string;
  colorScheme: "blue" | "warm";
  imageUrl: string;
  htmlContent: string;
  position: AdSlot["position"];
}

export interface CO2Data {
  current: number;
  lastYear: number | null;
  change: number;
  date: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  title: string;
  photoUrl: string;
}

export const STAFF_MEMBERS: StaffMember[] = [
  {
    id: "nina",
    name: "Nina Ignaczak",
    email: "nina@planetdetroit.org",
    title: "Founder",
    photoUrl: "https://planetdetroit.org/wp-content/uploads/2025/04/Planet-Detroit1650-nina-copy.jpeg",
  },
  {
    id: "dustin",
    name: "Dustin Blitchok",
    email: "dustin@planetdetroit.org",
    title: "Managing Editor",
    photoUrl: "https://planetdetroit.org/wp-content/uploads/2025/03/Screenshot-2025-03-20-at-3.27.09%E2%80%AFPM.png",
  },
  {
    id: "ethan",
    name: "Ethan Bakuli",
    email: "ethan@planetdetroit.org",
    title: "Climate Solutions and Service Journalism Reporting Fellow",
    photoUrl: "https://planetdetroit.org/wp-content/uploads/2025/03/cropped-Screenshot-2025-03-20-at-3.26.10%E2%80%AFPM.png",
  },
  {
    id: "brian",
    name: "Brian Allnutt",
    email: "brian@planetdetroit.org",
    title: "Senior Reporter",
    photoUrl: "https://planetdetroit.org/wp-content/uploads/2025/04/Planet-Detroit1767-brian.jpeg",
  },
  {
    id: "isabelle",
    name: "Isabelle Tavares",
    email: "isabelle@planetdetroit.org",
    title: "Community Reporter, Report for America",
    photoUrl: "https://planetdetroit.org/wp-content/uploads/2025/04/cropped-Planet-Detroit1899-isabelle.jpeg",
  },
  {
    id: "ian",
    name: "Ian Solomon",
    email: "ian@planetdetroit.org",
    title: "Outdoors Reporter",
    photoUrl: "https://planetdetroit.org/wp-content/uploads/2026/02/cropped-IMG_9024-2.png",
  },
];

export interface SupportCTA {
  headline: string;
  buttonText: string;
  buttonUrl: string;
}

export interface PartnerPromo {
  title: string;
  bodyHtml: string;
  ctaText: string;
  ctaUrl: string;
}

export interface FundraisingCTA {
  headline: string;
  buttonText: string;
  buttonUrl: string;
}

export interface NewsletterState {
  newsletterType: NewsletterType;
  subjectLine: string;
  previewText: string;
  intro: string;
  psCTA: string;
  psCtaUrl: string;
  psCtaButtonText: string;
  signoffStaffId: string;
  issueDate: string;
  logoUrl: string;
  storyPhotoLayout: PhotoLayout;
  featuredPromo: {
    headline: string;
    description: string;
    imageUrl: string;
    ctaText: string;
    ctaUrl: string;
  } | null;
  sponsors: SponsorsData;
  supportCTA: SupportCTA;
  pdPosts: PDPost[];
  sponsoredPosts: PDPost[];
  sponsoredByName: string;
  curatedStories: CuratedStory[]; // legacy — kept for saved-state compat
  curatedNewsHtml: string;
  events: EventItem[];
  eventsHtml: string;
  jobs: JobListing[];
  jobsShowDescriptions: boolean;
  civicActions: CivicAction[];
  civicActionIntro: string;
  civicActionStoryId: number | null;
  publicMeetings: PublicMeeting[];
  commentPeriods: CommentPeriod[];
  publicMeetingsIntro: string;
  fundraisingLetter: string;
  fundraisingCTA: FundraisingCTA;
  partnerPromo: PartnerPromo | null;
  ads: AdSlot[];
  co2: CO2Data | null;
  sections: NewsletterSection[];
  lastSaved: string | null;
}

export const DEFAULT_SPONSORS: SponsorsData = {
  champions: [
    { name: "Detroit Zoo", url: "https://detroitzoo.org" },
    { name: "Walker Miller Energy Services", url: "https://wmenergy.com" },
    { name: "Michigan Sustainable Business Forum", url: "https://misbf.org" },
  ],
  partners: [
    { name: "Alliance for the Great Lakes", url: "https://greatlakes.org" },
    { name: "Detroiters Working for Environmental Justice", url: "https://detroitenvironmentaljustice.org" },
    { name: "The Work Department", url: "" },
    { name: "Great Lakes Environmental Law Center", url: "https://www.glelc.org" },
    { name: "Huron River Watershed Council", url: "https://www.hrwc.org" },
    { name: "Michigan Environmental Justice Coalition", url: "https://www.michiganej.org" },
    { name: "Path Consulting", url: "https://www.pathconsulting.org" },
    { name: "Steelcase", url: "https://www.steelcase.com" },
    { name: "Trent Creative", url: "https://trentcreative.com" },
    { name: "5 Lakes Energy", url: "https://5lakesenergy.com" },
    { name: "Anese & Associates", url: "https://www.aneseandassociates.com" },
    { name: "We Want Green Too", url: "https://www.wewantgreentoo.org" },
    { name: "Clinton River Watershed Council", url: "https://www.crwc.org" },
    { name: "Detroit 2030 District", url: "https://www.2030districts.org/detroit" },
    { name: "Friends of the Rouge", url: "https://therouge.org" },
    { name: "Early Works", url: "https://earlyworksllc.com" },
    { name: "Elevate", url: "https://www.elevatenp.org" },
    { name: "JustAir", url: "https://www.justair.co" },
    { name: "Michiganders for a Just Farming System", url: "https://justfarmingsystem.com" },
    { name: "Greening of Detroit", url: "https://www.greeningofdetroit.com" },
    { name: "Make Food Not Waste", url: "https://www.makefoodnotwaste.org" },
    { name: "Michigan Climate Action Network", url: "https://www.miclimateaction.org" },
    { name: "Michigan Clinicians for Climate Action", url: "https://www.michigancca.com" },
    { name: "MI Environmental Justice Coalition", url: "https://www.michiganej.org" },
    { name: "Six Rivers Land Conservancy", url: "https://www.sixriversrlc.org" },
    { name: "Society of Environmental Journalists", url: "https://www.sej.org" },
    { name: "Michigan Environmental Council", url: "https://www.environmentalcouncil.org" },
    { name: "Sticky Lab", url: "https://www.stickylab.com" },
    { name: "Walking Lightly", url: "https://www.walkinglightly.net" },
    { name: "We Reuse", url: "https://wewillreuse.com" },
    { name: "Michigan Green Muslims", url: "https://wisconsingreenmuslims.org/michigan" },
    { name: "Midwest Building Decarbonization Coalition", url: "https://midwestdecarb.org" },
    { name: "Detroit Outdoors", url: "https://www.detroitoutdoors.org" },
    { name: "Green Garage", url: "https://greengaragedetroit.com" },
    { name: "Friends of the Detroit River", url: "https://www.detroitriver.org" },
    { name: "Corvias Infrastructure Solutions", url: "https://www.cisolutions.com" },
    { name: "University of Michigan Water Center", url: "https://graham.umich.edu/water" },
    { name: "e3 refillery", url: "" },
  ],
};

export const DEFAULT_SECTIONS: NewsletterSection[] = [
  // Content tab — weekly workhorse sections
  { id: "pd-stories", title: "Reporting from Planet Detroit", description: "Recent posts from planetdetroit.org", status: "empty", icon: "📝", order: 1, automationLevel: "full", tab: "content", enabled: true },
  { id: "sponsored-content", title: "Sponsored Content", description: "Sponsored posts from WordPress", status: "empty", icon: "💛", order: 2, automationLevel: "semi", tab: "content", enabled: true },
  { id: "civic-action", title: "Civic Action", description: "Civic actions readers can take based on PD reporting", status: "empty", icon: "🤝", order: 3, automationLevel: "semi", tab: "content", enabled: true },
  { id: "curated-news", title: "What We're Reading", description: "Curated news from external sources", status: "empty", icon: "📖", order: 4, automationLevel: "full", tab: "content", enabled: true },
  { id: "intro", title: "Editor's Letter", description: "AI-generated intro from the week's content", status: "empty", icon: "✏️", order: 5, automationLevel: "semi", tab: "content", enabled: true },
  { id: "events", title: "Events", description: "Upcoming community & environmental events", status: "empty", icon: "📅", order: 6, automationLevel: "semi", tab: "content", enabled: true },
  { id: "jobs", title: "Jobs", description: "Environmental job listings", status: "empty", icon: "💼", order: 7, automationLevel: "semi", tab: "content", enabled: true },
  { id: "ps-cta", title: "P.S. Call-to-Action", description: "Promo or call-to-action after the intro", status: "empty", icon: "📣", order: 8, automationLevel: "manual", tab: "content", enabled: true },
  { id: "partner-promo", title: "Partner Promo", description: "Partner or sponsor promotion above the footer", status: "empty", icon: "🤝", order: 9, automationLevel: "manual", tab: "content", enabled: true },
  // In Development tab — sections still being built out
  { id: "public-meetings", title: "Public Meetings & Comment Periods", description: "Upcoming government meetings and open comment periods", status: "empty", icon: "🏛️", order: 1, automationLevel: "semi", tab: "in-development", enabled: true },
  // Fundraising tab — fundraising appeal content
  { id: "fundraising-letter", title: "Editor's Letter", description: "Fundraising appeal letter", status: "empty", icon: "💌", order: 1, automationLevel: "manual", tab: "fundraising", enabled: true },
  { id: "fundraising-cta", title: "Donate CTA", description: "Call-to-action button linking to Donorbox", status: "empty", icon: "💚", order: 2, automationLevel: "manual", tab: "fundraising", enabled: true },
  { id: "fundraising-tracker", title: "Fundraiser Performance", description: "Campaign metrics for fundraising emails", status: "ready", icon: "📊", order: 3, automationLevel: "full", tab: "fundraising", enabled: true },
  // Ads tab — optional sponsored content
  { id: "ads", title: "Ad Slots", description: "Sponsored content between sections", status: "empty", icon: "📢", order: 1, automationLevel: "manual", tab: "ads", enabled: true },
  { id: "ad-tracker", title: "Ad Performance", description: "Campaign metrics and link tracking", status: "ready", icon: "📊", order: 2, automationLevel: "full", tab: "ads", enabled: true },
  // Settings tab — static / set-and-forget sections
  { id: "header", title: "Header & Logo", description: "Logo and newsletter date", status: "ready", icon: "📰", order: 1, automationLevel: "full", tab: "settings", enabled: true },
  { id: "co2", title: "CO₂ Data", description: "Weekly atmospheric CO₂ from NOAA Mauna Loa", status: "empty", icon: "🌍", order: 2, automationLevel: "full", tab: "settings", enabled: true },
  { id: "featured", title: "Featured Promo", description: "Special announcements or campaigns", status: "empty", icon: "⭐", order: 3, automationLevel: "semi", tab: "settings", enabled: true },
  { id: "app-download", title: "App Download", description: "Download the Planet Detroit app promo", status: "ready", icon: "📱", order: 3.5, automationLevel: "full", tab: "settings", enabled: true },
  { id: "sponsors", title: "Planet Champions & Partners", description: "Sponsors and impact partner listings", status: "ready", icon: "🌎", order: 4, automationLevel: "manual", tab: "settings", enabled: true },
  { id: "support", title: "Support CTA", description: "Donation/membership call-to-action", status: "ready", icon: "💚", order: 5, automationLevel: "full", tab: "settings", enabled: true },
  { id: "footer", title: "Footer", description: "Static footer with social links", status: "ready", icon: "🔗", order: 6, automationLevel: "full", tab: "settings", enabled: true },
];
