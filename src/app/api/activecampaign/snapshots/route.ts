import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";
import type { AdPerformanceSnapshot } from "@/types/ads";

const INDEX_KEY = "nl:ad-snaps:index";
const MAX_SNAPSHOTS = 200;
const TTL_SECONDS = 90 * 24 * 60 * 60; // 90 days

// ── POST: Save a snapshot ───────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId, campaignName, campaign, links, note } = body;

    if (!campaignId || !campaign) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const id = `snap-${campaignId}-${Date.now()}`;
    const snapshot: AdPerformanceSnapshot = {
      id,
      campaignId,
      campaignName: campaignName || "Untitled Campaign",
      savedAt: new Date().toISOString(),
      note: note || "",
      campaign: {
        sendCount: campaign.sendCount || 0,
        opens: campaign.opens || 0,
        clicks: campaign.clicks || 0,
        openRate: campaign.openRate || "0",
      },
      links: Array.isArray(links) ? links : [],
    };

    const redis = getRedis();

    // Store snapshot with TTL
    await redis.set(`nl:ad-snap:${id}`, JSON.stringify(snapshot), { ex: TTL_SECONDS });

    // Add to index (most recent first), trim to max
    await redis.lpush(INDEX_KEY, id);
    await redis.ltrim(INDEX_KEY, 0, MAX_SNAPSHOTS - 1);

    return NextResponse.json({ success: true, snapshot }, { status: 201 });
  } catch (error) {
    console.error("Failed to save snapshot:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── GET: List snapshots ─────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const campaignId = request.nextUrl.searchParams.get("campaignId");
    const redis = getRedis();

    const ids: string[] = (await redis.lrange(INDEX_KEY, 0, MAX_SNAPSHOTS - 1)) || [];

    if (ids.length === 0) {
      return NextResponse.json({ snapshots: [] });
    }

    // Fetch all snapshots in parallel
    const results = await Promise.all(
      ids.map(async (id) => {
        const raw = await redis.get(`nl:ad-snap:${id}`);
        if (!raw) return null;
        try {
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          return parsed as AdPerformanceSnapshot;
        } catch {
          return null;
        }
      })
    );

    let snapshots = results.filter(Boolean) as AdPerformanceSnapshot[];

    // Filter by campaign if requested
    if (campaignId) {
      snapshots = snapshots.filter((s) => s.campaignId === campaignId);
    }

    return NextResponse.json({ snapshots });
  } catch (error) {
    console.error("Failed to list snapshots:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── DELETE: Remove a snapshot ───────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing ?id= parameter" }, { status: 400 });
    }

    const redis = getRedis();
    await redis.del(`nl:ad-snap:${id}`);
    await redis.lrem(INDEX_KEY, 0, id);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Failed to delete snapshot:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
