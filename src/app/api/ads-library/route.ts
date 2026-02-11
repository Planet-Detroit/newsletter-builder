import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";
import type { SavedAd } from "@/types/newsletter";

const INDEX_KEY = "nl:ads-library:index";
const MAX_ADS = 100;

// ── GET: List all saved ads ─────────────────────────────────────────────

export async function GET() {
  try {
    const redis = getRedis();
    const ids: string[] = (await redis.lrange(INDEX_KEY, 0, MAX_ADS - 1)) || [];

    if (ids.length === 0) {
      return NextResponse.json({ ads: [] });
    }

    const results = await Promise.all(
      ids.map(async (id) => {
        const raw = await redis.get(`nl:ads-library:${id}`);
        if (!raw) return null;
        try {
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          return parsed as SavedAd;
        } catch {
          return null;
        }
      })
    );

    const ads = results.filter(Boolean) as SavedAd[];
    return NextResponse.json({ ads });
  } catch (error) {
    console.error("Failed to list saved ads:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── POST: Save or update an ad ──────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ad, id: existingId } = body as { ad: Omit<SavedAd, "id" | "savedAt" | "updatedAt">; id?: string };

    if (!ad || (!ad.headline && !ad.imageUrl)) {
      return NextResponse.json({ error: "Ad must have a headline or image" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const redis = getRedis();

    if (existingId) {
      // Update existing ad
      const raw = await redis.get(`nl:ads-library:${existingId}`);
      if (!raw) {
        return NextResponse.json({ error: "Ad not found" }, { status: 404 });
      }
      const existing = typeof raw === "string" ? JSON.parse(raw) : raw;
      const updated: SavedAd = {
        ...existing,
        ...ad,
        id: existingId,
        savedAt: existing.savedAt,
        updatedAt: now,
      };
      await redis.set(`nl:ads-library:${existingId}`, JSON.stringify(updated));
      return NextResponse.json({ success: true, ad: updated });
    }

    // Create new ad
    const id = `saved-ad-${Date.now()}`;
    const saved: SavedAd = {
      ...ad,
      id,
      savedAt: now,
      updatedAt: now,
    };

    await redis.set(`nl:ads-library:${id}`, JSON.stringify(saved));
    await redis.lpush(INDEX_KEY, id);
    await redis.ltrim(INDEX_KEY, 0, MAX_ADS - 1);

    return NextResponse.json({ success: true, ad: saved }, { status: 201 });
  } catch (error) {
    console.error("Failed to save ad:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── DELETE: Remove a saved ad ───────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing ?id= parameter" }, { status: 400 });
    }

    const redis = getRedis();
    await redis.del(`nl:ads-library:${id}`);
    await redis.lrem(INDEX_KEY, 0, id);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Failed to delete saved ad:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
