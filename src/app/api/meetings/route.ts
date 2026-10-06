import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { meetingSummarySelect } from "@/lib/fireflies/queries";

// GET /api/meetings — list + search + filter + sort
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const sort = url.searchParams.get("sort") || "recent";
  const type = url.searchParams.get("type");
  const tag = url.searchParams.get("tag");
  const participant = (url.searchParams.get("participant") || "")
    .trim()
    .toLowerCase();

  const meetings = await db.meeting.findMany({
    select: meetingSummarySelect,
    orderBy: { date: "desc" },
  });

  let filtered = meetings.filter((m) => {
    if (
      q &&
      !m.title.toLowerCase().includes(q) &&
      !m.participants.some((p) =>
        p.person.name.toLowerCase().includes(q),
      ) &&
      !(m.organizer?.name || "").toLowerCase().includes(q)
    ) {
      return false;
    }
    if (type && m.meetingType !== type) return false;
    if (tag && !m.tags.some((t) => t.tag.name === tag)) return false;
    if (
      participant &&
      !m.participants.some((p) =>
        p.person.name.toLowerCase().includes(participant),
      )
    ) {
      return false;
    }
    return true;
  });

  switch (sort) {
    case "oldest":
      filtered = [...filtered].sort(
        (a, b) => a.date.getTime() - b.date.getTime(),
      );
      break;
    case "longest":
      filtered = [...filtered].sort(
        (a, b) => b.durationSec - a.durationSec,
      );
      break;
    case "shortest":
      filtered = [...filtered].sort(
        (a, b) => a.durationSec - b.durationSec,
      );
      break;
    case "az":
      filtered = [...filtered].sort((a, b) =>
        a.title.localeCompare(b.title),
      );
      break;
    case "recent":
    default:
      filtered = [...filtered].sort(
        (a, b) => b.date.getTime() - a.date.getTime(),
      );
      break;
  }

  return NextResponse.json({ meetings: filtered });
}

// POST /api/meetings — create a meeting
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const title = (body.title || "").toString().trim();
  if (!title) {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 },
    );
  }

  const date = body.date ? new Date(body.date) : new Date();
  const meetingType = (body.meetingType || "Internal Call").toString();
  const notes = body.notes ? body.notes.toString() : null;
  const participantNames: string[] = Array.isArray(body.participants)
    ? body.participants
    : [];

  const people = await Promise.all(
    participantNames.map(async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      const email = `${trimmed
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ".")}@imported.local`;
      return db.person.upsert({
        where: { email },
        update: { name: trimmed },
        create: { name: trimmed, email },
      });
    }),
  );

  type SegIn = { speaker: string; start: number; end: number; text: string };
  let segmentsIn: SegIn[] = [];
  if (Array.isArray(body.segments)) {
    segmentsIn = body.segments.map((s: any) => ({
      speaker: (s.speaker || "Speaker").toString(),
      start: Number(s.start) || 0,
      end: Number(s.end) || Number(s.start) || 0,
      text: (s.text || "").toString(),
    }));
  } else if (typeof body.vtt === "string") {
    segmentsIn = parseVtt(body.vtt);
  } else if (typeof body.transcriptText === "string") {
    segmentsIn = parseTranscriptText(body.transcriptText);
  }

  const lastEnd =
    segmentsIn.length > 0
      ? segmentsIn.reduce((m, s) => Math.max(m, s.end), 0)
      : Math.max(60, Number(body.durationSec) || 600);

  const meeting = await db.meeting.create({
    data: {
      title,
      date,
      durationSec: lastEnd,
      meetingType,
      notes,
      source: body.source || "upload",
      status: "completed",
      participants: {
        create: people
          .filter(Boolean)
          .map((p, i) => ({
            personId: (p as any)!.id,
            role: i === 0 ? "host" : null,
          })),
      },
    },
  });

  if (segmentsIn.length > 0) {
    const speakerNames = Array.from(
      new Set(segmentsIn.map((s) => s.speaker)),
    );
    const speakerPeople = await Promise.all(
      speakerNames.map(async (name) => {
        const email = `${name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, ".")}@imported.local`;
        return db.person.upsert({
          where: { email },
          update: {},
          create: { name, email },
        });
      }),
    );
    const speakerMap: Record<string, string> = {};
    speakerNames.forEach((n, i) => {
      speakerMap[n] = speakerPeople[i].id;
    });
    await db.meetingParticipant.createMany({
      data: speakerNames.map((n) => ({
        meetingId: meeting.id,
        personId: speakerMap[n],
      })),
      skipDuplicates: true,
    });
    await db.transcriptSegment.createMany({
      data: segmentsIn.map((s) => ({
        meetingId: meeting.id,
        speakerId: speakerMap[s.speaker],
        startTime: Math.round(s.start),
        endTime: Math.round(s.end),
        text: s.text,
      })),
    });
  }

  return NextResponse.json({ id: meeting.id }, { status: 201 });
}

function parseVtt(vtt: string): {
  speaker: string;
  start: number;
  end: number;
  text: string;
}[] {
  const lines = vtt.replace(/\r/g, "").split("\n");
  const out: { speaker: string; start: number; end: number; text: string }[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const m = line.match(
      /(\d{2}):(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[.,](\d{3})/,
    );
    if (m) {
      const start =
        Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4]) / 1000;
      const end =
        Number(m[5]) * 3600 + Number(m[6]) * 60 + Number(m[7]) + Number(m[8]) / 1000;
      i++;
      let text = "";
      while (i < lines.length && lines[i].trim() !== "") {
        text += (text ? " " : "") + lines[i];
        i++;
      }
      const sm = text.match(/^<v\s+([^>]+)>(.*)$/i);
      const speaker = sm ? sm[1].trim() : "Speaker";
      const cleanText = text
        .replace(/^<v\s+[^>]+>/i, "")
        .replace(/<\/v>$/i, "");
      out.push({ speaker, start, end, text: cleanText || text });
    }
    i++;
  }
  return out;
}

function parseTranscriptText(raw: string): {
  speaker: string;
  start: number;
  end: number;
  text: string;
}[] {
  const lines = raw
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const out: { speaker: string; start: number; end: number; text: string }[] = [];
  let t = 0;
  for (const line of lines) {
    const m = line.match(/^([^:]+):\s*(.*)$/);
    const speaker = m ? m[1].trim() : "Speaker";
    const text = m ? m[2] : line;
    const start = t;
    const end = t + Math.max(4, Math.ceil(text.length / 15));
    t = end + 1;
    out.push({ speaker, start, end, text });
  }
  return out;
}
