import { NextRequest, NextResponse } from "next/server";

// In-memory store for preview snapshots.
// Previews persist as long as the serverless function stays warm (typically
// minutes to hours on Vercel). For permanent links, swap this for Vercel KV.
const previews = new Map<string, { html: string; created: number }>();

// Clean up previews older than 24 hours on each request
function cleanup() {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [id, data] of previews) {
    if (data.created < cutoff) previews.delete(id);
  }
}

function generateId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// POST: Store a preview, return an ID
export async function POST(request: NextRequest) {
  try {
    cleanup();
    const { html } = await request.json();
    if (!html || typeof html !== "string") {
      return NextResponse.json({ error: "Missing html" }, { status: 400 });
    }

    const id = generateId();
    previews.set(id, { html, created: Date.now() });

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

  const data = previews.get(id);
  if (!data) {
    return NextResponse.json({ error: "Preview not found or expired" }, { status: 404 });
  }

  return NextResponse.json({ html: data.html });
}
