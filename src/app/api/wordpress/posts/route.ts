import { NextResponse } from "next/server";

interface WPPost {
  id: number;
  title: { rendered: string };
  excerpt: { rendered: string };
  link: string;
  date: string;
  meta?: {
    newspack_post_subtitle?: string;
    [key: string]: unknown;
  };
  newspack_post_subtitle?: string;
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url: string;
      media_details?: {
        sizes?: {
          medium?: { source_url: string };
          thumbnail?: { source_url: string };
          medium_large?: { source_url: string };
          full?: { source_url: string };
        };
      };
    }>;
  };
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

export async function GET() {
  try {
    const wpUrl = process.env.WORDPRESS_URL || "https://planetdetroit.org";

    // Fetch posts from last 14 days
    const since = new Date();
    since.setDate(since.getDate() - 14);
    const afterDate = since.toISOString();

    const url = `${wpUrl}/wp-json/wp/v2/posts?after=${afterDate}&per_page=20&orderby=date&order=desc&_embed=wp:featuredmedia`;

    const response = await fetch(url, {
      headers: getAuthHeaders(),
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`WordPress API returned ${response.status}`);
    }

    const posts: WPPost[] = await response.json();

    const formatted = posts.map((post) => {
      const cleanTitle = decodeEntities(post.title.rendered);
      const cleanExcerpt = decodeEntities(post.excerpt.rendered);

      // Newspack subtitle: check meta.newspack_post_subtitle, then top-level, then fall back to excerpt
      const subtitle =
        post.meta?.newspack_post_subtitle ||
        post.newspack_post_subtitle ||
        "";

      const cleanSubtitle = subtitle ? decodeEntities(subtitle) : "";

      // Get featured image — grab multiple sizes for layout options
      const media = post._embedded?.["wp:featuredmedia"]?.[0];
      const featuredImage = media?.source_url || null;
      const sizes = media?.media_details?.sizes;
      const thumbnailImage = sizes?.medium?.source_url || sizes?.thumbnail?.source_url || featuredImage;

      return {
        id: post.id,
        title: cleanTitle,
        subtitle: cleanSubtitle,
        excerpt: cleanExcerpt,
        url: post.link,
        featuredImage,
        thumbnailImage: thumbnailImage || featuredImage,
        date: post.date,
        selected: false,
        photoLayout: "small-left" as const,
      };
    });

    return NextResponse.json({ posts: formatted });
  } catch (error) {
    console.error("WordPress API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
