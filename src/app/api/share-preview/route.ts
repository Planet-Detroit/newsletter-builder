import { NextRequest, NextResponse } from "next/server";

const PREFIX = "nl:preview:";
const TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

// In-memory fallback when Redis isn't configured
const memoryStore = new Map<string, { html: string; created: number }>();

function getRedisOrNull() {
  try {
    // Dynamic import to avoid hard failure when env vars are missing
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

function generateId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 10; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function cleanupMemory() {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [id, data] of memoryStore) {
    if (data.created < cutoff) memoryStore.delete(id);
  }
}

// POST: Store a preview, return an ID
export async function POST(request: NextRequest) {
  try {
    const { html } = await request.json();
    if (!html || typeof html !== "string") {
      return NextResponse.json({ error: "Missing html" }, { status: 400 });
    }

    const id = generateId();
    const redis = getRedisOrNull();

    if (redis) {
      await redis.set(`${PREFIX}${id}`, html, { ex: TTL_SECONDS });
    } else {
      // Fallback to in-memory
      cleanupMemory();
      memoryStore.set(id, { html, created: Date.now() });
    }

    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

// GET: Retrieve a preview by ID
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const redis = getRedisOrNull();

    if (redis) {
      const html = (await redis.get(`${PREFIX}${id}`)) as string | null;
      if (!html) {
        return NextResponse.json({ error: "Preview not found or expired" }, { status: 404 });
      }
      return NextResponse.json({ html });
    } else {
      // Fallback to in-memory
      const data = memoryStore.get(id);
      if (!data) {
        return NextResponse.json({ error: "Preview not found or expired" }, { status: 404 });
      }
      return NextResponse.json({ html: data.html });
    }
  } catch {
    return NextResponse.json({ error: "Storage error" }, { status: 500 });
  }
}
