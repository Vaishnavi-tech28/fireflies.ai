import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface Ctx {
  params: Promise<{ id: string }>;
}

// POST /api/meetings/[id]/ask
// "Ask a question about this meeting" — LLM-powered Q&A over the transcript.
// Body: { question: string, history?: {role, content}[] }
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const question = (body.question || "").toString().trim();
  if (!question) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  const meeting = await db.meeting.findUnique({
    where: { id },
    select: {
      title: true,
      meetingType: true,
      date: true,
      summary: { select: { overview: true, keyPoints: true, decisions: true } },
      segments: {
        orderBy: { startTime: "asc" },
        select: {
          startTime: true,
          speaker: { select: { name: true } },
          text: true,
        },
      },
    },
  });
  if (!meeting) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const transcript = meeting.segments
    .map(
      (s) =>
        `[${fmtTime(s.startTime)}] ${s.speaker.name}: ${s.text}`,
    )
    .join("\n");

  let summaryContext = "";
  if (meeting.summary) {
    summaryContext = `\n\nExisting AI summary:\nOverview: ${meeting.summary.overview}\nKey points: ${meeting.summary.keyPoints}\nDecisions: ${meeting.summary.decisions}`;
  }

  const systemPrompt = `You are the Fireflies meeting assistant. Answer the user's question based ONLY on the transcript of the meeting titled "${meeting.title}" (a ${meeting.meetingType} on ${new Date(meeting.date).toLocaleDateString()}). Cite timestamps like [m:ss] when they support your answer. If the answer isn't in the transcript, say so briefly. Keep answers concise (2-5 sentences unless the question asks for detail).${summaryContext}

Full transcript:
${transcript}`;

  let answer: string;
  try {
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();
    const messages: { role: "assistant" | "user"; content: string }[] = [
      { role: "assistant", content: systemPrompt },
    ];
    if (Array.isArray(body.history)) {
      for (const m of body.history) {
        if (m && (m.role === "user" || m.role === "assistant") && m.content) {
          messages.push({ role: m.role, content: String(m.content) });
        }
      }
    }
    messages.push({ role: "user", content: question });
    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: "disabled" },
    });
    answer = completion.choices?.[0]?.message?.content || "";
  } catch (e: any) {
    return NextResponse.json(
      { error: "LLM request failed: " + (e?.message || "unknown") },
      { status: 500 },
    );
  }

  return NextResponse.json({ answer });
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
