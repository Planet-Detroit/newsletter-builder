import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/** Attempt to fetch a URL and extract readable text */
async function fetchPageText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PlanetDetroitBot/1.0; +https://planetdetroit.org)",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return `[Could not fetch: HTTP ${res.status}]`;
    const html = await res.text();

    // Strip HTML tags, scripts, styles — extract readable text
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#\d+;/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // Return first ~3000 chars (enough context for a summary)
    return text.slice(0, 3000);
  } catch {
    return `[Could not fetch this URL]`;
  }
}

/** Extract URLs from user input text */
function extractUrls(input: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"']+/g;
  const matches = input.match(urlRegex) || [];
  // Clean trailing punctuation
  return matches.map((u) => u.replace(/[).,;:!?]+$/, ""));
}

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json();

    if (!input || typeof input !== "string" || !input.trim()) {
      return NextResponse.json(
        { error: "Please provide URLs or article text" },
        { status: 400 }
      );
    }

    // Extract URLs and fetch page content
    const urls = extractUrls(input);
    let articleContext = "";

    if (urls.length > 0) {
      // Fetch each URL's content in parallel
      const fetchResults = await Promise.allSettled(
        urls.map(async (url) => {
          const text = await fetchPageText(url);
          return { url, text };
        })
      );

      const articles = fetchResults
        .filter(
          (r): r is PromiseFulfilledResult<{ url: string; text: string }> =>
            r.status === "fulfilled"
        )
        .map((r) => r.value);

      articleContext = articles
        .map(
          (a, i) =>
            `ARTICLE ${i + 1}:\nURL: ${a.url}\nCONTENT: ${a.text}\n`
        )
        .join("\n---\n");
    } else {
      // No URLs found — treat the whole input as article text / notes
      articleContext = `USER-PROVIDED TEXT:\n${input}`;
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `You are an editor at Planet Detroit, a nonprofit environmental news outlet in Metro Detroit. Generate newsletter briefs for the "What We're Reading" section.

For each article, create a JSON object with:
- "headline": Start with a single relevant emoji, then a concise, engaging headline (5-12 words). Do NOT just copy the original headline — write a fresh one that captures the key takeaway. Example: "🏭 PFAS Cleanup Costs Surge Across Michigan"
- "summary": A 1-2 sentence summary explaining why this matters for Metro Detroit / Michigan / Great Lakes readers. Keep it under 200 characters.
- "source": The publication name (e.g., "Detroit Free Press", "MLive", "Bridge Michigan")
- "url": The article URL (if provided)

Return ONLY a valid JSON array. No markdown, no code fences, no extra text.

Example output:
[{"headline":"🏭 PFAS Cleanup Costs Surge Across Michigan","summary":"New state estimates show contamination remediation will cost billions more than projected, with Southeast Michigan sites among the most expensive.","source":"Bridge Michigan","url":"https://example.com/article"},{"headline":"🐟 Detroit River Fish Populations Rebound","summary":"Annual survey finds walleye and bass numbers at highest levels in a decade, signaling improving water quality downstream of treatment upgrades.","source":"Detroit Free Press","url":"https://example.com/article2"}]

HERE ARE THE ARTICLES TO SUMMARIZE:
${articleContext}

Return the JSON array now:`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse the JSON response — handle potential markdown fences
    const jsonStr = responseText
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    let stories;
    try {
      stories = JSON.parse(jsonStr);
    } catch {
      // Try to extract JSON array from the response
      const arrayMatch = responseText.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        stories = JSON.parse(arrayMatch[0]);
      } else {
        throw new Error("Could not parse AI response as JSON");
      }
    }

    if (!Array.isArray(stories)) {
      throw new Error("Expected an array of stories");
    }

    // Normalize and validate each story
    const normalized = stories.map(
      (
        s: {
          headline?: string;
          summary?: string;
          source?: string;
          url?: string;
        },
        i: number
      ) => ({
        id: `curated-${Date.now()}-${i}`,
        headline: (s.headline || "Untitled").trim(),
        summary: (s.summary || "").trim(),
        source: (s.source || "").trim(),
        url: (s.url || "").trim(),
        selected: false,
      })
    );

    return NextResponse.json({ stories: normalized });
  } catch (error) {
    console.error("Curated news generation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
