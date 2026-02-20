import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const ASK_PD_API = process.env.ASK_PD_API_URL || "https://ask-planet-detroit-production.up.railway.app";

interface MeetingContext {
  title: string;
  agency: string;
  start_datetime: string;
  details_url?: string;
}

interface CommentPeriodContext {
  title: string;
  agency: string;
  end_date: string;
  days_remaining: number;
  comment_url?: string;
}

interface OrgContext {
  name: string;
  website?: string;
  focus_areas?: string[];
}

/**
 * POST /api/civic-actions
 * Takes a story title/excerpt plus optional meetings, comment periods, and org context.
 * Returns an AI-generated intro paragraph and 2-3 civic action items.
 */
export async function POST(req: NextRequest) {
  try {
    const {
      storyTitle,
      storyExcerpt,
      upcomingMeetings,
      openCommentPeriods,
    } = await req.json();

    if (!storyTitle || typeof storyTitle !== "string") {
      return NextResponse.json(
        { error: "Please provide a story title" },
        { status: 400 }
      );
    }

    // Fetch relevant orgs from ask-planet-detroit API (non-blocking, non-critical)
    let orgs: OrgContext[] = [];
    try {
      const orgRes = await fetch(
        `${ASK_PD_API}/api/organizations?q=${encodeURIComponent(storyTitle)}&limit=5`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (orgRes.ok) {
        const orgData = await orgRes.json();
        orgs = (orgData.organizations || orgData || [])
          .slice(0, 5)
          .map((o: Record<string, unknown>) => ({
            name: o.name || "",
            website: o.website || "",
            focus_areas: o.focus_areas || [],
          }));
      }
    } catch {
      // Org fetch failed — continue without org data
    }

    // Build context sections for the prompt
    let meetingsContext = "";
    if (Array.isArray(upcomingMeetings) && upcomingMeetings.length > 0) {
      const meetingLines = (upcomingMeetings as MeetingContext[])
        .slice(0, 5)
        .map((m) => `- ${m.title} (${m.agency}, ${m.start_datetime})${m.details_url ? ` ${m.details_url}` : ""}`)
        .join("\n");
      meetingsContext = `\n\nUPCOMING PUBLIC MEETINGS (use these real meetings if relevant — include URLs):\n${meetingLines}`;
    }

    let commentPeriodsContext = "";
    if (Array.isArray(openCommentPeriods) && openCommentPeriods.length > 0) {
      const cpLines = (openCommentPeriods as CommentPeriodContext[])
        .slice(0, 5)
        .map((cp) => `- ${cp.title} (${cp.agency}, ${cp.days_remaining} days left)${cp.comment_url ? ` ${cp.comment_url}` : ""}`)
        .join("\n");
      commentPeriodsContext = `\n\nOPEN COMMENT PERIODS (prioritize these if relevant — include URLs):\n${cpLines}`;
    }

    let orgsContext = "";
    if (orgs.length > 0) {
      const orgLines = orgs
        .map((o) => `- ${o.name}${o.website ? ` (${o.website})` : ""}${o.focus_areas?.length ? ` — ${o.focus_areas.join(", ")}` : ""}`)
        .join("\n");
      orgsContext = `\n\nRELEVANT ORGANIZATIONS (use real org names and website URLs when suggesting "follow" or "volunteer" actions):\n${orgLines}`;
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `You are an editor at Planet Detroit, a nonprofit environmental news outlet covering Metro Detroit, Michigan.

Based on the following story, generate:
1. A single-sentence intro (under 120 characters) that references the story topic and leads into the action items. Example: "Based on our reporting on PFAS contamination, here are ways to get involved:"

2. Between 2 and 3 specific, actionable civic engagement opportunities related to this story's topic. These should be real, concrete things a Metro Detroit resident could do. Prioritize real upcoming meetings, open comment periods, and real organizations when available — include their actual URLs.

Story Title: ${storyTitle}
${storyExcerpt ? `Story Summary: ${storyExcerpt.slice(0, 2000)}` : ""}${meetingsContext}${commentPeriodsContext}${orgsContext}

Return ONLY a valid JSON object (no markdown, no code fences) with this structure:
{
  "intro": "Single sentence under 120 characters referencing the story topic...",
  "actions": [
    {
      "title": "Short action title",
      "description": "1-2 sentence description of what to do and why it matters",
      "url": "https://relevant-url-if-known.com or empty string if unknown",
      "actionType": "one of: attend, comment, sign, contact, volunteer, follow, learn-more"
    }
  ]
}

Return the JSON now:`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON — handle potential markdown fences
    const jsonStr = responseText
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      const objMatch = responseText.match(/\{[\s\S]*\}/);
      if (objMatch) {
        parsed = JSON.parse(objMatch[0]);
      } else {
        throw new Error("Could not parse AI response as JSON");
      }
    }

    if (!parsed.intro || !Array.isArray(parsed.actions)) {
      throw new Error("Response missing intro or actions array");
    }

    const validTypes = ["attend", "comment", "sign", "contact", "volunteer", "follow", "learn-more"];

    const actions = parsed.actions.map(
      (
        a: {
          title?: string;
          description?: string;
          url?: string;
          actionType?: string;
        },
        i: number
      ) => ({
        id: `ca-${Date.now()}-${i}`,
        title: (a.title || "Take Action").trim(),
        description: (a.description || "").trim(),
        url: (a.url || "").trim(),
        actionType: validTypes.includes(a.actionType || "") ? a.actionType : "learn-more",
      })
    );

    return NextResponse.json({
      intro: parsed.intro.trim(),
      actions,
    });
  } catch (error) {
    console.error("Civic actions generation error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
