import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface Ctx {
  params: Promise<{ id: string }>;
}

// POST /api/meetings/[id]/summary/regenerate
// Uses the LLM (z-ai-web-dev-sdk) to generate a fresh summary,
// key points, and decisions from the transcript text.
export async function POST(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;

  const meeting = await db.meeting.findUnique({
    where: { id },
    select: {
      title: true,
      meetingType: true,
      segments: {
        orderBy: { startTime: "asc" },
        select: { startTime: true, speaker: { select: { name: true } }, text: true },
      },
    },
  });
  if (!meeting) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (meeting.segments.length === 0) {
    return NextResponse.json(
      { error: "This meeting has no transcript to summarize." },
      { status: 400 },
    );
  }

  // Build the transcript context for the model.
  const transcriptText = meeting.segments
    .map(
      (s) =>
        `[${fmtTime(s.startTime)}] ${s.speaker.name}: ${s.text}`,
    )
    .join("\n");

  const prompt = `You are an expert meeting assistant (like Fireflies.ai).
Below is the full transcript of a meeting titled "${meeting.title}" (${meeting.meetingType}).
Produce a structured summary as JSON with exactly these keys:
- "overview": a 4-8 sentence executive overview written in clear prose.
- "keyPoints": an array of 5-8 concise strings, each a single important point.
- "decisions": an array of 3-6 concise strings, each a concrete decision that was made.

Respond with ONLY the JSON object. Do not wrap it in markdown fences.

TRANSCRIPT:
${transcriptText}`;

  let json: { overview: string; keyPoints: string[]; decisions: string[] };
  try {
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: "You are a meticulous meeting summarizer." },
        { role: "user", content: prompt },
      ],
      thinking: { type: "disabled" },
    });
    const raw = completion.choices?.[0]?.message?.content || "";
    json = parseSummaryJson(raw);
  } catch (e: any) {
    return NextResponse.json(
      { error: "LLM summarization failed: " + (e?.message || "unknown") },
      { status: 500 },
    );
  }

  const summary = await db.summary.upsert({
    where: { meetingId: id },
    update: {
      overview: json.overview,
      keyPoints: JSON.stringify(json.keyPoints),
      decisions: JSON.stringify(json.decisions),
    },
    create: {
      meetingId: id,
      overview: json.overview,
      keyPoints: JSON.stringify(json.keyPoints),
      decisions: JSON.stringify(json.decisions),
    },
  });

  return NextResponse.json({
    id: summary.id,
    overview: json.overview,
    keyPoints: json.keyPoints,
    decisions: json.decisions,
  });
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function parseSummaryJson(raw: string): {
  overview: string;
  keyPoints: string[];
  decisions: string[];
} {
  // Strip ```json fences if present
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  // Try a direct parse first
  try {
    const obj = JSON.parse(s);
    return normalize(obj);
  } catch {
    // fall through to extraction
  }
  // Fallback: grab the first {...} block
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      const obj = JSON.parse(s.slice(start, end + 1));
      return normalize(obj);
    } catch {
      // ignore
    }
  }
  return {
    overview: s.slice(0, 600),
    keyPoints: [],
    decisions: [],
  };
}

function normalize(obj: any) {
  return {
    overview: String(obj.overview || obj.summary || "").trim(),
    keyPoints: Array.isArray(obj.keyPoints)
      ? obj.keyPoints.map((x: any) => String(x)).filter(Boolean)
      : Array.isArray(obj.key_points)
        ? obj.key_points.map((x: any) => String(x)).filter(Boolean)
        : [],
    decisions: Array.isArray(obj.decisions)
      ? obj.decisions.map((x: any) => String(x)).filter(Boolean)
      : [],
  };
}
