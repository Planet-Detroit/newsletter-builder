import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

const PREFIX = "nl:preview:";
const TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

function generateId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 10; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// POST: Store a preview, return an ID
export async function POST(request: NextRequest) {
  try {
    const { html } = await request.json();
    if (!html || typeof html !== "string") {
      return NextResponse.json({ error: "Missing html" }, { status: 400 });
    }

    const redis = getRedis();
    const id = generateId();
    await redis.set(`${PREFIX}${id}`, html, { ex: TTL_SECONDS });

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
    const redis = getRedis();
    const html = await redis.get<string>(`${PREFIX}${id}`);
    if (!html) {
      return NextResponse.json({ error: "Preview not found or expired" }, { status: 404 });
    }

    return NextResponse.json({ html });
  } catch {
    return NextResponse.json({ error: "Storage error" }, { status: 500 });
  }
}
