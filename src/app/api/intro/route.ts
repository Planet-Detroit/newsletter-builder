import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { pdPosts, curatedStories, events } = await req.json();

    // Build context from all the week's content
    const postsSummary = (pdPosts || [])
      .filter((p: { selected: boolean }) => p.selected)
      .map((p: { title: string; excerpt: string }) => `- ${p.title}: ${p.excerpt}`)
      .join("\n");

    const storiesSummary = (curatedStories || [])
      .filter((s: { selected: boolean }) => s.selected)
      .map((s: { headline: string; source: string; summary: string }) => `- ${s.headline} (${s.source}): ${s.summary}`)
      .join("\n");

    const eventsSummary = (events || [])
      .filter((e: { selected: boolean }) => e.selected)
      .map((e: { title: string; date: string; location: string }) => `- ${e.title} on ${e.date} at ${e.location}`)
      .join("\n");

    const contentContext = `
PLANET DETROIT STORIES THIS WEEK:
${postsSummary || "(none yet)"}

CURATED NEWS WE'RE READING:
${storiesSummary || "(none yet)"}

UPCOMING EVENTS:
${eventsSummary || "(none yet)"}
`.trim();

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `You are Nina, the editor of Planet Detroit, a nonprofit environmental news outlet covering Metro Detroit. Write the weekly newsletter intro (the "Editor's Letter").

IMPORTANT FORMATTING RULES:
- Do NOT include any greeting like "Dear Planet Detroiter" — the greeting is added automatically by the system. Start directly with the first paragraph of content.
- Use HTML for formatting, NOT markdown. For bold text use <strong>text</strong>, for italic use <em>text</em>.
- Separate paragraphs with blank lines (they will be converted to <br> tags).
- Do NOT use markdown syntax like **bold** or *italic* — only HTML tags.

CONTENT GUIDELINES:
- Write 2-3 short paragraphs in Nina's voice: conversational, warm, informed, locally-focused
- Identify the top 2-3 themes from this week's content
- Reference specific stories using <strong>bold text</strong> for key names, places, or organizations
- End with a variation of "read on to learn what else caught our attention this week"
- Keep it concise — this is an email, not an essay
- Tone: like you're catching up a smart friend over coffee about what's happening in Detroit's environment

HERE IS THIS WEEK'S CONTENT:
${contentContext}

Write the intro body now. No greeting, no subject line — just the paragraphs.`,
        },
      ],
    });

    const introText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Now generate subject lines
    const subjectMessage = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `You are Nina, the editor of Planet Detroit. Based on this newsletter intro, suggest 5 subject line options for the email.

INTRO:
${introText}

GUIDELINES:
- Each should be under 60 characters
- Include an emoji at the start of each one (vary the emoji — use relevant ones like 🌊 💧 🌿 🏭 ⚡ 🌍 📣 🔬 etc.)
- Make them compelling and specific — not generic
- Mix styles: one question, one with a number/stat, one punchy, one curiosity-gap, one straightforward

Return ONLY the 5 subject lines, one per line, numbered 1-5.`,
        },
      ],
    });

    const subjectLines =
      subjectMessage.content[0].type === "text"
        ? subjectMessage.content[0].text
        : "";

    return NextResponse.json({
      intro: introText,
      subjectLines: subjectLines
        .split("\n")
        .filter((line: string) => line.trim())
        .map((line: string) => line.replace(/^\d+\.\s*/, "").trim()),
    });
  } catch (error) {
    console.error("Intro generation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
