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
        { error: "Please provide job listing text to parse" },
        { status: 400 }
      );
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `You are an editor at Planet Detroit, a nonprofit environmental news outlet. Parse the following pasted text into structured job listings for the newsletter.

For each job, create a JSON object with:
- "title": The job title
- "organization": The hiring organization name
- "description": A 1-sentence description (under 150 chars) if available, or empty string
- "url": The job posting URL if present, or empty string

Return ONLY a valid JSON array. No markdown, no code fences, no extra text.

Example output:
[{"title":"Environmental Quality Analyst","organization":"Michigan Dept. of Environment","description":"Analyze environmental data and prepare regulatory compliance reports.","url":"https://example.com/job1"},{"title":"Staff Attorney — Water Policy","organization":"Great Lakes Environmental Law Center","description":"Represent communities in environmental justice cases.","url":"https://example.com/job2"}]

HERE IS THE TEXT TO PARSE:
${input.slice(0, 5000)}

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

    let jobs;
    try {
      jobs = JSON.parse(jsonStr);
    } catch {
      const arrayMatch = responseText.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        jobs = JSON.parse(arrayMatch[0]);
      } else {
        throw new Error("Could not parse AI response as JSON");
      }
    }

    if (!Array.isArray(jobs)) {
      throw new Error("Expected an array of jobs");
    }

    const normalized = jobs.map(
      (
        j: {
          title?: string;
          organization?: string;
          description?: string;
          url?: string;
        },
        i: number
      ) => ({
        id: `job-${Date.now()}-${i}`,
        title: (j.title || "Untitled").trim(),
        organization: (j.organization || "").trim(),
        description: (j.description || "").trim(),
        url: (j.url || "").trim(),
        datePosted: new Date().toISOString().slice(0, 10),
        selected: false,
        featured: false,
        partnerTier: null,
      })
    );

    return NextResponse.json({ jobs: normalized });
  } catch (error) {
    console.error("Job parsing error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
