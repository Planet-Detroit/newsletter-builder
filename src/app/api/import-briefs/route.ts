import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy to the news-brief-generator's briefs API.
 * GET  /api/import-briefs          — list all briefs
 * DELETE /api/import-briefs?id=xxx — delete a brief by ID
 */

const getBaseUrl = () =>
  process.env.BRIEF_GENERATOR_URL || "https://news-brief-generator.vercel.app";

export async function GET() {
  try {
    const res = await fetch(`${getBaseUrl()}/api/briefs`, {
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

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing ?id= parameter" }, { status: 400 });
    }

    const res = await fetch(`${getBaseUrl()}/api/briefs?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "User-Agent": "PlanetDetroit-NewsletterBuilder/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      throw new Error(`Brief generator returned ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to delete brief:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
