import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json();

    if (!input || typeof input !== "string" || !input.trim()) {
      return NextResponse.json(
        { error: "Please provide event data to parse" },
        { status: 400 }
      );
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `You are an editor at Planet Detroit, a nonprofit environmental news outlet in Metro Detroit. Parse the following pasted text into structured event listings for the newsletter.

The input may be CSV data, pasted text from CitySpark, email text, or any other format with event information.

For each event, create a JSON object with:
- "title": The event name
- "date": The event date in YYYY-MM-DD format (use current year 2026 if year is not specified)
- "time": The event time range (e.g., "6:00 PM - 8:00 PM"), or empty string if not available
- "location": The venue and city (e.g., "Eastern Market, Detroit"), or empty string
- "url": The event URL if present, or empty string
- "source": The source (e.g., "CitySpark", "Community", etc.), default to "CitySpark" if unclear

Return ONLY a valid JSON array. No markdown, no code fences, no extra text.

Example output:
[{"title":"Detroit River Cleanup Volunteer Day","date":"2026-02-14","time":"9:00 AM - 1:00 PM","location":"Riverside Park, Detroit","url":"https://example.com/cleanup","source":"CitySpark"},{"title":"Great Lakes Water Policy Town Hall","date":"2026-02-18","time":"6:30 PM - 8:30 PM","location":"Wayne State University, Detroit","url":"","source":"CitySpark"}]

HERE IS THE TEXT TO PARSE:
${input.slice(0, 8000)}

Return the JSON array now:`,
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

    let events;
    try {
      events = JSON.parse(jsonStr);
    } catch {
      const arrayMatch = responseText.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        events = JSON.parse(arrayMatch[0]);
      } else {
        throw new Error("Could not parse AI response as JSON");
      }
    }

    if (!Array.isArray(events)) {
      throw new Error("Expected an array of events");
    }

    const normalized = events.map(
      (
        e: {
          title?: string;
          date?: string;
          time?: string;
          location?: string;
          url?: string;
          source?: string;
        },
        i: number
      ) => ({
        id: `evt-${Date.now()}-${i}`,
        title: (e.title || "Untitled Event").trim(),
        date: (e.date || "").trim(),
        time: (e.time || "").trim(),
        location: (e.location || "").trim(),
        url: (e.url || "").trim(),
        source: (e.source || "CitySpark").trim(),
        selected: false,
      })
    );

    return NextResponse.json({ events: normalized });
  } catch (error) {
    console.error("Event parsing error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
