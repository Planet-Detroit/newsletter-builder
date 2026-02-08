import { NextResponse } from "next/server";

/**
 * Fetches available briefs from the news-brief-generator's Vercel KV store.
 * The BRIEF_GENERATOR_URL env var should point to the deployed news brief generator.
 */

export async function GET() {
  try {
    const baseUrl =
      process.env.BRIEF_GENERATOR_URL || "https://news-brief-generator.vercel.app";

    const res = await fetch(`${baseUrl}/api/briefs`, {
      headers: { "User-Agent": "PlanetDetroit-NewsletterBuilder/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      throw new Error(`Brief generator returned ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch briefs:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
