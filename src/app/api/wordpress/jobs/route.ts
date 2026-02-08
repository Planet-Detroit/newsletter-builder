import { NextResponse } from "next/server";

/**
 * Fetch job listings from the Planet Detroit WordPress site.
 *
 * Step 1: Query /wp-json/wp/v2/types to discover what CPTs exist
 * Step 2: If a job-related CPT is found, fetch its posts
 * Step 3: Falls back gracefully with debug info
 */

interface WPJobPost {
  id: number;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  link: string;
  date: string;
  meta?: Record<string, unknown>;
  _embedded?: {
    author?: Array<{ name: string }>;
  };
  job_listing_company?: string;
  company_name?: string;
  acf?: Record<string, unknown>;
}

function decodeEntities(str: string): string {
  return str
    .replace(/<[^>]*>/g, "")
    .replace(/&hellip;/g, "...")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8217;/g, "\u2019")
    .replace(/&#8216;/g, "\u2018")
    .replace(/&#8220;/g, "\u201C")
    .replace(/&#8221;/g, "\u201D")
    .replace(/&#8211;/g, "\u2013")
    .replace(/&#8212;/g, "\u2014")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function extractOrganization(post: WPJobPost): string {
  if (post.job_listing_company) return decodeEntities(post.job_listing_company);
  if (post.company_name) return decodeEntities(post.company_name);
  if (post.meta) {
    for (const key of ["_company_name", "company_name", "organization", "_organization"]) {
      if (typeof post.meta[key] === "string" && post.meta[key]) {
        return decodeEntities(post.meta[key] as string);
      }
    }
  }
  if (post.acf) {
    for (const key of ["company", "company_name", "organization", "employer"]) {
      if (typeof post.acf[key] === "string" && post.acf[key]) {
        return decodeEntities(post.acf[key] as string);
      }
    }
  }
  return "";
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent": "PlanetDetroit-NewsletterBuilder/1.0",
  };
  const username = process.env.WORDPRESS_USERNAME;
  const appPassword = process.env.WORDPRESS_APP_PASSWORD;
  if (username && appPassword) {
    const token = Buffer.from(`${username}:${appPassword}`).toString("base64");
    headers["Authorization"] = `Basic ${token}`;
  }
  return headers;
}

async function safeFetch(url: string, headers: Record<string, string>): Promise<{ status: number; data: unknown; raw: string }> {
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(10000),
  });
  const raw = await response.text();
  let data: unknown = null;
  try {
    data = JSON.parse(raw);
  } catch {
    // Response was not JSON (probably HTML from Cloudflare)
  }
  return { status: response.status, data, raw: raw.slice(0, 500) };
}

export async function GET() {
  const wpUrl = process.env.WORDPRESS_URL || "https://planetdetroit.org";
  const headers = getAuthHeaders();
  const debugLog: string[] = [];
  const hasAuth = !!headers["Authorization"];
  debugLog.push(`Auth configured: ${hasAuth}`);

  try {
    // Step 1: Discover available post types
    debugLog.push(`\nDiscovering post types...`);
    const typesResult = await safeFetch(`${wpUrl}/wp-json/wp/v2/types`, headers);
    debugLog.push(`  /wp-json/wp/v2/types → ${typesResult.status}`);

    let jobRestBase: string | null = null;

    if (typesResult.status === 200 && typesResult.data && typeof typesResult.data === "object") {
      const types = typesResult.data as Record<string, { slug?: string; rest_base?: string; name?: string }>;
      const typeKeys = Object.keys(types);
      debugLog.push(`  Found types: ${typeKeys.join(", ")}`);

      // Look for job-related CPTs
      for (const key of typeKeys) {
        const t = types[key];
        if (key.includes("job") || (t.slug && t.slug.includes("job"))) {
          debugLog.push(`  → Job CPT found: "${key}" (rest_base: "${t.rest_base}", slug: "${t.slug}", name: "${t.name}")`);
          jobRestBase = t.rest_base || t.slug || key;
        }
      }
    } else {
      debugLog.push(`  Could not read types. Raw: ${typesResult.raw.slice(0, 200)}`);
    }

    // Step 2: Fetch jobs using discovered rest_base, or try common patterns
    const slugsToTry = jobRestBase
      ? [jobRestBase, "job-listings", "job_listing"]
      : ["job-listings", "job_listing", "job-listing", "job_listings"];

    let posts: WPJobPost[] = [];
    let foundSlug = "";

    debugLog.push(`\nFetching jobs...`);
    for (const slug of slugsToTry) {
      const url = `${wpUrl}/wp-json/wp/v2/${slug}?per_page=20&orderby=date&order=desc&_embed=author`;
      debugLog.push(`  Trying: /wp-json/wp/v2/${slug}`);
      try {
        const result = await safeFetch(url, headers);
        debugLog.push(`    → ${result.status}`);
        if (result.status === 200 && Array.isArray(result.data)) {
          if (result.data.length > 0) {
            posts = result.data as WPJobPost[];
            foundSlug = slug;
            debugLog.push(`    → Found ${result.data.length} jobs!`);
            break;
          } else {
            debugLog.push(`    → OK but 0 items`);
          }
        } else if (result.data && typeof result.data === "object" && !Array.isArray(result.data)) {
          const errData = result.data as Record<string, unknown>;
          debugLog.push(`    → WP error: ${errData.code || errData.message || "unknown"}`);
        } else {
          debugLog.push(`    → Non-JSON or unexpected: ${result.raw.slice(0, 150)}`);
        }
      } catch (err) {
        debugLog.push(`    → Fetch error: ${err instanceof Error ? err.message : "unknown"}`);
      }
    }

    console.log("WordPress Jobs Debug:\n" + debugLog.join("\n"));

    if (posts.length === 0) {
      return NextResponse.json({
        jobs: [],
        message: "No job listings found on WordPress.",
        slug: null,
        debug: debugLog,
      });
    }

    const formatted = posts.map((post) => ({
      id: `job-wp-${post.id}`,
      title: decodeEntities(post.title?.rendered || ""),
      organization: extractOrganization(post),
      description: decodeEntities(post.excerpt?.rendered || post.content?.rendered || "").slice(0, 200),
      url: post.link || "",
      datePosted: post.date ? post.date.slice(0, 10) : "",
      selected: false,
      featured: false,
      partnerTier: null,
    }));

    return NextResponse.json({ jobs: formatted, slug: foundSlug });
  } catch (error) {
    console.error("WordPress jobs API error:", error);
    debugLog.push(`\nFatal error: ${error instanceof Error ? error.message : "unknown"}`);
    return NextResponse.json({
      jobs: [],
      error: error instanceof Error ? error.message : "Unknown error",
      debug: debugLog,
    }, { status: 500 });
  }
}
