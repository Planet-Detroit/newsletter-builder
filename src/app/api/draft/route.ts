import { NextRequest, NextResponse } from "next/server";

const PREFIX = "nl:draft:";

/**
 * Lazily get a Redis client. Returns null when env vars are missing
 * (allows the app to work without Redis — falls back to localStorage only).
 */
function getRedisOrNull() {
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
    if (!url || !token) return null;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require("@upstash/redis");
    return new Redis({ url, token });
  } catch {
    return null;
  }
}

/**
 * GET /api/draft
 *
 * Fetch the current shared draft from Redis.
 * ?meta=true returns only { version, lastEditor, updatedAt } for lightweight polling.
 */
export async function GET(request: NextRequest) {
  const redis = getRedisOrNull();
  if (!redis) {
    return NextResponse.json({ error: "Redis not configured" }, { status: 503 });
  }

  try {
    const metaOnly = request.nextUrl.searchParams.get("meta") === "true";

    if (metaOnly) {
      // Lightweight poll — just check version & editor
      const [version, editor] = await Promise.all([
        redis.get(`${PREFIX}version`),
        redis.get(`${PREFIX}editor`),
      ]);

      if (version == null) {
        return NextResponse.json({ error: "No draft exists" }, { status: 404 });
      }

      return NextResponse.json({
        version: Number(version),
        ...(editor as { userId?: string; updatedAt?: string } || {}),
      });
    }

    // Full state fetch
    const [state, version, editor] = await Promise.all([
      redis.get(`${PREFIX}state`),
      redis.get(`${PREFIX}version`),
      redis.get(`${PREFIX}editor`),
    ]);

    if (!state || version == null) {
      return NextResponse.json({ error: "No draft exists" }, { status: 404 });
    }

    return NextResponse.json({
      state,
      version: Number(version),
      ...(editor as { userId?: string; updatedAt?: string } || {}),
    });
  } catch (err) {
    console.error("Draft GET error:", err);
    return NextResponse.json({ error: "Storage error" }, { status: 500 });
  }
}

/**
 * POST /api/draft
 *
 * Save the current draft state to Redis.
 * Body: { state: NewsletterState, userId: string }
 * Returns: { version, updatedAt }
 */
export async function POST(request: NextRequest) {
  const redis = getRedisOrNull();
  if (!redis) {
    return NextResponse.json({ error: "Redis not configured" }, { status: 503 });
  }

  try {
    const { state, userId } = await request.json();

    if (!state || typeof state !== "object") {
      return NextResponse.json({ error: "Missing state" }, { status: 400 });
    }

    const updatedAt = new Date().toISOString();

    // Increment version atomically
    const newVersion = await redis.incr(`${PREFIX}version`);

    // Store state and editor metadata
    await Promise.all([
      redis.set(`${PREFIX}state`, JSON.stringify(state)),
      redis.set(`${PREFIX}editor`, JSON.stringify({ userId: userId || "unknown", updatedAt })),
    ]);

    return NextResponse.json({ version: newVersion, updatedAt });
  } catch (err) {
    console.error("Draft POST error:", err);
    return NextResponse.json({ error: "Storage error" }, { status: 500 });
  }
}
