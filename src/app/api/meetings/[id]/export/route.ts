import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { formatVttTime } from "@/lib/fireflies/format";

interface Ctx {
  params: Promise<{ id: string }>;
}

// GET /api/meetings/[id]/export?format=txt|md|vtt
export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const format = req.nextUrl.searchParams.get("format") || "txt";

  const meeting = await db.meeting.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      date: true,
      durationSec: true,
      meetingType: true,
      participants: {
        select: {
          role: true,
          person: { select: { name: true, title: true } },
        },
      },
      segments: {
        orderBy: { startTime: "asc" },
        select: {
          startTime: true,
          endTime: true,
          text: true,
          speaker: { select: { name: true } },
        },
      },
      summary: {
        select: { overview: true, keyPoints: true, decisions: true },
      },
      actionItems: {
        select: {
          text: true,
          assignee: true,
          priority: true,
          completed: true,
        },
      },
      topics: {
        orderBy: { startTime: "asc" },
        select: { name: true, startTime: true, summary: true },
      },
    },
  });

  if (!meeting) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m.toString().padStart(2, "0")}:${sec
      .toString()
      .padStart(2, "0")}`;
  };

  if (format === "vtt") {
    let out = "WEBVTT\n\n";
    for (const seg of meeting.segments) {
      out += `${formatVttTime(seg.startTime)} --> ${formatVttTime(
        seg.endTime,
      )}\n<v ${seg.speaker.name}>${seg.text}\n\n`;
    }
    return new NextResponse(out, {
      headers: {
        "Content-Type": "text/vtt; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slug(
          meeting.title,
        )}.vtt"`,
      },
    });
  }

  if (format === "md") {
    let out = `# ${meeting.title}\n\n`;
    out += `- **Date:** ${new Date(meeting.date).toLocaleString()}\n`;
    out += `- **Duration:** ${Math.floor(meeting.durationSec / 60)}m\n`;
    out += `- **Type:** ${meeting.meetingType}\n`;
    out += `- **Participants:** ${meeting.participants
      .map((p) => p.person.name + (p.role ? ` (${p.role})` : ""))
      .join(", ")}\n\n`;
    if (meeting.summary) {
      out += `## Summary\n\n${meeting.summary.overview}\n\n`;
      const kp = safeJson(meeting.summary.keyPoints, []);
      const dec = safeJson(meeting.summary.decisions, []);
      if (kp.length) {
        out += `### Key Points\n`;
        for (const k of kp) out += `- ${k}\n`;
        out += `\n`;
      }
      if (dec.length) {
        out += `### Decisions\n`;
        for (const d of dec) out += `- ${d}\n`;
        out += `\n`;
      }
    }
    if (meeting.actionItems.length) {
      out += `## Action Items\n`;
      for (const a of meeting.actionItems) {
        out += `- [${a.completed ? "x" : " "}] ${a.text}${
          a.assignee ? ` — _${a.assignee}_` : ""
        }${a.priority ? ` (${a.priority})` : ""}\n`;
      }
      out += `\n`;
    }
    if (meeting.topics.length) {
      out += `## Topics\n`;
      for (const t of meeting.topics) {
        out += `- **${t.name}** (${fmtTime(t.startTime)})${
          t.summary ? ` — ${t.summary}` : ""
        }\n`;
      }
      out += `\n`;
    }
    out += `## Transcript\n\n`;
    for (const seg of meeting.segments) {
      out += `**${seg.speaker.name}** [${fmtTime(seg.startTime)}]\n${seg.text}\n\n`;
    }
    return new NextResponse(out, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slug(
          meeting.title,
        )}.md"`,
      },
    });
  }

  // default: txt
  let out = `${meeting.title}\n${new Date(
    meeting.date,
  ).toLocaleString()} · ${Math.floor(meeting.durationSec / 60)}m · ${
    meeting.meetingType
  }\n`;
  out += `Participants: ${meeting.participants
    .map((p) => p.person.name)
    .join(", ")}\n\n`;
  if (meeting.summary) {
    out += `=== SUMMARY ===\n${meeting.summary.overview}\n\n`;
  }
  if (meeting.actionItems.length) {
    out += `=== ACTION ITEMS ===\n`;
    for (const a of meeting.actionItems) {
      out += `[${a.completed ? "x" : " "}] ${a.text}${
        a.assignee ? ` (${a.assignee})` : ""
      }\n`;
    }
    out += `\n`;
  }
  out += `=== TRANSCRIPT ===\n`;
  for (const seg of meeting.segments) {
    out += `[${fmtTime(seg.startTime)}] ${seg.speaker.name}: ${seg.text}\n`;
  }
  return new NextResponse(out, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug(
        meeting.title,
      )}.txt"`,
    },
  });
}

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
function safeJson(s: string | null, fallback: any) {
  if (!s) return fallback;
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}
