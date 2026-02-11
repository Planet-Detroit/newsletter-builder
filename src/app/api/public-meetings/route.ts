import { NextResponse } from "next/server";

const ASK_PD_API_URL =
  process.env.ASK_PD_API_URL ||
  "https://ask-planet-detroit-production.up.railway.app";

export async function GET() {
  try {
    const [meetingsRes, periodsRes] = await Promise.all([
      fetch(`${ASK_PD_API_URL}/api/meetings?status=upcoming&limit=20`, {
        next: { revalidate: 300 },
      }),
      fetch(`${ASK_PD_API_URL}/api/comment-periods?status=open&limit=20`, {
        next: { revalidate: 300 },
      }),
    ]);

    const meetingsData = meetingsRes.ok ? await meetingsRes.json() : { meetings: [] };
    const periodsData = periodsRes.ok ? await periodsRes.json() : { comment_periods: [] };

    return NextResponse.json({
      meetings: meetingsData.meetings || [],
      commentPeriods: periodsData.comment_periods || [],
    });
  } catch (error) {
    console.error("Public meetings fetch error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message, meetings: [], commentPeriods: [] }, { status: 500 });
  }
}
