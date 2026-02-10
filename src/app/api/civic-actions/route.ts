import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * POST /api/civic-actions
 * Takes a story title and excerpt, returns an AI-generated intro paragraph
 * and 2-4 civic action items for the newsletter's "Take Action" section.
 */
export async function POST(req: NextRequest) {
  try {
    const { storyTitle, storyExcerpt } = await req.json();

    if (!storyTitle || typeof storyTitle !== "string") {
      return NextResponse.json(
        { error: "Please provide a story title" },
        { status: 400 }
      );
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `You are an editor at Planet Detroit, a nonprofit environmental news outlet covering Metro Detroit, Michigan. Your journalism is designed not only to inform readers, but to inspire civic action.

Based on the following story, generate:
1. A short intro paragraph (2-3 sentences) that connects the story to civic action. Frame it as: Planet Detroit's journalism is designed to inform and inspire action. Reference the specific story topic naturally. End with something like "Here are some actions you can take:" — but write it naturally, not formulaic.

2. Between 2 and 4 specific, actionable civic engagement opportunities related to this story's topic. These should be real, concrete things a Metro Detroit resident could do. Think: attend a public meeting, submit a public comment, contact an elected official, sign a petition, volunteer with an organization, follow an organization's work, or learn more about the issue.

Story Title: ${storyTitle}
${storyExcerpt ? `Story Summary: ${storyExcerpt.slice(0, 2000)}` : ""}

Return ONLY a valid JSON object (no markdown, no code fences) with this structure:
{
  "intro": "The intro paragraph here...",
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
